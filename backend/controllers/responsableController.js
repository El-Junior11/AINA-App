const Responsable = require('../models/responsableModel');
const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');

const isAdmin = req => req.user?.role === 'admin';
const validId = id => /^\d+$/.test(String(id ?? '')) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
const error = (res, status, message) => res.status(status).json({ error: message });

const handleError = (res, err) => {
  console.error('ResponsableController:', err);
  return error(res, 500, 'Erreur interne du serveur');
};

const checkAccess = (req, res, communeId) => {
  if (!req.user) return error(res, 401, 'Non authentifié'), false;
  if (isAdmin(req)) return true;
  if (!validId(req.user.commune_id)) return error(res, 403, 'Aucune commune attribuée'), false;
  if (Number(req.user.commune_id) !== Number(communeId)) return error(res, 403, 'Commune non autorisée'), false;
  return true;
};

const getMemberInGroup = async (NumMembre, codegs) => {
  const rows = await sequelize.query(`
    SELECT m.nummembre, m.commune_id
    FROM membres m
    JOIN groupe_menages gm ON gm.id_menage = m.id_menage
    JOIN groupes g ON g.codegs = gm.codegs
    WHERE m.nummembre = :NumMembre AND gm.codegs = :codegs
      AND m.commune_id = g.commune_id
    LIMIT 1
  `, { replacements: { NumMembre, codegs }, type: QueryTypes.SELECT });

  return rows[0] || null;
};

const normalizePoste = poste => {
  const value = String(poste ?? 'Membre').trim();
  return !value || ['membre', 'membres', 'aucun poste'].includes(value.toLowerCase()) ? 'Membre' : value;
};

// GET /responsables?commune_id=1&codegs=29
exports.getResponsables = async (req, res) => {
  try {
    if (!req.user) return error(res, 401, 'Non authentifié');

    const { commune_id, codegs } = req.query;
    if (commune_id !== undefined && !validId(commune_id)) return error(res, 400, 'Commune invalide');
    if (codegs !== undefined && !validId(codegs)) return error(res, 400, 'Groupe invalide');
    if (!isAdmin(req) && !validId(req.user.commune_id)) return error(res, 403, 'Aucune commune attribuée');

    const commune = isAdmin(req) ? commune_id : req.user.commune_id;
    const conditions = [], replacements = {};

    if (commune) {
      conditions.push('r.commune_id = :commune');
      replacements.commune = Number(commune);
    }

    if (codegs) {
      conditions.push('r.codegs = :codegs');
      replacements.codegs = Number(codegs);
    }

    const data = await sequelize.query(`
      SELECT r.*, m.nom_membre, m.prenom_membre, m.sexe, g.nomgs, c.nom_commune
      FROM responsables r
      JOIN membres m ON m.nummembre = r."NumMembre"
      LEFT JOIN groupes g ON g.codegs = r.codegs
      LEFT JOIN communes c ON c.id_commune = r.commune_id
      ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
      ORDER BY r."NumMembre", r."CodeRp"
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

    const { NumMembre, codegs } = req.body;
    const Poste = normalizePoste(req.body.Poste);

    if (!validId(NumMembre) || !validId(codegs)) return error(res, 400, 'NumMembre et codegs requis');
    if (Poste.length > 100) return error(res, 400, 'Poste trop long');

    const membre = await getMemberInGroup(Number(NumMembre), Number(codegs));
    if (!membre) return error(res, 400, 'Membre absent du groupe ou commune incohérente');
    if (!checkAccess(req, res, membre.commune_id)) return;

    const where = { NumMembre: Number(NumMembre), codegs: Number(codegs) };
    const existing = await Responsable.findOne({ where });

    if (existing) {
      await existing.update({ Poste, commune_id: membre.commune_id });
      return res.json({ message: 'Poste mis à jour', data: existing });
    }

    const created = await Responsable.create({
      ...where, Poste, commune_id: membre.commune_id, user_id: req.user.user_id
    });

    return res.status(201).json({ message: 'Responsable ajouté', data: created });
  } catch (err) {
    return handleError(res, err);
  }
};

// PUT /responsables/:id (id = CodeRp)
exports.updateResponsable = async (req, res) => {
  try {
    if (!req.user) return error(res, 401, 'Non authentifié');
    if (!validId(req.params.id)) return error(res, 400, 'Identifiant invalide');

    const responsable = await Responsable.findByPk(Number(req.params.id));
    if (!responsable) return error(res, 404, 'Responsable introuvable');
    if (!checkAccess(req, res, responsable.commune_id)) return;

    const Poste = normalizePoste(req.body.Poste);
    if (Poste.length > 100) return error(res, 400, 'Poste trop long');
    if (!validId(responsable.codegs)) return error(res, 409, 'Groupe non attribué');

    const membre = await getMemberInGroup(responsable.NumMembre, responsable.codegs);
    if (!membre || Number(membre.commune_id) !== Number(responsable.commune_id)) {
      return error(res, 409, 'Affectation groupe invalide');
    }

    await responsable.update({ Poste });
    return res.json({ message: 'Poste modifié', data: responsable });
  } catch (err) {
    return handleError(res, err);
  }
};

// DELETE /responsables/:id (id = CodeRp)
exports.deleteResponsable = async (req, res) => {
  try {
    if (!req.user) return error(res, 401, 'Non authentifié');
    if (!validId(req.params.id)) return error(res, 400, 'Identifiant invalide');

    const responsable = await Responsable.findByPk(Number(req.params.id));
    if (!responsable) return error(res, 404, 'Responsable introuvable');
    if (!checkAccess(req, res, responsable.commune_id)) return;

    await responsable.destroy();
    return res.json({ message: 'Attribution supprimée, membre conservé' });
  } catch (err) {
    return handleError(res, err);
  }
};