const { Sequelize } = require("sequelize");
const db = require("../config/sequelize.config");

const ErrorLog = db.define("error_log", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  key:{
    type: Sequelize.STRING,
    allowNull: false,
  },
  data:{
    type: Sequelize.JSON,
    allowNull: false,
  }
  
});

// ErrorLog.sync({ alter: true });
module.exports = ErrorLog;
