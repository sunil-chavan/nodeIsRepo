    const mongoose = require('mongoose');

    const userTiffinSchema = new mongoose.Schema({
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        tiffinCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'TiffinCategory', required: true },
        month: { type: String, required: true },
        fromDate: { type: Date, required: true }, 
        endDate: { type: Date, required: true },    
        status: { type: String, default: 'active' },
        createdAt: { type: Date, default: Date.now }
      });

    module.exports = mongoose.model('UserTiffin', userTiffinSchema);

