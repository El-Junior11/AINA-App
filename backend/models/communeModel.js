const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Commune = sequelize.define('Commune', {

  id_commune: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  nom_commune: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  dernier_numero_menage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }

}, {
  tableName: 'communes',

  timestamps: true,

  createdAt: 'created_at',

  updatedAt: 'updated_at'
});

module.exports = Commune;