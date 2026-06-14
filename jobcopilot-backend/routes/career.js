const express = require('express');
const router = express.Router();
const { getDashboard, recordActivity } = require('../controllers/careerController');
const auth = require('../middleware/auth');

router.get('/dashboard', auth, getDashboard);
router.post('/activity', auth, recordActivity);

module.exports = router;
