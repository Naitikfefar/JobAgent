import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { FileText, Download, Plus, ExternalLink, X } from 'lucide-react';
import { getTodayJobs } from '@/services/api';

export default function CoverLetterCenter() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [copying, setCopying] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchCoverLetters = async () => {
      setLoading(true);
      try {
        const response = await getTodayJobs();
        const jobsWithLetters = (response.data || []).filter((job: any) => job.coverLetter);
        setJobs(jobsWithLetters);
      } catch (err) {
        console.error('Failed to fetch cover letters:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoverLetters();
  }, []);

  const handleCopy = async (text: string, jobId: string) => {
    try {
      setCopying(jobId);
      await navigator.clipboard.writeText(text);
      setTimeout(() => setCopying(null), 2000);
    } catch (e) {
      console.error('Copy failed', e);
      setCopying(null);
    }
  };

  const handleDownload = (job: any) => {
    const blob = new Blob([job.coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CoverLetter-${job.company}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openModal = (job: any) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedJob(null);
  };

  return (
    <Sidebar>
      <div className="p-8 max-w-6xl mx-auto space-y-8 bg-white dark:bg-[#0A0A0F] text-slate-900 dark:text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cover Letter Center</h1>
            <p className="text-slate-600 dark:text-[#A0A0B8] mt-1">AI-generated cover letters</p>
          </div>
          <Link to="/jobs" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Generate New
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-hover p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded mb-4 w-1/3" />
                <div className="h-12 bg-slate-100 rounded mb-4" />
                <div className="h-8 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="card-soft p-8 text-center text-slate-600 dark:text-[#A0A0B8] bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
            <div className="text-lg font-medium mb-2">No cover letters yet</div>
            <div className="mb-4">Go to Job Recommendations and search for jobs. Cover letters are auto-generated for each job found.</div>
            <Link to="/jobs" className="btn-primary">Go to Job Recommendations</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
              {jobs.map((job) => (
              <div key={job._id} className="card-hover p-6 bg-white dark:bg-[#1A1A2E] border border-slate-100 dark:border-[#2A2A3E]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl font-bold text-primary">
                      {job.company?.[0] || '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{job.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-[#A0A0B8]">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#12121A] text-slate-700 dark:text-[#A0A0B8]">{job.source || 'Unknown'}</div>
                    <div className="px-2 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">{job.matchScore ?? '-'}%</div>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-[#A0A0B8] text-sm line-clamp-3 mb-4">{(job.coverLetter || '').slice(0, 150)}{(job.coverLetter || '').length > 150 ? '...' : ''}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(job.coverLetter || '', job._id)}
                    className="btn-secondary flex items-center gap-2 text-sm py-2 px-3"
                  >
                    {copying === job._id ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={() => handleDownload(job)} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
                    <Download className="w-4 h-4" /> Download .txt
                  </button>
                  <button onClick={() => openModal(job)} className="btn-ghost flex items-center gap-2 text-sm py-2 px-3">
                    <ExternalLink className="w-4 h-4" /> View Full
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
            <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedJob.title} — {selectedJob.company}</h3>
                </div>
                <button onClick={closeModal} className="text-slate-500 hover:text-slate-700"><X /></button>
              </div>
              <div className="prose max-w-none text-slate-700 whitespace-pre-wrap">{selectedJob.coverLetter}</div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => handleCopy(selectedJob.coverLetter || '', selectedJob._id)} className="btn-secondary">Copy All</button>
                <button onClick={closeModal} className="btn-ghost">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
