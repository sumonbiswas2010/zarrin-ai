const { Sequelize, DataTypes, Model } = require("sequelize");
const db = require("../config/sequelize.config");
const Product = require("./Product");

const Vector = db.define("vector", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  product_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  embedding: {
    type: DataTypes.TEXT, // Temporary TEXT field for Sequelize
    allowNull: false,
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue("embedding", `[${value.join(",")}]`); // Store as vector format
      } else {
        throw new Error("Embedding must be an array of floats.");
      }
    },
    get() {
      const rawValue = this.getDataValue("embedding");
      return rawValue ? rawValue.slice(1, -1).split(",").map(parseFloat) : null;
    },
  },
});

// ✅ Foreign Key Relationship
Vector.belongsTo(Product, { foreignKey: "product_id" });

// (async () => {
//   try {
//     await Vector.sync({ alter: true });
//     await db.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
//     await db.query(
//       `ALTER TABLE "vectors" ALTER COLUMN embedding TYPE vector(1536) USING embedding::vector;`
//     );
//     console.log("✅ Vector Table is Ready with Correct Type");
//   } catch (err) {
//     console.error("❌ Error setting up vector table:", err);
//   }
// })();

module.exports = Vector;
