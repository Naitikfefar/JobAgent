import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { uploadResume, getTodayJobs, generateResume, downloadResume, scoreResume, getMe } from '@/services/api';
import Sidebar from '@/components/layout/Sidebar';
import { FileText, Upload, Download, CheckCircle2, XCircle, Trash2, Plus, Sparkles } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ResumeCenter() {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedSkills, setUploadedSkills] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [jobs, setJobs] = useState<any[]>([]);
  const [generatedResumes, setGeneratedResumes] = useState<any[]>([]);
  const [loadingJobId, setLoadingJobId] = useState<string | null>(null);
  const [failedJobIds, setFailedJobIds] = useState<string[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedJobForScore, setSelectedJobForScore] = useState<any | null>(null);
  const [scoreResult, setScoreResult] = useState<any | null>(null);
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await getTodayJobs();
        const todaysJobs = res.data || [];
        setJobs(todaysJobs);
        const generated = todaysJobs.filter((j: any) => !!j.resumePath);
        setGeneratedResumes(generated);
      } catch (err) {
        console.error('Failed to load jobs:', err);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!selectedJobForScore) return;
    const refreshedJob = jobs.find((job) => job._id === selectedJobForScore._id);
    if (refreshedJob) {
      setSelectedJobForScore(refreshedJob);
    }
  }, [jobs, selectedJobForScore]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadResume(file);
      setUploadedFile(file.name);
      const skills = res.data?.parsed?.skills || [];
      setUploadedSkills(skills);
      const me = await getMe();
      updateUser(me.data);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      handleFileUpload(file);
    }
  };

  const handleGenerate = async (jobId: string) => {
    setLoadingJobId(jobId);
    setFailedJobIds((s) => s.filter((id) => id !== jobId));
    try {
      await generateResume(jobId);
      // refresh jobs to pick up resumePath
      const res = await getTodayJobs();
      const todaysJobs = res.data || [];
      setJobs(todaysJobs);
      setGeneratedResumes(todaysJobs.filter((j: any) => !!j.resumePath));
    } catch (err) {
      console.error('Generate failed for', jobId, err);
      setFailedJobIds((s) => [...s, jobId]);
    } finally {
      setLoadingJobId(null);
    }
  };

  const handleAnalyzeScore = async () => {
    if (!selectedJobForScore) {
      setScoreError('Select a job to analyze.');
      return;
    }

    const resumeText = user?.resume?.parsedText;
    if (!resumeText) {
      setScoreError('Upload a resume first so it can be parsed for scoring.');
      return;
    }

    setScoring(true);
    setScoreError(null);
    try {
      const res = await scoreResume({
        resumeText,
        jobDescription: selectedJobForScore.about || `${selectedJobForScore.title} ${selectedJobForScore.company}`
      });
      setScoreResult({ ...res.data, jobId: selectedJobForScore._id });
    } catch (err: any) {
      console.error('Resume scoring failed:', err);
      setScoreError(err?.response?.data?.message || 'Resume scoring failed.');
    } finally {
      setScoring(false);
    }
  };

  const handleDownload = async (jobId: string, company: string) => {
    setDownloading(jobId);
    try {
      const response = await downloadResume(jobId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Resume-${company}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const normalizedScore = (value: any) => Math.max(0, Math.min(100, Number(value) || 0));

  const ScoreBar = ({ label, value }: { label: string; value: number }) => {
    const score = normalizedScore(value);
    return (
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-slate-700 dark:text-[#D6D6E7]">{label}</span>
          <span className="font-bold text-slate-900 dark:text-white">{score}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-[#252536] overflow-hidden">
          <div className={`h-full rounded-full ${scoreColor(score)}`} style={{ width: `${score}%` }} />
        </div>
      </div>
    );
  };

  const selectedOptimizedScore = selectedJobForScore?.optimizedResumeScore ?? selectedJobForScore?.matchScore;
  const canShowComparison = !!scoreResult && scoreResult.jobId === selectedJobForScore?._id && !!selectedJobForScore?.resumePath && selectedOptimizedScore !== undefined;
  const originalScore = normalizedScore(scoreResult?.overall_score);
  const optimizedScore = normalizedScore(selectedOptimizedScore);
  const improvement = optimizedScore - originalScore;

  return (
    <Sidebar>
      <div className="p-8 max-w-6xl mx-auto space-y-8 bg-white dark:bg-[#0A0A0F] text-slate-900 dark:text-white">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Resume Center</h1>
          <p className="text-slate-600 dark:text-[#A0A0B8] mt-1">Upload and optimize your resume</p>
        </div>

        {/* Master Resume Upload */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`card-soft p-12 text-center transition-all bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E] ${
            dragOver ? 'border-primary bg-primary/5' : ''
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${uploadedFile ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'} dark:bg-[#1A1A2E] dark:text-white`}>
              {uploadedFile ? <CheckCircle2 className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
            </div>
            <div className="space-y-2">
              {uploadedFile ? (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resume Uploaded!</h3>
                  <p className="text-slate-600 dark:text-[#A0A0B8]">{uploadedFile}</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Your Master Resume</h3>
                  <p className="text-slate-600 dark:text-[#A0A0B8]">Drag and drop a PDF, or click to browse</p>
                </div>
              )}
            </div>
            {!uploadedFile && (
              <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                <span>Browse Files</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
            )}
            {uploadedFile && (
              <button
                onClick={() => { setUploadedFile(null); setUploadedSkills([]); }}
                className="btn-ghost flex items-center gap-2 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-5 h-5" /> Replace File
              </button>
            )}

            {/* Show detected skills */}
            {uploadedSkills.length > 0 && (
              <div className="mt-4 text-left w-full max-w-2xl">
                <div className="text-sm text-slate-600 dark:text-[#A0A0B8] mb-2">Skills detected:</div>
                <div className="flex flex-wrap gap-2">
                  {uploadedSkills.map((s) => (
                    <div key={s} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#1A1A2E] text-slate-700 dark:text-white text-sm">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resume Score Analyzer */}
        <div className="card-soft p-6 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
            <div className="space-y-2 flex-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Resume Score Analyzer</h2>
              <select
                value={selectedJobForScore?._id || ''}
                onChange={(e) => {
                  const job = jobs.find((item) => item._id === e.target.value) || null;
                  setSelectedJobForScore(job);
                  setScoreResult(null);
                  setScoreError(null);
                }}
                className="w-full rounded-lg border border-slate-200 dark:border-[#2A2A3E] bg-white dark:bg-[#0F0F17] px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select a job from today's jobs</option>
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} at {job.company}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAnalyzeScore}
              disabled={scoring || !selectedJobForScore}
              className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {scoring ? 'Analyzing...' : 'Analyze Match Score'}
            </button>
          </div>

          {scoreError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {scoreError}
            </div>
          )}

          {scoreResult && (
            <div className="mt-6 grid lg:grid-cols-[240px_1fr] gap-6">
              <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 dark:border-[#2A2A3E] p-6 bg-slate-50 dark:bg-[#0F0F17]">
                <div className="w-36 h-36 rounded-full border-8 border-primary flex flex-col items-center justify-center text-primary bg-white dark:bg-[#12121A]">
                  <span className="text-sm font-semibold">Overall</span>
                  <span className="text-4xl font-bold">{originalScore}%</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-5">
                  <ScoreBar label="Keyword Match" value={scoreResult.keyword_match} />
                  <ScoreBar label="Skills Match" value={scoreResult.skills_match} />
                  <ScoreBar label="Experience Match" value={scoreResult.experience_match} />
                  <ScoreBar label="Format Score" value={scoreResult.format_score} />
                </div>

                {canShowComparison && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-semibold text-slate-800 dark:text-white">Original Resume: {originalScore}%</span>
                      <span className="text-emerald-700 dark:text-emerald-300">→</span>
                      <span className="font-semibold text-slate-800 dark:text-white">Optimized Resume: {optimizedScore}%</span>
                      {improvement > 0 && (
                        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                          +{improvement}% improvement
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {Array.isArray(scoreResult.missing_keywords) && scoreResult.missing_keywords.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">Add these keywords to your resume:</h3>
                    <div className="flex flex-wrap gap-2">
                      {scoreResult.missing_keywords.map((keyword: string) => (
                        <span key={keyword} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(scoreResult.improvement_tips) && scoreResult.improvement_tips.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">Improvement Tips</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 dark:text-[#D6D6E7]">
                      {scoreResult.improvement_tips.map((tip: string) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {Array.isArray(scoreResult.strong_points) && scoreResult.strong_points.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">Strong Points</h3>
                    <div className="space-y-2">
                      {scoreResult.strong_points.map((point: string) => (
                        <div key={point} className="flex items-start gap-2 text-sm text-slate-700 dark:text-[#D6D6E7]">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Jobs for Resume Generation */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Generate Tailored Resumes</h2>
            <Link to="/jobs" className="text-sm text-primary hover:underline">Go to Job Recommendations</Link>
          </div>

          {jobs.length === 0 ? (
            <div className="card-soft p-8 text-center text-slate-600 dark:text-[#A0A0B8] bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">No jobs found yet. Go to Job Recommendations and search for jobs first.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {jobs.map((job) => {
                const isGenerated = !!job.resumePath;
                const isLoading = loadingJobId === job._id;
                const isFailed = failedJobIds.includes(job._id);
                const isDownloading = downloading === job._id;
                return (
                  <div key={job._id} className="card-hover bg-white dark:bg-[#1A1A2E] border border-slate-100 dark:border-[#2A2A3E]">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{job.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-[#A0A0B8]">{job.company}</p>
                            <p className="text-xs text-slate-500 dark:text-[#6B6B80]">Source: {job.source}</p>
                          </div>
                        </div>
                        <div className="px-2 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">
                          {job.matchScore ?? '-'}%
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {isGenerated ? (
                          <button
                            onClick={() => handleDownload(job._id, job.company)}
                            className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm py-2"
                            disabled={isDownloading}
                          >
                            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                          </button>
                        ) : isLoading ? (
                          <button className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm py-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                          </button>
                        ) : isFailed ? (
                          <button onClick={() => handleGenerate(job._id)} className="btn-secondary flex-1 text-sm py-2 text-red-600">Failed - Retry</button>
                        ) : (
                          <button onClick={() => handleGenerate(job._id)} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2">
                            <Plus className="w-4 h-4" /> Generate Resume
                          </button>
                        )}

                        <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-500">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
