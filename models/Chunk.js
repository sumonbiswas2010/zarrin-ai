// const { Sequelize, DataTypes, Model } = require("sequelize");
// const db = require("../config/sequelize.config");
// const ProductData = require("./ProductData");

// const Chunk = db.define("chunk", {
//   id: {
//     type: Sequelize.INTEGER,
//     autoIncrement: true,
//     allowNull: false,
//     primaryKey: true,
//   },
//   product_id: {
//     type: Sequelize.INTEGER,
//     allowNull: false,
//     unique: true,
//   },
//   title: {
//     type: DataTypes.STRING,
//   },
//   price: {
//     type: Sequelize.FLOAT,
//     allowNull: false,
//   },
//   section: {
//     type: DataTypes.STRING,
//   },
//   text: {
//     type: DataTypes.TEXT,
//   },

//   embedding: {
//     type: DataTypes.TEXT, // Temporary TEXT field for Sequelize
//     allowNull: false,
//     set(value) {
//       if (Array.isArray(value)) {
//         this.setDataValue("embedding", `[${value.join(",")}]`); // Store as vector format
//       } else {
//         throw new Error("Embedding must be an array of floats.");
//       }
//     },
//     get() {
//       const rawValue = this.getDataValue("embedding");
//       return rawValue ? rawValue.slice(1, -1).split(",").map(parseFloat) : null;
//     },
//   },
//   metadata: {
//     type: DataTypes.JSON,
//   },
// });

// // ✅ Foreign Key Relationship
// Chunk.belongsTo(ProductData, { foreignKey: "product_id" });

// // (async () => {
// //   try {
// //     await Chunk.sync({ alter: true });
// //     await db.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
// //     await db.query(
// //       `ALTER TABLE "chunks" ALTER COLUMN embedding TYPE vector(1536) USING embedding::vector;`
// //     );
// //     console.log("✅ Vector Table is Ready with Correct Type");
// //   } catch (err) {
// //     console.error("❌ Error setting up vector table:", err);
// //   }
// // })();

// module.exports = Chunk;
