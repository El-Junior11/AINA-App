const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Reseau = sequelize.define('Reseau', {
    codeRS: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    NomRS: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    NomGS: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    DateCreation: {
        type: DataTypes.DATEONLY
    },
    Activite: {
        type: DataTypes.STRING(10),
        defaultValue: 'Non',
        validate: {
            isIn: [['Oui', 'Non']]
        }
    },
    Plaidoyer: {
        type: DataTypes.STRING(10),
        defaultValue: 'Non',
        validate: {
            isIn: [['Oui', 'Non']]
        }
    },
    Plan: {
        type: DataTypes.STRING(10),
        defaultValue: 'Non',
        validate: {
            isIn: [['Oui', 'Non']]
        }
    },
    Autonomie: {
        type: DataTypes.STRING(10),
        defaultValue: 'Non',
        validate: {
            isIn: [['Oui', 'Non']]
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        }
    }
}, {
    tableName: 'reseaux',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Reseau;