import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateProfile, getMe } from '@/services/api';
import Sidebar from '@/components/layout/Sidebar';

export default function MyProfile() {
  const { user, updateUser } = useAuth();
  const [skills, setSkills] = useState(user?.profile?.skills || []);
  const [input, setInput] = useState('');
  const [preferredRoles, setPreferredRoles] = useState(user?.profile?.preferredRoles || []);
  const [remoteOnly, setRemoteOnly] = useState(user?.profile?.remoteOnly || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSkills(user?.profile?.skills || []);
    setPreferredRoles(user?.profile?.preferredRoles || []);
    setRemoteOnly(user?.profile?.remoteOnly || false);
  }, [user]);

  const addSkill = () => {
    const v = input.trim();
    if (!v) return;
    if (!skills.includes(v)) setSkills([...skills, v]);
    setInput('');
  };

  const removeSkill = (s: string) => setSkills(skills.filter(k => k !== s));

  const toggleRole = (r: string) => {
    if (preferredRoles.includes(r)) setPreferredRoles(preferredRoles.filter(p => p !== r));
    else setPreferredRoles([...preferredRoles, r]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const resp = await updateProfile({ skills, preferredRoles, remoteOnly });
      // refresh user
      const me = await getMe();
      updateUser(me.data);
      alert('Profile saved');
    } catch (e) {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const roleOptions = ['Full Stack', 'Frontend', 'Backend', 'Data Engineer', 'ML Engineer', 'Mobile Dev'];

  return (
    <Sidebar>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">My Profile</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Resume</label>
        <div className="text-sm text-slate-600">{user?.resume?.originalName || 'No resume uploaded'}</div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Skills</label>
        <div className="flex gap-2 flex-wrap">
          {skills.map(s => (
            <span key={s} className="bg-slate-100 px-2 py-1 rounded flex items-center gap-2">
              <span className="text-sm">{s}</span>
              <button onClick={() => removeSkill(s)} className="text-xs">x</button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addSkill(); }} className="border px-2 py-1 rounded" placeholder="Type a skill and press Enter" />
          <button onClick={addSkill} className="btn">Add</button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Preferred Roles</label>
        <div className="flex gap-2 flex-wrap">
          {roleOptions.map((r) => {
            const active = preferredRoles.includes(r);
            return (
              <button
                key={r}
                onClick={() => toggleRole(r)}
                className={active ? 'px-3 py-1 rounded bg-primary text-white' : 'px-3 py-1 rounded bg-slate-100'}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} />
          <span className="text-sm">Remote only</span>
        </label>
      </div>

      <div>
        <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save Profile'}</button>
      </div>
    </div>
    </Sidebar>
  );
}
