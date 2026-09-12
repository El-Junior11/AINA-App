
const Reseau = require('../models/reseauModel');

exports.createReseau = async (req, res) => {
    try {
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({
                message: "Utilisateur non authentifié."
            });
        }

        const data = {
            ...req.body,
            user_id: req.user.user_id
        };

        const reseau = await Reseau.create(data);

        res.locals.createdData = reseau.toJSON();

        res.status(201).json({
            message: "Réseau créé avec succès !",
            data: reseau
        });
    } catch (error) {
        res.status(500).json({
            message: "Erreur lors de la création : " + error.message
        });
    }
};

exports.getAllReseaux = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Non autorisé."
            });
        }

        const filter = req.user.role === 'admin'
            ? {}
            : { user_id: req.user.user_id };

        const reseaux = await Reseau.findAll({
            where: filter,
            order: [['codeRS', 'DESC']]
        });

        res.status(200).json(reseaux);
    } catch (error) {
        res.status(500).json({
            message: "Erreur lors de la récupération : " + error.message
        });
    }
};

exports.updateReseau = async (req, res) => {
    try {
        const { id } = req.params;

        const filter = req.user.role === 'admin'
            ? { codeRS: id }
            : {
                codeRS: id,
                user_id: req.user.user_id
            };

        const reseau = await Reseau.findOne({
            where: filter
        });

        if (!reseau) {
            return res.status(403).json({
                message: "Autorisation refusée ou réseau non trouvé."
            });
        }

        res.locals.oldData = reseau.toJSON();

        const { user_id, ...updateData } = req.body;

        await reseau.update(updateData);

        res.locals.newData = reseau.toJSON();

        res.status(200).json({
            message: "Réseau mis à jour avec succès !",
            data: reseau
        });
    } catch (error) {
        res.status(500).json({
            message: "Erreur lors de la mise à jour : " + error.message
        });
    }
};

exports.deleteReseau = async (req, res) => {
    try {
        const { id } = req.params;

        const filter = req.user.role === 'admin'
            ? { codeRS: id }
            : {
                codeRS: id,
                user_id: req.user.user_id
            };

        const reseau = await Reseau.findOne({
            where: filter
        });

        if (!reseau) {
            return res.status(403).json({
                message: "Autorisation refusée ou réseau non trouvé."
            });
        }

        res.locals.deletedData = reseau.toJSON();

        await reseau.destroy();

        res.status(200).json({
            message: "Réseau supprimé avec succès !"
        });
    } catch (error) {
        res.status(500).json({
            message: "Erreur lors de la suppression : " + error.message
        });
    }
};
