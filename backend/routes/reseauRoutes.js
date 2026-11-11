const express = require('express');
const router = express.Router();
const controller = require('../controllers/reseauController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/',verifyToken,controller.getAllReseaux);
router.get('/:id',verifyToken,controller.getReseauById);
router.post('/',verifyToken,controller.createReseau);
router.put('/:id',verifyToken,controller.updateReseau);
router.delete('/:id',verifyToken,controller.deleteReseau);

module.exports = router;