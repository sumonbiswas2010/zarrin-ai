const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  skipSuccessfulRequests: true,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // Limit each IP to 2 create account requests per `window` (here, per hour)
  message: 'Too many accounts created from this IP, please try again after an hour',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
module.exports = {
  authLimiter,
};
