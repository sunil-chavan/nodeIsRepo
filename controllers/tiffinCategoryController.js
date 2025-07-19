const TiffinCategory = require('../models/TiffinCategory');
const Role = require('../models/Role');
const mongoose = require('mongoose');

// Create or Update (based on name)
exports.createOrUpdateCategory = async (req, res) => {
  try {
    const { id, name, description, price } = req.body;
    if (id) {
      const updated = await TiffinCategory.findByIdAndUpdate(
        id,
        { name, description, price },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ error: 'Category not found' });
      }
      return res.status(200).json({ message: 'Category updated', data: updated });
    } else {
      const newCategory = new TiffinCategory({ name, description, price });
      const saved = await newCategory.save();
      return res.status(201).json({ message: 'Category created', data: saved });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


// Get all categories
// Get categories with search & pagination
exports.getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};

    const categories = await TiffinCategory.find(query)
                      .sort({ name: 1 })
                      .skip((page - 1) * limit)
                      .limit(parseInt(limit));
    const total = await TiffinCategory.countDocuments(query);
    res.json({
      data: categories,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
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
