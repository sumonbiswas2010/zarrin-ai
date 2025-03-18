const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const adminService = require("../services/admin.service");
const tokenService = require("../services/token.service");

const { success } = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { makeLimitOffset } = require("../utils/pagination");

const register = catchAsync(async (req, res) => {
  const admin = await adminService.createUser(req.body);
  admin.password = undefined;
  // const tokens = await tokenService.generateAdminAuthTokens(admin, req.body.deviceID);
  res.status(httpStatus.CREATED).send(success(admin, "Admin Created"));
});
const deleteAdmin = catchAsync(async (req, res) => {
  const data = await adminService.deleteAdmin(req.params.id);
  res.status(httpStatus.OK).send(success(data, "Admin deleted successfully"));
});
const getAllAdmins = catchAsync(async (req, res) => {
  const admin = await adminService.getAllAdmins();
  res.status(httpStatus.OK).send(success(admin));
});

const login = catchAsync(async (req, res) => {
  const { email, password, deviceID } = req.body;
  const ipAddress =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"];
  const admin = await adminService.loginUserWithEmailAndPassword(
    email,
    password,
    ipAddress,
    userAgent
  );
  admin.password = undefined;
  const tokens = await tokenService.generateAdminAuthTokens(admin, deviceID);
  res.status(httpStatus.OK).send(success({ admin, tokens }));
});

const logout = catchAsync(async (req, res) => {
  await adminService.logout(req.body.refreshToken);
  res.status(httpStatus.OK).send(success({}, "Logout Successfully"));
});

const getAdminProfile = catchAsync(async (req, res) => {
  const admin = await adminService.getAdminById(req.userData.sub);
  res.status(httpStatus.OK).send(success(admin));
});
const updateAdminProfile = catchAsync(async (req, res) => {
  const admin = await adminService.updateAdminById(req.userData.sub, req.body);
  res
    .status(httpStatus.OK)
    .send(success(admin, "Successfully updated admin profile"));
});

const updateAdminProfileByAdmin = catchAsync(async (req, res) => {
  const admin = await adminService.updateAdminProfileByAdmin(
    req.userData.sub,
    req.body
  );
  res
    .status(httpStatus.OK)
    .send(success(admin, "Successfully updated admin profile"));
});
const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await adminService.refreshAuth(req.body.refreshToken);
  res.status(httpStatus.OK).send(success(tokens));
});

const resetPassword = catchAsync(async (req, res) => {
  await adminService.resetPassword(req.query.token, req.body);
  res.status(httpStatus.OK).send(success({}, "Password reset successfully"));
});

const changePassword = catchAsync(async (req, res) => {
  await adminService.changePassword(req.userData.sub, req.body);
  res.status(httpStatus.OK).send(success({}, "Password changed successfully"));
});

const forgotPassword = catchAsync(async (req, res) => {
  const OTP = Math.floor(100000 + Math.random() * 900000);
  const data = await adminService.saveOtp(req.body, OTP);
  await emailService.sendEmail(
    req.body.email,
    "Reset Password",
    "",
    "Your reset password OTP is: " + OTP
  );
  res
    .status(httpStatus.CREATED)
    .send(success({ expire: data.expire }, "OTP sent to your email"));
});
// for pass recovery
const verifyOtpAndresetPassword = catchAsync(async (req, res) => {
  await adminService.resetPassword(req.body, req.body.otp);
  res.status(httpStatus.OK).send(success({}, "Password Updated successfully"));
});

module.exports = {
  updateAdminProfileByAdmin,
  getAllAdmins,
  register,
  login,
  logout,
  getAdminProfile,
  updateAdminProfile,
  refreshTokens,
  forgotPassword,
  verifyOtpAndresetPassword,
  resetPassword,
  changePassword,
  deleteAdmin,
};
