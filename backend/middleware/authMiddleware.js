const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Token non fourni" });
  }

  // Jereo tsara eto: JWT_SECRET no ampiasaina fa tsy ACCESS_TOKEN_SECRET
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("JWT Verify Error:", err.message); // Hiseho ao amin'ny terminal backend ity
      return res.status(403).json({ message: "Session expirée ou Token invalide" });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;