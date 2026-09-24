import React from 'react';
import { OvenUnit } from '../types';
import { Eye, Cpu, CheckCircle2, TrendingUp, AlertTriangle, ExternalLink, Activity } from 'lucide-react';
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

interface InspectionMachinesOverviewSectionProps {
  processType: 'FVMI' | 'AOI' | 'X-ray';
  units: OvenUnit[];
  selectedUnitId?: string;
  onSelectUnit?: (unitId: string) => void;
}

export const InspectionMachinesOverviewSection: React.FC<InspectionMachinesOverviewSectionProps> = ({
  processType,
  units,
  selectedUnitId = 'ALL',
  onSelectUnit,
}) => {
  // Config per process type
  const config = React.useMemo(() => {
    switch (processType) {
      case 'FVMI':
        return {
          icon: <Eye className="w-3.5 h-3.5 text-sky-600" />,
          title: `FVMI Optical Inspection Stations (${units.length} Units)`,
          subtitle: '25MP Telecentric Multi-angle Vision Verification',
          metric1Label: 'Yield Rate',
          metric1Icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
          metric2Label: 'Throughput',
          metric2Icon: <TrendingUp className="w-3 h-3 text-sky-600" />,
          metric3Label: 'Recipe',
          metric3Icon: <Cpu className="w-3 h-3 text-slate-500" />,
          chartColor: '#0284c7',
        };
      case 'AOI':
        return {
          icon: <Eye className="w-3.5 h-3.5 text-blue-600" />,
          title: `AOI SMT Inspection Units (${units.length} Units)`,
          subtitle: 'Dual-Track High-Speed Optical Inspection',
          metric1Label: 'Pass Rate',
          metric1Icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
          metric2Label: 'Current UPH',
          metric2Icon: <TrendingUp className="w-3 h-3 text-blue-600" />,
          metric3Label: 'Model',
          metric3Icon: <Cpu className="w-3 h-3 text-slate-500" />,
          chartColor: '#2563eb',
        };
      case 'X-ray':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-indigo-600" />,
          title: `X-ray High-Density Units (${units.length} Units)`,
          subtitle: 'BGA Void, Hip & Joint Non-destructive Telemetry',
          metric1Label: 'Avg Void',
          metric1Icon: <AlertTriangle className="w-3 h-3 text-amber-600" />,
          metric2Label: 'Tube KV',
          metric2Icon: <TrendingUp className="w-3 h-3 text-indigo-600" />,
          metric3Label: 'Yield',
          metric3Icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
          chartColor: '#4f46e5',
        };
    }
  }, [processType, units.length]);

  // Clean responsive grid layout
  const gridClass = React.useMemo(() => {
    if (units.length <= 2) {
      return 'grid grid-cols-1 md:grid-cols-2 gap-3.5';
    }
    if (units.length <= 4) {
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5';
    }
    if (units.length <= 6) {
      return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3';
    }
    // 9 units (FVMI)
    return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3.5';
  }, [units.length]);

  return (
    <section id={`${processType.toLowerCase()}-machines-overview-section`} className="space-y-3 pt-1">
      {/* Clean & Balanced Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center">
            {config.icon}
          </div>
          <h3 className="font-bold text-slate-800 text-sm font-sans">
            {config.title}
          </h3>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            • {config.subtitle}
          </span>
        </div>
        <span className="text-xs text-sky-700 font-mono font-semibold flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          คลิกที่การ์ดหรือกราฟเพื่อดูรายละเอียดเครื่อง
        </span>
      </div>

      {/* Grid of Mini Machine Cards with Clickable Mini-Graphs */}
      <div className={gridClass}>
        {units.map((unit, idx) => {
          const isSelected = selectedUnitId === unit.id;
          const isRunning = unit.status === 'RUNNING';
          const target = unit.inputCount || (unit.pcsCount ? Math.round(unit.pcsCount * 1.02) : 1200);
          const actual = unit.outputCount || unit.pcsCount || 1150;
          const progress = Math.min(100, Math.round((actual / Math.max(1, target)) * 100));
          const hourlySlots = computeOvenHourlyData(unit);
          const targetUph = hourlySlots[0]?.targetUph || (processType === 'FVMI' ? 120 : processType === 'AOI' ? 1100 : 250);

          // Metrics per card
          let val1 = `${unit.yieldPercent || 99.8}%`;
          let val2 = `${unit.uph || unit.targetUph || 1100} uph`;
          let val3 = unit.runningModel || '504-2187';
          if (processType === 'X-ray') {
            val1 = `${unit.voidPercent !== undefined ? unit.voidPercent : 2.1}%`;
            val2 = `${unit.tubeKv || 90} kV`;
            val3 = `${unit.yieldPercent || 99.2}%`;
          }

          return (
            <div
              key={unit.id}
              onClick={() => onSelectUnit?.(unit.id)}
              className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between space-y-3 cursor-pointer group shadow-xs hover:border-sky-400 hover:shadow-md ${
                isSelected
                  ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20'
                  : 'border-slate-200/90'
              }`}
              title={`คลิกเพื่อเปิดดูกราฟและรายละเอียด ${unit.name || unit.id}`}
            >
              <div>
                {/* Header: Clean typography */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl font-mono font-bold text-xs flex items-center justify-center shrink-0 tracking-wider shadow-xs transition-colors ${
                        isSelected
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-900 group-hover:bg-sky-600 text-white'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-sky-700 transition-colors">
                        {unit.id}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        {unit.chamberLabel || unit.name}
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
                <div className="grid grid-cols-3 gap-2 my-2.5 font-mono text-[11px]">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60 group-hover:bg-sky-50/30 transition-colors">
                    <span className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                      {config.metric1Icon}
                      <span className="truncate">{config.metric1Label}</span>
                    </span>
                    <span className="font-bold text-slate-900 text-xs mt-1 block truncate">
                      {val1}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60 group-hover:bg-sky-50/30 transition-colors">
                    <span className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                      {config.metric2Icon}
                      <span className="truncate">{config.metric2Label}</span>
                    </span>
                    <span className="font-bold text-slate-900 text-xs mt-1 block truncate">
                      {val2}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60 group-hover:bg-sky-50/30 transition-colors">
                    <span className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                      {config.metric3Icon}
                      <span className="truncate">{config.metric3Label}</span>
                    </span>
                    <span className="font-bold text-slate-800 text-xs truncate mt-1 block" title={val3}>
                      {val3}
                    </span>
                  </div>
                </div>

                {/* MINI-GRAPH FOR THIS MACHINE: Hourly Production Output */}
                <div className="my-2 bg-slate-50/80 p-2 rounded-xl border border-slate-200 group-hover:border-sky-300 transition-colors">
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
                            id={`inspectGrad-${unit.id}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor={config.chartColor} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={config.chartColor} stopOpacity={0.02} />
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
                          stroke={config.chartColor}
                          strokeWidth={1.5}
                          fillOpacity={1}
                          fill={`url(#inspectGrad-${unit.id})`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Production Output Progress bar */}
                <div className="space-y-1 bg-slate-50/60 p-2 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500 font-sans">Total Good</span>
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
                <span className="truncate max-w-[120px] text-slate-400" title={unit.operatorId}>
                  {unit.operatorId || 'Lead Tech'}
                </span>
                <span className="text-sky-700 font-bold flex items-center gap-1 group-hover:text-sky-900 group-hover:translate-x-0.5 transition-all">
                  <span>ดูกราฟเครื่องนี้</span>
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
