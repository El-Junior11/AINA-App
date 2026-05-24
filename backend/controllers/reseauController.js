const Reseau = require('../models/reseauModel');

// --- CRÉATION (CREATE) ---
exports.createReseau = async (req, res) => {
    try {
        // Hamarino aloha raha misy ny req.user
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({ message: "Utilisateur non authentifié." });
        }

        // Force-na ho ny user_id an'ilay olona mifandray foana no ampiasaina
        const data = { 
            ...req.body, 
            user_id: req.user.user_id 
        }; 

        const reseau = await Reseau.create(data);
        res.status(201).json({
            message: "Réseau créé avec succès !",
            data: reseau
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la création : " + error.message });
    }
};

// --- LECTURE (READ ALL) ---
exports.getAllReseaux = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Non autorisé." });

        // Sivana lehibe: 
        // - Admin: mahita ny rehetra (where banga)
        // - User: mahita ny azy ihany (where misy user_id)
        const filter = req.user.role === 'admin' 
            ? {} 
            : { user_id: req.user.user_id };

        const reseaux = await Reseau.findAll({ 
            where: filter,
            order: [['codeRS', 'DESC']] // Sivanina araka ny filaharany
        });

        res.status(200).json(reseaux);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération : " + error.message });
    }
};

// --- MISE À JOUR (UPDATE) ---
exports.updateReseau = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Fiarovana: Ny admin afaka manova ny rehetra, ny user kosa ny azy ihany
        const filter = req.user.role === 'admin' 
            ? { codeRS: id } 
            : { codeRS: id, user_id: req.user.user_id };

        // Jereo aloha raha misy ilay reseau ary an'ilay user
        const reseau = await Reseau.findOne({ where: filter });
        
        if (!reseau) {
            return res.status(403).json({ message: "Autorisation refusée ou réseau non trouvé." });
        }

        // Tsy avela hovana ny user_id na dia mandefa izany aza ny body
        const { user_id, ...updateData } = req.body;

        await reseau.update(updateData);
        
        res.status(200).json({ 
            message: "Réseau mis à jour avec succès !",
            data: reseau 
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour : " + error.message });
    }
};

// --- SUPPRESSION (DELETE) ---
exports.deleteReseau = async (req, res) => {
    try {
        const { id } = req.params;

        // Fiarovana: Mitovy amin'ny update ny lojika
        const filter = req.user.role === 'admin' 
            ? { codeRS: id } 
            : { codeRS: id, user_id: req.user.user_id };

        const deleted = await Reseau.destroy({ where: filter });
        
        if (deleted === 0) {
            return res.status(403).json({ message: "Autorisation refusée ou réseau non trouvé." });
        }

        res.status(200).json({ message: "Réseau supprimé avec succès !" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression : " + error.message });
    }
};