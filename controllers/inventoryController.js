const Expense = require("../models/Expense");
const Income = require("../models/Income");

// EXPENSE
exports.addExpense = async (req, res) => {
  try {
    const { title, description, amount, date } = req.body;
    const expense = await Expense.create({ title, description, amount, date, addedBy: req.user.id });
    res.status(201).json({ message: "Expense added", data: expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().populate("addedBy", "name role");
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// INCOME
exports.addIncome = async (req, res) => {
  try {
    const { title, description, amount, date } = req.body;
    const income = await Income.create({ title, description, amount, date, addedBy: req.user.id });
    res.status(201).json({ message: "Income added", data: income });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIncomes = async (req, res) => {
  try {
    const incomes = await Income.find().populate("addedBy", "name role");
    res.json(incomes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateIncome = async (req, res) => {
  try {
    const updated = await Income.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.json({ message: "Income deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
