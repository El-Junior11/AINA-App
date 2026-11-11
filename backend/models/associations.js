const Membre = require('./membreModel');
const Formation = require('./formationModel');
const AuditLog = require('./AuditLog');
const User = require('./userModel');

const Commune = require('./communeModel');
const Menage = require('./menageModel');
const Groupe = require('./Groupe');

// ========================================
// COMMUNE - UTILISATEURS
// ========================================

Commune.hasMany(User, {
  foreignKey: 'commune_id',
  as: 'utilisateurs'
});

User.belongsTo(Commune, {
  foreignKey: 'commune_id',
  as: 'commune'
});

// ========================================
// COMMUNE - GROUPES
// ========================================

Commune.hasMany(Groupe, {
  foreignKey: 'commune_id',
  as: 'groupes'
});

Groupe.belongsTo(Commune, {
  foreignKey: 'commune_id',
  as: 'communeAssociee'
});

// ========================================
// COMMUNE - MENAGES
// ========================================

Commune.hasMany(Menage, {
  foreignKey: 'commune_id',
  as: 'menages'
});

Menage.belongsTo(Commune, {
  foreignKey: 'commune_id',
  as: 'commune'
});

// ========================================
// COMMUNE - MEMBRES
// ========================================

Commune.hasMany(Membre, {
  foreignKey: 'commune_id',
  as: 'membres'
});

Membre.belongsTo(Commune, {
  foreignKey: 'commune_id',
  as: 'commune'
});

// ========================================
// MENAGE - MEMBRES
// ========================================

Menage.hasMany(Membre, {
  foreignKey: 'id_menage',
  as: 'membres'
});

Membre.belongsTo(Menage, {
  foreignKey: 'id_menage',
  as: 'menage'
});

// ========================================
// UTILISATEUR - MEMBRES
// ========================================

User.hasMany(Membre, {
  foreignKey: 'user_id',
  as: 'membres'
});

Membre.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'utilisateur'
});

// ========================================
// MEMBRE - FORMATION
// Associations existantes
// ========================================

Membre.hasOne(Formation, {
  foreignKey: 'nummembre',
  as: 'formation'
});

Formation.belongsTo(Membre, {
  foreignKey: 'nummembre',
  as: 'membre'
});

// ========================================
// UTILISATEUR - AUDIT LOGS
// Associations existantes
// ========================================

User.hasMany(AuditLog, {
  foreignKey: 'user_id'
});

AuditLog.belongsTo(User, {
  foreignKey: 'user_id'
});

// ========================================
// EXPORT DES MODELS
// ========================================

module.exports = {
  Commune,
  Menage,
  Groupe,
  Membre,
  Formation,
  AuditLog,
  User
};
