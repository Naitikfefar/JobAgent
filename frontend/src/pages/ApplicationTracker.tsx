import { useEffect, useState } from 'react';
import { getApplications, getApplicationStats, createApplication, updateApplication, deleteApplication } from '@/services/api';
import Sidebar from '@/components/layout/Sidebar';
import { Briefcase, Clock, Calendar, CheckCircle2, XCircle, Plus, TrendingUp } from 'lucide-react';

export default function ApplicationTracker() {
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newApp, setNewApp] = useState({ jobTitle: '', company: '', applyLink: '', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([getApplications(), getApplicationStats()]);
      setApplications(appsRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getByStatus = (status: string) => applications.filter((a) => a.status === status);

  const columns = [
    { id: 'applied', title: 'Applied', color: 'border-slate-400 bg-slate-50', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'under_review', title: 'Under Review', color: 'border-primary bg-primary/5', icon: <Clock className="w-4 h-4" /> },
    { id: 'interview_scheduled', title: 'Interview', color: 'border-warning bg-warning/5', icon: <Calendar className="w-4 h-4" /> },
    { id: 'offered', title: 'Offered', color: 'border-success bg-success/5', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'rejected', title: 'Rejected', color: 'border-red-400 bg-red-50', icon: <XCircle className="w-4 h-4" /> }
  ];

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return isoDate;
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateApplication(id, { status: newStatus });
      setApplications((prev) => prev.map((a) => (a._id === id ? { ...a, status: newStatus } : a)));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error('Failed to delete application', err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createApplication({ jobTitle: newApp.jobTitle, company: newApp.company, applyLink: newApp.applyLink, notes: newApp.notes, status: 'applied' });
      setShowAddModal(false);
      setNewApp({ jobTitle: '', company: '', applyLink: '', notes: '' });
      await fetchData();
    } catch (err) {
      console.error('Failed to create application', err);
    }
  };

  return (
    <Sidebar>
      <div className="p-8 space-y-8 bg-white dark:bg-[#0A0A0F] text-slate-900 dark:text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Application Tracker</h1>
            <p className="text-slate-600 dark:text-[#A0A0B8] mt-1">Manage your job applications</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Application
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card-soft p-4 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <p className="text-sm text-slate-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.total ?? 0}</p>
          </div>
          <div className="card-soft p-4 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <p className="text-sm text-slate-600 font-medium">Applied</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.applied ?? 0}</p>
          </div>
          <div className="card-soft p-4 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <p className="text-sm text-slate-600 font-medium">Review</p>
            <p className="text-2xl font-bold text-primary">{stats?.under_review ?? 0}</p>
          </div>
          <div className="card-soft p-4 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <p className="text-sm text-slate-600 font-medium">Interview</p>
            <p className="text-2xl font-bold text-warning">{stats?.interview_scheduled ?? 0}</p>
          </div>
          <div className="card-soft p-4 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <p className="text-sm text-slate-600 font-medium">Offered</p>
            <p className="text-2xl font-bold text-success">{stats?.offered ?? 0}</p>
          </div>
          <div className="card-soft p-4 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <p className="text-sm text-slate-600 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-slate-500">{stats?.rejected ?? 0}</p>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-max pb-4">
            {columns.map((col) => (
              <div key={col.id} className="w-72 shrink-0">
                <div className={`border-l-4 ${col.color} px-4 py-3 rounded-t-lg bg-white dark:bg-[#12121A] border-x border-t border-slate-200 dark:border-[#2A2A3E]`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{col.icon}</span>
                        <h3 className="font-bold text-slate-900 dark:text-white">{col.title}</h3>
                    </div>
                      <span className="bg-slate-200 dark:bg-[#1A1A2E] text-slate-700 dark:text-[#A0A0B8] text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center">
                      {getByStatus(col.id).length}
                    </span>
                  </div>
                </div>
                  <div className="border border-t-0 border-slate-200 dark:border-[#2A2A3E] bg-slate-50 dark:bg-[#0F0F16] rounded-b-lg p-3 space-y-3 min-h-[120px]">
                  {getByStatus(col.id).length === 0 ? (
                      <div className="text-center text-slate-500 dark:text-[#A0A0B8] py-6">No applications here yet</div>
                  ) : (
                    getByStatus(col.id).map((app: any) => (
                        <div key={app._id} className="card-soft p-4 bg-white dark:bg-[#12121A] border border-slate-100 dark:border-[#2A2A3E]">
                        <div className="flex justify-between items-start">
                          <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">{app.jobTitle}</h4>
                              <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">{app.company}</p>
                              <p className="text-xs text-slate-500 dark:text-[#6B6B80] mt-2">{formatDate(app.appliedAt || app.createdAt)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{app.status}</div>
                            <div className="flex gap-2">
                              <select
                                value={app.status}
                                onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                  className="text-sm p-1 border rounded bg-white dark:bg-[#12121A] dark:text-white"
                              >
                                <option value="applied">Applied</option>
                                <option value="under_review">Under Review</option>
                                <option value="interview_scheduled">Interview</option>
                                <option value="offered">Offered</option>
                                <option value="rejected">Rejected</option>
                              </select>
                              <button onClick={() => handleDelete(app._id)} className="text-red-600">Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddModal(false)} />
            <form onSubmit={handleAddSubmit} className="relative z-10 w-full max-w-xl bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Add Application</h3>
              <div className="space-y-3">
                <input value={newApp.jobTitle} onChange={(e) => setNewApp((s) => ({ ...s, jobTitle: e.target.value }))} placeholder="Job Title" className="w-full p-2 border rounded" required />
                <input value={newApp.company} onChange={(e) => setNewApp((s) => ({ ...s, company: e.target.value }))} placeholder="Company" className="w-full p-2 border rounded" required />
                <input value={newApp.applyLink} onChange={(e) => setNewApp((s) => ({ ...s, applyLink: e.target.value }))} placeholder="Apply Link (optional)" className="w-full p-2 border rounded" />
                <textarea value={newApp.notes} onChange={(e) => setNewApp((s) => ({ ...s, notes: e.target.value }))} placeholder="Notes (optional)" className="w-full p-2 border rounded" />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Add</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
