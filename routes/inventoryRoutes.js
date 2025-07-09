const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const { verifyToken, checkAdminOnly } = require("../middleware/authMiddleware");

// Expense Routes
router.post("/expense", verifyToken, checkAdminOnly, inventoryController.addExpense);
router.get("/expense", verifyToken, checkAdminOnly, inventoryController.getExpenses);
router.put("/expense/:id", verifyToken, checkAdminOnly, inventoryController.updateExpense);
router.delete("/expense/:id", verifyToken, checkAdminOnly, inventoryController.deleteExpense);

// Income Routes
router.post("/income", verifyToken, checkAdminOnly, inventoryController.addIncome);
router.get("/income", verifyToken, checkAdminOnly, inventoryController.getIncomes);
router.put("/income/:id", verifyToken, checkAdminOnly, inventoryController.updateIncome);
router.delete("/income/:id", verifyToken, checkAdminOnly, inventoryController.deleteIncome);

module.exports = router;
