'use client';

import { useState, useEffect } from 'react';
import { Server, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SmtpAccount {
  _id: string;
  host: string;
  port: number;
  email: string;
  secure: boolean;
  isDefault: boolean;
}

export default function SmtpPage() {
  const [accounts, setAccounts] = useState<SmtpAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SmtpAccount | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    email: '',
    password: '',
    secure: false,
    isDefault: false,
  });

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/smtp');
      const data = await res.json();
      if (res.ok) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Error fetching accounts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleEdit = (account: SmtpAccount) => {
    setEditingAccount(account);
    setFormData({
      host: account.host,
      port: account.port,
      email: account.email,
      password: '', // Password not returned from API
      secure: account.secure,
      isDefault: account.isDefault,
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SMTP account?')) return;
    
    try {
      const res = await fetch(`/api/smtp/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAccounts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete account');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const url = editingAccount ? `/api/smtp/${editingAccount._id}` : '/api/smtp';
      const method = editingAccount ? 'PATCH' : 'POST';
      
      // If editing and password is empty, don't send it
      const payload = { ...formData };
      if (editingAccount && !payload.password) {
        delete (payload as any).password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFormData({ host: 'smtp.gmail.com', port: 587, email: '', password: '', secure: false, isDefault: false });
        setIsAdding(false);
        setEditingAccount(null);
        fetchAccounts();
      } else {
        const data = await res.json();
        alert(data.error || `Failed to ${editingAccount ? 'update' : 'add'} account`);
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white flex items-center gap-3">
            <Server className="h-8 w-8 text-indigo-500" />
            SMTP Accounts
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Manage your outgoing email servers (e.g., Gmail, Amazon SES, SendGrid).
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={() => {
              if (isAdding) {
                setIsAdding(false);
                setEditingAccount(null);
              } else {
                setFormData({ host: 'smtp.gmail.com', port: 587, email: '', password: '', secure: false, isDefault: false });
                setIsAdding(true);
              }
            }}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {isAdding ? 'Cancel' : 'Add Account'}
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-8 shadow-lg backdrop-blur-sm">
          <h2 className="text-lg font-medium text-white mb-6">{editingAccount ? 'Edit' : 'Add New'} SMTP Account</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-300">Host</label>
                <input
                  type="text"
                  required
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="mt-1 block w-full rounded-xl bg-slate-900 border-slate-700 text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Port</label>
                <input
                  type="number"
                  required
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-xl bg-slate-900 border-slate-700 text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-xl bg-slate-900 border-slate-700 text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Password / App Password</label>
                <input
                  type="password"
                  required={!editingAccount}
                  placeholder={editingAccount ? 'Leave blank to keep current' : ''}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full rounded-xl bg-slate-900 border-slate-700 text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3"
                />
                <p className="mt-1 text-xs text-slate-500">For Gmail, use a 16-character App Password.</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.secure}
                  onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500"
                />
                Secure (SSL/TLS)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500"
                />
                Set as Default
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-700 pt-6">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingAccount(null);
                }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors disabled:opacity-50"
              >
                {submitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingAccount ? 'Update' : 'Save'} Account
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 py-16 px-6">
          <Server className="mx-auto h-12 w-12 text-slate-500 mb-4" />
          <h3 className="text-sm font-semibold text-white">No SMTP accounts</h3>
          <p className="mt-1 text-sm text-slate-400">Get started by creating a new account.</p>
          <div className="mt-6">
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Account
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account._id}
              className={`relative rounded-2xl bg-slate-800/50 p-6 shadow-sm border transition-all ${
                account.isDefault ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${account.isDefault ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-400'}`}>
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{account.email}</p>
                    <p className="text-xs text-slate-400">{account.host}:{account.port}</p>
                  </div>
                </div>
                {account.isDefault && (
                  <span className="inline-flex items-center gap-x-1.5 rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Default
                  </span>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-400">Secure: {account.secure ? 'Yes' : 'No'}</span>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleEdit(account)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(account._id)}
                    className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
