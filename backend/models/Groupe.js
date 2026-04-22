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
        type: DataTypes.STRING, // Tehirizina ho string (ohatra: "M01, M02")
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
    }
}, {
    tableName: 'groupes', // Anaran'ny tabilao ao amin'ny Postgres
    timestamps: false
});

module.exports = Groupe;