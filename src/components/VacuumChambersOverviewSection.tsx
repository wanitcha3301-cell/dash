import React from 'react';
import { OvenUnit } from '../types';
import { Wind, Thermometer, Cpu, TrendingUp, ExternalLink, Activity } from 'lucide-react';
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

interface VacuumChambersOverviewSectionProps {
  units: OvenUnit[];
  onSelectChamber?: (chamberId: string) => void;
}

export const VacuumChambersOverviewSection: React.FC<VacuumChambersOverviewSectionProps> = ({
  units,
  onSelectChamber
}) => {
  return (
    <section id="vacuum-chambers-overview-section" className="space-y-3 pt-1">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <Wind className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm font-sans">
            Vacuum Chamber Stations ({units.length} Chambers Active)
          </h3>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            • Line 06 Degassing Sub-process & High-Vacuum Curves
          </span>
        </div>
        <span className="text-xs text-sky-700 font-mono font-semibold flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          คลิกที่การ์ดหรือกราฟเพื่อดูรายละเอียดเครื่อง
        </span>
      </div>

      {/* Grid of 2 Vacuum Chambers with Clickable Mini-Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {units.map((unit, idx) => {
          const isChamberA = idx === 0;
          const isRunning = unit.status === 'RUNNING';
          const target = unit.pcsCount ? Math.round(unit.pcsCount * 1.05) : 1200;
          const actual = unit.pcsCount || 1150;
          const progress = Math.min(100, Math.round((actual / target) * 100));
          const hourlySlots = computeOvenHourlyData(unit);
          const targetUph = hourlySlots[0]?.targetUph || 120;

          return (
            <div
              key={unit.id}
              onClick={() => onSelectChamber?.(unit.id)}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 cursor-pointer group shadow-xs"
              title={`คลิกเพื่อเปิดดูกราฟและรายละเอียด ${unit.name}`}
            >
              <div>
                {/* Header: Identity & Status */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 group-hover:bg-sky-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs shrink-0 tracking-wider transition-colors">
                      0{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2 group-hover:text-sky-700 transition-colors">
                        <span>{unit.name}</span>
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                          {isChamberA ? 'Chamber A' : 'Chamber B'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {unit.chamberLabel || 'Vacuum Degas Module'} • Operator: <span className="text-slate-600 font-medium">{unit.operatorId}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator & Click CTA */}
                  <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold flex items-center gap-1.5 shrink-0 border ${
                      isRunning
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                        : 'bg-rose-50 text-rose-700 border-rose-200/70'
                    }`}>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      <span>{isRunning ? 'RUNNING' : 'STOPPED'}</span>
                    </div>
                  </div>
                </div>

                {/* Key Telemetry Readings */}
                <div className="grid grid-cols-3 gap-2.5 my-3.5 font-mono text-[11px]">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 group-hover:bg-sky-50/30 transition-colors">
                    <span className="text-[10px] text-slate-500 font-sans font-medium flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-sky-600" />
                      <span>Pressure</span>
                    </span>
                    <span className="font-bold text-slate-900 text-sm mt-1 block">
                      {unit.pressurePa !== undefined ? unit.pressurePa : 0.45}{' '}
                      <span className="text-[11px] text-slate-400 font-normal">Pa</span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 group-hover:bg-sky-50/30 transition-colors">
                    <span className="text-[10px] text-slate-500 font-sans font-medium flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                      <span>Temperature</span>
                    </span>
                    <span className="font-bold text-slate-900 text-sm mt-1 block">
                      {unit.tempCelsius !== undefined ? unit.tempCelsius : 180.2}°C
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 group-hover:bg-sky-50/30 transition-colors">
                    <span className="text-[10px] text-slate-500 font-sans font-medium flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-slate-600" />
                      <span>Model Recipe</span>
                    </span>
                    <span className="font-bold text-slate-800 text-sm truncate mt-1 block" title={unit.runningModel}>
                      {unit.runningModel || '504-2187'}
                    </span>
                  </div>
                </div>

                {/* MINI-GRAPH FOR THIS MACHINE: Hourly Production Output */}
                <div className="my-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 group-hover:border-sky-300 transition-colors">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="font-bold flex items-center gap-1 text-slate-700">
                      <TrendingUp className="w-3 h-3 text-sky-600" />
                      <span>Hourly Output (08:00 - 17:00)</span>
                    </span>
                    <span className="text-emerald-700 font-semibold text-[10px]">
                      Target {targetUph} UPH
                    </span>
                  </div>

                  <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={hourlySlots}
                        margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id={`vacGrad-${unit.id}`}
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
                          tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#94a3b8' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#94a3b8' }}
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
                                <div className="bg-slate-900 text-white p-2 rounded-lg text-[10px] font-mono shadow-md border border-slate-700">
                                  <div className="font-bold text-sky-300">{d.hour} ({d.timeRange})</div>
                                  <div>ผลิตได้: <span className="font-bold text-white">{d.totalUph} pcs</span></div>
                                  <div className="text-slate-400">เป้าหมาย: {d.targetUph} pcs</div>
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
                          strokeWidth={2}
                          fillOpacity={1}
                          fill={`url(#vacGrad-${unit.id})`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Production Output Progress bar */}
                <div className="space-y-1.5 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500 font-sans">Accumulated Output</span>
                    <span className="font-bold text-slate-800">
                      {actual.toLocaleString()}{' '}
                      <span className="text-slate-400 font-normal">/ {target.toLocaleString()} ({progress}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${progress}%` }}
                      className="h-full bg-sky-600 rounded-full transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer: Interactive CTA */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">
                  Program: <strong className="text-slate-700">{unit.program || 'VAC-STD'}</strong>
                </span>
                <span className="text-sky-700 font-bold flex items-center gap-1 group-hover:text-sky-900 group-hover:translate-x-0.5 transition-all">
                  <span>ดูกราฟและรายละเอียด</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
