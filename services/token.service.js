/* eslint-disable camelcase */
const jwt = require('jsonwebtoken');
const moment = require('moment');
const fs = require('fs');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const { AuthToken, AdminAuthToken, AffiliatePartnerAuthToken } = require('../models');

const generateToken = (
  deviceID,
  userId,
  parent_id,
  team_role,
  admin_id,
  isRefundRequested,
  isDeleteRequested,
  expires,
  type,
  secret = config.jwt.secret,
) => {
  const payload = {
    sub: userId,
    deviceID,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
    parent_id,
    team_role,
    admin_id,
    isRefundRequested,
    isDeleteRequested,
  };
  return jwt.sign(payload, secret);
};
const generatePartnerToken = (deviceID, userId, expires, type, secret = config.jwt.partnerSecret) => {
  const payload = {
    sub: userId,
    deviceID,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};
const generateAdminToken = (deviceID, userId, role, expires, type, secret = config.jwt.adminSecret) => {
  const payload = {
    sub: userId,
    deviceID,
    role,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

const saveToken = async (device_id, accessToken, refreshToken, user_id, expire) => {
  try {
    return await AuthToken.upsert({ refresh_token: refreshToken, access_token: accessToken, expire, user_id, device_id });
  } catch (err) {
    throw new ApiError(1030, 'Error saving token');
  }
};

const saveAdminToken = async (device_id, accessToken, refreshToken, admin_id, expire) => {
  try {
    return await AdminAuthToken.upsert({
      refresh_token: refreshToken,
      access_token: accessToken,
      admin_id,
      device_id,
      expire,
    });
  } catch (err) {
    throw new ApiError(1030, 'Error saving token');
  }
};

const savePartnerToken = async (device_id, accessToken, refreshToken, partner_id, expire) => {
  try {
    return await AffiliatePartnerAuthToken.upsert({
      refresh_token: refreshToken,
      access_token: accessToken,
      expire,
      partner_id,
      device_id,
    });
  } catch (err) {
    throw new ApiError(1030, 'Error saving token');
  }
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await AuthToken.findOne({ where: { refresh_token: token, user_id: payload.sub } });
  if (!tokenDoc) {
    throw new ApiError(1001, 'Token does not exist');
  }
  return tokenDoc;
};
const verifyPartnerToken = async (token) => {
  const payload = jwt.verify(token, config.jwt.partnerSecret);
  const tokenDoc = await AffiliatePartnerAuthToken.findOne({ where: { refresh_token: token, partner_id: payload.sub } });
  if (!tokenDoc) {
    throw new ApiError(1001, 'Token does not exist');
  }
  return tokenDoc;
};
const verifyAdminToken = async (token) => {
  const payload = jwt.verify(token, config.jwt.adminSecret);
  const tokenDoc = await AdminAuthToken.findOne({ where: { refresh_token: token, admin_id: payload.sub } });
  if (!tokenDoc) {
    throw new ApiError(1001, 'Token does not exist');
  }
  return tokenDoc;
};

const verifyAdminResetPassToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt_admin.adminSecret);
  const tokenDoc = await AdminResetPassToken.findOne({ token, type, admin_id: payload.sub, blacklisted: false });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (
  user_id,
  deviceID,
  parent_id,
  team_role,
  admin_id,
  isRefundRequested,
  isDeleteRequested,
) => {
  // generate auth tokens with proper expiration time
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(
    deviceID,
    user_id,
    parent_id,
    team_role,
    admin_id,
    isRefundRequested,
    isDeleteRequested,
    accessTokenExpires,
    tokenTypes.ACCESS,
  );

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(
    deviceID,
    user_id,
    parent_id,
    team_role,
    admin_id,
    isRefundRequested,
    isDeleteRequested,
    refreshTokenExpires,
    tokenTypes.REFRESH,
  );
  await saveToken(deviceID, accessToken, refreshToken, user_id, refreshTokenExpires);
  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

const generateAdminAuthTokens = async (user, deviceID) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateAdminToken(deviceID, user.id, user.role, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateAdminToken(deviceID, user.id, user.role, refreshTokenExpires, tokenTypes.REFRESH);
  await saveAdminToken(deviceID, accessToken, refreshToken, user.id, refreshTokenExpires);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

const generatePartnerAuthTokens = async (user_id, deviceID) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generatePartnerToken(deviceID, user_id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generatePartnerToken(deviceID, user_id, refreshTokenExpires, tokenTypes.REFRESH);

  await savePartnerToken(deviceID, accessToken, refreshToken, user_id, refreshTokenExpires);
  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

module.exports = {
  generateToken,
  generateAdminToken,
  saveToken,
  saveAdminToken,
  verifyToken,
  verifyAdminToken,
  verifyAdminToken,
  generateAuthTokens,
  generateAdminAuthTokens,
  generatePartnerAuthTokens,
  verifyAdminResetPassToken,
  verifyPartnerToken,
};
