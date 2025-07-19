// File: controllers/userController.js
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

exports.createAndUpdateUser = async (req, res) => {
  try {
    const { id, name, email, mobileNumber, password, roleName = 'user' } = req.body;

    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    let hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
    let user;
    if (id) {
      // UPDATE
      const updateFields = { name, email, mobileNumber, role: role._id };
      if (hashedPassword) updateFields.password = hashedPassword;
      user = await User.findByIdAndUpdate(id,updateFields,{ new: true }).populate('role', 'name');
      if (!user) {
        return res.status(404).json({ error: 'User not found for update' });
      }
    } else {
      // CREATE
      user = new User({name,email,mobileNumber,password: hashedPassword || await bcrypt.hash('1234', 10),
        role: role._id,status: 'active'});
      await user.save();
      await user.populate('role', 'name');
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortField = 'createdAt',
      sortOrder = 'desc',
    } = req.query;
    const query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
      ],
    };

    // Sorting
    const sortBy = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    // Data Fetch
    const data = await User.find(query)
      .populate('role', 'name') // Populate only the 'name' field from the role
      .sort(sortBy)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    const total = await User.countDocuments(query);

    // Response
    res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      data,
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server Error: ' + err.message });
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
