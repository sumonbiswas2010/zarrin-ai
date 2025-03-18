/* eslint-disable prefer-destructuring */
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");
const PermissionFeatures = require("../utils/PermissionFeatures");

const token = (req, res, next) => {
  // validate jwt tokens
  let fullToken = req.get("authorization");
  if (!fullToken) {
    throw new ApiError(1002, "No Token Found with Request Header");
  } else if (fullToken.length > 6) {
    fullToken = fullToken.split(" ")[1];
    jwt.verify(fullToken, config.jwt.secret, (err, decoded) => {
      if (err) {
        throw new ApiError(1003, "Invalid Token");
      } else {
        if (decoded.isRefundRequested)
          throw new ApiError(1404, "Refund Requested");
        if (decoded.isDeleteRequested)
          throw new ApiError(1404, "Account Delete Requested");
        req.userData = decoded;
        next();
      }
    });
  } else {
    throw new ApiError(1003, "Unauthorized");
  }
};
const softToken = (req, res, next) => {
  // validate jwt tokens
  let fullToken = req.get("authorization");
  if (!fullToken) {
    throw new ApiError(1002, "No Token Found with Request Header");
  } else if (fullToken.length > 6) {
    fullToken = fullToken.split(" ")[1];
    jwt.verify(fullToken, config.jwt.secret, (err, decoded) => {
      if (err) {
        throw new ApiError(1003, "Invalid Token");
      } else {
        req.userData = decoded;
        next();
      }
    });
  } else {
    throw new ApiError(1003, "Unauthorized");
  }
};
const partnerToken = (req, res, next) => {
  // validate jwt tokens
  let fullToken = req.get("authorization");
  if (!fullToken) {
    throw new ApiError(1002, "No Token Found with Request Header");
  } else if (fullToken.length > 6) {
    fullToken = fullToken.split(" ")[1];
    jwt.verify(fullToken, config.jwt.partnerSecret, (err, decoded) => {
      if (err) {
        throw new ApiError(1003, "Invalid Partner Token");
      } else {
        req.userData = decoded;
        next();
      }
    });
  } else {
    throw new ApiError(1003, "Unauthorized");
  }
};
const optionalToken = (req, res, next) => {
  req.userData = {};
  let fullToken = req.get("authorization");
  if (fullToken) {
    if (fullToken.length > 6) {
      fullToken = fullToken.split(" ")[1];
      jwt.verify(fullToken, config.jwt.secret, (err, decoded) => {
        if (!err) {
          req.userData = decoded;
        }
      });
    }
  }
  next();
};
const adminToken = (req, res, next) => {
  let fullToken = req.get("authorization");
  if (!fullToken) {
    throw new ApiError(1004, "No Token Found with Request Header");
  } else if (fullToken.length > 6) {
    fullToken = fullToken.split(" ")[1];
    jwt.verify(fullToken, config.jwt.adminSecret, (err, decoded) => {
      if (err) {
        throw new ApiError(1005, "Invalid Admin Token");
      } else {
        req.userData = decoded;
        next();
      }
    });
  } else {
    throw new ApiError(1005, "Unauthorized");
  }
};

const permissionCheck = (permission) => {
  return async (req, res, next) => {
    try {
      switch (permission) {
        case PermissionFeatures.Delete:
          if (req.userData.role !== "Owner")
            throw new ApiError(1006, "Unauthorized to delete!");
          break;
        case PermissionFeatures.AddOwner:
          if (req.body.role === "Owner")
            if (req.userData.role !== "Owner")
              throw new ApiError(1006, "Unauthorized to add owner!");
          break;
        default:
          throw new ApiError(1006, "Permission Error!");
          break;
      }

      next();
    } catch (err) {
      return next(new ApiError(err.code, err.message));
    }
  };
};
module.exports = {
  token,
  adminToken,
  optionalToken,
  permissionCheck,
  partnerToken,
  softToken,
};
