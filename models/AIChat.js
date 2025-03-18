const { Sequelize } = require("sequelize");
const db = require("../config/sequelize.config");

const AIChat = db.define("ai_chat", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  user_id: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  chat: {
    type: Sequelize.JSON,
    allowNull: false,
  },
});

// AIChat.sync({ alter: true });
module.exports = AIChat;
