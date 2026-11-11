const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('../models/userModel');

exports.getUsers = async (req, res) => {
  try {
    const users = await sequelize.query(
      `SELECT u.user_id, u.name, u.email, u.role, u.status, u.commune_id,
              c.nom_commune
       FROM users u
       LEFT JOIN communes c ON c.id_commune = u.commune_id
       ORDER BY u.user_id DESC`,
      { type: QueryTypes.SELECT }
    );
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error.message);
    return res.status(500).json({ message: 'Impossible de récupérer les utilisateurs.' });
  }
};

exports.updateUserCommune = async (req, res) => {
  let transaction;

  try {
    const userId = Number(req.params.id);
    const communeId = Number(req.body.commune_id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Identifiant utilisateur invalide.' });
    }

    if (!Number.isInteger(communeId) || communeId <= 0) {
      return res.status(400).json({ message: 'Veuillez sélectionner une commune valide.' });
    }

    transaction = await sequelize.transaction();

    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    if (user.role !== 'user' || user.status !== 'accepte') {
      await transaction.rollback();
      return res.status(403).json({ message: "Seul un SO actif peut changer de commune." });
    }

    if (Number(user.commune_id) === communeId) {
      await transaction.rollback();
      return res.status(200).json({ message: 'Aucune modification nécessaire.' });
    }

    const communes = await sequelize.query(
      `SELECT id_commune FROM communes WHERE id_commune = :communeId`,
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
      where: { role: 'user', commune_id: communeId },
      transaction
    });

    if (existingSO) {
      await transaction.rollback();
      return res.status(409).json({ message: 'Cette commune possède déjà un SO.' });
    }

    const tables = ['membres', 'groupes', 'reseaux', 'responsables', 'formations'];
    const existingTables = await sequelize.query(
      `SELECT table_name
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND column_name = 'user_id'
         AND table_name IN (:tables)`,
      {
        replacements: { tables },
        type: QueryTypes.SELECT,
        transaction
      }
    );

    for (const { table_name } of existingTables) {
      const [result] = await sequelize.query(
        `SELECT EXISTS(
           SELECT 1 FROM "${table_name}" WHERE user_id = :userId
         ) AS has_data`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
          transaction
        }
      );

      if (result.has_data) {
        await transaction.rollback();
        return res.status(409).json({
          message: "Cet utilisateur possède déjà des données. Son affectation ne peut pas être modifiée automatiquement."
        });
      }
    }

    user.commune_id = communeId;
    await user.save({ transaction });
    await transaction.commit();

    return res.status(200).json({
      message: 'Commune attribuée avec succès.',
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

    console.error('Erreur modification commune:', error.message);

    if (error.name === 'SequelizeUniqueConstraintError' || error.parent?.code === '23505') {
      return res.status(409).json({ message: 'Cette commune possède déjà un SO.' });
    }

    return res.status(500).json({ message: "Erreur lors de la modification de l'affectation." });
  }
};