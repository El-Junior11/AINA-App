const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');
const { getUsers, updateUserCommune, deleteUser } = require('../controllers/adminUserController');

router.use(authenticateToken, authorizeRoles('admin'));

router.get('/', getUsers);
router.put('/:id/commune', updateUserCommune);
router.delete('/:id', deleteUser);

module.exports = router;