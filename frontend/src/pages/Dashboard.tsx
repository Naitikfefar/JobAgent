import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getTodayJobs, getJobStats } from '@/services/api';
import { Briefcase, FileText, Calendar, TrendingUp, Zap, Search, Clock } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';

export default function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, statsRes] = await Promise.all([
          getTodayJobs(),
          getJobStats()
        ]);
        setJobs(jobsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const mockJobs = [
    {
      _id: '1',
      title: 'Senior React Developer',
      company: 'Google',
      location: 'Remote',
      stipend: '₹18-24 LPA',
      matchScore: 94,
      matchedSkills: ['React', 'TypeScript', 'Node.js']
    },
    {
      _id: '2',
      title: 'Full Stack Engineer',
      company: 'Microsoft',
      location: 'Bangalore',
      stipend: '₹15-20 LPA',
      matchScore: 87,
      matchedSkills: ['React', 'MongoDB', 'Node.js']
    },
    {
      _id: '3',
      title: 'Data Scientist Intern',
      company: 'Amazon',
      location: 'Hybrid',
      stipend: '₹12-15 LPA',
      matchScore: 78,
      matchedSkills: ['Python', 'Machine Learning', 'SQL']
    }
  ];

  const displayJobs = jobs.length > 0 ? jobs : mockJobs;
  const defaultStats = { total: 47, new: 18, applied: 11, interview: 2, rejected: 12, offered: 1 };
  const displayStats = stats || defaultStats;

  return (
    <Sidebar>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        {/* Welcome */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Good morning, {user?.name?.split(' ')[0] || 'User'} 👋
            </h1>
            <p className="text-slate-600 mt-1">Here's what's happening with your job search today.</p>
          </div>
          <Link to="/jobs" className="btn-primary flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Jobs
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Today's Jobs</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{displayJobs.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-success" />
              +12 from yesterday
            </p>
          </div>
          <div className="card-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Applications Sent</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{displayStats.applied}</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
          <div className="card-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Interviews</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{displayStats.interview}</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>
          <div className="card-soft p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Offers</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{displayStats.offered}</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-success" />
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
              {displayJobs.map((job: any) => (
                <div key={job._id} className="card-hover p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-primary">
                          {job.company.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{job.title}</h3>
                          <p className="text-slate-600 text-sm">{job.company}</p>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      job.matchScore >= 80 ? 'bg-success/10 text-success' :
                      job.matchScore >= 60 ? 'bg-warning/10 text-warning' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {job.matchScore}% Match
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1 text-slate-600 text-sm">
                      <Clock className="w-4 h-4" />
                      {job.location}
                    </div>
                    <p className="text-slate-600 text-sm">{job.stipend}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {job.matchedSkills?.map((skill: string, i: number) => (
                      <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/resume" className="card-hover p-4 flex items-center gap-4 block">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Upload Resume</p>
                  <p className="text-sm text-slate-600">Get better job matches</p>
                </div>
              </Link>
              <Link to="/applications" className="card-hover p-4 flex items-center gap-4 block">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Track Applications</p>
                  <p className="text-sm text-slate-600">Manage all your applications</p>
                </div>
              </Link>
            </div>

            {/* Upcoming Interviews */}
            <div className="card-soft p-6">
              <h3 className="font-bold text-slate-900 mb-4">Upcoming Interviews</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-warning pl-4 py-1">
                  <p className="font-semibold text-slate-900 text-sm">Google Product Designer</p>
                  <p className="text-slate-600 text-xs mt-1">Tomorrow at 3:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
