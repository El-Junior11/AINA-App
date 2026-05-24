const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Token non fourni (Accès refusé)" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      console.error("JWT Verify Error:", err.message);
      return res.status(403).json({ message: "Session expirée ou Token invalide" });
    }

    console.log("--- Auth Check ---");
    console.log("Utilisateur connecté:", decodedUser);
    console.log("------------------");

    req.user = decodedUser;
    next();
  });
};

module.exports = authenticateToken;