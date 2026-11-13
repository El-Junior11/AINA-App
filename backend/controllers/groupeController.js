const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const Groupe = require('../models/Groupe');
const Menage = require('../models/menageModel');
const Commune = require('../models/communeModel');
const Reseau = require('../models/reseauModel');

const admin = req => req.user?.role === 'admin';
const id = value => /^\d+$/.test(String(value ?? '')) && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const clean = value => typeof value === 'string' ? value.trim() : value;
const fail = (res, status, message) => res.status(status).json({ message });
const scope = req => admin(req) ? {} : { commune_id: id(req.user?.commune_id) || -1 };
const group = (req, transaction) => Groupe.findOne({ where: { codegs: id(req.params.id) || -1, ...scope(req) }, transaction });

const parseMenages = value => {
  const items = Array.isArray(value) ? value : String(value ?? '').split(',');
  if (!items.length || items.some(v => !/^\d+$/.test(String(v).trim()))) return null;
  const numbers = items.map(id);
  return numbers.some(n => !n) || new Set(numbers).size !== numbers.length ? null : numbers;
};

const parseDate = value => {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : false;
};

const validate = body => {
  const nomgs = clean(body.nomgs), menages = parseMenages(body.nummenage), date_creation = parseDate(body.date_creation);
  const fokontany = clean(body.fokontany), village = clean(body.village);
  if (typeof nomgs !== 'string' || !nomgs || nomgs.length > 255) return { error: 'Nom du groupe obligatoire (255 caractères maximum).' };
  if (!menages) return { error: 'Numéros de ménage invalides ou répétés.' };
  if (date_creation === false) return { error: 'Date invalide (AAAA-MM-JJ).' };
  if ([fokontany, village].some(v => v != null && (typeof v !== 'string' || v.length > 255))) return { error: 'Fokontany ou village invalide.' };
  return { menages, data: { nomgs, nummenage: menages.join(', '), date_creation, fokontany: fokontany || null, village: village || null } };
};

const verifyMenages = async (commune_id, numbers, transaction) => {
  const rows = await Menage.findAll({
    where: { commune_id, numero_menage: { [Op.in]: numbers } },
    attributes: ['id_menage', 'numero_menage'],
    transaction
  });
  return rows.length === numbers.length ? rows.map(m => m.id_menage) : null;
};

const syncMenages = async (codegs, ids, transaction) => {
  await sequelize.query('DELETE FROM groupe_menages WHERE codegs = :codegs', { replacements: { codegs }, transaction });
  for (const id_menage of ids) {
    await sequelize.query(
      'INSERT INTO groupe_menages (codegs, id_menage) VALUES (:codegs, :id_menage)',
      { replacements: { codegs, id_menage }, transaction }
    );
  }
};

// Synchronisation automatique des membres du groupe vers responsables.
const syncResponsables = async (codegs, transaction) => {
  await sequelize.query(`
    INSERT INTO responsables ("NumMembre", "Poste", codegs, commune_id, user_id, created_at, updated_at)
    SELECT DISTINCT m.nummembre, 'Membre', g.codegs, g.commune_id, g.user_id, NOW(), NOW()
    FROM groupes g
    JOIN groupe_menages gm ON gm.codegs = g.codegs
    JOIN menages mn ON mn.id_menage = gm.id_menage AND mn.commune_id = g.commune_id
    JOIN membres m ON m.id_menage = mn.id_menage AND m.commune_id = g.commune_id
    WHERE g.codegs = :codegs
      AND NOT EXISTS (
        SELECT 1 FROM responsables r
        WHERE r."NumMembre" = m.nummembre AND r.codegs = g.codegs
      )
  `, { replacements: { codegs }, transaction });
};

const hasRemovedResponsibilities = async (codegs, ids, transaction) => {
  const rows = await sequelize.query(`
    SELECT 1 FROM responsables r
    JOIN membres m ON m.nummembre = r."NumMembre"
    WHERE r.codegs = :codegs AND m.id_menage NOT IN (:ids)
    LIMIT 1
  `, { replacements: { codegs, ids }, type: QueryTypes.SELECT, transaction });
  return rows.length > 0;
};

const reseauReference = async (nomgs, transaction) => {
  const rows = await Reseau.findAll({ attributes: ['NomGS'], transaction });
  return rows.some(r => String(r.NomGS || '').split(',').some(v =>
    v.trim().toLocaleLowerCase() === String(nomgs).trim().toLocaleLowerCase()
  ));
};

const handle = (res, err, action) => {
  console.error(`${action} groupe:`, err);
  return fail(res, 500, `Erreur lors de ${action} du groupe.`);
};

exports.getAllGroupes = async (req, res) => {
  try {
    const where = scope(req);
    if (req.query.commune_id !== undefined && !id(req.query.commune_id)) return fail(res, 400, 'Commune invalide.');
    if (admin(req) && req.query.commune_id) where.commune_id = id(req.query.commune_id);
    return res.json(await Groupe.findAll({ where, order: [['codegs', 'DESC']] }));
  } catch (err) { return handle(res, err, 'la récupération'); }
};

exports.getGroupeById = async (req, res) => {
  try {
    if (!id(req.params.id)) return fail(res, 400, 'Identifiant invalide.');
    const result = await group(req);
    return result ? res.json(result) : fail(res, 404, 'Groupe introuvable ou accès interdit.');
  } catch (err) { return handle(res, err, 'la récupération'); }
};

exports.getDistinctMenages = async (req, res) => {
  try {
    if (req.query.commune_id !== undefined && !id(req.query.commune_id)) return fail(res, 400, 'Commune invalide.');
    const commune_id = admin(req) ? id(req.query.commune_id) : id(req.user.commune_id);
    if (!commune_id) return fail(res, 400, 'Sélectionnez une commune.');
    const rows = await Menage.findAll({
      where: { commune_id },
      attributes: ['numero_menage'],
      order: [['numero_menage', 'ASC']]
    });
    return res.json(rows.map(m => String(m.numero_menage)));
  } catch (err) { return handle(res, err, 'la récupération des ménages'); }
};

exports.getGroupeMembres = async (req, res) => {
  try {
    if (!id(req.params.id)) return fail(res, 400, 'Identifiant invalide.');
    const g = await group(req);
    if (!g) return fail(res, 404, 'Groupe introuvable ou accès interdit.');

    const rows = await sequelize.query(`
      SELECT m.nummembre, m.nom_membre, m.prenom_membre, m.sexe, m.annee_naissance, m.chef,
             mn.id_menage, mn.numero_menage, g.codegs, g.nomgs, g.commune_id,
             r."CodeRp", COALESCE(NULLIF(TRIM(r."Poste"), ''), 'Membre') AS "Poste"
      FROM groupe_menages gm
      JOIN groupes g ON g.codegs = gm.codegs
      JOIN menages mn ON mn.id_menage = gm.id_menage AND mn.commune_id = g.commune_id
      JOIN membres m ON m.id_menage = mn.id_menage AND m.commune_id = g.commune_id
      LEFT JOIN LATERAL (
        SELECT "CodeRp", "Poste" FROM responsables
        WHERE codegs = g.codegs AND "NumMembre" = m.nummembre
        ORDER BY "CodeRp" DESC LIMIT 1
      ) r ON TRUE
      WHERE g.codegs = :codegs
      ORDER BY mn.numero_menage, m.nom_membre, m.prenom_membre
    `, { replacements: { codegs: g.codegs }, type: QueryTypes.SELECT });

    return res.json(rows);
  } catch (err) { return handle(res, err, 'la récupération des membres'); }
};

exports.createGroupe = async (req, res) => {
  try {
    const v = validate(req.body || {});
    if (v.error) return fail(res, 400, v.error);
    const commune_id = admin(req) ? id(req.body.commune_id) : id(req.user.commune_id);
    if (!commune_id) return fail(res, 400, 'Commune obligatoire.');

    const result = await sequelize.transaction(async transaction => {
      const commune = await Commune.findByPk(commune_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!commune) return { status: 404, message: 'Commune introuvable.' };

      const ids = await verifyMenages(commune_id, v.menages, transaction);
      if (!ids) return { status: 400, message: 'Ménage introuvable dans cette commune.' };

      const g = await Groupe.create({
        ...v.data, commune_id, commune: commune.nom_commune, user_id: req.user.user_id
      }, { transaction });

      await syncMenages(g.codegs, ids, transaction);
      await syncResponsables(g.codegs, transaction);
      return { groupe: g };
    });

    if (result.status) return fail(res, result.status, result.message);
    res.locals.createdData = result.groupe.toJSON();
    return res.status(201).json(result.groupe);
  } catch (err) { return handle(res, err, 'la création'); }
};

exports.updateGroupe = async (req, res) => {
  try {
    if (!id(req.params.id)) return fail(res, 400, 'Identifiant invalide.');
    const v = validate(req.body || {});
    if (v.error) return fail(res, 400, v.error);

    const result = await sequelize.transaction(async transaction => {
      const current = await group(req, transaction);
      if (!current) return { status: 404, message: 'Groupe introuvable ou accès interdit.' };
      if (!current.commune_id) return { status: 409, message: 'Commune du groupe manquante.' };

      const commune = await Commune.findByPk(current.commune_id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!commune) return { status: 409, message: 'Commune introuvable.' };

      const g = await group(req, transaction);
      const ids = await verifyMenages(g.commune_id, v.menages, transaction);
      if (!ids) return { status: 400, message: 'Ménage introuvable dans cette commune.' };

      if (await hasRemovedResponsibilities(g.codegs, ids, transaction)) {
        return { status: 409, message: 'Des membres retirés ont encore un poste dans ce groupe.' };
      }

      if (g.nomgs.toLocaleLowerCase() !== v.data.nomgs.toLocaleLowerCase() &&
          await reseauReference(g.nomgs, transaction)) {
        return { status: 409, message: 'Nom utilisé par un réseau.' };
      }

      const oldData = g.toJSON();
      await g.update(v.data, { transaction });
      await syncMenages(g.codegs, ids, transaction);
      await syncResponsables(g.codegs, transaction);
      return { groupe: g, oldData };
    });

    if (result.status) return fail(res, result.status, result.message);
    res.locals.oldData = result.oldData;
    res.locals.newData = result.groupe.toJSON();
    return res.json(result.groupe);
  } catch (err) { return handle(res, err, 'la modification'); }
};

exports.deleteGroupe = async (req, res) => {
  try {
    if (!id(req.params.id)) return fail(res, 400, 'Identifiant invalide.');

    const result = await sequelize.transaction(async transaction => {
      const g = await group(req, transaction);
      if (!g) return { status: 404, message: 'Groupe introuvable ou accès interdit.' };
      if (await reseauReference(g.nomgs, transaction)) {
        return { status: 409, message: 'Groupe référencé par un réseau.' };
      }

      const assigned = await sequelize.query(
        'SELECT 1 FROM responsables WHERE codegs = :codegs LIMIT 1',
        { replacements: { codegs: g.codegs }, type: QueryTypes.SELECT, transaction }
      );
      if (assigned.length) return { status: 409, message: 'Groupe avec postes attribués : suppression bloquée.' };

      const deletedData = g.toJSON();
      await g.destroy({ transaction });
      return { deletedData };
    });

    if (result.status) return fail(res, result.status, result.message);
    res.locals.deletedData = result.deletedData;
    return res.json({ message: 'Groupe supprimé.' });
  } catch (err) { return handle(res, err, 'la suppression'); }
};