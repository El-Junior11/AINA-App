const router = require('express').Router();
const controller = require('../controllers/formationController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.get('/', controller.getFormations);
router.get('/stats-details', controller.getDetailedStats);
router.post('/save', controller.saveFormation);

module.exports = router;