const express = require('express');
const router = express.Router();
const controller = require('../controllers/responsableController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', controller.getResponsables);
router.post('/', controller.addResponsable);
router.put('/:id', controller.updateResponsable);
router.delete('/:id', controller.deleteResponsable);

module.exports = router;