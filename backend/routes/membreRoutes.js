const router = require('express').Router();
const controller = require('../controllers/membreController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.get('/', controller.getMembres);
router.post('/', controller.addMembre);
router.put('/:id', controller.updateMembre);
router.delete('/:id', controller.deleteMembre);

module.exports = router;