"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function NewCampaignPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    groupId: '',
    attachment: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchGroups();
  }, []);

  const fetchTemplates = async () => {
    const res = await fetch('/api/templates');
    if (res.ok) setTemplates(await res.json());
  };

  const fetchGroups = async () => {
    const res = await fetch('/api/groups');
    if (res.ok) setGroups(await res.json());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('templateId', formData.templateId);
      data.append('groupId', formData.groupId);
      if (formData.attachment) {
        data.append('attachment', formData.attachment);
      }

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        body: data
      });
      if (res.ok) {
        const campaign = await res.json();
        router.push(`/dashboard/campaigns/${campaign._id}`);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/campaigns" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Campaigns
        </Link>
        <h1 className="text-3xl font-bold text-white">Create New Campaign</h1>
        <p className="text-slate-400 mt-2">Set up a new bulk email campaign by selecting a template and a target group.</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Campaign Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Q3 Newsletter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Template</label>
            <select
              required
              value={formData.templateId}
              onChange={e => setFormData({...formData, templateId: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select a template...</option>
              {templates.map((t: any) => (
                <option key={t._id} value={t._id}>{t.name} (Subject: {t.subject})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Contact Group</label>
            <select
              required
              value={formData.groupId}
              onChange={e => setFormData({...formData, groupId: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select a group...</option>
              {groups.map((g: any) => (
                <option key={g._id} value={g._id}>{g.name} ({g.contacts.length} contacts)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Attachment (Optional PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={e => setFormData({...formData, attachment: e.target.files?.[0] || null})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
            />
            <p className="text-xs text-slate-500 mt-2">Maximum file size: 5MB. Only PDF supported for now.</p>
          </div>

          <div className="pt-6 border-t border-slate-700 flex justify-end gap-4">
            <Link 
              href="/dashboard/campaigns"
              className="px-6 py-3 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all"
            >
              {isSubmitting ? 'Creating...' : (
                <>
                  <Send className="h-5 w-5" />
                  Create Campaign
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
