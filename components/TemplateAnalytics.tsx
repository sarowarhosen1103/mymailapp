'use client';

import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Cell
} from 'recharts';
import { Layout, TrendingUp, MousePointerClick, Zap, Star, Trophy } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

interface TemplateProps {
  data: any;
}

export default function TemplateAnalytics({ data }: TemplateProps) {
  const templates = data?.templatePerformance || [];

  const topTemplates = useMemo(() => {
    if (!templates.length) return null;
    return {
      mostUsed: [...templates].sort((a, b) => b.usageCount - a.usageCount)[0],
      bestOpenRate: [...templates].sort((a, b) => parseFloat(b.openRate) - parseFloat(a.openRate))[0],
      bestCTR: [...templates].sort((a, b) => parseFloat(b.clickRate) - parseFloat(a.clickRate))[0],
    };
  }, [templates]);

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
          <Layout className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Template Performance</h3>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Content & Conversion Diagnostics</p>
        </div>
      </div>

      {/* 2. Leaderboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Most Used', t: topTemplates?.mostUsed, icon: Zap, color: 'indigo', val: `${topTemplates?.mostUsed?.usageCount || 0} Campaigns` },
          { label: 'Best Open Rate', t: topTemplates?.bestOpenRate, icon: Star, color: 'emerald', val: `${topTemplates?.bestOpenRate?.openRate || '0.00'}%` },
          { label: 'Highest CTR', t: topTemplates?.bestCTR, icon: Trophy, color: 'sky', val: `${topTemplates?.bestCTR?.clickRate || '0.00'}%` },
        ].map((card, idx) => (
          <div key={idx} className="relative overflow-hidden rounded-3xl bg-slate-800/30 border border-slate-700/50 p-6 backdrop-blur-sm group">
            <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
               <card.icon className={`h-24 w-24 text-${card.color}-400`} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <card.icon className={`h-4 w-4 text-${card.color}-400`} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{card.label}</span>
            </div>
            <h4 className="text-lg font-bold text-white truncate max-w-[200px] mb-1">
              {card.t?.name || 'No Template'}
            </h4>
            <span className={`text-xl font-black text-${card.color}-400`}>{card.val}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. Performance Chart */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-800/30 border border-slate-700/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Performance Comparison</h4>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Open Rate</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">CTR</span>
               </div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={templates.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="openRate" name="Open Rate %" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="clickRate" name="CTR %" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Template List */}
        <div className="rounded-3xl bg-slate-800/30 border border-slate-700/50 overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-slate-700/50 bg-slate-900/40">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Active Library</h4>
          </div>
          <div className="overflow-y-auto max-h-[360px]">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-700/50">
                {templates.map((temp: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-700/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{temp.name}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{temp.usageCount} Campaigns</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-black text-emerald-400">{temp.openRate}%</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Open Rate</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
