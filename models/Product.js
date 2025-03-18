const { Sequelize } = require("sequelize");
const db = require("../config/sequelize.config");

const Product = db.define("product", {
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
  url: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  clean_description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  vendor: {
    type: Sequelize.STRING,
  },
  product_type: {
    type: Sequelize.STRING,
  },
  tags: {
    type: Sequelize.JSON,
  },
  price: {
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  image_url: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  per_day_capacity: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  per_hour_capacity: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  per_batch_capacity: {
    type: Sequelize.FLOAT,
    allowNull: true,
  },
  is_new: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  isProcessed: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

// Product.sync({ alter: true });
module.exports = Product;
