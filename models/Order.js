const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId,ref: "user",required: true,},
  menuId: {type: mongoose.Schema.Types.ObjectId,ref: "menu",required: true,},
  description: String,
  orderDate: { type: Date, required: true },    
  orderStatus: {type: String, enum: ['pending', 'accepted', 'inprogress', 'completed'], default: 'pending'},
  orderDeleveryStatus: {type: String, enum: ['delivery', 'notdelivery'], default: 'notdelivery'},
  status: {type: String, enum: ['active', 'inactive'], default: 'active'},
},{ timestamps: true });

module.exports = mongoose.model('Order', MenuSchema);