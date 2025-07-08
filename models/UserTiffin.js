    const mongoose = require('mongoose');

    const userTiffinSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tiffinCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'TiffinCategory', required: true },
    month: { type: String, required: true }, 
    status: { type: String, default: 'active' }, // active, cancelled
    createdAt: { type: Date, default: Date.now }
    });

    module.exports = mongoose.model('UserTiffin', userTiffinSchema);

