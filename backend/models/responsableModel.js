const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./userModel');

const Responsable = sequelize.define('Responsable', {
    CodeRp: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        field: 'CodeRp'
    },
    NumMembre: {
        type: DataTypes.INTEGER(50),
        allowNull: false,
        field: 'NumMembre'
    },
    Poste: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'Poste'
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Ahitsio ho true mba tsy hisy Error 500 rehefa tsy misy user
        field: 'user_id',
        references: {
            model: 'users',
            key: 'user_id'
        }
    }
}, {
    tableName: 'responsables',
    timestamps: true,
    underscored: true
});

Responsable.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Responsable;