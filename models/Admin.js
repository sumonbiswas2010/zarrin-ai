const { Sequelize } = require("sequelize");
const db = require("../config/sequelize.config");

const Admin = db.define(
  "admin",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    username: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    role: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    dob: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    photo_url: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    city: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    address: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    postal_code: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    isVerified: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    last_login: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  {
    paranoid: true,
  }
);
// Admin.sync({ alter: true });
module.exports = Admin;
