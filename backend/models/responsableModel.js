const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./userModel');

const Responsable = sequelize.define('Responsable', {
  CodeRp: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'CodeRp' },
  NumMembre: { type: DataTypes.INTEGER, allowNull: false, field: 'NumMembre' },
  Poste: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'Membre', field: 'Poste' },
  codegs: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'groupes', key: 'codegs' } },
  commune_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'communes', key: 'id_commune' } },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'user_id' } }
}, {
  tableName: 'responsables',
  timestamps: true,
  underscored: true
});

Responsable.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Responsable;