const { Sequelize } = require('sequelize');
const db = require('../config/sequelize.config');
const Admin = require('./Admin');

const AdminOtpAuth = db.define('admin_otp_auth', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  admin_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    unique: true,
  },
  otp: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  expire: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  isVerified: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});
AdminOtpAuth.belongsTo(Admin, { foreignKey: 'admin_id' });
// AdminOtpAuth.sync({ alter: true });
module.exports = AdminOtpAuth;
