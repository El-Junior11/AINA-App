const { QueryTypes, Transaction } = require('sequelize');

const sequelize = require('../config/db');
const Membre = require('../models/membreModel');
const Menage = require('../models/menageModel');
const Commune = require('../models/communeModel');

const champsModifiables = [
  'nom_membre',
  'prenom_membre',
  'annee_naissance',
  'sexe',
  'chef'
];

const extraireChamps = (body) => {
  const data = {};

  for (const champ of champsModifiables) {
    if (Object.prototype.hasOwnProperty.call(body, champ)) {
      data[champ] = body[champ];
    }
  }

  return data;
};

const entierPositif = (valeur) => {
  const nombre = Number(valeur);

  return Number.isSafeInteger(nombre) && nombre > 0
    ? nombre
    : null;
};

const erreurServeur = (res, erreur) => {
  console.error('Erreur membreController:', erreur);

  return res.status(500).json({
    error: 'Erreur interne du serveur.'
  });
};

const communeAutorisee = (req, communeId) => {
  return (
    req.user.role === 'admin' ||
    Number(req.user.commune_id) === Number(communeId)
  );
};

// =====================================================
// GET — LISTE DES MEMBRES
// =====================================================

exports.getMembres = async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? {}
      : { commune_id: req.user.commune_id };

    const membres = await Membre.findAll({
      where: filter,
      order: [['nummembre', 'ASC']]
    });

    return res.json(membres);

  } catch (error) {
    return erreurServeur(res, error);
  }
};

// =====================================================
// POST — AJOUTER UN MEMBRE
// =====================================================

exports.addMembre = async (req, res) => {
  try {
    const body = req.body || {};

    const communeId = req.user.role === 'admin'
      ? entierPositif(body.commune_id)
      : entierPositif(req.user.commune_id);

    if (!communeId) {
      return res.status(400).json({
        message: 'Commune obligatoire.'
      });
    }

    if (!communeAutorisee(req, communeId)) {
      return res.status(403).json({
        message: 'Accès interdit à cette commune.'
      });
    }

    const nom = typeof body.nom_membre === 'string'
      ? body.nom_membre.trim()
      : '';

    if (!nom) {
      return res.status(400).json({
        message: 'Le nom du membre est obligatoire.'
      });
    }

    const donneesMembre = extraireChamps(body);
    donneesMembre.nom_membre = nom;

    /*
      Le formulaire peut envoyer :
      - num_menage : numéro d'un ménage existant
      - aucun numéro : création d'un nouveau ménage

      Le numéro est toujours interprété dans la commune.
    */

    const numeroExistant =
      body.num_menage === undefined ||
      body.num_menage === null ||
      String(body.num_menage).trim() === ''
        ? null
        : entierPositif(body.num_menage);

    if (
      body.num_menage !== undefined &&
      body.num_menage !== null &&
      String(body.num_menage).trim() !== '' &&
      !numeroExistant
    ) {
      return res.status(400).json({
        message: 'Numéro de ménage invalide.'
      });
    }

    const resultat = await sequelize.transaction(
      {
        isolationLevel:
          Transaction.ISOLATION_LEVELS.READ_COMMITTED
      },
      async (transaction) => {

        const commune = await Commune.findByPk(communeId, {
          transaction
        });

        if (!commune) {
          const erreur = new Error('Commune introuvable.');
          erreur.status = 404;
          throw erreur;
        }

        let menage;

        if (numeroExistant) {
          menage = await Menage.findOne({
            where: {
              commune_id: communeId,
              numero_menage: numeroExistant
            },
            transaction
          });

          if (!menage) {
            const erreur = new Error(
              'Ménage introuvable dans cette commune.'
            );
            erreur.status = 404;
            throw erreur;
          }

        } else {
          const lignes = await sequelize.query(
            'SELECT * FROM creer_menage(:communeId)',
            {
              replacements: { communeId },
              type: QueryTypes.SELECT,
              transaction
            }
          );

          const nouveauMenage = lignes[0];

          if (!nouveauMenage) {
            throw new Error(
              'Impossible de créer le ménage.'
            );
          }

          menage = {
            id_menage: nouveauMenage.nouvel_id_menage,
            numero_menage:
              nouveauMenage.nouveau_numero_menage
          };
        }

        const membre = await Membre.create(
          {
            ...donneesMembre,
            user_id: req.user.user_id,
            commune_id: communeId,
            id_menage: menage.id_menage,
            num_menage: String(menage.numero_menage)
          },
          { transaction }
        );

        return membre;
      }
    );

    res.locals.createdData = resultat.toJSON();

    return res.status(201).json({
      message: 'Membre ajouté avec succès.',
      data: resultat
    });

  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        message: error.message
      });
    }

    return erreurServeur(res, error);
  }
};

// =====================================================
// PUT — MODIFIER UN MEMBRE
// =====================================================

exports.updateMembre = async (req, res) => {
  try {
    const id = entierPositif(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Identifiant membre invalide.'
      });
    }

    const filter = req.user.role === 'admin'
      ? { nummembre: id }
      : {
          nummembre: id,
          commune_id: req.user.commune_id
        };

    const donnees = extraireChamps(req.body || {});

    if (
      Object.prototype.hasOwnProperty.call(
        donnees,
        'nom_membre'
      )
    ) {
      if (
        typeof donnees.nom_membre !== 'string' ||
        !donnees.nom_membre.trim()
      ) {
        return res.status(400).json({
          message: 'Le nom du membre est obligatoire.'
        });
      }

      donnees.nom_membre = donnees.nom_membre.trim();
    }

    if (Object.keys(donnees).length === 0) {
      return res.status(400).json({
        message: 'Aucun champ modifiable fourni.'
      });
    }

    const resultat = await sequelize.transaction(
      async (transaction) => {
        const membre = await Membre.findOne({
          where: filter,
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (!membre) {
          return null;
        }

        const ancien = membre.toJSON();

        await membre.update(donnees, { transaction });

        return {
          ancien,
          nouveau: membre.toJSON()
        };
      }
    );

    if (!resultat) {
      return res.status(404).json({
        message: 'Membre introuvable ou accès refusé.'
      });
    }

    res.locals.oldData = resultat.ancien;
    res.locals.newData = resultat.nouveau;

    return res.json({
      message: 'Membre mis à jour avec succès.',
      data: resultat.nouveau
    });

  } catch (error) {
    return erreurServeur(res, error);
  }
};

// =====================================================
// DELETE — SUPPRIMER UN MEMBRE
// =====================================================

exports.deleteMembre = async (req, res) => {
  try {
    const id = entierPositif(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: 'Identifiant membre invalide.'
      });
    }

    const filter = req.user.role === 'admin'
      ? { nummembre: id }
      : {
          nummembre: id,
          commune_id: req.user.commune_id
        };

    const resultat = await sequelize.transaction(
      async (transaction) => {
        const membre = await Membre.findOne({
          where: filter,
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (!membre) {
          return null;
        }

        const ancien = membre.toJSON();

        await membre.destroy({ transaction });

        return ancien;
      }
    );

    if (!resultat) {
      return res.status(404).json({
        message: 'Membre introuvable ou accès refusé.'
      });
    }

    res.locals.deletedData = resultat;

    return res.json({
      message: 'Membre supprimé avec succès.'
    });

  } catch (error) {
    return erreurServeur(res, error);
  }
};
