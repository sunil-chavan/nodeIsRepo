const UserTiffin = require('../models/UserTiffin');

// 1. Create or Update User Tiffin Subscription
exports.createOrUpdateUserTiffin = async (req, res) => {
  const { user, tiffinCategory, month,fromDate,endDate, status = 'active' } = req.body;
  try {
    const updated = await UserTiffin.findOneAndUpdate(
      { user, month },
      { tiffinCategory, fromDate,endDate,status },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('user tiffinCategory');

    res.status(200).json({ message: 'Subscription saved', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get all User Tiffins
exports.getAllUserTiffins = async (req, res) => {
  try {
    const data = await UserTiffin.find().populate('user tiffinCategory');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Get User Tiffin by ID
exports.getUserTiffinById = async (req, res) => {
  try {
    const data = await UserTiffin.findById(req.params.id).populate('user tiffinCategory');
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Delete (Cancel) Subscription
exports.cancelUserTiffin = async (req, res) => {
  try {
    const data = await UserTiffin.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Subscription cancelled', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
