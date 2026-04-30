const Flag = require('../models/Flag');
const User = require('../models/User');

// @desc    Create a flag against a user
// @route   POST /api/flags
exports.createFlag = async (req, res) => {
  try {
    const { flaggedUserId, reason, description } = req.body;

    if (!flaggedUserId || !reason) {
      return res.status(400).json({ error: 'Please provide flaggedUserId and reason' });
    }

    const flaggedUser = await User.findById(flaggedUserId);
    if (!flaggedUser) {
      return res.status(404).json({ error: 'Flagged user not found' });
    }

    const flag = await Flag.create({
      flaggedUserId,
      flaggedBy: req.user.id,
      reason,
      description: description || '',
    });

    await User.findByIdAndUpdate(flaggedUserId, {
      $inc: { flags: 1 },
    });

    res.status(201).json({
      success: true,
      flag,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get flags against the current seller
// @route   GET /api/flags/my-flags
exports.getMyFlags = async (req, res) => {
  try {
    const flags = await Flag.find({ flaggedUserId: req.user.id })
      .populate('flaggedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(flags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};