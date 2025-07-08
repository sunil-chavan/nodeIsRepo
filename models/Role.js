const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // e.g., 'superadmin', 'admin', 'user'
  },
  description: String // optional metadata
});

module.exports = mongoose.model('Role', roleSchema);
