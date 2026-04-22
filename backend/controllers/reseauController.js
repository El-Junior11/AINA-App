const Reseau = require('../models/reseauModel');

exports.createReseau = async (req, res) => {
    try {
        const data = { ...req.body, user_id: req.user.user_id }; 
        const reseau = await Reseau.create(data);
        res.status(201).json(reseau);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllReseaux = async (req, res) => {
    try {
        let reseaux;
        
        if (req.user.role === 'admin') {
            reseaux = await Reseau.findAll();
        } else {
            reseaux = await Reseau.findAll({ 
                where: { user_id: req.user.user_id } 
            });
        }
        
        res.status(200).json(reseaux);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateReseau = async (req, res) => {
    try {
        const { id } = req.params;
        
        const filter = req.user.role === 'admin' 
            ? { where: { codeRS: id } } 
            : { where: { codeRS: id, user_id: req.user.user_id } };

        const [updated] = await Reseau.update(req.body, filter);
        
        if (updated === 0) {
            return res.status(403).json({ message: "Autorisation refusée ou réseau non trouvé." });
        }
        
        res.status(200).json({ message: "Mis à jour avec succès !" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteReseau = async (req, res) => {
    try {
        const { id } = req.params;

        const filter = req.user.role === 'admin' 
            ? { where: { codeRS: id } } 
            : { where: { codeRS: id, user_id: req.user.user_id } };

        const deleted = await Reseau.destroy(filter);
        
        if (deleted === 0) {
            return res.status(403).json({ message: "Autorisation refusée ou réseau non trouvé." });
        }

        res.status(200).json({ message: "Supprimé avec succès !" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};