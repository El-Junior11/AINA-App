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
  allowNull: false,
  references: {
    model: 'users',
    key: 'user_id'
  }
},

  // Commune à laquelle appartient le membre
  commune_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'communes',
      key: 'id_commune'
    }
  },

  // Ménage auquel appartient le membre
  id_menage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'menages',
      key: 'id_menage'
    }
  },

  nom_membre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    set(val) {
      if (val) {
        this.setDataValue('nom_membre', val.toUpperCase());
      }
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

  // Numéro du ménage conservé pour compatibilité
  num_menage: {
    type: DataTypes.STRING(100)
  },

  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  }

}, {
  tableName: 'membres',
  timestamps: true,
  updatedAt: false,
  underscored: true
});

module.exports = Membre;
