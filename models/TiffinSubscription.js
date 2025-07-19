    const mongoose = require('mongoose');

    const tiffinSubcriptionSchema = new mongoose.Schema({
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        tiffinCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'TiffinCategory', required: true },
        fromDate: { type: Date, required: true }, 
        endDate: { type: Date, required: true },    
        subcriptionStatus: {type: String, enum: ['SUBSCRIBED', 'UNSUBSCRIBED'], default: null},
        status: {type: String, enum: ['active', 'inactive'], default: 'active'},
        createdAt: { type: Date, default: Date.now }
      });

    module.exports = mongoose.model('TiffinSubcription', tiffinSubcriptionSchema);

