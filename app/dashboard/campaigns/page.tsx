"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Plus, Play, Pause, MoreVertical, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Campaign {
  _id: string;
  name: string;
  status: string;
  templateId: { _id: string; name: string };
  groupId: { _id: string; name: string };
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCampaigns(campaigns.filter(c => c._id !== id));
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      case 'Sending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Paused': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white flex items-center gap-3">
            <Mail className="h-8 w-8 text-indigo-500" />
            Campaigns
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Create, send, and track your email campaigns.
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Campaign
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 py-16 px-6">
          <Mail className="mx-auto h-12 w-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No campaigns found</h3>
          <p className="text-slate-400 mb-6">Get started by creating a new email campaign.</p>
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/10 px-5 py-2.5 font-medium text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div 
              key={campaign._id}
              onClick={() => router.push(`/dashboard/campaigns/${campaign._id}`)}
              className="group cursor-pointer rounded-2xl bg-slate-800/50 border border-slate-700 shadow-lg overflow-hidden backdrop-blur-sm transition-all hover:bg-slate-800 hover:border-slate-600 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-white group-hover:text-indigo-400 transition-colors truncate pr-4">
                    {campaign.name}
                  </h3>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(campaign._id);
                    }}
                    className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Template</span>
                    <span className="text-white truncate max-w-[150px]">{campaign.templateId?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Group</span>
                    <span className="text-white truncate max-w-[150px]">{campaign.groupId?.name || 'Unknown'}</span>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-white font-medium">
                      {campaign.totalContacts === 0 ? 0 : Math.round(((campaign.sentCount + campaign.failedCount) / campaign.totalContacts) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-2" 
                      style={{ width: `${campaign.totalContacts === 0 ? 0 : (campaign.sentCount / campaign.totalContacts) * 100}%` }}
                    />
                    <div 
                      className="bg-red-500 h-2" 
                      style={{ width: `${campaign.totalContacts === 0 ? 0 : (campaign.failedCount / campaign.totalContacts) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{campaign.sentCount} sent</span>
                  {campaign.failedCount > 0 && <span className="text-red-400">{campaign.failedCount} failed</span>}
                  <span>{campaign.totalContacts} total</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
