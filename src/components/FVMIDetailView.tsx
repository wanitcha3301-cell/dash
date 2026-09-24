import React, { useState, useMemo } from 'react';
import { MachineAnalyticsControlBar } from './MachineAnalyticsControlBar';
import {
  UserCheck,
  Layers,
  BarChart2,
  BarChart3,
  Scan,
  Activity,
  ChevronDown,
  Camera,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  Clock,
  Radio,
  Download,
  Edit3,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ReferenceLine,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { useFactory } from '../context/FactoryContext';
import { Header } from './Header';
import {
  INITIAL_FULL_9_FVMI_FLEET,
  FVMI_SUPPORTED_MODELS,
  FVMIMachineFullData,
  FvmiHourlySlot
} from '../data/fvmiFleetData';
import { useLanguage } from '../context/LanguageContext';
import { InspectionDetailModal, InspectionPopupPayload } from './InspectionDetailModal';

const STORAGE_FVMI_STATION_KEY = 'fvmi_active_station_v1';
const STORAGE_FVMI_MODEL_KEY = 'fvmi_selected_model_v1';

// Green for Pass / Meets Target (>= Target), Yellow for Below Target (< Target)
const getFvmiBarColor = (actualIn: number, target: number = 1200) => {
  if (actualIn >= target) return '#4db6ac'; // Green (#4db6ac)
  return '#fff176'; // Yellow (#fff176)
};

export const FVMIDetailView: React.FC = () => {
  const { navigate, selectedMachineId, setSelectedMachineId, selectedDate, isToday, openTraceabilityModal } = useFactory();
  const { t } = useLanguage();

  const [activeStationId, setActiveStationIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FVMI_STATION_KEY);
      if (saved) return saved;
    } catch (e) {}
    return selectedMachineId || 'FVMI-01';
  });

  // Sync when selectedMachineId changes from navigation
  React.useEffect(() => {
    if (selectedMachineId && selectedMachineId.startsWith('FVMI') && selectedMachineId !== activeStationId) {
      setActiveStationIdState(selectedMachineId);
    }
  }, [selectedMachineId]);

  const setActiveStationId = (id: string) => {
    setActiveStationIdState(id);
    try {
      localStorage.setItem(STORAGE_FVMI_STATION_KEY, id);
    } catch (e) {}
  };

  const [selectedModel, setSelectedModelState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FVMI_MODEL_KEY);
      if (saved) return saved;
    } catch (e) {}
    return '504-2187';
  });

  const setSelectedModel = (model: string) => {
    setSelectedModelState(model);
    try {
      localStorage.setItem(STORAGE_FVMI_MODEL_KEY, model);
    } catch (e) {}
  };

  const [selectedOperator, setSelectedOperator] = useState<string>('All');
  const [selectedLot, setSelectedLot] = useState<string>('All');
  const [selectedRack, setSelectedRack] = useState<string>('All');
  const [inspectionPopup, setInspectionPopup] = useState<InspectionPopupPayload | null>(null);

  // Find active machine data from 9 stations
  const machineFullData = useMemo<FVMIMachineFullData>(() => {
    const found = INITIAL_FULL_9_FVMI_FLEET.find((m) => m.id === activeStationId);
    return found || INITIAL_FULL_9_FVMI_FLEET[0];
  }, [activeStationId]);

  // Model-specific data for this exact machine
  const currentModelData = useMemo(() => {
    const mData = machineFullData.models[selectedModel] || machineFullData.models['504-2187'];
    if (isToday) return mData;

    // Apply historical date variation
    const dateSum = selectedDate.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const countFactor = 0.82 + ((dateSum % 25) / 100);
    const adjTotal = Math.round(mData.baseInputPerHour * 8 * countFactor);
    const passShift = ((dateSum % 7) - 3) * 0.4;
    const adjPassRatio = Math.min(0.995, Math.max(0.75, mData.passRatio + passShift / 100));

    return {
      ...mData,
      baseInputPerHour: Math.round(mData.baseInputPerHour * countFactor),
      passRatio: adjPassRatio,
      recentPanels: mData.recentPanels.map((p, idx) => ({
        ...p,
        panelId: p.panelId.replace(/S\d\d/, `S${machineFullData.stationNumber.toString().padStart(2, '0')}`),
        time: `${(8 + idx).toString().padStart(2, '0')}:${((idx * 14 + 5) % 60).toString().padStart(2, '0')}:00`
      }))
    };
  }, [machineFullData, selectedModel, isToday, selectedDate]);

  // Compute calculated metrics for this machine + model
  const totalUnits = Math.round(currentModelData.baseInputPerHour * 7.5);
  const passCount = Math.round(totalUnits * currentModelData.passRatio);
  const xoutCount = Math.round(totalUnits * currentModelData.xoutRatio);
  const reworkCount = Math.round(totalUnits * currentModelData.reworkRatio);
  const discardCount = Math.max(0, totalUnits - passCount - xoutCount - reworkCount);
  const failCount = xoutCount + reworkCount + discardCount;

  const passRate = Number(((passCount / Math.max(1, totalUnits)) * 100).toFixed(2));
  const failRate = Number(((failCount / Math.max(1, totalUnits)) * 100).toFixed(2));
  const xoutRate = Number(((xoutCount / Math.max(1, totalUnits)) * 100).toFixed(2));
  const reworkRate = Number(((reworkCount / Math.max(1, totalUnits)) * 100).toFixed(2));
  const discardRate = Number(((discardCount / Math.max(1, totalUnits)) * 100).toFixed(2));

  const handleStationSelect = (stId: string) => {
    setActiveStationId(stId);
    setSelectedMachineId(stId);
    const targetMachine = INITIAL_FULL_9_FVMI_FLEET.find((m) => m.id === stId);
    if (targetMachine) {
      setSelectedModel(targetMachine.activeModelId);
    }
  };

  return (
    <div className="bg-white text-[#1b1b1d] min-h-screen pb-24 md:pb-8 flex flex-col font-sans">
      {/* Standard Header with Breadcrumb & Back Navigation */}
      <Header
        title={`${machineFullData.id} Inspection Detail`}
        subtitle={`${machineFullData.type} • Model ${selectedModel} • Operator ${currentModelData.operatorName}`}
        badge={
          <span className="text-[11px] font-mono font-bold text-sky-950 bg-[#b3e5fc] border border-sky-300 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>
            PROCESS • {machineFullData.status === 'RUNNING' ? `${machineFullData.id} ONLINE` : `${machineFullData.id} STOP`}
          </span>
        }
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 w-full space-y-6">
        {/* Unified Standard Analytics Control Strip & Breakdown */}
        <MachineAnalyticsControlBar
          totalOutput={passCount}
          outputUnit="boards"
          activeHours={8}
          peakHourLabel="02 SEPT 15:00"
          peakHourValue={Math.max(currentModelData.uph, 130)}
          avgPerActiveHour={Math.round(passCount / 8)}
          lines={[
            'All FVMI Fleet (9 Units)',
            ...INITIAL_FULL_9_FVMI_FLEET.map((st) => 
              st.stationNumber <= 5 
                ? `Line 0${st.stationNumber} (${st.id})`
                : `Line 06 (${st.id} - Bay ${String.fromCharCode(65 + st.stationNumber - 6)})`
            )
          ]}
          selectedLine={
            machineFullData.stationNumber <= 5 
              ? `Line 0${machineFullData.stationNumber} (${machineFullData.id})`
              : `Line 06 (${machineFullData.id} - Bay ${String.fromCharCode(65 + machineFullData.stationNumber - 6)})`
          }
          onLineChange={(l) => {
            const found = INITIAL_FULL_9_FVMI_FLEET.find((s) => l.includes(s.id));
            if (found) handleStationSelect(found.id);
          }}
          products={['All', ...FVMI_SUPPORTED_MODELS.map((m) => `Model ${m}`)]}
          selectedProduct={`Model ${selectedModel}`}
          onProductChange={(p) => {
            const found = FVMI_SUPPORTED_MODELS.find((m) => p.includes(m));
            if (found) setSelectedModel(found);
          }}
          selectedOperator={selectedOperator}
          onOperatorChange={setSelectedOperator}
          selectedLot={selectedLot}
          onLotChange={setSelectedLot}
          selectedRack={selectedRack}
          onRackChange={setSelectedRack}
          breakdownData={{
            Line: INITIAL_FULL_9_FVMI_FLEET.map((st) => {
              const lineName = st.stationNumber <= 5 
                ? `Line 0${st.stationNumber} (${st.id})`
                : `Line 06 (${st.id} - Bay ${String.fromCharCode(65 + st.stationNumber - 6)})`;
              
              const mData = st.models[selectedModel] || st.models['504-2187'];
              const count = st.id === activeStationId 
                ? passCount 
                : (mData.hourlyData ? mData.hourlyData.reduce((acc, h) => acc + h.passCount, 0) : Math.round(mData.baseInputPerHour * 7.5 * mData.passRatio));

              return {
                name: lineName,
                count
              };
            }),
            Product: FVMI_SUPPORTED_MODELS.map((m) => ({
              name: `Model ${m}`,
              count: m === selectedModel ? passCount : Math.round(passCount * 0.35)
            })),
            Operator: [
              { name: `${currentModelData.operatorName} (${currentModelData.operatorId})`, count: Math.round(passCount * 0.65) },
              { name: 'OP-FVMI-Alt (Shift 2)', count: Math.round(passCount * 0.35) },
            ],
            Lot: [
              { name: 'LOT-2026-09A', count: Math.round(passCount * 0.48) },
              { name: 'LOT-2026-09B', count: Math.round(passCount * 0.32) },
              { name: 'LOT-2026-08F', count: Math.round(passCount * 0.20) },
            ],
            Rack: [
              { name: 'Rack R-01 (Infeed A)', count: Math.round(passCount * 0.40) },
              { name: 'Rack R-02 (Infeed B)', count: Math.round(passCount * 0.35) },
              { name: 'Rack R-03 (Passed Tray)', count: Math.round(passCount * 0.25) },
            ]
          }}
          extraActions={
            <button
              onClick={() => openTraceabilityModal('WP-2026-90412')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Scan className="w-3.5 h-3.5 text-sky-600" />
              <span>Trace Workpiece</span>
            </button>
          }
        />

        {/* MACHINE QUICK SWITCHER (Compact 9 FVMI Units Bar) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-sky-50/70 p-2.5 rounded-2xl border border-sky-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-sky-950 shrink-0 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-sky-600" />
              Select Machine:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {INITIAL_FULL_9_FVMI_FLEET.map((st) => {
                const isSelected = st.id === activeStationId;
                const mData = st.models[st.activeModelId] || st.models['504-2187'];
                const stTotal = Math.round(mData.baseInputPerHour * 7.5);
                const stPass = Math.round(stTotal * mData.passRatio);
                const stYield = stTotal > 0 ? ((stPass / stTotal) * 100).toFixed(1) : '0';

                return (
                  <button
                    key={st.id}
                    onClick={() => handleStationSelect(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-sky-100/60 border border-sky-200'
                    }`}
                  >
                    <span>{st.id}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : st.status === 'RUNNING' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className={`text-[10px] ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                      {stTotal.toLocaleString()} pcs ({stYield}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-sky-900">
            <span>Tech: <strong>{currentModelData.operatorName}</strong></span>
            <span className="text-sky-400">•</span>
            <span>Top Cam: <strong className="text-emerald-700">{machineFullData.cameraStatus.topCam}</strong></span>
            <span className="text-sky-400">•</span>
            <span>Side Cam: <strong className="text-emerald-700">{machineFullData.cameraStatus.sideCam}</strong></span>
            <span className="text-sky-400">•</span>
            <button
              onClick={() => navigate('fvmi')}
              className="text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer text-xs ml-1"
            >
              ← Fleet Overview
            </button>
          </div>
        </div>

        {/* SHIFT OPERATIONAL QUALITY & YIELD METRICS (4 CARDS MATCHING AOI) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="text-[11px] font-mono text-slate-500 uppercase font-bold">Total Inspected (In)</div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {totalUnits.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span>
            </div>
            <div className="text-[10px] text-sky-700 font-mono mt-1 font-bold">
              {currentModelData.hourlyData.length} Hourly Batches
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="text-[11px] font-mono text-slate-500 uppercase font-bold">Defective (Total NG)</div>
            <div className="text-2xl font-black font-mono text-rose-700 mt-1">
              {failCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span>
            </div>
            <div className="text-[10px] text-rose-600 font-mono mt-1 font-semibold truncate">
              XO: {xoutCount} | RW: {reworkCount} | DC: {discardCount}
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="text-[11px] font-mono text-slate-500 uppercase font-bold">Shift Yield Rate</div>
            <div className="text-2xl font-black font-mono text-sky-950 mt-1">
              {passRate}%
            </div>
            <div className="text-[10px] text-sky-700 font-mono mt-1 font-bold">
              Target &ge; 98.00%
            </div>
          </div>

          <div className="p-4 bg-[#b3e5fc]/30 border border-sky-300 rounded-2xl shadow-xs">
            <div className="text-[11px] font-mono text-sky-950 uppercase font-bold">Target UPH</div>
            <div className="text-2xl font-black font-mono text-sky-950 mt-1">
              {currentModelData.uph} <span className="text-xs font-normal text-sky-800">UPH</span>
            </div>
            <div className="text-[10px] text-sky-800 font-mono mt-1 font-bold truncate">
              Avg Cycle: 3.0s | Exp: {machineFullData.cameraStatus.exposureUs}μs
            </div>
          </div>
        </div>

        {/* HOURLY CHART & DEFECT PARETO (LINE CHART WITH VOLUME INTENSITY SCALE) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Single Clean Line Chart with Volume Intensity Scale */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-600" />
                  FVMI Hourly Output ({activeStationId})
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Inspected throughput per hour for Model {selectedModel} (07:00 - 18:00)
                </p>
              </div>

              {/* Volume Intensity Legend - Green for Pass Target, Yellow for Below Target */}
              <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4db6ac] border border-teal-700 shadow-2xs" />
                  <span className="text-[11px] text-emerald-900 font-bold">Pass Target (≥ {currentModelData.baseInputPerHour || 1200})</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fff176] border border-amber-400" />
                  <span className="text-[11px] text-amber-900 font-bold">Below Target (&lt; {currentModelData.baseInputPerHour || 1200})</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-0.5 bg-sky-600 rounded-full" />
                  <span className="text-[11px] text-slate-800 font-bold">UPH Line</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={currentModelData.hourlyData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="fvmiUphGrad" x1="0" y1="0" x2="0" y2="1">
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
                    domain={[0, 'auto']}
                  />
                  <ReferenceLine
                    y={currentModelData.baseInputPerHour || 1200}
                    stroke="#059669"
                    strokeDasharray="5 5"
                    label={{
                      value: `Target ${currentModelData.baseInputPerHour || 1200} UPH`,
                      position: 'insideTopRight',
                      fill: '#059669',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                    }}
                  />
                  <Tooltip
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as FvmiHourlySlot;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs font-mono space-y-1.5 border border-slate-700 min-w-[210px]">
                            <div className="font-bold border-b border-slate-700 pb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-sky-400">
                                <Clock className="w-3.5 h-3.5" />
                                {data.hour || data.hourShort}
                              </span>
                              <span className="text-[10px] bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800">
                                {data.runningModel}
                              </span>
                            </div>
                            <div className="text-sky-400 font-bold flex justify-between">
                              <span>Inspected:</span>
                              <span>{data.actualIn.toLocaleString()} pcs</span>
                            </div>
                            <div className="flex justify-between text-emerald-400">
                              <span>Total Good:</span>
                              <span>{data.passCount.toLocaleString()} pcs</span>
                            </div>
                            <div className="flex justify-between text-rose-400">
                              <span>Total NG:</span>
                              <span>{data.failCount.toLocaleString()} pcs</span>
                            </div>
                            <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1 flex justify-between">
                              <span>XO: {data.xoutCount} | RW: {data.reworkCount} | DC: {data.discardCount}</span>
                              <span className="text-emerald-400 font-bold">{data.yieldPercent}%</span>
                            </div>
                            <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                              Top Cam OK • Side Cam OK • Exp: {machineFullData.cameraStatus.exposureUs}μs
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="actualIn"
                    name="Inspected (UPH)"
                    stroke="#0284c7"
                    strokeWidth={3}
                    fill="url(#fvmiUphGrad)"
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      const target = currentModelData.baseInputPerHour || 1200;
                      const isPass = payload.actualIn >= target;
                      return (
                        <circle
                          key={`dot-fvmi-${payload.hourShort || payload.hour}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={isPass ? '#4db6ac' : '#fff176'}
                          stroke={isPass ? '#004d40' : '#b45309'}
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ r: 7, stroke: '#0284c7', strokeWidth: 2.5, fill: '#ffffff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right 1 Col: Defect Distribution Pareto Progress */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-mono font-black text-sm text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-sky-600" />
                  Hourly Defect Distribution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shift Total NG: {failCount} pcs (XO: {xoutCount}, RW: {reworkCount}, DC: {discardCount})
                </p>
              </div>

              <div className="space-y-3.5">
                {/* Defect 1: X-Out */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="font-semibold text-slate-700">X-Out (Die Reject)</span>
                    <span className="text-sky-700 font-bold">
                      {xoutCount} pcs ({xoutRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, Number(xoutRate) * 12))}%` }}
                    />
                  </div>
                </div>

                {/* Defect 2: Rework Required */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="font-semibold text-slate-700">Rework Required</span>
                    <span className="text-amber-700 font-bold">
                      {reworkCount} pcs ({reworkRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, Number(reworkRate) * 12))}%` }}
                    />
                  </div>
                </div>

                {/* Defect 3: Discard / Scrap */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="font-semibold text-slate-700">Discard / Scrap</span>
                    <span className="text-rose-700 font-bold">
                      {discardCount} pcs ({discardRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, Number(discardRate) * 15))}%` }}
                    />
                  </div>
                </div>

                {/* Defect 4: Foreign Contamination */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="font-semibold text-slate-700">Foreign Contamination</span>
                    <span className="text-sky-800 font-bold">
                      {Math.max(1, Math.round(failCount * 0.14))} pcs (14.0%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-600 h-full rounded-full transition-all duration-500"
                      style={{ width: '14%' }}
                    />
                  </div>
                </div>

                {/* Defect 5: Surface Scratch / Blemish */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="font-semibold text-slate-700">Surface Scratch / Blemish</span>
                    <span className="text-sky-700 font-bold">
                      {Math.max(1, Math.round(failCount * 0.12))} pcs (12.0%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full transition-all duration-500"
                      style={{ width: '12%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Standard: IPC-A-610 Class 3</span>
              <span>100% Visual Verified</span>
            </div>
          </div>
        </div>

        {/* FULL HOURLY FVMI INSPECTION RECORDS TABLE (MATCHING AOI) */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-mono font-black text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                Hourly FVMI Inspection Records ({activeStationId} — Model {selectedModel})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive hourly visual inspection log (07:00 - 18:00) with defect breakdown and pass rates
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const headers = ['Hour Slot', 'Target', 'Actual In', 'Pass', 'Fail', 'X-Out', 'Rework', 'Discard', 'Yield %'];
                  const rows = [
                    headers,
                    ...currentModelData.hourlyData.map((s) => [
                      s.hour,
                      s.targetUph.toString(),
                      s.actualIn.toString(),
                      s.passCount.toString(),
                      s.failCount.toString(),
                      s.xoutCount.toString(),
                      s.reworkCount.toString(),
                      s.discardCount.toString(),
                      s.yieldPercent.toString() + '%'
                    ])
                  ];
                  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `FVMI_${activeStationId}_Model_${selectedModel}_Hourly_Records.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#f8fafc] hover:bg-[#e2e8f0] text-slate-700 border border-[#cbd5e1] flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Hour Slot</th>
                  <th className="py-3 px-3 text-right">Target</th>
                  <th className="py-3 px-3 text-right">Inspected</th>
                  <th className="py-3 px-3 text-right text-emerald-700">Good</th>
                  <th className="py-3 px-3 text-right text-rose-700">NG</th>
                  <th className="py-3 px-3 text-right text-amber-700">XO / RW / DC</th>
                  <th className="py-3 px-3 text-right">Yield</th>
                  <th className="py-3 px-3 text-center">Optical Telemetry</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currentModelData.hourlyData.map((slot, idx) => {
                  const isHighDefect = slot.failCount > 5;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{slot.hour}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{slot.targetUph}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">{slot.actualIn.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectionPopup({
                              stationName: activeStationId,
                              stationType: 'FVMI',
                              hourSlot: slot.hour,
                              jobNo: `JOB-${selectedModel}-${slot.hour.split(' ')[0].replace(':', '')}`,
                              product: selectedModel,
                              side: 'TOP/BOT',
                              category: 'GOOD',
                              count: slot.passCount
                            });
                          }}
                          className="font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/70 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view Good / Pass units (JOB NO, PRODUCT, SIDE, Details)"
                        >
                          {slot.passCount.toLocaleString()}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectionPopup({
                              stationName: activeStationId,
                              stationType: 'FVMI',
                              hourSlot: slot.hour,
                              jobNo: `JOB-${selectedModel}-${slot.hour.split(' ')[0].replace(':', '')}`,
                              product: selectedModel,
                              side: 'TOP/BOT',
                              category: 'NG',
                              count: slot.failCount
                            });
                          }}
                          className="font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-100/70 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view NG / Defect units (JOB NO, PRODUCT, SIDE, NG Details)"
                        >
                          {slot.failCount.toLocaleString()}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectionPopup({
                              stationName: activeStationId,
                              stationType: 'FVMI',
                              hourSlot: slot.hour,
                              jobNo: `JOB-${selectedModel}-${slot.hour.split(' ')[0].replace(':', '')}`,
                              product: selectedModel,
                              side: 'TOP/BOT',
                              category: 'XOUT',
                              count: slot.xoutCount
                            });
                          }}
                          className="text-amber-700 font-semibold hover:underline hover:bg-amber-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view X-Out units (JOB NO, PRODUCT, SIDE, X-out reason)"
                        >
                          {slot.xoutCount}
                        </button>
                        <span className="text-slate-300 mx-1">/</span>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectionPopup({
                              stationName: activeStationId,
                              stationType: 'FVMI',
                              hourSlot: slot.hour,
                              jobNo: `JOB-${selectedModel}-${slot.hour.split(' ')[0].replace(':', '')}`,
                              product: selectedModel,
                              side: 'TOP/BOT',
                              category: 'REWORK',
                              count: slot.reworkCount
                            });
                          }}
                          className="text-sky-700 font-semibold hover:underline hover:bg-sky-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view Rework units"
                        >
                          {slot.reworkCount}
                        </button>
                        <span className="text-slate-300 mx-1">/</span>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectionPopup({
                              stationName: activeStationId,
                              stationType: 'FVMI',
                              hourSlot: slot.hour,
                              jobNo: `JOB-${selectedModel}-${slot.hour.split(' ')[0].replace(':', '')}`,
                              product: selectedModel,
                              side: 'TOP/BOT',
                              category: 'DISCARD',
                              count: slot.discardCount
                            });
                          }}
                          className="text-rose-700 font-semibold hover:underline hover:bg-rose-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view Discard units"
                        >
                          {slot.discardCount}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-700">{slot.yieldPercent}%</td>
                      <td className="py-2.5 px-3 text-center text-[10px] text-slate-500">
                        Exp {machineFullData.cameraStatus.exposureUs}μs • Light {machineFullData.cameraStatus.coaxialLight}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isHighDefect
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isHighDefect ? 'WATCH' : 'NORMAL'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-200">
                {(() => {
                  const totalTarget = currentModelData.hourlyData.reduce((acc, s) => acc + s.targetUph, 0);
                  const totalIn = currentModelData.hourlyData.reduce((acc, s) => acc + s.actualIn, 0);
                  const totalPass = currentModelData.hourlyData.reduce((acc, s) => acc + s.passCount, 0);
                  const totalFail = currentModelData.hourlyData.reduce((acc, s) => acc + s.failCount, 0);
                  const totalXout = currentModelData.hourlyData.reduce((acc, s) => acc + s.xoutCount, 0);
                  const totalRework = currentModelData.hourlyData.reduce((acc, s) => acc + s.reworkCount, 0);
                  const totalDiscard = currentModelData.hourlyData.reduce((acc, s) => acc + s.discardCount, 0);
                  const avgYield = totalIn > 0 ? ((totalPass / totalIn) * 100).toFixed(2) : '100.00';

                  return (
                    <tr>
                      <td className="py-2.5 px-4">TOTAL FOR {selectedModel}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{totalTarget.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-black">{totalIn.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectionPopup({
                              stationName: activeStationId,
                              stationType: 'FVMI',
                              hourSlot: 'Shift Total (07:00 - 18:00)',
                              jobNo: `JOB-${selectedModel}-SHIFT`,
                              product: selectedModel,
                              side: 'TOP/BOT',
                              category: 'GOOD',
                              count: totalPass
                            });
                          }}
                          className="font-bold text-emerald-800 hover:underline hover:bg-emerald-200/60 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view all Good units for shift"
                        >
                          {totalPass.toLocaleString()}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectionPopup({
                              stationName: activeStationId,
                              stationType: 'FVMI',
                              hourSlot: 'Shift Total (07:00 - 18:00)',
                              jobNo: `JOB-${selectedModel}-SHIFT`,
                              product: selectedModel,
                              side: 'TOP/BOT',
                              category: 'NG',
                              count: totalFail
                            });
                          }}
                          className="font-bold text-rose-800 hover:underline hover:bg-rose-200/60 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view all NG units for shift"
                        >
                          {totalFail.toLocaleString()}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectionPopup({
                              stationName: activeStationId,
                              stationType: 'FVMI',
                              hourSlot: 'Shift Total (07:00 - 18:00)',
                              jobNo: `JOB-${selectedModel}-SHIFT`,
                              product: selectedModel,
                              side: 'TOP/BOT',
                              category: 'XOUT',
                              count: totalXout
                            });
                          }}
                          className="text-amber-800 font-semibold hover:underline hover:bg-amber-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view all X-Out units for shift"
                        >
                          {totalXout}
                        </button>
                        <span className="text-slate-300 mx-1">/</span>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectionPopup({
                              stationName: activeStationId,
                              stationType: 'FVMI',
                              hourSlot: 'Shift Total (07:00 - 18:00)',
                              jobNo: `JOB-${selectedModel}-SHIFT`,
                              product: selectedModel,
                              side: 'TOP/BOT',
                              category: 'REWORK',
                              count: totalRework
                            });
                          }}
                          className="text-sky-800 font-semibold hover:underline hover:bg-sky-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view all Rework units for shift"
                        >
                          {totalRework}
                        </button>
                        <span className="text-slate-300 mx-1">/</span>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectionPopup({
                              stationName: activeStationId,
                              stationType: 'FVMI',
                              hourSlot: 'Shift Total (07:00 - 18:00)',
                              jobNo: `JOB-${selectedModel}-SHIFT`,
                              product: selectedModel,
                              side: 'TOP/BOT',
                              category: 'DISCARD',
                              count: totalDiscard
                            });
                          }}
                          className="text-rose-800 font-semibold hover:underline hover:bg-rose-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view all Discard units for shift"
                        >
                          {totalDiscard}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-800">{avgYield}%</td>
                      <td className="py-2.5 px-3 text-center text-[10px] text-slate-500">Auto Calibrated</td>
                      <td className="py-2.5 px-3 text-center text-emerald-800">PASSED</td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </div>

        {/* Inspected Panel History & Model Performance Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Inspected Panels Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <span>Inspected Panel History ({activeStationId} • {selectedModel})</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                Live Vision Stream
              </span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase font-sans">
                    <th className="pb-2.5">Time</th>
                    <th className="pb-2.5">Panel ID</th>
                    <th className="pb-2.5 text-center">Side</th>
                    <th className="pb-2.5">Defects</th>
                    <th className="pb-2.5 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs divide-y divide-slate-100">
                  {currentModelData.recentPanels.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 text-slate-500">{p.time}</td>
                      <td className="py-2.5 font-bold text-slate-900">
                        <button
                          onClick={() => openTraceabilityModal(p.panelId)}
                          className="text-sky-700 hover:text-sky-900 hover:underline inline-flex items-center gap-1 cursor-pointer font-bold"
                          title="Click to Trace Workpiece Station Lineage"
                        >
                          <Scan className="w-3 h-3 text-sky-500" />
                          <span>{p.panelId}</span>
                        </button>
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                            p.side === 'TOP'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {p.side || 'TOP'}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500 font-bold">{p.defects}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            p.status === 'PASS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'REWORK'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Comparison Breakdown for this Station */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-sky-600" /> Model Performance Breakdown ({activeStationId})
              </h3>
              <div className="flex flex-wrap gap-3 font-mono text-[10px] uppercase font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                  <span>Pass</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                  <span>X-Out</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-sky-500 rounded-full"></div>
                  <span>Rework</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div>
                  <span>Discard</span>
                </div>
              </div>
            </div>

            {/* Horizontal Distribution Bars per Model */}
            <div className="flex flex-col gap-3 py-2 font-mono">
              {FVMI_SUPPORTED_MODELS.map((mKey) => {
                const isCurrent = mKey === selectedModel;
                const mData = machineFullData.models[mKey] || machineFullData.models['504-2187'];
                const mTotal = Math.round(mData.baseInputPerHour * 7.5);
                const mPass = Math.round(mTotal * mData.passRatio);
                const mPassPct = (mData.passRatio * 100).toFixed(1);
                const mXoutPct = (mData.xoutRatio * 100).toFixed(1);
                const mReworkPct = (mData.reworkRatio * 100).toFixed(1);
                const mDiscardPct = (mData.discardRatio * 100).toFixed(1);

                return (
                  <div
                    key={mKey}
                    onClick={() => setSelectedModel(mKey)}
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-2.5 rounded-xl cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-sky-50/80 ring-2 ring-sky-500/30 border border-sky-300'
                        : 'hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <div className="w-32 flex items-center justify-between sm:justify-start gap-1.5">
                      <span className={`text-xs font-bold ${isCurrent ? 'text-sky-900 font-black' : 'text-slate-700'}`}>
                        {mKey}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] bg-sky-600 text-white px-1.5 py-0.2 rounded font-sans font-bold">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="w-full flex-grow flex h-7 rounded-lg overflow-hidden bg-slate-100">
                      <div
                        className="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300"
                        style={{ width: `${mPassPct}%` }}
                        title={`Pass: ${mPassPct}%`}
                      >
                        {mPass}
                      </div>
                      <div
                        className="bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300"
                        style={{ width: `${mXoutPct}%` }}
                        title={`X-Out: ${mXoutPct}%`}
                      />
                      <div
                        className="bg-sky-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300"
                        style={{ width: `${mReworkPct}%` }}
                        title={`Rework: ${mReworkPct}%`}
                      />
                      <div
                        className="bg-rose-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300"
                        style={{ width: `${mDiscardPct}%` }}
                        title={`Discard: ${mDiscardPct}%`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Inspection Detail Breakdown Popup (JOB NO, PRODUCT, SIDE, NG) */}
      <InspectionDetailModal
        isOpen={!!inspectionPopup}
        onClose={() => setInspectionPopup(null)}
        data={inspectionPopup}
      />
    </div>
  );
};
