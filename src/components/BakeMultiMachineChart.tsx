import React, { useState } from 'react';
import {
  Flame,
  Layers,
  ArrowUpRight,
  BarChart3,
  Maximize2
} from 'lucide-react';
import { useFactory } from '../context/FactoryContext';
import { MACHINE_MODEL_DATA, MachineRunSummary } from '../data/machineModelData';
import { MachineModelDrilldownModal } from './MachineModelDrilldownModal';

export const BakeMultiMachineChart: React.FC = () => {
  const { navigate, openTraceabilityModal } = useFactory();
  const [viewUnit, setViewUnit] = useState<'boards' | 'magazines'>('boards');
  const [drilldownMachine, setDrilldownMachine] = useState<MachineRunSummary | null>(null);

  const bakeKeys = ['bake-1', 'bake-2', 'bake-3', 'bake-4', 'bake-5'];
  const bakeMachines = bakeKeys.map((k) => MACHINE_MODEL_DATA[k]).filter(Boolean);

  const maxVal = viewUnit === 'boards' ? 200 : 3;
  const targetVal = viewUnit === 'boards' ? 150 : 2;

  return (
    <div className="bg-white rounded-2xl border border-amber-200/90 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-amber-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
              <Flame className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Bake Oven Fleet (5 Ovens Comparison)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
              5 GRAPHS
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Compare data across all 5 bake ovens (Bake Oven #1 - #5) with active models and volume ranking
          </p>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewUnit('boards')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewUnit === 'boards'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Boards (Pcs)
            </button>
            <button
              onClick={() => setViewUnit('magazines')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewUnit === 'magazines'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Magazines (Mag)
            </button>
          </div>

          <button
            onClick={() => navigate('bake-process')}
            className="px-3 py-1.5 rounded-xl font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Fullscreen Bake Control</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of 5 Machines */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bakeMachines.map((machine) => (
          <div
            key={machine.machineId}
            className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-bold font-mono text-xs flex items-center justify-center border border-amber-200">
                    {machine.machineId.replace('bake-', '#0')}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">{machine.machineName}</span>
                </div>
                <button
                  onClick={() => setDrilldownMachine(machine)}
                  className="px-2 py-0.5 text-[11px] font-mono font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>View Models</span>
                </button>
              </div>

              {/* Chart Thumbnail */}
              <div
                onClick={() => setDrilldownMachine(machine)}
                className="cursor-pointer my-3 p-2 bg-amber-50/20 rounded-xl border border-amber-100 hover:border-amber-300 transition-all"
                title="Click to inspect model & lot details"
              >
                <div className="flex items-end justify-between space-x-1 h-20 pt-2">
                  {machine.hourlyOutput.map((slot) => {
                    const val = viewUnit === 'boards' ? slot.actualPcs : slot.actualMag;
                    const height = Math.min(100, Math.max(12, (val / maxVal) * 100));
                    const isHigh = val >= targetVal;

                    return (
                      <div key={slot.hour} className="flex-1 flex flex-col items-center">
                        <div
                          style={{ height: `${height}%` }}
                          className={`w-full ${isHigh ? 'bg-[#4db6ac]' : 'bg-[#fff176] border border-amber-300'} rounded-t-xs`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>08:00</span>
                  <span className="font-bold text-slate-700">Total: {machine.totalPcs} pcs</span>
                  <span>17:00</span>
                </div>
              </div>

              {/* Models High / Low Ranking */}
              <div className="space-y-1.5 mt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                  Models Run (Ranked High/Low):
                </span>
                {machine.models.map((m) => (
                  <div
                    key={m.modelId}
                    onClick={() => setDrilldownMachine(machine)}
                    className="p-1.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-amber-50/50 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[140px]">
                        {m.modelName}
                      </span>
                      {m.volumeRank === 'highest' && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          🏆 Highest
                        </span>
                      )}
                      {m.volumeRank === 'lowest' && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-200 text-slate-700">
                          🔻 Lowest
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-[11px]">
                      {m.runCount} pcs ({m.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>{machine.operatorId.split(' ')[0]}</span>
              <span className="text-amber-800 font-bold hover:underline cursor-pointer" onClick={() => setDrilldownMachine(machine)}>
                Inspect Batch Details →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Drilldown Modal */}
      <MachineModelDrilldownModal
        isOpen={!!drilldownMachine}
        onClose={() => setDrilldownMachine(null)}
        machineData={drilldownMachine}
        onOpenTraceability={openTraceabilityModal}
      />
    </div>
  );
};
