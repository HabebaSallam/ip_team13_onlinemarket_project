const express = require('express');
const { protect } = require('../middleware/auth');
const { createFlag, getMyFlags } = require('../controllers/flagController');

const router = express.Router();

router.post('/', protect, createFlag);
router.get('/my-flags', protect, getMyFlags);

module.exports = router;