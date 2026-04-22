const Responsable = require('../models/responsableModel');

exports.getResponsables = async (req, res) => {
    try {
        const data = await Responsable.findAll();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addResponsable = async (req, res) => {
    try {
        const { NumMembre, Poste } = req.body;

        let responsable = await Responsable.findOne({ where: { NumMembre } });

        if (responsable) {
            responsable.Poste = Poste;
            await responsable.save();
            return res.json(responsable);
        } else {
            const newRespo = await Responsable.create({
                NumMembre,
                Poste,
                user_id: null 
            });
            return res.status(201).json(newRespo);
        }
    } catch (err) {
        console.error("Error POST:", err);
        res.status(500).json({ error: err.message });
    }
};