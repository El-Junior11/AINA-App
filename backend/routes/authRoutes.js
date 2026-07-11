const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); 
const User = require('../models/userModel');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.post('/register', authController.register);
router.post('/login', authController.login);

// Efa nalanay ilay '/auth' teo aloha mba hifanaraka amin'ny server.js
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: ['user_id', 'name', 'email', 'role']
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Erreur getMe:", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération du profil." });
  }
});

router.put('/account/settings', authMiddleware, authController.updateProfile);

router.get('/admin/pending-users', authMiddleware, authController.getPendingUsers);

router.put('/admin/user-status/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    console.log("=== HIT INLINE ROUTE ===");
    console.log("ID reçu depuis l'URL :", id);
    console.log("Action reçue :", action);

    if (!['accepte', 'refuse'].includes(action)) {
      return res.status(400).json({ message: "Action invalide. Veuillez choisir 'accepte' ou 'refuse' uniquement." });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const [result] = await User.sequelize.query(
      `UPDATE users SET status = :status WHERE user_id = :id`,
      {
        replacements: { status: action, id: parseInt(id) },
        type: User.sequelize.QueryTypes.UPDATE
      }
    );

    console.log("Mise à jour réussie dans PostgreSQL via requête directe.");
    console.log("========================");

    const mailOptions = {
      from: `"Tsinjo Aina" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: action === 'accepte' ? 'Validation de votre compte' : 'Refus de votre inscription',
      html: action === 'accepte' 
        ? `<div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Bonjour ${user.name},</h2>
            <p>Félicitations ! Votre compte sur l'application de l'ONG TSINJO AINA Fianarantsoa a été validé par l'administrateur.</p>
            <p>Vous pouvez maintenant vous connecter à votre espace en toute sécurité.</p>
            <br/><p>Cordialement,<br/>L'équipe</p>
           </div>`
        : `<div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Bonjour ${user.name},</h2>
            <p>Désolé, votre demande d'inscription sur l'application de l'ONG TSINJO AINA Fianarantsoa a été refusée après examen de l'administrateur.</p>
            <p>Si vous pensez qu'il s'agit d'une erreur, veuillez nous contacter.</p>
            <br/><p>Cordialement,<br/>L'équipe</p>
           </div>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erreur d'envoi d'email :", error);
      } else {
        console.log("Email envoyé avec succès :", info.response);
      }
    });

    return res.status(200).json({ 
      message: `L'utilisateur a été ${action === 'accepte' ? 'accepté' : 'refusé'} avec succès.` 
    });

  } catch (err) {
    console.error("Erreur inline user-status:", err);
    return res.status(500).json({ message: "Erreur serveur lors du traitement du statut." });
  }
});

module.exports = router;