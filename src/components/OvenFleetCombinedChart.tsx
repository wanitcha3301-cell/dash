import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Flame,
  Wind,
  Layers,
  RotateCcw,
  BarChart3,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Radio,
  Maximize2,
  Sliders,
  ArrowUpRight,
  ArrowRight,
  Scan,
  Eye
} from 'lucide-react';
import { OvenUnit } from '../types';
import { OVEN_SHIFT_HOURS, computeOvenHourlyData, OvenHourlySlot } from '../utils/ovenChartUtils';
import { MACHINE_MODEL_DATA, getMachineRunSummary, MachineRunSummary } from '../data/machineModelData';
import { MachineModelDrilldownModal } from './MachineModelDrilldownModal';
import { useFactory } from '../context/FactoryContext';
import {
  getHourlyModelDetails,
  computeModelRangesForMachine,
  HourlyModelDetails,
  ModelRangeSummary
} from '../utils/ovenModelRangeUtils';

interface OvenFleetCombinedChartProps {
  title?: string;
  subTitle?: string;
  units: OvenUnit[];
  processType: 'Bake' | 'Vacuum' | 'Thermal-All' | 'AOI' | 'XRAY';
  colorTheme?: 'amber' | 'emerald' | 'sky';
  selectedUnitId?: string;
  onSelectUnit?: (unitId: string) => void;
  children?: React.ReactNode;
}

export const OvenFleetCombinedChart: React.FC<OvenFleetCombinedChartProps> = ({
  title,
  subTitle,
  units,
  processType = 'Bake',
  colorTheme = 'sky',
  selectedUnitId = 'ALL',
  onSelectUnit,
  children,
}) => {
  const { openTraceabilityModal } = useFactory();
  const [viewUnit, setViewUnit] = useState<'magazines' | 'boards'>(processType === 'AOI' || processType === 'XRAY' ? 'boards' : 'magazines');
  const [chartMode, setChartMode] = useState<'hourly' | 'multi-machine' | 'comparison'>('hourly');
  const [drilldownMachine, setDrilldownMachine] = useState<MachineRunSummary | null>(null);

  // States for Model Range interactive drilldown (as requested: click to reveal Range of all models)
  const [showModelRange, setShowModelRange] = useState<boolean>(false);
  const [selectedHourlyPoint, setSelectedHourlyPoint] = useState<{
    hour: string;
    modelId?: string;
    modelName?: string;
  } | null>(null);

  // Focused machine line state for multi-machine combined graph
  // First click focuses the line (other lines softly fade); repeated click jumps to that machine
  const [focusedLineUnitId, setFocusedLineUnitId] = useState<string | null>(null);

  React.useEffect(() => {
    setSelectedHourlyPoint(null);
    setShowModelRange(false);
    setFocusedLineUnitId(null);
  }, [selectedUnitId]);

  const handleLineClick = (unitId: string) => {
    const isInteractiveProcess = processType === 'Bake' || processType === 'XRAY';
    if (!isInteractiveProcess) {
      // Oven / Vacuum: navigate directly to machine details on click
      if (onSelectUnit) {
        onSelectUnit(unitId);
      }
      return;
    }

    // Bake & X-Ray: highlight first, and clicking the focused graph again navigates to the machine page
    if (focusedLineUnitId) {
      if (focusedLineUnitId === unitId) {
        // Clicking the focused graph again opens the machine page
        if (onSelectUnit) {
          onSelectUnit(unitId);
        }
        setFocusedLineUnitId(null);
      } else {
        // Switch focus to another line
        setFocusedLineUnitId(unitId);
      }
    } else {
      // First click: highlight the graph
      setFocusedLineUnitId(unitId);
    }
  };

  const isSky = colorTheme === 'sky' || colorTheme === 'amber' || !colorTheme;
  const isEmerald = colorTheme === 'emerald';
  const isAllSelected = selectedUnitId === 'ALL';
  const activeUnit = units.find((u) => u.id === selectedUnitId);

  // Filtered units based on selectedUnitId
  const effectiveUnits = isAllSelected ? units : (activeUnit ? [activeUnit] : units);

  // Compute hourly records for each unit
  const unitsHourlyMap = useMemo(() => {
    const map = new Map<string, OvenHourlySlot[]>();
    units.forEach((u) => {
      map.set(u.id, computeOvenHourlyData(u));
    });
    return map;
  }, [units]);

  // Aggregate combined hourly data for current scope (All or Single unit)
  const combinedHourlyData = useMemo(() => {
    return OVEN_SHIFT_HOURS.map((hour, index) => {
      let totalMagazines = 0;
      let totalBoards = 0;
      let targetMagazines = 0;
      let targetBoards = 0;
      const breakdown: { unitId: string; unitName: string; mag: number; boards: number; status: string }[] = [];

      effectiveUnits.forEach((u) => {
        const slots = unitsHourlyMap.get(u.id) || [];
        const slot = slots[index];
        if (slot) {
          totalMagazines += slot.magazinesPerHour;
          totalBoards += slot.totalUph;
          targetMagazines += slot.targetMagazinesPerHour;
          targetBoards += slot.targetUph;
          breakdown.push({
            unitId: u.id,
            unitName: u.name,
            mag: slot.magazinesPerHour,
            boards: slot.totalUph,
            status: u.status,
          });
        }
      });

      // Deeper, richer, high-contrast colors (Blue, Green, Yellow/Amber, Indigo, Rose, Violet)
      const FLEET_COLORS = ['#0369a1', '#047857', '#b45309', '#4f46e5', '#be123c', '#7c3aed'];
      const unitEntries = units.map((u, uIdx) => {
        const uSlots = unitsHourlyMap.get(u.id);
        const uSlot = uSlots ? uSlots[index] : null;
        const val = viewUnit === 'magazines' ? (uSlot?.magazinesPerHour ?? 0) : (uSlot?.totalUph ?? 0);
        const target = viewUnit === 'magazines' ? (uSlot?.targetMagazinesPerHour ?? 15) : (uSlot?.targetUph ?? 1000);
        const eff = target > 0 ? Number(((val / target) * 100).toFixed(1)) : 100;
        const summary = getMachineRunSummary(u.id, u.name, processType);
        const modelDetails = summary ? getHourlyModelDetails(summary, hour) : null;
        return {
          id: u.id,
          name: u.name,
          color: FLEET_COLORS[uIdx % FLEET_COLORS.length],
          status: u.status,
          val,
          target,
          efficiency: eff,
          program: u.program,
          modelDetails,
          key: `unit_${u.id}`
        };
      });

      // Individual unit values for 2-line vacuum comparison
      const u0 = units[0];
      const u1 = units[1];
      const u0Slots = u0 ? unitsHourlyMap.get(u0.id) : null;
      const u1Slots = u1 ? unitsHourlyMap.get(u1.id) : null;
      const u0Slot = u0Slots ? u0Slots[index] : null;
      const u1Slot = u1Slots ? u1Slots[index] : null;

      const u0Val = viewUnit === 'magazines' ? (u0Slot?.magazinesPerHour ?? 0) : (u0Slot?.totalUph ?? 0);
      const u1Val = viewUnit === 'magazines' ? (u1Slot?.magazinesPerHour ?? 0) : (u1Slot?.totalUph ?? 0);
      const u0Target = viewUnit === 'magazines' ? (u0Slot?.targetMagazinesPerHour ?? 15) : (u0Slot?.targetUph ?? 1000);
      const u1Target = viewUnit === 'magazines' ? (u1Slot?.targetMagazinesPerHour ?? 15) : (u1Slot?.targetUph ?? 1000);
      const u0Efficiency = u0Target > 0 ? Number(((u0Val / u0Target) * 100).toFixed(1)) : 100;
      const u1Efficiency = u1Target > 0 ? Number(((u1Val / u1Target) * 100).toFixed(1)) : 100;

      // Model info for each chamber & single machine active model
      const u0Summary = u0 ? getMachineRunSummary(u0.id, u0.name, processType) : null;
      const u1Summary = u1 ? getMachineRunSummary(u1.id, u1.name, processType) : null;
      const u0ModelDetails = u0Summary ? getHourlyModelDetails(u0Summary, hour) : null;
      const u1ModelDetails = u1Summary ? getHourlyModelDetails(u1Summary, hour) : null;

      // Active machine details for single-machine view
      const activeMachineSummary = activeUnit ? getMachineRunSummary(activeUnit.id, activeUnit.name, processType) : null;
      const activeHourlyModel = activeMachineSummary
        ? getHourlyModelDetails(activeMachineSummary, hour)
        : (u0ModelDetails || null);

      const targetRef = viewUnit === 'magazines' ? targetMagazines : targetBoards;
      const actualVal = viewUnit === 'magazines' ? totalMagazines : totalBoards;
      
      // Volume classification:
      // High/Normal if >= 85% of target
      // Low if < 85% of target
      const isZero = actualVal === 0;
      const isHigh = actualVal >= targetRef * 0.85;
      const isLow = !isZero && !isHigh;

      const efficiencyPercent = targetRef > 0 ? Number(((actualVal / targetRef) * 100).toFixed(1)) : 100;

      const unitDataKeys: Record<string, number> = {};
      unitEntries.forEach((ue) => {
        unitDataKeys[ue.key] = ue.val;
      });

      return {
        hour,
        timeRange: `${hour} - ${(parseInt(hour.split(':')[0], 10) + 1).toString().padStart(2, '0')}:00`,
        totalMagazines,
        totalBoards,
        targetMagazines,
        targetBoards,
        targetRef,
        actualVal,
        efficiencyPercent,
        isHigh,
        isLow,
        isZero,
        breakdown,
        isCurrent: index === 9,
        // Individual machine fields & active model
        u0Val,
        u1Val,
        u0Target,
        u1Target,
        u0Efficiency,
        u1Efficiency,
        u0Status: u0?.status || 'RUNNING',
        u1Status: u1?.status || 'RUNNING',
        u0Name: u0?.name || 'Oven #1',
        u1Name: u1?.name || 'Oven #2',
        u0Program: u0?.program || 'Recipe A',
        u1Program: u1?.program || 'Recipe B',
        u0Id: u0?.id,
        u1Id: u1?.id,
        u0ModelDetails,
        u1ModelDetails,
        unitEntries,
        ...unitDataKeys,
        hourlyModel: activeHourlyModel,
      };
    });
  }, [effectiveUnits, unitsHourlyMap, viewUnit, units, activeUnit, processType]);

  // Comparison data between units (for Comparison tab)
  const perUnitComparisonData = useMemo(() => {
    return units.map((u) => {
      const slots = unitsHourlyMap.get(u.id) || [];
      const totalMag = slots.reduce((acc, s) => acc + s.magazinesPerHour, 0);
      const totalBrd = slots.reduce((acc, s) => acc + s.totalUph, 0);
      const targetTotalMag = slots.reduce((acc, s) => acc + s.targetMagazinesPerHour, 0);
      const targetTotalBrd = slots.reduce((acc, s) => acc + s.targetUph, 0);

      const actual = viewUnit === 'magazines' ? totalMag : totalBrd;
      const target = viewUnit === 'magazines' ? targetTotalMag : targetTotalBrd;
      const isZero = actual === 0;
      const isHigh = actual >= target * 0.85;
      const isLow = !isZero && !isHigh;

      return {
        unitId: u.id,
        unitName: u.name,
        status: u.status,
        runningModel: u.runningModel,
        operatorId: u.operatorId,
        totalMag,
        totalBrd,
        actual,
        target,
        isHigh,
        isLow,
        isZero,
        efficiencyPercent: target > 0 ? Math.round((actual / target) * 100) : 100,
      };
    });
  }, [units, unitsHourlyMap, viewUnit]);

  // Overall KPIs
  const totalFleetBoards = useMemo(() => {
    return combinedHourlyData.reduce((acc, h) => acc + h.totalBoards, 0);
  }, [combinedHourlyData]);

  const totalFleetMagazines = useMemo(() => {
    return combinedHourlyData.reduce((acc, h) => acc + h.totalMagazines, 0);
  }, [combinedHourlyData]);

  const activeRunningCount = units.filter((u) => u.status === 'RUNNING').length;

  const currentHourSlot = combinedHourlyData[combinedHourlyData.length - 1];
  const fleetUphNow = currentHourSlot ? currentHourSlot.totalBoards : 0;
  const targetFleetUph = currentHourSlot ? currentHourSlot.targetBoards : 1;

  // Chart max value
  const maxSlotVal = useMemo(() => {
    if (isAllSelected) {
      return Math.max(
        ...combinedHourlyData.flatMap((d) => {
          const entries = (d.unitEntries as any[]) || [];
          return entries.map((ue) => Math.max(ue.val || 0, ue.target || 0));
        }),
        10
      );
    }
    return Math.max(
      ...combinedHourlyData.map((d) => d.actualVal),
      ...combinedHourlyData.map((d) => d.targetRef),
      10
    );
  }, [isAllSelected, combinedHourlyData]);

  const yAxisMax = Math.ceil(maxSlotVal * 1.25);

  // Color mappings
  // Green for Pass / Meets Target (≥ Target): #4db6ac
  // Yellow for Below Target (< Target): #fff176
  // Balanced tones (neither too dark nor too light)
  const getDynamicBarColor = (isHigh: boolean, _isLow: boolean, isZero: boolean) => {
    if (isZero) return '#fffde7'; // very light yellow for stopped
    if (isHigh) {
      return '#4db6ac'; // Green (#4db6ac) when meets or exceeds target
    }
    return '#fff176'; // Yellow (#fff176) when below target
  };

  const getDynamicBarBorder = (isHigh: boolean, _isLow: boolean, isZero: boolean) => {
    if (isZero) return '#fff176';
    if (isHigh) {
      return '#3d958d'; // Teal/Green rim
    }
    return '#fbc02d'; // Golden Yellow rim
  };

  const defaultTitle = isAllSelected
    ? processType === 'Vacuum'
      ? '📊 Two-Line Production Comparison (Chamber A vs Chamber B)'
      : processType === 'AOI'
      ? `📊 AOI Optical Inspection Consolidated Fleet (${units.length} Units)`
      : processType === 'XRAY'
      ? `📊 X-Ray Radiography Consolidated Fleet (${units.length} Units)`
      : processType === 'Bake'
      ? `📊 5-Bake Ovens Consolidated Fleet (${units.length} Units)`
      : '📊 All Thermal Chambers Fleet Overview'
    : `📈 Single Machine Output: ${activeUnit?.name || selectedUnitId} ${processType === 'Vacuum' ? (units.findIndex((u) => u.id === activeUnit?.id) === 0 ? '(Chamber A)' : '(Chamber B)') : ''}`;

  const defaultSub = isAllSelected
    ? processType === 'Vacuum'
      ? 'Hourly throughput comparison between Chamber A (VO-01) and Chamber B (VO-02)'
      : processType === 'AOI'
      ? `Consolidated optical inspection throughput across all ${units.length} AOI units in shift (08:00 - 17:00)`
      : processType === 'XRAY'
      ? `Consolidated radiography scan throughput across all ${units.length} X-Ray units in shift (08:00 - 17:00)`
      : `Consolidated hourly thermal throughput across all ${units.length} chambers in shift (08:00 - 17:00)`
    : `Output, model runs, and telemetry data for ${activeUnit?.name} • OP: ${activeUnit?.operatorId}`;

  return (
    <section className={`bg-white rounded-2xl border border-[#cbd5e1] border-l-4 ${isSky ? 'border-l-sky-500' : isEmerald ? 'border-l-emerald-500' : 'border-l-amber-500'} p-5 shadow-xs space-y-4`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1f5f9]">
        <div>
          <div className="flex items-center space-x-2">
            {processType === 'AOI' ? (
              <Scan className="w-5 h-5 text-sky-600" />
            ) : processType === 'XRAY' ? (
              <Radio className="w-5 h-5 text-sky-600" />
            ) : isSky ? (
              processType === 'Vacuum' ? (
                <Wind className="w-5 h-5 text-sky-600" />
              ) : (
                <Flame className="w-5 h-5 text-sky-600" />
              )
            ) : processType === 'Vacuum' ? (
              <Wind className="w-5 h-5 text-emerald-600" />
            ) : processType === 'Bake' ? (
              <Flame className="w-5 h-5 text-amber-600" />
            ) : (
              <Layers className="w-5 h-5 text-slate-700" />
            )}
            <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
              <span>{title || defaultTitle}</span>
              {isAllSelected ? (
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${isSky ? 'bg-[#b3e5fc] text-sky-950 border border-sky-300' : isEmerald ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                  {processType === 'AOI' ? `All ${units.length} AOI Units` : processType === 'XRAY' ? `All ${units.length} X-Ray Units` : `All Ovens (${units.length} Units)`}
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full text-white ${isSky ? 'bg-sky-600' : isEmerald ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                    {activeUnit?.name || activeUnit?.id}
                  </span>
                  {onSelectUnit && (
                    <button
                      onClick={() => onSelectUnit('ALL')}
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border cursor-pointer transition-colors flex items-center gap-1 ${
                        isSky
                          ? 'text-sky-900 bg-sky-50 hover:bg-sky-100 border-sky-200'
                          : isEmerald
                          ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                          : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'
                      }`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Consolidated Fleet</span>
                    </button>
                  )}
                </div>
              )}
            </h3>
          </div>
          <p className="text-xs text-[#64748b] mt-1 font-mono">
            {subTitle || defaultSub}
          </p>
        </div>

        {/* View Unit and Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Toggle: Magazines vs Boards */}
          <div className="flex items-center bg-[#f1f5f9] p-1 rounded-xl border border-[#cbd5e1] text-xs font-bold font-mono">
            <button
              onClick={() => setViewUnit('magazines')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewUnit === 'magazines'
                  ? isSky
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : isEmerald
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-amber-600 text-white shadow-2xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Magazines (Mag)
            </button>
            <button
              onClick={() => setViewUnit('boards')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewUnit === 'boards'
                  ? isSky
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : isEmerald
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-amber-600 text-white shadow-2xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Boards (Pcs)
            </button>
          </div>
        </div>
      </div>

      {/* Operational KPI Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8fafc] p-3 rounded-xl border border-[#cbd5e1]">
        <div>
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">
            {isAllSelected ? 'Combined Output (Boards)' : 'Total Output (Boards)'}
          </span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="font-mono font-black text-xl text-[#0f172a]">
              {totalFleetBoards.toLocaleString()}
            </span>
            <span className="text-xs text-[#64748b] font-mono">boards</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">
            {isAllSelected ? 'Total Magazines Baked' : 'Magazines Processed'}
          </span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="font-mono font-black text-xl text-[#0f172a]">
              {totalFleetMagazines}
            </span>
            <span className="text-xs text-[#64748b] font-mono">magazines</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">
            Real-time Fleet UPH
          </span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className={`font-mono font-black text-xl ${fleetUphNow >= targetFleetUph * 0.85 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {fleetUphNow.toLocaleString()}
            </span>
            <span className="text-xs text-[#64748b] font-mono">/ {targetFleetUph.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">
            Active Chambers
          </span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="font-mono font-black text-xl text-emerald-700">
              {activeRunningCount} / {units.length}
            </span>
            <span className="text-xs text-[#64748b] font-mono">Online</span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      {chartMode === 'multi-machine' && isAllSelected ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#64748b] px-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">
                {processType === 'Vacuum'
                  ? 'Two-Machine Comparison (Chamber A vs Chamber B)'
                  : `Individual Machine Comparison (${units.length} Units)`}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#b3e5fc] text-sky-950 border border-sky-300">
                MULTI-GRAPH
              </span>
            </div>

            <div className="flex items-center gap-3 bg-white px-2.5 py-1 rounded-lg border border-[#cbd5e1]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-2xs" />
                <span className="text-emerald-950 font-bold">Pass Target</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-amber-500 bg-[#f59e0b] shadow-2xs" />
                <span className="text-amber-950 font-bold">Below Target</span>
              </span>
            </div>
          </div>

          {/* Grid of Individual Machine Graphs */}
          <div className={`grid grid-cols-1 ${units.length === 2 ? 'lg:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'} gap-4`}>
            {units.map((u, uIdx) => {
              const machineSummary = getMachineRunSummary(u.id, u.name, processType);
              const isChamberA = uIdx === 0;
              const slots = unitsHourlyMap.get(u.id) || [];
              const maxMachineVal = viewUnit === 'boards' ? 160 : 3;
              const targetMachineVal = viewUnit === 'boards' ? 120 : 2;

              return (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl border border-sky-200/90 p-4 sm:p-4.5 shadow-xs hover:shadow-md hover:border-sky-400 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Machine Header */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-sky-100">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#b3e5fc] text-sky-950 border border-sky-300 flex items-center justify-center font-black text-xs shadow-2xs group-hover:scale-105 transition-transform">
                          0{uIdx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-sky-900 transition-colors">
                              {u.name} {processType === 'Vacuum' ? (isChamberA ? '(Chamber A)' : '(Chamber B)') : ''}
                            </h4>
                            <span className="px-2 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {u.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {u.chamberLabel || machineSummary.chamberLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectUnit && onSelectUnit(u.id)}
                          className="px-2 py-1 text-[11px] font-mono font-bold text-sky-950 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="View detailed graph and data for this machine"
                        >
                          <BarChart3 className="w-3 h-3 text-sky-700" />
                          <span>View Graph</span>
                        </button>

                        <button
                          onClick={() => setDrilldownMachine(machineSummary)}
                          className="px-2 py-1 text-[11px] font-mono font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="View model and batch breakdown"
                        >
                          <Maximize2 className="w-3 h-3 text-slate-600" />
                          <span>Models Run</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Metrics */}
                    <div className="grid grid-cols-3 gap-2 my-2.5 text-xs font-mono">
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[9px] text-slate-500 block">Total Output</span>
                        <span className="font-black text-slate-900 text-xs">
                          {viewUnit === 'boards' ? `${machineSummary.totalPcs} pcs` : `${machineSummary.totalMagazines} mags`}
                        </span>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[9px] text-slate-500 block">Target / Hr</span>
                        <span className="font-black text-slate-900 text-xs">
                          {targetMachineVal} {viewUnit === 'boards' ? 'pcs' : 'mags'}
                        </span>
                      </div>
                      <div className="p-1.5 bg-emerald-50/70 rounded-lg border border-emerald-200">
                        <span className="text-[9px] text-emerald-800 block">Efficiency</span>
                        <span className="font-black text-emerald-800 text-xs">
                          {Math.round((machineSummary.totalPcs / machineSummary.targetPcs) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Machine Graph Thumbnail (Clickable) */}
                    <div
                      onClick={() => setDrilldownMachine(machineSummary)}
                      className="cursor-pointer bg-linear-to-b from-sky-50/30 to-white p-2.5 rounded-xl border border-sky-100 hover:border-sky-300 transition-all group/graph my-2"
                      title="Click graph to expand model and batch details"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1.5">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <BarChart3 className="w-3 h-3 text-sky-600" />
                          Hourly Output (08:00 - 17:00)
                        </span>
                        <span className="text-sky-900 font-bold">
                          Target: {targetMachineVal} {viewUnit === 'boards' ? 'pcs/h' : 'mag/h'}
                        </span>
                      </div>

                      <div className="flex items-end justify-between space-x-1 h-24 pt-2 border-l border-b border-slate-300 pl-1">
                        {machineSummary.hourlyOutput.map((slot) => {
                          const val = viewUnit === 'boards' ? slot.actualPcs : slot.actualMag;
                          const height = Math.min(100, Math.max(12, (val / maxMachineVal) * 100));
                          const isHigh = val >= targetMachineVal;

                          return (
                            <div key={slot.hour} className="flex-1 flex flex-col items-center">
                              <span className="text-[8px] font-mono text-slate-500 mb-0.5">
                                {val}
                              </span>
                              <div
                                style={{ height: `${height}%` }}
                                className={`w-full max-w-[24px] ${isHigh ? 'bg-[#059669]' : 'bg-[#f59e0b] border border-amber-600'} rounded-t-xs transition-all`}
                              />
                              <span className="text-[8px] font-mono text-slate-500 mt-1">
                                {slot.hour.split(':')[0]}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-center mt-1.5">
                        <span className="text-[9px] font-mono text-sky-800 font-bold group-hover/graph:underline">
                          🔍 Click graph to view model and lot details →
                        </span>
                      </div>
                    </div>

                    {/* Running Models */}
                    <div className="mt-3 pt-2.5 border-t border-sky-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                          <Layers className="w-3 h-3 text-sky-600" />
                          <span>Models Run on this Machine</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {machineSummary.models.length} Models
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {machineSummary.models.map((model) => {
                          return (
                            <div
                              key={model.modelId}
                              onClick={() => setDrilldownMachine(machineSummary)}
                              className="p-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-sky-50/50 hover:border-sky-300 transition-all cursor-pointer flex flex-col gap-1"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[11px] text-slate-900 truncate max-w-[150px]">
                                    {model.modelName}
                                  </span>
                                </div>

                                <div className="font-mono text-xs text-right">
                                  <strong className="text-slate-900 font-black">
                                    {model.runCount}
                                  </strong>
                                  <span className="text-slate-500 text-[10px] ml-0.5">pcs</span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${model.percentage}%` }}
                                    className="h-full rounded-full transition-all bg-sky-600"
                                  />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-600 w-8 text-right">
                                  {model.percentage}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-sky-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>OP: {u.operatorId || 'Somchai P.'}</span>
                    <button
                      onClick={() => setDrilldownMachine(machineSummary)}
                      className="text-sky-900 hover:text-sky-950 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Batch Details</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : chartMode === 'hourly' ? (
        <div className="space-y-2">
          {/* Bake & X-Ray Specific: Quick Machine Selector - Shown ONLY on the Combined Graph page */}
          {(processType === 'Bake' || processType === 'XRAY') && isAllSelected && onSelectUnit && (
            <div className="bg-sky-50/80 p-2.5 sm:p-3 rounded-2xl border border-sky-200 shadow-2xs space-y-2">
              {/* If a graph is currently being displayed/focused */}
              {focusedLineUnitId && (
                <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
                  <span className="text-[11px] font-mono font-bold text-amber-950 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    <span>
                      Showing graph for {units.find((u) => u.id === focusedLineUnitId)?.name || 'this machine'}
                    </span>
                  </span>
                  <button
                    onClick={() => setFocusedLineUnitId(null)}
                    className="text-[11px] font-mono text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 cursor-pointer shrink-0 flex items-center gap-1 font-bold shadow-2xs transition-colors"
                    title="Unlock and show all lines"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-600" />
                    <span>✕ Show All</span>
                  </button>
                </div>
              )}

              {/* Machine Buttons: highlight line */}
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                {units.map((u, idx) => {
                  const lineColors = ['#0369a1', '#047857', '#b45309', '#4f46e5', '#be123c', '#7c3aed'];
                  const color = lineColors[idx % lineColors.length];
                  const isFocused = focusedLineUnitId === u.id;
                  const label = processType === 'XRAY'
                    ? `X-RAY 0${idx + 1} (Line 0${idx + 1})`
                    : `Bake ${idx + 1} (Line 0${idx + 1})`;

                  return (
                    <button
                      key={u.id}
                      id={`btn-${processType.toLowerCase()}-select-${u.id}`}
                      onClick={() => {
                        // Highlight or reset
                        if (focusedLineUnitId === u.id) {
                          setFocusedLineUnitId(null);
                        } else {
                          setFocusedLineUnitId(u.id);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-2xs hover:scale-102 ${
                        isFocused
                          ? 'bg-sky-900 text-white shadow-md ring-2 ring-sky-400 font-black'
                          : 'bg-white text-slate-800 hover:bg-sky-50 border border-sky-300'
                      }`}
                      title={
                        isFocused
                          ? `Showing line for ${u.name} (click on graph line to view machine page)`
                          : `Click to highlight line for ${u.name} (Line 0${idx + 1})`
                      }
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: color }}
                      />
                      <span className="tracking-tight">{label}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          u.status === 'RUNNING' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        title={`Status: ${u.status}`}
                      />
                      {isFocused ? (
                        <span className="text-[10px] bg-sky-400 text-slate-950 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <Eye className="w-3 h-3 text-slate-400 group-hover:text-sky-600 ml-0.5 opacity-70" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Unit Selector Bar - Combined Chart Highlight Controller (Hidden in Bake and X-Ray mode as requested) */}
          {onSelectUnit && processType !== 'Bake' && processType !== 'XRAY' && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/95 p-2 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-xs font-mono font-bold text-slate-600 shrink-0 mr-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  <span>{processType === 'Vacuum' ? 'Chambers:' : 'Units:'}</span>
                </span>
                <button
                  id="btn-chart-all-bake"
                  onClick={() => {
                    setFocusedLineUnitId(null);
                    if (onSelectUnit) {
                      onSelectUnit('ALL');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    selectedUnitId === 'ALL'
                      ? isSky
                        ? 'bg-sky-700 text-white shadow-xs ring-1 ring-sky-300'
                        : isEmerald
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-amber-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title="View consolidated fleet data"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{processType === 'Vacuum' ? 'All Vacuum' : 'All Fleet'}</span>
                </button>
                {units.map((u, idx) => {
                  const lineColors = ['#0369a1', '#047857', '#b45309', '#4f46e5', '#be123c', '#7c3aed'];
                  const color = lineColors[idx % lineColors.length];
                  const isFocused = isAllSelected && focusedLineUnitId === u.id;
                  const isSelected = selectedUnitId === u.id;
                  const displayName = u.name;

                  return (
                    <button
                      key={u.id}
                      id={`btn-chart-unit-${u.id}`}
                      onClick={() => {
                        setFocusedLineUnitId(null);
                        if (onSelectUnit) {
                          onSelectUnit(u.id);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isFocused || isSelected
                          ? 'text-white shadow-sm ring-2 ring-offset-1 font-extrabold'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                      style={isFocused || isSelected ? { backgroundColor: color, borderColor: color } : undefined}
                      title={
                        isAllSelected
                          ? `Click to highlight ${displayName} (click on line again to view machine page)`
                          : `Go to telemetry and data for ${displayName}`
                      }
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: isFocused || isSelected ? '#ffffff' : color }}
                      />
                      <span>{displayName}</span>
                      {isFocused && (
                        <span className="text-[10px] bg-black/25 px-1.5 py-0.2 rounded font-sans font-semibold">
                          Focused
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {focusedLineUnitId && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono font-bold text-sky-900 bg-sky-100/90 border border-sky-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>
                    <span>Click line again to open machine detail</span>
                  </span>
                  <button
                    onClick={() => setFocusedLineUnitId(null)}
                    className="text-[11px] font-mono text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 cursor-pointer shrink-0 flex items-center gap-1 transition-colors font-bold shadow-2xs"
                    title="Unlock and show all lines"
                  >
                    <span>✕ Show All</span>
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Target Line & Visual Legend (Omitted for ALL combined graphs to keep chart pure and clean) */}
          {isAllSelected ? null : (
            /* Single machine / Consolidated Legend */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#64748b] px-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-0.5 bg-rose-500 inline-block" />
                  <span className="text-[#0f172a] font-bold">
                    Target Line: {viewUnit === 'magazines' ? `${currentHourSlot?.targetMagazines || 15} Mag/h` : `${(currentHourSlot?.targetBoards || 1000).toLocaleString()} Boards/h`}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-3 bg-white px-2.5 py-1 rounded-lg border border-[#cbd5e1]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#059669] border border-emerald-800 shadow-2xs" />
                  <strong className="text-emerald-950 font-bold">Pass Target (≥ Target)</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-amber-600 bg-[#f59e0b] shadow-2xs" />
                  <strong className="text-amber-950 font-bold">Below Target (&lt; Target)</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-0.5 rounded-full ${isSky ? 'bg-sky-700' : isEmerald ? 'bg-emerald-700' : 'bg-amber-700'}`} />
                  <span className="text-slate-800 font-bold">Output Line</span>
                </span>
              </div>
            </div>
          )}

          {/* Recharts Canvas */}
          <div
            className={`h-64 w-full pt-1 ${focusedLineUnitId ? 'cursor-pointer' : ''}`}
            onClick={() => {
              if ((processType === 'Bake' || processType === 'XRAY') && focusedLineUnitId) {
                // Navigate only when clicking the focused graph again
                if (onSelectUnit) {
                  onSelectUnit(focusedLineUnitId);
                  setFocusedLineUnitId(null);
                }
              }
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              {isAllSelected ? (
                /* Fleet ALL View (Vacuum: 2 lines, Bake: 5 lines, X-Ray: 6 lines): Multi-Line Comparison with Hover Tooltip & Click Support */
                <LineChart
                  data={combinedHourlyData}
                  margin={{ top: 12, right: 20, left: -10, bottom: 5 }}
                  onClick={(_e: any) => {
                    if ((processType === 'Bake' || processType === 'XRAY') && focusedLineUnitId) {
                      // Navigate only when clicking the focused graph again
                      if (onSelectUnit) {
                        onSelectUnit(focusedLineUnitId);
                        setFocusedLineUnitId(null);
                      }
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="hour"
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
                  {/* Target benchmark reference line */}
                  <ReferenceLine
                    y={combinedHourlyData[0]?.u0Target || (viewUnit === 'magazines' ? 15 : 1000)}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Target (${viewUnit === 'magazines' ? `${combinedHourlyData[0]?.u0Target || 15} Mag/h` : `${(combinedHourlyData[0]?.u0Target || 1000).toLocaleString()} Pcs/h`} / machine)`,
                      position: 'insideTopRight',
                      fill: '#059669',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  />
                  {/* Compact floating box when hovering: All machines visible in small text without scrolling */}
                  <Tooltip
                    cursor={{ stroke: '#38bdf8', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                    wrapperStyle={{ zIndex: 60, pointerEvents: 'none', outline: 'none' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      const entries = (data.unitEntries as any[]) || [];

                      const isVacuum = processType === 'Vacuum';
                      const totalVal = viewUnit === 'magazines' ? data.totalMagazines : data.totalBoards;
                      const totalTarget = viewUnit === 'magazines' ? data.targetMagazines : data.targetBoards;
                      const unitLabel = viewUnit === 'magazines' ? 'Mag' : 'Pcs';

                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white p-2 rounded-xl font-mono shadow-2xl border border-slate-700/90 z-50 min-w-[280px] max-w-[335px] pointer-events-none select-none text-[9.5px] space-y-1 overflow-hidden">
                          {/* Header: Time range + Total summary in 1 compact line */}
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1 gap-2">
                            <div className="flex items-center gap-1 font-bold text-sky-400 text-[10.5px] shrink-0">
                              <Clock className="w-3 h-3 text-sky-400" />
                              <span>{data.timeRange}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[8.5px]">
                              <span className="text-slate-400">{isVacuum ? '2 Chambers Total:' : `${entries.length} Units Total:`}</span>
                              <strong className="text-white font-bold">
                                {totalVal.toLocaleString()} {unitLabel}
                              </strong>
                              <span
                                className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                                  data.efficiencyPercent >= 100
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                    : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                                }`}
                              >
                                {data.efficiencyPercent}%
                              </span>
                            </div>
                          </div>

                          {/* Machine Breakdown: Ultra-compact small-text rows (All 5 machines fully visible without scrolling) */}
                          <div className="space-y-0.5">
                            {entries.map((ue: any, idx: number) => {
                              const isFocused = focusedLineUnitId === ue.id;
                              const isAnyFocused = focusedLineUnitId !== null;
                              const chamberName = isVacuum
                                ? `${ue.name} (Chamber ${idx === 0 ? 'A' : 'B'})`
                                : `Line 0${idx + 1} (${ue.name})`;
                              const modelName = ue.modelDetails?.modelName?.replace(/\s*\([^)]*\)/, '') || 'Model Std';
                              const eff = ue.efficiency ?? 100;
                              const isHigh = ue.val >= ue.target;

                              return (
                                <div
                                  key={ue.id}
                                  className={`flex items-center justify-between gap-1 px-1.5 py-0.5 rounded border text-[8.5px] transition-colors ${
                                    isFocused
                                      ? 'bg-sky-950/90 border-sky-400 text-white font-bold shadow-2xs'
                                      : isAnyFocused
                                      ? 'bg-slate-800/40 border-slate-700/30 text-slate-400 opacity-50'
                                      : 'bg-slate-800/80 border-slate-700/60 text-slate-200'
                                  }`}
                                >
                                  {/* Left: Machine Dot + Name + Model */}
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shrink-0 shadow-2xs"
                                      style={{ backgroundColor: ue.color }}
                                    />
                                    <span className="font-bold text-slate-100 truncate max-w-[95px]" title={chamberName}>
                                      {chamberName}
                                    </span>
                                    <span className="text-slate-400 text-[8px] truncate max-w-[80px] border-l border-slate-700/80 pl-1" title={modelName}>
                                      {modelName}
                                    </span>
                                  </div>

                                  {/* Right: Actual Value / Target + Efficiency % */}
                                  <div className="flex items-center gap-1 shrink-0 text-right">
                                    <span className="text-white font-bold">
                                      {ue.val.toLocaleString()}
                                    </span>
                                    <span className="text-slate-400 text-[8px]">
                                      /{ue.target}
                                    </span>
                                    <span
                                      className={`text-[8px] font-bold px-0.5 rounded ${
                                        isHigh ? 'text-emerald-400' : 'text-amber-400'
                                      }`}
                                    >
                                      {eff}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }}
                  />
                  {/* Dynamic Lines for each unit in fleet */}
                  {units.map((u, uIdx) => {
                    const lineColors = ['#0369a1', '#047857', '#b45309', '#4f46e5', '#be123c', '#7c3aed'];
                    const color = lineColors[uIdx % lineColors.length];
                    const unitLabel = processType === 'Vacuum'
                      ? `${u.name} (Chamber ${uIdx === 0 ? 'A' : 'B'})`
                      : `${u.name} (Line 0${uIdx + 1})`;
                    const dataKey = `unit_${u.id}`;

                    const isInteractiveProcess = processType === 'Bake' || processType === 'XRAY';
                    const isFocused = focusedLineUnitId === u.id;
                    const isAnyFocused = focusedLineUnitId !== null;
                    // In Bake and X-Ray, when focusing on a line, other lines cannot be clicked
                    const isClickDisabled = isInteractiveProcess && isAnyFocused && !isFocused;

                    // When focusing on one machine graph, make that graph prominent and soften others:
                    const strokeOpacity = isFocused ? 1 : isAnyFocused ? 0.08 : 0.9;
                    const strokeWidth = isFocused ? 4.5 : isAnyFocused ? 1.5 : 2.5;

                    return (
                      <Line
                        key={u.id}
                        type="monotone"
                        dataKey={dataKey}
                        name={unitLabel}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeOpacity={strokeOpacity}
                        cursor={isClickDisabled ? 'not-allowed' : 'pointer'}
                        style={isClickDisabled ? { pointerEvents: 'none' } : undefined}
                        onClick={() => {
                          if (!isClickDisabled) {
                            handleLineClick(u.id);
                          }
                        }}
                        dot={(props: any) => {
                          const dotOpacity = isFocused ? 1 : isAnyFocused ? 0.06 : 0.85;
                          const dotRadius = isFocused ? 7 : isAnyFocused ? 2.5 : 4.5;
                          return (
                            <circle
                              key={`dot-${u.id}-${props.payload.hour}`}
                              cx={props.cx}
                              cy={props.cy}
                              r={dotRadius}
                              fill={color}
                              fillOpacity={dotOpacity}
                              stroke="#ffffff"
                              strokeWidth={isFocused ? 2.5 : 1}
                              strokeOpacity={dotOpacity}
                              style={isClickDisabled ? { pointerEvents: 'none', cursor: 'not-allowed' } : { cursor: 'pointer' }}
                              className={isClickDisabled ? 'opacity-20' : 'cursor-pointer transition-all hover:scale-130'}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isClickDisabled) {
                                  handleLineClick(u.id);
                                }
                              }}
                            >
                              <title>
                                {isFocused
                                  ? `Click on ${u.name} again to open machine page`
                                  : `Click to highlight ${u.name}`}
                              </title>
                            </circle>
                          );
                        }}
                        activeDot={
                          isClickDisabled
                            ? false
                            : {
                                r: isFocused ? 9 : 7,
                                stroke: color,
                                strokeWidth: isFocused ? 3.5 : 2,
                                fill: '#ffffff',
                                cursor: 'pointer',
                                onClick: (_e: any) => {
                                  handleLineClick(u.id);
                                },
                              }
                        }
                      />
                    );
                  })}
                </LineChart>
              ) : (
                /* Single Machine View or Other Processes: AreaChart with Gradient */
                <AreaChart
                  data={combinedHourlyData}
                  margin={{ top: 12, right: 15, left: -10, bottom: 5 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const clicked = e.activePayload[0].payload;
                      setSelectedHourlyPoint({
                        hour: clicked.hour,
                        modelId: clicked.hourlyModel?.modelId,
                        modelName: clicked.hourlyModel?.modelName,
                      });
                      setShowModelRange(true);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="ovenAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isSky ? '#0284c7' : isEmerald ? '#059669' : '#d97706'} stopOpacity={0.25} />
                      <stop offset="70%" stopColor={isSky ? '#0284c7' : isEmerald ? '#059669' : '#d97706'} stopOpacity={0.05} />
                      <stop offset="100%" stopColor={isSky ? '#0284c7' : isEmerald ? '#059669' : '#d97706'} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="hour"
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
                    y={currentHourSlot?.targetRef || (viewUnit === 'magazines' ? 15 : 1000)}
                    stroke="#059669"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Target ${viewUnit === 'magazines' ? `${currentHourSlot?.targetMagazines || 15} Mag/h` : `${(currentHourSlot?.targetBoards || 1000).toLocaleString()} Pcs/h`}`,
                      position: 'insideTopRight',
                      fill: '#059669',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  />
                  <Tooltip
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                    wrapperStyle={{ zIndex: 60, pointerEvents: 'none', outline: 'none' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const hm = data.hourlyModel;
                        const unitLabel = viewUnit === 'magazines' ? 'Mag' : 'Pcs';
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl text-[10px] font-mono shadow-2xl border border-slate-700 space-y-1.5 z-50 w-64 pointer-events-none select-none overflow-hidden">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                              <span className={`font-bold flex items-center gap-1.5 text-[10.5px] ${isEmerald ? 'text-emerald-400' : 'text-sky-400'}`}>
                                <Clock className="w-3 h-3" />
                                <span>{data.timeRange}</span>
                              </span>
                              <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold ${
                                data.isHigh
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                              }`}>
                                {data.isHigh ? '✓ Met' : '⚠ Below'} ({data.efficiencyPercent}%)
                              </span>
                            </div>

                            {/* Active Model Running at This Hour */}
                            {hm && (
                              <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/70 space-y-0.5">
                                <div className="text-white font-bold text-[10px] truncate">
                                  {hm.modelName}
                                </div>
                                <div className="text-[8.5px] text-slate-400 flex items-center justify-between">
                                  <span>Lot: {hm.lotId}</span>
                                  <span>Recipe: {hm.recipe}</span>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[9.5px]">
                              <span className="text-slate-400">Output:</span>
                              <strong className="text-emerald-400 font-bold">
                                {viewUnit === 'magazines'
                                  ? `${data.actualVal} Mag (${hm ? hm.actualPcs : data.totalBoards} Pcs)`
                                  : `${data.actualVal.toLocaleString()} Pcs (${hm ? hm.actualMag : 2} Mag)`}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between text-[9px] text-slate-400">
                              <span>Target:</span>
                              <span className="text-slate-200">
                                {viewUnit === 'magazines'
                                  ? `${data.targetRef} Mag/h`
                                  : `${data.targetRef.toLocaleString()} Pcs/h`}
                              </span>
                            </div>

                            {/* Per-oven breakdown inside tooltip if multiple */}
                            {data.breakdown && data.breakdown.length > 1 && (
                              <div className="pt-1 border-t border-slate-800 space-y-0.5 text-[8.5px]">
                                <span className="text-slate-400 uppercase tracking-wider block font-bold text-[8px]">
                                  Chamber Breakdown:
                                </span>
                                {data.breakdown.map((item: any) => (
                                  <div key={item.unitId} className="flex items-center justify-between text-slate-300">
                                    <span>{item.unitName || item.unitId}:</span>
                                    <span className="font-bold text-white">
                                      {viewUnit === 'magazines' ? `${item.mag} Mag` : `${item.boards} Pcs`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="actualVal"
                    name={viewUnit === 'magazines' ? 'Magazines' : 'Boards (UPH)'}
                    stroke={isSky ? '#0369a1' : isEmerald ? '#047857' : '#b45309'}
                    strokeWidth={3}
                    fill="url(#ovenAreaGrad)"
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      const isHigh = payload.isHigh;
                      const isSelected = selectedHourlyPoint?.hour === payload.hour;
                      return (
                        <circle
                          key={`oven-dot-${payload.hour}`}
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 7 : 5}
                          fill={isSelected ? '#0369a1' : isHigh ? '#059669' : '#f59e0b'}
                          stroke={isSelected ? '#ffffff' : isHigh ? '#047857' : '#b45309'}
                          strokeWidth={isSelected ? 3 : 2}
                          className="cursor-pointer transition-all hover:scale-150"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            setSelectedHourlyPoint({
                              hour: payload.hour,
                              modelId: payload.hourlyModel?.modelId,
                              modelName: payload.hourlyModel?.modelName,
                            });
                            setShowModelRange(true);
                          }}
                        />
                      );
                    }}
                    activeDot={{
                      r: 8,
                      stroke: isSky ? '#0369a1' : '#047857',
                      strokeWidth: 2.5,
                      fill: '#ffffff',
                      cursor: 'pointer',
                      onClick: (e: any, payload: any) => {
                        if (payload?.payload) {
                          setSelectedHourlyPoint({
                            hour: payload.payload.hour,
                            modelId: payload.payload.hourlyModel?.modelId,
                            modelName: payload.payload.hourlyModel?.modelName,
                          });
                          setShowModelRange(true);
                        }
                      },
                    }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Detailed Machine Data (Only shown when a specific machine is selected) */}
          {!isAllSelected && activeUnit && (() => {
            const machineSummary = getMachineRunSummary(activeUnit.id, activeUnit.name, processType);
            const modelRanges = computeModelRangesForMachine(machineSummary);

            return (
              <div className="mt-4 pt-4 border-t border-sky-100 space-y-4">
                {/* Production Report Section */}
                {!showModelRange ? (
                  <div className="p-4 bg-linear-to-r from-sky-50 via-white to-sky-50 rounded-2xl border border-sky-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 shrink-0 shadow-2xs">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm font-mono">
                            Production Range Report — {activeUnit.name}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-950 border border-sky-200 font-mono">
                            {machineSummary.models.length} Models
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-mono mt-0.5">
                          Showing model, time range, total output, and share
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowModelRange(true)}
                      className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-102 shrink-0"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Open Production Range Report ({machineSummary.models.length} Models) ↗</span>
                    </button>
                  </div>
                ) : (
                  /* Expanded Production Range View - Showing ONLY: model, time range, total output, share */
                  <div className="bg-white rounded-2xl border border-sky-300 p-4 sm:p-5 shadow-xs space-y-4 ring-1 ring-sky-200">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wider">
                              Production Range Report — {activeUnit.name}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                              {machineSummary.models.length} Models
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Showing model, time range, total output, and share
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {selectedHourlyPoint && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-300 rounded-lg text-xs font-mono">
                            <span className="text-sky-950 font-bold">📍 Time {selectedHourlyPoint.hour}</span>
                            <button
                              onClick={() => setSelectedHourlyPoint(null)}
                              className="text-slate-400 hover:text-rose-600 font-bold ml-1 text-xs cursor-pointer"
                              title="Clear time filter"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => setShowModelRange(false)}
                          className="px-3 py-1.5 text-xs font-mono font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>▲ Hide Production Range Report</span>
                        </button>
                      </div>
                    </div>

                    {/* Table showing ONLY: Model, Time Range, Total Output, Share */}
                    <div className="overflow-x-auto rounded-xl border border-sky-200 bg-slate-50/50">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="bg-sky-100/70 border-b border-sky-200 text-sky-950 uppercase text-[11px]">
                            <th className="py-3 px-4">Model</th>
                            <th className="py-3 px-4">Time Range</th>
                            <th className="py-3 px-4">Total Output</th>
                            <th className="py-3 px-4">Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {modelRanges.map((mr) => {
                            const isHighlighted = selectedHourlyPoint?.modelId === mr.modelId;
                            return (
                              <tr
                                key={mr.modelId}
                                className={`transition-colors ${
                                  isHighlighted
                                    ? 'bg-sky-50 font-bold ring-1 ring-sky-300'
                                    : 'hover:bg-sky-50/50'
                                }`}
                              >
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                                    {isHighlighted && <span className="text-sky-600 text-xs">📍</span>}
                                    <span>{mr.modelName}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-normal">{mr.category}</span>
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-slate-700">
                                  <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-800 text-xs">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    {mr.activeTimeRange}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-black text-slate-900">
                                  <div className="text-sm text-sky-950 font-bold">
                                    {viewUnit === 'magazines'
                                      ? `${mr.totalMagazines} Magazines`
                                      : `${mr.totalPcs.toLocaleString()} Boards`}
                                  </div>
                                  <span className="text-[10px] font-normal text-slate-500">
                                    {viewUnit === 'magazines'
                                      ? `(${mr.totalPcs.toLocaleString()} Boards)`
                                      : `(${mr.totalMagazines} Magazines)`}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2.5 max-w-[220px]">
                                    <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        style={{ width: `${mr.percentage}%` }}
                                        className="h-full rounded-full bg-sky-600"
                                      />
                                    </div>
                                    <span className="font-bold text-slate-900 text-xs min-w-[38px] text-right">
                                      {mr.percentage}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Recent Batches on this Machine */}
                <div className="bg-white rounded-2xl border border-sky-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-sky-100">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <h4 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wider">
                        Recent Batch & Lot Run History for this Machine
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      Operator: {activeUnit.operatorId}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                          <th className="py-2 px-2.5">Lot No.</th>
                          <th className="py-2 px-2.5">Recipe Program</th>
                          <th className="py-2 px-2.5">Time Range</th>
                          <th className="py-2 px-2.5">Quantity</th>
                          <th className="py-2 px-2.5">Yield Rate</th>
                          <th className="py-2 px-2.5">Status</th>
                          <th className="py-2 px-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {machineSummary.models.flatMap((m) => m.lots).slice(0, 4).map((lot) => (
                          <tr key={lot.lotId} className="hover:bg-sky-50/40 transition-colors">
                            <td className="py-2.5 px-2.5 font-bold text-slate-900">{lot.lotId}</td>
                            <td className="py-2.5 px-2.5 text-slate-700">{lot.recipe}</td>
                            <td className="py-2.5 px-2.5 text-slate-600">{lot.timeRange}</td>
                            <td className="py-2.5 px-2.5 font-bold text-slate-900">{lot.quantity} pcs ({lot.magazines} mag)</td>
                            <td className="py-2.5 px-2.5">
                              <span className="font-bold text-emerald-700">{lot.yieldRate}%</span>
                            </td>
                            <td className="py-2.5 px-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                lot.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-sky-100 text-sky-800 animate-pulse'
                              }`}>
                                {lot.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-2.5 text-right">
                              <button
                                onClick={() => openTraceabilityModal(lot.lotId)}
                                className="px-2 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Trace
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* Comparison View Mode */
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#64748b]">
            <span>Cumulative Output Comparison by Chamber</span>
            <div className="flex items-center gap-3 bg-white px-2.5 py-1 rounded-lg border border-[#cbd5e1]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs shadow-2xs bg-[#4db6ac]" />
                <strong className="text-emerald-900 font-bold">Pass Target (≥ Target)</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs border border-amber-300 bg-[#fff176]" />
                <span className="text-amber-900 font-bold">Below Target (&lt; Target)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {perUnitComparisonData.map((item) => {
              const barColor = getDynamicBarColor(item.isHigh, item.isLow, item.isZero);
              const borderColor = getDynamicBarBorder(item.isHigh, item.isLow, item.isZero);

              return (
                <div
                  key={item.unitId}
                  onClick={() => onSelectUnit && onSelectUnit(item.unitId)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all hover:shadow-md ${
                    selectedUnitId === item.unitId
                      ? isEmerald
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/30'
                        : 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/30'
                      : 'border-[#cbd5e1] bg-[#f8fafc] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-black text-sm text-[#0f172a] block">
                        {item.unitName}
                      </span>
                      <span className="text-[10px] text-[#64748b] font-mono">
                        OP: {item.operatorId} • {item.runningModel}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      item.status === 'RUNNING' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-[#64748b]">Total Output:</span>
                      <span className="font-black text-sm text-[#0f172a]">
                        {viewUnit === 'magazines' ? `${item.totalMag} Mag` : `${item.totalBrd.toLocaleString()} Boards`}
                      </span>
                    </div>

                    {/* Bar visualization of volume */}
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                      <div
                        style={{
                          width: `${Math.min(100, (item.actual / Math.max(1, item.target)) * 100)}%`,
                          backgroundColor: barColor,
                          borderColor: borderColor,
                        }}
                        className="h-full rounded-full transition-all duration-300 border"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono mt-1.5">
                      <span className={item.isHigh ? (isEmerald ? 'text-emerald-700 font-bold' : 'text-sky-700 font-bold') : 'text-amber-800 font-bold'}>
                        {item.isHigh ? '✓ Target Met / Normal' : '⚠ Below Target'}
                      </span>
                      <span className="text-[#64748b]">
                        {item.efficiencyPercent}% of Target
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {children && (
        <div className="pt-4 border-t border-[#cbd5e1]/60">
          {children}
        </div>
      )}

      {/* Drill-down modal for model and batch details */}
      <MachineModelDrilldownModal
        isOpen={!!drilldownMachine}
        onClose={() => setDrilldownMachine(null)}
        machineData={drilldownMachine}
        onOpenTraceability={openTraceabilityModal}
      />
    </section>
  );
};
