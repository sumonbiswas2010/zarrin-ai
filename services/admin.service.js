/* eslint-disable no-return-await */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-param-reassign */
const bcrypt = require("bcryptjs");
const { compareSync } = require("bcryptjs");
const ApiError = require("../utils/ApiError");
const tokenService = require("../services/token.service");
const { tokenTypes } = require("../config/tokens");
const sequelize = require("sequelize");
const {
  Admin,
  AdminRole,
  AdminAuthToken,
  AdminResetPassToken,
  UserTable,
  FcmToken,
  AdminOtpAuth,
} = require("../models");

const { Op } = require("sequelize");

const getAllAdmins = async (data) => {
  try {
    return await Admin.findAll({ attributes: { exclude: ["password"] } });
  } catch (err) {
    throw new ApiError(3552, err.message);
  }
};
const createUser = async (data) => {
  try {
    if (data.username) {
      const username = await Admin.findOne({
        attributes: ["id"],
        where: {
          username: data.username,
        },
      });
      if (username) {
        throw new ApiError(3553, "Username already exists");
      }
    }
    if (data.phone) {
      const phone = await Admin.findOne({
        attributes: ["id"],
        where: {
          phone: data.phone,
        },
      });
      if (phone) {
        throw new ApiError(3554, "Phone already exists");
      }
    }

    const mail = await Admin.findOne({
      attributes: ["id"],
      where: {
        email: data.email,
      },
    });
    if (mail) throw new ApiError(3555, "Email already exists");

    const salt = bcrypt.genSaltSync(10);
    data.password = bcrypt.hashSync(data.password, salt);

    const admin = await Admin.create({
      name: data.name,
      email: data.email,
      password: data.password,
      username: data.username,
      phone: data.phone,
      city: data.city,
      address: data.address,
      postal_code: data.postal_code,
      dob: data.dob,
      role: data.role,
    });
    return admin;
  } catch (err) {
    throw new ApiError(err.code, err.message);
  }
};

const loginUserWithEmailAndPassword = async (
  email,
  password,
  ipAddress,
  userAgent
) => {
  try {
    const admin = await Admin.findOne({
      where: {
        email,
      },
    });
    if (!admin) throw new ApiError(3556, "Wrong Credentials");
    const pass = compareSync(password, admin.password);
    if (pass) {
      admin.last_login = new Date();
      admin.save();
      return admin;
    }
    throw new ApiError(3556, "Wrong Credentials");
  } catch (err) {
    throw new ApiError(err.code, err.message);
  }
};
const deleteAdmin = async (admin_id) => {
  try {
    await FcmToken.destroy({ where: { admin_id } });
    await AdminAuthToken.destroy({ where: { admin_id } });
    const res = await Admin.destroy({ where: { id: admin_id } });
    if (res === 0) throw new ApiError(3557, "Nothing to delete");
    return true;
  } catch (err) {
    throw new ApiError(err.code, err.message);
  }
};

const logout = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyAdminToken(refreshToken);
    if (!refreshTokenDoc) {
      throw new ApiError(3558, "Please authenticate. Token Error");
    }
    return await AdminAuthToken.destroy({
      where: { refresh_token: refreshToken },
    });
  } catch (err) {
    throw new ApiError(err.code, "Logout Error");
  }
};

const getAdminById = async (id) => {
  try {
    return await Admin.findOne({
      attributes: {
        exclude: ["password"],
      },
      where: {
        id,
      },
    });
  } catch (err) {
    throw new ApiError(3559, err.message);
  }
};
const updateDeviceToken = async (device_token, device_id, admin_id) => {
  try {
    return await FcmToken.upsert(
      {
        device_token,
        device_id,
        admin_id,
      },
      { conflictFields: ["admin_id", "device_id"] }
    );
  } catch (err) {
    throw new ApiError(3560, err.message);
  }
};
const updateAdminById = async (id, data) => {
  try {
    if (data.device_token) {
      return await updateDeviceToken(data.device_token, data.deviceID, id);
    }
    if (data.password) {
      const salt = bcrypt.genSaltSync(10);
      data.password = bcrypt.hashSync(data.password, salt);
    }
    if (data.username) {
      const username = await Admin.findOne({
        where: {
          username: data.username,
          id: {
            [Op.ne]: data.id,
          },
        },
      });
      if (username) {
        throw new ApiError(3553, "Username already exists");
      }
    }
    if (data.phone) {
      const phone = await Admin.findOne({
        where: {
          phone: data.phone,
          id: {
            [Op.ne]: data.id,
          },
        },
      });
      if (phone) {
        throw new ApiError(3554, "Phone already exists");
      }
    }

    if (data.email) {
      const mail = await Admin.findOne({
        attributes: ["id"],
        where: {
          email: data.email,
          id: {
            [Op.ne]: data.id,
          },
        },
      });
      if (mail) throw new ApiError(3555, "Email already exists");
    }
    const update = await Admin.update(
      {
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        city: data.city,
        address: data.address,
        postal_code: data.postal_code,
        password: data.password,
        dob: data.dob,
      },
      {
        where: {
          id,
        },
      }
    );
    if (update[0] === 0) throw new ApiError(3561, "Nothing Found to update");
    return true;
  } catch (err) {
    throw new ApiError(err.code, err.message);
  }
};
const updateAdminProfileByAdmin = async (id, data) => {
  try {
    if (data.password) {
      const salt = bcrypt.genSaltSync(10);
      data.password = bcrypt.hashSync(data.password, salt);
    }
    if (data.username) {
      const username = await Admin.findOne({
        attributes: ["id"],
        where: {
          username: data.username,
          id: {
            [Op.ne]: data.id,
          },
        },
      });
      if (username) {
        throw new ApiError(3553, "Username already exists");
      }
    }
    if (data.phone) {
      const phone = await Admin.findOne({
        attributes: ["id"],
        where: {
          phone: data.phone,
          id: {
            [Op.ne]: data.id,
          },
        },
      });
      if (phone) {
        throw new ApiError(3554, "Phone already exists");
      }
    }

    if (data.email) {
      const mail = await Admin.findOne({
        attributes: ["id"],
        where: {
          email: data.email,
          id: {
            [Op.ne]: data.id,
          },
        },
      });
      if (mail) throw new ApiError(3555, "Email already exists");
    }
    const update = await Admin.update(
      {
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        city: data.city,
        address: data.address,
        postal_code: data.postal_code,
        password: data.password,
        dob: data.dob,
        isVerified: data.isVerified,
        role: data.role,
      },
      {
        where: {
          id,
        },
      }
    );
    if (update[0] === 0) throw new Error(3561, "Nothing Found to update");
    return true;
  } catch (err) {
    throw new ApiError(err.code, err.message);
  }
};
const changePassword = async (adminId, body) => {
  try {
    if (body.new_password === body.confirm_password) {
      const salt = bcrypt.genSaltSync(10);
      const pass = bcrypt.hashSync(body.new_password, salt);
      const newPass = await Admin.update(
        { password: pass },
        { where: { id: adminId } }
      );
      return newPass;
    }
    throw new ApiError(3562, "Password and confirm password not match");
  } catch (err) {
    throw new ApiError(err.code, err.message);
  }
};

const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyAdminToken(
      refreshToken,
      "refresh"
    );

    const admin = await Admin.findOne({
      where: {
        id: refreshTokenDoc.admin_id,
      },
    });
    if (!admin) {
      throw new ApiError(3558, "Please authenticate. Token Error");
    }

    const tokens = await tokenService.generateAdminAuthTokens(
      admin,
      refreshTokenDoc.device_id
    );
    admin.last_login = new Date();
    admin.save();

    admin.password = undefined;
    return { admin, tokens };
  } catch (err) {
    throw new ApiError(err.code, "Please authenticate. Token Error");
  }
};
const searchUserWithEmailPhoneUserName = async (data) => {
  try {
    const user = await Admin.findOne({
      where: {
        [Op.or]: [
          { email: data.email || "" },
          { username: data.username || "" },
          { phone: data.phone || "" },
        ],
      },
      treatUndefinedAsNull: false,
    });

    if (!user) {
      throw new ApiError(3563, "Unregistered admin");
    }
    return user;
  } catch (err) {
    throw new ApiError(err.code, err.message);
  }
};
const saveOtp = async (data, OTP) => {
  try {
    const user = await searchUserWithEmailPhoneUserName(data);
    const [res, check] = await AdminOtpAuth.upsert({
      admin_id: user.id,
      otp: OTP,
      isVerified: false,
      expire: new Date(new Date().getTime() + 300000),
    });
    return res;
  } catch (err) {
    throw new ApiError(3564, err.message);
  }
};
const verifyOtp = async (data, otp) => {
  try {
    const user = await searchUserWithEmailPhoneUserName(data);
    if (!user) throw new ApiError(3565, "Admin not Found");

    const otpRes = await AdminOtpAuth.findOne({
      where: {
        admin_id: user.id,
        otp,
        isVerified: false,
      },
    });
    if (otpRes) {
      if (otpRes.expire > new Date(new Date().getTime())) {
        return otpRes;
      }
      await otpRes.destroy();
      throw new ApiError(3566, "Otp Expired");
    } else {
      throw new ApiError(3567, "OTP did not match!");
    }
  } catch (err) {
    throw new ApiError(err.code, err.message);
  }
};
const resetPassword = async (data, otp) => {
  try {
    const otpRes = await verifyOtp(data, otp);
    const salt = bcrypt.genSaltSync(10);
    const newPass = await Admin.update(
      { password: bcrypt.hashSync(data.password, salt) },
      { where: { id: otpRes.admin_id } }
    );
    otpRes.destroy();
    return true;
  } catch (err) {
    throw new ApiError(err.code, err.message);
  }
};

module.exports = {
  getAllAdmins,
  saveOtp,
  createUser,
  loginUserWithEmailAndPassword,
  logout,
  getAdminById,
  updateAdminById,
  resetPassword,
  changePassword,
  refreshAuth,
  saveOtp,
  updateAdminProfileByAdmin,
  deleteAdmin,
};
