import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { getInterviewPrep, saveInterviewAnswer, getJobById } from '@/services/api';
import { ArrowLeft, CheckCircle, Sparkles, Clock, Target, Star, MessageSquare, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function InterviewPrep() {
  const { jobId } = useParams<{ jobId: string }>();
  const [interviewPrep, setInterviewPrep] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [ratings, setRatings] = useState<{ [key: number]: number }>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!jobId) return;
      setLoading(true);
      setError(null);
      try {
        const [prepRes, jobRes] = await Promise.all([
          getInterviewPrep(jobId),
          getJobById(jobId)
        ]);
        setInterviewPrep(prepRes.data);
        setJob(jobRes.data);

        // Initialize answers from job data if available
        const initialAnswers: { [key: number]: string } = {};
        const initialRatings: { [key: number]: number } = {};
        jobRes.data.interviewAnswers?.forEach((ans: any) => {
          initialAnswers[ans.questionId] = ans.userAnswer || '';
          initialRatings[ans.questionId] = ans.rating || 0;
        });
        setUserAnswers(initialAnswers);
        setRatings(initialRatings);
      } catch (err: any) {
        console.error('Failed to fetch interview prep:', err);
        if (err.response?.status === 403) {
          setError('Interview Prep is a Pro feature. Upgrade your subscription to access this.');
        } else {
          setError('Failed to load interview preparation content.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId]);

  const handleSaveAnswer = async (questionId: number) => {
    if (!jobId) return;
    setSaving(questionId);
    try {
      await saveInterviewAnswer({
        jobId,
        questionId,
        userAnswer: userAnswers[questionId] || '',
        rating: ratings[questionId] || 0
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    } finally {
      setSaving(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technical': return 'bg-blue-500';
      case 'dsa': case 'problem solving': return 'bg-purple-500';
      case 'behavioral': return 'bg-green-500';
      case 'system design': return 'bg-orange-500';
      case 'hr': case 'culture fit': return 'bg-pink-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <Sidebar>
      <div className="p-8 max-w-5xl mx-auto space-y-6 bg-white dark:bg-[#0A0A0F] text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/jobs" className="btn-ghost flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to Jobs
          </Link>
        </div>

        {error ? (
          <div className="card-soft p-8 text-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <div className="text-lg font-medium mb-2">Error</div>
            <div>{error}</div>
            <Link to="/jobs" className="btn-primary mt-4 inline-block">Go to Jobs</Link>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card-hover p-6 animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-4 w-1/3" />
                <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded mb-4" />
                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* How to Use Guide */}
            <div className="card-soft bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">How to use this feature</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-300">Maximize your interview preparation</p>
                  </div>
                </div>
                {showGuide ? <ChevronUp className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              </button>
              {showGuide && (
                <div className="px-4 pb-4 pt-0">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#1A1A2E] rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                      <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mb-2">1</div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Review the Overview</h4>
                      <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Check the difficulty level and estimated preparation time to plan your study session.</p>
                    </div>
                    <div className="bg-white dark:bg-[#1A1A2E] rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                      <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mb-2">2</div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Go Through the Questions</h4>
                      <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Expand each question to see model answers, tips, and follow-up questions tailored to this job.</p>
                    </div>
                    <div className="bg-white dark:bg-[#1A1A2E] rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                      <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mb-2">3</div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Practice & Save Answers</h4>
                      <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Write your own answers, rate your confidence, and save them for later review.</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-white dark:bg-[#1A1A2E] rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Company-Specific Tips & Checklist</h4>
                    <p className="text-sm text-slate-600 dark:text-[#A0A0B8]">Don't forget to use the company-specific tips and preparation checklist to get fully ready for your interview!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Job Info & Prep Overview */}
            <div className="card-soft p-6 bg-gradient-to-r from-primary/5 to-success/5 dark:from-primary/10 dark:to-success/10 border border-primary/20 dark:border-primary/30">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl font-bold text-primary shrink-0">
                  {job?.company?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{job?.title}</h1>
                  <p className="text-slate-600 dark:text-[#A0A0B8] mb-3">{job?.company}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Difficulty: <strong>{interviewPrep?.difficulty || 'Medium'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-success" />
                      <span>Est. Prep: <strong>{interviewPrep?.estimated_prep_time || '2-3 hours'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Tips & Checklist */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card-hover bg-white dark:bg-[#1A1A2E] border border-slate-200 dark:border-[#2A2A3E] p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Company-Specific Tips
                </h3>
                <ul className="space-y-2">
                  {interviewPrep?.company_specific_tips?.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-slate-600 dark:text-[#A0A0B8]">{tip}</span>
                    </li>
                  )) || []}
                </ul>
              </div>

              <div className="card-hover bg-white dark:bg-[#1A1A2E] border border-slate-200 dark:border-[#2A2A3E] p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Preparation Checklist
                </h3>
                <ul className="space-y-2">
                  {interviewPrep?.preparation_checklist?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded border-2 border-primary flex items-center justify-center shrink-0 mt-0.5" />
                      <span className="text-slate-600 dark:text-[#A0A0B8]">{item}</span>
                    </li>
                  )) || []}
                </ul>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Interview Questions</h2>
              {interviewPrep?.questions?.map((q: any) => (
                <div key={q.id} className="card-hover bg-white dark:bg-[#1A1A2E] border border-slate-200 dark:border-[#2A2A3E] overflow-hidden">
                  <button
                    onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                    className="w-full p-6 text-left flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getCategoryColor(q.category)}`}>
                          {q.category}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-[#A0A0B8]">{q.difficulty}</span>
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">{q.question}</h3>
                    </div>
                    <div className="text-slate-400">
                      {expandedQuestion === q.id ? '↑' : '↓'}
                    </div>
                  </button>

                  {expandedQuestion === q.id && (
                    <div className="border-t border-slate-200 dark:border-[#2A2A3E] p-6 space-y-6">
                      {/* Model Answer */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          Model Answer
                        </h4>
                        <div className="p-4 bg-slate-50 dark:bg-[#12121A] rounded-lg text-slate-700 dark:text-[#A0A0B8] whitespace-pre-wrap">
                          {q.model_answer}
                        </div>
                      </div>

                      {/* Tips */}
                      {q.tips && (
                        <div>
                          <h4 className="text-sm font-semibold text-success mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Tips
                          </h4>
                          <p className="text-slate-600 dark:text-[#A0A0B8]">{q.tips}</p>
                        </div>
                      )}

                      {/* Follow-up Question */}
                      {q.follow_up && (
                        <div>
                          <h4 className="text-sm font-semibold text-warning mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Follow-up Question
                          </h4>
                          <p className="text-slate-600 dark:text-[#A0A0B8]">{q.follow_up}</p>
                        </div>
                      )}

                      {/* Your Answer */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          Your Answer
                        </h4>
                        <textarea
                          value={userAnswers[q.id] || ''}
                          onChange={(e) => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })}
                          placeholder="Write your answer here..."
                          className="w-full p-4 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E] rounded-lg focus:outline-none focus:border-primary text-slate-900 dark:text-white min-h-[120px]"
                        />
                        
                        {/* Rating */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-600 dark:text-[#A0A0B8]">Rate your confidence:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => setRatings({ ...ratings, [q.id]: star })}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`w-5 h-5 ${star <= (ratings[q.id] || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
                                />
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => handleSaveAnswer(q.id)}
                            disabled={saving === q.id}
                            className="btn-primary ml-auto"
                          >
                            {saving === q.id ? 'Saving...' : 'Save Answer'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Sidebar>
  );
}
