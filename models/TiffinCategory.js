const mongoose = require('mongoose');

const TiffinCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },     
  description: String,
  price: { type: Number, required: true },    
});

module.exports = mongoose.model('TiffinCategory', TiffinCategorySchema);