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
    // Nampiana ny date_creation eto
    date_creation: {
        type: DataTypes.DATEONLY, // DATEONLY dia mifanaraka amin'ny DATE any amin'ny SQL (YYYY-MM-DD)
        allowNull: true
    }
}, {
    tableName: 'groupes',
    timestamps: true, // Azo atao true raha te hampiasa automatique ny created_at sy updated_at ianao
    createdAt: 'created_at', // Mampifandray ny createdAt amin'ny created_at ao amin'ny Postgres
    updatedAt: 'updated_at'  // Mampifandray ny updatedAt amin'ny updated_at ao amin'ny Postgres
});

module.exports = Groupe;