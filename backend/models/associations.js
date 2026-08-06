const Membre = require('./membreModel');
const Formation = require('./formationModel');
const AuditLog = require('./AuditLog');
const User = require('./userModel');

// --- Ny anao efa misy ---
Membre.hasOne(Formation, { 
    foreignKey: 'nummembre', 
    as: 'formation' 
});

Formation.belongsTo(Membre, { 
    foreignKey: 'nummembre',
    as: 'membre'
});

// --- Ampio ity mba tsy hisy error intsony ---
User.hasMany(AuditLog, { 
    foreignKey: 'user_id' 
});

AuditLog.belongsTo(User, { 
    foreignKey: 'user_id' 
});

module.exports = { Membre, Formation, AuditLog, User };