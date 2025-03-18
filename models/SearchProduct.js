const { Sequelize } = require("sequelize");
const db = require("../config/sequelize.config");

const SearchProduct = db.define("search_product", {
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
  products: {
    type: Sequelize.JSON,
    allowNull: false,
  },
});

// SearchProduct.sync({ alter: true });
module.exports = SearchProduct;
