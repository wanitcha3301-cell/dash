import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wrench,
  HelpCircle,
  BarChart3,
  Info,
  ChevronRight,
  Sparkles,
  Zap,
  Activity,
} from 'lucide-react';
import { DowntimeHistoryItem, MachineStatus } from '../types';

export interface HourlyUphRecord {
  hour: string; // e.g. '08:00'
  timeRange: string; // e.g. '08:00 - 09:00'
  uph: number;
  targetUph: number;
  efficiencyPercent: number;
  isCurrent?: boolean;
  isLow: boolean;
  downtimeMins: number;
  downtimeReason: string;
  downtimeCategory: 'ME' | 'OP' | 'QUALITY' | 'PROCESS' | 'NORMAL';
  actionTaken: string;
  defectCount?: number;
}

export type ThemeColor = 'sky' | 'blue' | 'orange' | 'pink' | 'emerald' | 'purple' | 'amber';

interface MachineUphBarChartProps {
  machineId?: string;
  machineName?: string;
  currentUph?: number;
  targetUph?: number;
  status?: MachineStatus;
  downtimeReason?: string;
  downtimeDurationMins?: number;
  downtimeHistory?: DowntimeHistoryItem[];
  themeColor?: ThemeColor;
  colorTheme?: ThemeColor;
  compact?: boolean;
  showCardWrapper?: boolean;
  title?: string;
  onHourSelect?: (record: HourlyUphRecord) => void;
}

const THEME_STYLES = {
  sky: {
    baseBarDark: 'bg-sky-600',
    baseBarLight: 'bg-sky-200 border border-sky-300',
    currentRing: 'ring-2 ring-sky-400/60 shadow-sky-100',
    activeBarRing: 'ring-2 ring-sky-600 ring-offset-2',
    accentText: 'text-sky-600',
    accentBg: 'bg-sky-50',
    accentBorder: 'border-sky-200',
    borderLeft: 'border-l-sky-500',
    tooltipBg: 'bg-sky-700',
  },
  blue: {
    baseBarDark: 'bg-blue-600',
    baseBarLight: 'bg-blue-200 border border-blue-300',
    currentRing: 'ring-2 ring-blue-400/60 shadow-blue-100',
    activeBarRing: 'ring-2 ring-blue-600 ring-offset-2',
    accentText: 'text-blue-600',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    borderLeft: 'border-l-blue-500',
    tooltipBg: 'bg-blue-700',
  },
  orange: {
    baseBarDark: 'bg-orange-600',
    baseBarLight: 'bg-orange-200 border border-orange-300',
    currentRing: 'ring-2 ring-orange-400/60 shadow-orange-100',
    activeBarRing: 'ring-2 ring-orange-600 ring-offset-2',
    accentText: 'text-orange-600',
    accentBg: 'bg-orange-50',
    accentBorder: 'border-orange-200',
    borderLeft: 'border-l-orange-500',
    tooltipBg: 'bg-orange-700',
  },
  pink: {
    baseBarDark: 'bg-pink-600',
    baseBarLight: 'bg-pink-200 border border-pink-300',
    currentRing: 'ring-2 ring-pink-400/60 shadow-pink-100',
    activeBarRing: 'ring-2 ring-pink-600 ring-offset-2',
    accentText: 'text-pink-600',
    accentBg: 'bg-pink-50',
    accentBorder: 'border-pink-200',
    borderLeft: 'border-l-pink-500',
    tooltipBg: 'bg-pink-700',
  },
  emerald: {
    baseBarDark: 'bg-emerald-600',
    baseBarLight: 'bg-emerald-200 border border-emerald-300',
    currentRing: 'ring-2 ring-emerald-400/60 shadow-emerald-100',
    activeBarRing: 'ring-2 ring-emerald-600 ring-offset-2',
    accentText: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
    borderLeft: 'border-l-emerald-500',
    tooltipBg: 'bg-emerald-700',
  },
  purple: {
    baseBarDark: 'bg-purple-600',
    baseBarLight: 'bg-purple-200 border border-purple-300',
    currentRing: 'ring-2 ring-purple-400/60 shadow-purple-100',
    activeBarRing: 'ring-2 ring-purple-600 ring-offset-2',
    accentText: 'text-purple-600',
    accentBg: 'bg-purple-50',
    accentBorder: 'border-purple-200',
    borderLeft: 'border-l-purple-500',
    tooltipBg: 'bg-purple-700',
  },
  amber: {
    baseBarDark: 'bg-amber-600',
    baseBarLight: 'bg-amber-200 border border-amber-300',
    currentRing: 'ring-2 ring-amber-400/60 shadow-amber-100',
    activeBarRing: 'ring-2 ring-amber-600 ring-offset-2',
    accentText: 'text-amber-600',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
    borderLeft: 'border-l-amber-500',
    tooltipBg: 'bg-amber-700',
  },
};

// Standard hourly schedule for 10-hour shift
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

export const MachineUphBarChart: React.FC<MachineUphBarChartProps> = ({
  machineId = 'MC-01',
  machineName,
  currentUph = 950,
  targetUph = 1000,
  status = 'RUNNING',
  downtimeReason,
  downtimeDurationMins = 0,
  downtimeHistory = [],
  themeColor,
  colorTheme,
  compact = false,
  showCardWrapper = true,
  title,
  onHourSelect,
}) => {
  const activeTheme = colorTheme || themeColor || 'sky';
  const styles = THEME_STYLES[activeTheme] || THEME_STYLES.sky;

  // Generate realistic hourly UPH and downtime events
  const hourlyData: HourlyUphRecord[] = useMemo(() => {
    // Generate deterministic seed from machineId
    const seed = machineId.split('').reduce((acc, c, idx) => acc + c.charCodeAt(0) * (idx + 1), 0);
    const nominalUph = currentUph > 0 ? currentUph : (targetUph > 0 ? targetUph : 950);

    const DOWNTIME_PRESETS = [
      {
        reason: downtimeReason || 'Nozzle Tip Clean & Auto-Purge',
        cat: 'OP' as const,
        mins: downtimeDurationMins > 0 ? downtimeDurationMins : 14,
        action: 'Cleaned dispensing needle, purged bubble trap, re-verified dot volume.',
      },
      {
        reason: 'Syringe Pot-Life Expired & Replacement',
        cat: 'PROCESS' as const,
        mins: 18,
        action: 'Swapped thawed epoxy cartridge, executed syringe priming routine.',
      },
      {
        reason: 'PCB Infeed Conveyor Sensor Jam',
        cat: 'ME' as const,
        mins: 22,
        action: 'Cleared stalled carrier tray at station stop pin, reset optical interlock.',
      },
      {
        reason: 'Optical Vision Alignment Auto-Retry Fail',
        cat: 'QUALITY' as const,
        mins: 16,
        action: 'Re-taught fiducial mark lighting threshold, recalibrated camera offset.',
      },
      {
        reason: 'Scheduled Operator Meal & Line Handover',
        cat: 'OP' as const,
        mins: 30,
        action: 'Shift handover checklist complete; line warm-up cycles initiated.',
      },
      {
        reason: 'Thermal Temperature Stabilization Wait',
        cat: 'PROCESS' as const,
        mins: 12,
        action: 'Pre-heating stage reached target setpoint 65°C ± 1.5°C before release.',
      },
    ];

    return SHIFT_HOURS.map((hour, index) => {
      const nextHour = (parseInt(hour.split(':')[0], 10) + 1).toString().padStart(2, '0') + ':00';
      const timeRange = `${hour} - ${nextHour}`;
      const isCurrent = index === 9; // Last hour is active live hour

      // Determine if this specific hour experienced downtime or lower yield
      const variationFactor = Math.sin((seed + index * 1.7)) * 0.15;
      let uphVal = Math.round(nominalUph * (1 + variationFactor));

      // Specific machine stop condition or periodic downtime hour
      const isMachineStoppedNow = status === 'STOP' && isCurrent;
      const isDowntimeHour = (index === (seed % 4) + 2) || (index === 4); // index 4 is lunch/handover or predetermined low slot

      let dtMins = 0;
      let dtReason = 'Continuous Production • No Downtime';
      let dtCategory: 'ME' | 'OP' | 'QUALITY' | 'PROCESS' | 'NORMAL' = 'NORMAL';
      let dtAction = 'Machine operated at high throughput with zero unscheduled stops.';

      if (isMachineStoppedNow) {
        uphVal = 0;
        dtMins = downtimeDurationMins > 0 ? downtimeDurationMins : 45;
        dtReason = downtimeReason || 'Emergency Line Halt / Active Alarm';
        dtCategory = 'ME';
        dtAction = 'Maintenance crew dispatched; active alarm under inspection.';
      } else if (isDowntimeHour) {
        const preset = DOWNTIME_PRESETS[(seed + index) % DOWNTIME_PRESETS.length];
        dtMins = preset.mins;
        dtReason = preset.reason;
        dtCategory = preset.cat;
        dtAction = preset.action;
        // Output drops proportionally to downtime minutes
        const runRatio = Math.max(0.15, (60 - dtMins) / 60);
        uphVal = Math.round(nominalUph * runRatio * 0.85);
      }

      // Check matched downtime history if provided
      const matchedHistory = downtimeHistory.find((dh) => dh.timeRange.includes(hour.slice(0, 2)));
      if (matchedHistory) {
        dtReason = matchedHistory.reason;
        dtMins = matchedHistory.durationMins;
        dtCategory = matchedHistory.category as any;
        dtAction = `Logged root cause: ${matchedHistory.reason} (${matchedHistory.durationMins} mins)`;
        uphVal = Math.max(0, Math.round(nominalUph * ((60 - dtMins) / 60)));
      }

      // If current hour is stopped
      if (isCurrent && status === 'STOP') {
        uphVal = 0;
      }

      const efficiencyPercent = Number(((uphVal / Math.max(1, targetUph)) * 100).toFixed(1));
      // Low threshold: below 70% of target UPH
      const isLow = uphVal < targetUph * 0.70 || dtMins >= 10 || uphVal === 0;

      return {
        hour,
        timeRange,
        uph: uphVal,
        targetUph,
        efficiencyPercent,
        isCurrent,
        isLow,
        downtimeMins: dtMins,
        downtimeReason: dtReason,
        downtimeCategory: dtCategory,
        actionTaken: dtAction,
      };
    });
  }, [machineId, currentUph, targetUph, status, downtimeReason, downtimeDurationMins, downtimeHistory]);

  // Track hovered and clicked/selected hour for downtime detail breakdown
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    // Default select an hour with downtime or low UPH so user immediately sees the capability, or the latest hour
    const lowIdx = hourlyData.findIndex((h) => h.isLow);
    return lowIdx !== -1 ? lowIdx : hourlyData.length - 1;
  });

  const activeRecord = hourlyData[hoveredIndex ?? selectedIndex] || hourlyData[selectedIndex];
  const maxScaleUph = Math.max(targetUph * 1.15, ...hourlyData.map((d) => d.uph), 100);

  const handleBarClick = (idx: number) => {
    setSelectedIndex(idx);
    if (onHourSelect) {
      onHourSelect(hourlyData[idx]);
    }
  };

  const chartContent = (
    <div className="flex flex-col w-full space-y-3">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1f5f9] pb-2">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-lg ${styles.accentBg} ${styles.accentText}`}>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                {title || 'Hourly Output & UPH Trend (Shift Telemetry)'}
              </span>
              <span className="text-[10px] font-mono text-[#64748b] bg-slate-100 px-1.5 py-0.5 rounded">
                Target: {targetUph} UPH
              </span>
            </div>
            <p className="text-[10.5px] text-[#64748b]">
              <span className="font-semibold text-slate-700">Click point / node</span> to view hourly statistics and downtime root causes
            </p>
          </div>
        </div>

        {/* Clean Legend - Green for Pass/Target, Yellow for Below Target */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-medium">
          <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4db6ac] border border-teal-700 shadow-xs" />
            <span className="text-emerald-900 font-bold">Pass Target (≥ {targetUph})</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fff176] border border-amber-400 shadow-xs" />
            <span className="text-amber-900 font-bold">Below Target (&lt; {targetUph})</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className={`w-3.5 h-0.5 ${styles.accentText} inline-block bg-current rounded-full`} />
            <span className="text-slate-800 font-bold">UPH Line</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="w-3.5 h-0.5 border-b border-dashed border-emerald-600 inline-block" />
            <span className="text-emerald-800 font-bold">Target {targetUph}</span>
          </div>
        </div>
      </div>

      {/* Main UPH Line Graph View */}
      <div className="relative w-full pt-2 pb-1">
        {/* SVG Line Graph Canvas with viewBox coordinate system (1000 x 180) */}
        {(() => {
          const SVG_W = 1000;
          const SVG_H = 180;
          const usableTop = 30;
          const usableBottom = 152;
          const usableH = usableBottom - usableTop;
          const count = hourlyData.length;

          // Points coordinate mapping: centers of 10 equal columns
          const points = hourlyData.map((pt, idx) => {
            const x = ((idx + 0.5) / count) * SVG_W;
            const ratio = Math.max(0, Math.min(1, pt.uph / maxScaleUph));
            const y = usableBottom - ratio * usableH;
            return { x, y, pt, idx };
          });

          const targetRatio = Math.max(0, Math.min(1, targetUph / maxScaleUph));
          const targetY = usableBottom - targetRatio * usableH;
          const target50Ratio = Math.max(0, Math.min(1, (targetUph * 0.5) / maxScaleUph));
          const target50Y = usableBottom - target50Ratio * usableH;

          // Build SVG line and area paths
          const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
          const areaPath = `M ${points[0].x.toFixed(1)} ${usableBottom} ` +
            points.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
            ` L ${points[points.length - 1].x.toFixed(1)} ${usableBottom} Z`;

          const gradId = `uph-line-grad-${machineId}`;

          return (
            <div className="relative h-44 sm:h-48 w-full select-none">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
              >
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
                    <stop offset="70%" stopColor="currentColor" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Guidelines */}
                {/* Max Scale Guideline */}
                <line x1="20" y1={usableTop} x2="980" y2={usableTop} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" opacity="0.35" />
                <text x="980" y={usableTop - 5} textAnchor="end" className="text-[10px] font-mono fill-slate-400">
                  Peak {Math.round(maxScaleUph)}
                </text>

                {/* Target Pass Guideline */}
                <line x1="20" y1={targetY} x2="980" y2={targetY} stroke="#059669" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.85" />
                <text x="980" y={targetY - 5} textAnchor="end" className="text-[10.5px] font-mono font-bold fill-emerald-800">
                  Target {targetUph} UPH (Pass)
                </text>

                {/* 50% Guideline */}
                <line x1="20" y1={target50Y} x2="980" y2={target50Y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" opacity="0.45" />
                <text x="980" y={target50Y - 4} textAnchor="end" className="text-[9px] font-mono fill-slate-400">
                  {Math.round(targetUph * 0.5)}
                </text>

                {/* Baseline (0 UPH) */}
                <line x1="20" y1={usableBottom} x2="980" y2={usableBottom} stroke="#cbd5e1" strokeWidth="1" opacity="0.75" />

                {/* Soft Area Gradient Fill Under Line */}
                <path
                  d={areaPath}
                  fill={`url(#${gradId})`}
                  className={styles.accentText}
                />

                {/* Active/Hovered Vertical Guide Lines */}
                {points.map((p) => {
                  const isSelected = selectedIndex === p.idx;
                  const isHovered = hoveredIndex === p.idx;
                  if (!isSelected && !isHovered) return null;
                  return (
                    <line
                      key={`guide-${p.idx}`}
                      x1={p.x}
                      y1={usableTop}
                      x2={p.x}
                      y2={usableBottom}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="3,3"
                      className={styles.accentText}
                      opacity="0.65"
                    />
                  );
                })}

                {/* Main Continuous UPH Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.accentText}
                />

                {/* Data Points / Nodes & Value Labels */}
                {points.map((p) => {
                  const isSelected = selectedIndex === p.idx;
                  const isHovered = hoveredIndex === p.idx;
                  const isPassTarget = p.pt.uph >= targetUph;
                  const isZero = p.pt.uph === 0;

                  return (
                    <g key={`point-node-${p.idx}`}>
                      {/* Active/Selected Pulse Halo */}
                      {(isSelected || isHovered) && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className={styles.accentText}
                          opacity="0.8"
                        />
                      )}

                      {/* Current Hour Indicator Ring */}
                      {p.pt.isCurrent && !isSelected && !isHovered && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="9"
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="1.5"
                          strokeDasharray="2,2"
                          opacity="0.8"
                        />
                      )}

                      {/* Core Node Circle */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isSelected ? 6.5 : 5}
                        fill={isZero ? '#f43f5e' : isPassTarget ? '#4db6ac' : '#fff176'}
                        stroke={isZero ? '#ffffff' : isPassTarget ? '#004d40' : '#b45309'}
                        strokeWidth={isSelected ? '2.5' : '1.8'}
                      />

                      {/* Value Tag Above Node */}
                      <text
                        x={p.x}
                        y={Math.max(16, p.y - 10)}
                        textAnchor="middle"
                        className="font-mono text-[11px] font-black"
                        fill={isZero ? '#e11d48' : isPassTarget ? '#065f46' : '#92400e'}
                      >
                        {isZero ? 'STOP' : p.pt.uph.toLocaleString()}
                      </text>

                      {/* Sub-label for Downtime if Low */}
                      {p.pt.downtimeMins > 0 && !isZero && (
                        <text
                          x={p.x}
                          y={Math.min(usableBottom - 4, p.y + 14)}
                          textAnchor="middle"
                          className="font-mono text-[9px] font-bold fill-slate-500"
                        >
                          {p.pt.downtimeMins}m
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Interactive Hitbox Columns and Hover Tooltip Layer (HTML) */}
              <div className="absolute inset-0 flex">
                {hourlyData.map((pt, index) => {
                  const isSelected = selectedIndex === index;
                  const isHovered = hoveredIndex === index;
                  const isPassTarget = pt.uph >= targetUph;

                  return (
                    <div
                      key={pt.hour}
                      id={`uph-point-${machineId}-${pt.hour.replace(':', '')}`}
                      onClick={() => handleBarClick(index)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className={`flex-1 h-full relative cursor-pointer group flex flex-col justify-end items-center select-none transition-colors ${
                        isSelected ? 'bg-sky-500/10' : 'hover:bg-slate-500/5'
                      }`}
                    >
                      {/* Floating Tooltip upon hover or selection */}
                      {(isHovered || isSelected) && (
                        <div
                          className={`absolute -top-10 z-30 pointer-events-none px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-white shadow-xl whitespace-nowrap transition-all duration-150 animate-in fade-in zoom-in-95 ${
                            isPassTarget ? 'bg-emerald-700' : 'bg-amber-700'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="text-white font-extrabold">{pt.hour}:</span>
                            <span>{pt.uph.toLocaleString()} UPH</span>
                            {pt.isLow && <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0" />}
                            <span className="text-[9px] opacity-90 font-normal">
                              ({isPassTarget ? 'Pass Target' : 'Below Target'})
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Active Column Indicator Dot at Base */}
                      {pt.isCurrent && (
                        <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-sky-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* X-Axis Hour Labels */}
        <div className="flex justify-between px-1 pt-2 border-t border-slate-200 text-[10px] font-mono text-[#64748b]">
          {hourlyData.map((pt, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={pt.hour}
                type="button"
                onClick={() => handleBarClick(idx)}
                className={`transition-colors cursor-pointer text-center flex-1 ${
                  isSelected
                    ? `font-black ${styles.accentText} scale-105`
                    : pt.isCurrent
                    ? 'font-bold text-slate-700'
                    : 'hover:text-[#0f172a]'
                }`}
              >
                {pt.hour}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Downtime & Hourly Telemetry Breakdown Panel */}
      {activeRecord && (
        <div
          className={`rounded-xl border p-3.5 transition-all duration-200 ${
            activeRecord.uph === 0
              ? 'bg-rose-50/80 border-rose-200'
              : activeRecord.isLow
              ? 'bg-amber-50/80 border-amber-200'
              : `${styles.accentBg} ${styles.accentBorder}`
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-[#0f172a] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Time Range: {activeRecord.timeRange}</span>
              </span>

              {activeRecord.isCurrent && (
                <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                  Current Hour
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-[#0f172a]">
                Output: <span className="text-base font-black">{activeRecord.uph.toLocaleString()}</span> / {activeRecord.targetUph} UPH
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  activeRecord.efficiencyPercent >= 90
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : activeRecord.efficiencyPercent >= 70
                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {activeRecord.efficiencyPercent}% Target
              </span>
            </div>
          </div>

          {/* Downtime Reason and Action Display */}
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-8 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  {activeRecord.isLow ? 'Downtime Root Cause / Performance Drop:' : 'Run Status:'}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                    activeRecord.downtimeCategory === 'ME'
                      ? 'bg-rose-100 text-rose-800'
                      : activeRecord.downtimeCategory === 'OP'
                      ? 'bg-blue-100 text-blue-800'
                      : activeRecord.downtimeCategory === 'PROCESS'
                      ? 'bg-purple-100 text-purple-800'
                      : activeRecord.downtimeCategory === 'QUALITY'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Category: {activeRecord.downtimeCategory}
                </span>
              </div>

              <div className="font-bold text-[#0f172a] text-xs sm:text-sm flex items-start space-x-1.5">
                {activeRecord.isLow ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <span>{activeRecord.downtimeReason}</span>
              </div>

              <p className="text-[11px] text-[#475569] pl-5">
                {activeRecord.actionTaken}
              </p>
            </div>

            <div className="sm:col-span-4 bg-white/70 backdrop-blur-xs rounded-lg p-2 border border-slate-200/80 flex flex-col justify-between text-[11px] font-mono">
              <div className="flex justify-between items-center text-[#64748b]">
                <span>Total Downtime:</span>
                <span
                  className={`font-black ${
                    activeRecord.downtimeMins > 0 ? 'text-rose-600 text-xs' : 'text-emerald-600'
                  }`}
                >
                  {activeRecord.downtimeMins > 0 ? `${activeRecord.downtimeMins} mins` : '0 mins (Nominal)'}
                </span>
              </div>

              <div className="flex justify-between items-center text-[#64748b] mt-1 pt-1 border-t border-slate-100">
                <span>Shade:</span>
                <span className="font-bold text-[#0f172a]">
                  {activeRecord.uph === 0
                    ? 'Light (Stop / 0 UPH)'
                    : activeRecord.isLow
                    ? 'Light (Low / Downtime)'
                    : 'Dark (Target / High Output)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!showCardWrapper) {
    return chartContent;
  }

  return (
    <div
      id={`uph-card-${machineId}`}
      className={`bg-white rounded-2xl border border-[#cbd5e1] border-l-4 ${styles.borderLeft} p-4 sm:p-5 shadow-xs transition-all`}
    >
      {chartContent}
    </div>
  );
};
