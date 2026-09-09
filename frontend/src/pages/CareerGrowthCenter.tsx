import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { getCareerDashboard, recordCareerActivity } from '@/services/api';
import {
  Award,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Flame,
  GraduationCap,
  Loader2,
  Target,
  Trophy,
  Zap
} from 'lucide-react';

type CareerDashboard = {
  totalXp: number;
  level: number;
  levelTitle: string;
  levelInfo: {
    currentLevelXp: number;
    nextLevelXp: number;
    xpIntoLevel: number;
    xpForNextLevel: number;
    progressPercent: number;
  };
  streak: {
    current: number;
    longest: number;
    lastActivityDate?: string;
  };
  counters: Record<string, number>;
  achievements: Array<{
    key: string;
    name: string;
    category: string;
    description?: string;
    xpAwarded?: number;
    unlockedAt: string;
  }>;
  weeklyQuest: {
    weekKey: string;
    rewardXp: number;
    rewardClaimed: boolean;
    tasks: Array<{
      key: string;
      label: string;
      target: number;
      progress: number;
      completed: boolean;
    }>;
  };
  recentEvents: Array<{
    _id: string;
    type: string;
    xp: number;
    createdAt: string;
  }>;
  goal: {
    title: string;
    progressPercent: number;
    currentSalaryPotential: string;
    targetSalaryPotential: string;
  };
};

const eventLabels: Record<string, string> = {
  resume_uploaded: 'Resume uploaded',
  resume_optimized: 'Resume optimized',
  application_submitted: 'Application submitted',
  application_bonus_10: '10 application bonus',
  roadmap_task_completed: 'Roadmap task completed',
  skill_completed: 'Skill completed',
  interview_invitation: 'Interview invitation',
  offer_received: 'Offer received',
  daily_open: 'Daily activity',
  recommendations_reviewed: 'Recommendations reviewed',
  weekly_quest_completed: 'Weekly quest completed'
};

function percent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value || 0)))}%`;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return value;
  }
}

export default function CareerGrowthCenter() {
  const [dashboard, setDashboard] = useState<CareerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await getCareerDashboard();
      setDashboard(res.data);
    } catch (err) {
      console.error('Failed to load career dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const recordAction = async (type: string, metadata: Record<string, string> = {}) => {
    setActionLoading(type);
    try {
      const res = await recordCareerActivity(type, metadata);
      setDashboard(res.data.dashboard);
    } catch (err) {
      console.error('Failed to record career activity:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="p-8 bg-white dark:bg-[#0A0A0F] text-slate-900 dark:text-white">
          <div className="flex items-center gap-3 text-slate-600 dark:text-[#A0A0B8]">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading career progress...
          </div>
        </div>
      </Sidebar>
    );
  }

  if (!dashboard) {
    return (
      <Sidebar>
        <div className="p-8 bg-white dark:bg-[#0A0A0F] text-slate-900 dark:text-white">
          Unable to load career progress.
        </div>
      </Sidebar>
    );
  }

  const xpToNext = Math.max(0, dashboard.levelInfo.nextLevelXp - dashboard.totalXp);
  const questComplete = dashboard.weeklyQuest.tasks.every((task) => task.completed);

  return (
    <Sidebar>
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-white dark:bg-[#0A0A0F] text-slate-900 dark:text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Career Growth Center</h1>
            <p className="text-slate-600 dark:text-[#A0A0B8] mt-1">
              Track progress across resumes, applications, interviews, and learning.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/resume" className="btn-secondary">Optimize Resume</Link>
            <Link to="/jobs" className="btn-primary">Find Jobs</Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6">
          <section className="card-soft p-6 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-28 h-28 rounded-full border-8 border-primary bg-white dark:bg-[#0F0F16] flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-[#A0A0B8]">Level</span>
                <span className="text-4xl font-bold text-primary">{dashboard.level}</span>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{dashboard.levelTitle}</h2>
                  <span className="badge-primary">{dashboard.totalXp} XP</span>
                </div>
                <div className="mt-5">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-[#A0A0B8] mb-2">
                    <span>{dashboard.levelInfo.xpIntoLevel} XP in this level</span>
                    <span>{xpToNext} XP to next level</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200 dark:bg-[#252536] overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: percent(dashboard.levelInfo.progressPercent) }} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="card-soft p-6 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Career Streak</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboard.streak.current} days</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600 dark:text-[#A0A0B8]">
              Longest streak: {dashboard.streak.longest} days
            </p>
          </section>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="card-soft p-5 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <Briefcase className="w-5 h-5 text-primary mb-3" />
            <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Applications</p>
            <p className="text-2xl font-bold">{dashboard.counters.applications || 0}</p>
          </div>
          <div className="card-soft p-5 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <Zap className="w-5 h-5 text-primary mb-3" />
            <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Optimized Resumes</p>
            <p className="text-2xl font-bold">{dashboard.counters.resumeOptimizations || 0}</p>
          </div>
          <div className="card-soft p-5 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <GraduationCap className="w-5 h-5 text-primary mb-3" />
            <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Roadmap Tasks</p>
            <p className="text-2xl font-bold">{dashboard.counters.roadmapTasks || 0}</p>
          </div>
          <div className="card-soft p-5 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <Trophy className="w-5 h-5 text-primary mb-3" />
            <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Achievements</p>
            <p className="text-2xl font-bold">{dashboard.achievements.length}</p>
          </div>
        </div>

        <section className="card-soft p-6 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Current Goal</p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{dashboard.goal.title}</h2>
            </div>
            <div className="text-sm text-slate-600 dark:text-[#A0A0B8]">
              Salary potential: {dashboard.goal.currentSalaryPotential} to {dashboard.goal.targetSalaryPotential}
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Career progress</span>
              <span>{dashboard.goal.progressPercent}%</span>
            </div>
            <div className="h-4 rounded-full bg-slate-100 dark:bg-[#252536] overflow-hidden">
              <div className="h-full rounded-full bg-success" style={{ width: percent(dashboard.goal.progressPercent) }} />
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
          <section className="card-soft p-6 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">This Week's Quests</h2>
                <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Reward: +{dashboard.weeklyQuest.rewardXp} XP</p>
              </div>
              {questComplete && (
                <span className={dashboard.weeklyQuest.rewardClaimed ? 'badge-success' : 'badge-warning'}>
                  {dashboard.weeklyQuest.rewardClaimed ? 'Reward claimed' : 'Complete'}
                </span>
              )}
            </div>
            <div className="space-y-4">
              {dashboard.weeklyQuest.tasks.map((task) => (
                <div key={task.key}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Target className="w-5 h-5 text-slate-400" />
                      )}
                      <span className="font-medium text-slate-900 dark:text-white">{task.label}</span>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-[#A0A0B8]">{task.progress}/{task.target}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-[#252536] overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: percent((task.progress / task.target) * 100) }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => recordAction('roadmap_task_completed', { skill: 'Docker', refId: `docker-task-${Date.now()}` })}
                disabled={!!actionLoading}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                {actionLoading === 'roadmap_task_completed' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                Complete Docker Task
              </button>
              <button
                onClick={() => recordAction('skill_completed', { skill: 'Docker', skillCompleted: 'true', refId: `docker-skill-${Date.now()}` })}
                disabled={!!actionLoading}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {actionLoading === 'skill_completed' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                Finish Docker Skill
              </button>
            </div>
          </section>

          <section className="card-soft p-6 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Achievements</h2>
              <Trophy className="w-5 h-5 text-warning" />
            </div>
            {dashboard.achievements.length === 0 ? (
              <div className="text-sm text-slate-600 dark:text-[#A0A0B8]">
                Upload a resume or submit an application to unlock your first achievement.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {dashboard.achievements.slice(0, 8).map((achievement) => (
                  <div key={achievement.key} className="rounded-lg border border-slate-200 dark:border-[#2A2A3E] p-4 bg-slate-50 dark:bg-[#0F0F16]">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{achievement.name}</p>
                        <p className="text-xs text-slate-500 dark:text-[#A0A0B8] mt-1">{achievement.description}</p>
                        <p className="text-xs text-slate-400 dark:text-[#6B6B80] mt-2">{formatDate(achievement.unlockedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="card-soft p-6 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent XP Activity</h2>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-[#2A2A3E]">
            {dashboard.recentEvents.map((event) => (
              <div key={event._id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{eventLabels[event.type] || event.type}</p>
                  <p className="text-xs text-slate-500 dark:text-[#A0A0B8]">{formatDate(event.createdAt)}</p>
                </div>
                <span className="font-bold text-primary">+{event.xp} XP</span>
              </div>
            ))}
            {dashboard.recentEvents.length === 0 && (
              <p className="text-sm text-slate-600 dark:text-[#A0A0B8] py-2">No XP activity yet.</p>
            )}
          </div>
        </section>
      </div>
    </Sidebar>
  );
}
