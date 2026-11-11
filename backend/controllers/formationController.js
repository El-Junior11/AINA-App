const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const Formation = require('../models/formationModel');
const Membre = require('../models/membreModel');

const modules = ['gestionsimplifiee', 'agrosol', 'agroeco', 'agroeau', 'agrovegetaux', 'productionsemence', 'nutrition', 'nutritioneau', 'nutritionalimentaire', 'conservationproduit', 'transformationproduit', 'genre', 'epracc'];
const admin = req => req.user?.role === 'admin';
const id = v => /^\d+$/.test(String(v ?? '')) && Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;
const fail = (res, status, message) => res.status(status).json({ message });
const scope = req => admin(req) ? {} : { commune_id: req.user.commune_id };
const handle = (res, err, action) => {
  console.error(`Formation ${action}:`, err);
  return fail(res, 500, `Erreur lors de ${action}.`);
};

exports.getFormations = async (req, res) => {
  try {
    const where = scope(req);
    if (admin(req) && req.query.commune_id !== undefined) {
      const communeId = id(req.query.commune_id);
      if (!communeId) return fail(res, 400, 'Commune invalide.');
      where.commune_id = communeId;
    }

    const membres = await Membre.findAll({
      where,
      include: [{ model: Formation, as: 'formation', required: false }],
      order: [['nummembre', 'ASC']]
    });

    const data = membres.map(m => {
      const row = m.toJSON();
      if (Array.isArray(row.formation)) row.formation = row.formation.filter(f => !f.deleted_at);
      else if (row.formation?.deleted_at) row.formation = null;
      return row;
    });

    return res.json(data);
  } catch (err) { return handle(res, err, 'la récupération'); }
};

exports.saveFormation = async (req, res) => {
  try {
    const nummembre = id(req.body?.nummembre);
    if (!nummembre) return fail(res, 400, 'Numéro de membre invalide.');

    const membre = await Membre.findOne({ where: { nummembre, ...scope(req) } });
    if (!membre) return fail(res, 404, 'Membre introuvable ou accès non autorisé.');

    const data = {};
    for (const key of modules) {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] !== 'boolean') return fail(res, 400, `Valeur invalide pour ${key}.`);
        data[key] = req.body[key];
      }
    }

    if (req.body.autre !== undefined) {
      if (req.body.autre !== null && typeof req.body.autre !== 'string') return fail(res, 400, 'Champ autre invalide.');
      data.autre = req.body.autre;
    }

    if (req.body.autonomie !== undefined) {
      const autonomie = Number(req.body.autonomie);
      if (!Number.isInteger(autonomie) || autonomie < 0) return fail(res, 400, 'Autonomie invalide.');
      data.autonomie = autonomie;
    }

    const result = await sequelize.transaction(async transaction => {
      const existing = await Formation.findOne({ where: { nummembre }, transaction, lock: transaction.LOCK.UPDATE });

      if (existing) {
        await existing.update({ ...data, deleted_at: null }, { transaction });
        return { record: existing, created: false };
      }

      const record = await Formation.create({
        nummembre, user_id: req.user.user_id, ...data
      }, { transaction });

      return { record, created: true };
    });

    return res.status(result.created ? 201 : 200).json({
      message: result.created ? 'Formation créée avec succès.' : 'Formation mise à jour avec succès.',
      data: result.record
    });
  } catch (err) { return handle(res, err, "l'enregistrement"); }
};

exports.getDetailedStats = async (req, res) => {
  try {
    const communeId = admin(req) ? (req.query.commune_id === undefined ? null : id(req.query.commune_id)) : id(req.user.commune_id);
    if (admin(req) && req.query.commune_id !== undefined && !communeId) return fail(res, 400, 'Commune invalide.');
    if (!admin(req) && !communeId) return fail(res, 403, 'Commune non attribuée.');

    const names = {
      genre: 'genre', agroeco: 'agroeco', productionsemence: 'semence',
      nutrition: 'nutrition', conservationproduit: 'conservation',
      transformationproduit: 'transformation', gestionsimplifiee: 'gestion',
      epracc: 'epracc'
    };

    const columns = Object.entries(names).flatMap(([column, alias]) => [
      `COUNT(DISTINCT m.nummembre) FILTER (WHERE f.${column} = true AND LOWER(TRIM(m.sexe)) IN ('homme', 'h', 'm', 'masculin')) AS "${alias}_h"`,
      `COUNT(DISTINCT m.nummembre) FILTER (WHERE f.${column} = true AND LOWER(TRIM(m.sexe)) IN ('femme', 'f', 'feminin', 'féminin')) AS "${alias}_f"`
    ]);

    const rows = await sequelize.query(`
      SELECT ${columns.join(', ')}
      FROM formations f
      JOIN membres m ON m.nummembre = f.nummembre
      WHERE f.deleted_at IS NULL
      AND (:communeId IS NULL OR m.commune_id = :communeId)
    `, { replacements: { communeId }, type: QueryTypes.SELECT });

    return res.json(rows[0] || {});
  } catch (err) { return handle(res, err, 'la récupération des statistiques'); }
};