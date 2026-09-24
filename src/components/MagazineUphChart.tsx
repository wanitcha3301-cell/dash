import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  Sparkles,
  Zap,
  Activity,
  Gauge,
  Thermometer,
  Boxes,
  Info,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { DowntimeHistoryItem, MachineStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

export interface HourlyMagazineRecord {
  hour: string; // e.g. '08:00'
  timeRange: string; // e.g. '08:00 - 09:00'
  magazinesPerHour: number;
  targetMagazinesPerHour: number;
  unitsPerMagazine: number;
  totalUph: number;
  targetUph: number;
  efficiencyPercent: number;
  isCurrent?: boolean;
  isLow: boolean;
  downtimeMins: number;
  downtimeReason: string;
  downtimeCategory: 'ME' | 'OP' | 'QUALITY' | 'PROCESS' | 'NORMAL';
  actionTaken: string;
  batchCount: number; // e.g. 2 batches in that hour
  magazinesPerBatch: number;
  batchCycleTimeMins: number;
}

interface MagazineUphChartProps {
  machineId?: string;
  machineName?: string;
  chamberType?: 'Vacuum' | 'Bake';
  currentMagazinesCount?: number;
  runningModel?: string;
  status?: MachineStatus;
  downtimeReason?: string;
  downtimeDurationMins?: number;
  downtimeHistory?: DowntimeHistoryItem[];
  colorTheme?: 'emerald' | 'amber' | 'sky' | 'purple';
  showCardWrapper?: boolean;
  title?: string;
  onHourSelect?: (record: HourlyMagazineRecord) => void;
}

// Standard 10-hour shift schedule
const SHIFT_HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

// Mapping model to pieces per magazine
export const MODEL_MAGAZINE_SPECS: Record<string, { unitsPerMag: number; standardBatchMags: number; cycleMins: number }> = {
  '504-2187': { unitsPerMag: 60, standardBatchMags: 4, cycleMins: 25 },
  '504-2268': { unitsPerMag: 50, standardBatchMags: 2, cycleMins: 20 },
  '504-2154': { unitsPerMag: 80, standardBatchMags: 5, cycleMins: 30 },
  '504-2224': { unitsPerMag: 65, standardBatchMags: 3, cycleMins: 22 },
  '504-2454': { unitsPerMag: 100, standardBatchMags: 6, cycleMins: 35 },
  '504-2090': { unitsPerMag: 70, standardBatchMags: 4, cycleMins: 26 },
};

export const MagazineUphChart: React.FC<MagazineUphChartProps> = ({
  machineId = 'VC-01',
  machineName,
  chamberType = 'Vacuum',
  currentMagazinesCount = 4,
  runningModel = '504-2187',
  status = 'RUNNING',
  downtimeReason,
  downtimeDurationMins = 0,
  downtimeHistory = [],
  colorTheme = 'emerald',
  showCardWrapper = true,
  title,
  onHourSelect,
}) => {
  const { t } = useLanguage();
  const [selectedRecord, setSelectedRecord] = useState<HourlyMagazineRecord | null>(null);
  const [viewMode, setViewMode] = useState<'magazines' | 'units'>('magazines');

  const modelSpec = MODEL_MAGAZINE_SPECS[runningModel] || MODEL_MAGAZINE_SPECS['504-2187'];
  const unitsPerMag = modelSpec.unitsPerMag;
  const standardBatchMags = modelSpec.standardBatchMags;
  const targetMagPerHour = 6;
  const targetTotalUph = targetMagPerHour * unitsPerMag;

  const isEmerald = colorTheme === 'emerald';
  const themeColors = isEmerald
    ? {
        primary: 'emerald',
        barBg: 'bg-emerald-600',
        barBgHover: 'hover:bg-emerald-700',
        barLight: 'bg-emerald-200 border-emerald-300',
        activeRing: 'ring-2 ring-emerald-500 ring-offset-1',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        accentText: 'text-emerald-700',
        borderLeft: 'border-l-emerald-500',
      }
    : {
        primary: 'amber',
        barBg: 'bg-amber-600',
        barBgHover: 'hover:bg-amber-700',
        barLight: 'bg-amber-200 border-amber-300',
        activeRing: 'ring-2 ring-amber-500 ring-offset-1',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        accentText: 'text-amber-700',
        borderLeft: 'border-l-amber-500',
      };

  // Generate realistic magazine UPH data
  const hourlyData: HourlyMagazineRecord[] = useMemo(() => {
    const seed = machineId.split('').reduce((acc, c, idx) => acc + c.charCodeAt(0) * (idx + 1), 0);

    const DOWNTIME_PRESETS = [
      {
        reason: downtimeReason || (chamberType === 'Vacuum' ? 'Chamber Door O-Ring Seal Check' : 'Pre-heat Zone Thermal Soak Delay'),
        cat: 'PROCESS' as const,
        mins: downtimeDurationMins > 0 ? downtimeDurationMins : 15,
        action: 'Verified seal tightness and PID ramp profile tolerance.',
      },
      {
        reason: 'Magazine Buffer Infeed Loader Jam',
        cat: 'ME' as const,
        mins: 18,
        action: 'Cleared stalled magazine cassette guide, reset pneumatic pusher pin.',
      },
      {
        reason: 'Nitrogen Purge Pressure Fluctuation',
        cat: 'PROCESS' as const,
        mins: 12,
        action: 'Regulated N2 purge line regulator at 0.45 MPa.',
      },
      {
        reason: 'Shift Handover & Magazine Tray Swap',
        cat: 'OP' as const,
        mins: 20,
        action: 'Operators swapped loaded magazine lot carriers and verified barcode sheet.',
      },
    ];

    return SHIFT_HOURS.map((hour, index) => {
      const nextHour = (parseInt(hour.split(':')[0], 10) + 1).toString().padStart(2, '0') + ':00';
      const timeRange = `${hour} - ${nextHour}`;
      const isCurrent = index === 9; // Last hour is active

      // Base magazine throughput (usually 6-10 magazines per hour in realistic ovens)
      const nominalMag = targetMagPerHour;
      const variation = Math.sin(seed + index * 1.5) * 1.8;
      let magCount = Math.max(1, Math.round(nominalMag + variation));

      const isMachineStoppedNow = status === 'STOP' && isCurrent;
      const isDowntimeHour = index === (seed % 4) + 2 || index === 4;

      let dtMins = 0;
      let dtReason = 'Normal Continuous Thermal/Vacuum Run';
      let dtCategory: 'ME' | 'OP' | 'QUALITY' | 'PROCESS' | 'NORMAL' = 'NORMAL';
      let dtAction = 'All magazine carriers completed programmed soak and evacuate profile.';

      if (isMachineStoppedNow) {
        magCount = 0;
        dtMins = downtimeDurationMins > 0 ? downtimeDurationMins : 40;
        dtReason = downtimeReason || 'Emergency Line Halt / Chamber Interlock';
        dtCategory = 'ME';
        dtAction = 'Chamber in safe vent state; technician inspecting sensor line.';
      } else if (isDowntimeHour) {
        const preset = DOWNTIME_PRESETS[(seed + index) % DOWNTIME_PRESETS.length];
        dtMins = preset.mins;
        dtReason = preset.reason;
        dtCategory = preset.cat;
        dtAction = preset.action;
        const runRatio = Math.max(0.2, (60 - dtMins) / 60);
        magCount = Math.max(1, Math.round(nominalMag * runRatio));
      }

      // Check matched downtime history
      const matchedHistory = downtimeHistory.find((dh) => dh.timeRange.includes(hour.slice(0, 2)));
      if (matchedHistory) {
        dtReason = matchedHistory.reason;
        dtMins = matchedHistory.durationMins;
        dtCategory = matchedHistory.category as any;
        dtAction = `Logged root cause: ${matchedHistory.reason} (${matchedHistory.durationMins} mins)`;
        magCount = Math.max(0, Math.round(nominalMag * ((60 - dtMins) / 60)));
      }

      if (isCurrent && status === 'STOP') {
        magCount = 0;
      }

      const totalUph = magCount * unitsPerMag;
      const efficiencyPercent = Number(((magCount / Math.max(1, targetMagPerHour)) * 100).toFixed(1));
      const isLow = magCount < targetMagPerHour * 0.85;

      const batchCount = Math.ceil(magCount / Math.max(1, standardBatchMags));

      return {
        hour,
        timeRange,
        magazinesPerHour: magCount,
        targetMagazinesPerHour: targetMagPerHour,
        unitsPerMagazine: unitsPerMag,
        totalUph,
        targetUph: targetTotalUph,
        efficiencyPercent,
        isCurrent,
        isLow,
        downtimeMins: dtMins,
        downtimeReason: dtReason,
        downtimeCategory: dtCategory,
        actionTaken: dtAction,
        batchCount,
        magazinesPerBatch: standardBatchMags,
        batchCycleTimeMins: modelSpec.cycleMins,
      };
    });
  }, [
    machineId,
    chamberType,
    runningModel,
    targetMagPerHour,
    unitsPerMag,
    targetTotalUph,
    status,
    downtimeReason,
    downtimeDurationMins,
    downtimeHistory,
    standardBatchMags,
    modelSpec.cycleMins,
  ]);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalMagazines = hourlyData.reduce((sum, r) => sum + r.magazinesPerHour, 0);
    const totalUnits = hourlyData.reduce((sum, r) => sum + r.totalUph, 0);
    const avgMagPerHour = Number((totalMagazines / hourlyData.length).toFixed(1));
    const avgUnitsPerHour = Math.round(totalUnits / hourlyData.length);
    const currentRec = hourlyData[hourlyData.length - 1];
    const lowOutputHours = hourlyData.filter((r) => r.isLow && !r.isCurrent).length;

    return {
      totalMagazines,
      totalUnits,
      avgMagPerHour,
      avgUnitsPerHour,
      currentMagPerHour: currentRec?.magazinesPerHour || 0,
      currentTotalUph: currentRec?.totalUph || 0,
      lowOutputHours,
    };
  }, [hourlyData]);

  // Max value for scaling chart
  const maxMagVal = Math.max(12, ...hourlyData.map((d) => d.magazinesPerHour)) + 2;
  const maxUnitVal = maxMagVal * unitsPerMag;

  const handleBarClick = (record: HourlyMagazineRecord) => {
    setSelectedRecord(record);
    if (onHourSelect) onHourSelect(record);
  };

  const chartContent = (
    <div className="space-y-4">
      {/* Top Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1f5f9]">
        <div>
          <div className="flex items-center space-x-2">
            <Boxes className={`w-4 h-4 ${themeColors.accentText}`} />
            <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
              {title || `${machineName || machineId} - Magazine Output (UPH / Magazine)`}
            </h3>
          </div>
          <p className="text-[11px] text-[#64748b] mt-0.5">
            Throughput calibrated in <strong>Magazines/Hour</strong> & Equivalent Units ({unitsPerMag} pcs/magazine)
          </p>
        </div>

        {/* Clean Metric Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-medium">
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shadow-xs" />
            <span className="text-slate-800 font-bold">{viewMode === 'magazines' ? 'Magazines Output' : 'Pcs (UPH)'}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
            <span className={`w-3 h-0.5 ${isEmerald ? 'bg-emerald-600' : 'bg-amber-600'} inline-block`} />
            <span>Trend Line</span>
          </div>
        </div>
      </div>

      {/* KPI Overview Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-2.5">
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">
            MAGAZINE OUTPUT
          </span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="font-mono font-black text-lg text-[#0f172a]">
              {summary.currentMagPerHour}
            </span>
            <span className="text-[10px] font-mono text-[#64748b]">
              / {targetMagPerHour} Mag/hr
            </span>
          </div>
        </div>

        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-2.5">
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">
            TOTAL EQUIV. UPH
          </span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className={`font-mono font-black text-lg ${themeColors.accentText}`}>
              {summary.currentTotalUph}
            </span>
            <span className="text-[10px] font-mono text-[#64748b]">
              / {targetTotalUph} pcs
            </span>
          </div>
        </div>

        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-2.5">
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">
            MAGAZINE CAPACITY
          </span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="font-mono font-black text-lg text-[#0f172a]">
              {unitsPerMag}
            </span>
            <span className="text-[10px] font-mono text-[#64748b]">pcs / magazine</span>
          </div>
        </div>

        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-2.5">
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">
            BATCH CYCLE TIME
          </span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="font-mono font-black text-lg text-[#0f172a]">
              {modelSpec.cycleMins}m
            </span>
            <span className="text-[10px] font-mono text-[#64748b]">per batch</span>
          </div>
        </div>
      </div>

      {/* Interactive Bar Chart Canvas */}
      <div className="pt-2 pb-1 relative">
        {/* Target Benchmark Line & Color Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] font-mono text-[#64748b] mb-1.5 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500 inline-block" />
            <span className="font-bold text-[#0f172a]">
              Target Line: {viewMode === 'magazines' ? `${targetMagPerHour} Mag/hr` : `${targetTotalUph} Pcs/hr`}
            </span>
          </span>

          {/* Color Indicator Legend - Green for Pass/Target, Yellow for Below Target */}
          <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded border border-[#cbd5e1]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#4db6ac] shadow-xs" />
              <strong className="text-emerald-900 font-bold">Pass Target (≥ Target)</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#fff176] border border-amber-300 shadow-xs" />
              <span className="text-amber-900 font-bold">Below Target (&lt; Target)</span>
            </span>
          </div>
        </div>

        <div className="relative border-l border-b border-[#cbd5e1] pl-2 pt-2">
          {/* Background Grid Guidelines like OCR */}
          <div className="absolute inset-x-2 top-2 bottom-8 flex flex-col justify-between pointer-events-none opacity-25">
            <div className="w-full border-b border-dashed border-slate-400 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>{maxMagVal} Mag</span>
              <span>Peak Capacity</span>
            </div>
            <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>{targetMagPerHour} Mag</span>
              <span>Target Standard</span>
            </div>
            <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>{Math.round(targetMagPerHour / 2)} Mag</span>
              <span>Low Range</span>
            </div>
            <div className="w-full border-b border-solid border-slate-400"></div>
          </div>

          {/* Target Reference Line Overlay */}
          <div
            className="absolute left-2 right-0 border-b-2 border-dashed border-[#4db6ac] z-10 pointer-events-none opacity-80"
            style={{
              bottom: `${(targetMagPerHour / maxMagVal) * 100}%`,
            }}
          />

          {/* Line Graph Canvas Container */}
          {(() => {
            const SVG_W = 1000;
            const SVG_H = 180;
            const usableTop = 28;
            const usableBottom = 152;
            const usableH = usableBottom - usableTop;
            const count = hourlyData.length;

            const activeTarget = viewMode === 'magazines' ? targetMagPerHour : targetTotalUph;
            const activeMax = viewMode === 'magazines' ? maxMagVal : Math.max(targetTotalUph * 1.2, ...hourlyData.map(d => d.totalUph));

            const points = hourlyData.map((record, idx) => {
              const x = ((idx + 0.5) / count) * SVG_W;
              const currentVal = viewMode === 'magazines' ? record.magazinesPerHour : record.totalUph;
              const ratio = Math.max(0, Math.min(1, currentVal / activeMax));
              const y = usableBottom - ratio * usableH;
              return { x, y, record, idx, currentVal };
            });

            const targetRatio = Math.max(0, Math.min(1, activeTarget / activeMax));
            const targetY = usableBottom - targetRatio * usableH;

            const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
            const areaPath = `M ${points[0].x.toFixed(1)} ${usableBottom} ` +
              points.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
              ` L ${points[points.length - 1].x.toFixed(1)} ${usableBottom} Z`;

            const gradId = `mag-uph-grad-${machineId || 'generic'}`;

            return (
              <div className="relative h-44 w-full select-none">
                <svg
                  viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                >
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.30" />
                      <stop offset="70%" stopColor="#0284c7" stopOpacity="0.06" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline: Target */}
                  <line x1="10" y1={targetY} x2="990" y2={targetY} stroke="#059669" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.85" />
                  <text x="985" y={targetY - 5} textAnchor="end" className="text-[10px] font-mono font-bold fill-emerald-800">
                    Target {activeTarget} {viewMode === 'magazines' ? 'Mag/hr' : 'Pcs'}
                  </text>

                  {/* Baseline */}
                  <line x1="10" y1={usableBottom} x2="990" y2={usableBottom} stroke="#cbd5e1" strokeWidth="1" opacity="0.75" />

                  {/* Area Fill */}
                  <path d={areaPath} fill={`url(#${gradId})`} />

                  {/* Active/Selected Vertical Guidelines */}
                  {points.map((p) => {
                    const isSelected = selectedRecord?.hour === p.record.hour;
                    if (!isSelected) return null;
                    return (
                      <line
                        key={`guide-mag-${p.idx}`}
                        x1={p.x}
                        y1={usableTop}
                        x2={p.x}
                        y2={usableBottom}
                        stroke="#0284c7"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                        opacity="0.65"
                      />
                    );
                  })}

                  {/* Continuous Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Points / Nodes */}
                  {points.map((p) => {
                    const isSelected = selectedRecord?.hour === p.record.hour;
                    const isZero = p.currentVal === 0;
                    const isHigh = p.currentVal >= activeTarget;

                    return (
                      <g key={`point-mag-${p.idx}`}>
                        {isSelected && (
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="12"
                            fill="none"
                            stroke="#0284c7"
                            strokeWidth="2.5"
                            opacity="0.85"
                          />
                        )}

                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isSelected ? 6.5 : 5}
                          fill={isZero ? '#f43f5e' : isHigh ? '#4db6ac' : '#fff176'}
                          stroke={isZero ? '#ffffff' : isHigh ? '#004d40' : '#b45309'}
                          strokeWidth={isSelected ? '2.5' : '1.8'}
                        />

                        {/* Value text above node */}
                        <text
                          x={p.x}
                          y={Math.max(16, p.y - 10)}
                          textAnchor="middle"
                          className="font-mono text-[10.5px] font-black"
                          fill={isZero ? '#e11d48' : isHigh ? '#065f46' : '#92400e'}
                        >
                          {viewMode === 'magazines' ? `${p.record.magazinesPerHour}M` : p.record.totalUph.toLocaleString()}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Interactive Click Hitbox Columns */}
                <div className="absolute inset-0 flex">
                  {hourlyData.map((record) => {
                    const isSelected = selectedRecord?.hour === record.hour;
                    const magVal = record.magazinesPerHour;
                    const unitVal = record.totalUph;
                    const activeTarget = viewMode === 'magazines' ? targetMagPerHour : targetTotalUph;
                    const currentVal = viewMode === 'magazines' ? magVal : unitVal;
                    const isHigh = currentVal >= activeTarget;

                    return (
                      <div
                        key={record.hour}
                        onClick={() => handleBarClick(record)}
                        className={`flex-1 h-full relative cursor-pointer group flex flex-col justify-between items-center select-none transition-colors ${
                          isSelected ? 'bg-sky-500/10' : 'hover:bg-slate-500/5'
                        }`}
                        title={`${record.hour}: ${magVal} Mag (${unitVal} Pcs) - ${isHigh ? 'Normal / High Output' : currentVal === 0 ? 'Stopped' : 'Below Target'}`}
                      >
                        <div />
                        {/* Hour Label */}
                        <span
                          className={`text-[10px] font-mono font-bold mb-1 truncate ${
                            record.isCurrent ? 'text-blue-600 underline' : isSelected ? 'text-sky-700 font-extrabold' : 'text-[#64748b]'
                          }`}
                        >
                          {record.hour}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Selected Hour Magazine Batch Drilldown Panel */}
      {selectedRecord && (
        <div className="mt-3 p-3.5 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-xs text-[#0f172a]">
                Batch Detail: {selectedRecord.timeRange}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${themeColors.badgeBg}`}>
                {selectedRecord.magazinesPerHour} Magazines Processed
              </span>
            </div>
            <button
              onClick={() => setSelectedRecord(null)}
              className="text-xs text-[#64748b] hover:text-[#0f172a] font-bold cursor-pointer"
            >
              Close ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div>
              <span className="text-[#64748b] text-[10px] block">Magazine Throughput</span>
              <strong className="text-[#0f172a]">{selectedRecord.magazinesPerHour} Mag/hr</strong>
            </div>
            <div>
              <span className="text-[#64748b] text-[10px] block">Total Units Processed</span>
              <strong className={themeColors.accentText}>{selectedRecord.totalUph} Pcs</strong>
            </div>
            <div>
              <span className="text-[#64748b] text-[10px] block">Batch Count</span>
              <strong className="text-[#0f172a]">{selectedRecord.batchCount} Batches</strong>
            </div>
            <div>
              <span className="text-[#64748b] text-[10px] block">Downtime / Delays</span>
              <strong className={selectedRecord.downtimeMins > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {selectedRecord.downtimeMins} mins
              </strong>
            </div>
          </div>

          {selectedRecord.downtimeMins > 0 && (
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Root Cause:</strong> {selectedRecord.downtimeReason}
                <div className="text-[11px] text-rose-700 mt-0.5">
                  <strong>Action:</strong> {selectedRecord.actionTaken}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (!showCardWrapper) {
    return chartContent;
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-[#cbd5e1] ${themeColors.borderLeft} border-l-4 p-4 sm:p-5 shadow-xs`}
    >
      {chartContent}
    </div>
  );
};
