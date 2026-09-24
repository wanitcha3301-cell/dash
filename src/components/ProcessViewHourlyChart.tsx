import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Layers } from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { ScreenType } from '../types';

interface HourlyStageRecord {
  hour: string;
  vacuum: number;
  bake: number;
  dispensing: number;
  fvmi: number;
  aoi: number;
  xray: number;
  total: number;
}

export const ProcessViewHourlyChart: React.FC = () => {
  const { navigate } = useFactory();

  // Mode: 'breakdown' = 6-Stage Breakdown (UPH), 'total' = Total Line Output (UPH)
  const [viewMode, setViewMode] = useState<'breakdown' | 'total'>('breakdown');

  // Exact hourly records matching the screenshot
  const hourlyData: HourlyStageRecord[] = [
    { hour: '08:00', vacuum: 580, bake: 750, dispensing: 1150, fvmi: 720, aoi: 1650, xray: 720, total: 5570 },
    { hour: '09:00', vacuum: 950, bake: 950, dispensing: 1300, fvmi: 850, aoi: 1850, xray: 850, total: 6750 },
    { hour: '10:00', vacuum: 1150, bake: 950, dispensing: 1300, fvmi: 920, aoi: 1980, xray: 920, total: 7220 },
    { hour: '11:00', vacuum: 800, bake: 600, dispensing: 1180, fvmi: 780, aoi: 1750, xray: 780, total: 5890 },
    { hour: '12:00', vacuum: 1300, bake: 1150, dispensing: 1320, fvmi: 950, aoi: 1950, xray: 950, total: 7620 },
    { hour: '13:00', vacuum: 950, bake: 950, dispensing: 1280, fvmi: 850, aoi: 1800, xray: 950, total: 6780 },
  ];

  // Stage definitions for cards and chart with softened, elegant pastel-tone colors
  const stages = [
    {
      id: 'vacuum',
      name: 'Vacuum Oven',
      shortName: 'Vacuum Oven',
      color: '#34d399', // soft mint-emerald
      value: '6,000',
      units: '2 Vacuum Units',
      bgClass: 'bg-[#f0fdf4]',
      borderClass: 'border-[#bbf7d0]',
      textClass: 'text-[#059669]',
      route: 'vacuum-process' as ScreenType
    },
    {
      id: 'bake',
      name: 'Bake Oven',
      shortName: 'Bake Oven',
      color: '#fbbf24', // soft warm amber-gold
      value: '5,600',
      units: '5 Bake Units',
      bgClass: 'bg-[#fffbeb]',
      borderClass: 'border-[#fef08a]',
      textClass: 'text-[#d97706]',
      route: 'bake-process' as ScreenType
    },
    {
      id: 'dispensing',
      name: 'Total Dispense',
      shortName: 'Dispensing',
      color: '#38bdf8', // soft calm sky blue
      value: '7,800',
      units: '12 MC Top & Under',
      bgClass: 'bg-[#f0f9ff]',
      borderClass: 'border-[#bae6fd]',
      textClass: 'text-[#0284c7]',
      route: 'machine-detail' as ScreenType,
      routeParam: 'ALL'
    },
    {
      id: 'fvmi',
      name: 'Total FVMI',
      shortName: 'FVMI',
      color: '#fb923c', // soft peach orange
      value: '6,630',
      units: '9 Stations Total',
      bgClass: 'bg-[#fff7ed]',
      borderClass: 'border-[#fed7aa]',
      textClass: 'text-[#ea580c]',
      route: 'fvmi' as ScreenType
    },
    {
      id: 'aoi',
      name: 'Total AOI',
      shortName: 'AOI',
      color: '#818cf8', // soft periwinkle lavender
      value: '13,100',
      units: '2 Optical Lines',
      bgClass: 'bg-[#eef2ff]',
      borderClass: 'border-[#c7d2fe]',
      textClass: 'text-[#4f46e5]',
      route: 'packout-aoi' as ScreenType,
      routeParam: 'ALL'
    },
    {
      id: 'xray',
      name: 'Total X-ray',
      shortName: 'X-ray',
      color: '#fb7185', // soft rose coral
      value: '12,210',
      units: '5 Units NDT',
      bgClass: 'bg-[#fff1f2]',
      borderClass: 'border-[#fecdd3]',
      textClass: 'text-[#e11d48]',
      route: 'packout-xray' as ScreenType,
      routeParam: 'ALL'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
      {/* 1. Header with Title, Badge, Subtitle and Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-slate-700 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Total SMT Line Throughput (All Stages Combined)</span>
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#b3e5fc] text-sky-950 border border-sky-300 rounded-sm">
              PROCESS
            </span>
          </div>
          <p className="text-[11px] font-mono font-medium text-slate-400 mt-1 uppercase tracking-wide">
            HOURLY PROCESS FLOW &amp; TOTAL UPH — SEPARATED VACUUM, BAKE &amp; DOWNSTREAM STAGES
          </p>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold self-start lg:self-auto">
          <button
            onClick={() => setViewMode('breakdown')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'breakdown'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            6-Stage Breakdown (UPH)
          </button>
          <button
            onClick={() => setViewMode('total')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'total'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Total Line Output (UPH)
          </button>
        </div>
      </div>

      {/* 2. Six Process Cards Grid (2 rows x 3 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {stages.map((stage) => (
          <div
            key={stage.id}
            onClick={() => {
              if (stage.routeParam) navigate(stage.route, stage.routeParam);
              else navigate(stage.route);
            }}
            className={`border ${stage.borderClass} ${stage.bgClass} rounded-xl p-3.5 transition-all hover:shadow-xs cursor-pointer group`}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950 transition-colors">
                {stage.name}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {stage.value}
              </span>
              <span className={`text-xs font-bold font-mono ${stage.textClass}`}>
                UPH
              </span>
            </div>
            <div className={`text-xs font-mono mt-0.5 ${stage.textClass}`}>
              {stage.units}
            </div>
          </div>
        ))}
      </div>

      {/* 3. The Clustered Hourly Chart */}
      <div className="relative pt-2 pb-2">
        {/* Chart Canvas */}
        <div className="h-72 sm:h-80 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'breakdown' ? (
              <BarChart
                data={hourlyData}
                margin={{ top: 15, right: 10, left: 10, bottom: 0 }}
                barGap={2}
                barCategoryGap="28%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="hour"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fontSize: 12, fontFamily: 'monospace', fill: '#64748b', fontWeight: 300 }}
                  dy={8}
                />
                <YAxis domain={[0, 2400]} hide />
                <Tooltip
                  shared={false}
                  cursor={false}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0];
                    const stageInfo = stages.find(
                      (s) => s.id === item.dataKey || s.name === item.name || s.shortName === item.name
                    );
                    const stageName = stageInfo?.name || item.name || 'Stage';
                    const stageColor = item.color || stageInfo?.color || '#38bdf8';
                    const stageUnits = stageInfo?.units || '';
                    const val = Number(item.value) || 0;

                    return (
                      <div className="bg-white/98 backdrop-blur-md text-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-mono shadow-xl border border-slate-200/90 space-y-1.5 min-w-[200px] pointer-events-none select-none">
                        {/* Header: Machine Name + Hour */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-xs shrink-0 shadow-2xs"
                              style={{ backgroundColor: stageColor }}
                            />
                            <span className="font-bold text-slate-900 text-[12px]">{stageName}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono font-light bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {label}
                          </span>
                        </div>

                        {/* Value Display for this machine only */}
                        <div className="flex items-baseline justify-between pt-0.5">
                          <span className="text-slate-500 text-[11px]">Output:</span>
                          <div className="flex items-baseline gap-1 font-mono">
                            <span className="text-base font-black" style={{ color: stageColor }}>
                              {val.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">UPH</span>
                          </div>
                        </div>

                        {/* Stage Details */}
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>{stageUnits}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="vacuum" fill="#34d399" name="Vacuum Oven" radius={[2, 2, 0, 0]} maxBarSize={16} />
                <Bar dataKey="bake" fill="#fbbf24" name="Bake Oven" radius={[2, 2, 0, 0]} maxBarSize={16} />
                <Bar dataKey="dispensing" fill="#38bdf8" name="Dispensing" radius={[2, 2, 0, 0]} maxBarSize={16} />
                <Bar dataKey="fvmi" fill="#fb923c" name="FVMI" radius={[2, 2, 0, 0]} maxBarSize={16} />
                <Bar dataKey="aoi" fill="#818cf8" name="AOI" radius={[2, 2, 0, 0]} maxBarSize={16} />
                <Bar dataKey="xray" fill="#fb7185" name="X-ray" radius={[2, 2, 0, 0]} maxBarSize={16} />
              </BarChart>
            ) : (
              <BarChart
                data={hourlyData}
                margin={{ top: 15, right: 10, left: 10, bottom: 0 }}
                barCategoryGap="35%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="hour"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fontSize: 12, fontFamily: 'monospace', fill: '#64748b', fontWeight: 300 }}
                  dy={8}
                />
                <YAxis domain={[0, 9000]} hide />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/98 backdrop-blur-md text-slate-800 p-3 rounded-xl text-xs font-mono shadow-xl border border-slate-200/90 space-y-1.5 w-60">
                          <div className="font-bold text-sky-700 border-b border-slate-100 pb-1 flex items-center justify-between">
                            <span>Total Output at <span className="font-normal text-slate-700">{label}</span></span>
                            <span className="text-[10px] text-slate-400 font-normal">All 6 Stages</span>
                          </div>
                          <div className="text-xl font-bold text-slate-900 pt-0.5">
                            {data.total.toLocaleString()} <span className="text-xs text-sky-600 font-normal">UPH</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Combined Across All 6 SMT Machine Stages
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" fill="#38bdf8" name="Total Line Output" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Footer Legend & Average Flow Rate */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4 text-slate-700 font-semibold">
          {stages.map((stage) => (
            <div
              key={stage.id}
              onClick={() => {
                if (stage.routeParam) navigate(stage.route, stage.routeParam);
                else navigate(stage.route);
              }}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              <span>{stage.shortName}</span>
            </div>
          ))}
        </div>

        <div className="text-slate-400 text-xs font-mono">
          Average Flow: 1,426 UPH / Stage
        </div>
      </div>
    </div>
  );
};
