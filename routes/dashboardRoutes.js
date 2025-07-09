// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, checkAdminOnly } = require("../middleware/authMiddleware");
const dashboardController = require("../controllers/dashboardController");

router.get("/", verifyToken, checkAdminOnly, dashboardController.getDashboardSummary);

module.exports = router;
