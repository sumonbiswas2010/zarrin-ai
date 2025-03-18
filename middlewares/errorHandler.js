/* eslint-disable prefer-const */
/* eslint-disable no-shadow */
const httpStatus = require("http-status");
const config = require("../config/config");
const logger = require("../config/logger");
const ApiError = require("../utils/ApiError");
const { error, success } = require("../utils/ApiResponse");

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || httpStatus.BAD_REQUEST;
    const message = error.message || httpStatus[statusCode];
    const { data } = error;
    const { code } = error;
    error = new ApiError(code, message, data, false, err.stack, statusCode);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { code, message, statusCode } = err;

  if (config.env === "production" && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  if (config.env === "development") {
    logger.error(err);
  }
  if (code === 420) {
    res.status(httpStatus.OK).send(success(true, "No Data Updated"));
  } else res.status(statusCode).send(error(code, message));
};

module.exports = {
  errorConverter,
  errorHandler,
};
