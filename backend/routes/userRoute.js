const express = require("express");
const {
  registerUser,
  loginUser,
  logout,
  forgetPassword,
  resetPassword,
  getUserDetails,
  updatePassword,
  updateProfile,
  getAllUsers,
  getSingleUser,
  updateUserRole,
  deleteUser,
 
  socialLoginAuthentication,
  googleAuthenticationCallback,
} = require("../controllers/userController");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../middleware/routeAuth");
const router = express.Router();
const passport = require("passport");

require("../passport/index.js");

router.route("/register").post(registerUser); // Can also use authenticate middleware to set user info in req.user
router.route("/login").post(loginUser);
router.route("/me").get(isAuthenticatedUser, getUserDetails);
router.route("/logout").get(logout);
router.route("/password/forgot").post(forgetPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/password/update").put(isAuthenticatedUser, updatePassword);
router.route("/me/update").put(isAuthenticatedUser, updateProfile);
router
  .route("/admin/users")
  .get(isAuthenticatedUser, authorizeRole("admin"), getAllUsers);
router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, authorizeRole("admin"), getSingleUser)
  .put(isAuthenticatedUser, authorizeRole("admin"), updateUserRole)
  .delete(isAuthenticatedUser, authorizeRole("admin"), deleteUser);

/**
 * @description  Routes which will use in google authentication
 */

router.route("/google").get(
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
  (req, res) => {
    res.send("redirecting to google...");
  }
);

router.route("/auth/login").get(socialLoginAuthentication); // in login page in useEffect()

router.route("/google/callback").get(
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}`,
  }),
  googleAuthenticationCallback
);

module.exports = router;
