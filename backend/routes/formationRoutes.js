const express = require('express');
const router = express.Router();
const formationController = require('../controllers/formationController');
const authenticateToken = require('../middleware/authMiddleware'); // Ampio ity

// Ampio authenticateToken amin'ny route rehetra
router.get('/', authenticateToken, formationController.getFormations);
router.post('/save', authenticateToken, formationController.saveFormation);
router.get('/stats-details', authenticateToken, formationController.getDetailedStats);

module.exports = router;