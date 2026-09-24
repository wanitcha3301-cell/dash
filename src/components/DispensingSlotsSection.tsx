import React, { useState } from 'react';
import {
  ExternalLink,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { DispensingMachineSlotData, convertSlotToRunSummary } from '../data/dispensingFleetData';
import { MachineRunSummary } from '../data/machineModelData';

export interface DispensingSlotsSectionProps {
  slots: DispensingMachineSlotData[];
  selectedMachineId?: string;
  onSelectMachine: (id: string) => void;
  onOpenDrilldown?: (summary: MachineRunSummary) => void;
  sectionRef?: React.RefObject<HTMLDivElement | null>;
}

export const DispensingSlotsSection: React.FC<DispensingSlotsSectionProps> = ({
  slots,
  selectedMachineId = 'ALL',
  onSelectMachine,
  onOpenDrilldown,
  sectionRef,
}) => {
  const [slotFilter, setSlotFilter] = useState<'ALL' | 'TOP' | 'BOT'>('ALL');

  // Filtered slots for 13-channel grid
  const displaySlots = React.useMemo(() => {
    if (slotFilter === 'TOP') return slots.filter((s) => s.processType === 'Top Fill');
    if (slotFilter === 'BOT') return slots.filter((s) => s.processType === 'Under Fill');
    return slots;
  }, [slots, slotFilter]);

  return (
    <section
      id="dispensing-13-slots-section"
      ref={sectionRef}
      className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4 shadow-xs transition-all"
    >
      {/* Section Header & Group Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 bg-white p-4 rounded-xl shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-black uppercase tracking-wider bg-sky-100 text-sky-900 border border-sky-300">
            13 CHANNELS (MC-01 - MC-13)
          </span>
          {selectedMachineId && selectedMachineId !== 'ALL' && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <span>Current Station: {selectedMachineId}</span>
            </span>
          )}
        </div>

        {/* Group Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
          <button
            onClick={() => setSlotFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
              slotFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All (13 Units)
          </button>
          <button
            onClick={() => setSlotFilter('TOP')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
              slotFilter === 'TOP'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Top Fill (MC-01 to MC-04)
          </button>
          <button
            onClick={() => setSlotFilter('BOT')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
              slotFilter === 'BOT'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bot Under Fill (MC-05 to MC-13)
          </button>
        </div>
      </div>

      {/* 13 CHANNELS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displaySlots.map((slot) => {
          const isRun = slot.status === 'RUNNING';
          const isTop = slot.processType === 'Top Fill';
          const topModel = slot.topModel;
          const isCurrent = slot.machineId === selectedMachineId;

          return (
            <div
              key={slot.machineId}
              id={`slot-${slot.machineId}`}
              onClick={() => onSelectMachine(slot.machineId)}
              className={`bg-white rounded-2xl border p-3.5 flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group/card relative ${
                isCurrent
                  ? 'ring-2 ring-sky-500 border-sky-400 bg-sky-50/40 shadow-md'
                  : isRun
                  ? isTop
                    ? 'border-sky-200 hover:border-sky-500 hover:ring-2 hover:ring-sky-200'
                    : 'border-purple-200 hover:border-purple-500 hover:ring-2 hover:ring-purple-200'
                  : 'border-rose-200 bg-rose-50/20 hover:border-rose-400 hover:ring-2 hover:ring-rose-200'
              }`}
              title={`Click to open single machine view for ${slot.machineId}`}
            >
              <div>
                {/* Slot Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs border ${
                        isCurrent
                          ? 'bg-sky-600 text-white border-sky-700 shadow-2xs'
                          : isTop
                          ? 'bg-sky-100 text-sky-900 border-sky-300'
                          : 'bg-purple-100 text-purple-900 border-purple-300'
                      }`}
                    >
                      {String(slot.slotNumber).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMachine(slot.machineId);
                          }}
                          className="font-mono font-black text-sm text-slate-900 hover:text-sky-600 transition-colors cursor-pointer flex items-center gap-1 group/id"
                          title={`Click to navigate to ${slot.machineId}`}
                        >
                          <span>{slot.machineId}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover/id:text-sky-600" />
                        </button>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isRun ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        <span
                          className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border ${
                            isRun
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {slot.status}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-sm bg-sky-600 text-white shadow-2xs">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {slot.line} • {slot.operatorId}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                      isTop
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}
                  >
                    {slot.processType}
                  </span>
                </div>

                {/* MINI-GRAPH FOR THIS MACHINE */}
                <div className="mt-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span className="font-bold flex items-center gap-1 text-slate-700">
                      <TrendingUp className="w-3 h-3 text-sky-600" />
                      Hourly Production (07:00 - 18:00)
                    </span>
                    <span className="text-emerald-700 font-bold">Target 95 UPH</span>
                  </div>

                  <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={slot.hourlyData}
                        margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id={`pageSlotGrad-${slot.machineId}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={isTop ? '#0284c7' : '#8b5cf6'}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor={isTop ? '#0284c7' : '#8b5cf6'}
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="hourShort"
                          tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#94a3b8' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          domain={[0, 140]}
                        />
                        <ReferenceLine
                          y={95}
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
                                  <div className="font-bold text-amber-300">{d.hour}</div>
                                  <div>
                                    Output: <strong className="text-white">{d.actualPcs} boards</strong>
                                  </div>
                                  <div className="text-emerald-400">
                                    Fulfillment: <strong>{d.efficiencyPercent}%</strong>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="actualPcs"
                          stroke={isTop ? '#0284c7' : '#8b5cf6'}
                          strokeWidth={2}
                          fill={`url(#pageSlotGrad-${slot.machineId})`}
                          dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            const isPassed = payload.actualPcs >= 95;
                            return (
                              <circle
                                key={`dot-${payload.hourShort}`}
                                cx={cx}
                                cy={cy}
                                r={2.2}
                                fill={isPassed ? '#10b981' : '#f59e0b'}
                              />
                            );
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Core Metrics Strip */}
                <div className="grid grid-cols-3 gap-1.5 mt-2 font-mono text-center">
                  <div className="bg-slate-50 p-1 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 uppercase block">UPH</span>
                    <strong className="text-xs text-slate-900 font-bold">{slot.uph}</strong>
                  </div>
                  <div className="bg-slate-50 p-1 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 uppercase block">Total Output</span>
                    <strong className="text-xs text-slate-900 font-bold">
                      {slot.totalOutput.toLocaleString()}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-1 rounded-lg border border-slate-100">
                    <span className="text-[9px] text-slate-400 uppercase block">Yield</span>
                    <strong className="text-xs text-emerald-700 font-bold">{slot.yieldRate}%</strong>
                  </div>
                </div>

                {/* HIGHLIGHT: TOP VOLUME MODEL CALLOUT */}
                <div className="mt-2.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200 font-mono">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1 text-amber-900 font-bold">
                      <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Top Model:</span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-950">
                      {topModel.percentage}%
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between text-xs">
                    <span className="font-black text-slate-900 truncate">
                      {topModel.modelName}
                    </span>
                    <span className="text-amber-900 font-bold shrink-0 ml-1 text-[11px]">
                      {topModel.quantity.toLocaleString()} pcs
                    </span>
                  </div>
                </div>

                {/* MODELS RUN LIST */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-500 font-bold mb-1">
                    <span>Models Run:</span>
                    <span className="text-[10px] text-slate-400">{slot.modelsRun.length} Models</span>
                  </div>

                  <div className="space-y-1">
                    {slot.modelsRun.map((m) => (
                      <div
                        key={m.modelId}
                        className="bg-slate-50 p-1 rounded-md border border-slate-100 flex flex-col gap-0.5 cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenDrilldown) {
                            onOpenDrilldown(convertSlotToRunSummary(slot));
                          }
                        }}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 truncate">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: m.color }}
                            />
                            <span className="font-bold text-slate-800 truncate">
                              {m.modelName}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 shrink-0 ml-1">
                            {m.quantity} ({m.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${m.percentage}%`,
                              backgroundColor: m.color
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
