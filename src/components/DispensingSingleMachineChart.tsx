import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import {
  Cpu,
  Layers,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Activity,
  BarChart3,
  Maximize2,
  ExternalLink,
  Wrench,
  X,
  Droplets,
  Info,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { Machine } from '../types';
import {
  DispensingMachineSlotData,
  convertSlotToRunSummary
} from '../data/dispensingFleetData';
import { MachineRunSummary } from '../data/machineModelData';
import {
  computeModelRangesForMachine,
  ModelRangeSummary
} from '../utils/ovenModelRangeUtils';
import { MachineModelDrilldownModal } from './MachineModelDrilldownModal';
import { MachineLotTraceabilityInlineSection } from './MachineLotTraceabilityInlineSection';

interface DispensingSingleMachineChartProps {
  machine: Machine;
  slotData: DispensingMachineSlotData;
  allMachines?: Machine[];
  onSelectMachine?: (id: string) => void;
  onBackToFleet?: () => void;
  onOpenDrilldown?: (summary: MachineRunSummary) => void;
  openTraceabilityModal?: (id: string) => void;
}

export const DispensingSingleMachineChart: React.FC<DispensingSingleMachineChartProps> = ({
  machine,
  slotData,
  allMachines = [],
  onSelectMachine,
  onBackToFleet,
  onOpenDrilldown,
  openTraceabilityModal
}) => {
  const [viewUnit, setViewUnit] = useState<'boards' | 'magazines'>('boards');
  const [showModelRange, setShowModelRange] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [selectedHourlyPoint, setSelectedHourlyPoint] = useState<{
    hour: string;
    modelId?: string;
    modelName?: string;
  } | null>(null);
  const [showDowntimeDiagnostics, setShowDowntimeDiagnostics] = useState<boolean>(false);
  const [localLotModalSummary, setLocalLotModalSummary] = useState<MachineRunSummary | null>(null);

  // Convert slot to machine run summary
  const machineSummary = useMemo(() => {
    return convertSlotToRunSummary(slotData);
  }, [slotData]);

  // Compute model ranges (model, time range, total output, share)
  const modelRanges = useMemo(() => {
    return computeModelRangesForMachine(machineSummary);
  }, [machineSummary]);

  // Hourly dataset formatted for Recharts
  const hourlyChartData = useMemo(() => {
    return slotData.hourlyData.map((h, idx) => {
      // Find model active in this hour
      const activeRange = modelRanges.find((mr) => mr.activeHours.includes(h.hourShort)) || modelRanges[0];
      const actualVal = viewUnit === 'magazines' ? Math.round(h.actualPcs / 60) || 1 : h.actualPcs;
      const targetVal = viewUnit === 'magazines' ? 2 : h.targetPcs;
      const isHigh = actualVal >= targetVal;

      return {
        hourShort: h.hourShort,
        hour: h.hour,
        timeRange: h.hour,
        actualPcs: h.actualPcs,
        targetPcs: h.targetPcs,
        actualMag: Math.round(h.actualPcs / 60),
        targetMag: 2,
        actualVal,
        targetVal,
        efficiencyPercent: h.efficiencyPercent,
        isHigh,
        modelId: activeRange?.modelId || slotData.topModel.modelId,
        modelName: activeRange?.modelName || slotData.topModel.modelName,
        recipe: `RECIPE-${slotData.processType.toUpperCase().replace(' ', '')}-${activeRange?.modelId || slotData.topModel.modelId}`
      };
    });
  }, [slotData, modelRanges, viewUnit]);

  // Calculate dynamic Y-axis maximum
  const yAxisMax = useMemo(() => {
    const maxVal = Math.max(...hourlyChartData.map((d) => d.actualVal), 1);
    if (viewUnit === 'magazines') {
      return Math.max(4, Math.ceil(maxVal * 1.3));
    }
    return Math.max(140, Math.ceil(maxVal * 1.25));
  }, [hourlyChartData, viewUnit]);

  // Target reference
  const currentTargetRef = viewUnit === 'magazines' ? 2 : Math.round(slotData.targetUph / 10.5);

  const isRunning = slotData.status === 'RUNNING';
  const isTop = slotData.processType === 'Top Fill';

  const handleOpenLotDrilldown = () => {
    if (onOpenDrilldown) {
      onOpenDrilldown(machineSummary);
    } else {
      setLocalLotModalSummary(machineSummary);
    }
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. STANDARDIZED SINGLE MACHINE GRAPH CARD (MATCHING OTHER FLEETS)         */}
      {/* ========================================================================= */}
      <div
        id={`dispensing-machine-chart-${slotData.machineId}`}
        className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-sky-500 p-4.5 sm:p-5 shadow-xs space-y-4"
      >
        {/* Machine Header & Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 shadow-2xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-mono">
                  {slotData.name.toUpperCase()} OUTPUT & PROCESS TELEMETRY
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-950 border border-sky-300">
                  {slotData.machineId} • {slotData.processType}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    isRunning
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  {isRunning ? 'RUNNING' : 'STOP'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                Production output, running models, and telemetry status for {slotData.name} • {slotData.line} • OP: {slotData.operatorId}
              </p>
            </div>
          </div>

          {/* Unit Toggle and Quick Back to Fleet Action */}
          <div className="flex flex-wrap items-center gap-2">
            {onBackToFleet && (
              <button
                onClick={onBackToFleet}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>← View All Fleet</span>
              </button>
            )}

            {/* Unit Toggle: Magazines vs Boards (matching OvenFleetCombinedChart) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-300 text-xs font-bold font-mono">
              <button
                onClick={() => setViewUnit('magazines')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewUnit === 'magazines'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Magazines (Mag)
              </button>
              <button
                onClick={() => setViewUnit('boards')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewUnit === 'boards'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Boards (Pcs)
              </button>
            </div>
          </div>
        </div>

        {/* 4 Standard Operational KPI Cards Strip (Matching Other Fleets) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {viewUnit === 'magazines' ? 'Magazines Processed' : 'Total Output (Boards)'}
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="font-mono font-black text-xl text-slate-900">
                {viewUnit === 'magazines'
                  ? Math.round(slotData.totalOutput / 60)
                  : slotData.totalOutput.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {viewUnit === 'magazines' ? 'magazines' : 'boards'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {viewUnit === 'magazines'
                ? `(${slotData.totalOutput.toLocaleString()} boards)`
                : `(${Math.round(slotData.totalOutput / 60)} magazines)`}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Machine Yield Rate
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="font-mono font-black text-xl text-emerald-700">
                {slotData.yieldRate}%
              </span>
              <span className="text-xs text-slate-500 font-mono">passed</span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">
              Input: {machine.inputCount.toLocaleString()} boards
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Real-time Machine UPH
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span
                className={`font-mono font-black text-xl ${
                  slotData.uph >= slotData.targetUph * 0.85
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}
              >
                {slotData.uph.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / {slotData.targetUph.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {slotData.uph >= slotData.targetUph ? '✓ Met Target' : '⚠ Below Target Speed'}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Active Dispenser Status
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span
                className={`font-mono font-black text-xl ${
                  isRunning ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {isRunning ? 'ONLINE' : 'STOPPED'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {slotData.processType}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              {slotData.operatorId}
            </div>
          </div>
        </div>

        {/* Target Benchmark & Visual Legend Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-500 px-1">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-600" />
            <span>
              Target Line: {viewUnit === 'magazines' ? '2 Mag/h' : `${slotData.targetUph} Boards/h (${currentTargetRef} Pcs/h)`}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Pass Target (≥ Target)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Below Target (&lt; Target)</span>
            </div>
            {chartType === 'area' ? (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 bg-sky-600 rounded-full" />
                <span>Output Line</span>
              </div>
            ) : null}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0369a1] border border-white shadow-2xs" />
              <span>Selected Hour</span>
            </div>

            {/* Chart Type Toggle: Line vs Bar */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-xs">
              <button
                onClick={() => setChartType('area')}
                className={`px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                  chartType === 'area'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="ดูกราฟเส้น (Machine Line/Area Chart)"
              >
                กราฟเส้น (Line)
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-2 py-0.5 rounded font-mono font-bold transition-all cursor-pointer ${
                  chartType === 'bar'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="ดูกราฟแท่ง (Machine Bar Chart)"
              >
                กราฟแท่ง (Bar)
              </button>
            </div>
          </div>
        </div>

        {/* The Main Single Machine Hourly Chart (Bar Chart as default, or Area Chart) */}
        <div className="h-64 w-full pt-1 relative">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={hourlyChartData}
                margin={{ top: 12, right: 15, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const clicked = e.activePayload[0].payload;
                    setSelectedHourlyPoint({
                      hour: clicked.hourShort,
                      modelId: clicked.modelId,
                      modelName: clicked.modelName
                    });
                    setShowModelRange(true);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="hourShort"
                  tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  domain={[0, yAxisMax]}
                />
                <ReferenceLine
                  y={currentTargetRef}
                  stroke="#059669"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Target ${viewUnit === 'magazines' ? '2 Mag/h' : `${currentTargetRef} Pcs/h`}`,
                    position: 'insideTopRight',
                    fill: '#059669',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fontFamily: 'monospace'
                  }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(224, 242, 254, 0.4)' }}
                  wrapperStyle={{ zIndex: 60, pointerEvents: 'none', outline: 'none' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl text-[10px] font-mono shadow-2xl border border-slate-700 space-y-1.5 z-50 w-64 pointer-events-none select-none overflow-hidden">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                            <span className="font-bold flex items-center gap-1.5 text-[10.5px] text-sky-400">
                              <Clock className="w-3 h-3" />
                              <span>{data.timeRange}</span>
                            </span>
                            <span
                              className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold ${
                                data.isHigh
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                              }`}
                            >
                              {data.isHigh ? '✓ Met' : '⚠ Below'} ({data.efficiencyPercent}%)
                            </span>
                          </div>

                          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/70 space-y-0.5">
                            <div className="text-white font-bold text-[10px] truncate">
                              {data.modelName}
                            </div>
                            <div className="text-[8.5px] text-slate-400 flex items-center justify-between">
                              <span>Process: {slotData.processType}</span>
                              <span>Recipe: {data.recipe}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[9.5px]">
                            <span className="text-slate-400">Output:</span>
                            <strong className="text-emerald-400 font-bold">
                              {viewUnit === 'magazines'
                                ? `${data.actualVal} Mag (${data.actualPcs} Pcs)`
                                : `${data.actualVal.toLocaleString()} Pcs (${data.actualMag} Mag)`}
                            </strong>
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span>Target:</span>
                            <span className="text-slate-200">
                              {viewUnit === 'magazines'
                                ? `${data.targetVal} Mag/h`
                                : `${data.targetVal.toLocaleString()} Pcs/h`}
                            </span>
                          </div>

                          <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[8.5px] text-slate-400">
                            <span>Syringe Level: {slotData.syringeLevelPercent}%</span>
                            <span className="text-sky-300 font-bold">Click to view model report ↗</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="actualVal"
                  radius={[4, 4, 0, 0]}
                  animationDuration={350}
                >
                  {hourlyChartData.map((entry, index) => {
                    const isSelected = selectedHourlyPoint?.hour === entry.hourShort;
                    return (
                      <Cell
                        key={`mc-bar-cell-${index}`}
                        fill={
                          isSelected
                            ? '#0369a1' // deep navy blue when clicked
                            : entry.isHigh
                            ? '#0284c7' // clean sky blue
                            : '#f59e0b' // amber when below target
                        }
                        stroke={isSelected ? '#0c4a6e' : undefined}
                        strokeWidth={isSelected ? 2 : 0}
                        className="cursor-pointer transition-all hover:opacity-90"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart
                data={hourlyChartData}
                margin={{ top: 12, right: 15, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const clicked = e.activePayload[0].payload;
                    setSelectedHourlyPoint({
                      hour: clicked.hourShort,
                      modelId: clicked.modelId,
                      modelName: clicked.modelName
                    });
                    setShowModelRange(true);
                  }
                }}
              >
                <defs>
                  <linearGradient id={`dispensingAreaGrad-${slotData.machineId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity={0.25} />
                    <stop offset="70%" stopColor="#0284c7" stopOpacity={0.06} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.0} />
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
                  tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  domain={[0, yAxisMax]}
                />
                <ReferenceLine
                  y={currentTargetRef}
                  stroke="#059669"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Target ${viewUnit === 'magazines' ? '2 Mag/h' : `${currentTargetRef} Pcs/h`}`,
                    position: 'insideTopRight',
                    fill: '#059669',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fontFamily: 'monospace'
                  }}
                />
                <Tooltip
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                  wrapperStyle={{ zIndex: 60, pointerEvents: 'none', outline: 'none' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl text-[10px] font-mono shadow-2xl border border-slate-700 space-y-1.5 z-50 w-64 pointer-events-none select-none overflow-hidden">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                            <span className="font-bold flex items-center gap-1.5 text-[10.5px] text-sky-400">
                              <Clock className="w-3 h-3" />
                              <span>{data.timeRange}</span>
                            </span>
                            <span
                              className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold ${
                                data.isHigh
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                              }`}
                            >
                              {data.isHigh ? '✓ Met' : '⚠ Below'} ({data.efficiencyPercent}%)
                            </span>
                          </div>

                          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/70 space-y-0.5">
                            <div className="text-white font-bold text-[10px] truncate">
                              {data.modelName}
                            </div>
                            <div className="text-[8.5px] text-slate-400 flex items-center justify-between">
                              <span>Process: {slotData.processType}</span>
                              <span>Recipe: {data.recipe}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[9.5px]">
                            <span className="text-slate-400">Output:</span>
                            <strong className="text-emerald-400 font-bold">
                              {viewUnit === 'magazines'
                                ? `${data.actualVal} Mag (${data.actualPcs} Pcs)`
                                : `${data.actualVal.toLocaleString()} Pcs (${data.actualMag} Mag)`}
                            </strong>
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span>Target:</span>
                            <span className="text-slate-200">
                              {viewUnit === 'magazines'
                                ? `${data.targetVal} Mag/h`
                                : `${data.targetVal.toLocaleString()} Pcs/h`}
                            </span>
                          </div>

                          <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[8.5px] text-slate-400">
                            <span>Syringe Level: {slotData.syringeLevelPercent}%</span>
                            <span className="text-sky-300 font-bold">Click to view model report ↗</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="actualVal"
                  name={viewUnit === 'magazines' ? 'Magazines' : 'Boards (UPH)'}
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fill={`url(#dispensingAreaGrad-${slotData.machineId})`}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const isHigh = payload.isHigh;
                    const isSelected = selectedHourlyPoint?.hour === payload.hourShort;
                    return (
                      <circle
                        key={`disp-dot-${payload.hourShort}`}
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 6.5 : 4.5}
                        fill={isSelected ? '#0284c7' : isHigh ? '#059669' : '#f59e0b'}
                        stroke={isSelected ? '#ffffff' : isHigh ? '#047857' : '#b45309'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="cursor-pointer transition-all hover:scale-125"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          setSelectedHourlyPoint({
                            hour: payload.hourShort,
                            modelId: payload.modelId,
                            modelName: payload.modelName
                          });
                          setShowModelRange(true);
                        }}
                      />
                    );
                  }}
                  activeDot={{
                    r: 7,
                    stroke: '#0284c7',
                    strokeWidth: 2,
                    fill: '#ffffff',
                    cursor: 'pointer',
                    onClick: (e: any, payload: any) => {
                      if (payload?.payload) {
                        setSelectedHourlyPoint({
                          hour: payload.payload.hourShort,
                          modelId: payload.payload.modelId,
                          modelName: payload.payload.modelName
                        });
                        setShowModelRange(true);
                      }
                    }
                  }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* ===================================================================== */}
        {/* INLINE LOT & TRACEABILITY DETAILS (แสดงใต้กราฟเส้นเลยโดยไม่ต้องกดไป)   */}
        {/* ===================================================================== */}
        <div className="pt-2">
          <MachineLotTraceabilityInlineSection
            machineSummary={machineSummary}
            selectedHour={selectedHourlyPoint?.hour}
            onClearHourFilter={() => setSelectedHourlyPoint(null)}
            viewUnit={viewUnit}
            openTraceabilityModal={openTraceabilityModal}
            processType="Dispensing"
          />
        </div>

        {/* ===================================================================== */}
        {/* 2. PRODUCTION RANGE REPORT (MATCHING OTHER FLEETS)                    */}
        {/* ===================================================================== */}
        <div className="mt-4 pt-4 border-t border-sky-100 space-y-4 font-mono">
          {!showModelRange ? (
            <div className="p-4 bg-linear-to-r from-sky-50 via-white to-sky-50 rounded-2xl border border-sky-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 shrink-0 shadow-2xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm font-mono">
                      Production Range Report — {slotData.name}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-950 border border-sky-200 font-mono">
                      {modelRanges.length} Models
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    Model distribution, timeline ranges, total output, and proportions
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModelRange(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-102 shrink-0"
              >
                <Layers className="w-4 h-4" />
                <span>Open Production Report ({modelRanges.length} Models) ↗</span>
              </button>
            </div>
          ) : (
            /* Expanded Production Range View - Showing: Model, Timeline, Total Output, Share */
            <div className="bg-white rounded-2xl border border-sky-300 p-4 sm:p-5 shadow-xs space-y-4 ring-1 ring-sky-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wider">
                        Production Range Report — {slotData.name}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                        {modelRanges.length} Models
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Model distribution, timeline ranges, total output, and proportions
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedHourlyPoint && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-300 rounded-lg text-xs font-mono">
                      <span className="text-sky-950 font-bold">📍 Hour {selectedHourlyPoint.hour}</span>
                      <button
                        onClick={() => setSelectedHourlyPoint(null)}
                        className="text-slate-400 hover:text-rose-600 font-bold ml-1 text-xs cursor-pointer"
                        title="Clear time filter"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleOpenLotDrilldown}
                    className="px-3 py-1.5 text-xs font-mono font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>View All Batch History ↗</span>
                  </button>

                  <button
                    onClick={() => setShowModelRange(false)}
                    className="px-3 py-1.5 text-xs font-mono font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>▲ Hide Report</span>
                  </button>
                </div>
              </div>

              {/* Table showing: Model, Timeline, Total Output, Share */}
              <div className="overflow-x-auto rounded-xl border border-sky-200 bg-slate-50/50">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-sky-100/70 border-b border-sky-200 text-sky-950 uppercase text-[11px]">
                      <th className="py-3 px-4">Model</th>
                      <th className="py-3 px-4">Timeline</th>
                      <th className="py-3 px-4">Total Output</th>
                      <th className="py-3 px-4">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {modelRanges.map((mr) => {
                      const isHighlighted = selectedHourlyPoint?.modelId === mr.modelId;
                      const isHighest = mr.volumeRank === 'highest';

                      return (
                        <tr
                          key={mr.modelId}
                          onClick={handleOpenLotDrilldown}
                          className={`transition-colors cursor-pointer ${
                            isHighlighted
                              ? 'bg-sky-50 font-bold ring-1 ring-sky-300'
                              : 'hover:bg-sky-50/60'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                              {isHighlighted && <span className="text-sky-600 text-xs">📍</span>}
                              {isHighest && <Award className="w-4 h-4 text-amber-500 shrink-0" />}
                              <span>{mr.modelName}</span>
                              {isHighest && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                  👑 Top Volume
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-normal">
                              {mr.category} • Recipe: RECIPE-{slotData.processType.toUpperCase().replace(' ', '')}-{mr.modelId}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-800 text-xs">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {mr.activeTimeRange}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            <div className="text-sm text-sky-950 font-bold">
                              {viewUnit === 'magazines'
                                ? `${mr.totalMagazines} Magazines`
                                : `${mr.totalPcs.toLocaleString()} Boards`}
                            </div>
                            <span className="text-[10px] font-normal text-slate-500">
                              {viewUnit === 'magazines'
                                ? `(${mr.totalPcs.toLocaleString()} Boards)`
                                : `(${mr.totalMagazines} Magazines)`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5 max-w-[220px]">
                              <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${mr.percentage}%` }}
                                  className={`h-full rounded-full ${
                                    isHighest ? 'bg-amber-500' : 'bg-sky-600'
                                  }`}
                                />
                              </div>
                              <span className="font-bold text-slate-900 text-xs min-w-[38px] text-right">
                                {mr.percentage}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lot / Batch Drilldown Modal */}
      {localLotModalSummary && (
        <MachineModelDrilldownModal
          isOpen={true}
          onClose={() => setLocalLotModalSummary(null)}
          machineData={localLotModalSummary}
          onOpenTraceability={openTraceabilityModal}
        />
      )}
    </div>
  );
};
