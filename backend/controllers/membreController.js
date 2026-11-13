const { QueryTypes, Transaction } = require('sequelize');
const sequelize = require('../config/db');
const Membre = require('../models/membreModel');
const Menage = require('../models/menageModel');
const Commune = require('../models/communeModel');

const champsModifiables = ['nom_membre', 'prenom_membre', 'annee_naissance', 'sexe', 'chef'];
const admin = req => req.user?.role === 'admin';
const entierPositif = v => /^\d+$/.test(String(v ?? '')) && Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;
const erreur = (res, status, message) => res.status(status).json({ message });

const extraireChamps = body => {
  const data = {};
  for (const champ of champsModifiables) {
    if (Object.prototype.hasOwnProperty.call(body, champ)) data[champ] = body[champ];
  }
  return data;
};

const erreurServeur = (res, err) => {
  console.error('Erreur membreController:', err);
  return res.status(500).json({ error: 'Erreur interne du serveur.' });
};

const communeAutorisee = (req, communeId) =>
  admin(req) || (entierPositif(req.user?.commune_id) !== null &&
    Number(req.user.commune_id) === Number(communeId));

// Ajoute automatiquement le membre dans les groupes de son ménage.
const syncResponsablesMembre = async (membre, userId, transaction) => {
  await sequelize.query(`
    INSERT INTO responsables
      ("NumMembre", "Poste", codegs, commune_id, user_id, created_at, updated_at)
    SELECT DISTINCT
      :nummembre, 'Membre', g.codegs, g.commune_id, :user_id, NOW(), NOW()
    FROM groupe_menages gm
    JOIN groupes g ON g.codegs = gm.codegs
    WHERE gm.id_menage = :id_menage
      AND g.commune_id = :commune_id
      AND NOT EXISTS (
        SELECT 1 FROM responsables r
        WHERE r."NumMembre" = :nummembre AND r.codegs = g.codegs
      )
  `, {
    replacements: {
      nummembre: membre.nummembre,
      user_id: userId,
      id_menage: membre.id_menage,
      commune_id: membre.commune_id
    },
    transaction
  });
};

// GET — Liste des membres
exports.getMembres = async (req, res) => {
  try {
    const where = admin(req) ? {} : { commune_id: entierPositif(req.user?.commune_id) || -1 };
    const membres = await Membre.findAll({ where, order: [['nummembre', 'ASC']] });
    return res.json(membres);
  } catch (err) {
    return erreurServeur(res, err);
  }
};

// POST — Ajouter un membre
exports.addMembre = async (req, res) => {
  try {
    const body = req.body || {};
    const communeId = admin(req) ? entierPositif(body.commune_id) : entierPositif(req.user?.commune_id);

    if (!communeId) return erreur(res, 400, 'Commune obligatoire.');
    if (!communeAutorisee(req, communeId)) return erreur(res, 403, 'Accès interdit à cette commune.');

    const nom = typeof body.nom_membre === 'string' ? body.nom_membre.trim() : '';
    if (!nom) return erreur(res, 400, 'Le nom du membre est obligatoire.');

    const donneesMembre = extraireChamps(body);
    donneesMembre.nom_membre = nom;

    const numeroFourni = body.num_menage !== undefined &&
      body.num_menage !== null && String(body.num_menage).trim() !== '';
    const numeroExistant = numeroFourni ? entierPositif(body.num_menage) : null;

    if (numeroFourni && !numeroExistant) return erreur(res, 400, 'Numéro de ménage invalide.');

    const resultat = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
    }, async transaction => {
      const commune = await Commune.findByPk(communeId, { transaction });
      if (!commune) {
        const err = new Error('Commune introuvable.');
        err.status = 404;
        throw err;
      }

      let menage;

      if (numeroExistant) {
        menage = await Menage.findOne({
          where: { commune_id: communeId, numero_menage: numeroExistant },
          transaction
        });

        if (!menage) {
          const err = new Error('Ménage introuvable dans cette commune.');
          err.status = 404;
          throw err;
        }
      } else {
        const lignes = await sequelize.query('SELECT * FROM creer_menage(:communeId)', {
          replacements: { communeId },
          type: QueryTypes.SELECT,
          transaction
        });

        if (!lignes[0]) throw new Error('Impossible de créer le ménage.');

        menage = {
          id_menage: lignes[0].nouvel_id_menage,
          numero_menage: lignes[0].nouveau_numero_menage
        };
      }

      const membre = await Membre.create({
        ...donneesMembre,
        user_id: req.user.user_id,
        commune_id: communeId,
        id_menage: menage.id_menage,
        num_menage: String(menage.numero_menage)
      }, { transaction });

      await syncResponsablesMembre(membre, req.user.user_id, transaction);
      return membre;
    });

    res.locals.createdData = resultat.toJSON();
    return res.status(201).json({ message: 'Membre ajouté avec succès.', data: resultat });
  } catch (err) {
    if (err.status) return erreur(res, err.status, err.message);
    return erreurServeur(res, err);
  }
};

// PUT — Modifier un membre
exports.updateMembre = async (req, res) => {
  try {
    const membreId = entierPositif(req.params.id);
    if (!membreId) return erreur(res, 400, 'Identifiant membre invalide.');

    const where = admin(req)
      ? { nummembre: membreId }
      : { nummembre: membreId, commune_id: entierPositif(req.user?.commune_id) || -1 };

    const donnees = extraireChamps(req.body || {});

    if (Object.prototype.hasOwnProperty.call(donnees, 'nom_membre')) {
      if (typeof donnees.nom_membre !== 'string' || !donnees.nom_membre.trim()) {
        return erreur(res, 400, 'Le nom du membre est obligatoire.');
      }
      donnees.nom_membre = donnees.nom_membre.trim();
    }

    if (!Object.keys(donnees).length) return erreur(res, 400, 'Aucun champ modifiable fourni.');

    const resultat = await sequelize.transaction(async transaction => {
      const membre = await Membre.findOne({
        where, transaction, lock: transaction.LOCK.UPDATE
      });

      if (!membre) return null;

      const ancien = membre.toJSON();
      await membre.update(donnees, { transaction });
      return { ancien, nouveau: membre.toJSON() };
    });

    if (!resultat) return erreur(res, 404, 'Membre introuvable ou accès refusé.');

    res.locals.oldData = resultat.ancien;
    res.locals.newData = resultat.nouveau;
    return res.json({ message: 'Membre mis à jour avec succès.', data: resultat.nouveau });
  } catch (err) {
    return erreurServeur(res, err);
  }
};

// DELETE — Supprimer un membre
exports.deleteMembre = async (req, res) => {
  try {
    const membreId = entierPositif(req.params.id);
    if (!membreId) return erreur(res, 400, 'Identifiant membre invalide.');

    const where = admin(req)
      ? { nummembre: membreId }
      : { nummembre: membreId, commune_id: entierPositif(req.user?.commune_id) || -1 };

    const resultat = await sequelize.transaction(async transaction => {
      const membre = await Membre.findOne({
        where, transaction, lock: transaction.LOCK.UPDATE
      });

      if (!membre) return { status: 404, message: 'Membre introuvable ou accès refusé.' };

      const postes = await sequelize.query(`
        SELECT "Poste" FROM responsables
        WHERE "NumMembre" = :nummembre
          AND codegs IS NOT NULL
          AND LOWER(TRIM(COALESCE("Poste", 'Membre'))) NOT IN ('membre', 'membres', 'aucun poste')
        LIMIT 1
      `, {
        replacements: { nummembre: membreId },
        type: QueryTypes.SELECT,
        transaction
      });

      if (postes.length) {
        return { status: 409, message: 'Ce membre possède un poste dans un groupe. Retirez son poste avant de le supprimer.' };
      }

      const ancien = membre.toJSON();

      // Supprime les attributions ordinaires avant le membre.
      await sequelize.query(`
        DELETE FROM responsables
        WHERE "NumMembre" = :nummembre
      `, {
        replacements: { nummembre: membreId },
        transaction
      });

      await membre.destroy({ transaction });
      return { ancien };
    });

    if (resultat.status) return erreur(res, resultat.status, resultat.message);

    res.locals.deletedData = resultat.ancien;
    return res.json({ message: 'Membre supprimé avec succès.' });
  } catch (err) {
    return erreurServeur(res, err);
  }
};