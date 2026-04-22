const express = require('express');
const router = express.Router();
const groupeController = require('../controllers/groupeController');
const authenticateToken = require('../middleware/authMiddleware'); // Ampio ity

// Ampio authenticateToken amin'ny POST, PUT, ary DELETE farafahakeliny
router.get('/', groupeController.getAllGroupes);
router.get('/menages-list', groupeController.getDistinctMenages);
router.get('/:id', groupeController.getGroupeById);

router.post('/', authenticateToken, groupeController.createGroupe); // Eto
router.put('/:id', authenticateToken, groupeController.updateGroupe); // Eto
router.delete('/:id', authenticateToken, groupeController.deleteGroupe); // Eto

module.exports = router;