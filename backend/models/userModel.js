const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define(
  'User',
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user',
      validate: {
        isIn: [['admin', 'user']]
      }
    },

    commune_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'communes',
        key: 'id_commune'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },

    status: {
      type: DataTypes.ENUM(
        'en_attente',
        'accepte',
        'refuse'
      ),
      allowNull: false,
      defaultValue: 'en_attente'
    }
  },
  {
    tableName: 'users',
    timestamps: false
  }
);

module.exports = User;
