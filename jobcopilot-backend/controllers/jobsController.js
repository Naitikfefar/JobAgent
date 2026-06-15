const { exec } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');

// Try to import career service but don't crash if missing
let recordCareerActivity;
try {
  recordCareerActivity = require('../services/careerProgressService').recordCareerActivity;
} catch (e) {
  recordCareerActivity = async () => {};
}

// Auto-detect Python command
const getPythonCmd = () => {
  const { execSync } = require('child_process');

try {
  console.log(
    'PATH =',
    execSync('echo $PATH').toString()
  );
} catch (e) {}

try {
  console.log(
    'Python binaries:',
    execSync('find / -name python* 2>/dev/null | head -20').toString()
  );
} catch (e) {
  console.log('No python binaries found');
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
    console.error('Cover letter generation failed:', e.message);
    return `Dear Hiring Team at ${company},\n\nI am interested in the ${jobTitle} position and believe my skills make me a strong candidate.\n\nBest regards, ${userName}`;
  }
}

// Search jobs (trigger Python agent)
exports.searchJobs = async (req, res) => {
  try {
    console.log('Search jobs called for user:', req.user?.id);
    const user = await User.findById(req.user.id);
    console.log('User found:', user?.name, 'Skills:', user?.profile?.skills?.length);

    const userSkills = user.profile?.skills || [];
    const userRoles = user.profile?.preferredRoles || [];
    const remoteOnly = user.profile?.remoteOnly !== false;

    const searchSkills = userSkills.length > 0 ? userSkills : [
      'react', 'node', 'javascript', 'python', 'full stack',
      'frontend', 'backend', 'mongodb', 'sql', 'web development'
    ];

    const agentPath = path.join(__dirname, '../agents/find_jobs.py');
    const agentInput = JSON.stringify({
      skills: searchSkills,
      roles: userRoles,
      remote_only: remoteOnly
    });

    // Safely escape for shell
    const escapedInput = agentInput
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');

    const pythonCmd = getPythonCmd();
    console.log('Using Python:', pythonCmd);
    console.log('Agent path:', agentPath);

    exec(
      `${pythonCmd} "${agentPath}" "${escapedInput}"`,
      { timeout: 120000, maxBuffer: 1024 * 1024 * 10 },
      async (error, stdout, stderr) => {
        console.log('Python stdout:', stdout?.slice(0, 500));
        console.log('Python stderr:', stderr?.slice(0, 300));
        console.log('Python error:', error?.message);

        if (error) {
          return res.status(500).json({
            message: 'Job search failed - Python agent error',
            error: error.message,
            stderr: stderr?.slice(0, 300)
          });
        }

        if (!stdout || stdout.trim() === '') {
          return res.status(500).json({
            message: 'Job search returned empty results',
            stderr: stderr?.slice(0, 300)
          });
        }

        let jobsData;
        try {
          jobsData = JSON.parse(stdout.trim());
        } catch (e) {
          console.error('JSON parse error:', e.message);
          console.error('Raw stdout:', stdout?.slice(0, 500));
          return res.status(500).json({
            message: 'Failed to parse job results',
            parseError: e.message,
            stdout: stdout?.slice(0, 200)
          });
        }

        if (!Array.isArray(jobsData) || jobsData.length === 0) {
          return res.json([]);
        }

        // Delete today's existing jobs
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

            const coverLetter = await generateCoverLetter(
              job.title, job.company, job.about || '',
              searchSkills, user.name
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
            console.error('Job save error:', jobError.message);
          }
        }

        console.log('Saved', savedJobs.length, 'jobs for user', user.name);
        res.json(savedJobs);
      }
    );
  } catch (error) {
    console.error('searchJobs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get today's jobs
exports.getTodayJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const jobs = await Job.find({ userId, foundAt: { $gte: startOfDay } })
      .sort({ matchScore: -1 })
      .lean();
    res.json(jobs);
  } catch (error) {
    console.error('getTodayJobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get cover letters
exports.getCoverLetters = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobs = await Job.find({ userId, coverLetter: { $exists: true, $ne: '' } })
      .sort({ foundAt: -1 })
      .lean();
    res.json(jobs);
  } catch (error) {
    console.error('getCoverLetters error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID' });
    }
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.json(job);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update job status
exports.updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const previousStatus = job.status;
    job.status = status;
    if (status === 'applied' && previousStatus !== 'applied') {
      job.appliedAt = new Date();
    }
    await job.save();

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
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle bookmark
exports.toggleBookmark = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, userId: req.user.id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.isBookmarked = !job.isBookmarked;
    await job.save();
    res.json({ isBookmarked: job.isBookmarked });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get bookmarked jobs
exports.getBookmarkedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.user.id, isBookmarked: true })
      .sort({ foundAt: -1 })
      .lean();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get job stats
exports.getJobStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const [total, newJobs, applied, interview, rejected, offered] = await Promise.all([
      Job.countDocuments({ userId }),
      Job.countDocuments({ userId, status: 'new' }),
      Job.countDocuments({ userId, status: 'applied' }),
      Job.countDocuments({ userId, status: 'interview' }),
      Job.countDocuments({ userId, status: 'rejected' }),
      Job.countDocuments({ userId, status: 'offered' })
    ]);
    res.json({ total, new: newJobs, applied, interview, rejected, offered });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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
      .sort(([, a], [, b]) => b - a)
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
    res.status(500).json({ message: 'Server error' });
  }
};

function getLearningResources(skill) {
  const resources = {
    'react': [{ name: 'React Docs', url: 'https://react.dev', free: true }],
    'typescript': [{ name: 'TypeScript Handbook', url: 'https://typescriptlang.org/docs', free: true }],
    'docker': [{ name: 'Docker Getting Started', url: 'https://docs.docker.com/get-started', free: true }],
    'machine learning': [{ name: 'fast.ai', url: 'https://fast.ai', free: true }],
    'aws': [{ name: 'AWS Free Tier', url: 'https://aws.amazon.com/free', free: true }],
    'python': [{ name: 'Python Docs', url: 'https://python.org/doc', free: true }],
  };
  return resources[skill] || [{
    name: `Search "${skill} tutorial"`,
    url: `https://google.com/search?q=${encodeURIComponent(skill)}+tutorial+free`,
    free: true
  }];
}

// Generate interview prep
exports.generateInterviewPrep = async (req, res) => {
  console.log('generateInterviewPrep called with jobId:', req.params.jobId);
  try {
    const job = await Job.findOne({ _id: req.params.jobId, userId: req.user.id });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.interviewPrep && job.interviewPrep.questions?.length > 0) {
      return res.json(job.interviewPrep);
    }

    const user = await User.findById(req.user.id);
    const axios = require('axios');
    const userSkills = user.profile?.skills?.join(', ') || 'programming';

    const prompt = `You are an expert technical interviewer. Generate interview preparation for this job.

JOB TITLE: ${job.title}
COMPANY: ${job.company}
JOB DESCRIPTION: ${job.about?.slice(0, 800) || 'Software development role'}
CANDIDATE SKILLS: ${userSkills}

Return ONLY valid JSON (no markdown, no backticks):
{
  "difficulty": "Medium",
  "estimated_prep_time": "2-3 hours",
  "questions": [
    {
      "id": 1,
      "category": "Technical",
      "question": "Question here?",
      "difficulty": "Medium",
      "model_answer": "Detailed answer here",
      "tips": "Tips for answering",
      "follow_up": "Follow up question?"
    }
  ],
  "company_specific_tips": ["Tip 1", "Tip 2"],
  "preparation_checklist": ["Task 1", "Task 2"]
}

Generate exactly 10 questions: 4 Technical, 2 DSA, 2 Behavioral, 1 System Design, 1 HR.`;

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

    job.interviewPrep = prepData;
    await job.save();
    res.json(prepData);
  } catch (error) {
    console.error('Interview prep error:', error.message);
    res.status(500).json({ message: 'Failed to generate interview prep', error: error.message });
  }
};

// Save interview answer
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