const express = require('express');
const router = express.Router();
const responsableController = require('../controllers/responsableController');
const authenticateToken = require('../middleware/authMiddleware'); // Ampio ity

// Tsy maintsy mandalo authenticateToken vao mahita data
router.get('/', authenticateToken, responsableController.getResponsables);
router.post('/', authenticateToken, responsableController.addResponsable);

module.exports = router;