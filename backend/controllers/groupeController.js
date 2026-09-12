
const Groupe = require('../models/Groupe');
const Membre = require('../models/membreModel');
const Reseau = require('../models/reseauModel');
const { Sequelize } = require('sequelize');

exports.getDistinctMenages = async (req, res) => {
    try {
        const filter = req.user.role === 'admin'
            ? {}
            : { user_id: req.user.user_id };

        const menages = await Membre.findAll({
            attributes: [
                [
                    Sequelize.fn(
                        'DISTINCT',
                        Sequelize.col('num_menage')
                    ),
                    'num_menage'
                ]
            ],
            where: {
                ...filter,
                num_menage: {
                    [Sequelize.Op.ne]: null
                }
            },
            order: [
                [
                    Sequelize.col('num_menage'),
                    'ASC'
                ]
            ]
        });

        res.json(menages);
    } catch (error) {
        console.error('Erreur récupération ménages :', error);

        res.status(500).json({
            message:
                "Erreur lors de la récupération des ménages : " +
                error.message
        });
    }
};

exports.getAllGroupes = async (req, res) => {
    try {
        const filter = req.user.role === 'admin'
            ? {}
            : { user_id: req.user.user_id };

        const groupes = await Groupe.findAll({
            where: filter,
            order: [['codegs', 'DESC']]
        });

        res.json(groupes);
    } catch (error) {
        console.error('Erreur récupération groupes :', error);

        res.status(500).json({
            message:
                "Erreur lors de la récupération des groupes : " +
                error.message
        });
    }
};

exports.getGroupeById = async (req, res) => {
    try {
        const filter = req.user.role &&
            req.user.role.toLowerCase() === 'admin'
            ? {
                codegs: req.params.id
            }
            : {
                codegs: req.params.id,
                user_id: req.user.user_id
            };

        const groupe = await Groupe.findOne({
            where: filter
        });

        if (!groupe) {
            return res.status(404).json({
                message:
                    "Groupe non trouvé ou accès refusé."
            });
        }

        res.json(groupe);
    } catch (error) {
        console.error('Erreur récupération groupe :', error);

        res.status(500).json({
            message:
                "Erreur serveur : " +
                error.message
        });
    }
};

exports.createGroupe = async (req, res) => {
    try {
        const {
            nummenage,
            date_creation,
            ...rest
        } = req.body;

        if (!req.user || !req.user.user_id) {
            return res.status(401).json({
                message:
                    "Utilisateur non authentifié."
            });
        }

        const formattedNumMenage = Array.isArray(nummenage)
            ? nummenage.join(', ')
            : nummenage;

        const newGroupe = await Groupe.create({
            ...rest,
            nummenage: formattedNumMenage,
            date_creation:
                date_creation || new Date(),
            user_id: req.user.user_id
        });

        res.locals.createdData =
            newGroupe.toJSON();

        res.status(201).json({
            message: "Groupe créé !",
            data: newGroupe
        });
    } catch (error) {
        console.error('Erreur création groupe :', error);

        res.status(400).json({
            message: error.message
        });
    }
};

exports.updateGroupe = async (req, res) => {
    const transaction =
        await Groupe.sequelize.transaction();

    try {
        const {
            nummenage,
            date_creation,
            ...rest
        } = req.body;

        const filter = req.user.role === 'admin'
            ? {
                codegs: req.params.id
            }
            : {
                codegs: req.params.id,
                user_id: req.user.user_id
            };

        const groupe = await Groupe.findOne({
            where: filter,
            transaction
        });

        if (!groupe) {
            await transaction.rollback();

            return res.status(404).json({
                message:
                    "Groupe non trouvé ou accès refusé."
            });
        }

        res.locals.oldData =
            groupe.toJSON();

        const oldNomGS =
            typeof groupe.nomgs === 'string'
                ? groupe.nomgs.trim()
                : groupe.nomgs;

        const newNomGS =
            typeof rest.nomgs === 'string'
                ? rest.nomgs.trim()
                : rest.nomgs;

        const formattedNumMenage =
            Array.isArray(nummenage)
                ? nummenage.join(', ')
                : nummenage;

        if (
            newNomGS !== undefined &&
            newNomGS !== null &&
            newNomGS !== '' &&
            newNomGS !== oldNomGS
        ) {
            const reseaux = await Reseau.findAll({
                where: Sequelize.where(
                    Sequelize.fn(
                        'regexp_replace',
                        Sequelize.col('NomGS'),
                        '\\s*,\\s*',
                        ',',
                        'g'
                    ),
                    {
                        [Sequelize.Op.ne]: null
                    }
                ),
                transaction
            });

            for (const reseau of reseaux) {
                if (!reseau.NomGS) {
                    continue;
                }

                const groupesReseau =
                    reseau.NomGS
                        .split(',')
                        .map(item => item.trim())
                        .filter(Boolean);

                let modified = false;

                const groupesModifies =
                    groupesReseau.map(nom => {
                        if (nom === oldNomGS) {
                            modified = true;
                            return newNomGS;
                        }

                        return nom;
                    });

                if (modified) {
                    const nouveauNomGS =
                        [...new Set(groupesModifies)]
                            .join(', ');

                    await reseau.update(
                        {
                            NomGS:
                                nouveauNomGS || null
                        },
                        {
                            transaction
                        }
                    );
                }
            }
        }

        await groupe.update(
            {
                ...rest,
                nummenage: formattedNumMenage,
                date_creation
            },
            {
                transaction
            }
        );

        await transaction.commit();

        res.locals.newData =
            groupe.toJSON();

        res.json({
            message:
                "Groupe mis à jour avec succès !",
            data: groupe
        });
    } catch (error) {
        await transaction.rollback();

        console.error(
            'Erreur lors de la mise à jour du groupe :',
            error
        );

        res.status(500).json({
            message:
                "Erreur lors de la mise à jour : " +
                error.message
        });
    }
};

exports.deleteGroupe = async (req, res) => {
    const transaction =
        await Groupe.sequelize.transaction();

    try {
        const filter = req.user.role === 'admin'
            ? {
                codegs: req.params.id
            }
            : {
                codegs: req.params.id,
                user_id: req.user.user_id
            };

        const groupe = await Groupe.findOne({
            where: filter,
            transaction
        });

        if (!groupe) {
            await transaction.rollback();

            return res.status(404).json({
                message:
                    "Groupe non trouvé ou accès refusé."
            });
        }

        res.locals.deletedData =
            groupe.toJSON();

        const nomGroupe =
            typeof groupe.nomgs === 'string'
                ? groupe.nomgs.trim()
                : groupe.nomgs;

        const reseaux = await Reseau.findAll({
            where: Sequelize.where(
                Sequelize.fn(
                    'regexp_replace',
                    Sequelize.col('NomGS'),
                    '\\s*,\\s*',
                    ',',
                    'g'
                ),
                {
                    [Sequelize.Op.ne]: null
                }
            ),
            transaction
        });

        for (const reseau of reseaux) {
            if (!reseau.NomGS) {
                continue;
            }

            const groupesReseau =
                reseau.NomGS
                    .split(',')
                    .map(item => item.trim())
                    .filter(Boolean);

            const groupesRestants =
                groupesReseau.filter(
                    nom => nom !== nomGroupe
                );

            if (
                groupesRestants.length !==
                groupesReseau.length
            ) {
                await reseau.update(
                    {
                        NomGS:
                            groupesRestants.length > 0
                                ? groupesRestants.join(', ')
                                : null
                    },
                    {
                        transaction
                    }
                );
            }
        }

        await groupe.destroy({
            transaction
        });

        await transaction.commit();

        res.json({
            message:
                "Groupe supprimé avec succès. Les réseaux ont été conservés et le groupe a été retiré de leur liste."
        });
    } catch (error) {
        await transaction.rollback();

        console.error(
            "Erreur suppression groupe :",
            error
        );

        res.status(500).json({
            message:
                "Erreur lors de la suppression : " +
                error.message
        });
    }
};