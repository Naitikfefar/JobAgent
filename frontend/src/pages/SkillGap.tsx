import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { getSkillGapAnalysis } from '@/services/api';
// Simple SVG circular progress renderer
function CircleProgress({ percent, size = 80, stroke = 8, color = '#7c3aed' }: any) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, percent)) / 100);
  const center = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <circle cx={center} cy={center} r={radius} stroke="#eee" strokeWidth={stroke} fill="none" />
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="url(#grad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </svg>
  );
}

export default function SkillGap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getSkillGapAnalysis();
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <Sidebar><div className="p-8">Analyzing skills...</div></Sidebar>;

  const gaps = data?.gaps || [];
  const matching = data?.matching || [];
  const totalJobs = data?.totalJobs || 0;
  const score = Math.round((matching.length / Math.max(matching.length + gaps.length, 1)) * 100);

  return (
    <Sidebar>
      <div className="p-8 max-w-6xl mx-auto space-y-6 bg-white dark:bg-[#0A0A0F] text-slate-900 dark:text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Skill Gap Analysis</h1>
            <p className="text-sm text-slate-500 dark:text-[#A0A0B8]">Based on {totalJobs} job listings analyzed</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-slate-500">Skill Match Score</div>
              <div className="text-3xl font-bold text-purple-600">{score}%</div>
            </div>
            <div style={{ width: 80 }}>
              <CircleProgress percent={score} size={80} stroke={8} />
            </div>
          </div>
        </div>

        {/* Matching Skills */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-green-700">Your Matching Skills</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {matching.map((m: any) => (
              <div key={m.skill} className="card-soft p-4 bg-emerald-50 dark:bg-[#123826] border border-slate-200 dark:border-[#2A2A3E]">
                <div className="font-semibold capitalize text-slate-900 dark:text-white">{m.skill}</div>
                <div className="text-sm text-slate-600 dark:text-[#A0A0B8]">{m.demandPercent}% of jobs need this</div>
                <div className="h-2 bg-emerald-200 rounded mt-3">
                  <div style={{ width: `${m.demandPercent}%` }} className="h-2 bg-emerald-500 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gaps */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-red-700">Skills Gap</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gaps.map((g: any) => (
              <div key={g.skill} className="card-soft p-4 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
                <div className="flex items-center justify-between">
                  <div className="font-semibold capitalize text-slate-900 dark:text-white">{g.skill}</div>
                  <div className="text-sm text-slate-500 dark:text-[#A0A0B8]">{g.demandPercent}%</div>
                </div>
                <div className="h-2 bg-red-200 rounded mt-3">
                  <div style={{ width: `${g.demandPercent}%` }} className="h-2 bg-red-500 rounded" />
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {g.learningResources.map((r: any) => (
                    <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="px-2 py-1 bg-slate-100 dark:bg-[#1A1A2E] rounded text-sm text-slate-900 dark:text-white">
                      {r.name} {r.free ? <span className="text-xs text-green-600 ml-1">(Free)</span> : <span className="text-xs text-orange-600 ml-1">(Paid)</span>}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Path */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Learning Path Suggestion</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {gaps.slice(0,3).map((g: any, idx: number) => (
              <div key={g.skill} className="card-soft p-4 bg-white dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
                <div className="font-semibold text-slate-900 dark:text-white">Week {idx+1}</div>
                <div className="mt-2 font-bold capitalize text-slate-900 dark:text-white">{g.skill}</div>
                <div className="text-sm text-slate-500 dark:text-[#A0A0B8] mt-2">Focus on core concepts and one hands-on project.</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
