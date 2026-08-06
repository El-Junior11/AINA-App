const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    table_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    action_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    target_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = AuditLog;