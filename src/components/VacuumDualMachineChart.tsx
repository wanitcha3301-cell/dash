import React, { useState } from 'react';
import {
  Wind,
  Layers,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  TrendingUp,
  Activity,
  Sliders,
  Maximize2,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { MACHINE_MODEL_DATA, MachineRunSummary, ModelRunDetail } from '../data/machineModelData';
import { MachineModelDrilldownModal } from './MachineModelDrilldownModal';

interface VacuumDualMachineChartProps {
  onNavigateToProcess?: () => void;
}

export const VacuumDualMachineChart: React.FC<VacuumDualMachineChartProps> = ({
  onNavigateToProcess
}) => {
  const { navigate, openTraceabilityModal } = useFactory();
  const [viewUnit, setViewUnit] = useState<'boards' | 'magazines'>('boards');
  const [drilldownMachine, setDrilldownMachine] = useState<MachineRunSummary | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<{ machineId: string; index: number } | null>(null);

  const oven1 = MACHINE_MODEL_DATA['oven-1'];
  const oven2 = MACHINE_MODEL_DATA['oven-2'];

  const handleOpenDrilldown = (machine: MachineRunSummary) => {
    setDrilldownMachine(machine);
  };

  const renderMachineGraph = (machine: MachineRunSummary) => {
    const isChamberA = machine.machineId === 'oven-1';
    const maxVal = viewUnit === 'boards' ? 160 : 3;
    const targetVal = viewUnit === 'boards' ? 120 : 2;

    return (
      <div
        key={machine.machineId}
        className="bg-white rounded-2xl border border-sky-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-sky-400 transition-all duration-200 flex flex-col justify-between relative group"
      >
        <div>
          {/* Card Machine Title & Status */}
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-sky-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#b3e5fc] text-sky-950 border border-sky-300 flex items-center justify-center font-black text-xs shadow-2xs group-hover:scale-105 transition-transform">
                {isChamberA ? '01' : '02'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-base group-hover:text-sky-900 transition-colors">
                    {machine.machineName} ({isChamberA ? 'Chamber A' : 'Chamber B'})
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    RUNNING
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {machine.chamberLabel}
                </p>
              </div>
            </div>

            {/* Click to Drill down button */}
            <button
              onClick={() => handleOpenDrilldown(machine)}
              className="px-2.5 py-1 text-xs font-mono font-bold text-sky-950 bg-[#b3e5fc]/50 hover:bg-[#b3e5fc] border border-sky-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Inspect model and batch data per machine"
            >
              <Maximize2 className="w-3.5 h-3.5 text-sky-800" />
              <span className="hidden sm:inline">Running Models</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 my-3 text-xs font-mono">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Total Output</span>
              <span className="font-black text-slate-900 text-sm">
                {viewUnit === 'boards' ? `${machine.totalPcs} pcs` : `${machine.totalMagazines} mags`}
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Current Target</span>
              <span className="font-black text-slate-900 text-sm">
                {viewUnit === 'boards' ? `${targetVal} pcs/h` : `${targetVal} mags/h`}
              </span>
            </div>
            <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-800 block">Efficiency</span>
              <span className="font-black text-emerald-800 text-sm">
                {Math.round((machine.totalPcs / machine.targetPcs) * 100)}%
              </span>
            </div>
          </div>

          {/* Individual Machine Hourly Graph (Clickable) */}
          <div
            onClick={() => handleOpenDrilldown(machine)}
            className="cursor-pointer bg-linear-to-b from-sky-50/30 to-white p-3 rounded-xl border border-sky-100 relative group/graph"
            title="Click graph to inspect models & batch history"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
                Hourly Production Curve (08:00 - 17:00)
              </span>
              <span className="text-[10px] text-sky-900 bg-sky-100 px-2 py-0.5 rounded font-bold">
                Target: {targetVal} {viewUnit === 'boards' ? 'pcs/h' : 'mag/h'}
              </span>
            </div>

            {/* Target line indicator */}
            <div className="relative pt-4 pb-1 border-l border-b border-slate-300 pl-2">
              <div className="flex items-end justify-between space-x-1.5 h-32 px-1 relative z-10">
                {machine.hourlyOutput.map((slot, idx) => {
                  const val = viewUnit === 'boards' ? slot.actualPcs : slot.actualMag;
                  const height = Math.min(100, Math.max(10, (val / maxVal) * 100));
                  const isHovered = hoveredSlot?.machineId === machine.machineId && hoveredSlot?.index === idx;

                  const isHigh = val >= targetVal;
                  const barColor = isHigh
                    ? 'bg-[#4db6ac] hover:bg-[#3d958d]'
                    : 'bg-[#fff176] hover:bg-[#f9e755] border border-amber-300';

                  return (
                    <div
                      key={slot.hour}
                      className="flex-1 flex flex-col items-center"
                      onMouseEnter={() => setHoveredSlot({ machineId: machine.machineId, index: idx })}
                      onMouseLeave={() => setHoveredSlot(null)}
                    >
                      <div className="w-full flex flex-col items-center justify-end h-24 relative">
                        {isHovered && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white text-[9.5px] font-mono px-2 py-0.5 rounded-lg border border-slate-700/80 shadow-xl z-30 whitespace-nowrap pointer-events-none select-none">
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="text-sky-400">{slot.hour}</span>
                              <span>•</span>
                              <span className="text-white">{val} {viewUnit === 'boards' ? 'Pcs' : 'Mag'}</span>
                              <span className={`text-[8.5px] px-1 rounded ${isHigh ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {Math.round((val / targetVal) * 100)}%
                              </span>
                            </div>
                          </div>
                        )}
                        <span className="text-[9px] font-mono font-semibold text-slate-600 mb-0.5">
                          {val}
                        </span>
                        <div
                          style={{ height: `${height}%` }}
                          className={`w-full max-w-[28px] ${barColor} rounded-t-xs transition-all duration-150`}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 mt-2">
                        {slot.hour.split(':')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center mt-2">
              <span className="text-[10px] font-mono text-sky-800 font-bold hover:underline">
                🔍 Click graph to inspect model and batch breakdown →
              </span>
            </div>
          </div>

          {/* Model Breakdown */}
          <div className="mt-4 pt-3 border-t border-sky-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                <span>Running Models (Ranked High vs Low)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {machine.models.length} Models
              </span>
            </div>

            {/* Model Pills / Comparison Bars */}
            <div className="space-y-2">
              {machine.models.map((model) => {
                const isHighest = model.volumeRank === 'highest';
                const isLowest = model.volumeRank === 'lowest';

                return (
                  <div
                    key={model.modelId}
                    onClick={() => handleOpenDrilldown(machine)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-sky-50/50 hover:border-sky-300 transition-all cursor-pointer flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {model.modelName}
                        </span>
                        {/* High / Low Badges */}
                        {isHighest && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-100 text-sky-950 border border-sky-300 shadow-2xs">
                            🏆 Highest
                          </span>
                        )}
                        {isLowest && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            🔻 Lowest
                          </span>
                        )}
                        {!isHighest && !isLowest && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                            ⚖️ Medium
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1 font-mono text-xs">
                        <strong className="text-slate-900 text-sm font-black">
                          {model.runCount.toLocaleString()}
                        </strong>
                        <span className="text-slate-500 text-[11px]">pcs</span>
                      </div>
                    </div>

                    {/* Progress Bar showing volume proportion */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${model.percentage}%` }}
                          className={`h-full rounded-full transition-all ${
                            isHighest ? 'bg-sky-600' : isLowest ? 'bg-amber-500' : 'bg-teal-600'
                          }`}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-600 w-9 text-right">
                        {model.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-4 pt-3 border-t border-sky-100 flex items-center justify-between text-xs font-mono text-slate-600">
          <span>OP: {machine.operatorId.split(' ')[0]}</span>
          <button
            onClick={() => handleOpenDrilldown(machine)}
            className="text-sky-900 hover:text-sky-950 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Batch Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-sky-200/90 p-5 shadow-xs space-y-5">
      {/* Header with Title and Mode Switchers */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-sky-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[#b3e5fc] text-sky-950 border border-sky-300">
              <Wind className="w-5 h-5 text-sky-900" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Vacuum Oven Process (2 Units Comparative View)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b3e5fc] text-sky-950 border border-sky-300 shadow-2xs">
              2 GRAPHS
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Comparative analysis of 2 vacuum units (Oven #1 Chamber A vs Oven #2 Chamber B) with active models and volume ranking
          </p>
        </div>

        {/* View Unit Toggle (Boards vs Magazines) & Direct Link */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewUnit('boards')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewUnit === 'boards'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Boards (Pcs)
            </button>
            <button
              onClick={() => setViewUnit('magazines')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewUnit === 'magazines'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Magazines (Mag)
            </button>
          </div>

          <button
            onClick={() => navigate('vacuum-process')}
            className="px-3 py-1.5 rounded-xl font-bold bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Fullscreen Vacuum Control</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Legend Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#4db6ac]" />
            <strong className="text-slate-800">Pass Target (≥ 120 Pcs / 2 Mag)</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#fff176] border border-amber-300" />
            <strong className="text-slate-800">Below Target (&lt; 120 Pcs / 2 Mag)</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-sans">Volume Breakdown:</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-950 border border-sky-300">
            🏆 High
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
            ⚖️ Medium
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            🔻 Low
          </span>
        </div>
      </div>

      {/* 2 Graphs Side-by-Side: Oven #1 & Oven #2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {renderMachineGraph(oven1)}
        {renderMachineGraph(oven2)}
      </div>

      {/* Modal for Drill Down Details */}
      <MachineModelDrilldownModal
        isOpen={!!drilldownMachine}
        onClose={() => setDrilldownMachine(null)}
        machineData={drilldownMachine}
        onOpenTraceability={openTraceabilityModal}
      />
    </div>
  );
};
