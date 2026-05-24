const Formation = require('../models/formationModel');
const Membre = require('../models/membreModel');
const { Sequelize } = require('sequelize');

exports.getFormations = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Non autorisé" });

        const filter = req.user.role === 'admin' 
            ? {} 
            : { user_id: req.user.user_id };

        const data = await Membre.findAll({
            where: filter,
            include: [{
                model: Formation,
                as: 'formation'
            }],
            order: [['nummembre', 'ASC']]
        });
        
        res.status(200).json(data);
    } catch (err) {
        console.error("Erreur getFormations:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.saveFormation = async (req, res) => {
    try {
        const { nummembre, ...fiofananaData } = req.body;
        const currentUserId = req.user.user_id;

        if (!nummembre) {
            return res.status(400).json({ message: "Le numéro de membre est requis." });
        }

        if (req.user.role !== 'admin') {
            const membreOwn = await Membre.findOne({ 
                where: { nummembre, user_id: currentUserId } 
            });
            
            if (!membreOwn) {
                return res.status(403).json({ message: "Accès refusé : ce membre ne vous appartient pas." });
            }
        }

        const [record, created] = await Formation.upsert({
            nummembre,
            user_id: currentUserId,
            ...fiofananaData
        });

        res.status(200).json({ 
            message: created ? "Formation créée avec succès" : "Formation mise à jour avec succès", 
            data: record 
        });

    } catch (err) {
        console.error("Erreur saveFormation:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteFormation = async (req, res) => {
    try {
        const { id } = req.params;

        const filter = req.user.role === 'admin' 
            ? { nummembre: id } 
            : { nummembre: id, user_id: req.user.user_id };

        const deleted = await Formation.destroy({ where: filter });

        if (deleted === 0) {
            return res.status(403).json({ message: "Formation non trouvée ou accès refusé." });
        }

        res.json({ message: "Formation supprimée avec succès" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDetailedStats = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Non autorisé" });

        const filter = req.user.role === 'admin' 
            ? {} 
            : { user_id: req.user.user_id };

        const stats = await Membre.findAll({
            where: filter,
            include: [{
                model: Formation,
                as: 'formation',
                attributes: []
            }],
            attributes: [
                [Sequelize.literal("SUM(CASE WHEN formation.genre = true AND \"Membre\".sexe = 'Homme' THEN 1 ELSE 0 END)"), 'genre_h'],
                [Sequelize.literal("SUM(CASE WHEN formation.genre = true AND \"Membre\".sexe = 'Femme' THEN 1 ELSE 0 END)"), 'genre_f'],
                
                [Sequelize.literal("SUM(CASE WHEN formation.agroeco = true AND \"Membre\".sexe = 'Homme' THEN 1 ELSE 0 END)"), 'agroeco_h'],
                [Sequelize.literal("SUM(CASE WHEN formation.agroeco = true AND \"Membre\".sexe = 'Femme' THEN 1 ELSE 0 END)"), 'agroeco_f'],
                
                [Sequelize.literal("SUM(CASE WHEN formation.productionsemence = true AND \"Membre\".sexe = 'Homme' THEN 1 ELSE 0 END)"), 'semence_h'],
                [Sequelize.literal("SUM(CASE WHEN formation.productionsemence = true AND \"Membre\".sexe = 'Femme' THEN 1 ELSE 0 END)"), 'semence_f'],
                
                [Sequelize.literal("SUM(CASE WHEN formation.nutrition = true AND \"Membre\".sexe = 'Homme' THEN 1 ELSE 0 END)"), 'nutrition_h'],
                [Sequelize.literal("SUM(CASE WHEN formation.nutrition = true AND \"Membre\".sexe = 'Femme' THEN 1 ELSE 0 END)"), 'nutrition_f'],

                [Sequelize.literal("SUM(CASE WHEN formation.conservationproduit = true AND \"Membre\".sexe = 'Homme' THEN 1 ELSE 0 END)"), 'conservation_h'],
                [Sequelize.literal("SUM(CASE WHEN formation.conservationproduit = true AND \"Membre\".sexe = 'Femme' THEN 1 ELSE 0 END)"), 'conservation_f'],

                [Sequelize.literal("SUM(CASE WHEN formation.transformationproduit = true AND \"Membre\".sexe = 'Homme' THEN 1 ELSE 0 END)"), 'transformation_h'],
                [Sequelize.literal("SUM(CASE WHEN formation.transformationproduit = true AND \"Membre\".sexe = 'Femme' THEN 1 ELSE 0 END)"), 'transformation_f'],

                [Sequelize.literal("SUM(CASE WHEN formation.gestionsimplifiee = true AND \"Membre\".sexe = 'Homme' THEN 1 ELSE 0 END)"), 'gestion_h'],
                [Sequelize.literal("SUM(CASE WHEN formation.gestionsimplifiee = true AND \"Membre\".sexe = 'Femme' THEN 1 ELSE 0 END)"), 'gestion_f'],

                [Sequelize.literal("SUM(CASE WHEN formation.epracc = true AND \"Membre\".sexe = 'Homme' THEN 1 ELSE 0 END)"), 'epracc_h'],
                [Sequelize.literal("SUM(CASE WHEN formation.epracc = true AND \"Membre\".sexe = 'Femme' THEN 1 ELSE 0 END)"), 'epracc_f']
            ],
            raw: true
        });

        res.status(200).json(stats[0] || {});
    } catch (err) {
        console.error("Erreur stats:", err);
        res.status(500).json({ error: err.message });
    }
};