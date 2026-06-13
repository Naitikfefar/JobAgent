import { useEffect, useState } from 'react';
import { getApplications, getApplicationStats } from '@/services/api';
import Sidebar from '@/components/layout/Sidebar';
import { Briefcase, Clock, Calendar, CheckCircle2, XCircle, Plus, TrendingUp } from 'lucide-react';

export default function ApplicationTracker() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState<any>(null);

  const mockApps = {
    applied: [
      { id: '1', title: 'Senior React Developer', company: 'Google', date: '2 days ago' },
      { id: '2', title: 'Full Stack Engineer', company: 'Microsoft', date: '1 day ago' }
    ],
    under_review: [
      { id: '3', title: 'Frontend Engineer', company: 'Spotify', date: '3 days ago' }
    ],
    interview: [
      { id: '4', title: 'Product Designer', company: 'Google', date: 'Tomorrow at 3 PM' }
    ],
    rejected: [
      { id: '5', title: 'Backend Developer', company: 'Amazon', date: '1 week ago' }
    ],
    offered: [
      { id: '6', title: 'Junior Developer', company: 'Startup X', date: '2 days ago' }
    ]
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, statsRes] = await Promise.all([
          getApplications(),
          getApplicationStats()
        ]);
        if (appsRes.data.length > 0) setApplications(appsRes.data);
        if (statsRes.data) setStats(statsRes.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  const defaultStats = { total: 15, applied: 5, under_review: 3, interview: 2, rejected: 4, offered: 1 };
  const displayStats = stats || defaultStats;

  const columns = [
    { id: 'applied', title: 'Applied', color: 'border-slate-400 bg-slate-50', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'under_review', title: 'Under Review', color: 'border-primary bg-primary/5', icon: <Clock className="w-4 h-4" /> },
    { id: 'interview', title: 'Interviews', color: 'border-warning bg-warning/5', icon: <Calendar className="w-4 h-4" /> },
    { id: 'offered', title: 'Offers', color: 'border-success bg-success/5', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'rejected', title: 'Rejected', color: 'border-red-400 bg-red-50', icon: <XCircle className="w-4 h-4" /> }
  ];

  return (
    <Sidebar>
      <div className="p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Application Tracker</h1>
            <p className="text-slate-600 mt-1">Manage your job applications</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Application
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card-soft p-4">
            <p className="text-sm text-slate-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-slate-900">{displayStats.total}</p>
          </div>
          <div className="card-soft p-4">
            <p className="text-sm text-slate-600 font-medium">Applied</p>
            <p className="text-2xl font-bold text-slate-900">{displayStats.applied}</p>
          </div>
          <div className="card-soft p-4">
            <p className="text-sm text-slate-600 font-medium">Review</p>
            <p className="text-2xl font-bold text-primary">{displayStats.under_review}</p>
          </div>
          <div className="card-soft p-4">
            <p className="text-sm text-slate-600 font-medium">Interview</p>
            <p className="text-2xl font-bold text-warning">{displayStats.interview}</p>
          </div>
          <div className="card-soft p-4">
            <p className="text-sm text-slate-600 font-medium">Offered</p>
            <p className="text-2xl font-bold text-success">{displayStats.offered}</p>
          </div>
          <div className="card-soft p-4">
            <p className="text-sm text-slate-600 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-slate-500">{displayStats.rejected}</p>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-max pb-4">
            {columns.map((col) => (
              <div key={col.id} className="w-72 shrink-0">
                <div className={`border-l-4 ${col.color} px-4 py-3 rounded-t-lg bg-white border-x border-t border-slate-200`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{col.icon}</span>
                      <h3 className="font-bold text-slate-900">{col.title}</h3>
                    </div>
                    <span className="bg-slate-200 text-slate-700 text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center">
                      {(mockApps as any)[col.id].length}
                    </span>
                  </div>
                </div>
                <div className="border border-t-0 border-slate-200 bg-slate-50 rounded-b-lg p-3 space-y-3">
                  {(mockApps as any)[col.id].map((app: any) => (
                    <div key={app.id} className="card-soft p-4">
                      <h4 className="font-semibold text-slate-900">{app.title}</h4>
                      <p className="text-sm text-slate-600">{app.company}</p>
                      <p className="text-xs text-slate-500 mt-2">{app.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
