const tiffinSubcription = require('../models/TiffinSubscription');

// 1. Create or Update User Tiffin Subscription
exports.addSubcription = async (req, res) => {
  let { userId, tiffinCategoryId, fromDate, endDate, status = 'active' } = req.body;

  if (!userId || !tiffinCategoryId || !fromDate || !endDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const userIds = Array.isArray(userId) ? userId : [userId];
    const subcriptionStatus = 'SUBSCRIBED';

    const newSubscriptions = userIds.map(uid => ({
      userId: uid,
      tiffinCategoryId,
      fromDate,
      endDate,
      subcriptionStatus,
      status,
      createdAt: new Date()
    }));

    const result = await tiffinSubcription.insertMany(newSubscriptions);

    return res.status(200).json({
      success: true,
      message: 'Subscriptions added successfully',
      result
    });

  } catch (err) {
    console.error('Error saving subscriptions:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.getSubcription = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Search filter
    const matchStage = {};
    if (search) {
      matchStage.$or = [
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'tiffinCategory.name': { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }

    // Main aggregation pipeline for paginated data
    const dataPipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'tiffincategories',
          localField: 'tiffinCategoryId',
          foreignField: '_id',
          as: 'tiffinCategory'
        }
      },
      { $unwind: { path: '$tiffinCategory', preserveNullAndEmptyArrays: true } },
      ...(search ? [{ $match: matchStage }] : []),
      { $sort: { [sortBy]: sortOrder } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    // Pipeline to count total documents
    const countPipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'tiffincategories',
          localField: 'tiffinCategoryId',
          foreignField: '_id',
          as: 'tiffinCategory'
        }
      },
      { $unwind: { path: '$tiffinCategory', preserveNullAndEmptyArrays: true } },
      ...(search ? [{ $match: matchStage }] : []),
      { $count: 'total' }
    ];

    const [data, countResult] = await Promise.all([
      tiffinSubcription.aggregate(dataPipeline),
      tiffinSubcription.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching tiffin subscriptions:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching tiffin subscriptions',
      error: error.message
    });
  }
};


// 3. Get User Tiffin by ID
exports.getSubcriptionById = async (req, res) => {
  try {
    const data = await tiffinSubcription.findById(req.params.id).populate('user tiffinCategory');
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Delete (Cancel) Subscription
exports.canceSubcription = async (req, res) => {
  try {
    const data = await tiffinSubcription.findByIdAndUpdate(
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
