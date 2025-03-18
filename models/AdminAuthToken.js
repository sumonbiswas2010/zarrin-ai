const { Sequelize } = require('sequelize');
const db = require('../config/sequelize.config');
const Admin = require('./Admin');

const AdminAuthToken = db.define(
  'admin_auth_token',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    admin_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    device_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    access_token: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    refresh_token: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    expire: {
      type: Sequelize.DATE,
      defaultValue: new Date(),
      allowNull: false,
    },
  },
  {
    indexes: [
      {
        fields: ['device_id', 'admin_id'],
        unique: true,
      },
    ],
  }
);
AdminAuthToken.belongsTo(Admin, { foreignKey: 'admin_id' });
// AdminAuthToken.sync({ alter: true });
module.exports = AdminAuthToken;
