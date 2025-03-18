const { Sequelize } = require("sequelize");
const pg = require("pg");
// require('pgvector')(Sequelize); // Enable pgvector support
const logger = require("./logger");
const config = require("./config");
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectModule: pg, // I've added this.
    logging: false,
    // dialectOptions: {
    //   ssl: {
    //     require: true,
    //     rejectUnauthorized: false,
    //   },
    // },
  }
);

if (config.env !== "test") {
  sequelize
    .authenticate()
    .then(() => logger.info("Connected to Database server"))
    .catch((err) =>
      logger.warn(`Unable to connect to database server. Error: ${err}`)
    );
}
module.exports = sequelize;
