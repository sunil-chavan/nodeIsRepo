// File: controllers/userController.js
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

exports.createAndUpdateUser = async (req, res) => {
  try {
    const { name, email, mobileNumber, password, roleName = 'user' } = req.body;
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    let hashedPassword = '1234';
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    const user = await User.findOneAndUpdate(
      { $or: [{ email }, { mobileNumber }] },
      {
        name,
        email,
        mobileNumber,
        password: hashedPassword,
        role: role._id,
        status: 'active'
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('role', 'name');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getUsers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ]
    };
    const sortBy = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
    const data = await User.find(query)
      .populate('role', 'name')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({ total, page: parseInt(page), limit: parseInt(limit), data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate('role', 'name');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete user by ID
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
