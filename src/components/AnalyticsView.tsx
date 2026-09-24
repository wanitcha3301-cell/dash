import React, { useState, useMemo } from 'react';
import { Header } from './Header';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Activity,
  Cpu,
  Award,
  ArrowRight,
  Map,
  Barcode,
  AlertTriangle,
  TrendingUp,
  Zap,
  BarChart2,
  Radio
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { INITIAL_FULL_9_FVMI_FLEET, FVMI_SUPPORTED_MODELS, FVMIMachineFullData } from '../data/fvmiFleetData';
import { ALL_AOI_MACHINES, ALL_XRAY_MACHINES } from '../utils/machineLinkUtils';

type ChartMetricTab = 'throughput' | 'yield' | 'oee';

export const AnalyticsView: React.FC = () => {
  const {
    machines,
    ovenUnits,
    chartsData,
    workpieces,
    navigate,
    setSelectedMachineId,
    openTraceabilityModal,
    setShowAlertHistoryModal,
    selectedDate,
    isToday,
    pstTime
  } = useFactory();

  const { t, language } = useLanguage();

  // Chart Metric Tab State
  const [activeChartTab, setActiveChartTab] = useState<ChartMetricTab>('throughput');

  // -------------------------------------------------------------
  // Safely load FVMI Fleet data (from localStorage if saved, else fallback)
  // -------------------------------------------------------------
  const fvmiFleet: FVMIMachineFullData[] = useMemo(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('factory_fvmi_fleet_hourly_data_v2');
        if (saved && saved !== 'undefined' && saved !== 'null') {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return INITIAL_FULL_9_FVMI_FLEET.map((initStation) => {
              const matchingSaved = parsed.find((p: any) => p.id === initStation.id);
              if (matchingSaved) {
                return {
                  ...initStation,
                  status: matchingSaved.status || initStation.status,
                  activeModelId: matchingSaved.activeModelId || initStation.activeModelId,
                  models: {
                    ...initStation.models,
                    ...(matchingSaved.models || {})
                  }
                };
              }
              return initStation;
            });
          }
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_FULL_9_FVMI_FLEET;
  }, []);

  // -------------------------------------------------------------
  // Aggregated Data Across All 5 Stages
  // -------------------------------------------------------------

  // 1. Dispensing (Line 01-05, MC-01..13)
  const dispensingStats = useMemo(() => {
    const totalCount = machines.length;
    const running = machines.filter((m) => m.status === 'RUNNING').length;
    const idle = machines.filter((m) => m.status === 'IDLE').length;
    const stopped = machines.filter((m) => m.status === 'STOP' || m.status === 'JAM_CLEAR').length;
    const totalInput = machines.reduce((acc, m) => acc + (m.inputCount || 0), 0);
    const totalOutput = machines.reduce((acc, m) => acc + (m.outputCount || 0), 0);
    const avgUph = Math.round(machines.reduce((acc, m) => acc + (m.uph || 0), 0) / (totalCount || 1));
    const avgOee = (
      machines.reduce((acc, m) => acc + (m.oeePercent || 0), 0) / (totalCount || 1)
    ).toFixed(1);
    const yieldPct = totalInput > 0 ? ((totalOutput / totalInput) * 100).toFixed(2) : '99.20';

    return { totalCount, running, idle, stopped, totalInput, totalOutput, avgUph, avgOee, yieldPct };
  }, [machines]);

  // 2. Vacuum Ovens (Line 06, vac-1..2)
  const vacuumStats = useMemo(() => {
    const vacUnits = ovenUnits.filter((u) => u.subType === 'Vacuum');
    const totalCount = vacUnits.length;
    const running = vacUnits.filter((u) => u.status === 'RUNNING').length;
    const avgTemp = (
      vacUnits.reduce((acc, u) => acc + (u.tempCelsius || 0), 0) / (totalCount || 1)
    ).toFixed(1);
    const avgPressure = (
      vacUnits.reduce((acc, u) => acc + (u.pressurePa !== undefined ? u.pressurePa / 1000 : 0.08), 0) / (totalCount || 1)
    ).toFixed(2);
    const totalPcs = vacUnits.reduce((acc, u) => acc + (u.pcsCount || 600), 0);

    return { totalCount, running, avgTemp, avgPressure, totalPcs, units: vacUnits };
  }, [ovenUnits]);

  // 3. Bake Ovens (Line 07, bake-1..5)
  const bakeStats = useMemo(() => {
    const bakeUnits = ovenUnits.filter((u) => u.subType === 'Bake');
    const totalCount = bakeUnits.length;
    const running = bakeUnits.filter((u) => u.status === 'RUNNING').length;
    const avgTemp = (
      bakeUnits.reduce((acc, u) => acc + (u.tempCelsius || 0), 0) / (totalCount || 1)
    ).toFixed(1);
    const totalMagazines = bakeUnits.reduce((acc, u) => acc + (u.magazinesCount || 0), 0);
    const totalPcs = bakeUnits.reduce((acc, u) => acc + (u.pcsCount || 0), 0);

    return { totalCount, running, avgTemp, totalMagazines, totalPcs, units: bakeUnits };
  }, [ovenUnits]);

  // 4. FVMI Inspection Fleet (Line 08-09, FVMI-01..09)
  const fvmiStats = useMemo(() => {
    let totalInspected = 0;
    let totalPass = 0;
    let totalFail = 0;
    let totalRework = 0;
    let totalXout = 0;
    let totalDiscard = 0;
    let totalUph = 0;
    let running = 0;
    const allDefects: { code: string; desc: string; category: string; count: number }[] = [];

    fvmiFleet.forEach((st) => {
      if (st.status === 'RUNNING') running++;
      const activeMod = st.models[st.activeModelId] || Object.values(st.models)[0];
      if (activeMod) {
        totalUph += activeMod.uph || 0;
        const stationIn = activeMod.hourlyData.reduce((acc, h) => acc + (h.actualIn || 0), 0);
        const stationPass = activeMod.hourlyData.reduce((acc, h) => acc + (h.passCount || 0), 0);
        const stationFail = activeMod.hourlyData.reduce((acc, h) => acc + (h.failCount || 0), 0);
        const stationRework = activeMod.hourlyData.reduce((acc, h) => acc + (h.reworkCount || 0), 0);
        const stationXout = activeMod.hourlyData.reduce((acc, h) => acc + (h.xoutCount || 0), 0);
        const stationDiscard = activeMod.hourlyData.reduce((acc, h) => acc + (h.discardCount || 0), 0);

        totalInspected += stationIn;
        totalPass += stationPass;
        totalFail += stationFail;
        totalRework += stationRework;
        totalXout += stationXout;
        totalDiscard += stationDiscard;

        (activeMod.recentDefects || []).forEach((d) => {
          const existing = allDefects.find((x) => x.code === d.code);
          if (existing) {
            existing.count++;
          } else {
            allDefects.push({ code: d.code, desc: d.description, category: d.category, count: 1 });
          }
        });
      }
    });

    const passRate = totalInspected > 0 ? ((totalPass / totalInspected) * 100).toFixed(2) : '98.85';
    const avgUph = Math.round(totalUph / (fvmiFleet.length || 1));

    return {
      totalCount: fvmiFleet.length,
      running,
      totalInspected,
      totalPass,
      totalFail,
      totalRework,
      totalXout,
      totalDiscard,
      passRate,
      avgUph,
      topDefects: allDefects.sort((a, b) => b.count - a.count).slice(0, 5)
    };
  }, [fvmiFleet]);

  // 5. AOI & X-Ray Quality Inspection
  const inspectionStats = useMemo(() => {
    // AOI 2 machines
    const aoiHours = chartsData.aoi.hours;
    const aoiTotalInspected = chartsData.aoi.uph.reduce((a, b) => a + b, 0);
    const aoiGoodEst = Math.round(aoiTotalInspected * 0.993);
    const aoiYield = ((aoiGoodEst / aoiTotalInspected) * 100).toFixed(2);

    // X-Ray 5 machines
    const xrayHours = chartsData.xray.hours;
    const xrayTotalScanned = chartsData.xray.uph.reduce((a, b) => a + b, 0);
    const xrayGoodEst = Math.round(xrayTotalScanned * 0.995);
    const xrayYield = ((xrayGoodEst / xrayTotalScanned) * 100).toFixed(2);

    return {
      aoiTotalInspected,
      aoiYield,
      xrayTotalScanned,
      xrayYield,
      avgVoidPct: '4.8',
      tubeStatus: 'SAFE (<0.04 μSv/hr)'
    };
  }, [chartsData]);

  // Overall Plant Executive Metrics
  const executiveMetrics = useMemo(() => {
    const totalAllMachines = machines.length + ovenUnits.length + fvmiFleet.length + ALL_AOI_MACHINES.length + ALL_XRAY_MACHINES.length;
    const totalRunning = dispensingStats.running + vacuumStats.running + bakeStats.running + fvmiStats.running + 2 + 5;
    const totalIdle = dispensingStats.idle + (totalAllMachines - totalRunning - dispensingStats.stopped);
    const totalStopped = dispensingStats.stopped;

    // First Pass Yield (combined across stages: Dispensing -> Vacuum/Bake Oven -> FVMI -> AOI -> X-Ray)
    const dispYieldNum = parseFloat(dispensingStats.yieldPct) / 100;
    const fvmiYieldNum = parseFloat(fvmiStats.passRate) / 100;
    const aoiYieldNum = parseFloat(inspectionStats.aoiYield) / 100;
    const xrayYieldNum = parseFloat(inspectionStats.xrayYield) / 100;
    const overallFpy = (dispYieldNum * 0.998 * fvmiYieldNum * aoiYieldNum * xrayYieldNum * 100).toFixed(2);

    // Factory Total Output: Sum of inspected pieces
    const totalFinishedOutput = fvmiStats.totalPass + inspectionStats.aoiTotalInspected;

    return {
      totalAllMachines,
      totalRunning,
      totalIdle,
      totalStopped,
      activePercent: ((totalRunning / totalAllMachines) * 100).toFixed(1),
      overallFpy,
      totalFinishedOutput,
      avgOee: dispensingStats.avgOee
    };
  }, [machines, ovenUnits, fvmiFleet, dispensingStats, vacuumStats, bakeStats, fvmiStats, inspectionStats]);

  // -------------------------------------------------------------
  // Hourly Multi-Stage Throughput Chart Data
  // -------------------------------------------------------------
  const hourlyChartData = useMemo(() => {
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    return hours.map((hour, idx) => {
      // Dispensing Output
      const topFill = chartsData.dispensing.topFill[idx % chartsData.dispensing.topFill.length] || 780;
      const underFill = chartsData.dispensing.underFill[idx % chartsData.dispensing.underFill.length] || 760;
      const dispensingTotal = topFill + underFill;

      // Oven batches
      const vacBatches = chartsData.oven.vacuum[idx % chartsData.oven.vacuum.length] || 6;
      const bakeBatches = chartsData.oven.bake[idx % chartsData.oven.bake.length] || 6;
      const ovenThroughput = (vacBatches + bakeBatches) * 120;

      // FVMI inspected
      const fvmiInspected = chartsData.fvmi.total[idx % chartsData.fvmi.total.length] || 1100;

      // AOI and X-Ray
      const aoiUph = chartsData.aoi.uph[idx % chartsData.aoi.uph.length] || 1120;
      const xrayUph = chartsData.xray.uph[idx % chartsData.xray.uph.length] || 320;
      const aoiThroughput = aoiUph;

      // Quality Yields (%)
      const dispensingYield = (99.0 + (idx % 4) * 0.25).toFixed(2);
      const fvmiYield = (98.6 + ((idx * 7) % 10) * 0.12).toFixed(2);
      const aoiYield = (99.2 + ((idx * 3) % 7) * 0.1).toFixed(2);
      const xrayYield = (99.4 + ((idx * 5) % 5) * 0.1).toFixed(2);

      // OEE (%)
      const dispensingOee = (93.5 + ((idx * 4) % 6) * 0.6).toFixed(1);
      const fvmiOee = (95.0 + ((idx * 3) % 5) * 0.5).toFixed(1);
      const aoiOee = (96.2 + ((idx * 2) % 4) * 0.4).toFixed(1);

      return {
        hour,
        dispensingTotal,
        ovenThroughput,
        fvmiInspected,
        aoiThroughput,
        xrayScanned: xrayUph,
        dispensingYield: parseFloat(dispensingYield),
        fvmiYield: parseFloat(fvmiYield),
        aoiYield: parseFloat(aoiYield),
        xrayYield: parseFloat(xrayYield),
        dispensingOee: parseFloat(dispensingOee),
        fvmiOee: parseFloat(fvmiOee),
        aoiOee: parseFloat(aoiOee)
      };
    });
  }, [chartsData]);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-28">
      {/* Primary Header */}
      <Header
        title={t('nav.analytics', 'Plant Analytics & Operational Intelligence')}
        subtitle="End-to-End Live Factory Metrics Linked Across Dispensing, Vacuum, Bake, FVMI, AOI & X-Ray"
        badge={
          <span className="text-[11px] font-mono font-bold text-sky-950 bg-[#b3e5fc] border border-sky-300 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
            {executiveMetrics.totalRunning}/{executiveMetrics.totalAllMachines} MACHINES SYNCED
          </span>
        }
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 space-y-6">
        {/* Quick Link Navigation Strip to Other Views */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Radio className="w-4 h-4 text-sky-600 animate-pulse" />
            <span>Direct Navigation Links:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('main-floor')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-900 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Map className="w-3.5 h-3.5 text-sky-600" />
              <span>CAD Floor Plan</span>
            </button>

            <button
              onClick={() => navigate('process-view')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-900 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-sky-600" />
              <span>Process View</span>
            </button>

            <button
              onClick={() => openTraceabilityModal()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Barcode className="w-3.5 h-3.5 text-sky-600" />
              <span>Workpiece Traceability</span>
            </button>

            <button
              onClick={() => setShowAlertHistoryModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Live Alerts</span>
            </button>
          </div>
        </section>

        {/* Top-Level Plant Executive KPIs (Linked Across All 5 Production Stages) */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: Total Finished Output */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between group hover:border-sky-300 transition-all">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold tracking-wider uppercase">
                  Finished Output
                </span>
                <Activity className="w-4 h-4 text-sky-600" />
              </div>
              <div className="font-mono font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                {executiveMetrics.totalFinishedOutput.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+2.4% vs Daily Shift Target</span>
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>FVMI, AOI & X-Ray</span>
              <span className="font-mono font-bold text-slate-700">100% Synced</span>
            </div>
          </div>

          {/* Card 2: Overall Plant First-Pass-Yield */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between group hover:border-emerald-300 transition-all">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold tracking-wider uppercase">
                  Plant First-Pass Yield
                </span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-mono font-black text-2xl sm:text-3xl text-emerald-700 tracking-tight">
                {executiveMetrics.overallFpy}%
              </div>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                Target Spec: &gt; 98.00%
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>5 Stages In Spec</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                OPTIMAL
              </span>
            </div>
          </div>

          {/* Card 3: Machine Fleet Operational Health */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between group hover:border-sky-300 transition-all">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold tracking-wider uppercase">
                  Operational Health
                </span>
                <Cpu className="w-4 h-4 text-sky-600" />
              </div>
              <div className="font-mono font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                {executiveMetrics.totalRunning}/{executiveMetrics.totalAllMachines}
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 flex">
                <div
                  style={{ width: `${(executiveMetrics.totalRunning / executiveMetrics.totalAllMachines) * 100}%` }}
                  className="bg-emerald-500"
                />
                <div
                  style={{ width: `${(executiveMetrics.totalStopped / executiveMetrics.totalAllMachines) * 100}%` }}
                  className="bg-rose-500"
                />
              </div>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="text-emerald-700 font-bold">{executiveMetrics.activePercent}% Active</span>
              <span>{executiveMetrics.totalStopped} Stopped</span>
            </div>
          </div>

          {/* Card 4: Average Fleet OEE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between group hover:border-sky-300 transition-all">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold tracking-wider uppercase">
                  Weighted OEE
                </span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="font-mono font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                {executiveMetrics.avgOee}%
              </div>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                Benchmark: &gt; 90.0%
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>World Class SMT</span>
              <span className="text-sky-700 font-bold font-mono">Tier A</span>
            </div>
          </div>

          {/* Card 5: Active WIP & Traceability Lineage */}
          <div
            onClick={() => openTraceabilityModal()}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between group hover:border-sky-400 hover:bg-sky-50/30 cursor-pointer transition-all col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-1"
          >
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold tracking-wider uppercase text-sky-800">
                  WIP Traceability
                </span>
                <Barcode className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="font-mono font-black text-2xl sm:text-3xl text-sky-900 tracking-tight">
                {workpieces.length * 140}
              </div>
              <span className="text-[11px] text-sky-700 font-semibold mt-1 flex items-center gap-1">
                <span>Click to Inspect Serials</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Lot LOT-2026-A</span>
              <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded">
                LIVE
              </span>
            </div>
          </div>
        </section>

        {/* Hourly Multi-Stage Throughput & Quality Chart */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-sky-600" />
                <span>Cross-Stage Hourly Telemetry & Quality Comparison</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hourly metrics linked directly to Process View, FVMI, AOI, and X-Ray telemetry.
              </p>
            </div>

            {/* Metric Tab Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveChartTab('throughput')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'throughput'
                    ? 'bg-white text-sky-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Throughput (Pcs/Hr)
              </button>
              <button
                onClick={() => setActiveChartTab('yield')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'yield'
                    ? 'bg-white text-sky-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yield / Pass Rate (%)
              </button>
              <button
                onClick={() => setActiveChartTab('oee')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'oee'
                    ? 'bg-white text-sky-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                OEE Metric (%)
              </button>
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'throughput' ? (
                <BarChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(value: any, name: any) => [`${value} pcs`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="dispensingTotal" name="Dispensing Output" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ovenThroughput" name="Oven Batches (Eqv)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fvmiInspected" name="FVMI Inspected" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aoiThroughput" name="AOI Inspected" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="xrayScanned" name="X-Ray Scanned" fill="#ea580c" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : activeChartTab === 'yield' ? (
                <LineChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[97, 100]} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(value: any, name: any) => [`${value}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="dispensingYield" name="Dispensing Yield" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="fvmiYield" name="FVMI Pass Rate" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="aoiYield" name="AOI Yield" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="xrayYield" name="X-Ray Pass Rate" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              ) : (
                <LineChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[85, 100]} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(value: any, name: any) => [`${value}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="dispensingOee" name="Dispensing OEE" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="fvmiOee" name="FVMI OEE" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="aoiOee" name="AOI OEE" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
};

