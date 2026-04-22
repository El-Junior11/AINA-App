const express = require('express');
const router = express.Router();
const membreController = require('../controllers/membreController');



const authenticateToken = require('../middleware/authMiddleware'); 

router.get('/', authenticateToken, membreController.getMembres);
router.post('/', authenticateToken, membreController.addMembre);
router.put('/:id', authenticateToken, membreController.updateMembre);
router.delete('/:id', authenticateToken, membreController.deleteMembre);

module.exports = router;