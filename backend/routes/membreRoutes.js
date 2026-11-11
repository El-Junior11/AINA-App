const router = require('express').Router();
const controller = require('../controllers/groupeController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.get('/', controller.getAllGroupes);
router.get('/menages-list', controller.getDistinctMenages);
router.get('/:id/membres', controller.getGroupeMembres);
router.get('/:id', controller.getGroupeById);
router.post('/', controller.createGroupe);
router.put('/:id', controller.updateGroupe);
router.delete('/:id', controller.deleteGroupe);

module.exports = router;