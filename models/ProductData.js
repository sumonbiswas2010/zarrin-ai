// const { Sequelize } = require("sequelize");
// const db = require("../config/sequelize.config");
// const WebURL = require("./WebURL");

// const ProductData = db.define("product_data", {
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
//   title: {
//     type: Sequelize.STRING,
//     allowNull: false,
//   },
//   price: {
//     type: Sequelize.FLOAT,
//     allowNull: false,
//   },
//   description: {
//     type: Sequelize.TEXT,
//     allowNull: false,
//     defaultValue: false,
//   },
//   isVectored: {
//     type: Sequelize.BOOLEAN,
//     allowNull: false,
//     defaultValue: false,
//   },
// });
// ProductData.belongsTo(WebURL, { foreignKey: "url_id" });
// // const sync = async () => {
// //   try {
// //     await ProductData.sync({ alter: true });
// //     console.log("✅ ProductData Table is Ready");
// //   } catch (err) {
// //     console.error("❌ Error setting up ProductData table:", err);
// //   }
// // };
// // sync();
// module.exports = ProductData;
