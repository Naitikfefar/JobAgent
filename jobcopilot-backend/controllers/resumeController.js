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
    // Run Python resume parser
    const parserPath = path.join(__dirname, '../agents/resume_parser.py');
    exec(`python "${parserPath}" "${newFilePath}"`, { timeout: 30000 }, async (error, stdout, stderr) => {
        if (error) {
          console.error('Resume parser error:', error, stderr);
        }
        try {
          const result = JSON.parse(stdout || '{}');

          if (result.success) {
            // Save parsed text
            user.resume.parsedText = result.raw_text;

            // Auto-update user profile with extracted skills
            if (result.skills && result.skills.length > 0) {
              // Merge with existing skills, no duplicates
              const existingSkills = user.profile?.skills || [];
              const allSkills = [...new Set([...existingSkills, ...result.skills])];
              user.profile = user.profile || {};
              user.profile.skills = allSkills;
            }

            // Auto-set preferred roles if not already set
            if (result.detected_roles && result.detected_roles.length > 0) {
              if (!user.profile?.preferredRoles?.length) {
                user.profile.preferredRoles = result.detected_roles;
              }
            }

            await user.save();

            return res.json({
              message: 'Resume uploaded and parsed successfully',
              file: {
                name: req.file.originalname,
                path: newFilePath
              },
              parsed: {
                skills: result.skills,
                detected_roles: result.detected_roles,
                experience_years: result.experience_years,
                education: result.education
              }
            });
          } else {
            // Save file even if parsing failed
            await user.save();
            return res.json({
              message: 'Resume uploaded (parsing had issues)',
              file: { name: req.file.originalname, path: newFilePath },
              parsed: { skills: [], detected_roles: [] }
            });
          }
        } catch (parseError) {
          await user.save();
          return res.json({
            message: 'Resume uploaded',
            file: { name: req.file.originalname },
            parsed: { skills: [], detected_roles: [] }
          });
        }
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Generate Tailored Resume
exports.generateResume = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, userId: req.user.id });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const user = await User.findById(req.user.id);
    const userProfile = {
      name: user.name,
      email: user.email,
      skills: user.profile?.skills || [],
      education: user.profile?.education || 'B.Tech Computer Engineering',
      internship: user.profile?.internship || '',
      projects: user.profile?.projects || [],
      achievements: user.profile?.achievements || []
    };

    const { exec } = require('child_process');
    const path = require('path');
    const agentPath = path.join(__dirname, '../agents/ai_resume.py');
    const outputPath = path.join(__dirname, '../uploads', `resume-${req.user.id}-${job._id}.pdf`);

    const input = JSON.stringify({
      job_title: job.title,
      company: job.company,
      job_desc: job.about || '',
      user_profile: userProfile,
      output_path: outputPath
    });

    const escapedInput = input.replace(/"/g, '\\"').replace(/\n/g, ' ');

    exec(`python "${agentPath}" "${escapedInput}"`,
      { timeout: 60000 },
      async (error, stdout) => {
        if (error) return res.status(500).json({ message: 'Resume generation failed' });
        try {
          const result = JSON.parse(stdout);
          job.resumePath = result.resume_path;
          if (typeof result.match_score === 'number') {
            job.optimizedResumeScore = result.match_score;
          }
          await job.save();
          res.json({
            message: 'Resume generated',
            resumePath: result.resume_path,
            optimizedResumeScore: job.optimizedResumeScore,
            jobId: job._id
          });
        } catch(e) {
          res.status(500).json({ message: 'Failed to parse result' });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Score Resume Against Job Description
exports.scoreResume = async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ message: 'Resume text and job description required' });
    }

    const axios = require('axios');
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `You are an ATS resume expert. Score this resume against the job description.

          JOB DESCRIPTION: ${jobDescription.slice(0, 500)}

          RESUME: ${resumeText.slice(0, 1000)}

          Return ONLY a JSON object like this (no markdown):
          {
            "overall_score": 65,
            "keyword_match": 45,
            "experience_match": 70,
            "skills_match": 60,
            "format_score": 80,
            "missing_keywords": ["docker", "kubernetes", "typescript"],
            "improvement_tips": ["Add more quantifiable achievements", "Include relevant certifications"],
            "strong_points": ["Good project descriptions", "Relevant internship experience"]
          }`
        }],
        max_tokens: 500
      },
      { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` } }
    );

    const text = response.data.choices[0].message.content;
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;

    if (start === -1 || end === 0) {
      return res.status(500).json({ message: 'Scoring failed', error: 'AI response did not include JSON' });
    }

    const scores = JSON.parse(text.slice(start, end));
    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: 'Scoring failed', error: error.message });
  }
};

// Download Resume
exports.downloadResume = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, userId: req.user.id });
    if (!job || !job.resumePath) return res.status(404).json({ message: 'Resume not found. Generate it first.' });

    const fs = require('fs');
    if (!fs.existsSync(job.resumePath)) return res.status(404).json({ message: 'Resume file not found' });

    res.download(job.resumePath, `Resume-${job.company}.pdf`);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
