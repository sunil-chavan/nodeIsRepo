const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },     
  description: String,
  price: { type: Number, required: true },    
  status: {type: String, enum: ['active', 'inactive'], default: 'active'},
},{ timestamps: true });

module.exports = mongoose.model('Menu', menuSchema);