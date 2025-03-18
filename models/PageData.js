// const { Sequelize } = require("sequelize");
// const db = require("../config/sequelize.config");
// const WebURL = require("./WebURL");

// const PageData = db.define("page_data", {
//   id: {
//     type: Sequelize.INTEGER,
//     autoIncrement: true,
//     allowNull: false,
//     primaryKey: true,
//   },
//   url_id: {
//     type: Sequelize.INTEGER,
//     allowNull: false,
//     unique: true,
//   },
//   data: {
//     type: Sequelize.TEXT,
//     allowNull: false,
//     defaultValue: false,
//   },
//   ai_msg_id: {
//     type: Sequelize.STRING,
//   },
// });
// PageData.belongsTo(WebURL, { foreignKey: "url_id" });
// // PageData.sync({ alter: true });
// module.exports = PageData;
