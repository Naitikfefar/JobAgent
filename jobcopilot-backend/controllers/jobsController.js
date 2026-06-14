const { exec } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');
const { recordCareerActivity } = require('../services/careerProgressService');
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

    const previousStatus = job.status;

    // Update job status
    job.status = status;
    if (status === 'applied' && previousStatus !== 'applied') {
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
      await recordCareerActivity(req.user.id, 'application_submitted', {
        refId: job._id.toString(),
        eventKey: `application_submitted:job:${job._id}`
      });
    }

    if (status === 'interview' && previousStatus !== 'interview') {
      await recordCareerActivity(req.user.id, 'interview_invitation', {
        refId: job._id.toString(),
        eventKey: `interview_invitation:job:${job._id}`
      });
    }

    if (status === 'offered' && previousStatus !== 'offered') {
      await recordCareerActivity(req.user.id, 'offer_received', {
        refId: job._id.toString(),
        eventKey: `offer_received:job:${job._id}`
      });
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

exports.generateInterviewPrep = async (req, res) => {
  console.log('generateInterviewPrep called with jobId:', req.params.jobId, 'for user:', req.user.id);
  try {
    const job = await Job.findOne({ _id: req.params.jobId, userId: req.user.id });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const user = await User.findById(req.user.id);
    
    // Check if already generated
    if (job.interviewPrep && job.interviewPrep.questions?.length > 0) {
      return res.json(job.interviewPrep);
    }

    const axios = require('axios');
    const userSkills = user.profile?.skills?.join(', ') || 'programming';
    
    const prompt = `You are an expert technical interviewer. Generate interview preparation content for this job application.

JOB TITLE: ${job.title}
COMPANY: ${job.company}
JOB DESCRIPTION: ${job.about?.slice(0, 800) || 'Software development role'}
CANDIDATE SKILLS: ${userSkills}

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "difficulty": "Medium",
  "estimated_prep_time": "2-3 hours",
  "questions": [
    {
      "id": 1,
      "category": "Technical",
      "question": "Explain how React's virtual DOM works and why it improves performance?",
      "difficulty": "Medium",
      "model_answer": "The virtual DOM is a lightweight JavaScript representation of the actual DOM. When state changes, React creates a new virtual DOM tree, diffs it with the previous one using a reconciliation algorithm, and only updates the real DOM where changes occurred. This is faster than directly manipulating the DOM because DOM operations are expensive, and batching minimal updates reduces reflows and repaints.",
      "tips": "Mention reconciliation, fiber architecture if senior role, give real example",
      "follow_up": "What is React Fiber and how does it improve the reconciliation process?"
    }
  ],
  "company_specific_tips": [
    "Research ${job.company}'s tech stack before the interview",
    "Prepare 2-3 questions to ask the interviewer about team structure"
  ],
  "preparation_checklist": [
    "Review your projects mentioned in resume",
    "Practice coding on whiteboard or paper",
    "Research company culture on Glassdoor"
  ]
}

Generate exactly 10 questions with this category distribution:
- 4 Technical questions (specific to job tech stack)
- 2 DSA/Problem solving questions  
- 2 Behavioral questions (STAR format)
- 1 System design question
- 1 HR/Culture fit question

Make questions specific to ${job.company} and ${job.title} role. Model answers should be detailed and impressive.`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.7
      },
      { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` } }
    );

    const text = response.data.choices[0].message.content;
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    const prepData = JSON.parse(text.slice(start, end));

    // Save to job
    job.interviewPrep = prepData;
    await job.save();

    res.json(prepData);
  } catch (error) {
    console.error('Interview prep error:', error.message);
    res.status(500).json({ message: 'Failed to generate interview prep', error: error.message });
  }
};

exports.saveInterviewAnswer = async (req, res) => {
  try {
    const { jobId, questionId, userAnswer, rating } = req.body;
    const job = await Job.findOne({ _id: jobId, userId: req.user.id });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (!job.interviewAnswers) job.interviewAnswers = [];
    
    const existingIndex = job.interviewAnswers.findIndex(a => a.questionId === questionId);
    if (existingIndex >= 0) {
      job.interviewAnswers[existingIndex] = { questionId, userAnswer, rating, savedAt: new Date() };
    } else {
      job.interviewAnswers.push({ questionId, userAnswer, rating, savedAt: new Date() });
    }
    
    await job.save();
    res.json({ message: 'Answer saved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
