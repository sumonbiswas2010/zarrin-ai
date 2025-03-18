const express = require("express");
require("dotenv").config({ path: __dirname + "/.env" });
const path = require("path");
const moment = require("moment");
const app = express();
// const sequelize = require("./config/sequelize.config");
const config = require("./config/config");
const logger = require("./config/logger");
const ApiError = require("./utils/ApiError");
const { errorConverter, errorHandler } = require("./middlewares/errorHandler");
const morgan = require("./config/morgan");
const PORT = process.env.PORT || config.appPort;
const cors = require("cors");
const routes = require("./routes/v1");
require("./bots/bots");
// require("./server");
// require("./openai");
// require("./socketServer");
// require("./vector");
// app.use(logRequest);
app.use(express.json());

if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}
app.get("/favicon.ico", async (req, res) => {
  res.sendFile(path.resolve("favicon.png"));
});
app.get("/readme", async (req, res) => {
  res.sendFile(path.resolve("README.md"));
});

const memoryData = process.memoryUsage();
const os = require("os");

const formatMemoryUsage = (data) =>
  `${Math.round((data / 1024 / 1024) * 100) / 100} MB`;
const memoryUsage = {
  rss: `${formatMemoryUsage(
    memoryData.rss
  )} -> Resident Set Size - total memory allocated for the process execution`,
  heapTotal: `${formatMemoryUsage(
    memoryData.heapTotal
  )} -> total size of the allocated heap`,
  heapUsed: `${formatMemoryUsage(
    memoryData.heapUsed
  )} -> actual memory used during the execution`,
  external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,
  osFreeRam: formatMemoryUsage(os.freemem()),
  osTotalRam: formatMemoryUsage(os.totalmem()),
};

app.use(cors());
app.options("*", cors());

const serverStatus = {
  app: "Zarrin-AI",
  production: process.env.isProd,
  status: process.env.isLive === "true" ? "UP" : "MAINTENANCE",
  mode: process.env.STAGE,
  version: "0.0.0",
  time: moment(new Date()).format("MMMM Do YYYY, h:mm:ss a"),
  isLive: process.env.isLive === "true",
  sumon: "sumon",
  memoryUsage,
};
!serverStatus.isLive &&
  app.use((req, res, next) => {
    res.status(200).json(serverStatus);
  });
app.get("/", async (req, res) => {
  res.status(200).json(serverStatus);
});
app.use("/v1", routes);
app.use((req, res, next) => {
  next(new ApiError(1001, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);
app.get("/ram", async (req, res) => {
  res.status(200).json(memoryUsage);
});
const server = app.listen(PORT, () => {
  logger.info(`API Gateway is running on http://localhost:${PORT}`);
});
const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});
