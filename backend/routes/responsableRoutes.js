const express = require('express');
const router = express.Router();
const responsableController = require('../controllers/responsableController');

// Ireto sisa no mandeha
router.get('/', responsableController.getResponsables);
router.post('/', responsableController.addResponsable);

module.exports = router;