import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getTodayJobs, getJobStats, getBookmarkedJobs } from '@/services/api';
import { Briefcase, FileText, Calendar, TrendingUp, Search, Clock, Trophy, Sparkles } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';

export default function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsRes, statsRes, savedRes] = await Promise.all([getTodayJobs(), getJobStats(), getBookmarkedJobs()]);
        setJobs(jobsRes.data || []);
        setStats(statsRes.data || null);
        setSavedCount((savedRes.data || []).length);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
      finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const [savedCount, setSavedCount] = useState<number>(0);
  const displayJobs = jobs.slice(0, 3);

  const matchRate = (() => {
    if (!jobs || jobs.length === 0) return 0;
    const scores = jobs.map((j: any) => Number(j.matchScore || 0)).filter((n: number) => !isNaN(n));
    if (scores.length === 0) return 0;
    const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    return Math.round(avg);
  })();

  return (
    <Sidebar>
      <div className="p-8 max-w-6xl mx-auto space-y-8 bg-white dark:bg-[#0A0A0F] text-slate-900 dark:text-white">
        {/* Welcome */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Good morning, {user?.name?.split(' ')[0] || 'User'} 👋
            </h1>
            <p className="text-slate-600 dark:text-[#A0A0B8] mt-1">Here's what's happening with your job search today.</p>
          </div>
          <Link to="/jobs" className="btn-primary flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Jobs
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="card-soft p-6 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-[#A0A0B8] font-medium">Jobs Found Today</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats?.total ?? 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="card-soft p-6 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-[#A0A0B8] font-medium">Applications Sent</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats?.applied ?? 0}</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
          <div className="card-soft p-6 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-[#A0A0B8] font-medium">Interviews</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats?.interview ?? 0}</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>
          <div className="card-soft p-6 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-[#A0A0B8] font-medium">Match Rate</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{matchRate}%</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
          <div className="card-soft p-6 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-[#A0A0B8] font-medium">Saved Jobs</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{savedCount}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Jobs & Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Today's Jobs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Today's Top Matches</h2>
              <Link to="/jobs" className="text-sm text-primary font-medium hover:underline">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-slate-500 dark:text-[#A0A0B8]">Loading jobs...</div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 dark:text-[#A0A0B8]">No jobs found yet</h3>
                  <p className="text-slate-400 dark:text-[#6B6B80] mb-4">Click the button below to start searching</p>
                  <Link to="/jobs" className="btn-primary">Find Jobs Now</Link>
                </div>
              ) : (
                displayJobs.map((job: any) => (
                  <div key={job._id} className="card-hover p-6 bg-white dark:bg-[#1A1A2E] border border-slate-100 dark:border-[#2A2A3E] overflow-hidden">
                    <div className="flex justify-between items-start flex-1 min-w-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-[#12121A] rounded-lg flex items-center justify-center font-bold text-primary">
                            {(job.company || '?').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white truncate">{job.title}</h3>
                            <p className="text-slate-600 dark:text-[#A0A0B8] text-sm truncate">{job.company}</p>
                            <p className="text-xs text-slate-500 dark:text-[#6B6B80]">Source: {job.source || 'Unknown'}</p>
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        job.matchScore > 70 ? 'bg-success/10 text-success' : job.matchScore > 50 ? 'bg-warning/10 text-warning' : 'bg-red-100 text-red-600'
                      }`}>
                        {job.matchScore ?? 0}% Match
                      </div>
                    </div>
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-[#A0A0B8] text-sm">
                        <Clock className="w-4 h-4" />
                        {job.location}
                      </div>
                      <p className="text-slate-600 dark:text-[#A0A0B8] text-sm">{job.stipend}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Link to={`/interview-prep/${job._id}`} className="btn-secondary">Interview Prep</Link>
                      <Link to="/jobs" className="btn-secondary">View Details</Link>
                      {job.applyLink ? (
                        <a href={job.applyLink} target="_blank" rel="noreferrer" className="btn-primary">Apply Now</a>
                      ) : (
                        <button className="btn-primary" disabled>Apply Now</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/jobs" className="card-hover p-4 flex items-center gap-4 block bg-white dark:bg-[#12121A] border border-slate-100 dark:border-[#2A2A3E]">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Interview Prep</p>
                  <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Practice for interviews</p>
                </div>
              </Link>
              <Link to="/resume" className="card-hover p-4 flex items-center gap-4 block bg-white dark:bg-[#12121A] border border-slate-100 dark:border-[#2A2A3E]">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Upload Resume</p>
                  <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Get better job matches</p>
                </div>
              </Link>
              <Link to="/applications" className="card-hover p-4 flex items-center gap-4 block bg-white dark:bg-[#12121A] border border-slate-100 dark:border-[#2A2A3E]">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Track Applications</p>
                  <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Manage all your applications</p>
                </div>
              </Link>
              <Link to="/career" className="card-hover p-4 flex items-center gap-4 block bg-white dark:bg-[#12121A] border border-slate-100 dark:border-[#2A2A3E]">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Career Growth</p>
                  <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Track XP, streaks, and goals</p>
                </div>
              </Link>
            </div>

            {/* Upcoming Interviews */}
            <div className="card-soft p-6 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Upcoming Interviews</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-warning pl-4 py-1">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">Google Product Designer</p>
                  <p className="text-slate-600 dark:text-[#A0A0B8] text-xs mt-1">Tomorrow at 3:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
