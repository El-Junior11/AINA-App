const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Groupe = sequelize.define('Groupe', {

    codegs: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nomgs: {
        type: DataTypes.STRING,
        allowNull: false
    },

    nummenage: {
        type: DataTypes.STRING,
        allowNull: true
    },

    commune: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Commune rattachée au groupe
    commune_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'communes',
            key: 'id_commune'
        }
    },

    fokontany: {
        type: DataTypes.STRING,
        allowNull: true
    },

    village: {
        type: DataTypes.STRING,
        allowNull: true
    },

    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    date_creation: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }

}, {
    tableName: 'groupes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Groupe;
