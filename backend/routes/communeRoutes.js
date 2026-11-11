const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');
const { getCommunes, getCommuneById, createCommune, updateCommune } = require('../controllers/communeController');

router.use(authenticateToken, authorizeRoles('admin'));
router.get('/', getCommunes);
router.get('/:id', getCommuneById);
router.post('/', createCommune);
router.put('/:id', updateCommune);

module.exports = router;