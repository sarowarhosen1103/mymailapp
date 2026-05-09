'use client';

import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Globe, TrendingUp, MousePointerClick, AlertTriangle } from 'lucide-react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  data: {
    geoStats: { 
      _id: string, 
      opens: number, 
      clicks: number, 
      openRate: string, 
      clickRate: string, 
      bounceRate: string 
    }[];
    summary?: any;
  };
}

const colorScale = scaleLinear<string>()
  .domain([0, 10, 50, 100])
  .range(["#1e293b", "#312e81", "#4338ca", "#6366f1"]);

const rateColorScale = scaleLinear<string>()
  .domain([0, 5, 15, 30])
  .range(["#1e293b", "#064e3b", "#059669", "#10b981"]);

export default function WorldMapAnalytics({ data }: WorldMapProps) {
  const [tooltipContent, setTooltipContent] = useState("");
  const [activeMetric, setActiveMetric] = useState<'openRate' | 'clickRate' | 'bounceRate'>('openRate');

  const getCountryData = (countryName: string) => {
    return data.geoStats.find(s => s._id === countryName || s._id.toLowerCase() === countryName.toLowerCase());
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/40 border border-slate-700/50 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Globe className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Geographic Intelligence</h3>
            <p className="text-[10px] text-slate-500 font-medium">Real-time global engagement heatmap</p>
          </div>
        </div>
        
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
          {[
            { id: 'openRate', label: 'Open Rate', icon: TrendingUp, color: 'emerald' },
            { id: 'clickRate', label: 'Click Rate', icon: MousePointerClick, color: 'sky' },
            { id: 'bounceRate', label: 'Bounce Rate', icon: AlertTriangle, color: 'rose' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMetric(m.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMetric === m.id 
                  ? `bg-${m.color}-500/20 text-${m.color}-400 border border-${m.color}-500/30` 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <m.icon className="h-3.5 w-3.5" />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative aspect-[2/1] w-full bg-slate-900/20 rounded-3xl border border-slate-700/30 overflow-hidden group">
        <ComposableMap
          projectionConfig={{ scale: 140 }}
          className="w-full h-full"
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryName = geo.properties.name;
                const countryData = getCountryData(countryName);
                const metricValue = countryData ? parseFloat(countryData[activeMetric]) : 0;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => {
                      setTooltipContent(`${countryName}: ${metricValue}% ${activeMetric.replace('Rate', ' Rate')}`);
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("");
                    }}
                    style={{
                      default: {
                        fill: countryData ? rateColorScale(metricValue) : "#1e293b",
                        stroke: "#334155",
                        strokeWidth: 0.5,
                        outline: "none",
                      },
                      hover: {
                        fill: "#4f46e5",
                        stroke: "#6366f1",
                        strokeWidth: 1,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        fill: "#4338ca",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {tooltipContent && (
          <div className="absolute top-4 left-4 pointer-events-none bg-slate-950/90 border border-indigo-500/30 rounded-xl p-3 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-sm font-bold text-white">{tooltipContent}</span>
            </div>
          </div>
        )}

        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <div className="flex items-center gap-3 bg-slate-950/40 p-2 rounded-lg border border-slate-700/50 backdrop-blur-sm">
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-4 h-1.5 rounded-full" style={{ backgroundColor: colorScale(i * 250) }} />
                ))}
              </div>
              <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Top Performing Countries</h4>
          <div className="space-y-3">
            {data.geoStats.slice(0, 5).map((country, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-600">0{idx + 1}</span>
                  <span className="text-sm font-bold text-slate-200">{country._id}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-1.5 w-24 bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${parseFloat(country[activeMetric])}%` }} 
                    />
                  </div>
                  <span className="text-xs font-black text-white">{country[activeMetric]}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl flex flex-col justify-center text-center">
           <div className="flex justify-center mb-2">
              <TrendingUp className="h-8 w-8 text-emerald-400" />
           </div>
           <h4 className="text-sm font-bold text-white">Global Engagement Velocity</h4>
           <p className="text-xs text-slate-400 mt-1">Activity has increased by 14% across EMEA regions in the last 24 hours.</p>
           <button className="mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest underline decoration-indigo-500/30 underline-offset-4">
             View Regional Heatmap
           </button>
        </div>
      </div>
    </div>
  );
}
