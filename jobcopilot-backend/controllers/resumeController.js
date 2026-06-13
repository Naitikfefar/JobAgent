const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Job = require('../models/Job');

// Upload Resume
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);

    // Rename file to userId-timestamp.pdf
    const ext = path.extname(req.file.originalname);
    const newFilename = `${req.user.id}-${Date.now()}${ext}`;
    const newFilePath = path.join('uploads', newFilename);
    fs.renameSync(req.file.path, newFilePath);

    // Update user resume
    user.resume = {
      originalName: req.file.originalname,
      filePath: newFilePath,
      uploadedAt: new Date()
    };

    // Extract text from PDF using Python
    const pythonCmd = `python3 -c "import pdfplumber; pdf=pdfplumber.open('${newFilePath}'); text=' '.join([p.extract_text() for p in pdf.pages if p.extract_text()]); print(text)"`;
    exec(pythonCmd, (error, stdout, stderr) => {
      if (error) {
        console.error('PDF extraction error:', error);
        // Save user even if extraction fails
        user.save().then(() => {
          res.json({
            message: 'Resume uploaded successfully (text extraction failed)',
            resume: user.resume
          });
        });
        return;
      }

      user.resume.parsedText = stdout.trim();
      user.save().then(() => {
        res.json({
          message: 'Resume uploaded successfully',
          resume: user.resume
        });
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Generate Tailored Resume
exports.generateResume = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user.resume || !user.resume.parsedText) {
      return res.status(400).json({ message: 'Please upload and parse your resume first' });
    }

    // TODO: Call Groq API here
    // For now, generate a placeholder
    const resumePDFPath = `/home/naitik/job-reports/tailored-resume-${req.user.id}-${req.params.jobId}.pdf`;

    // Run Python script to generate PDF
    exec('python3 /home/naitik/job-reports/generate-resume.py', async (error, stdout, stderr) => {
      if (error) {
        console.error('Resume generation error:', error);
        return res.status(500).json({ message: 'Failed to generate resume' });
      }

      // Update job with resume path
      job.resumePath = resumePDFPath;
      await job.save();

      res.json({
        message: 'Resume generated successfully',
        resumePath: resumePDFPath
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Download Resume
exports.downloadResume = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!job.resumePath || !fs.existsSync(job.resumePath)) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.download(job.resumePath, `tailored-resume-${job.company}.pdf`);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
