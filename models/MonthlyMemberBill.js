const mongoose = require('mongoose');

const monthlyMemberBillSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId,ref: "user",required: true,},
  invoiceMonth: { type: String, required: true },    
  invoicePdfUrl: { type: String, required: true },    
  invoiceBillStatus: {type: String, enum: ['paid', 'unpaid'], default: 'unpaid'},
  invoiceDownloadStatus: {type: String, enum: ['original', 'duplicate'], default: 'original'},
  status: {type: String, enum: ['active', 'inactive'], default: 'active'},
},{ timestamps: true });

module.exports = mongoose.model('MonthlyMemberBill', monthlyMemberBillSchema);