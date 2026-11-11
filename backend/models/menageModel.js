const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Menage = sequelize.define('Menage', {

  id_menage: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  commune_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'communes',
      key: 'id_commune'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },

  numero_menage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  }

}, {
  tableName: 'menages',

  timestamps: true,

  createdAt: 'created_at',

  updatedAt: 'updated_at',

  indexes: [
    {
      unique: true,
      fields: ['commune_id', 'numero_menage'],
      name: 'menages_commune_numero_unique'
    }
  ]
});

module.exports = Menage;
