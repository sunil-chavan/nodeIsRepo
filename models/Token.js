const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  deviceInfo: String, 
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d', 
  }
});

module.exports = mongoose.model('Token', tokenSchema);
