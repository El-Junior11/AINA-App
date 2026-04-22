const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('tsinjo_db', 'postgres', 'elyse2004', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false, // Mba hadio ny terminal
});

// Fitsapana ny fifandraisana
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connexion à PostgreSQL réussie (via Sequelize).');
  } catch (error) {
    console.error('Impossible de se connecter à la base de données:', error);
  }
}

testConnection();

module.exports = sequelize;