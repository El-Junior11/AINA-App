const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentification requise.'
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: 'Token manquant.'
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET non configuré.');

      return res.status(500).json({
        message: 'Erreur de configuration du serveur.'
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, secret, {
        algorithms: ['HS256']
      });
    } catch (error) {
      return res.status(401).json({
        message: 'Session expirée ou token invalide.'
      });
    }

    if (!decoded.user_id) {
      return res.status(401).json({
        message: 'Token invalide.'
      });
    }

    const user = await User.findByPk(decoded.user_id, {
      attributes: [
        'user_id',
        'name',
        'email',
        'role',
        'status',
        'commune_id'
      ]
    });

    if (!user) {
      return res.status(401).json({
        message: 'Utilisateur introuvable.'
      });
    }

    if (user.status !== 'accepte') {
      return res.status(403).json({
        message: 'Compte non autorisé.'
      });
    }

    if (user.role === 'user' && !user.commune_id) {
      return res.status(403).json({
        message: "Aucune commune n'est attribuée à votre compte."
      });
    }

    req.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      commune_id: user.commune_id
    };

    next();

  } catch (error) {
    console.error('Erreur authentification:', error.message);

    return res.status(500).json({
      message: "Erreur interne lors de l'authentification."
    });
  }
};

module.exports = authenticateToken;
