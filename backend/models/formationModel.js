const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Hamarino ny lalan'ny db config-nao

const Formation = sequelize.define('Formation', {
    codeformation: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nummembre: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'membres', key: 'nummembre' }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'user_id' }
    },
    // Modules fiofanana
    gestionsimplifiee: { type: DataTypes.BOOLEAN, defaultValue: false },
    agrosol: { type: DataTypes.BOOLEAN, defaultValue: false },
    agroeco: { type: DataTypes.BOOLEAN, defaultValue: false },
    agroeau: { type: DataTypes.BOOLEAN, defaultValue: false },
    agrovegetaux: { type: DataTypes.BOOLEAN, defaultValue: false },
    productionsemence: { type: DataTypes.BOOLEAN, defaultValue: false },
    nutrition: { type: DataTypes.BOOLEAN, defaultValue: false },
    nutritioneau: { type: DataTypes.BOOLEAN, defaultValue: false },
    nutritionalimentaire: { type: DataTypes.BOOLEAN, defaultValue: false },
    conservationproduit: { type: DataTypes.BOOLEAN, defaultValue: false },
    transformationproduit: { type: DataTypes.BOOLEAN, defaultValue: false },
    genre: { type: DataTypes.BOOLEAN, defaultValue: false },
    epracc: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    autre: { type: DataTypes.TEXT },
    autonomie: { type: DataTypes.INTEGER, defaultValue: 0 },
    deleted_at: { type: DataTypes.DATE }
}, {
    tableName: 'formations',
    timestamps: false, // Satria efa misy deleted_at tanana
    underscored: true
});

module.exports = Formation;