const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  status: {type: String, enum: ['active', 'inactive'], default: 'active'},
  role: {type: mongoose.Schema.Types.ObjectId,ref: 'Role',required: true},loginToken: String},
  { timestamps: true });

module.exports = mongoose.model('User', userSchema);
