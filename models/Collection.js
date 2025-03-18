const { Sequelize } = require("sequelize");
const db = require("../config/sequelize.config");

const Collection = db.define("collection", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  native_id: {
    type: Sequelize.BIGINT,
    allowNull: false,
    unique: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  url: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  products_count: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isProcessed: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

// Collection.sync({ alter: true });
module.exports = Collection;
