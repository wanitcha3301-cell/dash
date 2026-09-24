import React, { useState } from 'react';
import {
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  Flame,
  Wind,
  Barcode,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Sparkles,
  Sliders,
  Cpu,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { MachineRunSummary, ModelRunDetail, LotRunRecord } from '../data/machineModelData';

interface MachineModelDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineData: MachineRunSummary | null;
  onOpenTraceability?: (serialOrLot: string) => void;
}

export const MachineModelDrilldownModal: React.FC<MachineModelDrilldownModalProps> = ({
  isOpen,
  onClose,
  machineData,
  onOpenTraceability
}) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = High -> Low, asc = Low -> High
  const [expandedModelIds, setExpandedModelIds] = useState<string[]>([]);
  const [selectedLotDetail, setSelectedLotDetail] = useState<LotRunRecord | null>(null);

  if (!isOpen || !machineData) return null;

  const toggleExpand = (modelId: string) => {
    setExpandedModelIds((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
    );
  };

  const sortedModels = [...machineData.models].sort((a, b) => {
    return sortOrder === 'desc' ? b.runCount - a.runCount : a.runCount - b.runCount;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-sky-200 flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-linear-to-r from-sky-50 via-white to-sky-50/60 border-b border-sky-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#b3e5fc] text-sky-950 border border-sky-300 flex items-center justify-center shadow-xs">
              {machineData.subType === 'Vacuum' ? (
                <Wind className="w-5 h-5 text-sky-900" />
              ) : machineData.subType === 'Bake' ? (
                <Flame className="w-5 h-5 text-amber-800" />
              ) : (
                <Cpu className="w-5 h-5 text-sky-900" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {machineData.machineName} • Model & Run Breakdown
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {machineData.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {machineData.chamberLabel} • {machineData.operatorId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Top KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl">
              <span className="text-[10px] font-bold text-sky-900 uppercase font-mono block">
                Total Produced
              </span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-xl font-black font-mono text-slate-900">
                  {machineData.totalPcs.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-mono">pcs</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-600 uppercase font-mono block">
                Total Magazines
              </span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-xl font-black font-mono text-slate-900">
                  {machineData.totalMagazines}
                </span>
                <span className="text-xs text-slate-500 font-mono">mags</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-600 uppercase font-mono block">
                Models Running
              </span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-xl font-black font-mono text-sky-900">
                  {machineData.models.length}
                </span>
                <span className="text-xs text-slate-500 font-mono">models</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-900 uppercase font-mono block">
                Average Yield
              </span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-xl font-black font-mono text-emerald-800">
                  99.7%
                </span>
                <span className="text-xs text-emerald-700 font-mono">pass</span>
              </div>
            </div>
          </div>

          {/* Model Breakdown Section with Sorting & High/Low Analysis */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>Models Run on this Machine (Ranked by Volume)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click on each model to expand Batch, Lot, Recipe and runtime breakdown
                </p>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-mono font-bold text-slate-500 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  Sort by Volume:
                </span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-mono">
                  <button
                    onClick={() => setSortOrder('desc')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      sortOrder === 'desc'
                        ? 'bg-[#b3e5fc] text-sky-950 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    High to Low
                  </button>
                  <button
                    onClick={() => setSortOrder('asc')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      sortOrder === 'asc'
                        ? 'bg-[#b3e5fc] text-sky-950 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Low to High
                  </button>
                </div>
              </div>
            </div>

            {/* List of Models */}
            <div className="space-y-3 mt-4">
              {sortedModels.map((model) => {
                const isExpanded = expandedModelIds.includes(model.modelId);
                const isHighest = model.volumeRank === 'highest';
                const isLowest = model.volumeRank === 'lowest';

                return (
                  <div
                    key={model.modelId}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'border-sky-400 shadow-md bg-white ring-1 ring-sky-300'
                        : 'border-slate-200 hover:border-sky-300 bg-slate-50/50 hover:bg-white'
                    }`}
                  >
                    {/* Model Header Bar (Clickable to Expand) */}
                    <div
                      onClick={() => toggleExpand(model.modelId)}
                      className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
                    >
                      <div className="flex items-start sm:items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-sm shrink-0 border shadow-2xs ${
                            isHighest
                              ? 'bg-sky-600 text-white border-sky-700'
                              : isLowest
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-slate-200 text-slate-800 border-slate-300'
                          }`}
                        >
                          #{model.rankNumber}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                              {model.modelName}
                            </h5>
                            {/* Volume Ranking Badges */}
                            {isHighest && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-100 text-sky-900 border border-sky-300 shadow-2xs flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
                                🏆 Highest Volume
                              </span>
                            )}
                            {isLowest && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs flex items-center gap-1">
                                🔻 Lowest Volume
                              </span>
                            )}
                            {!isHighest && !isLowest && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
                                ⚖️ Medium Volume
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {model.category} • {model.lots.length} Production Batches
                          </p>
                        </div>
                      </div>

                      {/* Right: Quantity, Magazines & Percentage Bar */}
                      <div className="flex items-center justify-between md:justify-end gap-5">
                        <div className="text-right">
                          <div className="flex items-baseline justify-end space-x-1.5 font-mono">
                            <span className="text-lg font-black text-slate-900">
                              {model.runCount.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-500">pcs</span>
                            <span className="text-xs text-slate-400">({model.magazinesCount} mags)</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-28 sm:w-36 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${model.percentage}%` }}
                                className={`h-full rounded-full transition-all ${
                                  isHighest ? 'bg-sky-600' : isLowest ? 'bg-amber-500' : 'bg-teal-600'
                                }`}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-700 w-10 text-right">
                              {model.percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Expand Button */}
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-900 transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Granular Breakdown */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-sky-100 bg-sky-50/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-sky-950 uppercase flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-sky-600" />
                            Batch & Lot Records ({model.lots.length} Batches):
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            Recipe: {model.lots[0]?.recipe || 'N/A'}
                          </span>
                        </div>

                        {/* Lots Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-xs text-left font-mono">
                            <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                              <tr>
                                <th className="px-3 py-2">Lot Number</th>
                                <th className="px-3 py-2">Time Slot</th>
                                <th className="px-3 py-2 text-right">Qty (Pcs)</th>
                                <th className="px-3 py-2 text-right">Magazines</th>
                                <th className="px-3 py-2">Rack / Shelf</th>
                                <th className="px-3 py-2 text-right">Yield</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2 text-center">Trace</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {model.lots.map((lot) => (
                                <tr key={lot.lotId} className="hover:bg-sky-50/60 transition-colors">
                                  <td className="px-3 py-2.5 font-bold text-slate-800">
                                    {lot.lotId}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-600">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {lot.timeRange}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                                    {lot.quantity.toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2.5 text-right text-slate-600">
                                    {lot.magazines}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-600">
                                    {lot.rackShelf}
                                  </td>
                                  <td className="px-3 py-2.5 text-right text-emerald-700 font-bold">
                                    {lot.yieldRate}%
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      {lot.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    {onOpenTraceability && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onOpenTraceability(lot.lotId);
                                        }}
                                        className="p-1 rounded text-sky-700 hover:text-sky-900 hover:bg-sky-100 transition-colors cursor-pointer"
                                        title={`Trace lot ${lot.lotId}`}
                                      >
                                        <Barcode className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Chamber Parameters for this Model */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono bg-white p-2.5 rounded-xl border border-sky-200/80">
                          <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                            <span className="text-slate-500">Chamber Temp:</span>
                            <span className="font-bold text-slate-800">
                              {model.lots[0]?.tempCelsius || 180}°C
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                            <span className="text-slate-500">Target Vacuum:</span>
                            <span className="font-bold text-slate-800">
                              {model.lots[0]?.targetPressurePa || 0.45} Pa (-98 kPa)
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                            <span className="text-slate-500">Standard Cycle:</span>
                            <span className="font-bold text-slate-800">
                              25 Mins / Batch
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
          <div className="text-slate-500">
            Machine: <strong className="text-slate-800">{machineData.machineName}</strong> ({machineData.subType}) • Total: {machineData.totalPcs} pcs
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
