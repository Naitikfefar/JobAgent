const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

// Helper: Get today's date as YYYY-MM-DD
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Get today's jobs
exports.getTodayJobs = async (req, res) => {
  try {
    const today = getTodayDate();
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const jobs = await Job.find({
      userId: req.user.id,
      foundAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ matchScore: -1 });

    res.json(jobs);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Search jobs (trigger agent)
exports.searchJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Build user skills from profile
    const userSkills = user.profile?.skills || [];
    const skillsArg = JSON.stringify(userSkills);

    // Path to agent script - works on both Windows and Linux
    const agentPath = path.join(__dirname, '../agents/find_jobs.py');

    exec(`python "${agentPath}" '${skillsArg}'`, 
      { timeout: 60000, maxBuffer: 1024 * 1024 * 5 },
      async (error, stdout, stderr) => {
        if (error) {
          console.error('Agent error:', error);
          return res.status(500).json({ message: 'Job search failed', error: error.message });
        }

        let jobsData;
        try {
          jobsData = JSON.parse(stdout);
        } catch (e) {
          console.error('Parse error:', e, 'stdout:', stdout.slice(0, 200));
          return res.status(500).json({ message: 'Failed to parse job results' });
        }

        // Generate cover letters using Groq and save jobs
        const savedJobs = [];
        for (const job of jobsData) {
          try {
            // Check if this job already exists for this user today
            const existingJob = await Job.findOne({
              userId: req.user.id,
              company: job.company,
              title: job.title
            });

            if (existingJob) {
              savedJobs.push(existingJob);
              continue; // Skip if already exists
            }

            const coverLetter = await generateCoverLetter(
              job.title, job.company, job.about || '',
              user.profile?.skills || [], user.name
            );

            const newJob = new Job({
              userId: req.user.id,
              title: job.title,
              company: job.company,
              source: job.source,
              applyLink: job.apply_link,
              stipend: job.stipend,
              duration: job.duration,
              about: job.about,
              matchScore: job.match_score,
              matchedSkills: job.matched_skills || [],
              coverLetter: coverLetter,
              status: 'new'
            });

            await newJob.save();
            savedJobs.push(newJob);
          } catch (jobError) {
            console.error('Error saving job:', jobError);
          }
        }

        res.json(savedJobs);
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Helper: Generate cover letter using Groq
async function generateCoverLetter(jobTitle, company, jobDesc, skills, userName) {
  try {
    const axios = require('axios');
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Write a professional 3-paragraph cover letter.
JOB: ${jobTitle} at ${company}
JOB DESCRIPTION: ${jobDesc.slice(0, 400)}
CANDIDATE: ${userName}, skills: ${skills.slice(0, 6).join(', ')}
Start: "Dear Hiring Team at ${company},"
End: "Best regards, ${userName}"
Under 200 words. Specific to this job.`
        }],
        max_tokens: 500
      },
      { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` } }
    );
    return response.data.choices[0].message.content;
  } catch (e) {
    return `Dear Hiring Team at ${company},\n\nI am interested in the ${jobTitle} position.\n\nBest regards, ${userName}`;
  }
}

// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(job);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Update job status
exports.updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Update job status
    job.status = status;
    if (status === 'applied') {
      job.appliedAt = new Date();
    }
    await job.save();

    // If applied, create application record
    if (status === 'applied') {
      const application = new Application({
        userId: req.user.id,
        jobId: job._id,
        jobTitle: job.title,
        company: job.company,
        applyLink: job.applyLink,
        source: job.source,
        status: 'applied',
        coverLetterUsed: job.coverLetter,
        resumeUsed: job.resumePath,
        notes: req.body.notes
      });
      await application.save();
    }

    res.json(job);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Get job stats
exports.getJobStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get counts by status
    const total = await Job.countDocuments({ userId });
    const newJobs = await Job.countDocuments({ userId, status: 'new' });
    const applied = await Job.countDocuments({ userId, status: 'applied' });
    const interview = await Job.countDocuments({ userId, status: 'interview' });
    const rejected = await Job.countDocuments({ userId, status: 'rejected' });
    const offered = await Job.countDocuments({ userId, status: 'offered' });

    res.json({
      total,
      new: newJobs,
      applied,
      interview,
      rejected,
      offered
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
