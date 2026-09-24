import React, { useState, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
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
  Clock,
  Sparkles,
  ArrowLeft,
  Layers,
  Thermometer,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ChevronRight,
  Maximize2,
  X,
  Barcode,
  Activity,
  Gauge
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
  MachineRunSummary,
  ModelRunDetail
} from '../data/machineModelData';
import { MachineModelDrilldownModal } from './MachineModelDrilldownModal';

interface ThermalAllFleetChartProps {
  processType: 'Vacuum' | 'Bake' | 'Thermal-All' | 'FVMI' | 'AOI' | 'X-ray';
  units: OvenUnit[];
  selectedUnitId?: string;
  onSelectUnit?: (id: string) => void;
  onBackToFleet?: () => void;
  openTraceabilityModal?: (id: string) => void;
}

// Distinct model master palette matching Dispensing
const MASTER_THERMAL_MODELS: Record<string, { id: string; name: string; color: string }> = {
  '504-2187': { id: '504-2187', name: 'Model 504-2187 (Logic Core)', color: '#0284c7' }, // Sky Blue
  '504-2154': { id: '504-2154', name: 'Model 504-2154 (RF Module)', color: '#059669' }, // Emerald
  '504-2224': { id: '504-2224', name: 'Model 504-2224 (Power Board)', color: '#d97706' }, // Amber
  '504-2268': { id: '504-2268', name: 'Model 504-2268 (Sensor Hub)', color: '#7c3aed' }, // Purple
  '504-2454': { id: '504-2454', name: 'Model 504-2454 (MCU Core)', color: '#e11d48' }, // Rose
  '504-2090': { id: '504-2090', name: 'Model 504-2090 (Base Controller)', color: '#475569' } // Slate
};

const DEFAULT_COLORS = ['#0284c7', '#059669', '#d97706', '#7c3aed', '#e11d48', '#475569'];

export const ThermalAllFleetChart: React.FC<ThermalAllFleetChartProps> = ({
  processType,
  units,
  selectedUnitId = 'ALL',
  onSelectUnit,
  openTraceabilityModal
}) => {
  const [viewUnit, setViewUnit] = useState<'boards' | 'magazines'>('boards');
  const [viewMode, setViewMode] = useState<'fleet-total' | 'detailed-breakdown'>('fleet-total');
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedSlotForLotModal, setSelectedSlotForLotModal] = useState<MachineRunSummary | null>(null);

  // Timer ref for double-click detection
  const lastClickRef = useRef<{ hour: string; time: number } | null>(null);

  // Compute hourly slots map for each unit
  const unitsHourlyMap = useMemo(() => {
    const map = new Map<string, OvenHourlySlot[]>();
    units.forEach((u) => {
      map.set(u.id, computeOvenHourlyData(u));
    });
    return map;
  }, [units]);

  // Aggregate hourly data across all units
  const unifiedHourlyData = useMemo(() => {
    return OVEN_SHIFT_HOURS.map((hour, index) => {
      const nextHour = (parseInt(hour.split(':')[0], 10) + 1).toString().padStart(2, '0') + ':00';
      const timeRange = `${hour} - ${nextHour}`;

      let totalMagazines = 0;
      let totalBoards = 0;
      let targetMagazines = 0;
      let targetBoards = 0;

      const unitBreakdown: {
        unitId: string;
        unitName: string;
        mag: number;
        boards: number;
        status: string;
        modelName?: string;
        modelId?: string;
        tempCelsius?: number;
        pressurePa?: number;
        program?: string;
        yieldPercent?: number;
        voidPercent?: number;
        tubeKv?: number;
      }[] = [];

      const modelAccumulator: Record<
        string,
        { modelId: string; modelName: string; countPcs: number; countMag: number; color: string }
      > = {};

      units.forEach((u, uIdx) => {
        const slots = unitsHourlyMap.get(u.id) || [];
        const slot = slots[index];
        const summary = getMachineRunSummary(u.id, u.name, processType);
        const modelDetail = summary ? getHourlyModelDetails(summary, hour) : null;

        const boardsVal = slot ? slot.totalUph : 0;
        const magVal = slot ? slot.magazinesPerHour : 0;
        const defaultTarget =
          processType === 'Vacuum'
            ? 600
            : processType === 'AOI'
            ? 1150
            : processType === 'X-ray'
            ? 130
            : processType === 'FVMI'
            ? 1100
            : 250;
        const tgtBrd = slot ? slot.targetUph : defaultTarget;
        const tgtMag = slot ? slot.targetMagazinesPerHour : (processType === 'X-ray' ? 2 : 6);

        totalBoards += boardsVal;
        totalMagazines += magVal;
        targetBoards += tgtBrd;
        targetMagazines += tgtMag;

        const mId = modelDetail?.modelId || u.runningModel || '504-2187';
        const mInfo = MASTER_THERMAL_MODELS[mId];
        const mName = mInfo?.name || modelDetail?.modelName || `Model ${mId}`;
        const color = mInfo?.color || DEFAULT_COLORS[uIdx % DEFAULT_COLORS.length];

        unitBreakdown.push({
          unitId: u.id,
          unitName: u.name,
          mag: magVal,
          boards: boardsVal,
          status: u.status,
          modelName: mName,
          modelId: mId,
          tempCelsius: u.tempCelsius,
          pressurePa: u.pressurePa,
          program: u.program,
          yieldPercent: u.yieldPercent,
          voidPercent: u.voidPercent,
          tubeKv: u.tubeKv
        });

        if (!modelAccumulator[mId]) {
          modelAccumulator[mId] = {
            modelId: mId,
            modelName: mName,
            countPcs: 0,
            countMag: 0,
            color
          };
        }
        modelAccumulator[mId].countPcs += boardsVal;
        modelAccumulator[mId].countMag += magVal;
      });

      const actualVal = viewUnit === 'magazines' ? totalMagazines : totalBoards;
      const targetVal = viewUnit === 'magazines' ? targetMagazines : targetBoards;
      const isHigh = actualVal >= targetVal;
      const efficiency = targetVal > 0 ? Math.round((actualVal / targetVal) * 100) : 100;

      // Flatten dynamic model keys for stacked bars (e.g. model_504_2187)
      const dynamicModelProps: Record<string, number> = {};
      Object.entries(modelAccumulator).forEach(([mId, val]) => {
        const key = `model_${mId.replace(/-/g, '_')}`;
        dynamicModelProps[key] = viewUnit === 'magazines' ? val.countMag : val.countPcs;
      });

      return {
        hourShort: hour,
        hour,
        timeRange,
        totalOutput: actualVal,
        totalBoards,
        totalMagazines,
        targetBoards,
        targetMagazines,
        actualVal,
        targetVal,
        efficiencyPercent: efficiency,
        isHigh,
        unitsBreakdown: unitBreakdown,
        modelsBreakdown: Object.values(modelAccumulator).map((m) => ({
          modelId: m.modelId,
          modelName: m.modelName,
          count: viewUnit === 'magazines' ? m.countMag : m.countPcs,
          countPcs: m.countPcs,
          countMag: m.countMag,
          color: m.color,
          sharePercent:
            actualVal > 0
              ? Math.round(((viewUnit === 'magazines' ? m.countMag : m.countPcs) / actualVal) * 100)
              : 0
        })),
        ...dynamicModelProps
      };
    });
  }, [units, unitsHourlyMap, processType, viewUnit]);

  // Overall totals
  const totalFleetBoards = useMemo(() => {
    return units.reduce((acc, u) => acc + (u.pcsCount || 1150), 0);
  }, [units]);

  const totalFleetMagazines = useMemo(() => {
    return units.reduce((acc, u) => acc + (u.magazinesCount || 20), 0);
  }, [units]);

  const runningCount = units.filter((u) => u.status === 'RUNNING').length;

  const fleetYield = useMemo(() => {
    const totalTgt = unifiedHourlyData.reduce((acc, d) => acc + d.targetBoards, 0);
    return totalTgt > 0 ? ((totalFleetBoards / totalTgt) * 100).toFixed(1) : '99.2';
  }, [totalFleetBoards, unifiedHourlyData]);

  // Currently active hour data
  const activeHourlyPoint = useMemo(() => {
    if (selectedHour) {
      const match = unifiedHourlyData.find((d) => d.hourShort === selectedHour);
      if (match) return match;
    }
    // Default to last populated hour
    return unifiedHourlyData[unifiedHourlyData.length - 1] || unifiedHourlyData[0];
  }, [unifiedHourlyData, selectedHour]);

  // Active selected model in detailed view
  const activeModelMeta = useMemo(() => {
    if (!selectedModelId) return null;
    return MASTER_THERMAL_MODELS[selectedModelId] || {
      id: selectedModelId,
      name: `Model ${selectedModelId}`,
      color: '#0284c7'
    };
  }, [selectedModelId]);

  const activeModelBreakdownInHour = useMemo(() => {
    if (!selectedModelId || !activeHourlyPoint) return null;
    return activeHourlyPoint.modelsBreakdown.find((m) => m.modelId === selectedModelId) || null;
  }, [selectedModelId, activeHourlyPoint]);

  // All distinct models active in the shift
  const allShiftModels = useMemo(() => {
    const map = new Map<string, { modelId: string; modelName: string; color: string; totalPcs: number }>();
    unifiedHourlyData.forEach((h) => {
      h.modelsBreakdown.forEach((m) => {
        if (!map.has(m.modelId)) {
          map.set(m.modelId, {
            modelId: m.modelId,
            modelName: m.modelName,
            color: m.color,
            totalPcs: 0
          });
        }
        map.get(m.modelId)!.totalPcs += m.countPcs;
      });
    });
    return Array.from(map.values());
  }, [unifiedHourlyData]);

  // Y-axis max calculation
  const yAxisMax = useMemo(() => {
    const maxVal = Math.max(...unifiedHourlyData.map((d) => d.actualVal), 1);
    if (viewUnit === 'magazines') {
      return Math.max(10, Math.ceil(maxVal * 1.25));
    }
    return Math.max(processType === 'Vacuum' ? 1200 : 1500, Math.ceil(maxVal * 1.25));
  }, [unifiedHourlyData, viewUnit, processType]);

  // Target benchmark
  const targetRef = useMemo(() => {
    return viewUnit === 'magazines'
      ? unifiedHourlyData[0]?.targetMagazines || (processType === 'Vacuum' ? 12 : 20)
      : unifiedHourlyData[0]?.targetBoards || (processType === 'Vacuum' ? 1200 : 1300);
  }, [unifiedHourlyData, viewUnit, processType]);

  // Handle single click vs double click on chart bars
  const handleBarClick = (hourShort: string) => {
    const now = Date.now();
    if (
      lastClickRef.current &&
      lastClickRef.current.hour === hourShort &&
      now - lastClickRef.current.time < 350
    ) {
      // Double Click -> switch to detailed model breakdown
      handleOpenDetailedGraph(hourShort);
      lastClickRef.current = null;
      return;
    }
    lastClickRef.current = { hour: hourShort, time: now };
    // Single Click -> selects hour and turns it dark navy blue (#1e3a8a)
    setSelectedHour(hourShort);
  };

  const handleOpenDetailedGraph = (hourShort?: string) => {
    const target = hourShort || selectedHour || '08:00';
    setSelectedHour(target);
    setViewMode('detailed-breakdown');
    setSelectedModelId(null);
  };

  const handleBackToMain = () => {
    setViewMode('fleet-total');
    setSelectedModelId(null);
  };

  const handleSelectColor = (hourShort: string, modelId: string) => {
    setSelectedHour(hourShort);
    setSelectedModelId(modelId);
  };

  const isVacuum = processType === 'Vacuum';
  const isAOI = processType === 'AOI';
  const isXray = processType === 'X-ray';
  const isFVMI = processType === 'FVMI';
  const processLabel = isVacuum
    ? 'Vacuum Chambers'
    : isAOI
    ? 'AOI Stations'
    : isXray
    ? 'X-Ray Units'
    : isFVMI
    ? 'FVMI Stations'
    : 'Bake Ovens';

  return (
    <div className="space-y-4 font-sans">
      {/* ========================================================================= */}
      {/* 1. SIMPLE & CLEAN STATS STRIP (IDENTICAL TO DISPENSING)                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-slate-700">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-slate-400 font-medium">ยอดผลิตรวมทุกเครื่อง</div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {(viewUnit === 'boards' ? totalFleetBoards : totalFleetMagazines).toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">
                {viewUnit === 'boards' ? 'boards' : 'magazines'}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div>
            <div className="text-xs text-slate-400 font-medium">Fleet Yield / Efficiency</div>
            <div className="text-xl font-bold text-emerald-600 font-mono">
              {fleetYield}%
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div>
            <div className="text-xs text-slate-400 font-medium">สถานะเครื่องจักร</div>
            <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>พร้อมทำงาน {runningCount} / {units.length} เครื่อง</span>
            </div>
          </div>
        </div>

        {/* View Mode Indicator / Switcher & Unit Toggle */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Unit Toggle: Mag vs Boards */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 font-mono font-bold">
            <button
              onClick={() => setViewUnit('boards')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewUnit === 'boards'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Boards
            </button>
            <button
              onClick={() => setViewUnit('magazines')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewUnit === 'magazines'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mag
            </button>
          </div>

          {viewMode === 'detailed-breakdown' ? (
            <button
              onClick={handleBackToMain}
              className="px-3.5 py-1.5 rounded-xl font-bold bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs group"
            >
              <ArrowLeft className="w-4 h-4 text-sky-700 group-hover:-translate-x-1 transition-transform" />
              <span>ย้อนกลับไปกราฟหลัก (Total Output)</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenDetailedGraph(selectedHour || '08:00')}
              className="px-3.5 py-1.5 rounded-xl font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>ดูกราฟแยกสีโมเดล</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE: 2-COLUMN SPLIT (แบ่งเหมือน DISPENSING 100%)              */}
      {/* ========================================================================= */}
      {viewMode === 'fleet-total' ? (
        /* ========================================================================= */
        /* MODE A: PRIMARY GRAPH (กราฟหลัก: TOTAL OUTPUT รวมก่อน)                     */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start animate-in fade-in duration-200">
          {/* LEFT COLUMN (lg:col-span-7): THE CLEAN SINGLE-COLOR BAR CHART */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            {/* Chart Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  ยอดผลิตรวมรายชั่วโมง (Total Fleet Output)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  คลิกแท่งเพื่อเลือก (เปลี่ยนเป็นสีน้ำเงินเข้ม) • ดับเบิ้ลคลิกเพื่อเปิดดูกราฟแยกสีโมเดล
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">ชั่วโมงที่เลือก: </span>
                <strong className={`text-sm font-mono ${selectedHour ? 'text-blue-900 font-bold' : 'text-slate-500'}`}>
                  {selectedHour || 'ยังไม่ได้เลือก'}
                </strong>
              </div>
            </div>

            {/* Selection Guidance */}
            <div className="text-xs text-slate-500 py-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-700" />
                <span>
                  {selectedHour
                    ? `แท่งที่เลือกเป็นสีน้ำเงินเข้ม (${selectedHour})`
                    : 'คลิกที่แท่งชั่วโมงบนกราฟเพื่อเลือกดูข้อมูล'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                ดับเบิ้ลคลิกที่แท่งเพื่อดูกราฟแยกโมเดล
              </span>
            </div>

            {/* The Clean Bar Chart */}
            <div className="h-[340px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={unifiedHourlyData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length) {
                      const hour = e.activePayload[0].payload.hourShort;
                      handleBarClick(hour);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis
                    dataKey="hourShort"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, yAxisMax]}
                  />

                  {/* Subtle Target Line */}
                  <ReferenceLine
                    y={targetRef}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Target: ${targetRef.toLocaleString()}`,
                      position: 'insideTopRight',
                      fill: '#10b981',
                      fontSize: 10
                    }}
                  />

                  {/* Minimalist Tooltip */}
                  <Tooltip
                    cursor={{ fill: 'rgba(2, 132, 199, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const point = payload[0].payload;
                        const isThisSelected = selectedHour === point.hourShort;
                        return (
                          <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 pointer-events-none min-w-[180px]">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-semibold">
                              <span>{point.hour}</span>
                              <span className="text-emerald-400 font-mono">
                                {point.totalOutput} {viewUnit === 'boards' ? 'boards' : 'mag'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-300">
                              เป้าหมาย: {targetRef.toLocaleString()} {viewUnit === 'boards' ? 'boards' : 'mag'} ({((point.totalOutput / targetRef) * 100).toFixed(0)}%)
                            </div>
                            <div className="text-[10px] text-sky-300 pt-0.5">
                              {isThisSelected
                                ? 'ดับเบิ้ลคลิกเพื่อเปิดกราฟแยกสีโมเดล'
                                : 'คลิกเพื่อเลือกแท่งนี้ (สีน้ำเงินเข้ม)'}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* SINGLE BLUE BARS: Turns dark blue ONLY when clicked/positioned on that graph */}
                  <Bar
                    dataKey="totalOutput"
                    radius={[5, 5, 0, 0]}
                    cursor="pointer"
                    onClick={(entryData: any) => {
                      if (entryData && entryData.hourShort) {
                        handleBarClick(entryData.hourShort);
                      }
                    }}
                  >
                    {unifiedHourlyData.map((entry) => {
                      const isClicked = selectedHour === entry.hourShort;
                      return (
                        <Cell
                          key={`single-${entry.hourShort}`}
                          fill={isClicked ? '#1e3a8a' : '#7dd3fc'}
                          stroke={isClicked ? '#0f172a' : 'none'}
                          strokeWidth={isClicked ? 2 : 0}
                          fillOpacity={isClicked ? 1 : selectedHour ? 0.6 : 0.85}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT COLUMN (lg:col-span-5): OUTPUT รวมก่อน (TOTAL OUTPUT FIRST) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            {/* Header of Info Card */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-400">ข้อมูลยอดผลิตรวม (Total Output)</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedHour ? `ช่วงเวลา ${activeHourlyPoint.hour}` : 'ภาพรวมทั้ง Fleet'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">
                  {selectedHour ? 'ยอดผลิตชั่วโมงนี้' : 'ยอดผลิตรวมทั้งหมด'}
                </div>
                <div className="font-bold text-slate-900 text-sm font-mono">
                  {selectedHour
                    ? `${activeHourlyPoint.totalOutput.toLocaleString()} ${viewUnit === 'boards' ? 'boards' : 'mag'}`
                    : `${(viewUnit === 'boards' ? totalFleetBoards : totalFleetMagazines).toLocaleString()} ${viewUnit === 'boards' ? 'boards' : 'mag'}`}
                </div>
              </div>
            </div>

            {/* Total Output Card */}
            <div className="bg-sky-50/70 rounded-2xl border border-sky-200/90 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-sky-950 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                  <span>ยอดผลิตรวม (Total Output)</span>
                </span>
                <span className="font-mono text-[11px] font-bold text-sky-800 bg-white px-2 py-0.5 rounded-md border border-sky-300/60 shadow-2xs">
                  {units.length} เครื่องออนไลน์
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {selectedHour ? `ยอดผลิตชั่วโมง ${activeHourlyPoint.hour}` : 'ยอดผลิตสะสมทั้งวัน'}
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                    {selectedHour
                      ? activeHourlyPoint.totalOutput.toLocaleString()
                      : (viewUnit === 'boards' ? totalFleetBoards : totalFleetMagazines).toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-500 font-sans">
                      {viewUnit === 'boards' ? 'boards' : 'mag'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500 font-medium">เป้าหมาย (Fleet Target)</div>
                  <div className="text-base font-bold font-mono text-emerald-600">
                    {targetRef.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-500 font-sans">
                      {viewUnit === 'boards' ? 'boards' : 'mag'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (activeHourlyPoint.totalOutput / targetRef) * 100
                      )}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>ความคืบหน้า</span>
                  <span>{((activeHourlyPoint.totalOutput / targetRef) * 100).toFixed(1)}% ของเป้าหมาย</span>
                </div>
              </div>
            </div>

            {/* Production Breakdown by Sub-station / Chamber / Oven: Display Only, Clean & Beautiful */}
            <div className="space-y-2.5 pointer-events-none select-none">
              <div className="text-xs font-semibold text-slate-800 flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                  <span>
                    {isVacuum
                      ? 'ยอดผลิตแบ่งตาม Chamber (Chamber Output)'
                      : isAOI
                      ? 'ยอดผลิตแบ่งตามเครื่อง AOI (AOI Units Output)'
                      : isXray
                      ? 'ยอดผลิตแบ่งตามเครื่อง X-Ray (X-Ray Output)'
                      : isFVMI
                      ? 'ยอดผลิตแบ่งตามสถานี FVMI (FVMI Stations Output)'
                      : 'ยอดผลิตแบ่งตามเตาอบ (Oven Line Output)'}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    รวม {units.length} {processLabel}
                  </span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                    แสดงผลเท่านั้น
                  </span>
                </div>
              </div>

              {isVacuum || isAOI ? (
                /* 2 Units: Vacuum Chambers or AOI Machines - Beautiful, Spacious Cards */
                <div className="space-y-2">
                  {activeHourlyPoint.unitsBreakdown.map((u, idx) => {
                    const isUnitRunning = u.status === 'RUNNING';
                    const outputVal = viewUnit === 'boards' ? u.boards : u.mag;
                    const totalVal = Math.max(1, activeHourlyPoint.totalOutput);
                    const sharePercent = Math.min(100, Math.round((outputVal / totalVal) * 100));

                    return (
                      <div
                        key={u.unitId}
                        className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 shadow-2xs flex items-center justify-between gap-3"
                      >
                        {/* Unit Identity & Telemetry */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-2xs">
                            0{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {u.unitName}
                              </span>
                              <div className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold flex items-center gap-1 shrink-0 border ${
                                isUnitRunning
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                  : 'bg-rose-50 text-rose-700 border-rose-200/80'
                              }`}>
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isUnitRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                  }`}
                                />
                                <span>{isUnitRunning ? 'RUNNING' : 'STOPPED'}</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span className="bg-white px-1.5 py-0.2 rounded border border-slate-200 font-medium text-slate-700">
                                {u.modelId}
                              </span>
                              <span>•</span>
                              {isAOI ? (
                                <span className="text-emerald-700 font-medium">{u.yieldPercent || (idx === 0 ? 99.8 : 99.6)}% Yield (3D Optical)</span>
                              ) : (
                                <span>
                                  <strong className="text-sky-700 font-medium">{u.pressurePa || 0.45} Pa</strong>
                                  <span className="mx-1">•</span>
                                  <strong className="text-amber-700 font-medium">{u.tempCelsius || 180}°C</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Output Numbers & Share Progress */}
                        <div className="text-right shrink-0 min-w-[90px]">
                          <div className="font-bold font-mono text-sm text-slate-900">
                            {outputVal.toLocaleString()}{' '}
                            <span className="text-[10px] font-normal text-slate-500 font-sans">
                              {viewUnit === 'boards' ? 'boards' : 'mag'}
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-1.5 mt-0.5">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${sharePercent}%` }}
                                className="h-full bg-sky-600 rounded-full"
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {sharePercent}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : isXray ? (
                /* X-Ray 6 Machines: Clean 2-column grid - Display only */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeHourlyPoint.unitsBreakdown.map((u, idx) => {
                    const isUnitRunning = u.status === 'RUNNING';
                    const outputVal = viewUnit === 'boards' ? u.boards : u.mag;

                    return (
                      <div
                        key={u.unitId}
                        className="px-3 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 shadow-2xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-[10px] shrink-0 tracking-wider shadow-2xs">
                            0{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {u.unitName}
                              </span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isUnitRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span className="font-medium text-slate-700">{u.modelId}</span>
                              <span>•</span>
                              <span className="text-amber-700 font-medium">Void: {u.voidPercent || (1.8 + idx * 0.4).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold font-mono text-sm text-slate-900">
                            {outputVal.toLocaleString()}{' '}
                            <span className="text-[10px] font-normal text-slate-500 font-sans">
                              {viewUnit === 'boards' ? 'boards' : 'mag'}
                            </span>
                          </div>
                          <span className={`text-[9px] font-mono ${isUnitRunning ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {isUnitRunning ? 'ACTIVE' : 'IDLE'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : isFVMI ? (
                /* FVMI 9 Stations: Sleek scrollable list - Display only */
                <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                  {activeHourlyPoint.unitsBreakdown.map((u, idx) => {
                    const isUnitRunning = u.status === 'RUNNING';
                    const outputVal = viewUnit === 'boards' ? u.boards : u.mag;

                    return (
                      <div
                        key={u.unitId}
                        className="px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 shadow-2xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-[10px] shrink-0 tracking-wider shadow-2xs">
                            0{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {u.unitName}
                              </span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isUnitRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span className="font-medium text-slate-700">{u.modelId}</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-medium">Pass: {u.yieldPercent || (99.7 + (idx % 3) * 0.1).toFixed(1)}%</span>
                              <span>•</span>
                              <span className="text-slate-400">25MP</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold font-mono text-sm text-slate-900">
                            {outputVal.toLocaleString()}{' '}
                            <span className="text-[10px] font-normal text-slate-500 font-sans">
                              {viewUnit === 'boards' ? 'boards' : 'mag'}
                            </span>
                          </div>
                          <span className={`text-[9px] font-mono ${isUnitRunning ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {isUnitRunning ? 'ONLINE' : 'OFFLINE'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Bake 5 Ovens: Sleek, balanced, calming list for comfortable viewing - Display only */
                <div className="space-y-1.5">
                  {activeHourlyPoint.unitsBreakdown.map((u, idx) => {
                    const isUnitRunning = u.status === 'RUNNING';
                    const outputVal = viewUnit === 'boards' ? u.boards : u.mag;

                    return (
                      <div
                        key={u.unitId}
                        className="px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 shadow-2xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-[10px] shrink-0 tracking-wider shadow-2xs">
                            0{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {u.unitName}
                              </span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isUnitRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                }`}
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span className="font-medium text-slate-700">{u.modelId}</span>
                              <span>•</span>
                              <span className="text-amber-700 font-medium">{u.tempCelsius || 180}°C</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold font-mono text-sm text-slate-900">
                            {outputVal.toLocaleString()}{' '}
                            <span className="text-[10px] font-normal text-slate-500 font-sans">
                              {viewUnit === 'boards' ? 'boards' : 'mag'}
                            </span>
                          </div>
                          <span className={`text-[9px] font-mono ${isUnitRunning ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {isUnitRunning ? 'CURING' : 'IDLE'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Card: Double Click or Click to view detailed graph */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                onClick={() => handleOpenDetailedGraph(selectedHour || '08:00')}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-between gap-2 shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>ดับเบิ้ลคลิก หรือกดที่นี่เพื่อดูกราฟแยกสีโมเดล</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-[11px] text-slate-400 text-center">
                💡 ดับเบิ้ลคลิก (Double-click) ที่แท่งกราฟด้านซ้ายเพื่อเปิดดูกราฟแยกสีได้เช่นกัน
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE B: DETAILED GRAPH (อีกกราฟนึง: แสดงสีของแต่ละโมเดล พร้อมลูกศรย้อนกลับ) */
        /* ========================================================================= */
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top Bar with Prominent Back Arrow */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <button
              onClick={handleBackToMain}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-bold transition-all cursor-pointer shadow-2xs group"
            >
              <ArrowLeft className="w-4 h-4 text-sky-700 group-hover:-translate-x-1 transition-transform" />
              <span>ย้อนกลับไปกราฟหลัก (Total Output)</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">กราฟแยกสีโมเดล:</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 text-white shadow-xs">
                ช่วงเวลา {activeHourlyPoint.hour}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* LEFT COLUMN (lg:col-span-7): THE MULTI-COLOR MODEL BREAKDOWN GRAPH */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    กราฟสัดส่วนแยกตามสีโมเดล (Model Distribution)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    แตะที่สีเพื่อดูข้อมูลและรายการเครื่องจักรเฉพาะโมเดลนั้น
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">ชั่วโมง: </span>
                  <strong className="text-sm font-mono text-slate-900">{selectedHour || '08:00'}</strong>
                </div>
              </div>

              {/* Model Color Chips */}
              <div className="flex flex-wrap items-center gap-1.5 py-1.5">
                <span className="text-xs text-slate-400 mr-1">เลือกโมเดล:</span>
                {activeHourlyPoint.modelsBreakdown.map((m) => {
                  const isSelected = selectedModelId === m.modelId;
                  return (
                    <button
                      key={m.modelId}
                      onClick={() => handleSelectColor(selectedHour || '08:00', m.modelId)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs font-semibold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: m.color }}
                      />
                      <span>{m.modelId}</span>
                      <span className="text-[11px] opacity-75">({m.count})</span>
                    </button>
                  );
                })}

                {selectedModelId && (
                  <button
                    onClick={() => setSelectedModelId(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 ml-auto flex items-center gap-0.5 cursor-pointer underline"
                  >
                    <X className="w-3 h-3" />
                    <span>ดูทุกโมเดล</span>
                  </button>
                )}
              </div>

              {/* Multi-Color Stacked Bar Chart */}
              <div className="h-[340px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={unifiedHourlyData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                    <XAxis
                      dataKey="hourShort"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, yAxisMax]}
                    />

                    <ReferenceLine
                      y={targetRef}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Target: ${targetRef.toLocaleString()}`,
                        position: 'insideTopRight',
                        fill: '#10b981',
                        fontSize: 10
                      }}
                    />

                    <Tooltip
                      cursor={{ fill: 'rgba(2, 132, 199, 0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const point = payload[0].payload;
                          return (
                            <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 pointer-events-none min-w-[170px]">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-semibold">
                                <span>{point.hour}</span>
                                <span className="text-emerald-400 font-mono">{point.totalOutput} pcs</span>
                              </div>
                              <div className="space-y-1 pt-0.5">
                                {point.modelsBreakdown.map((m: any) => (
                                  <div key={m.modelId} className="flex justify-between items-center text-[11px]">
                                    <span className="flex items-center gap-1.5" style={{ color: m.color }}>
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                                      {m.modelId}
                                    </span>
                                    <span className="font-mono text-slate-300">
                                      {m.count} {viewUnit === 'boards' ? 'pcs' : 'mag'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    {/* Stacks for each model with their unique colors */}
                    {Object.values(MASTER_THERMAL_MODELS).map((m, mIdx) => {
                      const modelKey = `model_${m.id.replace(/-/g, '_')}`;
                      const isLast = mIdx === Object.values(MASTER_THERMAL_MODELS).length - 1;

                      return (
                        <Bar
                          key={modelKey}
                          dataKey={modelKey}
                          stackId="detailed_stack"
                          fill={m.color}
                          name={m.name}
                          radius={isLast ? [5, 5, 0, 0] : undefined}
                          cursor="pointer"
                          onClick={(entryData: any) => {
                            if (entryData && entryData.hourShort) {
                              handleSelectColor(entryData.hourShort, m.id);
                            }
                          }}
                        >
                          {unifiedHourlyData.map((entry) => {
                            const isBarSelected = (selectedHour || '08:00') === entry.hourShort;
                            const isColorSelected = isBarSelected && selectedModelId === m.id;
                            const isAnotherColorSelected =
                              isBarSelected &&
                              selectedModelId !== null &&
                              selectedModelId !== m.id;

                            let opacity = 0.85;
                            let strokeColor = 'none';
                            let strokeW = 0;

                            if (isBarSelected) {
                              if (isColorSelected) {
                                opacity = 1;
                                strokeColor = '#0f172a';
                                strokeW = 2;
                              } else if (isAnotherColorSelected) {
                                opacity = 0.25;
                              } else {
                                opacity = 0.95;
                              }
                            } else {
                              opacity = 0.45;
                            }

                            return (
                              <Cell
                                key={`cell-${m.id}-${entry.hourShort}`}
                                stroke={strokeColor}
                                strokeWidth={strokeW}
                                fillOpacity={opacity}
                                onClick={(e: any) => {
                                  e?.stopPropagation?.();
                                  handleSelectColor(entry.hourShort, m.id);
                                }}
                              />
                            );
                          })}
                        </Bar>
                      );
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RIGHT COLUMN (lg:col-span-5): INFORMATION FOR THE SELECTED COLOR */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-400">ข้อมูลเจาะลึกโมเดล</div>
                    <div className="font-bold text-slate-900 text-sm">{activeHourlyPoint.hour}</div>
                  </div>
                </div>

                <button
                  onClick={handleBackToMain}
                  className="text-xs text-sky-700 hover:text-sky-900 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>กลับกราฟหลัก</span>
                </button>
              </div>

              {/* Condition A: Specific model color selected */}
              {activeModelMeta && activeModelBreakdownInHour ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Active Color Highlight Box */}
                  <div
                    className="p-3.5 rounded-xl border space-y-2.5"
                    style={{
                      backgroundColor: `${activeModelMeta.color}0c`,
                      borderColor: `${activeModelMeta.color}40`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: activeModelMeta.color }}
                        />
                        <div>
                          <div className="text-[11px] font-medium text-slate-500">โมเดลที่เลือก</div>
                          <div className="font-bold text-slate-900 text-sm">{activeModelMeta.name}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedModelId(null)}
                        className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50"
                      >
                        <span>ดูทุกโมเดล</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                      <div className="bg-white/90 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                        <span className="text-[10px] text-slate-500 block">ยอดผลิตในชั่วโมง</span>
                        <span className="font-bold text-base text-slate-900">
                          {activeModelBreakdownInHour.count.toLocaleString()}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            {viewUnit === 'boards' ? 'boards' : 'mag'}
                          </span>
                        </span>
                      </div>
                      <div className="bg-white/90 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                        <span className="text-[10px] text-slate-500 block">สัดส่วนในชั่วโมง</span>
                        <span className="font-bold text-base text-emerald-600">
                          {activeModelBreakdownInHour.sharePercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* List of machines running this model */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>เครื่องจักรที่กำลังรันโมเดลนี้</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {
                          activeHourlyPoint.unitsBreakdown.filter(
                            (u) => u.modelId === activeModelMeta.id
                          ).length
                        }{' '}
                        เครื่อง
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {activeHourlyPoint.unitsBreakdown
                        .filter((u) => u.modelId === activeModelMeta.id)
                        .map((u) => (
                          <div
                            key={u.unitId}
                            className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 select-none cursor-default flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  u.status === 'RUNNING' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                }`}
                              />
                              <div>
                                <span className="font-bold text-slate-800">{u.unitName}</span>
                                <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                                  {u.unitId}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-900">
                                {(viewUnit === 'boards' ? u.boards : u.mag).toLocaleString()}{' '}
                                <span className="text-[10px] font-normal text-slate-400">
                                  {viewUnit === 'boards' ? 'boards' : 'mag'}
                                </span>
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Quick Traceability Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Traceability:</span>
                    <button
                      onClick={() => openTraceabilityModal && openTraceabilityModal(`LOT-${activeModelMeta.id}-2026`)}
                      className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Barcode className="w-3.5 h-3.5 text-sky-600" />
                      <span>Trace โมเดลนี้</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Condition B: No single model selected -> Show distribution list */
                <div className="space-y-3">
                  <div className="text-xs text-slate-500">
                    คลิกเลือกโมเดลด้านบน หรือแตะที่สีในกราฟเพื่อดูรายละเอียด
                  </div>

                  <div className="space-y-2">
                    {activeHourlyPoint.modelsBreakdown.map((m) => (
                      <div
                        key={m.modelId}
                        onClick={() => handleSelectColor(selectedHour || '08:00', m.modelId)}
                        className="p-3 rounded-xl border border-slate-200/80 hover:border-sky-300 hover:bg-slate-50 transition-all cursor-pointer space-y-1.5 group shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: m.color }}
                            />
                            <span className="font-bold text-slate-800 group-hover:text-sky-900 transition-colors">
                              {m.modelName}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            {m.count.toLocaleString()}{' '}
                            <span className="text-[10px] font-normal text-slate-400">
                              {viewUnit === 'boards' ? 'boards' : 'mag'}
                            </span>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${m.sharePercent}%`,
                              backgroundColor: m.color
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                          <span>สัดส่วน: {m.sharePercent}%</span>
                          <span className="text-sky-700 font-bold group-hover:underline">
                            ดูรายละเอียดโมเดลนี้ →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
