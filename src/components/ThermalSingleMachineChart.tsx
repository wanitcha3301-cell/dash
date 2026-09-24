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
  Wind,
  Flame,
  Thermometer,
  Gauge,
  Activity,
  Clock,
  Layers,
  Sparkles,
  Barcode,
  Edit3,
  Sliders,
  Check,
  X,
  ChevronRight,
  Maximize2,
  Wrench,
  AlertTriangle,
  RotateCcw,
  Radio,
  ScanLine,
  Camera,
  Eye
} from 'lucide-react';
import { OvenUnit } from '../types';
import {
  OVEN_SHIFT_HOURS,
  computeOvenHourlyData,
  OvenHourlySlot
} from '../utils/ovenChartUtils';
import {
  getMachineRunSummary,
  getHourlyModelDetails,
  MachineRunSummary
} from '../data/machineModelData';
import { MachineModelDrilldownModal } from './MachineModelDrilldownModal';
import { MachineLotTraceabilityInlineSection } from './MachineLotTraceabilityInlineSection';

interface ThermalSingleMachineChartProps {
  processType: 'Vacuum' | 'Bake' | 'Thermal-All' | 'FVMI' | 'AOI' | 'X-ray';
  unit: OvenUnit;
  allUnits?: OvenUnit[];
  onSelectUnit?: (id: string) => void;
  onBackToFleet?: () => void;
  openTraceabilityModal?: (id: string) => void;
  onOpenEdit?: (unit: OvenUnit) => void;
  onToggleStatus?: (unitId: string, newStatus: 'RUNNING' | 'STOP') => void;
}

export const ThermalSingleMachineChart: React.FC<ThermalSingleMachineChartProps> = ({
  processType,
  unit,
  allUnits = [],
  onSelectUnit,
  onBackToFleet,
  openTraceabilityModal,
  onOpenEdit,
  onToggleStatus
}) => {
  const [viewUnit, setViewUnit] = useState<'boards' | 'magazines'>('boards');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area'); // Defaults to 'area' (Line chart) as requested!
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [selectedSlotForLotModal, setSelectedSlotForLotModal] = useState<MachineRunSummary | null>(null);

  // Compute hourly data for this machine
  const hourlySlots = useMemo(() => {
    return computeOvenHourlyData(unit);
  }, [unit]);

  const machineSummary = useMemo(() => {
    return getMachineRunSummary(unit.id, unit.name, processType);
  }, [unit, processType]);

  // Hourly dataset formatted for Recharts
  const hourlyChartData = useMemo(() => {
    return hourlySlots.map((slot, index) => {
      const modelDetail = getHourlyModelDetails(machineSummary, slot.hour);
      const actualVal = viewUnit === 'magazines' ? slot.magazinesPerHour : slot.totalUph;
      const targetVal = viewUnit === 'magazines' ? slot.targetMagazinesPerHour : slot.targetUph;
      const isHigh = actualVal >= targetVal;

      return {
        hourShort: slot.hour,
        hour: slot.hour,
        timeRange: slot.timeRange,
        actualPcs: slot.totalUph,
        targetPcs: slot.targetUph,
        actualMag: slot.magazinesPerHour,
        targetMag: slot.targetMagazinesPerHour,
        actualVal,
        targetVal,
        efficiencyPercent: slot.efficiencyPercent,
        isHigh,
        modelId: modelDetail?.modelId || unit.runningModel || '504-2187',
        modelName: modelDetail?.modelName || `Model ${unit.runningModel || '504-2187'}`,
        recipe: unit.program || 'STANDARD-RECIPE-01',
        isCurrent: slot.isCurrent
      };
    });
  }, [hourlySlots, machineSummary, unit, viewUnit]);

  // Dynamic Y-axis maximum
  const yAxisMax = useMemo(() => {
    const maxVal = Math.max(...hourlyChartData.map((d) => d.actualVal), 1);
    if (viewUnit === 'magazines') {
      return Math.max(10, Math.ceil(maxVal * 1.3));
    }
    return Math.max(100, Math.ceil(maxVal * 1.25));
  }, [hourlyChartData, viewUnit]);

  // Target reference
  const currentTargetRef = useMemo(() => {
    return viewUnit === 'magazines'
      ? hourlyChartData[0]?.targetMag || 6
      : hourlyChartData[0]?.targetPcs || 360;
  }, [hourlyChartData, viewUnit]);

  const totalActual = useMemo(() => {
    return hourlyChartData.reduce((acc, d) => acc + d.actualVal, 0);
  }, [hourlyChartData]);

  const totalTarget = useMemo(() => {
    return hourlyChartData.reduce((acc, d) => acc + d.targetVal, 0);
  }, [hourlyChartData]);

  const currentUPH = useMemo(() => {
    const current = hourlyChartData.find((d) => d.isCurrent) || hourlyChartData[hourlyChartData.length - 1];
    return current ? current.actualVal : 0;
  }, [hourlyChartData]);

  const isRunning = unit.status === 'RUNNING';

  // Active point for the card
  const activeHourlyPoint = useMemo(() => {
    if (selectedHour) {
      const match = hourlyChartData.find((d) => d.hourShort === selectedHour);
      if (match) return match;
    }
    return hourlyChartData[hourlyChartData.length - 1] || hourlyChartData[0];
  }, [hourlyChartData, selectedHour]);

  const formatRemaining = (totalSecs: number) => {
    if (totalSecs <= 0) return '00m 00s';
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const isVacuum = processType === 'Vacuum';
  const isAOI = processType === 'AOI';
  const isXray = processType === 'X-ray';
  const isFVMI = processType === 'FVMI';

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. STANDARDIZED SINGLE MACHINE GRAPH CARD (MATCHING DISPENSING)           */}
      {/* ========================================================================= */}
      <div
        id={`${processType.toLowerCase()}-machine-chart-${unit.id}`}
        className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-sky-500 p-4.5 sm:p-5 shadow-xs space-y-4"
      >
        {/* Machine Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 shadow-2xs">
              {isVacuum ? (
                <Wind className="w-5 h-5" />
              ) : isAOI ? (
                <ScanLine className="w-5 h-5" />
              ) : isXray ? (
                <Radio className="w-5 h-5" />
              ) : isFVMI ? (
                <Camera className="w-5 h-5" />
              ) : (
                <Flame className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-sans">
                  {unit.name}
                </h3>
                <span className="text-[11px] font-mono font-bold text-sky-900 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-md">
                  {unit.chamberLabel ||
                    (isVacuum
                      ? 'Vacuum Degas'
                      : isAOI
                      ? '3D Optical AOI'
                      : isXray
                      ? 'Micro-Focus NDT'
                      : isFVMI
                      ? '25MP Telecentric'
                      : 'Curing Oven')}
                </span>
                <button
                  onClick={() => onToggleStatus && onToggleStatus(unit.id, isRunning ? 'STOP' : 'RUNNING')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                    isRunning
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                  }`}
                  title="Click to toggle machine RUNNING / STOP"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span>{unit.status}</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Model: <strong className="text-slate-800 font-mono">{unit.runningModel || '504-2187'}</strong>
                {' • '}Recipe: <span className="font-mono text-slate-600">{unit.program || 'RECIPE-STD'}</span>
                {' • '}Operator: <span className="font-mono text-slate-600">{unit.operatorId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenEdit && (
              <button
                onClick={() => onOpenEdit(unit)}
                className="px-3 py-1.5 rounded-xl font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs shadow-2xs"
                title="Edit Machine Parameters"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>แก้ไขพารามิเตอร์</span>
              </button>
            )}

            <button
              onClick={() => setSelectedSlotForLotModal(machineSummary)}
              className="px-3 py-1.5 rounded-xl font-bold bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200 transition-all cursor-pointer flex items-center gap-1.5 text-xs shadow-2xs"
              title="ดู Lot และ Model Details"
            >
              <Maximize2 className="w-3.5 h-3.5 text-sky-700" />
              <span>ดู Lot & Model Run</span>
            </button>

            {onBackToFleet && (
              <button
                onClick={onBackToFleet}
                className="px-3 py-1.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-1.5 text-xs shadow-2xs"
              >
                <span>← กลับหน้ากราฟรวม</span>
              </button>
            )}
          </div>
        </div>

        {/* Operational KPI Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Shift Output
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="font-mono font-black text-xl text-slate-900">
                {totalActual.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {viewUnit === 'boards' ? 'boards' : 'mag'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Target: {totalTarget.toLocaleString()} {viewUnit === 'boards' ? 'boards' : 'mag'}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Shift Efficiency
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className={`font-mono font-black text-xl ${totalActual >= totalTarget * 0.85 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : 100}%
              </span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">
              Input: {(unit.pcsCount || 1200).toLocaleString()} boards
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Real-time Machine UPH
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span
                className={`font-mono font-black text-xl ${
                  currentUPH >= currentTargetRef * 0.85 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {currentUPH.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / {currentTargetRef.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {currentUPH >= currentTargetRef ? '✓ Met Target' : '⚠ Below Target Speed'}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {isVacuum ? 'Chamber Status' : 'Oven Status'}
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
                {unit.id}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              {unit.operatorId}
            </div>
          </div>
        </div>

        {/* Target Benchmark & Visual Legend Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-500 px-1">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-600" />
            <span>
              Target Line: {viewUnit === 'magazines' ? `${currentTargetRef} Mag/h` : `${currentTargetRef.toLocaleString()} Boards/h`}
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

            {/* Unit Toggle: Boards vs Magazines */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-xs font-mono font-bold">
              <button
                onClick={() => setViewUnit('boards')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  viewUnit === 'boards'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Boards
              </button>
              <button
                onClick={() => setViewUnit('magazines')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  viewUnit === 'magazines'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mag
              </button>
            </div>
          </div>
        </div>

        {/* The Main Single Machine Hourly Chart (Area Chart by default, or Bar Chart) */}
        <div className="h-64 w-full pt-1 relative">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={hourlyChartData}
                margin={{ top: 12, right: 15, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const clicked = e.activePayload[0].payload;
                    setSelectedHour(clicked.hourShort);
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
                />
                <Tooltip
                  cursor={{ fill: 'rgba(2, 132, 199, 0.08)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl font-mono shadow-2xl border border-slate-700/90 text-xs min-w-[200px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                          <span className="font-bold text-sky-400">{data.timeRange}</span>
                          <span className={`font-bold ${data.isHigh ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {data.efficiencyPercent}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Output:</span>
                          <strong className="text-white font-bold">
                            {data.actualVal} {viewUnit === 'boards' ? 'boards' : 'mag'}
                          </strong>
                        </div>
                        <div className="text-[10px] text-slate-300 pt-1 border-t border-slate-800">
                          Model: {data.modelName}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="actualVal"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                >
                  {hourlyChartData.map((entry) => {
                    const isSelected = selectedHour === entry.hourShort;
                    const fillColor = isSelected
                      ? '#0369a1'
                      : entry.isHigh
                      ? '#059669'
                      : '#f59e0b';
                    return (
                      <Cell
                        key={`cell-${entry.hourShort}`}
                        fill={fillColor}
                        stroke={isSelected ? '#082f49' : 'none'}
                        strokeWidth={isSelected ? 1.5 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            ) : (
              /* DEFAULT: AREA / LINE CHART (as requested: "เป็นกราฟเส้นเหมือนเดิม") */
              <AreaChart
                data={hourlyChartData}
                margin={{ top: 12, right: 15, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const clicked = e.activePayload[0].payload;
                    setSelectedHour(clicked.hourShort);
                  }
                }}
              >
                <defs>
                  <linearGradient id="thermalSingleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity={0.25} />
                    <stop offset="70%" stopColor="#0284c7" stopOpacity={0.05} />
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
                    value: `Target: ${currentTargetRef.toLocaleString()}`,
                    position: 'insideTopRight',
                    fill: '#059669',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                />
                <Tooltip
                  cursor={{ stroke: '#0284c7', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl font-mono shadow-2xl border border-slate-700/90 text-xs min-w-[210px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                          <span className="font-bold text-sky-400">{data.timeRange}</span>
                          <span className={`font-bold ${data.isHigh ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {data.efficiencyPercent}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Output:</span>
                          <strong className="text-white font-bold">
                            {data.actualVal} {viewUnit === 'boards' ? 'boards' : 'mag'}
                          </strong>
                        </div>
                        <div className="text-[10px] text-slate-300 pt-1 border-t border-slate-800">
                          Model: {data.modelName}
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="actualVal"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fill="url(#thermalSingleAreaGrad)"
                  cursor="pointer"
                  dot={(props: any) => {
                    const isSelected = selectedHour === props.payload.hourShort;
                    const isHigh = props.payload.isHigh;
                    const dotColor = isSelected ? '#0369a1' : isHigh ? '#059669' : '#f59e0b';
                    const dotRadius = isSelected ? 6.5 : 4.5;

                    return (
                      <circle
                        key={`dot-${props.payload.hourShort}`}
                        cx={props.cx}
                        cy={props.cy}
                        r={dotRadius}
                        fill={dotColor}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="cursor-pointer transition-all hover:scale-130"
                      />
                    );
                  }}
                  activeDot={{
                    r: 8,
                    stroke: '#0369a1',
                    strokeWidth: 3,
                    fill: '#ffffff',
                    cursor: 'pointer'
                  }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>



        {/* ========================================================================= */}
        {/* INLINE LOT & TRACEABILITY DETAILS (แสดงใต้กราฟเส้นเลยโดยไม่ต้องกดไป)        */}
        {/* ========================================================================= */}
        <div className="pt-2">
          <MachineLotTraceabilityInlineSection
            machineSummary={machineSummary}
            selectedHour={selectedHour}
            onClearHourFilter={() => setSelectedHour(null)}
            viewUnit={viewUnit}
            openTraceabilityModal={openTraceabilityModal}
            processType={processType}
          />
        </div>

        {/* ========================================================================= */}
        {/* 2. LIVE TELEMETRY SENSORS STRIP (FOCUSED & CLEAN)                         */}
        {/* ========================================================================= */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-600" />
              <span>
                {isVacuum
                  ? 'Chamber Live Telemetry'
                  : isAOI
                  ? 'AOI Optical Telemetry & Defect Sensors'
                  : isXray
                  ? 'X-Ray NDT Radiography Telemetry'
                  : isFVMI
                  ? 'FVMI 25MP Optical Inspection Telemetry'
                  : 'Oven Multi-Zone Telemetry'}
              </span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>ACTIVE SENSORS</span>
            </span>
          </div>

          {isAOI ? (
            /* AOI OPTICAL TELEMETRY CARDS */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  OPTICAL YIELD
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-emerald-700">
                    {unit.yieldPercent || 99.8}%
                  </span>
                </div>
                <div className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                  ✓ Target ≥ 99.5%
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  3D ZENITH CAMERA
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    ACTIVE
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Top 25µm Moire Res
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  CYCLE TIME
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-sky-950">
                    2.4
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">sec/board</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Speed Stable
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  SOLDER BRIDGE
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-emerald-700">
                    0
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">pcs</span>
                </div>
                <div className="text-[9px] text-emerald-700 mt-0.5">
                  Zero Bridge Defect
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  MISSING COMPONENT
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-emerald-700">
                    0
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">pcs</span>
                </div>
                <div className="text-[9px] text-emerald-700 mt-0.5">
                  Pass 100%
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  ILLUMINATION RING
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    RGB+W
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Coaxial Calibrated
                </div>
              </div>
            </div>
          ) : isXray ? (
            /* X-RAY NDT RADIOGRAPHY TELEMETRY CARDS */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  BGA VOID RATIO
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-sky-950">
                    {unit.voidPercent || 2.1}%
                  </span>
                </div>
                <div className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                  ✓ Max Spec &lt; 15.0%
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  TUBE VOLTAGE
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    {unit.tubeKv || 90}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">kV</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Target: 90 kV (Micro-Focus)
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  FILAMENT CURRENT
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    {unit.filamentMicroAmp || 120}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">µA</span>
                </div>
                <div className="text-[9px] text-emerald-700 mt-0.5">
                  Stable Emission
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  FLAT PANEL DETECTOR
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    24.2
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">°C</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Cooled Sensor OK
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  INTERLOCK / SHIELD
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-emerald-700">
                    SAFE
                  </span>
                </div>
                <div className="text-[9px] text-emerald-700 mt-0.5">
                  &lt; 0.05 µSv/h (Zero Leak)
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  INSPECTION RECIPE
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-base text-slate-900 truncate">
                    {unit.program || 'NDT-90KV'}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  BGA Void Algorithm v4.2
                </div>
              </div>
            </div>
          ) : isFVMI ? (
            /* FVMI 25MP OPTICAL TELEMETRY CARDS */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  OPTICAL PASS RATE
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-emerald-700">
                    {unit.yieldPercent || 99.85}%
                  </span>
                </div>
                <div className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                  ✓ High Quality Class A
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  TOP 25MP CAMERA
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    ACTIVE
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Telecentric 0.05x Lens
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  SIDE CAMERAS
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    4x 45°
                  </span>
                </div>
                <div className="text-[9px] text-emerald-700 mt-0.5">
                  Multi-Angle Sync OK
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  COAXIAL LIGHT
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-sky-950">
                    8,500
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Lux</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Target: 8,500 Lux (Calibrated)
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  EXPOSURE TIME
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    120
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">µs</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  High-Speed Strobe
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  DUST / PARTICLE
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-emerald-700">
                    SAFE
                  </span>
                </div>
                <div className="text-[9px] text-emerald-700 mt-0.5">
                  ISO Class 6 Enclosure
                </div>
              </div>
            </div>
          ) : isVacuum ? (
            /* VACUUM CHAMBER TELEMETRY CARDS */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              {/* Pressure */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  VACUUM PRESSURE
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-sky-950">
                    {unit.pressurePa !== undefined ? unit.pressurePa : 0.45}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Pa</span>
                </div>
                <div className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                  ✓ High Vacuum OK
                </div>
              </div>

              {/* Temperature */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  CHAMBER TEMP
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    {unit.tempCelsius !== undefined ? unit.tempCelsius : 180.2}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">°C</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Target: 180.0°C (±2)
                </div>
              </div>

              {/* Step */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  STEP PROFILE
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    {unit.stepCurrent || 3} / {unit.stepTotal || 4}
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">
                  Thermal Soak Phase
                </div>
              </div>

              {/* Remaining Time */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  CYCLE REMAINING
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-sky-900">
                    {formatRemaining(unit.remainingSeconds || 745)}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Total: 25 mins
                </div>
              </div>

              {/* Vacuum Pump */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  VACUUM PUMP
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-emerald-700">
                    ACTIVE
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Turbomolecular ON
                </div>
              </div>

              {/* Magazines */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  MAGAZINES IN CHBR
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    {unit.magazinesCount || 4}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">mags</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Cap: 6 Magazines
                </div>
              </div>
            </div>
          ) : (
            /* BAKE MULTI-ZONE OVEN TELEMETRY CARDS */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              {/* Zone 1 */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  ZONE 1 (PREHEAT)
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    {unit.tempCelsius ? (unit.tempCelsius - 30).toFixed(1) : '150.0'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">°C</span>
                </div>
                <div className="text-[9px] text-emerald-700 mt-0.5">
                  Target: 150°C
                </div>
              </div>

              {/* Zone 2 */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  ZONE 2 (RAMP)
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    {unit.tempCelsius ? (unit.tempCelsius - 10).toFixed(1) : '170.0'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">°C</span>
                </div>
                <div className="text-[9px] text-emerald-700 mt-0.5">
                  Target: 170°C
                </div>
              </div>

              {/* Zone 3 */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  ZONE 3 (SOAK/PEAK)
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-sky-950">
                    {unit.tempCelsius !== undefined ? unit.tempCelsius : 180.0}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">°C</span>
                </div>
                <div className="text-[9px] text-emerald-700 mt-0.5">
                  Target: 180°C
                </div>
              </div>

              {/* Zone 4 */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  ZONE 4 (COOLING)
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    {unit.tempCelsius ? (unit.tempCelsius - 45).toFixed(1) : '135.0'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">°C</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Target: 135°C
                </div>
              </div>

              {/* Conveyor Speed */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  CONVEYOR SPEED
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-slate-900">
                    750
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">mm/min</span>
                </div>
                <div className="text-[9px] text-emerald-700 mt-0.5">
                  Speed Stable
                </div>
              </div>

              {/* Heater Status */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  HEATER STATUS
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-mono font-black text-lg text-emerald-700">
                    CLOSED-LOOP
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  PID Auto 68% Load
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Downtime Alert if any */}
        {unit.downtimeReason && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between border ${
              unit.status !== 'RUNNING'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>สาเหตุหยุดเครื่อง: {unit.downtimeReason}</span>
            </div>
            <span className="font-mono font-semibold">
              {unit.downtimeDurationMins || 25}m downtime
            </span>
          </div>
        )}
      </div>

      {/* Lot / Workpiece Traceability Modal */}
      {selectedSlotForLotModal && (
        <MachineModelDrilldownModal
          machineData={selectedSlotForLotModal}
          isOpen={true}
          onClose={() => setSelectedSlotForLotModal(null)}
          onOpenTraceability={openTraceabilityModal}
        />
      )}
    </div>
  );
};
