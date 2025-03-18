/* eslint-disable prettier/prettier */
const { Sequelize } = require("sequelize");
const db = require("../config/sequelize.config");
const Admin = require("./Admin");

const FcmToken = db.define(
  "fcm_token",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    admin_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    device_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    device_token: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    indexes: [
      {
        fields: ["device_id", "admin_id"],
        unique: true,
      },
    ],
  }
);
FcmToken.belongsTo(Admin, { foreignKey: "admin_id" });
// FcmToken.sync({ alter: true });

module.exports = FcmToken;
