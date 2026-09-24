import React, { useState, useMemo } from 'react';
import { useFactory } from '../context/FactoryContext';
import { ArrowUpRight, Edit3, X, BarChart3, Layers, TrendingUp, Flame, Wind, Cpu, Eye, Activity, CheckCircle2, ChevronRight, Gauge, Clock } from 'lucide-react';
import { CATEGORY_METADATA } from '../data/defaultCadLayout';
export { ProcessViewHourlyChart } from './ProcessViewHourlyChart';

export interface ShiftHourRecord {
  hour: string; // e.g. '08:00'
  range: string; // e.g. '08:00 - 09:00'
  vacuum: number;
  bake: number;
  dispensing: number;
  fvmi: number;
  aoi: number;
  xray: number;
  total: number;
}

export const SHIFT_HOURLY_RECORDS: ShiftHourRecord[] = [
  { hour: '08:00', range: '08:00 - 09:00', vacuum: 2360, bake: 5980, dispensing: 11320, fvmi: 9850, aoi: 2240, xray: 5500, total: 37250 },
  { hour: '09:00', range: '09:00 - 10:00', vacuum: 2400, bake: 6050, dispensing: 11480, fvmi: 10020, aoi: 2280, xray: 5580, total: 37810 },
  { hour: '10:00', range: '10:00 - 11:00', vacuum: 2380, bake: 6010, dispensing: 11520, fvmi: 9990, aoi: 2260, xray: 5550, total: 37710 },
  { hour: '11:00', range: '11:00 - 12:00', vacuum: 2420, bake: 6120, dispensing: 11400, fvmi: 10120, aoi: 2310, xray: 5620, total: 37990 },
  { hour: '12:00', range: '12:00 - 13:00', vacuum: 2280, bake: 5850, dispensing: 10950, fvmi: 9750, aoi: 2190, xray: 5400, total: 36420 },
  { hour: '13:00', range: '13:00 - 14:00', vacuum: 2400, bake: 6040, dispensing: 11500, fvmi: 10080, aoi: 2270, xray: 5560, total: 37850 },
  { hour: '14:00', range: '14:00 - 15:00', vacuum: 2380, bake: 6020, dispensing: 11620, fvmi: 9960, aoi: 2290, xray: 5590, total: 37860 },
  { hour: '15:00', range: '15:00 - 16:00', vacuum: 2420, bake: 6100, dispensing: 11450, fvmi: 10100, aoi: 2320, xray: 5640, total: 38030 },
  { hour: '16:00', range: '16:00 - 17:00', vacuum: 2360, bake: 5950, dispensing: 11380, fvmi: 9880, aoi: 2250, xray: 5520, total: 37340 },
  { hour: '17:00', range: '17:00 - 18:00', vacuum: 2380, bake: 6010, dispensing: 11480, fvmi: 9990, aoi: 2260, xray: 5550, total: 37670 },
];

/**
 * TotalLineCombinedChart
 * Master Total Chart for Process View: Aggregates total throughput across all machines and 6 SMT stages.
 * Default view shows the Consolidated Machine Fleet Bar Chart aligned with the side Map Legend colors:
 *  - Oven (Vacuum): #16a34a
 *  - Oven (Bake): #ca8a04
 *  - Dispensing Machine: #0284c7
 *  - FVMI Inspection: #ea580c
 *  - AOI Inspection: #9333ea
 *  - X-ray Machine: #ec4899
 */
export const TotalLineCombinedChart: React.FC = () => {
  const { chartsData, machines, ovenUnits, navigate } = useFactory();
  const [viewMode, setViewMode] = useState<'comparison' | 'combined-stages' | 'all-machines' | 'aggregate'>('combined-stages');
  const [combinedMetric, setCombinedMetric] = useState<'total' | 'average'>('total');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [hoveredStage, setHoveredStage] = useState<any | null>(null);
  const [hoveredMachine, setHoveredMachine] = useState<any | null>(null);
  const [hoveredHourly, setHoveredHourly] = useState<{ hr: string; range?: string; stage?: string; val?: number } | null>(null);

  // 10 standard shift hours
  const hours = SHIFT_HOURLY_RECORDS.map(r => r.hour);

  const ovenData = chartsData.oven;
  const dispensingData = chartsData.dispensing;
  const fvmiData = chartsData.fvmi;
  const aoiData = chartsData.aoi || {
    hours,
    unit1: [940, 1110, 1170, 1030, 1150, 1090],
    unit2: [960, 1130, 1190, 1050, 1170, 1110],
    uph: [950, 1120, 1180, 1040, 1160, 1100]
  };
  const xrayData = chartsData.xray || {
    hours,
    uph: [960, 1100, 1150, 1060, 1180, 1120]
  };

  // Exact Colors from the Side (FacilitySidebar Map Legend & CATEGORY_METADATA)
  const SIDE_COLORS = {
    vacuum: {
      hex: CATEGORY_METADATA['oven-vacuum'].color, // '#16a34a' (Green)
      hover: '#15803d',
      label: 'Oven (Vacuum)',
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-300',
      text: 'text-emerald-800',
      badge: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]'
    },
    bake: {
      hex: CATEGORY_METADATA['oven-bake'].color, // '#ca8a04' (Yellow/Amber)
      hover: '#a16207',
      label: 'Oven (Bake)',
      bg: 'bg-amber-50/70',
      border: 'border-amber-300',
      text: 'text-amber-800',
      badge: 'bg-[#fef9c3] text-[#a16207] border-[#fef08a]'
    },
    dispensing: {
      hex: CATEGORY_METADATA.dispensing.color, // '#0284c7' (Sky/Cyan)
      hover: '#0369a1',
      label: 'Dispensing Machine',
      bg: 'bg-sky-50/70',
      border: 'border-sky-300',
      text: 'text-sky-800',
      badge: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
    },
    fvmi: {
      hex: CATEGORY_METADATA.fvmi.color, // '#ea580c' (Orange)
      hover: '#c2410c',
      label: 'FVMI Inspection',
      bg: 'bg-orange-50/70',
      border: 'border-orange-300',
      text: 'text-orange-800',
      badge: 'bg-[#ffedd5] text-[#c2410c] border-[#fed7aa]'
    },
    aoi: {
      hex: CATEGORY_METADATA.aoi.color, // '#9333ea' (Purple)
      hover: '#7e22ce',
      label: 'AOI Inspection',
      bg: 'bg-purple-50/70',
      border: 'border-purple-300',
      text: 'text-purple-800',
      badge: 'bg-[#f3e8ff] text-[#7e22ce] border-[#e9d5ff]'
    },
    xray: {
      hex: '#ec4899', // '#ec4899' (Pink - matches Sidebar MAP LEGEND style={{ backgroundColor: '#ec4899' }})
      hover: '#db2777',
      label: 'X-ray Machine',
      bg: 'bg-pink-50/70',
      border: 'border-pink-300',
      text: 'text-pink-800',
      badge: 'bg-[#fdf2f8] text-[#db2777] border-[#fbcfe8]'
    }
  };

  // Full Fleet Dataset of all 35 Machines across all 6 SMT Stages
  const fleetMachines = useMemo(() => {
    // Stage 1: Vacuum Oven (2 units: oven-1, oven-2)
    const vac1 = ovenUnits.find(u => u.id === 'oven-1' || u.name.includes('1'));
    const vac2 = ovenUnits.find(u => u.id === 'oven-2' || u.name.includes('2'));

    // Stage 2: Bake Oven (5 units: oven-3 to oven-7)
    const bake1 = ovenUnits.find(u => u.id === 'oven-3');
    const bake2 = ovenUnits.find(u => u.id === 'oven-4');
    const bake3 = ovenUnits.find(u => u.id === 'oven-5');
    const bake4 = ovenUnits.find(u => u.id === 'oven-6');
    const bake5 = ovenUnits.find(u => u.id === 'oven-7');

    const list = [
      // Stage 1: Vacuum Oven (2 Units) - Green (#16a34a)
      {
        id: 'VAC-01',
        name: 'Vacuum Chamber A',
        stageNum: 1,
        stageKey: 'VACUUM',
        stageName: SIDE_COLORS.vacuum.label,
        barColor: SIDE_COLORS.vacuum.hex,
        barHover: SIDE_COLORS.vacuum.hover,
        border: SIDE_COLORS.vacuum.border,
        uph: vac1?.status === 'STOP' ? 0 : 1200,
        targetUph: 1200,
        status: vac1?.status || 'RUNNING',
        model: vac1?.runningModel || '504-2187',
        nav: () => navigate('vacuum-process')
      },
      {
        id: 'VAC-02',
        name: 'Vacuum Chamber B',
        stageNum: 1,
        stageKey: 'VACUUM',
        stageName: SIDE_COLORS.vacuum.label,
        barColor: SIDE_COLORS.vacuum.hex,
        barHover: SIDE_COLORS.vacuum.hover,
        border: SIDE_COLORS.vacuum.border,
        uph: vac2?.status === 'STOP' ? 0 : 1180,
        targetUph: 1200,
        status: vac2?.status || 'RUNNING',
        model: vac2?.runningModel || '504-2187',
        nav: () => navigate('vacuum-process')
      },
      // Stage 2: Bake Oven (5 Units) - Yellow/Amber (#ca8a04)
      {
        id: 'BAKE-01',
        name: 'Bake Chamber #1',
        stageNum: 2,
        stageKey: 'BAKE',
        stageName: SIDE_COLORS.bake.label,
        barColor: SIDE_COLORS.bake.hex,
        barHover: SIDE_COLORS.bake.hover,
        border: SIDE_COLORS.bake.border,
        uph: bake1?.status === 'STOP' ? 0 : 1200,
        targetUph: 1200,
        status: bake1?.status || 'RUNNING',
        model: bake1?.runningModel || '504-2187',
        nav: () => navigate('bake-process')
      },
      {
        id: 'BAKE-02',
        name: 'Bake Chamber #2',
        stageNum: 2,
        stageKey: 'BAKE',
        stageName: SIDE_COLORS.bake.label,
        barColor: SIDE_COLORS.bake.hex,
        barHover: SIDE_COLORS.bake.hover,
        border: SIDE_COLORS.bake.border,
        uph: bake2?.status === 'STOP' ? 0 : 1220,
        targetUph: 1200,
        status: bake2?.status || 'RUNNING',
        model: bake2?.runningModel || '504-2268',
        nav: () => navigate('bake-process')
      },
      {
        id: 'BAKE-03',
        name: 'Bake Chamber #3',
        stageNum: 2,
        stageKey: 'BAKE',
        stageName: SIDE_COLORS.bake.label,
        barColor: SIDE_COLORS.bake.hex,
        barHover: SIDE_COLORS.bake.hover,
        border: SIDE_COLORS.bake.border,
        uph: bake3?.status === 'STOP' ? 0 : 1160,
        targetUph: 1200,
        status: bake3?.status || 'RUNNING',
        model: bake3?.runningModel || '504-2154',
        nav: () => navigate('bake-process')
      },
      {
        id: 'BAKE-04',
        name: 'Bake Chamber #4',
        stageNum: 2,
        stageKey: 'BAKE',
        stageName: SIDE_COLORS.bake.label,
        barColor: SIDE_COLORS.bake.hex,
        barHover: SIDE_COLORS.bake.hover,
        border: SIDE_COLORS.bake.border,
        uph: bake4?.status === 'STOP' ? 0 : 1240,
        targetUph: 1200,
        status: bake4?.status || 'RUNNING',
        model: bake4?.runningModel || '504-2224',
        nav: () => navigate('bake-process')
      },
      {
        id: 'BAKE-05',
        name: 'Bake Chamber #5',
        stageNum: 2,
        stageKey: 'BAKE',
        stageName: SIDE_COLORS.bake.label,
        barColor: SIDE_COLORS.bake.hex,
        barHover: SIDE_COLORS.bake.hover,
        border: SIDE_COLORS.bake.border,
        uph: bake5?.status === 'STOP' ? 0 : 1190,
        targetUph: 1200,
        status: bake5?.status || 'RUNNING',
        model: bake5?.runningModel || '504-2454',
        nav: () => navigate('bake-process')
      },
      // Stage 3: Dispensing Fleet (12 Units) - Sky/Cyan (#0284c7)
      ...Array.from({ length: 12 }, (_, i) => {
        const mcId = `MC-${String(i + 1).padStart(2, '0')}`;
        const mc = machines.find(m => m.id === mcId);
        const isUnder = i >= 6;
        return {
          id: mcId,
          name: `${mcId} (${isUnder ? 'Under Fill' : 'Top Fill'})`,
          stageNum: 3,
          stageKey: 'DISPENSE',
          stageName: SIDE_COLORS.dispensing.label,
          barColor: SIDE_COLORS.dispensing.hex,
          barHover: SIDE_COLORS.dispensing.hover,
          border: SIDE_COLORS.dispensing.border,
          uph: mc?.status === 'STOP' ? 0 : (mc?.uph || (940 + (i * 7) % 40)),
          targetUph: 960,
          status: mc?.status || 'RUNNING',
          model: mc?.runningModel || (i % 2 === 0 ? '504-2224' : '504-2268'),
          nav: () => navigate('machine-detail', mcId)
        };
      }),
      // Stage 4: FVMI Stations (9 Stations) - Orange (#ea580c)
      ...Array.from({ length: 9 }, (_, i) => {
        const stId = `ST-0${i + 1}`;
        const baseUph = [1120, 1090, 1140, 1080, 1110, 1130, 1100, 1150, 1070][i];
        return {
          id: stId,
          name: `Station ${stId}`,
          stageNum: 4,
          stageKey: 'FVMI',
          stageName: SIDE_COLORS.fvmi.label,
          barColor: SIDE_COLORS.fvmi.hex,
          barHover: SIDE_COLORS.fvmi.hover,
          border: SIDE_COLORS.fvmi.border,
          uph: baseUph,
          targetUph: 1100,
          status: 'RUNNING' as const,
          model: ['504-2187', '504-2268', '504-2154', '504-2224', '504-2454'][i % 5],
          nav: () => navigate('fvmi')
        };
      }),
      // Stage 5: AOI Optical (2 Lines) - Purple (#9333ea)
      {
        id: 'AOI-01',
        name: 'AOI Line 01 (Top/Btm)',
        stageNum: 5,
        stageKey: 'AOI',
        stageName: SIDE_COLORS.aoi.label,
        barColor: SIDE_COLORS.aoi.hex,
        barHover: SIDE_COLORS.aoi.hover,
        border: SIDE_COLORS.aoi.border,
        uph: 1120,
        targetUph: 1100,
        status: 'RUNNING' as const,
        model: '504-2187',
        nav: () => navigate('packout-aoi', 'AOI-01')
      },
      {
        id: 'AOI-02',
        name: 'AOI Line 02 (Top/Btm)',
        stageNum: 5,
        stageKey: 'AOI',
        stageName: SIDE_COLORS.aoi.label,
        barColor: SIDE_COLORS.aoi.hex,
        barHover: SIDE_COLORS.aoi.hover,
        border: SIDE_COLORS.aoi.border,
        uph: 1140,
        targetUph: 1100,
        status: 'RUNNING' as const,
        model: '504-2268',
        nav: () => navigate('packout-aoi', 'AOI-02')
      },
      // Stage 6: X-Ray NDT Radiography (5 Units) - Pink (#ec4899)
      ...Array.from({ length: 5 }, (_, i) => {
        const xrId = `X-RAY 0${i + 1}`;
        const baseUph = [1100, 1120, 1090, 1130, 1110][i];
        return {
          id: xrId,
          name: `${xrId} (BGA Void)`,
          stageNum: 6,
          stageKey: 'XRAY',
          stageName: SIDE_COLORS.xray.label,
          barColor: SIDE_COLORS.xray.hex,
          barHover: SIDE_COLORS.xray.hover,
          border: SIDE_COLORS.xray.border,
          uph: baseUph,
          targetUph: 1100,
          status: 'RUNNING' as const,
          model: ['504-2268', '504-2154', '504-2224', '504-2454', '504-2187'][i],
          nav: () => navigate('packout-xray', xrId)
        };
      })
    ];

    return list;
  }, [machines, ovenUnits, navigate, SIDE_COLORS]);

  // Totals & KPI Computations
  const totalVacuumUph = ovenData.vacuum.reduce((a, b) => a + b, 0) * 200;
  const totalBakeUph = ovenData.bake.reduce((a, b) => a + b, 0) * 200;
  const totalDispenseUph = dispensingData.topFill.reduce((a, b) => a + b, 0) + dispensingData.underFill.reduce((a, b) => a + b, 0);
  const totalFvmiUph = fvmiData.total.reduce((a, b) => a + b, 0);
  const totalAoiUph = hours.reduce((acc, _, i) => acc + (aoiData.unit1[i] ?? 1100) + (aoiData.unit2[i] ?? 1100), 0);
  const totalXrayUph = xrayData.uph.reduce((a, b) => a + b, 0);
  const totalCombinedFleetUph = fleetMachines.reduce((sum, m) => sum + m.uph, 0);
  const activeMachinesCount = fleetMachines.filter(m => m.status === 'RUNNING').length;
  const avgLineThroughput = Math.round((totalVacuumUph + totalBakeUph + totalDispenseUph + totalFvmiUph + totalAoiUph + totalXrayUph) / (hours.length * 6));

  // Consolidated 6 Machine Groups for Combined Fleet Overview (Aligned with Side Map Legend)
  const combinedMachineGroups = useMemo(() => {
    const vTotal = 2380;
    const bTotal = 6010;
    const dsTotal = 11480;
    const fvTotal = 9990;
    const aoTotal = 2260;
    const xrTotal = 5550;

    return [
      {
        id: 'vacuum',
        key: 'VACUUM',
        stageNum: 1,
        name: SIDE_COLORS.vacuum.label,
        subLabel: '2 Chambers',
        count: 2,
        color: SIDE_COLORS.vacuum.hex,
        hoverColor: SIDE_COLORS.vacuum.hover,
        badgeClass: SIDE_COLORS.vacuum.badge,
        bgClass: SIDE_COLORS.vacuum.bg,
        borderClass: SIDE_COLORS.vacuum.border,
        totalUph: vTotal,
        avgUph: Math.round(vTotal / 2),
        targetUph: 2400,
        targetAvg: 1200,
        activeCount: 2,
        models: '504-2187',
        nav: () => navigate('vacuum-process')
      },
      {
        id: 'bake',
        key: 'BAKE',
        stageNum: 2,
        name: SIDE_COLORS.bake.label,
        subLabel: '5 Chambers',
        count: 5,
        color: SIDE_COLORS.bake.hex,
        hoverColor: SIDE_COLORS.bake.hover,
        badgeClass: SIDE_COLORS.bake.badge,
        bgClass: SIDE_COLORS.bake.bg,
        borderClass: SIDE_COLORS.bake.border,
        totalUph: bTotal,
        avgUph: Math.round(bTotal / 5),
        targetUph: 6000,
        targetAvg: 1200,
        activeCount: 5,
        models: '504-2187, 504-2268, 504-2154, 504-2224, 504-2454',
        nav: () => navigate('bake-process')
      },
      {
        id: 'dispensing',
        key: 'DISPENSE',
        stageNum: 3,
        name: SIDE_COLORS.dispensing.label,
        subLabel: '12 Jet Units (Top/Under)',
        count: 12,
        color: SIDE_COLORS.dispensing.hex,
        hoverColor: SIDE_COLORS.dispensing.hover,
        badgeClass: SIDE_COLORS.dispensing.badge,
        bgClass: SIDE_COLORS.dispensing.bg,
        borderClass: SIDE_COLORS.dispensing.border,
        totalUph: dsTotal,
        avgUph: Math.round(dsTotal / 12),
        targetUph: 11520,
        targetAvg: 960,
        activeCount: 12,
        models: '504-2224, 504-2268',
        nav: () => navigate('machine-detail', 'MC-01')
      },
      {
        id: 'fvmi',
        key: 'FVMI',
        stageNum: 4,
        name: SIDE_COLORS.fvmi.label,
        subLabel: '9 Optical Stations',
        count: 9,
        color: SIDE_COLORS.fvmi.hex,
        hoverColor: SIDE_COLORS.fvmi.hover,
        badgeClass: SIDE_COLORS.fvmi.badge,
        bgClass: SIDE_COLORS.fvmi.bg,
        borderClass: SIDE_COLORS.fvmi.border,
        totalUph: fvTotal,
        avgUph: Math.round(fvTotal / 9),
        targetUph: 9900,
        targetAvg: 1100,
        activeCount: 9,
        models: '5 Models (Mixed)',
        nav: () => navigate('fvmi')
      },
      {
        id: 'aoi',
        key: 'AOI',
        stageNum: 5,
        name: SIDE_COLORS.aoi.label,
        subLabel: '2 High-Speed Lines',
        count: 2,
        color: SIDE_COLORS.aoi.hex,
        hoverColor: SIDE_COLORS.aoi.hover,
        badgeClass: SIDE_COLORS.aoi.badge,
        bgClass: SIDE_COLORS.aoi.bg,
        borderClass: SIDE_COLORS.aoi.border,
        totalUph: aoTotal,
        avgUph: Math.round(aoTotal / 2),
        targetUph: 2200,
        targetAvg: 1100,
        activeCount: 2,
        models: '504-2187, 504-2268',
        nav: () => navigate('packout-aoi', 'ALL')
      },
      {
        id: 'xray',
        key: 'XRAY',
        stageNum: 6,
        name: SIDE_COLORS.xray.label,
        subLabel: '5 NDT Machines',
        count: 5,
        color: SIDE_COLORS.xray.hex,
        hoverColor: SIDE_COLORS.xray.hover,
        badgeClass: SIDE_COLORS.xray.badge,
        bgClass: SIDE_COLORS.xray.bg,
        borderClass: SIDE_COLORS.xray.border,
        totalUph: xrTotal,
        avgUph: Math.round(xrTotal / 5),
        targetUph: 5500,
        targetAvg: 1100,
        activeCount: 5,
        models: '504-2268, 504-2154, 504-2224, 504-2454, 504-2187',
        nav: () => navigate('packout-xray', 'ALL')
      }
    ];
  }, [SIDE_COLORS, navigate]);

  // Filtered machines in 'all-machines' view mode
  const displayedMachines = useMemo(() => {
    if (stageFilter === 'ALL') return fleetMachines;
    return fleetMachines.filter(m => m.stageKey === stageFilter);
  }, [fleetMachines, stageFilter]);

  const maxComparisonVal = 2600;
  const maxMachineUph = 1400;
  const maxCombinedTotal = 13000;
  const maxCombinedAvg = 1400;

  return (
    <div className="bg-white rounded-2xl border border-sky-200/90 p-5 sm:p-6 shadow-xs hover:border-sky-300 transition-all duration-150">
      {/* Chart Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#b3e5fc] text-sky-950 border border-sky-300 flex items-center justify-center shadow-2xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>Fleet Overview Chart</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#b3e5fc] text-sky-950 border border-sky-300 shadow-2xs">
              6 MACHINE GROUPS
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-medium text-slate-500">
            <span>SMT FLEET THROUGHPUT — ALIGNED WITH MAP LEGEND COLORS ON THE SIDE</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SIDE_COLORS.vacuum.hex }} />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SIDE_COLORS.bake.hex }} />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SIDE_COLORS.dispensing.hex }} />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SIDE_COLORS.fvmi.hex }} />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SIDE_COLORS.aoi.hex }} />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SIDE_COLORS.xray.hex }} />
              <span>Map Legend Sync</span>
            </span>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('combined-stages')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'combined-stages'
                  ? 'bg-white text-sky-950 shadow-xs font-bold border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
              <span>6 Machine Groups</span>
            </button>
            <button
              onClick={() => setViewMode('all-machines')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'all-machines'
                  ? 'bg-white text-sky-950 shadow-xs font-bold border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-sky-600" />
              <span>By Machine (35 MC)</span>
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'comparison'
                  ? 'bg-white text-sky-950 shadow-xs font-bold border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Hourly</span>
            </button>
            <button
              onClick={() => setViewMode('aggregate')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'aggregate'
                  ? 'bg-white text-sky-950 shadow-xs font-bold border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
              <span>Line Stacked</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards for the 6 Process Stages (Colored strictly according to SIDE_COLORS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5 text-xs">
        {combinedMachineGroups.map(stage => (
          <div
            key={stage.id}
            onClick={stage.nav}
            className={`p-3 rounded-xl ${stage.bgClass} border ${stage.borderClass} hover:shadow-xs transition-all cursor-pointer group`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-bold truncate" style={{ color: stage.color }}>
                <span className="w-2.5 h-2.5 rounded-xs shrink-0 shadow-2xs" style={{ backgroundColor: stage.color }}></span>
                <span className="truncate">{stage.name}</span>
              </div>
              <ChevronRight className="w-3 h-3 shrink-0 group-hover:translate-x-0.5 transition-transform" style={{ color: stage.color }} />
            </div>
            <div className="text-base font-bold font-mono text-slate-900 mt-1.5">
              {stage.totalUph.toLocaleString()} <span className="text-[10px] font-sans font-bold text-slate-500">UPH</span>
            </div>
            <div className="text-[10px] font-mono mt-0.5 flex items-center justify-between text-slate-600">
              <span>{stage.count} Units</span>
              <span className="font-semibold text-slate-700">~{stage.avgUph} / MC</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-controls when in 'combined-stages' mode */}
      {viewMode === 'combined-stages' && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Bar Display Metric:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setCombinedMetric('total')}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                  combinedMetric === 'total'
                    ? 'bg-white text-sky-950 shadow-xs font-bold border border-sky-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Total Group Output (Total UPH)
              </button>
              <button
                onClick={() => setCombinedMetric('average')}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                  combinedMetric === 'average'
                    ? 'bg-white text-sky-950 shadow-xs font-bold border border-sky-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Average per Machine (Avg UPH / Machine)
              </button>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Comparing 6 machine categories aligned with map legend</span>
          </div>
        </div>
      )}

      {/* Stage Filter Chips (Only shown in 'all-machines' view) */}
      {viewMode === 'all-machines' && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-slate-100 text-xs">
          <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
            <span>Filter Stage:</span>
          </span>
          {[
            { key: 'ALL', label: 'All 35 Machines', count: 35, color: 'bg-slate-100 text-slate-800 hover:bg-slate-200' },
            { key: 'VACUUM', label: SIDE_COLORS.vacuum.label, count: 2, color: SIDE_COLORS.vacuum.badge },
            { key: 'BAKE', label: SIDE_COLORS.bake.label, count: 5, color: SIDE_COLORS.bake.badge },
            { key: 'DISPENSE', label: SIDE_COLORS.dispensing.label, count: 12, color: SIDE_COLORS.dispensing.badge },
            { key: 'FVMI', label: SIDE_COLORS.fvmi.label, count: 9, color: SIDE_COLORS.fvmi.badge },
            { key: 'AOI', label: SIDE_COLORS.aoi.label, count: 2, color: SIDE_COLORS.aoi.badge },
            { key: 'XRAY', label: SIDE_COLORS.xray.label, count: 5, color: SIDE_COLORS.xray.badge }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStageFilter(f.key)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                stageFilter === f.key
                  ? 'bg-sky-900 text-white shadow-xs scale-102'
                  : `${f.color} border border-transparent`
              }`}
            >
              <span>{f.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                stageFilter === f.key ? 'bg-sky-800 text-sky-100' : 'bg-white/60 text-slate-700'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
          <div className="ml-auto text-[11px] font-mono text-slate-500 hidden sm:block">
            Showing {displayedMachines.length} of 35 Units
          </div>
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="relative pt-6 pb-2 border-l border-b border-slate-300 pl-2">
        {/* Target Lines */}
        <div className="absolute inset-x-2 top-2 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>
              {viewMode === 'combined-stages'
                ? combinedMetric === 'total' ? '12,000 UPH (Target Capacity)' : '1,200 UPH (Target Standard)'
                : viewMode === 'aggregate' ? '8,000 Target UPH (Line Capacity)' : '1,200 Standard Target UPH'}
            </span>
            <span>Target Line (UPH)</span>
          </div>
          <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>
              {viewMode === 'combined-stages'
                ? combinedMetric === 'total' ? '6,000 UPH (Baseline Output)' : '900 UPH (Baseline Output)'
                : viewMode === 'aggregate' ? '5,500 Baseline UPH' : '900 Baseline (Safe Limit)'}
            </span>
            <span>Baseline (UPH)</span>
          </div>
          <div className="w-full border-b border-solid border-slate-400"></div>
        </div>

        {/* PRIMARY VIEW: COMBINED MACHINE STAGES BAR CHART */}
        {viewMode === 'combined-stages' && (
          <div className="flex items-end justify-between space-x-3 sm:space-x-6 h-56 px-3 sm:px-6 relative z-10">
            {combinedMachineGroups.map((stage) => {
              const val = combinedMetric === 'total' ? stage.totalUph : stage.avgUph;
              const maxVal = combinedMetric === 'total' ? maxCombinedTotal : maxCombinedAvg;
              const heightPct = Math.min(100, Math.max(12, (val / maxVal) * 100));
              const isHovered = hoveredStage?.id === stage.id;

              return (
                <div
                  key={stage.id}
                  onClick={stage.nav}
                  onMouseEnter={() => setHoveredStage(stage)}
                  onMouseLeave={() => setHoveredStage(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                >
                  {/* Hover Floating Card */}
                  {isHovered && (
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-mono px-3.5 py-2 rounded-xl shadow-xl z-30 whitespace-nowrap border border-slate-700 pointer-events-none">
                      <div className="font-bold flex items-center gap-2">
                        <span className="w-3 h-3 rounded-xs shadow-xs" style={{ backgroundColor: stage.color }}></span>
                        <span className="text-white text-xs">{stage.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({stage.count} Machines)</span>
                      </div>
                      <div className="text-[11px] text-slate-200 mt-1.5 flex items-center gap-2">
                        <span>Total: <strong className="text-white font-mono">{stage.totalUph.toLocaleString()} UPH</strong></span>
                        <span>•</span>
                        <span>Avg: <strong className="text-sky-300 font-mono">{stage.avgUph.toLocaleString()} UPH/MC</strong></span>
                      </div>
                      <div className="text-[10px] text-amber-300 mt-0.5 truncate max-w-[260px]">
                        Running Models: {stage.models}
                      </div>
                      <div className="text-[9px] text-emerald-400 mt-1 flex items-center justify-between gap-3 border-t border-slate-800 pt-1">
                        <span>Status: {stage.activeCount}/{stage.count} Online</span>
                        <span className="text-sky-300 underline">Click to view details →</span>
                      </div>
                    </div>
                  )}

                  {/* Top Value Badge */}
                  <div className="flex flex-col items-center mb-1.5 transition-transform group-hover:-translate-y-1">
                    <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-800 flex items-baseline gap-0.5">
                      {val.toLocaleString()}
                      <span className="text-[9px] font-normal text-slate-500">UPH</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
                      {combinedMetric === 'total' ? `(${stage.count} MCs)` : 'Avg/MC'}
                    </span>
                  </div>

                  {/* Stage Bar Styled by exact side legend color */}
                  <div
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: stage.color
                    }}
                    className="w-full max-w-[68px] sm:max-w-[80px] rounded-t-lg transition-all duration-300 group-hover:opacity-90 group-hover:scale-y-102 group-hover:shadow-lg shadow-xs relative flex flex-col justify-between p-1"
                  >
                    {/* Inner Accent Line */}
                    <div className="w-full h-1 bg-white/40 rounded-full"></div>
                    <div className="text-center pb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-mono font-bold text-white uppercase drop-shadow-xs">
                        Stage 0{stage.stageNum}
                      </span>
                    </div>
                  </div>

                  {/* Stage Footer Label with Side-Color Swatch */}
                  <div className="flex flex-col items-center mt-2.5 text-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0 shadow-2xs" style={{ backgroundColor: stage.color }}></span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-sky-950 transition-colors truncate max-w-[90px] sm:max-w-none">
                        {stage.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                      {stage.subLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode: ALL 35 MACHINES BAR CHART (Colored by Side Colors) */}
        {viewMode === 'all-machines' && (
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-sky-200">
            <div className="flex items-end justify-between space-x-1.5 sm:space-x-2 min-w-[760px] h-52 px-2 relative z-10">
              {displayedMachines.map((m) => {
                const heightPct = Math.min(100, Math.max(8, (m.uph / maxMachineUph) * 100));
                const isHovered = hoveredMachine?.id === m.id;
                const isStopped = m.status === 'STOP' || m.uph === 0;

                return (
                  <div
                    key={m.id}
                    onClick={m.nav}
                    onMouseEnter={() => setHoveredMachine(m)}
                    onMouseLeave={() => setHoveredMachine(null)}
                    className="flex-1 min-w-[20px] max-w-[42px] flex flex-col items-center justify-end h-full relative group cursor-pointer"
                  >
                    {/* Hover Card */}
                    {isHovered && (
                      <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-mono px-3 py-1.5 rounded-xl shadow-xl z-30 whitespace-nowrap border border-slate-700 pointer-events-none">
                        <div className="font-bold flex items-center gap-1.5 text-sky-300">
                          <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: m.barColor }}></span>
                          <span>{m.name}</span>
                          <span className="text-[9px] text-slate-400">({m.stageName})</span>
                        </div>
                        <div className="text-[10px] text-slate-200 mt-1 flex items-center gap-2">
                          <span>Output: <strong className="text-white">{m.uph.toLocaleString()} UPH</strong></span>
                          <span>•</span>
                          <span>Model: <strong className="text-amber-300">{m.model}</strong></span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5 flex items-center justify-between gap-2">
                          <span className={isStopped ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                            Status: {m.status}
                          </span>
                          <span className="text-sky-300 underline">Click to inspect →</span>
                        </div>
                      </div>
                    )}

                    {/* Value Badge above bar */}
                    <span className="text-[9px] font-mono font-bold text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {m.uph}
                    </span>

                    {/* Machine Bar */}
                    <div
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: isStopped ? '#ef4444' : m.barColor
                      }}
                      className="w-full rounded-t-md transition-all duration-200 group-hover:scale-y-105 group-hover:shadow-md shadow-2xs relative"
                    >
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/80"></div>
                    </div>

                    {/* Machine ID Label at Bottom */}
                    <span className="text-[9px] font-mono font-medium text-slate-700 mt-2 truncate max-w-full group-hover:font-bold group-hover:text-sky-950 transition-colors">
                      {m.id}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View Mode: HOURLY 6-STAGE COMPARISON BARS (Colored by Side Colors) */}
        {viewMode === 'comparison' && (
          <div className="flex items-end justify-between space-x-2 sm:space-x-4 h-60 px-1 sm:px-2 relative z-10 overflow-x-auto">
            {SHIFT_HOURLY_RECORDS.map((rec) => {
              const maxComparisonGroupUph = 12500;
              const vH = (rec.vacuum / maxComparisonGroupUph) * 100;
              const bH = (rec.bake / maxComparisonGroupUph) * 100;
              const dsH = (rec.dispensing / maxComparisonGroupUph) * 100;
              const fvH = (rec.fvmi / maxComparisonGroupUph) * 100;
              const aoH = (rec.aoi / maxComparisonGroupUph) * 100;
              const xrH = (rec.xray / maxComparisonGroupUph) * 100;
              return (
                <div
                  key={rec.hour}
                  className="flex-1 min-w-[72px] flex flex-col items-center p-1 rounded-xl transition-all hover:bg-slate-50/60"
                >
                  {/* Total Hourly UPH on top */}
                  <div className="text-[10px] font-mono font-bold text-slate-700 mb-1 flex items-baseline gap-0.5">
                    {rec.total.toLocaleString()}
                    <span className="text-[8px] font-normal text-slate-400">UPH</span>
                  </div>

                  {/* 6 Stage Bars */}
                  <div className="w-full flex items-end justify-center space-x-1 h-40">
                    {/* Vacuum Bar */}
                    <div
                      onMouseEnter={() => setHoveredHourly({ hr: rec.hour, range: rec.range, stage: SIDE_COLORS.vacuum.label, val: rec.vacuum })}
                      onMouseLeave={() => setHoveredHourly(null)}
                      onClick={() => navigate('vacuum-process')}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    >
                      {hoveredHourly?.hr === rec.hour && hoveredHourly?.stage === SIDE_COLORS.vacuum.label && (
                        <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded-lg shadow-md z-30 whitespace-nowrap">
                          {SIDE_COLORS.vacuum.label} ({rec.hour}): {rec.vacuum.toLocaleString()} UPH
                        </div>
                      )}
                      <div
                        style={{ height: `${Math.max(6, vH)}%`, backgroundColor: SIDE_COLORS.vacuum.hex }}
                        className="w-full rounded-t-xs transition-all duration-200 hover:opacity-90 shadow-2xs"
                      ></div>
                    </div>

                    {/* Bake Bar */}
                    <div
                      onMouseEnter={() => setHoveredHourly({ hr: rec.hour, range: rec.range, stage: SIDE_COLORS.bake.label, val: rec.bake })}
                      onMouseLeave={() => setHoveredHourly(null)}
                      onClick={() => navigate('bake-process')}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    >
                      {hoveredHourly?.hr === rec.hour && hoveredHourly?.stage === SIDE_COLORS.bake.label && (
                        <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded-lg shadow-md z-30 whitespace-nowrap">
                          {SIDE_COLORS.bake.label} ({rec.hour}): {rec.bake.toLocaleString()} UPH
                        </div>
                      )}
                      <div
                        style={{ height: `${Math.max(6, bH)}%`, backgroundColor: SIDE_COLORS.bake.hex }}
                        className="w-full rounded-t-xs transition-all duration-200 hover:opacity-90 shadow-2xs"
                      ></div>
                    </div>

                    {/* Dispense Bar */}
                    <div
                      onMouseEnter={() => setHoveredHourly({ hr: rec.hour, range: rec.range, stage: SIDE_COLORS.dispensing.label, val: rec.dispensing })}
                      onMouseLeave={() => setHoveredHourly(null)}
                      onClick={() => navigate('machine-detail', 'MC-01')}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    >
                      {hoveredHourly?.hr === rec.hour && hoveredHourly?.stage === SIDE_COLORS.dispensing.label && (
                        <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded-lg shadow-md z-30 whitespace-nowrap">
                          {SIDE_COLORS.dispensing.label} ({rec.hour}): {rec.dispensing.toLocaleString()} UPH
                        </div>
                      )}
                      <div
                        style={{ height: `${Math.max(6, dsH)}%`, backgroundColor: SIDE_COLORS.dispensing.hex }}
                        className="w-full rounded-t-xs transition-all duration-200 hover:opacity-90 shadow-2xs"
                      ></div>
                    </div>

                    {/* FVMI Bar */}
                    <div
                      onMouseEnter={() => setHoveredHourly({ hr: rec.hour, range: rec.range, stage: SIDE_COLORS.fvmi.label, val: rec.fvmi })}
                      onMouseLeave={() => setHoveredHourly(null)}
                      onClick={() => navigate('fvmi')}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    >
                      {hoveredHourly?.hr === rec.hour && hoveredHourly?.stage === SIDE_COLORS.fvmi.label && (
                        <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded-lg shadow-md z-30 whitespace-nowrap">
                          {SIDE_COLORS.fvmi.label} ({rec.hour}): {rec.fvmi.toLocaleString()} UPH
                        </div>
                      )}
                      <div
                        style={{ height: `${Math.max(6, fvH)}%`, backgroundColor: SIDE_COLORS.fvmi.hex }}
                        className="w-full rounded-t-xs transition-all duration-200 hover:opacity-90 shadow-2xs"
                      ></div>
                    </div>

                    {/* AOI Bar */}
                    <div
                      onMouseEnter={() => setHoveredHourly({ hr: rec.hour, range: rec.range, stage: SIDE_COLORS.aoi.label, val: rec.aoi })}
                      onMouseLeave={() => setHoveredHourly(null)}
                      onClick={() => navigate('packout-aoi')}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    >
                      {hoveredHourly?.hr === rec.hour && hoveredHourly?.stage === SIDE_COLORS.aoi.label && (
                        <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded-lg shadow-md z-30 whitespace-nowrap">
                          {SIDE_COLORS.aoi.label} ({rec.hour}): {rec.aoi.toLocaleString()} UPH
                        </div>
                      )}
                      <div
                        style={{ height: `${Math.max(6, aoH)}%`, backgroundColor: SIDE_COLORS.aoi.hex }}
                        className="w-full rounded-t-xs transition-all duration-200 hover:opacity-90 shadow-2xs"
                      ></div>
                    </div>

                    {/* X-Ray Bar */}
                    <div
                      onMouseEnter={() => setHoveredHourly({ hr: rec.hour, range: rec.range, stage: SIDE_COLORS.xray.label, val: rec.xray })}
                      onMouseLeave={() => setHoveredHourly(null)}
                      onClick={() => navigate('packout-xray')}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    >
                      {hoveredHourly?.hr === rec.hour && hoveredHourly?.stage === SIDE_COLORS.xray.label && (
                        <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded-lg shadow-md z-30 whitespace-nowrap">
                          {SIDE_COLORS.xray.label} ({rec.hour}): {rec.xray.toLocaleString()} UPH
                        </div>
                      )}
                      <div
                        style={{ height: `${Math.max(6, xrH)}%`, backgroundColor: SIDE_COLORS.xray.hex }}
                        className="w-full rounded-t-xs transition-all duration-200 hover:opacity-90 shadow-2xs"
                      ></div>
                    </div>
                  </div>

                  {/* Hourly Time Label at Bottom */}
                  <div className="flex flex-col items-center mt-2">
                    <span className="text-[11px] font-mono font-semibold text-slate-600">
                      {rec.hour}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode: HOURLY STACKED TOTAL LINE OUTPUT (Colored by Side Colors) */}
        {viewMode === 'aggregate' && (
          <div className="flex items-end justify-between space-x-2 sm:space-x-4 h-60 px-1 sm:px-2 relative z-10 overflow-x-auto">
            {SHIFT_HOURLY_RECORDS.map((rec) => {
              const maxAggregate = 40000;
              const height = (rec.total / maxAggregate) * 100;
              const isHov = hoveredHourly?.hr === rec.hour;

              return (
                <div
                  key={rec.hour}
                  className="flex-1 min-w-[72px] flex flex-col items-center p-1 rounded-xl transition-all hover:bg-slate-50/60"
                >
                  <div
                    onMouseEnter={() => setHoveredHourly({ hr: rec.hour, range: rec.range, val: rec.total })}
                    onMouseLeave={() => setHoveredHourly(null)}
                    className="w-full flex flex-col items-center justify-end h-44 relative group cursor-pointer"
                  >
                    {isHov && (
                      <div className="absolute -top-16 bg-slate-900 text-white text-[10px] font-mono px-2.5 py-1.5 rounded-lg shadow-md z-30 whitespace-nowrap text-left border border-slate-700">
                        <div className="font-bold text-sky-300">Time Range {rec.range}: {rec.total.toLocaleString()} UPH</div>
                        <div className="text-[9px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                          <span style={{ color: SIDE_COLORS.vacuum.hex }}>Vac: {rec.vacuum}</span>•
                          <span style={{ color: SIDE_COLORS.bake.hex }}>Bake: {rec.bake}</span>•
                          <span style={{ color: SIDE_COLORS.dispensing.hex }}>Disp: {rec.dispensing}</span>•
                          <span style={{ color: SIDE_COLORS.fvmi.hex }}>FVMI: {rec.fvmi}</span>•
                          <span style={{ color: SIDE_COLORS.aoi.hex }}>AOI: {rec.aoi}</span>•
                          <span style={{ color: SIDE_COLORS.xray.hex }}>XR: {rec.xray}</span>
                        </div>
                      </div>
                    )}
                    <span className="text-[10px] font-mono font-bold text-slate-700 mb-1 flex items-baseline gap-0.5">
                      {rec.total.toLocaleString()} <span className="text-[8px] font-normal text-slate-400">UPH</span>
                    </span>
                    <div
                      style={{ height: `${Math.max(8, height)}%` }}
                      className="w-full max-w-[48px] rounded-t-sm transition-all duration-300 group-hover:opacity-95 flex flex-col-reverse overflow-hidden border border-slate-300/60 shadow-xs"
                    >
                      <div style={{ height: `${(rec.vacuum / rec.total) * 100}%`, backgroundColor: SIDE_COLORS.vacuum.hex }} title={`Vacuum: ${rec.vacuum}`} />
                      <div style={{ height: `${(rec.bake / rec.total) * 100}%`, backgroundColor: SIDE_COLORS.bake.hex }} title={`Bake: ${rec.bake}`} />
                      <div style={{ height: `${(rec.dispensing / rec.total) * 100}%`, backgroundColor: SIDE_COLORS.dispensing.hex }} title={`Dispensing: ${rec.dispensing}`} />
                      <div style={{ height: `${(rec.fvmi / rec.total) * 100}%`, backgroundColor: SIDE_COLORS.fvmi.hex }} title={`FVMI: ${rec.fvmi}`} />
                      <div style={{ height: `${(rec.aoi / rec.total) * 100}%`, backgroundColor: SIDE_COLORS.aoi.hex }} title={`AOI: ${rec.aoi}`} />
                      <div style={{ height: `${(rec.xray / rec.total) * 100}%`, backgroundColor: SIDE_COLORS.xray.hex }} title={`X-ray: ${rec.xray}`} />
                    </div>
                  </div>

                  {/* Hourly Time Label at Bottom */}
                  <div className="flex flex-col items-center mt-2">
                    <span className="text-[11px] font-mono font-semibold text-slate-600">
                      {rec.hour}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Legend - Clickable to navigate to each stage, strictly using SIDE_COLORS */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          {combinedMachineGroups.map(stage => (
            <div
              key={stage.id}
              className="flex items-center space-x-1.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={stage.nav}
              title={`Navigate to ${stage.name}`}
            >
              <span className="w-3 h-3 rounded-xs shadow-2xs" style={{ backgroundColor: stage.color }}></span>
              <span className="font-semibold text-slate-700">{stage.name}</span>
              <span className="text-[10px] font-mono text-slate-500">({stage.count})</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {activeMachinesCount}/35 Machines Online
          </span>
          <span className="hidden md:inline">• Fleet Total: {totalCombinedFleetUph.toLocaleString()} UPH</span>
        </div>
      </div>
    </div>
  );
};

/**
 * TotalOvenChart
 * Shows Total Combined Oven Throughput (Vacuum + Bake Consolidated (7 Units Total))
 * Single bar per hour, muted/dropped color tones.
 */
export const TotalOvenChart: React.FC = () => {
  const { chartsData, navigate, updateProcessChartPoint } = useFactory();
  const { hours, vacuum, bake } = chartsData.oven;
  const maxVal = 20;
  const threshold = 12; // Combined target: 6 Vacuum + 6 Bake

  const [isEditing, setIsEditing] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalOvenOutput = vacuum.reduce((a, b) => a + b, 0) + bake.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all duration-150 relative flex flex-col justify-between">
      {/* Header & Legends */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div
            onClick={() => navigate('oven-selection')}
            className="cursor-pointer group flex-1"
          >
            <div className="flex items-center space-x-1.5">
              <BarChart3 className="w-5 h-5 text-slate-700 group-hover:text-sky-600 transition-colors" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                Total Oven Process
              </h3>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b3e5fc] text-sky-950 border border-sky-300 shadow-2xs">
                PROCESS
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
              TOTAL VACUUM + BAKE (7 UNITS • TARGET: 12 MAG/HR)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <span className="w-2.5 h-2.5 bg-[#4db6ac] rounded-xs"></span>
              <span className="text-emerald-900 font-semibold text-[11px]">Pass Target (≥ 12)</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <span className="w-2.5 h-2.5 bg-[#fff176] border border-amber-300 rounded-xs"></span>
              <span className="text-amber-900 font-semibold text-[11px]">Below Target (&lt; 12)</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(!isEditing);
              }}
              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
              title="Edit hourly chart numbers"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Total Summary Strip */}
        <div className="flex items-center justify-between px-3 py-1.5 mb-3 bg-slate-50/80 rounded-lg border border-slate-200/70 text-xs font-mono">
          <span className="text-slate-500">Cumulative Total Output:</span>
          <span className="font-bold text-slate-800">{totalOvenOutput} Mag <span className="font-normal text-slate-500 font-sans text-[11px]">(7 Ovens)</span></span>
        </div>

        {/* Chart Canvas */}
        <div className="relative pt-6 pb-2 border-l border-b border-slate-300 pl-2">
          {/* Background Grid Guidelines */}
          <div className="absolute inset-x-2 top-2 bottom-8 flex flex-col justify-between pointer-events-none opacity-30">
            <div className="w-full border-b border-dashed border-slate-400 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>20</span>
              <span>Ceiling</span>
            </div>
            <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>12</span>
              <span>Target (12 Mag)</span>
            </div>
            <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>6</span>
              <span>Half</span>
            </div>
            <div className="w-full border-b border-solid border-slate-400"></div>
          </div>

          <div className="flex items-end justify-between space-x-2 h-44 px-1 relative z-10">
            {hours.map((hr, i) => {
              const vVal = vacuum[i] ?? 6;
              const bVal = bake[i] ?? 6;
              const totalVal = vVal + bVal;
              const height = (totalVal / maxVal) * 100;

              const isHigh = totalVal >= threshold;
              const bgClass = isHigh
                ? 'bg-[#4db6ac] hover:bg-[#3d958d] shadow-xs'
                : 'bg-[#fff176] hover:bg-[#f9e755] border border-amber-300 text-slate-800';

              const isHovered = hoveredIndex === i;

              return (
                <div key={hr} className="flex-1 flex flex-col items-center">
                  <div
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="w-full flex flex-col items-center justify-end h-36 relative group cursor-pointer"
                  >
                    {isHovered && (
                      <div className="absolute -top-10 bg-slate-800 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md z-30 whitespace-nowrap">
                        Total Oven: {totalVal} mag (Vac: {vVal}, Bake: {bVal})
                      </div>
                    )}
                    <span className="text-[10px] font-mono font-semibold text-slate-600 px-0.5 mb-1">
                      {totalVal}
                    </span>
                    <div
                      style={{ height: `${Math.max(8, height)}%` }}
                      className={`w-full max-w-[36px] ${bgClass} rounded-t-sm transition-all duration-200`}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-600 mt-3">
                    {hr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Edit Popup */}
      {isEditing && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-center font-bold text-slate-700">
            <span>Edit Oven Hourly Vacuum &amp; Bake</span>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {hours.map((hr, idx) => (
              <div key={hr} className="bg-white p-1.5 rounded border border-slate-200">
                <span className="font-mono font-bold text-[10px] text-slate-500 block">{hr}</span>
                <div className="flex gap-1 mt-1">
                  <input
                    type="number"
                    value={vacuum[idx]}
                    onChange={(e) => updateProcessChartPoint('oven', 'vacuum', idx, Number(e.target.value))}
                    className="w-1/2 px-1 py-0.5 bg-slate-50 border border-slate-300 rounded font-mono text-[11px]"
                    title="Vacuum"
                  />
                  <input
                    type="number"
                    value={bake[idx]}
                    onChange={(e) => updateProcessChartPoint('oven', 'bake', idx, Number(e.target.value))}
                    className="w-1/2 px-1 py-0.5 bg-slate-50 border border-slate-300 text-slate-700 rounded font-mono text-[11px]"
                    title="Bake"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Export OvenChart as alias for TotalOvenChart to guarantee backwards compatibility
export const OvenChart = TotalOvenChart;

/**
 * VacuumOvenChart
 * Shows Dedicated Vacuum Oven Throughput (Dedicated Vacuum Chambers - 2 Units)
 * Single bar per hour, muted/dropped color tones.
 */
export const VacuumOvenChart: React.FC = () => {
  const { chartsData, navigate, updateProcessChartPoint } = useFactory();
  const { hours, vacuum } = chartsData.oven;
  const maxVal = 12;
  const threshold = 6; // Target: 6 Mag/hr for 2 Vacuum units

  const [isEditing, setIsEditing] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalVacuumOutput = vacuum.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all duration-150 relative flex flex-col justify-between">
      {/* Header & Legends */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div
            onClick={() => navigate('vacuum-process')}
            className="cursor-pointer group flex-1"
          >
            <div className="flex items-center space-x-1.5">
              <Wind className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                Vacuum Oven
              </h3>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b3e5fc] text-sky-950 border border-sky-300 shadow-2xs">
                PROCESS
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
              VACUUM DE-GASSING (2 UNITS • TARGET: 6 MAG/HR)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <span className="w-2.5 h-2.5 bg-[#4db6ac] rounded-xs"></span>
              <span className="text-emerald-900 font-semibold text-[11px]">Pass Target (≥ 6)</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <span className="w-2.5 h-2.5 bg-[#fff176] border border-amber-300 rounded-xs"></span>
              <span className="text-amber-900 font-semibold text-[11px]">Below Target (&lt; 6)</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(!isEditing);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
              title="Edit Vacuum numbers"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Total Summary Strip */}
        <div className="flex items-center justify-between px-3 py-1.5 mb-3 bg-slate-50/80 rounded-lg border border-slate-200/70 text-xs font-mono">
          <span className="text-slate-500">Cumulative Total Output:</span>
          <span className="font-bold text-slate-800">{totalVacuumOutput} Mag <span className="font-normal text-slate-500 font-sans text-[11px]">(2 Units)</span></span>
        </div>

        {/* Chart Canvas */}
        <div className="relative pt-6 pb-2 border-l border-b border-slate-300 pl-2">
          {/* Background Grid Guidelines */}
          <div className="absolute inset-x-2 top-2 bottom-8 flex flex-col justify-between pointer-events-none opacity-30">
            <div className="w-full border-b border-dashed border-slate-400 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>12</span>
              <span>Max Capacity</span>
            </div>
            <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>6</span>
              <span>Target (6 Mag)</span>
            </div>
            <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>3</span>
              <span>Low</span>
            </div>
            <div className="w-full border-b border-solid border-slate-400"></div>
          </div>

          <div className="flex items-end justify-between space-x-2 h-44 px-1 relative z-10">
            {hours.map((hr, i) => {
              const val = vacuum[i] ?? 6;
              const height = (val / maxVal) * 100;

              const isHigh = val >= threshold;
              const bgClass = isHigh
                ? 'bg-[#4db6ac] hover:bg-[#3d958d] shadow-xs'
                : 'bg-[#fff176] hover:bg-[#f9e755] border border-amber-300 text-slate-800';

              const isHovered = hoveredIndex === i;

              return (
                <div key={hr} className="flex-1 flex flex-col items-center">
                  <div
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="w-full flex flex-col items-center justify-end h-36 relative group cursor-pointer"
                  >
                    {isHovered && (
                      <div className="absolute -top-10 bg-slate-800 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md z-30 whitespace-nowrap">
                        Vacuum: {val} mag (2 Units)
                      </div>
                    )}
                    <span className="text-[10px] font-mono font-semibold text-slate-600 px-0.5 mb-1">
                      {val}
                    </span>
                    <div
                      style={{ height: `${Math.max(8, height)}%` }}
                      className={`w-full max-w-[36px] ${bgClass} rounded-t-sm transition-all duration-200`}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-600 mt-3">
                    {hr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Edit Popup */}
      {isEditing && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-center font-bold text-slate-700">
            <span>Edit Vacuum Hourly Output (Mag)</span>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {hours.map((hr, idx) => (
              <div key={hr} className="bg-white p-1.5 rounded border border-slate-200">
                <span className="font-mono font-bold text-[10px] text-slate-500 block">{hr}</span>
                <input
                  type="number"
                  value={vacuum[idx]}
                  onChange={(e) => updateProcessChartPoint('oven', 'vacuum', idx, Number(e.target.value))}
                  className="w-full mt-1 px-1.5 py-0.5 bg-slate-50 border border-slate-300 rounded font-mono text-[11px]"
                  title="Vacuum Mag"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * BakeOvenChart
 * Shows Dedicated Thermal Bake Oven Throughput (Dedicated Thermal Bake Ovens - 5 Units)
 * Single bar per hour, muted/dropped color tones.
 */
export const BakeOvenChart: React.FC = () => {
  const { chartsData, navigate, updateProcessChartPoint } = useFactory();
  const { hours, bake } = chartsData.oven;
  const maxVal = 12;
  const threshold = 6; // Target: 6 Mag/hr for 5 Bake units

  const [isEditing, setIsEditing] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalBakeOutput = bake.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all duration-150 relative flex flex-col justify-between">
      {/* Header & Legends */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div
            onClick={() => navigate('bake-process')}
            className="cursor-pointer group flex-1"
          >
            <div className="flex items-center space-x-1.5">
              <Flame className="w-5 h-5 text-amber-600 group-hover:text-amber-700 transition-colors" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
                Bake Oven
              </h3>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition-colors" />
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b3e5fc] text-sky-950 border border-sky-300 shadow-2xs">
                PROCESS
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
              THERMAL CURING (5 UNITS • TARGET: 6 MAG/HR)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <span className="w-2.5 h-2.5 bg-[#4db6ac] rounded-xs"></span>
              <span className="text-emerald-900 font-semibold text-[11px]">Pass Target (≥ 6)</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <span className="w-2.5 h-2.5 bg-[#fff176] border border-amber-300 rounded-xs"></span>
              <span className="text-amber-900 font-semibold text-[11px]">Below Target (&lt; 6)</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(!isEditing);
              }}
              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
              title="Edit Bake numbers"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Total Summary Strip */}
        <div className="flex items-center justify-between px-3 py-1.5 mb-3 bg-amber-50/50 rounded-lg border border-amber-200/60 text-xs font-mono">
          <span className="text-amber-800">Cumulative Total Output:</span>
          <span className="font-bold text-amber-900">{totalBakeOutput} Mag <span className="font-normal text-amber-700 font-sans text-[11px]">(5 Units)</span></span>
        </div>

        {/* Chart Canvas */}
        <div className="relative pt-6 pb-2 border-l border-b border-slate-300 pl-2">
          {/* Background Grid Guidelines */}
          <div className="absolute inset-x-2 top-2 bottom-8 flex flex-col justify-between pointer-events-none opacity-30">
            <div className="w-full border-b border-dashed border-slate-400 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>12</span>
              <span>Max Capacity</span>
            </div>
            <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>6</span>
              <span>Target (6 Mag)</span>
            </div>
            <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>3</span>
              <span>Low</span>
            </div>
            <div className="w-full border-b border-solid border-slate-400"></div>
          </div>

          <div className="flex items-end justify-between space-x-2 h-44 px-1 relative z-10">
            {hours.map((hr, i) => {
              const val = bake[i] ?? 6;
              const height = (val / maxVal) * 100;

              const isHigh = val >= threshold;
              const bgClass = isHigh
                ? 'bg-[#4db6ac] hover:bg-[#3d958d] shadow-xs'
                : 'bg-[#fff176] hover:bg-[#f9e755] border border-amber-300 text-slate-800';

              const isHovered = hoveredIndex === i;

              return (
                <div key={hr} className="flex-1 flex flex-col items-center">
                  <div
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="w-full flex flex-col items-center justify-end h-36 relative group cursor-pointer"
                  >
                    {isHovered && (
                      <div className="absolute -top-10 bg-slate-800 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md z-30 whitespace-nowrap">
                        Bake: {val} mag (5 Units)
                      </div>
                    )}
                    <span className="text-[10px] font-mono font-semibold text-slate-600 px-0.5 mb-1">
                      {val}
                    </span>
                    <div
                      style={{ height: `${Math.max(8, height)}%` }}
                      className={`w-full max-w-[36px] ${bgClass} rounded-t-sm transition-all duration-200`}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-600 mt-3">
                    {hr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Edit Popup */}
      {isEditing && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-center font-bold text-slate-700">
            <span>Edit Bake Hourly Output (Mag)</span>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {hours.map((hr, idx) => (
              <div key={hr} className="bg-white p-1.5 rounded border border-slate-200">
                <span className="font-mono font-bold text-[10px] text-slate-500 block">{hr}</span>
                <input
                  type="number"
                  value={bake[idx]}
                  onChange={(e) => updateProcessChartPoint('oven', 'bake', idx, Number(e.target.value))}
                  className="w-full mt-1 px-1.5 py-0.5 bg-slate-50 border border-slate-300 rounded font-mono text-[11px]"
                  title="Bake Mag"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * DispensingChart
 * Shows Total Dispensing Throughput (Consolidated 12 Machines: Top & Under Fill)
 * Single bar per hour, muted/dropped color tones.
 */
export const DispensingChart: React.FC = () => {
  const { chartsData, navigate, updateProcessChartPoint } = useFactory();
  const { hours, topFill, underFill } = chartsData.dispensing;
  const maxVal = 2000;
  const threshold = 1600; // Combined target: 800 Top + 800 Under

  const [isEditing, setIsEditing] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all duration-150 relative">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div
          onClick={() => navigate('machine-detail', 'MC-01')}
          className="cursor-pointer group flex-1"
        >
          <div className="flex items-center space-x-1.5">
            <BarChart3 className="w-5 h-5 text-sky-600 group-hover:text-sky-700 transition-colors" />
            <h3 className="text-xl font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
              Dispensing Process (Fleet Total)
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b3e5fc] text-sky-950 border border-sky-300 shadow-2xs">
              PROCESS
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
            TOTAL TOP &amp; UNDER FILL (TARGET: 1,600 PCS/HR)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium">
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 bg-[#4db6ac] rounded-xs"></span>
            <span className="text-emerald-900 font-semibold">Pass Target (≥ 1,600 Pcs)</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 bg-[#fff176] border border-amber-300 rounded-xs"></span>
            <span className="text-amber-900 font-semibold">Below Target (&lt; 1,600)</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
            title="Edit hourly chart numbers"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative pt-6 pb-2 border-l border-b border-slate-300 pl-2">
        {/* Background Grid Guidelines */}
        <div className="absolute inset-x-2 top-2 bottom-8 flex flex-col justify-between pointer-events-none opacity-30">
          <div className="w-full border-b border-dashed border-slate-400 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>2,000</span>
            <span>Max Capacity</span>
          </div>
          <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>1,600</span>
            <span>Target Output (1,600 Pcs Combined)</span>
          </div>
          <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>1,000</span>
            <span>Minimum Standard</span>
          </div>
          <div className="w-full border-b border-solid border-slate-400"></div>
        </div>

        <div className="flex items-end justify-between space-x-2 h-44 px-1 relative z-10">
          {hours.map((hr, i) => {
            const tfVal = topFill[i] ?? 800;
            const ufVal = underFill[i] ?? 800;
            const totalVal = tfVal + ufVal;
            const height = (totalVal / maxVal) * 100;

            const isHigh = totalVal >= threshold;
            const bgClass = isHigh
              ? 'bg-[#4db6ac] hover:bg-[#3d958d] shadow-xs'
              : 'bg-[#fff176] hover:bg-[#f9e755] border border-amber-300 text-slate-800';

            const isHovered = hoveredIndex === i;

            return (
              <div key={hr} className="flex-1 flex flex-col items-center">
                <div
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="w-full flex flex-col items-center justify-end h-36 relative group cursor-pointer"
                >
                  {isHovered && (
                    <div className="absolute -top-10 bg-slate-800 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md z-30 whitespace-nowrap">
                      Total Dispensing: {totalVal} pcs (Top: {tfVal}, Under: {ufVal})
                    </div>
                  )}
                  <span className="text-[10px] font-mono font-semibold text-slate-600 px-0.5 mb-1">
                    {totalVal}
                  </span>
                  <div
                    style={{ height: `${Math.max(8, height)}%` }}
                    className={`w-full max-w-[36px] ${bgClass} rounded-t-sm transition-all duration-200`}
                  ></div>
                </div>
                <span className="text-xs font-mono font-medium text-slate-600 mt-3">
                  {hr}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-center font-bold text-slate-700">
            <span>Edit Dispensing Hourly Top &amp; Under Fill Outputs</span>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {hours.map((hr, idx) => (
              <div key={hr} className="bg-white p-1.5 rounded border border-slate-200">
                <span className="font-mono font-bold text-[10px] text-slate-500 block">{hr}</span>
                <div className="flex gap-1 mt-1">
                  <input
                    type="number"
                    value={topFill[idx]}
                    onChange={(e) => updateProcessChartPoint('dispensing', 'topFill', idx, Number(e.target.value))}
                    className="w-1/2 px-1 py-0.5 bg-slate-50 border border-slate-300 rounded font-mono text-[11px]"
                    title="Top Fill"
                  />
                  <input
                    type="number"
                    value={underFill[idx]}
                    onChange={(e) => updateProcessChartPoint('dispensing', 'underFill', idx, Number(e.target.value))}
                    className="w-1/2 px-1 py-0.5 bg-sky-50 border border-sky-300 text-sky-800 rounded font-mono text-[11px]"
                    title="Under Fill"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * FvmiChart
 * Shows Total FVMI Inspection (Consolidated 9 Machines)
 * Single bar per hour, muted/dropped color tones.
 */
export const FvmiChart: React.FC = () => {
  const { chartsData, navigate, updateProcessChartPoint } = useFactory();
  const { hours, total } = chartsData.fvmi;
  const maxVal = 1400;
  const threshold = 1100;

  const [isEditing, setIsEditing] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all duration-150 relative">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div
          onClick={() => navigate('fvmi')}
          className="cursor-pointer group flex-1"
        >
          <div className="flex items-center space-x-1.5">
            <BarChart3 className="w-5 h-5 text-sky-600 group-hover:text-sky-700 transition-colors" />
            <h3 className="text-xl font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
              FVMI Inspection (Fleet Total)
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b3e5fc] text-sky-950 border border-sky-300 shadow-2xs">
              PROCESS
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
            TOTAL 9 STATIONS THROUGHPUT (TARGET: 1,100 PCS/HR)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium">
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 bg-[#4db6ac] rounded-xs"></span>
            <span className="text-emerald-900 font-semibold">Pass Target (≥ 1,100 Pcs)</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 bg-[#fff176] border border-amber-300 rounded-xs"></span>
            <span className="text-amber-900 font-semibold">Below Target (&lt; 1,100)</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
            title="Edit hourly chart numbers"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative pt-6 pb-2 border-l border-b border-slate-300 pl-2">
        {/* Background Grid Guidelines */}
        <div className="absolute inset-x-2 top-2 bottom-8 flex flex-col justify-between pointer-events-none opacity-30">
          <div className="w-full border-b border-dashed border-slate-400 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>1,400</span>
            <span>Max Capacity</span>
          </div>
          <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>1,100</span>
            <span>Target Output (1,100 Pcs)</span>
          </div>
          <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>700</span>
            <span>Standard Line</span>
          </div>
          <div className="w-full border-b border-solid border-slate-400"></div>
        </div>

        <div className="flex items-end justify-between space-x-2 h-44 px-1 relative z-10">
          {hours.map((hr, i) => {
            const val = total[i];
            const height = (val / maxVal) * 100;
            const isHigh = val >= threshold;
            const bgClass = isHigh
              ? 'bg-[#4db6ac] hover:bg-[#3d958d] shadow-xs'
              : 'bg-[#fff176] hover:bg-[#f9e755] border border-amber-300 text-slate-800';
            const isHovered = hoveredIndex === i;

            return (
              <div key={hr} className="flex-1 flex flex-col items-center">
                <div
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="w-full flex flex-col items-center justify-end h-36 relative group cursor-pointer"
                >
                  {isHovered && (
                    <div className="absolute -top-10 bg-slate-800 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md z-30 whitespace-nowrap">
                      Total FVMI: {val} pcs/hr
                    </div>
                  )}
                  <span className="text-[10px] font-mono font-semibold text-slate-600 px-0.5 mb-1">
                    {val}
                  </span>
                  <div
                    style={{ height: `${Math.max(8, height)}%` }}
                    className={`w-full max-w-[36px] ${bgClass} rounded-t-sm transition-all duration-200`}
                  ></div>
                </div>
                <span className="text-xs font-mono font-medium text-slate-600 mt-3">
                  {hr}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-center font-bold text-slate-700">
            <span>Edit FVMI Hourly Inspected Units</span>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {hours.map((hr, idx) => (
              <div key={hr} className="bg-white p-1.5 rounded border border-slate-200">
                <span className="font-mono font-bold text-[10px] text-slate-500 block">{hr}</span>
                <input
                  type="number"
                  value={total[idx]}
                  onChange={(e) => updateProcessChartPoint('fvmi', 'total', idx, Number(e.target.value))}
                  className="w-full mt-1 px-1 py-0.5 bg-amber-50 border border-amber-300 text-amber-900 rounded font-mono text-[11px]"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * AOIChart
 * Shows Total AOI Inspection (Consolidated 2 Machines: AOI-01 + AOI-02)
 * Single unified bar per hour, no separated machine buttons, muted/dropped color tones.
 */
export const AOIChart: React.FC = () => {
  const { chartsData, navigate, updateProcessChartPoint } = useFactory();
  const aoiData = chartsData.aoi || {
    hours: chartsData.packout.hours,
    uph: chartsData.packout.count,
    unit1: [1040, 1150, 1220, 1130, 1190, 960, 1180, 1150, 1230, 1190, 1120],
    unit2: [810, 890, 960, 910, 940, 720, 920, 880, 970, 920, 840]
  };
  const { hours, uph } = aoiData;
  const unit1 = aoiData.unit1 || hours.map((_, i) => Math.max(900, (uph[i] ?? 1100) + 120));
  const unit2 = aoiData.unit2 || hours.map((_, i) => Math.min(1000, Math.max(650, (uph[i] ?? 1100) - 180)));
  
  // Target for 2 machines combined: 1,100 * 2 = 2,200 UPH
  const maxVal = 2800;
  const threshold = 2200;

  const [isEditing, setIsEditing] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all duration-150 relative">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div
          onClick={() => navigate('packout-aoi', 'ALL')}
          className="cursor-pointer group flex-1"
        >
          <div className="flex items-center space-x-1.5">
            <BarChart3 className="w-5 h-5 text-sky-600 group-hover:text-sky-700 transition-colors" />
            <h3 className="text-xl font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
              AOI Inspection (Fleet Total)
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b3e5fc] text-sky-950 border border-sky-300 shadow-2xs">
              PROCESS
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
            TOTAL AOI THROUGHPUT (TARGET: 2,200 UPH — 2 MACHINES COMBINED)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium">
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 bg-[#4db6ac] rounded-xs"></span>
            <span className="text-emerald-900 font-semibold">Pass Target (≥ 2,200 UPH)</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 bg-[#fff176] border border-amber-300 rounded-xs"></span>
            <span className="text-amber-900 font-semibold">Below Target (&lt; 2,200)</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
            title="Edit hourly chart numbers"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AOI Machine Direct Jump Bar */}
      <div className="flex items-center gap-1.5 mb-3 bg-[#b3e5fc]/25 p-2 rounded-xl border border-sky-200 text-xs overflow-x-auto">
        <span className="font-mono font-bold text-sky-950 shrink-0">Open Machine:</span>
        {[1, 2].map((num) => {
          const aoiKey = `AOI-0${num}`;
          return (
            <button
              key={num}
              onClick={() => navigate('packout-aoi', aoiKey)}
              className="px-2.5 py-1 bg-white hover:bg-[#b3e5fc] hover:text-sky-950 text-slate-800 border border-sky-300 rounded-lg font-mono font-bold transition-colors cursor-pointer shadow-2xs shrink-0 flex items-center gap-1"
              title={`Open ${aoiKey} Machine View (Line ${num})`}
            >
              <span>{aoiKey}</span>
              <span className="text-[10px] opacity-75">(Line {num})</span>
            </button>
          );
        })}
      </div>

      <div className="relative pt-6 pb-2 border-l border-b border-slate-300 pl-2">
        {/* Background Grid Guidelines */}
        <div className="absolute inset-x-2 top-2 bottom-8 flex flex-col justify-between pointer-events-none opacity-30">
          <div className="w-full border-b border-dashed border-slate-400 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>2,800 UPH</span>
            <span>Max Capacity</span>
          </div>
          <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>2,200 UPH</span>
            <span>Target Output (2,200 UPH Combined)</span>
          </div>
          <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>1,400 UPH</span>
            <span>Standard Line</span>
          </div>
          <div className="w-full border-b border-solid border-slate-400"></div>
        </div>

        <div className="flex items-end justify-between space-x-2 h-44 px-1 relative z-10">
          {hours.map((hr, i) => {
            const v1 = unit1[i] ?? 1100;
            const v2 = unit2[i] ?? 1100;
            const totalVal = v1 + v2;
            const height = (totalVal / maxVal) * 100;

            const isHigh = totalVal >= threshold;
            const bgClass = isHigh
              ? 'bg-[#4db6ac] hover:bg-[#3d958d] shadow-xs'
              : 'bg-[#fff176] hover:bg-[#f9e755] border border-amber-300 text-slate-800';

            const isHovered = hoveredIndex === i;

            return (
              <div key={hr} className="flex-1 flex flex-col items-center">
                <div
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="w-full flex flex-col items-center justify-end h-36 relative group cursor-pointer"
                >
                  {isHovered && (
                    <div className="absolute -top-10 bg-slate-800 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md z-30 whitespace-nowrap">
                      Total AOI: {totalVal} UPH (Line 1: {v1}, Line 2: {v2})
                    </div>
                  )}
                  <span className="text-[10px] font-mono font-semibold text-slate-600 px-0.5 mb-1">
                    {totalVal}
                  </span>
                  <div
                    style={{ height: `${Math.max(8, height)}%` }}
                    className={`w-full max-w-[36px] ${bgClass} rounded-t-sm transition-all duration-200`}
                  ></div>
                </div>
                <span className="text-xs font-mono font-medium text-slate-600 mt-3">
                  {hr}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-center font-bold text-slate-700">
            <span>Edit AOI Units Hourly Throughput (Target: 1,100 each / 2,200 Total)</span>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {hours.map((hr, idx) => (
              <div key={hr} className="bg-white p-1.5 rounded border border-slate-200">
                <span className="font-mono font-bold text-[10px] text-slate-500 block">{hr}</span>
                <div className="flex gap-1 mt-1">
                  <input
                    type="number"
                    value={unit1[idx]}
                    onChange={(e) => updateProcessChartPoint('aoi', 'unit1', idx, Number(e.target.value))}
                    className="w-1/2 px-1 py-0.5 bg-slate-50 border border-slate-300 text-slate-800 rounded font-mono text-[11px]"
                    title="AOI-01"
                  />
                  <input
                    type="number"
                    value={unit2[idx]}
                    onChange={(e) => updateProcessChartPoint('aoi', 'unit2', idx, Number(e.target.value))}
                    className="w-1/2 px-1 py-0.5 bg-sky-50 border border-sky-300 text-sky-900 rounded font-mono text-[11px]"
                    title="AOI-02"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * XrayChart
 * Shows Total X-ray Radiography (Consolidated 5 Units)
 * Single bar per hour, muted/dropped color tones.
 */
export const XrayChart: React.FC = () => {
  const { chartsData, navigate, updateProcessChartPoint } = useFactory();
  const xrayData = chartsData.xray || {
    hours: chartsData.packout.hours,
    uph: chartsData.packout.ocr
  };
  const { hours, uph } = xrayData;
  const maxVal = 1400;
  const threshold = 1100;

  const [isEditing, setIsEditing] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all duration-150 relative">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div
          onClick={() => navigate('packout-xray', 'ALL')}
          className="cursor-pointer group flex-1"
        >
          <div className="flex items-center space-x-1.5">
            <BarChart3 className="w-5 h-5 text-rose-600 group-hover:text-rose-700 transition-colors" />
            <h3 className="text-xl font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
              X-ray Radiography (Fleet Total)
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b3e5fc] text-sky-950 border border-sky-300 shadow-2xs">
              PROCESS
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
            TOTAL 90KV MICRO-FOCUS NDT DIAGNOSTICS (TARGET: 1,100 UPH)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium">
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 bg-[#4db6ac] rounded-xs"></span>
            <span className="text-emerald-900 font-semibold">Pass Target (≥ 1,100 UPH)</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 bg-[#fff176] border border-amber-300 rounded-xs"></span>
            <span className="text-amber-900 font-semibold">Below Target (&lt; 1,100)</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
            title="Edit hourly chart numbers"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* X-ray Machine Direct Jump Bar */}
      <div className="flex items-center gap-1.5 mb-3 bg-[#b3e5fc]/25 p-2 rounded-xl border border-sky-200 text-xs overflow-x-auto">
        <span className="font-mono font-bold text-sky-950 shrink-0">Open Unit:</span>
        {[1, 2, 3, 4, 5, 6].map((num) => {
          const mKey = `X-RAY 0${num}`;
          return (
            <button
              key={num}
              onClick={() => navigate('packout-xray', mKey)}
              className="px-2.5 py-1 bg-white hover:bg-[#b3e5fc] hover:text-sky-950 text-slate-800 border border-sky-300 rounded-lg font-mono font-bold transition-colors cursor-pointer shadow-2xs shrink-0 flex items-center gap-1"
              title={`Open ${mKey} Machine View (Line ${num})`}
            >
              <span>{mKey}</span>
              <span className="text-[10px] opacity-75">(Line {num})</span>
            </button>
          );
        })}
      </div>

      <div className="relative pt-6 pb-2 border-l border-b border-slate-300 pl-2">
        {/* Background Grid Guidelines */}
        <div className="absolute inset-x-2 top-2 bottom-8 flex flex-col justify-between pointer-events-none opacity-30">
          <div className="w-full border-b border-dashed border-slate-400 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>1,400 UPH</span>
            <span>Max Capacity</span>
          </div>
          <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>1,100 UPH</span>
            <span>Target Output (1,100 UPH)</span>
          </div>
          <div className="w-full border-b border-dashed border-slate-300 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>700 UPH</span>
            <span>Standard Line</span>
          </div>
          <div className="w-full border-b border-solid border-slate-400"></div>
        </div>

        <div className="flex items-end justify-between space-x-2 h-44 px-1 relative z-10">
          {hours.map((hr, i) => {
            const val = uph[i] ?? 1100;
            const height = (val / maxVal) * 100;
            const isHigh = val >= threshold;
            const bgClass = isHigh
              ? 'bg-[#4db6ac] hover:bg-[#3d958d] shadow-xs'
              : 'bg-[#fff176] hover:bg-[#f9e755] border border-amber-300 text-slate-800';
            const isHovered = hoveredIndex === i;

            return (
              <div key={hr} className="flex-1 flex flex-col items-center">
                <div
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="w-full flex flex-col items-center justify-end h-36 relative group cursor-pointer"
                >
                  {isHovered && (
                    <div className="absolute -top-10 bg-slate-800 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md z-30 whitespace-nowrap">
                      Total X-ray: {val} UPH
                    </div>
                  )}
                  <span className="text-[10px] font-mono font-semibold text-slate-600 px-0.5 mb-1">
                    {val}
                  </span>
                  <div
                    style={{ height: `${Math.max(8, height)}%` }}
                    className={`w-full max-w-[36px] ${bgClass} rounded-t-sm transition-all duration-200`}
                  ></div>
                </div>
                <span className="text-xs font-mono font-medium text-slate-600 mt-3">
                  {hr}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-center font-bold text-slate-700">
            <span>Edit X-ray Hourly Fleet Throughput (Target: 1,100 UPH)</span>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {hours.map((hr, idx) => (
              <div key={hr} className="bg-white p-1.5 rounded border border-slate-200">
                <span className="font-mono font-bold text-[10px] text-slate-500 block">{hr}</span>
                <input
                  type="number"
                  value={uph[idx]}
                  onChange={(e) => updateProcessChartPoint('xray', 'uph', idx, Number(e.target.value))}
                  className="w-full mt-1 px-1 py-0.5 bg-rose-50 border border-rose-300 text-rose-900 rounded font-mono text-[11px]"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * PackoutChart (Fallback/Auxiliary)
 * Kept consistent with muted 2-tone colors.
 */
export const PackoutChart: React.FC = () => {
  const { chartsData, navigate, updateProcessChartPoint } = useFactory();
  const { hours, count, ocr } = chartsData.packout;
  const maxVal = 2800;
  const threshold = 2200;

  const [isEditing, setIsEditing] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all duration-150 relative">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div
          onClick={() => navigate('packout-selection')}
          className="cursor-pointer group flex-1"
        >
          <div className="flex items-center space-x-1.5">
            <BarChart3 className="w-5 h-5 text-sky-600 group-hover:text-sky-700 transition-colors" />
            <h3 className="text-xl font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
              Packout Process (Fleet Total)
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b3e5fc] text-sky-950 border border-sky-300 shadow-2xs">
              PROCESS
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
            TOTAL AOI &amp; X-RAY PACKOUT (TARGET: 2,200 UPH)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium">
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 bg-[#4db6ac] rounded-xs"></span>
            <span className="text-emerald-900 font-semibold">Pass Target (≥ 2,200 UPH)</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 bg-[#fff176] border border-amber-300 rounded-xs"></span>
            <span className="text-amber-900 font-semibold">Below Target (&lt; 2,200)</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
            title="Edit hourly chart numbers"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative pt-6 pb-2 border-l border-b border-slate-300 pl-2">
        <div className="flex items-end justify-between space-x-2 h-44 px-1 relative z-10">
          {hours.map((hr, i) => {
            const totalVal = (count[i] ?? 1100) + (ocr[i] ?? 1100);
            const height = (totalVal / maxVal) * 100;
            const isHigh = totalVal >= threshold;
            const bgClass = isHigh
              ? 'bg-[#4db6ac] hover:bg-[#3d958d] shadow-xs'
              : 'bg-[#fff176] hover:bg-[#f9e755] border border-amber-300 text-slate-800';
            const isHovered = hoveredIndex === i;

            return (
              <div key={hr} className="flex-1 flex flex-col items-center">
                <div
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="w-full flex flex-col items-center justify-end h-36 relative group cursor-pointer"
                >
                  {isHovered && (
                    <div className="absolute -top-10 bg-slate-800 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md z-30 whitespace-nowrap">
                      Packout Total: {totalVal} UPH
                    </div>
                  )}
                  <span className="text-[10px] font-mono font-semibold text-slate-600 px-0.5 mb-1">
                    {totalVal}
                  </span>
                  <div
                    style={{ height: `${Math.max(8, height)}%` }}
                    className={`w-full max-w-[36px] ${bgClass} rounded-t-sm transition-all duration-200`}
                  ></div>
                </div>
                <span className="text-xs font-mono font-medium text-slate-600 mt-3">
                  {hr}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
