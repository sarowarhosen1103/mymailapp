'use client';

import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import { MousePointerClick, TrendingUp, Users, Clock, ArrowUpRight, Activity } from 'lucide-react';

interface OpenRateProps {
  data: any;
}

export default function OpenRateAnalytics({ data }: OpenRateProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const aggregatedData = useMemo(() => {
    const daily = data?.dailyStats || [];
    if (timeframe === 'daily') return daily;

    // Aggregation logic for weekly/monthly
    const result: any[] = [];
    const groupSize = timeframe === 'weekly' ? 7 : 30;
    
    for (let i = 0; i < daily.length; i += groupSize) {
      const chunk = daily.slice(i, i + groupSize);
      const label = timeframe === 'weekly' ? `Week ${Math.floor(i/7) + 1}` : `Month ${Math.floor(i/30) + 1}`;
      
      const aggregated = chunk.reduce((acc: any, curr: any) => ({
        sent: acc.sent + curr.sent,
        uniqueOpened: acc.uniqueOpened + curr.uniqueOpened,
        totalOpens: acc.totalOpens + curr.totalOpens,
      }), { sent: 0, uniqueOpened: 0, totalOpens: 0 });

      result.push({ _id: label, ...aggregated });
    }
    return result;
  }, [data, timeframe]);

  const uniqueVsTotal = [
    { name: 'Unique Opens', value: data?.summary?.totalUniqueOpened || 0, color: '#6366f1' },
    { name: 'Total Opens', value: data?.summary?.totalOpenEvents || 0, color: '#10b981' },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Open Rate Analytics</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Historical Engagement Velocity</p>
          </div>
        </div>

        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-700/50 backdrop-blur-sm">
          {['daily', 'weekly', 'monthly'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${
                timeframe === t 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-800/30 border border-slate-700/50 p-6 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-400" />
              Engagement Over Time
            </h4>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Unique</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
               </div>
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregatedData}>
                <defs>
                  <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="_id" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="uniqueOpened" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUnique)" />
                <Area type="monotone" dataKey="totalOpens" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Unique vs Total Breakdown */}
        <div className="rounded-3xl bg-slate-800/30 border border-slate-700/50 p-6 backdrop-blur-sm flex flex-col items-center justify-center text-center">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-8">Unique vs Total Distribution</h4>
          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={uniqueVsTotal}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {uniqueVsTotal.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-2xl font-black text-white">{(data?.summary?.totalOpenEvents / (data?.summary?.totalUniqueOpened || 1)).toFixed(1)}x</span>
               <span className="text-[10px] font-bold text-slate-500 uppercase">Frequency</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full mt-6">
            <div className="p-3 bg-slate-900/40 rounded-2xl border border-slate-700/50">
               <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Unique</span>
               <span className="text-lg font-black text-white">{data?.summary?.totalUniqueOpened}</span>
            </div>
            <div className="p-3 bg-slate-900/40 rounded-2xl border border-slate-700/50">
               <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total</span>
               <span className="text-lg font-black text-white">{data?.summary?.totalOpenEvents}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Tracking Panel */}
      <div className="rounded-3xl bg-slate-800/30 border border-slate-700/50 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            Real-Time Open Tracking
          </h4>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
             Live Feed
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.recentActivity || []).filter((l: any) => l.opened).slice(0, 6).map((log: any, idx: number) => (
            <div key={idx} className="p-4 bg-slate-900/40 rounded-2xl border border-slate-700/50 hover:border-indigo-500/30 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                   <MousePointerClick className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{log.contactId?.email}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-tighter">Opened {log.campaignId?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-indigo-400">{new Date(log.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <span className="text-[8px] text-slate-600 font-bold uppercase">{log.opens?.[0]?.country || 'Unknown'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
