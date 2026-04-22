const express = require('express');
const router = express.Router();
const reseauController = require('../controllers/reseauController');
const verifyToken = require('../middleware/authMiddleware'); // <--- Ampidiro ity

// Ampio verifyToken daholo ny route rehetra
router.post('/', verifyToken, reseauController.createReseau);
router.get('/', verifyToken, reseauController.getAllReseaux);
router.put('/:id', verifyToken, reseauController.updateReseau);
router.delete('/:id', verifyToken, reseauController.deleteReseau);

module.exports = router;