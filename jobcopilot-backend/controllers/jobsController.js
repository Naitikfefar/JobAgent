const { exec } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');
// Search jobs (trigger agent)
exports.searchJobs = async (req, res) => {
  try {
    console.log('Search jobs called for user:', req.user?.id);
    const user = await User.findById(req.user.id);
    console.log('User found:', user?.name, 'Skills:', user?.profile?.skills?.length);

    const userSkills = user.profile?.skills || [];
    const userRoles = user.profile?.preferredRoles || [];
    const remoteOnly = user.profile?.remoteOnly !== false;

    // Use user skills or fallback to general tech skills
    const searchSkills = userSkills.length > 0 ? userSkills : [
      'react', 'node', 'javascript', 'python', 'full stack',
      'frontend', 'backend', 'mongodb', 'sql', 'web development'
    ];

    const agentPath = path.join(__dirname, '../agents/find_jobs.py');
    const agentInput = JSON.stringify({ skills: searchSkills, roles: userRoles, remote_only: remoteOnly });
    const escapedInput = agentInput.replace(/"/g, '\\"');

    exec(`python "${agentPath}" "${escapedInput}"`, { timeout: 120000, maxBuffer: 1024 * 1024 * 10 },
      async (error, stdout, stderr) => {
        if (error) {
            console.error('Agent error:', error.message);
            console.error('Agent stderr:', stderr);
            console.error('Agent stdout (truncated):', (stdout||'').slice(0,1000));
            return res.status(500).json({ message: 'Job search failed', error: error.message, stderr: stderr });
        }

        let jobsData;
        try {
          jobsData = JSON.parse(stdout);
        } catch (e) {
          console.error('Parse error:', e);
          console.error('Parse stdout:', stdout);
          console.error('Parse stderr:', stderr);
          return res.status(500).json({ message: 'Failed to parse results', parseError: e.message, stdout: (stdout||'').slice(0,200), stderr });
        }

        // Remove today's existing jobs
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        await Job.deleteMany({ userId: req.user.id, foundAt: { $gte: startOfDay } });

        const savedJobs = [];
        const seenCompanies = new Set();

        for (const job of jobsData) {
          try {
            const companyKey = job.company?.toLowerCase().trim();
            if (!companyKey || seenCompanies.has(companyKey)) continue;
            seenCompanies.add(companyKey);

            const coverLetter = await generateCoverLetter(job.title, job.company, job.about || '', userSkills, user.name);

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
            console.error('Job save error:', jobError.message || jobError);
          }
        }

        res.json(savedJobs);
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get today's discovered jobs for the current user
exports.getTodayJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Return all fields (including coverLetter and resumePath)
    const jobs = await Job.find({ userId, foundAt: { $gte: startOfDay } }).sort({ foundAt: -1 }).lean();
    res.json(jobs);
  } catch (error) {
    console.error('getTodayJobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all jobs that have cover letters for current user
exports.getCoverLetters = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobs = await Job.find({ userId, coverLetter: { $exists: true, $ne: '' } }).sort({ foundAt: -1 }).lean();
    res.json(jobs);
  } catch (error) {
    console.error('getCoverLetters error:', error);
    res.status(500).json({ message: 'Server error' });
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID' });
    }

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

// Toggle bookmark
exports.toggleBookmark = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, userId: req.user.id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.isBookmarked = !job.isBookmarked;
    await job.save();
    res.json({ isBookmarked: job.isBookmarked, message: job.isBookmarked ? 'Bookmarked!' : 'Removed' });
  } catch (error) {
    console.error('toggleBookmark error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get bookmarked jobs
exports.getBookmarkedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.user.id, isBookmarked: true }).sort({ foundAt: -1 }).lean();
    res.json(jobs);
  } catch (error) {
    console.error('getBookmarkedJobs error:', error);
    res.status(500).json({ message: 'Server error' });
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

// Skill gap analysis
exports.getSkillGapAnalysis = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    const jobs = await Job.find({ userId: req.user.id }).limit(20).lean();

    const userSkills = (user.profile?.skills || []).map(s => s.toLowerCase());

    const allSkills = [
      'react', 'node.js', 'javascript', 'python', 'typescript', 'mongodb',
      'mysql', 'postgresql', 'aws', 'docker', 'kubernetes', 'git', 'java',
      'spring boot', 'django', 'flask', 'next.js', 'vue', 'angular',
      'machine learning', 'tensorflow', 'pytorch', 'sql', 'redis',
      'graphql', 'rest api', 'flutter', 'kotlin', 'swift', 'figma',
      'tailwind', 'css', 'html', 'express', 'fastapi', 'data science',
      'deep learning', 'nlp', 'pandas', 'numpy', 'power bi', 'tableau'
    ];

    const skillFrequency = {};
    jobs.forEach(job => {
      const jobText = ((job.title || '') + ' ' + (job.about || '')).toLowerCase();
      allSkills.forEach(skill => {
        if (jobText.includes(skill)) {
          skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
        }
      });
    });

    const sortedSkills = Object.entries(skillFrequency)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 20);

    const gaps = sortedSkills
      .filter(([skill]) => !userSkills.some(us => us.includes(skill) || skill.includes(us)))
      .map(([skill, count]) => ({
        skill,
        demandCount: count,
        demandPercent: Math.round((count / Math.max(jobs.length, 1)) * 100),
        learningResources: getLearningResources(skill)
      }));

    const matching = sortedSkills
      .filter(([skill]) => userSkills.some(us => us.includes(skill) || skill.includes(us)))
      .map(([skill, count]) => ({
        skill,
        demandPercent: Math.round((count / Math.max(jobs.length, 1)) * 100)
      }));

    res.json({ gaps: gaps.slice(0, 10), matching, totalJobs: jobs.length });
  } catch (error) {
    console.error('getSkillGapAnalysis error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

function getLearningResources(skill) {
  const resources = {
    'react': [{ name: 'React Docs', url: 'https://react.dev', free: true }, { name: 'Scrimba React', url: 'https://scrimba.com', free: false }],
    'typescript': [{ name: 'TypeScript Handbook', url: 'https://typescriptlang.org/docs', free: true }],
    'docker': [{ name: 'Docker Getting Started', url: 'https://docs.docker.com/get-started', free: true }],
    'machine learning': [{ name: 'Coursera ML', url: 'https://coursera.org/learn/machine-learning', free: false }, { name: 'fast.ai', url: 'https://fast.ai', free: true }],
    'aws': [{ name: 'AWS Free Tier', url: 'https://aws.amazon.com/free', free: true }],
    'python': [{ name: 'Python.org Docs', url: 'https://python.org/doc', free: true }],
  };
  return resources[skill] || [{ name: `Search "${skill} tutorial"`, url: `https://google.com/search?q=${encodeURIComponent(skill)}+tutorial+free`, free: true }];
}
