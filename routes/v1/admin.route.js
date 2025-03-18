const express = require("express");

const tokenValidation = require("../../validations/token.validation");
const adminController = require("../../controllers/admin.controller");
const adminValidation = require("../../validations/admin.validation");
const router = express.Router();

router.post(
  "/register",
  // tokenValidation.adminToken,
  adminValidation.register,
  // tokenValidation.permissionCheck(PermissionFeatures.AddOwner),
  adminController.register
); //tokenValidation.adminToken,
router.post("/login", adminValidation.login, adminController.login);
router.post(
  "/logout",
  tokenValidation.adminToken,
  adminValidation.refreshToken,
  adminController.logout
);
router.get(
  "/profile/",
  tokenValidation.adminToken,
  adminController.getAdminProfile
);
router.delete(
  "/:id",
  tokenValidation.adminToken,
  // tokenValidation.permissionCheck(PermissionFeatures.Delete),
  adminController.deleteAdmin
);
router.patch(
  "/profile",
  tokenValidation.adminToken,
  adminValidation.updateAdminById,
  // tokenValidation.permissionCheck(PermissionFeatures.AddOwner),
  adminController.updateAdminProfile
);
router.post(
  "/refresh_token",
  adminValidation.refreshToken,
  adminController.refreshTokens
);

router.post(
  "/forgot_password",
  adminValidation.checkEmailPhoneUserName,
  adminController.forgotPassword
);
router.post(
  "/reset_password",
  adminValidation.checkEmailPhoneUserName,
  adminValidation.otpSize,
  adminValidation.resetPassword,
  adminController.verifyOtpAndresetPassword
);

module.exports = router;
