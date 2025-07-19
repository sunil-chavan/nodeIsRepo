const express = require("express");
const router = express.Router();
const tiffinController = require('../controllers/tiffinController');
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

// Routes
router.post("/generate-user-bill",  verifyToken,  checkRole(["user", "admin", "superadmin"]), tiffinController.generateUserBill);

// router.post(
//   "/generate-bill",
//   verifyToken,
//   checkRole(["admin", "superadmin"]),
//   tiffinController.generateBillByDateRange
// );

router.post("/attendance",verifyToken,checkRole(["admin", "superadmin"]), tiffinController.markTiffinAttendance);

router.put("/attendance/:id",verifyToken,  checkRole(["superadmin", "admin"]),  tiffinController.updateAttendance);

router.delete("/attendance/:id",  verifyToken,  checkRole(["superadmin", "admin"]),  tiffinController.deleteAttendance);

router.get("/attendance/:id",verifyToken,  tiffinController.getAttendanceById);
router.get("/attendance",verifyToken,  tiffinController.getAttendances);

module.exports = router;
