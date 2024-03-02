const express = require("express");
const router = express.Router();
router.use(express.json());
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../middleware/routeAuth");
const {
  addVerient,
  deleteVerient,
  updateVerient,
  getVerients,
} = require("../controllers/verientControllers");

router.route("/verients/:productId").get(getVerients);

router
  .route("/admin/add-verient/:productId")
  .post(isAuthenticatedUser, authorizeRole("admin"), addVerient);
router
  .route("/admin/delete-verient/:verientId")
  .delete(isAuthenticatedUser, authorizeRole("admin"), deleteVerient)
  .put(isAuthenticatedUser, authorizeRole("admin"), updateVerient);

module.exports = router;
