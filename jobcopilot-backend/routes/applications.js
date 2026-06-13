const express = require('express');
const router = express.Router();
const {
  createApplication,
  getApplications,
  updateApplication,
  deleteApplication,
  getStats
} = require('../controllers/applicationsController');
const auth = require('../middleware/auth');

// Protected Routes
router.get('/', auth, getApplications);
router.post('/', auth, createApplication);
router.put('/:id', auth, updateApplication);
router.delete('/:id', auth, deleteApplication);
router.get('/stats', auth, getStats);

module.exports = router;
