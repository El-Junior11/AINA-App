const Membre = require('../models/membreModel');

exports.getMembres = async (req, res) => {
    try {
        // Hamarino aloha raha misy req.user (middleware check)
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({ error: "Utilisateur non authentifié ou token manquant" });
        }

        const data = await Membre.findAll({
            where: { user_id: req.user.user_id },
            order: [['nummembre', 'ASC']]
        });
        res.json(data);
    } catch (err) {
        console.error("ERREUR BACKEND:", err); // Jereo ny terminal any amin'ny VS Code
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

exports.addMembre = async (req, res) => {
    try {
        const newMembre = await Membre.create({
            ...req.body,
            user_id: req.user.user_id
        });
        res.status(201).json({ 
            message: "Membre ajouté avec succès", 
            data: newMembre 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateMembre = async (req, res) => {
    try {
        const id = req.params.id;
        const [updated] = await Membre.update(req.body, {
            where: { 
                nummembre: id, 
                user_id: req.user.user_id 
            }
        });

        if (updated) {
            res.json({ message: "Membre mis à jour avec succès" });
        } else {
            res.status(404).json({ message: "Membre non trouvé ou accès refusé" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteMembre = async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await Membre.destroy({
            where: { 
                nummembre: id, 
                user_id: req.user.user_id 
            }
        });

        if (deleted) {
            res.json({ message: "Membre supprimé avec succès" });
        } else {
            res.status(404).json({ message: "Membre non trouvé ou accès refusé" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};