const jwt = require('jsonwebtoken');
const { validate: uuidValidate } = require('uuid');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const AdminRoles = ['admin', 'support', 'accountant', 'template'];

// const checkUserMakeSub = async (req, res, next) => {
//   try {
//     const { user } = req.query;
//     if (user) {
//       if (isNaN(user)) throw new ApiError(0, 'Invalid User ID');
//       req.userData = { sub: user };
//       next();
//     } else {
//       throw new ApiError(0, 'User ID Not found');
//     }
//   } catch (err) {
//     return next(new ApiError(0, err.message));
//   }
// };
const register = (req, res, next) => {
  const { body } = req;
  if (
    body.hasOwnProperty('name') &&
    body.hasOwnProperty('email') &&
    body.hasOwnProperty('password') &&
    body.hasOwnProperty('role')
  ) {
    if (body.name.length > 2 && body.email.length > 3 && body.password.length > 0) {
      if (!AdminRoles.includes(body.role)) throw new ApiError(3538, 'Invalid Role');
      const value = body.password;
      if (value.length < 6) {
        throw new ApiError(3539, 'Password Must be at least 6 characters long');
      }
      // if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
      //   throw new ApiError(1003, 'Password Must Contain one number and one letter');
      // }
      if (body.username) {
        if (body.username.length < 5) {
          throw new ApiError(3540, 'Username should be at least 5 characters');
        }
        if (body.username.match(/[ ]/)) {
          throw new ApiError(3540, 'Username should not contain spaces');
        }
      }

      const regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (body.email.match(regexEmail)) {
        next();
      } else {
        throw new ApiError(3541, 'Invalid Email');
      }
    } else {
      throw new ApiError(3542, 'Invalid Input');
    }
  } else {
    throw new ApiError(3542, 'Required Data Error');
  }
};
const login = (req, res, next) => {
  const { body } = req;
  if (body.hasOwnProperty('email') && body.hasOwnProperty('password') && body.hasOwnProperty('deviceID')) {
    const regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (body.email.match(regexEmail)) {
      if (!uuidValidate(req.body.deviceID)) throw new ApiError(3543, 'Invalid Device ID');
      next();
    } else {
      throw new ApiError(3541, 'Invalid Email');
    }
  } else {
    throw new ApiError(3544, 'Required Data Error');
  }
};
const updateAdminById = async (req, res, next) => {
  try {
    const { params } = req;
    const { body } = req;
    if (
      body.hasOwnProperty('name') ||
      body.hasOwnProperty('address') ||
      body.hasOwnProperty('username') ||
      body.hasOwnProperty('password') ||
      body.hasOwnProperty('device_token') ||
      body.hasOwnProperty('city') ||
      body.hasOwnProperty('photo_url') ||
      body.hasOwnProperty('postal_code') ||
      body.hasOwnProperty('isVerified')
    ) {
      if (body.hasOwnProperty('device_token')) {
        if (!body.hasOwnProperty('deviceID')) throw new ApiError(3545, 'Device ID Required');
        if (!uuidValidate(req.body.deviceID)) throw new ApiError(3543, 'Invalid Device ID');
      }
      if (body.password) {
        const value = body.password;
        if (value.length < 6) {
          throw new ApiError(3539, 'Password Must be at least 6 characters long');
        }
      }
      if (body.username) {
        if (body.username.length < 5) {
          throw new ApiError(3540, 'Username should be at least 5 characters');
        }
        if (body.username.match(/[ ]/)) {
          throw new ApiError(3540, 'Username should not contain spaces');
        }
      }
      if (body.email) {
        const regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!body.email.match(regexEmail)) {
          throw new ApiError(3541, 'Invalid Email');
        }
      }
      next();
    } else {
      throw new ApiError(3546, 'Required Data Error');
    }
  } catch (err) {
    return next(new ApiError(err.code, err.message));
  }
};
const resetPassword = (req, res, next) => {
  const { body } = req;
  if (body.hasOwnProperty('password') && body.hasOwnProperty('confirm_password')) {
    if (body.password.length > 0) {
      const value = body.password;
      if (value.length < 6) {
        throw new ApiError(3539, 'Password Must be at least 6 characters long');
      }
      if (req.body.password !== req.body.confirm_password) return next(new ApiError(3547, 'Password Did not match'));
      next();
    } else {
      return next(new ApiError(3539, 'Invalid input'));
    }
  } else {
    return next(new ApiError(3548, 'Required Data Error'));
  }
};
const checkEmailPhoneUserName = (req, res, next) => {
  const { body } = req;
  const { username, email, phone } = body;
  if (username || email || phone) {
    next();
  } else {
    return next(new ApiError(3549, 'You must provide username or email or phone number'));
  }
};
const otpSize = (req, res, next) => {
  const { body } = req;
  if (body.hasOwnProperty('otp')) {
    if (!isNaN(body.otp)) {
      if (body.otp > 99999 && body.otp < 1000000) {
        next();
      } else {
        return next(new ApiError(3028, 'OTP Must be 6 digits integer'));
      }
    } else {
      return next(new ApiError(3028, 'OTP Must contains numeric numbers'));
    }
  } else {
    return next(new ApiError(3028, 'Required Data Error'));
  }
};
const refreshToken = (req, res, next) => {
  const { body } = req;
  if (body.hasOwnProperty('refreshToken')) {
    next();
  } else {
    throw new ApiError(3550, 'Required Data Error');
  }
};
module.exports = {
  refreshToken,
  checkEmailPhoneUserName,
  login,
  register,
  updateAdminById,
  otpSize,
  resetPassword,
  // checkUserMakeSub,
};
