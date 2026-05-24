const express = require('express');
const router = express.Router();
const groupeController = require('../controllers/groupeController');
const authenticateToken = require('../middleware/authMiddleware'); // Ampio ity

// Ampio amin'ny GET rehetra ny authenticateToken
router.get('/', authenticateToken, groupeController.getAllGroupes);
router.get('/menages-list', authenticateToken, groupeController.getDistinctMenages);
router.get('/:id', authenticateToken, groupeController.getGroupeById);

router.post('/', authenticateToken, groupeController.createGroupe);
router.put('/:id', authenticateToken, groupeController.updateGroupe);
router.delete('/:id', authenticateToken, groupeController.deleteGroupe);

module.exports = router;