const express = require('express');
const router = express.Router();
const { 
  getTodayJobs, 
  searchJobs, 
  getCoverLetters,
  getSkillGapAnalysis,
  getJobById, 
  updateJobStatus, 
  getJobStats 
} = require('../controllers/jobsController');
const { toggleBookmark, getBookmarkedJobs } = require('../controllers/jobsController');
const auth = require('../middleware/auth');

// Protected Routes
router.get('/today', auth, getTodayJobs);
router.get('/cover-letters', auth, getCoverLetters);
router.get('/skill-gap', auth, getSkillGapAnalysis);
router.post('/search', auth, searchJobs);
router.get('/stats', auth, getJobStats);
router.get('/bookmarked', auth, getBookmarkedJobs);
router.get('/:id', auth, getJobById);
router.put('/:id/status', auth, updateJobStatus);
router.put('/:id/bookmark', auth, toggleBookmark);

module.exports = router;
