const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');
const User = require('../models/userModel');
const nodemailer = require('nodemailer');
const { QueryTypes } = require('sequelize');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);

router.get('/me', authMiddleware, authController.getMe);
router.put('/account/settings', authMiddleware, authController.updateProfile);

router.get('/admin/pending-users', authMiddleware, authorizeRoles('admin'), authController.getPendingUsers);

router.get('/admin/communes', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const communes = await User.sequelize.query(
      `SELECT id_commune AS id, nom_commune AS nom
       FROM communes
       ORDER BY nom_commune ASC`,
      { type: QueryTypes.SELECT }
    );
    return res.status(200).json(communes);
  } catch (error) {
    console.error('Erreur récupération communes:', error.message);
    return res.status(500).json({ message: 'Erreur lors de la récupération des communes.' });
  }
});

router.put('/admin/user-status/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  let transaction;

  try {
    const userId = Number(req.params.id);
    const { action, role, commune_id } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Identifiant utilisateur invalide.' });
    }

    if (!['accepte', 'refuse'].includes(action)) {
      return res.status(400).json({ message: 'Action invalide.' });
    }

    transaction = await User.sequelize.transaction();

    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    if (user.status !== 'en_attente') {
      await transaction.rollback();
      return res.status(409).json({ message: 'Cette demande a déjà été traitée.' });
    }

    let assignedRole = 'user';
    let assignedCommune = null;

    if (action === 'accepte') {
      if (!['admin', 'user'].includes(role)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Veuillez sélectionner un rôle valide.' });
      }

      assignedRole = role;

      if (role === 'user') {
        const communeId = Number(commune_id);

        if (!Number.isInteger(communeId) || communeId <= 0) {
          await transaction.rollback();
          return res.status(400).json({ message: 'Veuillez sélectionner une commune valide.' });
        }

        const communes = await User.sequelize.query(
          `SELECT id_commune
           FROM communes
           WHERE id_commune = :communeId`,
          {
            replacements: { communeId },
            type: QueryTypes.SELECT,
            transaction
          }
        );

        if (communes.length === 0) {
          await transaction.rollback();
          return res.status(404).json({ message: 'Commune introuvable.' });
        }

        const existingSO = await User.findOne({
          where: {
            role: 'user',
            commune_id: communeId,
            status: 'accepte'
          },
          transaction
        });

        if (existingSO) {
          await transaction.rollback();
          return res.status(409).json({ message: 'Cette commune possède déjà un SO.' });
        }

        assignedCommune = communeId;
      }

      user.role = assignedRole;
      user.commune_id = assignedCommune;
      user.status = 'accepte';
    }

    if (action === 'refuse') {
      user.status = 'refuse';
      user.role = 'user';
      user.commune_id = null;
    }

    await user.save({ transaction });
    await transaction.commit();

    const accepted = action === 'accepte';

    const mailOptions = {
      from: `"ONG TSINJO AINA" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: accepted ? 'Validation de votre compte' : 'Refus de votre inscription',
      text: accepted
        ? `Bonjour ${user.name},

Votre compte sur l'application ONG TSINJO AINA a été validé.

Rôle attribué : ${assignedRole === 'admin' ? 'Administrateur' : 'SO'}

Vous pouvez maintenant vous connecter.

Cordialement,
ONG TSINJO AINA`
        : `Bonjour ${user.name},

Votre demande d'inscription sur l'application ONG TSINJO AINA a été refusée.

Pour plus d'informations, veuillez contacter l'administrateur.

Cordialement,
ONG TSINJO AINA`
    };

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter.sendMail(mailOptions).catch(error => {
        console.error('Erreur notification email:', error.message);
      });
    }

    return res.status(200).json({
      message: accepted ? 'Utilisateur accepté avec succès.' : 'Inscription refusée avec succès.',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        commune_id: user.commune_id,
        status: user.status
      }
    });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();

    console.error('Erreur validation utilisateur:', error.message);

    if (error.name === 'SequelizeUniqueConstraintError' || error.parent?.code === '23505') {
      return res.status(409).json({ message: 'Cette commune possède déjà un SO.' });
    }

    return res.status(500).json({ message: 'Erreur serveur lors de la validation.' });
  }
});

module.exports = router;