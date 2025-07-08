const express = require("express");
const router = express.Router();
const tiffinController = require("../controllers/tiffinController");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

router.post(
  "/generate-bill",
  verifyToken,
  checkRole(["admin", "superadmin"]),
  tiffinController.generateBillByDateRange
);
router.post("/attendance", tiffinController.markTiffinAttendance);
// router.put('/attendance/:id', tiffinController.updateAttendance);
// router.delete('/attendance/:id', tiffinController.deleteAttendance);

router.put(
  "/attendance/:id",
  checkRole(["superadmin", "admin"]),
  tiffinController.updateAttendance
);
//in this status is inactive but in this we want add the absent and remove the list or maintain the other flag
router.delete(
  "/attendance/:id",
  checkRole(["superadmin", "admin"]),
  tiffinController.deleteAttendance
);
router.get("/attendance/:id", tiffinController.getAttendanceById);

module.exports = router;
