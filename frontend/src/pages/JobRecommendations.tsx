import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTodayJobs, searchJobs, updateJobStatus, toggleBookmark, getBookmarkedJobs, recordCareerActivity } from '@/services/api';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { Search, Filter, FileText, Mail, ExternalLink, CheckCircle2, XCircle, Bookmark, Share2, Check, Sparkles } from 'lucide-react';

export default function JobRecommendations() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);

  // No dummy jobs here — real jobs come from the backend

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only fetch jobs after auth check completes and user is present
    const fetchJobs = async () => {
      try {
        const res = await getTodayJobs();
        const data = res.data || [];
        const unique = data.filter((job: any, index: number, self: any[]) =>
          index === self.findIndex(j => j._id === job._id)
        );
        setJobs(unique);
        await recordCareerActivity('recommendations_reviewed');
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
        setJobs([]);
      }
    };

    if (!authLoading && user) {
      fetchJobs();
    } else {
      // no logged in user — ensure empty jobs
      setJobs([]);
    }
  }, [authLoading, user]);

  const handleBookmark = async (jobId: string) => {
    try {
      const response: any = await toggleBookmark(jobId);
      const isBookmarked = response?.data?.isBookmarked;
      setJobs(prev => (prev || []).map(j => j._id === jobId ? { ...j, isBookmarked } : j));
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  const showSaved = async () => {
    setActiveTab('saved');
    try {
      const res = await getBookmarkedJobs();
      setJobs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch bookmarked jobs:', err);
    }
  };

  const showAll = async () => {
    setActiveTab('all');
    try {
      const res = await getTodayJobs();
      setJobs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  const displayJobs = jobs || [];

  // Deduplicate jobs by _id for rendering
  const uniqueJobs = (displayJobs || []).filter((job: any, index: number, self: any[]) =>
    index === self.findIndex(j => j._id === job._id)
  );

  const handleSearchJobs = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response: any = await searchJobs();
      const results = response?.data || [];
      setJobs(results.filter((job: any, index: number, self: any[]) =>
        index === self.findIndex(j => j._id === job._id)
      ));
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (jobId: string, status: string) => {
    try {
      await updateJobStatus(jobId, status);
      setJobs((displayJobs || []).map((job: any) =>
        job._id === jobId ? { ...job, status } : job
      ));
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleShare = async (job: any) => {
    const shareText = `🎯 Check out this ${job.title} opportunity at ${job.company}!

Match Score: ${job.matchScore}%
Stipend: ${job.stipend}
Source: ${job.source}

Apply here: ${job.applyLink}

Found via JobCopilot 🤖`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${job.title} at ${job.company}`,
          text: shareText,
          url: job.applyLink
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopiedJobId(job._id);
        setTimeout(() => setCopiedJobId(null), 2000);
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const shareOnWhatsApp = (job: any) => {
    const text = encodeURIComponent(`🎯 ${job.title} at ${job.company} - ${job.matchScore}% match! Apply: ${job.applyLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Sidebar>
      <div className="p-8 max-w-6xl mx-auto space-y-6 bg-white dark:bg-[#0A0A0F] text-slate-900 dark:text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Job Recommendations</h1>
            <p className="text-slate-600 dark:text-[#A0A0B8] mt-1">Find your next opportunity</p>
          </div>
          <button onClick={handleSearchJobs} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? 'Searching...' : 'Refresh Jobs'}
          </button>
        </div>

        {/* Filters */}
        <div className="card-soft p-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-[#A0A0B8]" />
            <input
              type="text"
              placeholder="Search jobs, companies..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0F0F16] border border-slate-200 dark:border-[#2A2A3E] rounded-lg focus:outline-none focus:border-primary text-slate-900 dark:text-white"
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={showAll} className={`px-3 py-1 rounded-full ${activeTab === 'all' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-[#12121A] text-slate-600 dark:text-[#A0A0B8]'}`}>All Jobs</button>
          <button onClick={showSaved} className={`px-3 py-1 rounded-full ${activeTab === 'saved' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-[#12121A] text-slate-600 dark:text-[#A0A0B8]'}`}>Saved</button>
        </div>

        {/* Jobs Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {Array.isArray(uniqueJobs) ? uniqueJobs.map((job: any) => (
            <div key={job._id} className="card-hover bg-white dark:bg-[#1A1A2E] border border-slate-100 dark:border-[#2A2A3E] overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-[#12121A] rounded-xl flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                      {job.company?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{job.title}</h3>
                      <p className="text-slate-600 dark:text-[#A0A0B8] truncate">{job.company}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-xs bg-slate-100 dark:bg-[#12121A] text-slate-700 dark:text-[#A0A0B8] px-2 py-1 rounded-full">{job.source}</span>
                        <span className="text-sm text-slate-600 dark:text-[#A0A0B8] truncate">{job.location}</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{job.stipend}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                    job.matchScore >= 80 ? 'bg-success/10 text-success' :
                    job.matchScore >= 60 ? 'bg-warning/10 text-warning' :
                    'bg-slate-100 dark:bg-[#12121A] text-slate-600 dark:text-[#A0A0B8]'
                  }`}>
                    {job.matchScore}% Match
                  </div>
                </div>

                <p className="text-slate-600 dark:text-[#A0A0B8] text-sm mb-4 line-clamp-2 overflow-hidden">{job.about}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-success font-semibold mb-2 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Matched Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(job.matchedSkills || []).map((skill: string, i: number) => (
                        <span key={i} className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-[#A0A0B8] font-semibold mb-2 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> To Improve
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(job.missingSkills || []).map((skill: string, i: number) => (
                        <span key={i} className="text-xs bg-slate-100 dark:bg-[#12121A] text-slate-600 dark:text-[#A0A0B8] px-2 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={job.applyLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" /> Apply Now
                  </a>
                  <Link
                    to={`/interview-prep/${job._id}`}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" /> Interview Prep
                  </Link>
                  <button className="btn-secondary flex items-center justify-center gap-2">
                    <Mail className="w-5 h-5" /> Cover Letter
                  </button>
                  <button
                    onClick={() => handleShare(job)}
                    className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#2A2A3E] text-slate-700 dark:text-[#A0A0B8] hover:bg-slate-50 dark:hover:bg-[#12121A] transition-colors"
                    title="Share this job"
                  >
                    {copiedJobId === job._id
                      ? <><Check className="w-4 h-4 text-green-500" /> Copied!</>
                      : <><Share2 className="w-4 h-4" /> Share</>
                    }
                  </button>
                  <button
                    onClick={() => shareOnWhatsApp(job)}
                    className="flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2A2A3E] hover:bg-slate-50 dark:hover:bg-[#12121A] transition-colors"
                    title="Share on WhatsApp"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4" alt="" />
                  </button>
                  <a
                    href={job.applyLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-[#2A2A3E] dark:hover:bg-[#12121A] hover:bg-slate-50 transition-all"
                  >
                    <ExternalLink className="w-5 h-5 text-slate-700" />
                  </a>
                  <button onClick={() => handleBookmark(job._id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${job.isBookmarked ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 dark:border-[#2A2A3E] text-slate-600 dark:text-[#A0A0B8]'}`}>
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )) : null}
        </div>
      </div>
    </Sidebar>
  );
}
