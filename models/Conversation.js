const { Sequelize } = require("sequelize");
const db = require("../config/sequelize.config");
const SearchProduct = require("./SearchProduct");

const Conversation = db.define("conversation", {
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
  task: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  role: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  parts: {
    type: Sequelize.JSON,
    allowNull: false,
  },
  search_products_id: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
});

Conversation.belongsTo(SearchProduct, {
  foreignKey: "search_products_id",
});

// Conversation.sync({ alter: true });
module.exports = Conversation;
