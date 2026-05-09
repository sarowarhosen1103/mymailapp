'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, MousePointerClick, Activity, Globe, 
  TrendingUp, Clock, Shield, BarChart as BarChartIcon, 
  ArrowUpRight, ArrowDownRight, Filter, Calendar,
  PieChart as PieChartIcon, LineChart as LineChartIcon,
  Smartphone, Monitor, Tablet, Share2, AlertTriangle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import WorldMapAnalytics from '@/components/WorldMapAnalytics';
import OpenRateAnalytics from '@/components/OpenRateAnalytics';
import TemplateAnalytics from '@/components/TemplateAnalytics';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

const AnalyticsCard = ({ title, value, children, icon: Icon }: any) => (
  <div className="rounded-3xl bg-slate-800/40 border border-slate-700/50 p-6 backdrop-blur-sm shadow-xl">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {value && <p className="text-2xl font-black text-indigo-400 mt-1">{value}</p>}
      </div>
      {Icon && <Icon className="h-6 w-6 text-slate-500 opacity-50" />}
    </div>
    {children}
  </div>
);

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400">Deep diving into your data...</p>
        </div>
      </div>
    );
  }

  // Mock data for extra analytics sections
  const deviceData = [
    { name: 'Desktop', value: 65 },
    { name: 'Mobile', value: 30 },
    { name: 'Tablet', value: 5 },
  ];

  const browserData = [
    { name: 'Chrome', value: 45 },
    { name: 'Safari', value: 25 },
    { name: 'Firefox', value: 15 },
    { name: 'Edge', value: 10 },
    { name: 'Others', value: 5 },
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Advanced <span className="text-indigo-500">Analytics</span>
          </h1>
          <p className="mt-2 text-slate-400">Granular insights into your mailing performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm font-semibold transition-all hover:bg-slate-700">
            <Calendar className="h-4 w-4 text-indigo-400" />
            Custom Range
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-bold shadow-lg transition-all">
            Download PDF
          </button>
        </div>
      </div>

      {/* Detailed Open Rate Analytics */}
      <OpenRateAnalytics data={data} />

      {/* Template Performance Analytics */}
      <TemplateAnalytics data={data} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Device Breakdown */}
        <AnalyticsCard title="Devices" icon={Smartphone}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {deviceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {deviceData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                <span className="text-xs text-slate-400">{item.name}</span>
              </div>
            ))}
          </div>
        </AnalyticsCard>

        {/* Browser Breakdown */}
        <AnalyticsCard title="Browsers" icon={Monitor}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={browserData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {browserData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
            {browserData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(idx + 3) % COLORS.length] }} />
                <span className="text-xs text-slate-400">{item.name}</span>
              </div>
            ))}
          </div>
        </AnalyticsCard>

        {/* Bounce Breakdown */}
        <AnalyticsCard title="Bounce Analysis" icon={AlertTriangle}>
          <div className="space-y-5 mt-4">
            {[
              { label: 'Hard Bounce', val: '45%', color: 'rose' },
              { label: 'Soft Bounce', val: '32%', color: 'amber' },
              { label: 'Invalid Email', val: '18%', color: 'indigo' },
              { label: 'Rejected', val: '5%', color: 'slate' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="text-white">{item.val}</span>
                </div>
                <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                  <div className={`h-full bg-${item.color}-500 rounded-full`} style={{ width: item.val }} />
                </div>
              </div>
            ))}
          </div>
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Geographic Activity Map */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-800/40 border border-slate-700/50 p-6 backdrop-blur-sm shadow-2xl">
          <WorldMapAnalytics data={data} />
        </div>

        {/* Email ROI & Conversion */}
        <AnalyticsCard title="Conversion Metrics" icon={Activity}>
          <div className="space-y-8 mt-4">
            <div className="flex flex-col items-center justify-center p-6 bg-slate-900/40 rounded-2xl border border-slate-700/50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Conversion Rate</span>
              <span className="text-4xl font-black text-emerald-400">3.8%</span>
              <span className="text-xs text-emerald-500/60 mt-2 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +12% from last month
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-700/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total ROI</span>
                <span className="text-xl font-bold text-white">$12.4k</span>
              </div>
              <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-700/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cost/Email</span>
                <span className="text-xl font-bold text-white">$0.002</span>
              </div>
            </div>
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}
