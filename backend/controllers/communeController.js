const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

const normalizeName = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';

const getCommunes = async (req, res) => {
  try {
    const communes = await sequelize.query(`
      SELECT
        c.id_commune,
        c.nom_commune,
        c.dernier_numero_menage,
        c.created_at,
        c.updated_at,
        u.user_id AS so_id,
        u.name AS so_name,
        u.email AS so_email,
        u.status AS so_status,
        (SELECT COUNT(*) FROM membres m WHERE m.commune_id = c.id_commune)::int AS total_membres,
        (SELECT COUNT(*) FROM menages mg WHERE mg.commune_id = c.id_commune)::int AS total_menages,
        (SELECT COUNT(*) FROM groupes g WHERE g.commune_id = c.id_commune)::int AS total_groupes
      FROM communes c
      LEFT JOIN users u ON u.commune_id = c.id_commune AND u.role = 'user'
      ORDER BY c.nom_commune ASC
    `, { type: QueryTypes.SELECT });

    return res.status(200).json({ success: true, communes });
  } catch (error) {
    console.error('Erreur getCommunes :', error);
    return res.status(500).json({ success: false, message: 'Impossible de charger les communes.' });
  }
};

const getCommuneById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Identifiant de commune invalide.' });
    }

    const communes = await sequelize.query(`
      SELECT
        c.id_commune,
        c.nom_commune,
        c.dernier_numero_menage,
        c.created_at,
        c.updated_at,
        u.user_id AS so_id,
        u.name AS so_name,
        u.email AS so_email,
        u.status AS so_status,
        (SELECT COUNT(*) FROM membres m WHERE m.commune_id = c.id_commune)::int AS total_membres,
        (SELECT COUNT(*) FROM menages mg WHERE mg.commune_id = c.id_commune)::int AS total_menages,
        (SELECT COUNT(*) FROM groupes g WHERE g.commune_id = c.id_commune)::int AS total_groupes
      FROM communes c
      LEFT JOIN users u ON u.commune_id = c.id_commune AND u.role = 'user'
      WHERE c.id_commune = :id
    `, { replacements: { id }, type: QueryTypes.SELECT });

    if (!communes.length) {
      return res.status(404).json({ success: false, message: 'Commune introuvable.' });
    }

    return res.status(200).json({ success: true, commune: communes[0] });
  } catch (error) {
    console.error('Erreur getCommuneById :', error);
    return res.status(500).json({ success: false, message: 'Impossible de charger cette commune.' });
  }
};

const createCommune = async (req, res) => {
  try {
    const nom_commune = normalizeName(req.body?.nom_commune);

    if (nom_commune.length < 2 || nom_commune.length > 255) {
      return res.status(400).json({ success: false, message: 'Le nom doit contenir entre 2 et 255 caractères.' });
    }

    const communes = await sequelize.query(`
      INSERT INTO communes (nom_commune, dernier_numero_menage, created_at, updated_at)
      VALUES (:nom_commune, 0, NOW(), NOW())
      RETURNING id_commune, nom_commune, dernier_numero_menage, created_at, updated_at
    `, { replacements: { nom_commune }, type: QueryTypes.SELECT });

    return res.status(201).json({ success: true, message: 'Commune ajoutée avec succès.', commune: communes[0] });
  } catch (error) {
    if (error.parent?.code === '23505' || error.original?.code === '23505') {
      return res.status(409).json({ success: false, message: 'Cette commune existe déjà.' });
    }

    console.error('Erreur createCommune :', error);
    return res.status(500).json({ success: false, message: 'Impossible de créer la commune.' });
  }
};

const updateCommune = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const nom_commune = normalizeName(req.body?.nom_commune);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Identifiant de commune invalide.' });
    }

    if (nom_commune.length < 2 || nom_commune.length > 255) {
      return res.status(400).json({ success: false, message: 'Le nom doit contenir entre 2 et 255 caractères.' });
    }

    const communes = await sequelize.query(`
      UPDATE communes
      SET nom_commune = :nom_commune, updated_at = NOW()
      WHERE id_commune = :id
      RETURNING id_commune, nom_commune, dernier_numero_menage, created_at, updated_at
    `, { replacements: { id, nom_commune }, type: QueryTypes.SELECT });

    if (!communes.length) {
      return res.status(404).json({ success: false, message: 'Commune introuvable.' });
    }

    return res.status(200).json({ success: true, message: 'Commune modifiée avec succès.', commune: communes[0] });
  } catch (error) {
    if (error.parent?.code === '23505' || error.original?.code === '23505') {
      return res.status(409).json({ success: false, message: 'Cette commune existe déjà.' });
    }

    console.error('Erreur updateCommune :', error);
    return res.status(500).json({ success: false, message: 'Impossible de modifier la commune.' });
  }
};

module.exports = { getCommunes, getCommuneById, createCommune, updateCommune };