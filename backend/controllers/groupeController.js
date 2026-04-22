const Groupe = require('../models/Groupe');
const Membre = require('../models/membreModel');
const { Sequelize } = require('sequelize');

// --- LECTURE (READ) ---

// 1. Récupérer les num_menage distincts (pour le checklist)
exports.getDistinctMenages = async (req, res) => {
    try {
        const menages = await Membre.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('num_menage')), 'num_menage']],
            where: { num_menage: { [Sequelize.Op.ne]: null } },
            order: [[Sequelize.col('num_menage'), 'ASC']]
        });
        res.json(menages);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des ménages : " + error.message });
    }
};

// 2. Récupérer tous les groupes
exports.getAllGroupes = async (req, res) => {
    try {
        const groupes = await Groupe.findAll({ order: [['codegs', 'DESC']] });
        res.json(groupes);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des groupes : " + error.message });
    }
};

// 3. Récupérer un groupe par son ID
exports.getGroupeById = async (req, res) => {
    try {
        const groupe = await Groupe.findByPk(req.params.id);
        if (!groupe) return res.status(404).json({ message: "Groupe non trouvé." });
        res.json(groupe);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur : " + error.message });
    }
};

// --- CRÉATION (CREATE) ---

exports.createGroupe = async (req, res) => {
    try {
        console.log("Data azo avy amin'ny Front:", req.body); // Debug
        const { nummenage, ...rest } = req.body;
        
        const formattedNumMenage = Array.isArray(nummenage) ? nummenage.join(', ') : nummenage;

        const newGroupe = await Groupe.create({
            ...rest,
            nummenage: formattedNumMenage
            // user_id: req.user.user_id  <-- Ampio ity raha misy user_id ny tabilao Groupes
        });

        res.status(201).json({ message: "Groupe créé !", data: newGroupe });
    } catch (error) {
        console.error("Erreur création groupe:", error); // Jereo ny terminal VS Code
        res.status(400).json({ message: error.message });
    }
};

// --- MISE À JOUR (UPDATE) ---

exports.updateGroupe = async (req, res) => {
    try {
        const { nummenage, ...rest } = req.body;
        const groupe = await Groupe.findByPk(req.params.id);
        
        if (!groupe) return res.status(404).json({ message: "Groupe non trouvé." });

        const formattedNumMenage = Array.isArray(nummenage) ? nummenage.join(', ') : nummenage;

        await groupe.update({
            ...rest,
            nummenage: formattedNumMenage
        });
        
        res.json({
            message: "Groupe mis à jour avec succès !",
            data: groupe
        });
    } catch (error) {
        res.status(400).json({ message: "Erreur lors de la mise à jour : " + error.message });
    }
};

// --- SUPPRESSION (DELETE) ---

exports.deleteGroupe = async (req, res) => {
    try {
        const groupe = await Groupe.findByPk(req.params.id);
        if (!groupe) return res.status(404).json({ message: "Groupe non trouvé." });

        await groupe.destroy();
        res.json({ message: "Groupe supprimé avec succès !" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression : " + error.message });
    }
};