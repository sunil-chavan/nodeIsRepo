const mongoose = require('mongoose');

const orderInvoiceSchema = new mongoose.Schema({
  orderId: {type: mongoose.Schema.Types.ObjectId,ref: "order",required: true,},
  invoiceDate: { type: Date, required: true },    
  invoiceStatus: {type: String, enum: ['pending', 'completed'], default: 'pending'},
  invoiceDownloadStatus: {type: String, enum: ['original', 'duplicate'], default: 'original'},
  status: {type: String, enum: ['active', 'inactive'], default: 'active'},
},{ timestamps: true });

module.exports = mongoose.model('OrderInvoice', orderInvoiceSchema);