'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, MousePointerClick, RefreshCcw, AlertTriangle, 
  Users, Layout, Server, Activity, Globe, 
  Download, Filter, Calendar, BarChart as BarChartIcon,
  TrendingUp, Clock, Shield, Search, MoreVertical, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import WorldMapAnalytics from '@/components/WorldMapAnalytics';
import OpenRateAnalytics from '@/components/OpenRateAnalytics';
import TemplateAnalytics from '@/components/TemplateAnalytics';

// --- Components ---

const StatCard = ({ title, value, change, changeType, icon: Icon, color }: any) => (
  <div className="relative overflow-hidden rounded-2xl bg-slate-800/40 p-6 border border-slate-700/50 backdrop-blur-xl transition-all hover:bg-slate-800/60 hover:border-indigo-500/30 group">
    <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
      <Icon className="h-16 w-16 text-indigo-400" />
    </div>
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-2.5 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
        <Icon className={`h-6 w-6 text-${color}-400`} />
      </div>
      <p className="text-sm font-medium text-slate-400">{title}</p>
    </div>
    <div className="flex items-baseline justify-between">
      <h3 className="text-2xl font-bold text-white">{value}</h3>
      <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        changeType === 'increase' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
      }`}>
        {changeType === 'increase' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {change}
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle, children }: any) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-2">
      {children}
    </div>
  </div>
);

// --- Main Page ---

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 animate-pulse">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    totalEmailsSent: 0,
    totalCampaigns: 0,
    totalContacts: 0,
    totalTemplates: 0,
    totalSmtpAccounts: 0,
    totalOpened: 0,
    totalClicked: 0,
    deliveryRate: '0.00',
    openRate: '0.00',
    clickRate: '0.00',
    bounceRate: '0.00'
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-10 pb-20">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Command <span className="text-indigo-500">Center</span>
          </h1>
          <p className="mt-2 text-slate-400">Real-time performance and delivery intelligence.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl text-sm font-semibold transition-all">
            <Calendar className="h-4 w-4 text-indigo-400" />
            Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl text-sm font-semibold transition-all">
            <Filter className="h-4 w-4 text-indigo-400" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* 2. Top Statistics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Sent" value={summary.totalEmailsSent.toLocaleString()} change="+12%" changeType="increase" icon={Mail} color="indigo" />
        <StatCard title="Open Rate" value={`${summary.openRate}%`} change="+2.4%" changeType="increase" icon={MousePointerClick} color="emerald" />
        <StatCard title="Click Rate" value={`${summary.clickRate}%`} change="+0.8%" changeType="increase" icon={Activity} color="sky" />
        <StatCard title="Bounce Rate" value={`${summary.bounceRate}%`} change="-1.2%" changeType="decrease" icon={AlertTriangle} color="rose" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: 'Campaigns', val: summary.totalCampaigns, icon: Layout },
          { label: 'Contacts', val: summary.totalContacts, icon: Users },
          { label: 'Templates', val: summary.totalTemplates, icon: Shield },
          { label: 'SMTP Servers', val: summary.totalSmtpAccounts, icon: Server },
          { label: 'Total Opens', val: summary.totalOpened, icon: TrendingUp },
          { label: 'Total Clicks', val: summary.totalClicked, icon: MousePointerClick },
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <item.icon className="h-5 w-5 text-indigo-400 mb-2 opacity-60" />
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{item.label}</p>
            <h4 className="text-xl font-bold text-white mt-1">{item.val}</h4>
          </div>
        ))}
      </div>

      {/* 3. Detailed Open Rate Analytics */}
      <OpenRateAnalytics data={data} />
      
      {/* 4. Geographic Distribution (World Map) */}
      <div className="rounded-3xl bg-slate-800/40 border border-slate-700/50 p-6 backdrop-blur-sm shadow-2xl">
        <WorldMapAnalytics data={data} />
      </div>

      {/* 5. Template Performance Analytics */}
      <TemplateAnalytics data={data} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 5. Campaign Performance */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-800/40 border border-slate-700/50 overflow-hidden backdrop-blur-sm">
          <div className="p-6">
            <SectionHeader title="Campaign Performance" subtitle="Detailed breakdown of recent campaigns.">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search campaigns..." 
                  className="pl-10 pr-4 py-1.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </SectionHeader>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900/40 border-y border-slate-700/50">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Open Rate</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Clicks</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {(data?.campaignPerformance || []).map((camp: any) => (
                  <tr key={camp._id} className="hover:bg-slate-700/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{camp.name}</span>
                        <span className="text-xs text-slate-500">{camp.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 w-32">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                          <span>{camp.sent} Sent</span>
                          <span>{camp.deliveryRate}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${camp.deliveryRate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {camp.openRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-300">
                      {camp.clicked}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-500 hover:text-white transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Recent Activity Feed */}
        <div className="rounded-3xl bg-slate-800/40 border border-slate-700/50 p-6 backdrop-blur-sm">
          <SectionHeader title="Live Activity" subtitle="Real-time event stream." />
          <div className="space-y-6">
            {(data?.recentActivity || []).map((log: any, idx: number) => (
              <div key={idx} className="flex gap-4 relative">
                {idx !== (data?.recentActivity || []).length - 1 && (
                  <div className="absolute left-4 top-8 bottom-[-24px] w-0.5 bg-slate-700/50" />
                )}
                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
                  log.opened ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  log.status === 'Failed' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}>
                  {log.opened ? <MousePointerClick className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                </div>
                <div className="flex flex-col">
                  <p className="text-sm text-slate-300">
                    <span className="font-bold text-white">{log.contactId?.email}</span> 
                    {log.opened ? ' opened ' : ' was sent '} 
                    <span className="font-semibold text-slate-200">"{log.campaignId?.name}"</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                      {new Date(log.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. SMTP Health Monitor */}
      <div className="rounded-3xl bg-slate-800/40 border border-slate-700/50 p-8 backdrop-blur-sm">
        <SectionHeader title="Infrastructure Monitor" subtitle="Global SMTP health and relay performance.">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">Systems Operational</span>
          </div>
        </SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[
            { label: 'Avg. Latency', val: '124ms', icon: Activity, color: 'indigo' },
            { label: 'Uptime', val: '99.98%', icon: Shield, color: 'emerald' },
            { label: 'Global Rank', val: '#42', icon: Globe, color: 'sky' },
            { label: 'Queue Depth', val: '0', icon: Server, color: 'rose' },
          ].map((item, idx) => (
            <div key={idx} className="p-5 bg-slate-900/40 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center text-center">
              <item.icon className={`h-6 w-6 text-${item.color}-400 mb-3`} />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
              <h5 className="text-2xl font-black text-white mt-1">{item.val}</h5>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
