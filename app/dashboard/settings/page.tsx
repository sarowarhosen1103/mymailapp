'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Lock, Save, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    firstName: '',
    lastName: '',
    email: '',
    appUrl: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings({
          firstName: data.settings.firstName || '',
          lastName: data.settings.lastName || '',
          email: data.settings.email || '',
          appUrl: data.settings.appUrl || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Settings updated successfully');
      } else {
        toast.error(data.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold leading-tight tracking-tight text-white mb-8">
        Settings
      </h1>

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700 shadow-lg overflow-hidden backdrop-blur-sm">
          <div className="border-b border-slate-700 p-6 flex items-center gap-4">
            <div className="rounded-xl bg-indigo-500/20 p-3 border border-indigo-500/30">
              <User className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Profile</h2>
              <p className="text-sm text-slate-400">Manage your account details and preferences.</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">First Name</label>
                <input 
                  type="text" 
                  value={settings.firstName}
                  onChange={(e) => setSettings({ ...settings, firstName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Last Name</label>
                <input 
                  type="text" 
                  value={settings.lastName}
                  onChange={(e) => setSettings({ ...settings, lastName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <input 
                type="email" 
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="john@example.com"
              />
            </div>
          </div>
        </div>

        {/* Application Settings */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700 shadow-lg overflow-hidden backdrop-blur-sm">
          <div className="border-b border-slate-700 p-6 flex items-center gap-4">
            <div className="rounded-xl bg-emerald-500/20 p-3 border border-emerald-500/30">
              <Globe className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Application Settings</h2>
              <p className="text-sm text-slate-400">Configure global application parameters.</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">App URL (for tracking)</label>
              <input 
                type="url" 
                value={settings.appUrl}
                onChange={(e) => setSettings({ ...settings, appUrl: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="https://your-app-url.com"
              />
              <p className="text-xs text-slate-500">This URL will be used as the base for tracking pixels in your emails. Use your public production URL.</p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700 shadow-lg overflow-hidden backdrop-blur-sm opacity-50">
          <div className="border-b border-slate-700 p-6 flex items-center gap-4">
            <div className="rounded-xl bg-rose-500/20 p-3 border border-rose-500/30">
              <Lock className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Security</h2>
              <p className="text-sm text-slate-400">Security settings are managed in your authentication provider.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
