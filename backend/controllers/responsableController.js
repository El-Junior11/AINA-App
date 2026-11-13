const Responsable = require('../models/responsableModel');
const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');

const admin = req => req.user?.role === 'admin';
const validId = v => /^\d+$/.test(String(v ?? '')) && Number.isSafeInteger(Number(v)) && Number(v) > 0;
const error = (res, status, message) => res.status(status).json({ error: message });

const handleError = (res, err) => {
  console.error('ResponsableController:', err);
  return error(res, 500, 'Erreur interne du serveur');
};

const checkAccess = (req, res, communeId) => {
  if (!req.user) return error(res, 401, 'Non authentifié'), false;
  if (admin(req)) return true;
  if (!validId(req.user.commune_id)) return error(res, 403, 'Aucune commune attribuée'), false;
  if (Number(req.user.commune_id) !== Number(communeId)) {
    return error(res, 403, 'Commune non autorisée'), false;
  }
  return true;
};

const normalizePoste = poste => {
  const value = String(poste ?? 'Membre').trim();
  return !value || ['membre', 'membres', 'aucun poste'].includes(value.toLowerCase()) ? 'Membre' : value;
};

const getMemberInGroup = async (NumMembre, codegs, transaction) => {
  const rows = await sequelize.query(`
    SELECT m.nummembre, m.commune_id, g.user_id
    FROM membres m
    JOIN groupe_menages gm ON gm.id_menage = m.id_menage
    JOIN groupes g ON g.codegs = gm.codegs
    WHERE m.nummembre = :NumMembre
      AND gm.codegs = :codegs
      AND m.commune_id = g.commune_id
    LIMIT 1
  `, { replacements: { NumMembre, codegs }, type: QueryTypes.SELECT, transaction });

  return rows[0] || null;
};

const savePoste = async (req, NumMembre, codegs, Poste, transaction) => {
  const membre = await getMemberInGroup(NumMembre, codegs, transaction);
  if (!membre) return { status: 400, message: 'Membre absent du groupe ou commune incohérente' };
  if (!admin(req) && Number(req.user.commune_id) !== Number(membre.commune_id)) {
    return { status: 403, message: 'Commune non autorisée' };
  }

  const where = { NumMembre, codegs };
  const existing = await Responsable.findOne({
    where, transaction, lock: transaction.LOCK.UPDATE
  });

  if (existing) {
    await existing.update({ Poste, commune_id: membre.commune_id }, { transaction });
    return { data: existing, created: false };
  }

  const created = await Responsable.create({
    ...where,
    Poste,
    commune_id: membre.commune_id,
    user_id: req.user.user_id
  }, { transaction });

  return { data: created, created: true };
};

// GET /responsables?commune_id=1&codegs=29
exports.getResponsables = async (req, res) => {
  try {
    if (!req.user) return error(res, 401, 'Non authentifié');

    const { commune_id, codegs } = req.query;
    if (commune_id !== undefined && !validId(commune_id)) return error(res, 400, 'Commune invalide');
    if (codegs !== undefined && !validId(codegs)) return error(res, 400, 'Groupe invalide');
    if (!admin(req) && !validId(req.user.commune_id)) return error(res, 403, 'Aucune commune attribuée');

    const commune = admin(req) ? commune_id : req.user.commune_id;
    const conditions = [], replacements = {};

    if (commune) {
      conditions.push('g.commune_id = :commune');
      replacements.commune = Number(commune);
    }

    if (codegs) {
      conditions.push('g.codegs = :codegs');
      replacements.codegs = Number(codegs);
    }

    const data = await sequelize.query(`
      SELECT r."CodeRp", m.nummembre AS "NumMembre",
             COALESCE(NULLIF(TRIM(r."Poste"), ''), 'Membre') AS "Poste",
             g.codegs, g.commune_id, r.user_id, r.created_at, r.updated_at,
             m.nom_membre, m.prenom_membre, m.sexe,
             g.nomgs, c.nom_commune
      FROM groupe_menages gm
      JOIN groupes g ON g.codegs = gm.codegs
      JOIN menages mn ON mn.id_menage = gm.id_menage AND mn.commune_id = g.commune_id
      JOIN membres m ON m.id_menage = mn.id_menage AND m.commune_id = g.commune_id
      LEFT JOIN LATERAL (
        SELECT "CodeRp", "Poste", user_id, created_at, updated_at
        FROM responsables
        WHERE "NumMembre" = m.nummembre AND codegs = g.codegs
        ORDER BY "CodeRp" DESC LIMIT 1
      ) r ON TRUE
      LEFT JOIN communes c ON c.id_commune = g.commune_id
      ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
      ORDER BY g.codegs, mn.numero_menage, m.nom_membre, m.prenom_membre
    `, { replacements, type: QueryTypes.SELECT });

    return res.json(data);
  } catch (err) {
    return handleError(res, err);
  }
};

// POST /responsables
exports.addResponsable = async (req, res) => {
  try {
    if (!req.user) return error(res, 401, 'Non authentifié');

    const { NumMembre, codegs } = req.body || {};
    if (!validId(NumMembre) || !validId(codegs)) {
      return error(res, 400, 'NumMembre et codegs requis');
    }

    if (req.body.Poste !== undefined && typeof req.body.Poste !== 'string') {
      return error(res, 400, 'Poste invalide');
    }

    const Poste = normalizePoste(req.body.Poste);
    if (Poste.length > 100) return error(res, 400, 'Poste trop long');

    const result = await sequelize.transaction(transaction =>
      savePoste(req, Number(NumMembre), Number(codegs), Poste, transaction)
    );

    if (result.status) return error(res, result.status, result.message);

    return res.status(result.created ? 201 : 200).json({
      message: result.created ? 'Attribution créée' : 'Poste mis à jour',
      data: result.data
    });
  } catch (err) {
    return handleError(res, err);
  }
};

// PUT /responsables/:id
exports.updateResponsable = async (req, res) => {
  try {
    if (!req.user) return error(res, 401, 'Non authentifié');
    if (!validId(req.params.id)) return error(res, 400, 'Identifiant invalide');

    if (typeof req.body?.Poste !== 'string') return error(res, 400, 'Poste obligatoire');
    const Poste = normalizePoste(req.body.Poste);
    if (Poste.length > 100) return error(res, 400, 'Poste trop long');

    const result = await sequelize.transaction(async transaction => {
      const responsable = await Responsable.findByPk(Number(req.params.id), {
        transaction, lock: transaction.LOCK.UPDATE
      });

      if (!responsable) return { status: 404, message: 'Responsable introuvable' };
      if (!admin(req) && Number(req.user.commune_id) !== Number(responsable.commune_id)) {
        return { status: 403, message: 'Commune non autorisée' };
      }
      if (!validId(responsable.codegs)) return { status: 409, message: 'Groupe non attribué' };

      const membre = await getMemberInGroup(responsable.NumMembre, responsable.codegs, transaction);
      if (!membre || Number(membre.commune_id) !== Number(responsable.commune_id)) {
        return { status: 409, message: 'Affectation groupe invalide' };
      }

      await responsable.update({ Poste }, { transaction });
      return { data: responsable };
    });

    if (result.status) return error(res, result.status, result.message);
    return res.json({ message: 'Poste modifié', data: result.data });
  } catch (err) {
    return handleError(res, err);
  }
};

// DELETE /responsables/:id
// Réinitialise le poste sans supprimer l'attribution ni le membre.
exports.deleteResponsable = async (req, res) => {
  try {
    if (!req.user) return error(res, 401, 'Non authentifié');
    if (!validId(req.params.id)) return error(res, 400, 'Identifiant invalide');

    const result = await sequelize.transaction(async transaction => {
      const responsable = await Responsable.findByPk(Number(req.params.id), {
        transaction, lock: transaction.LOCK.UPDATE
      });

      if (!responsable) return { status: 404, message: 'Responsable introuvable' };
      if (!admin(req) && Number(req.user.commune_id) !== Number(responsable.commune_id)) {
        return { status: 403, message: 'Commune non autorisée' };
      }
      if (!validId(responsable.codegs)) return { status: 409, message: 'Groupe non attribué' };

      const membre = await getMemberInGroup(responsable.NumMembre, responsable.codegs, transaction);
      if (!membre || Number(membre.commune_id) !== Number(responsable.commune_id)) {
        return { status: 409, message: 'Affectation groupe invalide' };
      }

      await responsable.update({ Poste: 'Membre' }, { transaction });
      return { data: responsable };
    });

    if (result.status) return error(res, result.status, result.message);

    return res.json({
      message: 'Poste réinitialisé à Membre. Attribution et membre conservés.',
      data: result.data
    });
  } catch (err) {
    return handleError(res, err);
  }
};