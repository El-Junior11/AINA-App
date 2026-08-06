const express = require('express');
const router = express.Router();
// Ampiasao ny destructuring mba haka ny modely rehetra
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
        res.status(500).json({ message: "Erreur lors de la récupération des logs" });
    }
});

module.exports = router;