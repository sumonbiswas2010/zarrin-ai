class ApiError extends Error {
  constructor(code = 0, message, data, isOperational = true, stack = '') {
    super(message);
    this.code = code;
    if (code === 404) this.statusCode = 404;
    else this.statusCode = 400;
    this.data = data;
    this.message = message;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
