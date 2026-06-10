const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Lalana marina: fitaomana an'ilay rakitra "authMiddleware.js"
const authMiddleware = require('../middleware/authMiddleware'); 

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Route protégée (Mise à jour du compte)
router.put('/account/settings', authMiddleware, authController.updateProfile);

module.exports = router;