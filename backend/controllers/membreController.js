
const Membre = require('../models/membreModel');

exports.getMembres = async (req, res) => {
    try {
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({
                error: "Utilisateur non authentifié"
            });
        }

        const filter = req.user.role === 'admin'
            ? {}
            : { user_id: req.user.user_id };

        const data = await Membre.findAll({
            where: filter,
            order: [['nummembre', 'ASC']]
        });

        res.json(data);
    } catch (err) {
        console.error("ERREUR BACKEND:", err);

        res.status(500).json({
            error: "Erreur interne du serveur"
        });
    }
};

exports.addMembre = async (req, res) => {
    try {
        const newMembre = await Membre.create({
            ...req.body,
            user_id: req.user.user_id
        });

        res.locals.createdData = newMembre.toJSON();

        res.status(201).json({
            message: "Membre ajouté avec succès",
            data: newMembre
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

exports.updateMembre = async (req, res) => {
    try {
        const id = req.params.id;

        const filter = req.user.role === 'admin'
            ? {
                nummembre: id
            }
            : {
                nummembre: id,
                user_id: req.user.user_id
            };

        const membre = await Membre.findOne({
            where: filter
        });

        if (!membre) {
            return res.status(404).json({
                message: "Membre non trouvé ou accès refusé"
            });
        }

        res.locals.oldData = membre.toJSON();

        await membre.update(req.body);

        res.locals.newData = membre.toJSON();

        res.json({
            message: "Membre mis à jour avec succès",
            data: membre
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

exports.deleteMembre = async (req, res) => {
    try {
        const id = req.params.id;

        const filter = req.user.role === 'admin'
            ? {
                nummembre: id
            }
            : {
                nummembre: id,
                user_id: req.user.user_id
            };

        const membre = await Membre.findOne({
            where: filter
        });

        if (!membre) {
            return res.status(404).json({
                message: "Membre non trouvé ou accès refusé"
            });
        }

        res.locals.deletedData = membre.toJSON();

        await membre.destroy();

        res.json({
            message: "Membre supprimé avec succès"
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};
