import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { getMe, updateProfile } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { User, Plus, X } from 'lucide-react';

export default function Profile() {
  const { updateUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState<string>('');
  const [preferredRoles, setPreferredRoles] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        const u = res.data;
        setUser(u);
        setSkills(u.profile?.skills || []);
        setPreferredRoles(u.profile?.preferredRoles || []);
        setRemoteOnly(u.profile?.remoteOnly !== false);
      } catch (e) {
        console.error('Failed to load user', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const addSkill = (skill?: string) => {
    const val = (skill ?? newSkill).toLowerCase().trim();
    if (!val) {
      setNewSkill('');
      return;
    }
    if (!skills.includes(val)) setSkills([...skills, val]);
    setNewSkill('');
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const roleOptions = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Engineer',
    'Data Analyst',
    'ML Engineer',
    'Mobile Developer',
    'DevOps Engineer',
  ];

  const toggleRole = (role: string) => {
    if (preferredRoles.includes(role)) setPreferredRoles(preferredRoles.filter((r) => r !== role));
    else setPreferredRoles([...preferredRoles, role]);
  };

  const suggested = ['React', 'Node.js', 'Python', 'JavaScript', 'MongoDB', 'SQL', 'Flutter', 'ML'];

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ skills, preferredRoles, remoteOnly });
      // refresh user in context
      try {
        const me = await getMe();
        updateUser && updateUser(me.data);
        setUser(me.data);
      } catch (e) {
        // ignore
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save profile', e);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Sidebar><div className="p-8">Loading profile...</div></Sidebar>;

  return (
    <Sidebar>
      <div className="p-8 max-w-4xl mx-auto space-y-6 bg-white dark:bg-[#0A0A0F] text-slate-900 dark:text-white">
        <div className="flex items-center gap-4">
          <User className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">My Profile</h1>
        </div>

        {/* Basic Info */}
        <div className="card-soft p-6 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
          <h3 className="font-semibold mb-2">Basic Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600">Name</label>
              <div className="mt-1 text-slate-800 dark:text-white font-medium">{user?.name || '—'}</div>
            </div>
            <div>
              <label className="block text-sm text-slate-600">Email</label>
              <div className="mt-1 text-slate-800 dark:text-white font-medium">{user?.email || '—'}</div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card-soft p-6 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Skills</h3>
            <div className="text-sm text-slate-500 dark:text-[#A0A0B8]">Help the AI find better matches</div>
          </div>

          <div className="mt-4">
            <div className="flex gap-2 flex-wrap">
              {skills.map((s) => (
                <span key={s} className="bg-slate-100 dark:bg-[#1A1A2E] px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="text-sm capitalize text-slate-900 dark:text-white">{s}</span>
                  <button onClick={() => removeSkill(s)} className="text-xs text-slate-500 dark:text-[#A0A0B8]"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="Add a skill and press Enter"
                className="flex-1 border rounded px-3 py-2 bg-white dark:bg-[#12121A] text-slate-900 dark:text-white"
              />
              <button onClick={() => addSkill()} className="btn btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Add</button>
            </div>

            <div className="mt-4">
              <div className="text-sm text-slate-500 dark:text-[#A0A0B8] mb-2">Suggested</div>
              <div className="flex gap-2 flex-wrap">
                {suggested.map((s) => (
                  <button key={s} onClick={() => addSkill(s)} className="px-3 py-1 rounded bg-slate-100 dark:bg-[#1A1A2E] text-sm text-slate-900 dark:text-white">{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preferred Roles */}
        <div className="card-soft p-6 bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
          <h3 className="font-semibold mb-2">Preferred Roles</h3>
          <div className="flex gap-2 flex-wrap">
            {roleOptions.map((r) => {
              const active = preferredRoles.includes(r);
              return (
                <button
                  key={r}
                  onClick={() => toggleRole(r)}
                  className={active ? 'px-3 py-1 rounded bg-primary text-white' : 'px-3 py-1 rounded bg-slate-100 dark:bg-[#1A1A2E] dark:text-white'}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Job Preferences */}
        <div className="card-soft p-6 flex items-center justify-between bg-slate-50 dark:bg-[#12121A] border border-slate-200 dark:border-[#2A2A3E]">
          <div>
            <h3 className="font-semibold">Job Preferences</h3>
            <p className="text-sm text-slate-500 dark:text-[#A0A0B8]">Control basic job search filters</p>
          </div>
          <div>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} />
              <span className="text-sm">Remote Only</span>
            </label>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          {saved && <div className="text-sm text-success">Saved!</div>}
        </div>
      </div>
    </Sidebar>
  );
}
