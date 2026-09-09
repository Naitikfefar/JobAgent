const CareerProgress = require('../models/CareerProgress');
const XpEvent = require('../models/XpEvent');
const User = require('../models/User');

const LEVELS = [
  { level: 1, title: 'Career Explorer', minXp: 0 },
  { level: 2, title: 'Opportunity Seeker', minXp: 300 },
  { level: 3, title: 'Application Specialist', minXp: 800 },
  { level: 4, title: 'Interview Contender', minXp: 1500 },
  { level: 5, title: 'Rising Professional', minXp: 2400 },
  { level: 6, title: 'Career Strategist', minXp: 3600 },
  { level: 7, title: 'Industry Insider', minXp: 5200 },
  { level: 8, title: 'Salary Negotiator', minXp: 7200 },
  { level: 9, title: 'Career Accelerator', minXp: 9500 },
  { level: 10, title: 'Elite Candidate', minXp: 12500 }
];

const XP_VALUES = {
  resume_uploaded: 100,
  resume_optimized: 30,
  application_submitted: 20,
  application_bonus_10: 250,
  roadmap_task_completed: 100,
  skill_completed: 500,
  interview_invitation: 1000,
  offer_received: 2500,
  daily_open: 10,
  recommendations_reviewed: 15,
  weekly_quest_completed: 700
};

const ACHIEVEMENTS = [
  {
    key: 'career_started',
    name: 'Career Started',
    category: 'career',
    description: 'Uploaded your first resume and started your growth journey.',
    condition: (progress) => progress.counters.resumeUploads >= 1
  },
  {
    key: 'first_resume_optimized',
    name: 'First Resume Optimized',
    category: 'resume',
    description: 'Generated your first tailored resume.',
    condition: (progress) => progress.counters.resumeOptimizations >= 1
  },
  {
    key: 'resume_optimizer',
    name: 'Resume Optimizer',
    category: 'resume',
    description: 'Optimized three resumes for different opportunities.',
    xpAwarded: 50,
    condition: (progress) => progress.counters.resumeOptimizations >= 3
  },
  {
    key: 'ats_master',
    name: 'ATS Master',
    category: 'resume',
    description: 'Optimized ten resumes for ATS matching.',
    condition: (progress) => progress.counters.resumeOptimizations >= 10
  },
  {
    key: 'first_application',
    name: 'First Application',
    category: 'application',
    description: 'Submitted your first tracked application.',
    condition: (progress) => progress.counters.applications >= 1
  },
  {
    key: 'job_hunter',
    name: 'Job Hunter',
    category: 'application',
    description: 'Submitted ten tracked applications.',
    xpAwarded: 100,
    condition: (progress) => progress.counters.applications >= 10
  },
  {
    key: 'application_machine',
    name: 'Application Machine',
    category: 'application',
    description: 'Submitted one hundred tracked applications.',
    condition: (progress) => progress.counters.applications >= 100
  },
  {
    key: 'docker_explorer',
    name: 'Docker Explorer',
    category: 'learning',
    description: 'Completed Docker learning work.',
    condition: (progress, metadata) => metadata.skill && metadata.skill.toLowerCase().includes('docker')
  },
  {
    key: 'container_commander',
    name: 'Container Commander',
    category: 'learning',
    description: 'Completed a Docker roadmap skill.',
    xpAwarded: 500,
    condition: (progress, metadata) => metadata.skillCompleted && metadata.skill && metadata.skill.toLowerCase().includes('docker')
  },
  {
    key: 'first_interview',
    name: 'First Interview',
    category: 'interview',
    description: 'Received your first interview invitation.',
    condition: (progress) => progress.counters.interviews >= 1
  },
  {
    key: 'interview_ready',
    name: 'Interview Ready',
    category: 'interview',
    description: 'Moved into interview stage.',
    xpAwarded: 1000,
    condition: (progress) => progress.counters.interviews >= 1
  },
  {
    key: 'offer_magnet',
    name: 'Offer Magnet',
    category: 'interview',
    description: 'Received a job offer.',
    condition: (progress) => progress.counters.offers >= 1
  },
  {
    key: 'seven_day_streak',
    name: '7-Day Career Streak',
    category: 'streak',
    description: 'Worked on your career for seven consecutive days.',
    xpAwarded: 100,
    condition: (progress) => progress.streak.current >= 7
  },
  {
    key: 'thirty_day_streak',
    name: '30-Day Career Streak',
    category: 'streak',
    description: 'Built a month-long career growth habit.',
    condition: (progress) => progress.streak.current >= 30
  },
  {
    key: 'hundred_day_streak',
    name: '100-Day Career Streak',
    category: 'streak',
    description: 'Maintained a long-term career growth routine.',
    condition: (progress) => progress.streak.current >= 100
  }
];

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getWeekKey(date = new Date()) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((copy - yearStart) / 86400000) + 1) / 7);
  return `${copy.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getLevelInfo(totalXp) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXp >= level.minXp) current = level;
  }

  const next = LEVELS.find((level) => level.minXp > totalXp) || null;
  return {
    level: current.level,
    title: current.title,
    currentLevelXp: current.minXp,
    nextLevelXp: next ? next.minXp : current.minXp,
    xpIntoLevel: totalXp - current.minXp,
    xpForNextLevel: next ? next.minXp - current.minXp : 0,
    progressPercent: next ? Math.round(((totalXp - current.minXp) / (next.minXp - current.minXp)) * 100) : 100
  };
}

function getDefaultQuest() {
  return {
    weekKey: getWeekKey(),
    rewardXp: XP_VALUES.weekly_quest_completed,
    rewardClaimed: false,
    tasks: [
      { key: 'applications', label: 'Apply to 5 jobs', target: 5, progress: 0, completed: false },
      { key: 'resumeOptimizations', label: 'Optimize 2 resumes', target: 2, progress: 0, completed: false },
      { key: 'roadmapTasks', label: 'Complete 1 roadmap task', target: 1, progress: 0, completed: false }
    ]
  };
}

async function getOrCreateProgress(userId) {
  let progress = await CareerProgress.findOne({ userId });
  if (!progress) {
    progress = await CareerProgress.create({ userId, weeklyQuest: getDefaultQuest() });
  }

  if (!progress.weeklyQuest?.weekKey || progress.weeklyQuest.weekKey !== getWeekKey()) {
    progress.weeklyQuest = getDefaultQuest();
    progress.updatedAt = new Date();
    await progress.save();
  }

  return progress;
}

function updateStreak(progress) {
  const today = getDateKey();
  const last = progress.streak.lastActivityDate;
  if (last === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (last === getDateKey(yesterday)) {
    progress.streak.current += 1;
  } else {
    progress.streak.current = 1;
  }

  progress.streak.longest = Math.max(progress.streak.longest || 0, progress.streak.current);
  progress.streak.lastActivityDate = today;
}

function incrementCounter(progress, type) {
  const map = {
    resume_uploaded: 'resumeUploads',
    resume_optimized: 'resumeOptimizations',
    application_submitted: 'applications',
    roadmap_task_completed: 'roadmapTasks',
    skill_completed: 'skillsCompleted',
    interview_invitation: 'interviews',
    offer_received: 'offers',
    recommendations_reviewed: 'recommendationReviews'
  };

  const field = map[type];
  if (field) {
    progress.counters[field] = (progress.counters[field] || 0) + 1;
  }
}

function updateQuest(progress) {
  if (!progress.weeklyQuest?.tasks?.length) {
    progress.weeklyQuest = getDefaultQuest();
  }

  progress.weeklyQuest.tasks = progress.weeklyQuest.tasks.map((task) => {
    const value = progress.counters[task.key] || 0;
    const progressValue = Math.min(task.target, value);
    const rawTask = task.toObject ? task.toObject() : task;
    return {
      ...rawTask,
      progress: progressValue,
      completed: progressValue >= task.target
    };
  });
}

async function addXp(progress, userId, type, xp, eventKey, metadata = {}, unlocked = []) {
  if (!xp || xp <= 0) return false;

  try {
    await XpEvent.create({ userId, eventKey, type, xp, metadata });
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }

  progress.totalXp += xp;
  unlocked.push({ type, xp, metadata });
  return true;
}

async function unlockAchievements(progress, userId, metadata, unlocked) {
  const existing = new Set((progress.achievements || []).map((achievement) => achievement.key));

  for (const achievement of ACHIEVEMENTS) {
    if (existing.has(achievement.key)) continue;
    if (!achievement.condition(progress, metadata)) continue;

    progress.achievements.push({
      key: achievement.key,
      name: achievement.name,
      category: achievement.category,
      description: achievement.description,
      xpAwarded: achievement.xpAwarded || 0,
      unlockedAt: new Date()
    });
    existing.add(achievement.key);
    unlocked.push({ achievement: achievement.name, key: achievement.key, xp: achievement.xpAwarded || 0 });

    if (achievement.xpAwarded) {
      await addXp(progress, userId, `achievement_${achievement.key}`, achievement.xpAwarded, `achievement:${achievement.key}`, metadata, unlocked);
    }
  }
}

async function maybeAwardMilestones(progress, userId, unlocked) {
  if (progress.counters.applications >= 10) {
    await addXp(progress, userId, 'application_bonus_10', XP_VALUES.application_bonus_10, 'bonus:applications:10', {}, unlocked);
  }

  const tasksComplete = progress.weeklyQuest?.tasks?.every((task) => task.completed);
  if (tasksComplete && !progress.weeklyQuest.rewardClaimed) {
    progress.weeklyQuest.rewardClaimed = true;
    await addXp(progress, userId, 'weekly_quest_completed', progress.weeklyQuest.rewardXp, `weekly_quest:${progress.weeklyQuest.weekKey}`, {}, unlocked);
  }
}

async function recordCareerActivity(userId, type, metadata = {}) {
  const progress = await getOrCreateProgress(userId);
  const unlocked = [];
  const eventKey = metadata.eventKey || `${type}:${metadata.refId || getDateKey()}`;
  const xp = metadata.xp ?? XP_VALUES[type] ?? 0;

  const awarded = await addXp(progress, userId, type, xp, eventKey, metadata, unlocked);
  if (awarded) {
    incrementCounter(progress, type);
    updateStreak(progress);
  }

  updateQuest(progress);
  await unlockAchievements(progress, userId, metadata, unlocked);
  await maybeAwardMilestones(progress, userId, unlocked);

  const levelInfo = getLevelInfo(progress.totalXp);
  progress.level = levelInfo.level;
  progress.levelTitle = levelInfo.title;
  progress.updatedAt = new Date();
  await progress.save();

  return { progress, levelInfo, unlocked, awarded };
}

async function getCareerDashboard(userId, options = {}) {
  if (options.recordDailyOpen) {
    await recordCareerActivity(userId, 'daily_open', {
      refId: getDateKey(),
      eventKey: `daily_open:${getDateKey()}`
    });
  }

  const progress = await getOrCreateProgress(userId);
  const user = await User.findById(userId).lean();
  const levelInfo = getLevelInfo(progress.totalXp);
  const recentEvents = await XpEvent.find({ userId }).sort({ createdAt: -1 }).limit(12).lean();

  const targetRole = user?.profile?.preferredRoles?.[0] || user?.profile?.currentRole || 'Senior Full Stack Developer';
  const careerProgress = Math.min(98, Math.round(
    (levelInfo.level - 1) * 8 +
    Math.min(20, progress.counters.resumeOptimizations * 2) +
    Math.min(20, progress.counters.applications * 1.5) +
    Math.min(20, progress.counters.roadmapTasks * 4) +
    Math.min(10, progress.counters.interviews * 5)
  ));

  return {
    totalXp: progress.totalXp,
    level: levelInfo.level,
    levelTitle: levelInfo.title,
    levelInfo,
    streak: progress.streak,
    counters: progress.counters,
    achievements: [...(progress.achievements || [])].sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt)),
    weeklyQuest: progress.weeklyQuest,
    recentEvents,
    goal: {
      title: targetRole,
      progressPercent: careerProgress,
      currentSalaryPotential: '8-10 LPA',
      targetSalaryPotential: '18-22 LPA'
    }
  };
}

module.exports = {
  XP_VALUES,
  LEVELS,
  getCareerDashboard,
  recordCareerActivity
};
