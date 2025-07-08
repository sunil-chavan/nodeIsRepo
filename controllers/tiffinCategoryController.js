const TiffinCategory = require('../models/TiffinCategory');
const Role = require('../models/Role');
const mongoose = require('mongoose');

// Create or Update (based on name)
exports.createOrUpdateCategory = async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const updated = await TiffinCategory.findOneAndUpdate(
      { name },
      { name, description, price },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ message: 'Category saved', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await TiffinCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get one category
exports.getCategoryById = async (req, res) => {
  try {
    const category = await TiffinCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    await TiffinCategory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
