import React, { useState, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  Award,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Scan,
  Camera
} from 'lucide-react';
import { FVMIMachineHourlyData } from './FVMIFleetMonitor';
import {
  FvmiMachineSlotData,
  INITIAL_FVMI_9_SLOTS,
  getCombinedFvmiHourlyFleet,
  syncFvmiSlotsWithLiveFleet,
  CombinedFvmiHourlyPoint
} from '../data/fvmi9SlotData';

interface FVMISingleFleetChartProps {
  fleet: FVMIMachineHourlyData[];
  selectedStationId?: string;
  onSelectStation: (stationId: string) => void;
  openTraceabilityModal?: (panelId: string) => void;
}

export const FVMISingleFleetChart: React.FC<FVMISingleFleetChartProps> = ({
  fleet,
  selectedStationId = 'ALL',
  onSelectStation,
  openTraceabilityModal
}) => {
  const [isSlotsSectionVisible, setIsSlotsSectionVisible] = useState<boolean>(false);
  const [slotFilter, setSlotFilter] = useState<'ALL' | 'LINE1_3' | 'LINE4_5' | 'LINE6'>('ALL');

  const slotsSectionRef = useRef<HTMLDivElement>(null);

  // Synchronize live telemetry updates with base slot structures
  const synchronizedSlots = useMemo(() => {
    return syncFvmiSlotsWithLiveFleet(INITIAL_FVMI_9_SLOTS, fleet);
  }, [fleet]);

  // Combined hourly fleet data: SINGLE GRAPH for the entire 9-machine fleet
  const combinedHourlyData = useMemo(() => {
    return getCombinedFvmiHourlyFleet(synchronizedSlots);
  }, [synchronizedSlots]);

  // Overall summary metrics
  const totalFleetOutput = useMemo(() => {
    return synchronizedSlots.reduce((acc, s) => acc + s.totalOutput, 0);
  }, [synchronizedSlots]);

  const totalFleetPass = useMemo(() => {
    return synchronizedSlots.reduce((acc, s) => acc + s.passCount, 0);
  }, [synchronizedSlots]);

  const totalFleetFail = useMemo(() => {
    return synchronizedSlots.reduce((acc, s) => acc + s.failCount, 0);
  }, [synchronizedSlots]);

  const fleetYield = useMemo(() => {
    return totalFleetOutput > 0
      ? ((totalFleetPass / totalFleetOutput) * 100).toFixed(2)
      : '100.00';
  }, [totalFleetPass, totalFleetOutput]);

  const runningCount = synchronizedSlots.filter((s) => s.status === 'RUNNING').length;
  const avgUph = Math.round(
    synchronizedSlots.reduce((acc, s) => acc + s.uph, 0) / Math.max(1, synchronizedSlots.length)
  );

  // Filtered slots for 9-channel grid
  const displaySlots = useMemo(() => {
    if (slotFilter === 'LINE1_3') {
      return synchronizedSlots.filter((s) => ['FVMI-01', 'FVMI-02', 'FVMI-03'].includes(s.machineId));
    }
    if (slotFilter === 'LINE4_5') {
      return synchronizedSlots.filter((s) => ['FVMI-04', 'FVMI-05'].includes(s.machineId));
    }
    if (slotFilter === 'LINE6') {
      return synchronizedSlots.filter((s) => ['FVMI-06', 'FVMI-07', 'FVMI-08', 'FVMI-09'].includes(s.machineId));
    }
    return synchronizedSlots;
  }, [synchronizedSlots, slotFilter]);

  // Handler when user clicks anywhere on the unified graph -> open & scroll smoothly to 9 slots section
  const handleGraphClick = () => {
    setIsSlotsSectionVisible(true);
    setTimeout(() => {
      if (slotsSectionRef.current) {
        slotsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  return (
    <div className="space-y-6">
      {/* 4 Fleet Overview Metrics Cards (Matching Dispensing Layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-[11px] font-mono text-slate-500 uppercase font-bold">
            Total Inspected Fleet
          </div>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">
            {totalFleetOutput.toLocaleString()} <span className="text-xs font-normal text-slate-400">boards</span>
          </div>
          <div className="text-[10px] text-sky-700 font-mono mt-0.5 font-bold">
            All 9 Machines (Line 01 - Line 06)
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-[11px] font-mono text-slate-500 uppercase font-bold">
            Fleet Yield Rate
          </div>
          <div className="text-xl font-black font-mono text-emerald-700 mt-1">
            {fleetYield}%
          </div>
          <div className="text-[10px] text-emerald-600 font-mono mt-0.5 font-semibold">
            Pass: {totalFleetPass.toLocaleString()} • NG: {totalFleetFail.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-[11px] font-mono text-slate-500 uppercase font-bold">
            Average Station UPH
          </div>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">
            {avgUph} <span className="text-xs font-normal text-slate-400">boards/h</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Standard: 1,100 UPH / Station
          </div>
        </div>

        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl shadow-xs">
          <div className="text-[11px] font-mono text-sky-800 uppercase font-bold">
            Active Inspection Stations
          </div>
          <div className="text-xl font-black font-mono text-sky-950 mt-1">
            {runningCount} / {synchronizedSlots.length} <span className="text-xs font-normal text-sky-700">RUNNING</span>
          </div>
          <div className="text-[10px] text-sky-700 font-mono mt-0.5 font-bold">
            FVMI-01 to FVMI-09 Ready
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. UNIFIED CHART CARD: SINGLE GRAPH DISPLAYING ALL 9 MACHINES' DATA       */}
      {/* ========================================================================= */}
      <div
        id="fvmi-unified-chart-card"
        className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs hover:border-sky-300 transition-all"
      >
        {/* Legend Indicators */}
        <div className="flex flex-wrap items-center gap-4 py-2.5 px-3 bg-slate-50 rounded-xl mb-3 text-xs font-mono border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-sky-600 border border-sky-700 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </span>
            <span className="font-bold text-sky-950">
              FVMI Fleet Total Output (FVMI-01 to FVMI-09 • 9 Machines)
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
            <span className="w-2.5 h-0.5 border-t-2 border-dashed border-emerald-600" />
            <span>Target UPH: 9,900</span>
          </div>
        </div>

        {/* THE MAIN UNIFIED CHART WITH A SINGLE LINE/AREA FOR 9 MACHINES */}
        <div
          onClick={handleGraphClick}
          className="h-80 w-full cursor-pointer relative group"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={combinedHourlyData}
              onClick={handleGraphClick}
              margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="fvmiFleetSingleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="hourShort"
                tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 11500]}
              />

              {/* Fleet Target Line: 9 x 1,100 = 9,900 UPH */}
              <ReferenceLine
                y={9900}
                stroke="#059669"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: 'Fleet Target: 9,900 UPH',
                  position: 'insideTopRight',
                  fill: '#059669',
                  fontSize: 10,
                  fontFamily: 'monospace'
                }}
              />

              {/* CUSTOM COMPACT TOOLTIP */}
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const point: CombinedFvmiHourlyPoint = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-mono max-w-md pointer-events-none space-y-2.5">
                        {/* Tooltip Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-amber-300 flex items-center gap-1 text-[13px]">
                            ⏰ {point.hour}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            9 Machines Total: {point.totalFleet.toLocaleString()} boards
                          </span>
                        </div>

                        {/* SECTION: FLEET SUMMARY & TOP MOST MODEL */}
                        <div className="p-2 rounded-lg bg-sky-950/70 border border-sky-800/80 space-y-1.5">
                          <div className="flex items-center justify-between text-sky-200">
                            <span className="font-bold text-sky-400 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-sky-400" />
                              9 Stations Combined Output:
                            </span>
                            <strong className="text-white text-xs font-black">
                              {point.totalFleet.toLocaleString()} boards ({point.yieldPercent}%)
                            </strong>
                          </div>

                          {/* Top Most Model */}
                          <div className="text-[10px] text-amber-300 flex items-center justify-between bg-sky-900/50 px-2 py-0.5 rounded border border-sky-800">
                            <span className="flex items-center gap-1">
                              <Award className="w-3 h-3 text-amber-400" />
                              <span>👑 Top Model this hour:</span>
                            </span>
                            <strong className="text-amber-200 font-bold truncate max-w-44">
                              {point.topMostModelName} ({point.topMostModelOutput.toLocaleString()} pcs)
                            </strong>
                          </div>
                        </div>

                        {/* SECTION: 9 STATIONS BREAKDOWN GRID */}
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between">
                            <span>9 Machines Inspection Output:</span>
                            <span>Target 1,100 / machine</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-1 border-t border-slate-800">
                            {point.machines.map((m) => {
                              const isRun = m.status === 'RUNNING';
                              return (
                                <div
                                  key={m.machineId}
                                  className="bg-slate-800/70 p-1 rounded border border-slate-700/60 flex flex-col justify-between"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-sky-300">{m.machineId}</span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isRun ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                  </div>
                                  <div className="flex items-baseline justify-between mt-0.5">
                                    <span className="text-slate-400 text-[9px] truncate max-w-16">
                                      {m.model.replace('MODEL ', '')}
                                    </span>
                                    <strong className={isRun ? 'text-white font-black' : 'text-rose-300'}>
                                      {isRun ? m.output : 'STOP'}
                                    </strong>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="totalFleet"
                name="FVMI Fleet Output"
                stroke="#0284c7"
                strokeWidth={2.5}
                fill="url(#fvmiFleetSingleGrad)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isPassed = payload.totalFleet >= 9900;
                  return (
                    <circle
                      key={`dot-fvmi-${payload.hourShort}`}
                      cx={cx}
                      cy={cy}
                      r={3.5}
                      fill={isPassed ? '#10b981' : '#0284c7'}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 9 CHANNELS SECTION                                                      */}
      {/* ========================================================================= */}
      {isSlotsSectionVisible && (
        <section
          id="fvmi-9-slots-section"
          ref={slotsSectionRef}
          className="bg-slate-50/80 rounded-2xl border border-slate-300 p-4 sm:p-5 space-y-4 shadow-xs animate-in fade-in slide-in-from-top-4 duration-300"
        >
          {/* Section Header & Group Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 bg-white p-4 rounded-xl shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-black uppercase tracking-wider bg-sky-100 text-sky-900 border border-sky-300">
                9 CHANNELS (FVMI-01 - FVMI-09)
              </span>
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
                All (9 Machines)
              </button>
              <button
                onClick={() => setSlotFilter('LINE1_3')}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                  slotFilter === 'LINE1_3'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Line 01 - 03 (FVMI-01 to 03)
              </button>
              <button
                onClick={() => setSlotFilter('LINE4_5')}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                  slotFilter === 'LINE4_5'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Line 04 - 05 (FVMI-04 to 05)
              </button>
              <button
                onClick={() => setSlotFilter('LINE6')}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                  slotFilter === 'LINE6'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Line 06 Bay A-D (FVMI-06 to 09)
              </button>
            </div>
          </div>

          {/* 9 CHANNELS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displaySlots.map((slot) => {
              const isRun = slot.status === 'RUNNING';
              const topModel = slot.topModel;

              return (
                <div
                  key={slot.machineId}
                  id={`slot-${slot.machineId}`}
                  onClick={() => onSelectStation(slot.machineId)}
                  className={`bg-white rounded-2xl border p-3.5 flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group/card relative ${
                    isRun
                      ? 'border-sky-200 hover:border-sky-500 hover:ring-2 hover:ring-sky-200'
                      : 'border-rose-200 bg-rose-50/20 hover:border-rose-400 hover:ring-2 hover:ring-rose-200'
                  }`}
                  title={`Click to view machine window and details for ${slot.machineId}`}
                >
                  <div>
                    {/* Slot Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs border bg-sky-100 text-sky-900 border-sky-300">
                          {String(slot.slotNumber).padStart(2, '0')}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectStation(slot.machineId);
                              }}
                              className="font-mono font-black text-sm text-slate-900 hover:text-sky-600 transition-colors cursor-pointer flex items-center gap-1 group/id"
                              title={`Click to link to machine ${slot.machineId}`}
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
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {slot.line} • {slot.operatorName} ({slot.operatorId})
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 bg-sky-50 text-sky-700 border-sky-200">
                        {slot.processType}
                      </span>
                    </div>

                    {/* MINI-GRAPH FOR THIS MACHINE */}
                    <div className="mt-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                        <span className="font-bold flex items-center gap-1 text-slate-700">
                          <TrendingUp className="w-3 h-3 text-sky-600" />
                          Hourly Output (07:00 - 18:00)
                        </span>
                        <span className="text-emerald-700 font-bold">Target 1,100 UPH</span>
                      </div>

                      <div className="h-24 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={slot.hourlyData}
                            margin={{ top: 4, right: 4, left: -22, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id={`fvmiSlotGrad-${slot.machineId}`}
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
                              dataKey="hourShort"
                              tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#94a3b8' }}
                              axisLine={{ stroke: '#cbd5e1' }}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                              domain={[0, 1300]}
                            />
                            <ReferenceLine
                              y={1100}
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
                                        Inspected: <strong className="text-white">{d.actualPcs} boards</strong>
                                      </div>
                                      <div className="text-emerald-400">
                                        Pass Yield: <strong>{d.yieldPercent}%</strong> ({d.passPcs} pcs)
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
                              stroke="#0284c7"
                              strokeWidth={2}
                              fill={`url(#fvmiSlotGrad-${slot.machineId})`}
                              dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                const isPassed = payload.actualPcs >= 1100;
                                return (
                                  <circle
                                    key={`dot-${payload.hourShort}`}
                                    cx={cx}
                                    cy={cy}
                                    r={2.2}
                                    fill={isPassed ? '#10b981' : '#0284c7'}
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
                        <span className="text-[9px] text-slate-400 uppercase block">Pass Yield</span>
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
                            className="bg-slate-50 p-1 rounded-md border border-slate-100 flex flex-col gap-0.5"
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
      )}
    </div>
  );
};
