const router=require('express').Router();
const auth=require('../middleware/authMiddleware');
const ctrl=require('../controllers/rapportController');

router.get('/',auth,ctrl.getRapport);
router.put('/objectifs',auth,ctrl.saveObjectif);
router.put('/qualitatifs',auth,ctrl.saveQualitatif);

module.exports=router;