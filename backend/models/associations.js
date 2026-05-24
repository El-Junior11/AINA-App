const Membre = require('./membreModel');
const Formation = require('./formationModel');

// Famaritana ny fifandraisana (Association)
Membre.hasOne(Formation, { 
    foreignKey: 'nummembre', 
    as: 'formation' 
});

Formation.belongsTo(Membre, { 
    foreignKey: 'nummembre',
    as: 'membre'
});

module.exports = { Membre, Formation };