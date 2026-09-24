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
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  X,
  Layers,
  Cpu,
  ArrowLeft,
  BarChart2
} from 'lucide-react';
import { Machine } from '../types';
import {
  INITIAL_DISPENSING_SLOTS,
  getGroupHourlyFleet,
  GroupHourlyPoint,
  syncDispensingSlotsWithLiveMachines,
  MASTER_DISPENSING_MODELS,
  getDispensingModelMeta
} from '../data/dispensingFleetData';
import { MachineModelDrilldownModal } from './MachineModelDrilldownModal';
import { MachineRunSummary } from '../data/machineModelData';
import { DispensingSingleMachineChart } from './DispensingSingleMachineChart';

interface DispensingAllFleetChartProps {
  machines: Machine[];
  selectedMachineId?: string;
  onSelectMachine: (id: string) => void;
  openTraceabilityModal?: (id: string) => void;
}

export const DispensingAllFleetChart: React.FC<DispensingAllFleetChartProps> = ({
  machines,
  selectedMachineId = 'ALL',
  onSelectMachine,
  openTraceabilityModal
}) => {
  const [selectedSlotForLotModal, setSelectedSlotForLotModal] = useState<MachineRunSummary | null>(null);

  // View mode:
  // 'fleet-total' = Main graph showing unified Total Output (default view)
  // 'detailed-breakdown' = Secondary graph showing multi-color model breakdown
  const [viewMode, setViewMode] = useState<'fleet-total' | 'detailed-breakdown'>('fleet-total');

  // Selected hour starts as null -> bars are soft blue, turns deep dark blue ONLY when user clicks!
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Timer ref for reliable double-click detection across touch/desktop
  const lastClickRef = useRef<{ hour: string; time: number } | null>(null);

  // Synchronize live machines with base slot data
  const synchronizedSlots = useMemo(() => {
    return syncDispensingSlotsWithLiveMachines(INITIAL_DISPENSING_SLOTS, machines);
  }, [machines]);

  // Combined fleet hourly dataset (all 13 machines together in 1 single graph)
  const unifiedHourlyData = useMemo(() => {
    return getGroupHourlyFleet(synchronizedSlots, 100);
  }, [synchronizedSlots]);

  // Summary stats
  const totalFleetOutput = useMemo(() => {
    return synchronizedSlots.reduce((acc, s) => acc + s.totalOutput, 0);
  }, [synchronizedSlots]);

  const totalInput = useMemo(() => {
    return machines.reduce((acc, m) => acc + (m.inputCount || 1120), 0);
  }, [machines]);

  const fleetYield = useMemo(() => {
    return ((totalFleetOutput / Math.max(1, totalInput)) * 100).toFixed(1);
  }, [totalFleetOutput, totalInput]);

  const runningCount = synchronizedSlots.filter((s) => s.status === 'RUNNING').length;

  // Active hourly point: if an hour is clicked use that, else default to '08:00' for stats
  const activeHourlyPoint = useMemo(() => {
    if (selectedHour) {
      const match = unifiedHourlyData.find((p) => p.hourShort === selectedHour);
      if (match) return match;
    }
    return unifiedHourlyData.find((p) => p.hourShort === '08:00') || unifiedHourlyData[0];
  }, [unifiedHourlyData, selectedHour]);

  // Selected Model metadata & telemetry for this hour
  const activeModelMeta = useMemo(() => {
    if (!selectedModelId) return null;
    return MASTER_DISPENSING_MODELS[selectedModelId] || getDispensingModelMeta(selectedModelId);
  }, [selectedModelId]);

  const activeModelBreakdownInHour = useMemo(() => {
    if (!activeModelMeta || !activeHourlyPoint) return null;
    return activeHourlyPoint.modelsBreakdown.find((m) => m.modelId === activeModelMeta.id) || null;
  }, [activeModelMeta, activeHourlyPoint]);

  // Machines running the selected model in this hour
  const machinesRunningModel = useMemo(() => {
    if (!activeHourlyPoint) return [];
    if (!selectedModelId) return activeHourlyPoint.machines;
    return activeHourlyPoint.machines.filter((m) => m.modelId === selectedModelId);
  }, [activeHourlyPoint, selectedModelId]);

  // Handle single click (turns dark blue) and double click (navigates to secondary graph)
  const handleBarClick = (hourShort: string) => {
    const now = Date.now();
    if (
      lastClickRef.current &&
      lastClickRef.current.hour === hourShort &&
      now - lastClickRef.current.time < 350
    ) {
      // Double Click Detected!
      handleOpenDetailedGraph(hourShort);
      lastClickRef.current = null;
      return;
    }
    lastClickRef.current = { hour: hourShort, time: now };
    // Single Click: selects the hour and turns it deep dark blue
    setSelectedHour(hourShort);
  };

  const handleOpenDetailedGraph = (hourShort?: string) => {
    const targetHour = hourShort || selectedHour || '08:00';
    setSelectedHour(targetHour);
    setViewMode('detailed-breakdown');
    setSelectedModelId(null);
  };

  const handleBackToMain = () => {
    setViewMode('fleet-total');
    setSelectedModelId(null);
  };

  // Action: Click on a specific model color in the detailed graph
  const handleSelectColor = (hourShort: string, modelId: string) => {
    setSelectedHour(hourShort);
    setSelectedModelId(modelId);
  };

  // Selected slot & machine if passed for highlighting in fleet view
  const selectedSlot = useMemo(() => {
    if (!selectedMachineId || selectedMachineId === 'ALL') return null;
    return synchronizedSlots.find((s) => s.machineId === selectedMachineId) || null;
  }, [synchronizedSlots, selectedMachineId]);

  const selectedMachine = useMemo(() => {
    if (!selectedMachineId || selectedMachineId === 'ALL') return null;
    return machines.find((m) => m.id === selectedMachineId) || machines[0];
  }, [machines, selectedMachineId]);

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. SIMPLE & CLEAN STATS STRIP (ดูสบายตา ไม่รก) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-slate-700 font-sans">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-slate-400 font-medium">ยอดผลิตรวมทุกเครื่อง</div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {totalFleetOutput.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">boards</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div>
            <div className="text-xs text-slate-400 font-medium">Fleet Yield</div>
            <div className="text-xl font-bold text-emerald-600 font-mono">
              {fleetYield}%
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div>
            <div className="text-xs text-slate-400 font-medium">สถานะเครื่องจักร</div>
            <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>พร้อมทำงาน {runningCount} / {synchronizedSlots.length} เครื่อง</span>
            </div>
          </div>
        </div>

        {/* View Mode Indicator / Switcher */}
        <div className="flex items-center gap-2 text-xs">
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
      {/* 2. MAIN WORKSPACE */}
      {/* ========================================================================= */}
      {viewMode === 'fleet-total' ? (
        /* ========================================================================= */
        /* MODE A: PRIMARY GRAPH (กราฟหลัก: TOTAL OUTPUT รวมก่อน)                     */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start animate-in fade-in duration-200">
          {/* LEFT COLUMN: THE CLEAN SINGLE-COLOR BAR CHART */}
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
                    domain={[0, 1500]}
                  />

                  {/* Subtle Target Line */}
                  <ReferenceLine
                    y={1300}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Target: 1,300',
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
                        const point = payload[0].payload as GroupHourlyPoint;
                        const isThisSelected = selectedHour === point.hourShort;
                        return (
                          <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 pointer-events-none min-w-[180px]">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-semibold">
                              <span>{point.hour}</span>
                              <span className="text-emerald-400 font-mono">{point.totalOutput} pcs</span>
                            </div>
                            <div className="text-[11px] text-slate-300">
                              เป้าหมาย: 1,300 pcs ({((point.totalOutput / 1300) * 100).toFixed(0)}%)
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

          {/* RIGHT COLUMN: OUTPUT รวมก่อน (TOTAL OUTPUT FIRST) */}
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
                    ? `${activeHourlyPoint.totalOutput.toLocaleString()} boards`
                    : `${totalFleetOutput.toLocaleString()} boards`}
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
                  13 เครื่องออนไลน์
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
                      : totalFleetOutput.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-500 font-sans">boards</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500 font-medium">เป้าหมาย (Fleet Target)</div>
                  <div className="text-base font-bold font-mono text-emerald-600">
                    1,300 <span className="text-xs font-normal text-slate-500 font-sans">boards</span>
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
                        (activeHourlyPoint.totalOutput / 1300) * 100
                      )}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>ความคืบหน้า</span>
                  <span>{((activeHourlyPoint.totalOutput / 1300) * 100).toFixed(1)}% ของเป้าหมาย</span>
                </div>
              </div>
            </div>

            {/* Production Lines Total Output Breakdown: Display Only, Clean & Beautiful */}
            <div className="space-y-2.5 pointer-events-none select-none">
              <div className="text-xs font-semibold text-slate-800 flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                  <span>ยอดผลิตรวมแบ่งตามไลน์ (Line Output)</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    รวม 4 ไลน์
                  </span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 select-none">
                    แสดงผลเท่านั้น (Display Only)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {activeHourlyPoint.linesBreakdown.map((line, idx) => {
                  const totalVal = Math.max(1, activeHourlyPoint.totalOutput);
                  const sharePercent = Math.min(100, Math.round((line.totalOutput / totalVal) * 100));

                  return (
                    <div
                      key={line.line}
                      className="p-3 rounded-xl border border-slate-200/90 bg-white select-none cursor-default shadow-xs flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-[10px] shrink-0 tracking-wider shadow-2xs">
                            L{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {line.line}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {line.processType}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between">
                          <div className="text-base font-black font-mono text-slate-900">
                            {line.totalOutput.toLocaleString()}{' '}
                            <span className="text-[10px] font-normal text-slate-500 font-sans">boards</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {sharePercent}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                          <div
                            style={{ width: `${sharePercent}%` }}
                            className="h-full bg-sky-600 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
            {/* LEFT COLUMN: THE MULTI-COLOR MODEL BREAKDOWN GRAPH */}
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
                {activeHourlyPoint?.modelsBreakdown.map((m) => {
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
                      <span className="text-[11px] opacity-75">({m.output})</span>
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
                      domain={[0, 1500]}
                    />

                    <ReferenceLine
                      y={1300}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: 'Target: 1,300',
                        position: 'insideTopRight',
                        fill: '#10b981',
                        fontSize: 10
                      }}
                    />

                    <Tooltip
                      cursor={{ fill: 'rgba(2, 132, 199, 0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const point = payload[0].payload as GroupHourlyPoint;
                          return (
                            <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 pointer-events-none min-w-[170px]">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-semibold">
                                <span>{point.hour}</span>
                                <span className="text-emerald-400 font-mono">{point.totalOutput} pcs</span>
                              </div>
                              <div className="space-y-1 pt-0.5">
                                {point.modelsBreakdown.map((m) => (
                                  <div key={m.modelId} className="flex justify-between items-center text-[11px]">
                                    <span className="flex items-center gap-1.5" style={{ color: m.color }}>
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                                      {m.modelId}
                                    </span>
                                    <span className="font-mono text-slate-300">
                                      {m.output} pcs
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
                    {Object.values(MASTER_DISPENSING_MODELS).map((m, mIdx) => {
                      const modelKey = `model_${m.id.replace(/-/g, '_')}`;
                      const isLast = mIdx === Object.values(MASTER_DISPENSING_MODELS).length - 1;

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

            {/* RIGHT COLUMN: INFORMATION FOR THE SELECTED COLOR */}
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
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                        <div className="text-[11px] text-slate-400 font-sans">ยอดผลิตเฉพาะโมเดลนี้</div>
                        <div className="text-base font-bold" style={{ color: activeModelMeta.color }}>
                          {activeModelBreakdownInHour.output.toLocaleString()}{' '}
                          <span className="text-xs font-normal text-slate-400 font-sans">pcs</span>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                        <div className="text-[11px] text-slate-400 font-sans">สัดส่วนในชั่วโมงนี้</div>
                        <div className="text-base font-bold text-slate-900">
                          {activeModelBreakdownInHour.percentage}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clean Machine List running this model */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>เครื่องจักรที่รันโมเดลนี้ ({machinesRunningModel.length} เครื่อง)</span>
                      <span className="text-[11px] text-slate-400 font-normal">คลิกเพื่อดูรายละเอียด</span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                      {machinesRunningModel.map((m) => (
                        <div
                          key={m.machineId}
                          onClick={() => onSelectMachine(m.machineId)}
                          className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 flex items-center justify-between text-xs cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-bold text-slate-900">{m.machineId}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500">{m.line}</span>
                          </div>

                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-semibold text-slate-800">{m.output} pcs</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Condition B: Showing all models list in this hour */
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-700">
                    สัดส่วนโมเดลทั้งหมดในชั่วโมงนี้ ({activeHourlyPoint.modelsBreakdown.length} โมเดล):
                  </div>

                  <div className="space-y-2">
                    {activeHourlyPoint.modelsBreakdown.map((m) => (
                      <div
                        key={m.modelId}
                        onClick={() => setSelectedModelId(m.modelId)}
                        className="p-2.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: m.color }}
                          />
                          <span className="font-medium text-slate-800">{m.modelName}</span>
                        </div>

                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-slate-500 text-[11px]">{m.percentage}%</span>
                          <strong className="text-slate-900">{m.output} pcs</strong>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-[11px] text-slate-400 text-center">
                    แตะที่โมเดลใดก็ได้ เพื่อดูรายการเครื่องจักรที่รันโมเดลนั้น
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lot / Traceability Modal */}
      {selectedSlotForLotModal && (
        <MachineModelDrilldownModal
          isOpen={true}
          onClose={() => setSelectedSlotForLotModal(null)}
          machineData={selectedSlotForLotModal}
          onOpenTraceability={openTraceabilityModal}
        />
      )}
    </div>
  );
};
