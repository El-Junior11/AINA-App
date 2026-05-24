const Groupe = require('../models/Groupe');
const Membre = require('../models/membreModel');
const { Sequelize } = require('sequelize');

// --- LECTURE (READ) ---

// 1. Récupérer les num_menage distincts (Sivana ampiharina eto koa)
exports.getDistinctMenages = async (req, res) => {
    try {
        // Ny admin mahita ny ménages rehetra, ny user mahita ny an'ny membre-ny ihany
        const filter = req.user.role === 'admin' 
            ? {} 
            : { user_id: req.user.user_id };

        const menages = await Membre.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('num_menage')), 'num_menage']],
            where: { 
                ...filter,
                num_menage: { [Sequelize.Op.ne]: null } 
            },
            order: [[Sequelize.col('num_menage'), 'ASC']]
        });
        res.json(menages);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des ménages : " + error.message });
    }
};

// 2. Récupérer les groupes (Admin vs User)
exports.getAllGroupes = async (req, res) => {
    try {
        // Sivana lehibe: Raha admin dia banga {}, raha user dia {user_id: ...}
        const filter = req.user.role === 'admin' 
            ? {} 
            : { user_id: req.user.user_id };

        const groupes = await Groupe.findAll({ 
            where: filter,
            order: [['codegs', 'DESC']] 
        });
        res.json(groupes);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des groupes : " + error.message });
    }
};

// 3. Récupérer un groupe par son ID (Miaraka amin'ny fiarovana)
exports.getGroupeById = async (req, res) => {
    try {
 const filter = (req.user.role && req.user.role.toLowerCase() === 'admin') 
    ? {} 
    : { user_id: req.user.user_id };

        const groupe = await Groupe.findOne({ where: filter });
        
        if (!groupe) return res.status(404).json({ message: "Groupe non trouvé ou accès refusé." });
        res.json(groupe);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur : " + error.message });
    }
};

// --- CRÉATION (CREATE) ---

exports.createGroupe = async (req, res) => {
    try {
        const { nummenage, date_creation, ...rest } = req.body;
        
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({ message: "Utilisateur non authentifié." });
        }

        const formattedNumMenage = Array.isArray(nummenage) ? nummenage.join(', ') : nummenage;

        const newGroupe = await Groupe.create({
            ...rest,
            nummenage: formattedNumMenage,
            date_creation: date_creation || new Date(),
            user_id: req.user.user_id 
        });

        res.status(201).json({ message: "Groupe créé !", data: newGroupe });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// --- MISE À JOUR (UPDATE) ---

exports.updateGroupe = async (req, res) => {
    try {
        const { nummenage, date_creation, ...rest } = req.body;
        
        // Fiarovana: Tsy afaka manova ny an'ny hafa ny user tsotra
        const filter = req.user.role === 'admin' 
            ? { codegs: req.params.id } 
            : { codegs: req.params.id, user_id: req.user.user_id };

        const groupe = await Groupe.findOne({ where: filter });
        
        if (!groupe) return res.status(404).json({ message: "Groupe non trouvé ou accès refusé." });

        const formattedNumMenage = Array.isArray(nummenage) ? nummenage.join(', ') : nummenage;

        await groupe.update({
            ...rest,
            nummenage: formattedNumMenage,
            date_creation: date_creation
        });
        
        res.json({ message: "Groupe mis à jour avec succès !", data: groupe });
    } catch (error) {
        res.status(400).json({ message: "Erreur lors de la mise à jour : " + error.message });
    }
};

// --- SUPPRESSION (DELETE) ---

exports.deleteGroupe = async (req, res) => {
    try {
        // Fiarovana: Tsy afaka mamafa ny an'ny hafa ny user tsotra
        const filter = req.user.role === 'admin' 
            ? { codegs: req.params.id } 
            : { codegs: req.params.id, user_id: req.user.user_id };

        const deleted = await Groupe.destroy({ where: filter });

        if (!deleted) {
            return res.status(404).json({ message: "Groupe non trouvé ou accès refusé." });
        }

        res.json({ message: "Groupe supprimé avec succès !" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression : " + error.message });
    }
};