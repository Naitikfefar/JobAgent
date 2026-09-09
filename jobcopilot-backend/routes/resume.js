const express = require('express');
const router = express.Router();
const { uploadResume, generateResume, downloadResume, scoreResume } = require('../controllers/resumeController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protected Routes
router.post('/upload', auth, upload.single('resume'), uploadResume);
router.post('/score', auth, scoreResume);
router.get('/generate/:jobId', auth, generateResume);
router.get('/download/:jobId', auth, downloadResume);

module.exports = router;
