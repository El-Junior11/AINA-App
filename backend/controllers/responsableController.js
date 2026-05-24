const Responsable = require('../models/responsableModel');

// --- LECTURE (READ ALL) ---
exports.getResponsables = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Non autorisé" });

        // Sivana: Admin mahita ny rehetra, User mahita ny azy ihany
        const filter = req.user.role === 'admin' 
            ? {} 
            : { user_id: req.user.user_id };

        const data = await Responsable.findAll({
            where: filter,
            order: [['NumMembre', 'ASC']]
        });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- CRÉATION / MISE À JOUR (UPSERT) ---
exports.addResponsable = async (req, res) => {
    try {
        // Alaina avy amin'ny token ny user_id fa tsy avy amin'ny body intsony (fiarovana)
        const { NumMembre, Poste } = req.body;
        const currentUserId = req.user.user_id;

        if (!NumMembre || !Poste) {
            return res.status(400).json({ error: "NumMembre et Poste sont requis" });
        }

        // Fiarovana: Jereo raha manana alalana amin'io NumMembre io ilay User
        // Raha User tsotra izy, tsy afaka manendry responsable raha tsy azy ilay Membre
        let queryOptions = req.user.role === 'admin' 
            ? { where: { NumMembre } } 
            : { where: { NumMembre, user_id: currentUserId } };

        let responsable = await Responsable.findOne(queryOptions);

        if (responsable) {
            // Raha efa misy dia havaozina ny Poste sy ny user_id nanao ny fanovana
            responsable.Poste = Poste;
            responsable.user_id = currentUserId; 
            await responsable.save();
            return res.json({ message: "Responsable mis à jour", data: responsable });
        } else {
            // Mamorona vaovao
            const newRespo = await Responsable.create({
                NumMembre,
                Poste,
                user_id: currentUserId
            });
            return res.status(201).json({ message: "Responsable ajouté", data: newRespo });
        }
    } catch (err) {
        console.error("Error POST Responsable:", err);
        res.status(500).json({ error: err.message });
    }
};

// --- SUPPRESSION (DELETE) ---
exports.deleteResponsable = async (req, res) => {
    try {
        const { id } = req.params; // id eto dia ny NumMembre

        const filter = req.user.role === 'admin' 
            ? { NumMembre: id } 
            : { NumMembre: id, user_id: req.user.user_id };

        const deleted = await Responsable.destroy({ where: filter });

        if (deleted === 0) {
            return res.status(403).json({ error: "Non trouvé ou accès refusé" });
        }

        res.json({ message: "Responsable supprimé avec succès" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};