const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Membre = sequelize.define('Membre', {
  nummembre: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true 
  },
  nom_membre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    set(val) {
      if (val) this.setDataValue('nom_membre', val.toUpperCase());
    }
  },
  prenom_membre: {
    type: DataTypes.STRING(255)
  },
  annee_naissance: {
    type: DataTypes.INTEGER
  },
  sexe: {
    type: DataTypes.STRING(10)
  },
  chef: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  num_menage: {
    type: DataTypes.STRING(100)
  },
  // Lazaina amin'ny Sequelize fa 'created_at' no anaran'ilay column any amin'ny DB
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at', 
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'membres',
  // ITY NO TENA IZY:
  timestamps: true,   
  updatedAt: false,    
  underscored: true    
});

module.exports = Membre;