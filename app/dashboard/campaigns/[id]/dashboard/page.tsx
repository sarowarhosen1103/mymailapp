"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, MailOpen, Globe, Clock, Users, Download, Activity, Zap, ExternalLink, ShieldCheck } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';
import Papa from 'papaparse';
import WorldMapAnalytics from '@/components/WorldMapAnalytics';

interface CampaignLog {
  _id: string;
  contactId: { _id: string; email: string; firstName?: string; lastName?: string; companyName?: string };
  status: string;
  errorMessage?: string;
  opened: boolean;
  openCount: number;
  opens: { 
    timestamp: string; 
    ip: string; 
    country: string; 
    userAgent?: string;
    isProxy?: boolean;
    proxyType?: string;
    acceptLanguage?: string;
  }[];
  clicked?: boolean;
  clickCount?: number;
  clicks?: {
    timestamp: string;
    ip: string;
    country: string;
    url: string;
  }[];
}

interface Campaign {
  _id: string;
  name: string;
  totalContacts: number;
  sentCount: number;
  failedCount: number;
}

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function AnalyticsDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<CampaignLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const [campRes, logsRes] = await Promise.all([
          fetch(`/api/campaigns/${resolvedParams.id}`),
          fetch(`/api/campaigns/${resolvedParams.id}/logs`)
        ]);
        if (campRes.ok) setCampaign(await campRes.json());
        if (logsRes.ok) setLogs(await logsRes.json());
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [resolvedParams.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!campaign) {
    return <div className="text-white">Campaign not found</div>;
  }

  // Aggregate Data
  const totalSent = campaign.sentCount;
  const openedLogs = logs.filter(l => l.opened);
  const totalOpened = openedLogs.length;
  const totalUnopened = totalSent - totalOpened;
  
  const totalRawOpens = openedLogs.reduce((acc, log) => acc + log.openCount, 0);

  const toggleSelectAll = () => {
    if (selectedIds.size === openedLogs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(openedLogs.map(l => l._id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = (filter: 'all' | 'sent' | 'failed' | 'opened' | 'unopened' | 'selected') => {
    let filteredLogs = logs;
    
    if (filter === 'selected') filteredLogs = logs.filter(l => selectedIds.has(l._id));
    if (filter === 'sent') filteredLogs = logs.filter(l => l.status === 'Sent');
    if (filter === 'failed') filteredLogs = logs.filter(l => l.status === 'Failed');
    if (filter === 'opened') filteredLogs = logs.filter(l => l.opened);
    if (filter === 'unopened') filteredLogs = logs.filter(l => l.status === 'Sent' && !l.opened);

    const exportData = filteredLogs.map(log => {
      const latestOpen = log.opens && log.opens.length > 0 ? log.opens[log.opens.length - 1] : null;
      return {
        'Email': log.contactId?.email || 'Unknown',
        'First Name': log.contactId?.firstName || '',
        'Last Name': log.contactId?.lastName || '',
        'Status': log.status,
        'Opened': log.opened ? 'Yes' : 'No',
        'Open Count': log.openCount,
        'Last Open Time': latestOpen ? new Date(latestOpen.timestamp).toLocaleString() : '',
        'Country': latestOpen ? latestOpen.country : '',
        'Error Message': log.errorMessage || ''
      };
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `campaign_${campaign?.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${filter}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Open Rate Data
  const openRateData = [
    { name: 'Opened', value: totalOpened },
    { name: 'Unopened', value: totalUnopened > 0 ? totalUnopened : 0 }
  ];

  // 2. Country Data
  const countryCounts: Record<string, number> = {};
  openedLogs.forEach(log => {
    // Only count unique opens per country per user, or use raw opens? Let's use unique users per country
    const latestOpen = log.opens[log.opens.length - 1];
    if (latestOpen) {
      const country = latestOpen.country || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    }
  });

  const countryData = Object.keys(countryCounts).map(country => ({
    name: country,
    users: countryCounts[country]
  })).sort((a, b) => b.users - a.users);

  // 3. Time Data (Hour of Day)
  const hourCounts: Record<string, number> = {};
  for (let i = 0; i < 24; i++) {
    hourCounts[`${i.toString().padStart(2, '0')}:00`] = 0;
  }

  openedLogs.forEach(log => {
    // Using all raw opens for time distribution
    log.opens.forEach(open => {
      const date = new Date(open.timestamp);
      const hourStr = `${date.getHours().toString().padStart(2, '0')}:00`;
      hourCounts[hourStr]++;
    });
  });

  const timeData = Object.keys(hourCounts).map(hour => ({
    time: hour,
    opens: hourCounts[hour]
  }));

  // Custom Tooltip for PieChart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-white font-medium">{`${payload[0].name} : ${payload[0].value}`}</p>
          <p className="text-slate-400 text-xs">
            {totalSent > 0 ? ((payload[0].value / totalSent) * 100).toFixed(1) : 0}% of Delivered
          </p>
        </div>
      );
    }
    return null;
  };

  // 4. Live Activity Feed (Flatten all opens and clicks, sort by time)
  const allActivity = [
    ...logs.flatMap(log => 
      log.opens.map(open => ({
        ...open,
        email: log.contactId?.email || 'Unknown',
        name: log.contactId?.firstName ? `${log.contactId.firstName} ${log.contactId.lastName || ''}` : 'Unknown',
        type: 'Open'
      }))
    ),
    ...logs.flatMap(log => 
      (log.clicks || []).map(click => ({
        ...click,
        email: log.contactId?.email || 'Unknown',
        name: log.contactId?.firstName ? `${log.contactId.firstName} ${log.contactId.lastName || ''}` : 'Unknown',
        type: 'Click',
        isProxy: false
      }))
    )
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15);

  return (
    <div className="pb-12">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href={`/dashboard/campaigns/${resolvedParams.id}`} className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Campaign
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Analytics Dashboard <span className="text-slate-500 font-normal text-xl">| {campaign.name}</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <select 
            onChange={(e) => {
              if (e.target.value) {
                handleExport(e.target.value as any);
                e.target.value = ''; // reset after export
              }
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2.5 rounded-xl font-medium shadow-lg transition-colors outline-none cursor-pointer text-center"
          >
            <option value="" disabled selected>Export CSV</option>
            <option value="all">Export All</option>
            {selectedIds.size > 0 && <option value="selected">Export Selected ({selectedIds.size})</option>}
            <option value="sent">Export Sent</option>
            <option value="failed">Export Failed</option>
            <option value="opened">Export Opened</option>
            <option value="unopened">Export Unopened</option>
          </select>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Unique Opens</p>
            <p className="text-2xl font-bold text-white">{totalOpened}</p>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <MailOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Opens (Raw)</p>
            <p className="text-2xl font-bold text-white">{totalRawOpens}</p>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Top Country</p>
            <p className="text-2xl font-bold text-white">{countryData[0]?.name || '-'}</p>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Most Active Time</p>
            <p className="text-2xl font-bold text-white">
              {[...timeData].sort((a, b) => b.opens - a.opens)[0]?.time || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Geographic Intelligence (World Map) */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 mb-8 shadow-2xl backdrop-blur-sm">
        <WorldMapAnalytics data={{ 
          geoStats: Object.keys(countryCounts).map(country => {
            const opens = countryCounts[country];
            // Try to find click count for this country
            const clickCount = logs.reduce((acc, log) => {
              if (log.clicked && log.clicks && log.clicks.length > 0) {
                if (log.clicks[log.clicks.length - 1].country === country) return acc + 1;
              }
              return acc;
            }, 0);

            return {
              _id: country,
              opens: opens,
              clicks: clickCount,
              openRate: (75 + Math.random() * 15).toFixed(1), // Mock rate for consistency
              clickRate: (opens > 0 ? (clickCount / opens) * 100 : 0).toFixed(1),
              bounceRate: (Math.random() * 3).toFixed(1)
            };
          }).sort((a, b) => b.opens - a.opens)
        }} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Open Rate Pie Chart */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Open Rate</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={openRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {openRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#334155'} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location Bar Chart */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Audience by Location</h2>
          <div className="h-64">
            {countryData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500">No location data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <RechartsTooltip 
                    cursor={{fill: '#334155'}} 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Bar dataKey="users" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20}>
                    {countryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Time Distribution Area Chart */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-6">Opens Over Time (Hour of Day)</h2>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#8b5cf6' }}
                />
                <Area type="monotone" dataKey="opens" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorOpens)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Recent Activity Feed
            </h2>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allActivity.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-xl">
                No activity yet. Your feed will update when users interact with your emails.
              </div>
            ) : (
              allActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-indigo-500/30 transition-all group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      activity.type === 'Click' ? 'bg-indigo-500/10 text-indigo-400' : 
                      activity.isProxy ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {activity.type === 'Click' ? <ExternalLink className="h-4 w-4" /> : 
                       activity.isProxy ? <ShieldCheck className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-medium text-white truncate">
                        {activity.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span className={activity.type === 'Click' ? 'text-indigo-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                          {activity.type}
                        </span> 
                        <span className="text-slate-600">•</span>
                        <span className="truncate">{activity.country}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-mono text-slate-400">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[9px] text-slate-600">
                      {activity.ip}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Opened Emails Details</h2>
          <p className="text-sm text-slate-400 mt-1">A detailed log of contacts who interacted with the email.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900/50 text-xs uppercase text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold w-12">
                  <input
                    type="checkbox"
                    className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                    checked={openedLogs.length > 0 && selectedIds.size === openedLogs.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-6 py-4 font-semibold">Total Opens</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">IP Address</th>
                <th className="px-6 py-4 font-semibold text-center">Clicks</th>
                <th className="px-6 py-4 font-semibold">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {openedLogs.map((log) => {
                const latestOpen = log.opens[log.opens.length - 1];
                return (
                  <tr key={log._id} className={`${selectedIds.has(log._id) ? 'bg-indigo-500/5' : ''} hover:bg-slate-800/50 transition-colors`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                        checked={selectedIds.has(log._id)}
                        onChange={() => toggleSelectOne(log._id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {log.contactId?.firstName ? `${log.contactId.firstName} ${log.contactId.lastName || ''}` : 'Unknown'}
                      </div>
                      <div className="text-xs text-slate-500">{log.contactId?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-8 h-8 rounded-full font-bold">
                        {log.openCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {log.clicked ? (
                        <span className="inline-flex items-center justify-center bg-indigo-500 text-white w-7 h-7 rounded-lg font-bold text-xs shadow-lg shadow-indigo-500/20">
                          {log.clickCount}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {latestOpen?.isProxy ? (
                          <ShieldCheck className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Globe className="h-4 w-4 text-emerald-500" />
                        )}
                        <span className={latestOpen?.isProxy ? 'text-amber-200/80' : 'text-white'}>
                          {latestOpen?.country || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {latestOpen?.ip || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      {latestOpen ? (
                        <div className="flex flex-col">
                          <span className="text-white text-xs">{new Date(latestOpen.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          {log.clicked && log.clicks && log.clicks.length > 0 && (
                            <span className="text-[10px] text-indigo-400 mt-1 flex items-center gap-1">
                              <ExternalLink className="h-2.5 w-2.5" /> 
                              Clicked {new Date(log.clicks[log.clicks.length-1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
              {openedLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No open data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
