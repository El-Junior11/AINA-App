
const express = require('express');
const router = express.Router();

const { AuditLog, User } = require('../models/associations');

router.get('/', async (req, res) => {
    try {
        const logs = await AuditLog.findAll({
            include: [{
                model: User,
                attributes: ['name']
            }],
            order: [['created_at', 'DESC']],
            limit: 50
        });

        res.json(logs);
    } catch (error) {
        console.error("Audit Fetch Error:", error);

        res.status(500).json({
            message: "Erreur lors de la récupération des logs"
        });
    }
});

router.post('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const log = await AuditLog.findByPk(id);

        if (!log) {
            return res.status(404).json({
                message: "Trace d'audit introuvable"
            });
        }

        await log.destroy();

        res.status(200).json({
            message: "Trace supprimée avec succès"
        });
    } catch (error) {
        console.error("Audit Delete Error:", error);

        res.status(500).json({
            message: "Erreur lors de la suppression de la trace"
        });
    }
});

module.exports = router;
