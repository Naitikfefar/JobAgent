const express = require('express');
const router = express.Router();
const { 
  getTodayJobs, 
  searchJobs, 
  getJobById, 
  updateJobStatus, 
  getJobStats 
} = require('../controllers/jobsController');
const auth = require('../middleware/auth');

// Protected Routes
router.get('/today', auth, getTodayJobs);
router.post('/search', auth, searchJobs);
router.get('/stats', auth, getJobStats);
router.get('/:id', auth, getJobById);
router.put('/:id/status', auth, updateJobStatus);

module.exports = router;
