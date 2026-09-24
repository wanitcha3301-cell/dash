import React from 'react';
import { OvenUnit } from '../types';
import { Flame, Thermometer, Gauge, Cpu, TrendingUp, ExternalLink, Activity } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { computeOvenHourlyData } from '../utils/ovenChartUtils';

interface BakeOvensOverviewSectionProps {
  units: OvenUnit[];
  onSelectOven?: (ovenId: string) => void;
}

export const BakeOvensOverviewSection: React.FC<BakeOvensOverviewSectionProps> = ({
  units,
  onSelectOven
}) => {
  return (
    <section id="bake-ovens-overview-section" className="space-y-3 pt-1">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm font-sans">
            Bake Oven Lines ({units.length} Ovens Active)
          </h3>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            • Thermal Curing & Multi-zone Temperatures
          </span>
        </div>
        <span className="text-xs text-sky-700 font-mono font-semibold flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          คลิกที่การ์ดหรือกราฟเพื่อดูรายละเอียดเตาอบ
        </span>
      </div>

      {/* Balanced 5-Column Grid on Large Displays with Clickable Mini-Graphs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {units.map((unit, idx) => {
          const isRunning = unit.status === 'RUNNING';
          const target = unit.pcsCount ? Math.round(unit.pcsCount * 1.05) : 1200;
          const actual = unit.pcsCount || 1150;
          const progress = Math.min(100, Math.round((actual / target) * 100));
          const hourlySlots = computeOvenHourlyData(unit);
          const targetUph = hourlySlots[0]?.targetUph || 120;

          return (
            <div
              key={unit.id}
              onClick={() => onSelectOven?.(unit.id)}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400 hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3 cursor-pointer group shadow-xs"
              title={`คลิกเพื่อเปิดดูกราฟและรายละเอียด ${unit.name}`}
            >
              <div>
                {/* Card Top: Index & Line Info */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 group-hover:bg-sky-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs shrink-0 tracking-wider transition-colors">
                      0{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs truncate group-hover:text-sky-700 transition-colors">
                        {unit.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Line 0{idx + 1}
                      </p>
                    </div>
                  </div>

                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold flex items-center gap-1 shrink-0 border ${
                    isRunning
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                      : 'bg-rose-50 text-rose-700 border-rose-200/70'
                  }`}>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span>{isRunning ? 'RUN' : 'STOP'}</span>
                  </div>
                </div>

                {/* Key Telemetry Readings */}
                <div className="space-y-1.5 my-2.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/60 group-hover:bg-sky-50/30 transition-colors">
                    <span className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-amber-600" />
                      <span>Temp</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {unit.tempCelsius !== undefined ? unit.tempCelsius : 180.0}°C
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/60 group-hover:bg-sky-50/30 transition-colors">
                    <span className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-sky-600" />
                      <span>Conveyor</span>
                    </span>
                    <span className="font-bold text-slate-900">750 mm/m</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/60 group-hover:bg-sky-50/30 transition-colors">
                    <span className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-slate-600" />
                      <span>Model</span>
                    </span>
                    <span className="font-bold text-slate-800 truncate max-w-[85px]" title={unit.runningModel}>
                      {unit.runningModel || '504-2187'}
                    </span>
                  </div>
                </div>

                {/* MINI-GRAPH FOR THIS MACHINE: Hourly Production Output */}
                <div className="my-2.5 bg-slate-50/80 p-2 rounded-xl border border-slate-200 group-hover:border-sky-300 transition-colors">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="font-bold flex items-center gap-1 text-slate-700">
                      <TrendingUp className="w-3 h-3 text-sky-600" />
                      <span>Hourly Output</span>
                    </span>
                    <span className="text-emerald-700 font-semibold text-[9px]">
                      Tgt {targetUph}
                    </span>
                  </div>

                  <div className="h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={hourlySlots}
                        margin={{ top: 2, right: 2, left: -30, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id={`bakeGrad-${unit.id}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#0284c7" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#0284c7" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="hour"
                          tick={{ fontSize: 8, fontFamily: 'monospace', fill: '#94a3b8' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 8, fontFamily: 'monospace', fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <ReferenceLine
                          y={targetUph}
                          stroke="#059669"
                          strokeDasharray="2 2"
                          strokeWidth={1}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-1.5 rounded-lg text-[9px] font-mono shadow-md border border-slate-700">
                                  <div className="font-bold text-sky-300">{d.hour}</div>
                                  <div>ผลิตได้: <span className="font-bold text-white">{d.totalUph} pcs</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="totalUph"
                          stroke="#0284c7"
                          strokeWidth={1.5}
                          fillOpacity={1}
                          fill={`url(#bakeGrad-${unit.id})`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 bg-slate-50/60 p-2 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500 font-sans">Output</span>
                    <span className="font-bold text-slate-800">
                      {actual.toLocaleString()}{' '}
                      <span className="text-slate-400 font-normal">({progress}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${progress}%` }}
                      className="h-full bg-sky-600 rounded-full transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer: Interactive CTA */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                <span className="truncate max-w-[70px] text-slate-400" title={unit.program}>
                  {unit.program || 'BAKE-STD'}
                </span>
                <span className="text-sky-700 font-bold flex items-center gap-1 group-hover:text-sky-900 group-hover:translate-x-0.5 transition-all">
                  <span>ดูกราฟเตาอบ</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
