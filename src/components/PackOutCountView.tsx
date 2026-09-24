import React, { useState, useEffect, useMemo } from 'react';
import { MachineAnalyticsControlBar } from './MachineAnalyticsControlBar';
import {
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
  Edit3,
  Sparkles,
  Check,
  X,
  Sliders,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Download,
  RotateCcw,
  Activity,
  Layers,
  Cpu,
  ScanLine,
  Filter,
  Calendar,
  Info,
  ArrowUp,
  ArrowDown,
  Radio,
  Gauge
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
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import { Header } from './Header';
import { normalizeAoiMachineId } from '../utils/machineLinkUtils';
import { InspectionDetailModal, InspectionPopupPayload } from './InspectionDetailModal';
import { ThermalAllFleetChart } from './ThermalAllFleetChart';
import { ThermalSingleMachineChart } from './ThermalSingleMachineChart';
import { InspectionMachinesOverviewSection } from './InspectionMachinesOverviewSection';
import { OvenUnit } from '../types';

export interface AoiHourlySlot {
  hour: string; // e.g. "07:00 - 08:00"
  hourShort: string; // "07:00"
  runningModel: string; // "504-2187", "504-2268", etc.
  targetUph: number;
  actualIn: number;
  goodCount: number;
  ngCount: number;
  yieldPercent: number;
  cycleTimeSec: number;
  // Side specific counts
  topInspected: number;
  topGood: number;
  topNg: number;
  topYield: number;
  bottomInspected: number;
  bottomGood: number;
  bottomNg: number;
  bottomYield: number;
  defects: {
    tombstone: number;
    solderBridge: number;
    missingComp: number;
    offsetShift: number;
    polarityRev: number;
  };
}

export interface AoiMachineDataset {
  machineId: string;
  name: string;
  line: string;
  lineDesc: string;
  operatorId: string;
  runningModel: string;
  modelDesc?: string;
  pcbRev?: string;
  packageType?: string;
  status: 'ONLINE (HOURLY SYNC)' | 'STANDBY' | 'MAINTENANCE';
  targetUph: number;
  topCameraSpec: string;
  bottomCameraSpec: string;
  exposureTimeMs: number;
  hourlyData: AoiHourlySlot[];
}

const STORAGE_AOI_HOURLY_KEY = 'factory_aoi_hourly_monitoring_v8';

export const ROTATION_MODELS = ['504-2187', '504-2268', '504-2154', '504-2224', '504-2454'];

export interface AvailableAoiModel {
  id: string;
  name: string;
  title: string;
  desc: string;
  rev: string;
  packageType: string;
  productionRun: string;
  lotNumber: string;
  targetYield: number;
}

export const AVAILABLE_AOI_MODELS: AvailableAoiModel[] = [
  {
    id: '504-2187',
    name: 'Model 504-2187',
    title: 'Main Controller Board',
    desc: 'High-Density Dual-Core Host Processing PCB (FCBGA-676)',
    rev: 'Rev 2.1A',
    packageType: 'FCBGA-676 / DDR4',
    productionRun: 'Run: 3-4 Days (Active Batch)',
    lotNumber: 'LOT-2026-0901-A',
    targetYield: 99.5
  },
  {
    id: '504-2268',
    name: 'Model 504-2268',
    title: 'Power Delivery Module',
    desc: 'Multi-Phase Synchronous Buck PMIC & Power FETs',
    rev: 'Rev 1.4B',
    packageType: 'QFN-64 / PMIC U01',
    productionRun: 'Run: 3-4 Days (In Production)',
    lotNumber: 'LOT-2026-0830-B',
    targetYield: 99.4
  },
  {
    id: '504-2154',
    name: 'Model 504-2154',
    title: 'RF Transceiver Board',
    desc: 'Ultra-Low Noise RF Front-End & Shielded Baseband Unit',
    rev: 'Rev 3.0C',
    packageType: 'RF Shield / Dual BGA',
    productionRun: 'Run: 3-4 Days (Scheduled Batch)',
    lotNumber: 'LOT-2026-0902-C',
    targetYield: 99.6
  },
  {
    id: '504-2224',
    name: 'Model 504-2224',
    title: 'Sensor Interface Hub',
    desc: 'High-Density Mixed-Signal Sensor Gateway (CSP-144)',
    rev: 'Rev 1.8A',
    packageType: 'CSP-144 / QFN',
    productionRun: 'Run: 3-4 Days (In Production)',
    lotNumber: 'LOT-2026-0829-D',
    targetYield: 99.5
  },
  {
    id: '504-2454',
    name: 'Model 504-2454',
    title: 'High-Density Gateway',
    desc: '10GbE Network Processing Unit (FCBGA-1156 High-Speed)',
    rev: 'Rev 4.2D',
    packageType: 'FCBGA-1156 / High-Speed',
    productionRun: 'Run: 3-4 Days (Active Batch)',
    lotNumber: 'LOT-2026-0901-E',
    targetYield: 99.6
  }
];

export const getModelBadge = (modelId: string) => {
  switch (modelId) {
    case 'ALL':
    case 'ALL MODELS':
      return {
        bg: 'bg-sky-100',
        text: 'text-sky-900',
        border: 'border-sky-300',
        dot: 'bg-sky-600',
        bar: '#0284c7',
        name: 'All Models',
        shortDesc: 'All Models'
      };
    case '504-2187':
      return {
        bg: 'bg-sky-100',
        text: 'text-sky-900',
        border: 'border-sky-300',
        dot: 'bg-sky-600',
        bar: '#0284c7',
        name: '504-2187',
        shortDesc: 'Main Ctrl'
      };
    case '504-2268':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300',
        dot: 'bg-blue-600',
        bar: '#2563eb',
        name: '504-2268',
        shortDesc: 'Power Mod'
      };
    case '504-2154':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-800',
        border: 'border-emerald-300',
        dot: 'bg-emerald-600',
        bar: '#059669',
        name: '504-2154',
        shortDesc: 'RF Trans'
      };
    case '504-2224':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-300',
        dot: 'bg-amber-600',
        bar: '#d97706',
        name: '504-2224',
        shortDesc: 'Sensor Hub'
      };
    case '504-2454':
      return {
        bg: 'bg-rose-100',
        text: 'text-rose-800',
        border: 'border-rose-300',
        dot: 'bg-rose-600',
        bar: '#e11d48',
        name: '504-2454',
        shortDesc: 'Gateway'
      };
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
        dot: 'bg-slate-600',
        bar: '#64748b',
        name: modelId,
        shortDesc: 'PCB'
      };
  }
};

export const generateModelHourlySlots = (modelId: string, machineIndex: number = 0): AoiHourlySlot[] => {
  // AOI-01 (Line 1): High-speed dual-head inspection (~1,120-1,230 UPH, target 1,150)
  // AOI-02 (Line 2): Dedicated vacuum-feed inspection (~810-970 UPH, target 950)
  const isUnit2 = machineIndex === 1;
  const baseSlots = isUnit2
    ? [
        { hour: '07:00 - 08:00', hourShort: '07:00', baseActual: 810 },
        { hour: '08:00 - 09:00', hourShort: '08:00', baseActual: 890 },
        { hour: '09:00 - 10:00', hourShort: '09:00', baseActual: 960 },
        { hour: '10:00 - 11:00', hourShort: '10:00', baseActual: 910 },
        { hour: '11:00 - 12:00', hourShort: '11:00', baseActual: 940 },
        { hour: '12:00 - 13:00', hourShort: '12:00', baseActual: 720 },
        { hour: '13:00 - 14:00', hourShort: '13:00', baseActual: 920 },
        { hour: '14:00 - 15:00', hourShort: '14:00', baseActual: 880 },
        { hour: '15:00 - 16:00', hourShort: '15:00', baseActual: 970 },
        { hour: '16:00 - 17:00', hourShort: '16:00', baseActual: 920 },
        { hour: '17:00 - 18:00', hourShort: '17:00', baseActual: 840 }
      ]
    : [
        { hour: '07:00 - 08:00', hourShort: '07:00', baseActual: 1040 },
        { hour: '08:00 - 09:00', hourShort: '08:00', baseActual: 1150 },
        { hour: '09:00 - 10:00', hourShort: '09:00', baseActual: 1220 },
        { hour: '10:00 - 11:00', hourShort: '10:00', baseActual: 1130 },
        { hour: '11:00 - 12:00', hourShort: '11:00', baseActual: 1190 },
        { hour: '12:00 - 13:00', hourShort: '12:00', baseActual: 960 },
        { hour: '13:00 - 14:00', hourShort: '13:00', baseActual: 1180 },
        { hour: '14:00 - 15:00', hourShort: '14:00', baseActual: 1150 },
        { hour: '15:00 - 16:00', hourShort: '15:00', baseActual: 1230 },
        { hour: '16:00 - 17:00', hourShort: '16:00', baseActual: 1190 },
        { hour: '17:00 - 18:00', hourShort: '17:00', baseActual: 1120 }
      ];

  const targetUph = isUnit2 ? 950 : 1150;
  const baseCycleTime = isUnit2 ? 2.10 : 1.62;

  const modelIdx = AVAILABLE_AOI_MODELS.findIndex(m => m.id === modelId);
  const mOffset = modelIdx >= 0 ? modelIdx : 0;

  return baseSlots.map((h, i) => {
    const seed = (mOffset * 13 + machineIndex * 19 + i * 7) % 23;
    const actual = h.baseActual + (seed - 11) * 3;
    const ng = Math.max(2, Math.min(8, ((mOffset + machineIndex + i) % 5) + 3));
    const good = actual - ng;
    const yieldPct = Number(((good / actual) * 100).toFixed(2));
    const topNg = Math.floor(ng / 2);
    const btmNg = ng - topNg;
    const topIn = Math.floor(actual / 2);
    const btmIn = actual - topIn;
    const topGood = topIn - topNg;
    const btmGood = btmIn - btmNg;
    const topYield = Number(((topGood / topIn) * 100).toFixed(2));
    const btmYield = Number(((btmGood / btmIn) * 100).toFixed(2));

    return {
      hour: h.hour,
      hourShort: h.hourShort,
      runningModel: modelId,
      targetUph,
      actualIn: actual,
      goodCount: good,
      ngCount: ng,
      yieldPercent: yieldPct,
      cycleTimeSec: Number((baseCycleTime + ((seed % 10) * 0.015)).toFixed(2)),
      topInspected: topIn,
      topGood: topGood,
      topNg: topNg,
      topYield: topYield,
      bottomInspected: btmIn,
      bottomGood: btmGood,
      bottomNg: btmNg,
      bottomYield: btmYield,
      defects: {
        tombstone: Math.max(0, Math.floor(ng * 0.3)),
        solderBridge: Math.max(0, Math.floor(ng * 0.3)),
        missingComp: Math.max(0, Math.floor(ng * 0.15)),
        offsetShift: Math.max(0, Math.floor(ng * 0.2)),
        polarityRev: Math.max(0, ng - (Math.floor(ng * 0.3) * 2 + Math.floor(ng * 0.15) + Math.floor(ng * 0.2)))
      }
    };
  });
};

export const generateModelHourlyFleet = (modelId: string): Record<string, AoiMachineDataset> => {
  const modelInfo = AVAILABLE_AOI_MODELS.find((m) => m.id === modelId) || AVAILABLE_AOI_MODELS[0];
  const machines = [
    { id: 'AOI-01', name: 'AOI Unit 01 (Line 1)', line: 'Line 1', lineDesc: 'Top Fill & Pre-Pack', op: 'E8291', exp: 1.6, target: 1150 },
    { id: 'AOI-02', name: 'AOI Unit 02 (Line 2)', line: 'Line 2', lineDesc: 'Top Fill & Vacuum A', op: 'E6402', exp: 2.2, target: 950 }
  ];

  const fleetRecord: Record<string, AoiMachineDataset> = {};
  machines.forEach((m, idx) => {
    fleetRecord[m.id] = {
      machineId: m.id,
      name: m.name,
      line: m.line,
      lineDesc: m.lineDesc,
      operatorId: m.op,
      runningModel: modelInfo.id,
      modelDesc: `${modelInfo.name} — ${modelInfo.title}`,
      pcbRev: modelInfo.rev,
      packageType: modelInfo.packageType,
      status: 'ONLINE (HOURLY SYNC)',
      targetUph: m.target,
      topCameraSpec: 'Koh Young Zenith 3D 12MP Telecentric',
      bottomCameraSpec: 'Keyence Dual-Coaxial 5.0MP Ultra-Fast',
      exposureTimeMs: m.exp,
      hourlyData: generateModelHourlySlots(modelInfo.id, idx)
    };
  });

  return fleetRecord;
};

const DEFAULT_HOURLY_SLOTS_AOI_1: AoiHourlySlot[] = [
  {
    hour: '07:00 - 08:00',
    hourShort: '07:00',
    runningModel: '504-2187',
    targetUph: 1100,
    actualIn: 960,
    goodCount: 955,
    ngCount: 5,
    yieldPercent: 99.48,
    cycleTimeSec: 1.85,
    topInspected: 480,
    topGood: 477,
    topNg: 3,
    topYield: 99.38,
    bottomInspected: 480,
    bottomGood: 478,
    bottomNg: 2,
    bottomYield: 99.58,
    defects: { tombstone: 2, solderBridge: 1, missingComp: 1, offsetShift: 1, polarityRev: 0 }
  },
  {
    hour: '08:00 - 09:00',
    hourShort: '08:00',
    runningModel: '504-2187',
    targetUph: 1100,
    actualIn: 1040,
    goodCount: 1035,
    ngCount: 5,
    yieldPercent: 99.52,
    cycleTimeSec: 1.80,
    topInspected: 520,
    topGood: 518,
    topNg: 2,
    topYield: 99.62,
    bottomInspected: 520,
    bottomGood: 517,
    bottomNg: 3,
    bottomYield: 99.42,
    defects: { tombstone: 1, solderBridge: 2, missingComp: 0, offsetShift: 2, polarityRev: 0 }
  },
  {
    hour: '09:00 - 10:00',
    hourShort: '09:00',
    runningModel: '504-2268',
    targetUph: 1100,
    actualIn: 1145,
    goodCount: 1141,
    ngCount: 4,
    yieldPercent: 99.65,
    cycleTimeSec: 1.78,
    topInspected: 572,
    topGood: 570,
    topNg: 2,
    topYield: 99.65,
    bottomInspected: 573,
    bottomGood: 571,
    bottomNg: 2,
    bottomYield: 99.65,
    defects: { tombstone: 1, solderBridge: 1, missingComp: 0, offsetShift: 1, polarityRev: 1 }
  },
  {
    hour: '10:00 - 11:00',
    hourShort: '10:00',
    runningModel: '504-2268',
    targetUph: 1100,
    actualIn: 1090,
    goodCount: 1082,
    ngCount: 8,
    yieldPercent: 99.27,
    cycleTimeSec: 1.88,
    topInspected: 545,
    topGood: 540,
    topNg: 5,
    topYield: 99.08,
    bottomInspected: 545,
    bottomGood: 542,
    bottomNg: 3,
    bottomYield: 99.45,
    defects: { tombstone: 3, solderBridge: 2, missingComp: 1, offsetShift: 2, polarityRev: 0 }
  },
  {
    hour: '11:00 - 12:00',
    hourShort: '11:00',
    runningModel: '504-2154',
    targetUph: 1100,
    actualIn: 1135,
    goodCount: 1129,
    ngCount: 6,
    yieldPercent: 99.47,
    cycleTimeSec: 1.79,
    topInspected: 568,
    topGood: 564,
    topNg: 4,
    topYield: 99.30,
    bottomInspected: 567,
    bottomGood: 565,
    bottomNg: 2,
    bottomYield: 99.65,
    defects: { tombstone: 2, solderBridge: 1, missingComp: 1, offsetShift: 1, polarityRev: 1 }
  },
  {
    hour: '12:00 - 13:00',
    hourShort: '12:00',
    runningModel: '504-2154',
    targetUph: 1100,
    actualIn: 880,
    goodCount: 878,
    ngCount: 2,
    yieldPercent: 99.77,
    cycleTimeSec: 1.75,
    topInspected: 440,
    topGood: 439,
    topNg: 1,
    topYield: 99.77,
    bottomInspected: 440,
    bottomGood: 439,
    bottomNg: 1,
    bottomYield: 99.77,
    defects: { tombstone: 0, solderBridge: 1, missingComp: 0, offsetShift: 1, polarityRev: 0 }
  },
  {
    hour: '13:00 - 14:00',
    hourShort: '13:00',
    runningModel: '504-2224',
    targetUph: 1100,
    actualIn: 1125,
    goodCount: 1120,
    ngCount: 5,
    yieldPercent: 99.56,
    cycleTimeSec: 1.80,
    topInspected: 562,
    topGood: 559,
    topNg: 3,
    topYield: 99.47,
    bottomInspected: 563,
    bottomGood: 561,
    bottomNg: 2,
    bottomYield: 99.64,
    defects: { tombstone: 1, solderBridge: 2, missingComp: 1, offsetShift: 1, polarityRev: 0 }
  },
  {
    hour: '14:00 - 15:00',
    hourShort: '14:00',
    runningModel: '504-2224',
    targetUph: 1100,
    actualIn: 1110,
    goodCount: 1104,
    ngCount: 6,
    yieldPercent: 99.46,
    cycleTimeSec: 1.82,
    topInspected: 555,
    topGood: 551,
    topNg: 4,
    topYield: 99.28,
    bottomInspected: 555,
    bottomGood: 553,
    bottomNg: 2,
    bottomYield: 99.64,
    defects: { tombstone: 2, solderBridge: 1, missingComp: 2, offsetShift: 1, polarityRev: 0 }
  },
  {
    hour: '15:00 - 16:00',
    hourShort: '15:00',
    runningModel: '504-2454',
    targetUph: 1100,
    actualIn: 1160,
    goodCount: 1156,
    ngCount: 4,
    yieldPercent: 99.66,
    cycleTimeSec: 1.76,
    topInspected: 580,
    topGood: 578,
    topNg: 2,
    topYield: 99.66,
    bottomInspected: 580,
    bottomGood: 578,
    bottomNg: 2,
    bottomYield: 99.66,
    defects: { tombstone: 1, solderBridge: 1, missingComp: 0, offsetShift: 1, polarityRev: 1 }
  },
  {
    hour: '16:00 - 17:00',
    hourShort: '16:00',
    runningModel: '504-2454',
    targetUph: 1100,
    actualIn: 1140,
    goodCount: 1136,
    ngCount: 4,
    yieldPercent: 99.65,
    cycleTimeSec: 1.77,
    topInspected: 570,
    topGood: 568,
    topNg: 2,
    topYield: 99.65,
    bottomInspected: 570,
    bottomGood: 568,
    bottomNg: 2,
    bottomYield: 99.65,
    defects: { tombstone: 1, solderBridge: 1, missingComp: 1, offsetShift: 1, polarityRev: 0 }
  },
  {
    hour: '17:00 - 18:00',
    hourShort: '17:00',
    runningModel: '504-2187',
    targetUph: 1100,
    actualIn: 1010,
    goodCount: 1005,
    ngCount: 5,
    yieldPercent: 99.50,
    cycleTimeSec: 1.81,
    topInspected: 505,
    topGood: 502,
    topNg: 3,
    topYield: 99.41,
    bottomInspected: 505,
    bottomGood: 503,
    bottomNg: 2,
    bottomYield: 99.60,
    defects: { tombstone: 2, solderBridge: 1, missingComp: 0, offsetShift: 2, polarityRev: 0 }
  }
];

const INITIAL_AOI_HOURLY_FLEET: Record<string, AoiMachineDataset> = {
  'AOI-01': {
    machineId: 'AOI-01',
    name: 'AOI Unit 01 (Line 1)',
    line: 'Line 1',
    lineDesc: 'Top Fill & Pre-Pack',
    operatorId: 'E8291',
    runningModel: 'Multi-Model (5 Models Alternating)',
    modelDesc: 'All 5 PCB Models in Shift Rotation',
    pcbRev: 'Rev 3.4B / 2.1A / 1.9C',
    packageType: 'FCBGA / QFN / CSP / BGA-676',
    status: 'ONLINE (HOURLY SYNC)',
    targetUph: 1150,
    topCameraSpec: 'Koh Young Zenith 3D 12MP Telecentric',
    bottomCameraSpec: 'Keyence Dual-Coaxial 5.0MP Ultra-Fast',
    exposureTimeMs: 1.6,
    hourlyData: DEFAULT_HOURLY_SLOTS_AOI_1
  },
  'AOI-02': {
    machineId: 'AOI-02',
    name: 'AOI Unit 02 (Line 2)',
    line: 'Line 2',
    lineDesc: 'Top Fill & Vacuum A',
    operatorId: 'E6402',
    runningModel: 'Multi-Model (5 Models Alternating)',
    modelDesc: 'All 5 PCB Models in Shift Rotation',
    pcbRev: 'Rev 2.1A / 1.9C / 4.0A',
    packageType: 'QFN-64 / High-Power FETs / BGA',
    status: 'ONLINE (HOURLY SYNC)',
    targetUph: 950,
    topCameraSpec: 'Koh Young Zenith 3D 12MP Telecentric',
    bottomCameraSpec: 'Keyence Dual-Coaxial 5.0MP Ultra-Fast',
    exposureTimeMs: 2.2,
    hourlyData: DEFAULT_HOURLY_SLOTS_AOI_1.map((s, i) => {
      const modModel = ROTATION_MODELS[(Math.floor(i / 2) + 1) % ROTATION_MODELS.length];
      const modActual = i === 5 ? 710 : Math.round(s.actualIn * 0.78 + (i % 3) * 15);
      const modGood = Math.round(modActual * 0.992);
      const modNg = modActual - modGood;
      const topIn = Math.floor(modActual / 2);
      const btmIn = modActual - topIn;
      const topNg = Math.floor(modNg / 2);
      const btmNg = modNg - topNg;
      const topGood = topIn - topNg;
      const btmGood = btmIn - btmNg;

      return {
        ...s,
        runningModel: modModel,
        targetUph: 950,
        actualIn: modActual,
        goodCount: modGood,
        ngCount: modNg,
        yieldPercent: Number(((modGood / modActual) * 100).toFixed(2)),
        cycleTimeSec: Number((2.10 + (i % 3) * 0.04).toFixed(2)),
        topInspected: topIn,
        topGood: topGood,
        topNg: topNg,
        topYield: Number(((topGood / topIn) * 100).toFixed(2)),
        bottomInspected: btmIn,
        bottomGood: btmGood,
        bottomNg: btmNg,
        bottomYield: Number(((btmGood / btmIn) * 100).toFixed(2))
      };
    })
  }
};

export const PackOutCountView: React.FC = () => {
  const { t } = useLanguage();
  const { selectedMachineId, setSelectedMachineId } = useFactory();

  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('ALL');
  const [selectedMachineKey, setSelectedMachineKey] = useState<string>(() => {
    if (selectedMachineId && ['AOI-01', 'AOI-02'].includes(selectedMachineId)) {
      return selectedMachineId;
    }
    return 'AOI-01';
  });
  const [selectedHourFilter, setSelectedHourFilter] = useState<string>('ALL');
  const [selectedOperator, setSelectedOperator] = useState<string>('All');
  const [selectedLot, setSelectedLot] = useState<string>('All');
  const [selectedRack, setSelectedRack] = useState<string>('All');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [inspectionPopup, setInspectionPopup] = useState<InspectionPopupPayload | null>(null);

  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => {
    if (selectedMachineId === 'ALL') return 'ALL';
    if (selectedMachineId && ['AOI-01', 'AOI-02'].includes(selectedMachineId)) {
      return selectedMachineId;
    }
    return 'ALL';
  });

  // Sync selected machine from FactoryContext
  useEffect(() => {
    if (selectedMachineId === 'ALL') {
      setSelectedUnitId('ALL');
      setSelectedModelFilter('ALL');
    } else if (selectedMachineId && ['AOI-01', 'AOI-02'].includes(selectedMachineId)) {
      setSelectedMachineKey(selectedMachineId);
      setSelectedUnitId(selectedMachineId);
    } else if (selectedMachineId && (selectedMachineId.toUpperCase().includes('AOI') || selectedMachineId.toUpperCase().includes('PACK'))) {
      const normalized = normalizeAoiMachineId(selectedMachineId);
      setSelectedMachineKey(normalized);
      setSelectedUnitId(normalized);
    }
  }, [selectedMachineId]);

  const handleUnitSelect = (id: string) => {
    setSelectedUnitId(id);
    if (id !== 'ALL') {
      setSelectedMachineKey(id);
      setSelectedMachineId(id);
    }
  };

  const handleMachineSelect = (mId: string) => {
    setSelectedMachineKey(mId);
    setSelectedMachineId(mId);
    setSelectedUnitId(mId);
  };

  // Per-model datasets saved in localStorage
  const [modelFleets, setModelFleets] = useState<Record<string, Record<string, AoiMachineDataset>>>(() => {
    const baseInitial: Record<string, Record<string, AoiMachineDataset>> = {};
    AVAILABLE_AOI_MODELS.forEach((m) => {
      baseInitial[m.id] = generateModelHourlyFleet(m.id);
    });

    try {
      const saved = localStorage.getItem(STORAGE_AOI_HOURLY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const merged: Record<string, Record<string, AoiMachineDataset>> = { ...baseInitial };
          Object.keys(baseInitial).forEach((modelId) => {
            const validKeys = Object.keys(baseInitial[modelId]);
            const cleaned: Record<string, AoiMachineDataset> = {};
            validKeys.forEach((k) => {
              cleaned[k] = parsed[modelId]?.[k] || baseInitial[modelId][k];
            });
            merged[modelId] = cleaned;
          });
          return merged;
        }
      }
    } catch (e) {}

    return baseInitial;
  });

  // Current fleet for the active selected model (aggregates all models if 'ALL' is selected)
  const fleet = useMemo(() => {
    if (selectedModelFilter === 'ALL') {
      const machineIds = ['AOI-01', 'AOI-02'];
      const aggregatedFleet: Record<string, AoiMachineDataset> = {};

      machineIds.forEach((mId) => {
        const firstModelId = AVAILABLE_AOI_MODELS[0]?.id || '504-2187';
        const baseMachine = modelFleets[firstModelId]?.[mId] || generateModelHourlyFleet(firstModelId)[mId];
        const numSlots = baseMachine.hourlyData.length;
        const hourlySlots: AoiHourlySlot[] = [];

        for (let sIdx = 0; sIdx < numSlots; sIdx++) {
          const baseSlot = baseMachine.hourlyData[sIdx];
          let totalActualIn = 0;
          let totalGood = 0;
          let totalNg = 0;
          let totalTopIn = 0;
          let totalTopGood = 0;
          let totalTopNg = 0;
          let totalBtmIn = 0;
          let totalBtmGood = 0;
          let totalBtmNg = 0;
          let totalTombstone = 0;
          let totalBridge = 0;
          let totalMissing = 0;
          let totalOffset = 0;
          let totalPolarity = 0;

          AVAILABLE_AOI_MODELS.forEach((m) => {
            const mMachine = modelFleets[m.id]?.[mId];
            const slot = mMachine?.hourlyData[sIdx];
            if (slot) {
              totalActualIn += slot.actualIn || 0;
              totalGood += slot.goodCount || 0;
              totalNg += slot.ngCount || 0;
              totalTopIn += slot.topInspected || 0;
              totalTopGood += slot.topGood || 0;
              totalTopNg += slot.topNg || 0;
              totalBtmIn += slot.bottomInspected || 0;
              totalBtmGood += slot.bottomGood || 0;
              totalBtmNg += slot.bottomNg || 0;
              if (slot.defects) {
                totalTombstone += slot.defects.tombstone || 0;
                totalBridge += slot.defects.solderBridge || 0;
                totalMissing += slot.defects.missingComp || 0;
                totalOffset += slot.defects.offsetShift || 0;
                totalPolarity += slot.defects.polarityRev || 0;
              }
            }
          });

          const yld = totalActualIn > 0 ? Number(((totalGood / totalActualIn) * 100).toFixed(2)) : 99.5;
          const topYld = totalTopIn > 0 ? Number(((totalTopGood / totalTopIn) * 100).toFixed(2)) : 99.5;
          const btmYld = totalBtmIn > 0 ? Number(((totalBtmGood / totalBtmIn) * 100).toFixed(2)) : 99.5;

          hourlySlots.push({
            ...baseSlot,
            runningModel: 'ALL MODELS',
            targetUph: baseSlot.targetUph * AVAILABLE_AOI_MODELS.length,
            actualIn: totalActualIn,
            goodCount: totalGood,
            ngCount: totalNg,
            yieldPercent: yld,
            topInspected: totalTopIn,
            topGood: totalTopGood,
            topNg: totalTopNg,
            topYield: topYld,
            bottomInspected: totalBtmIn,
            bottomGood: totalBtmGood,
            bottomNg: totalBtmNg,
            bottomYield: btmYld,
            defects: {
              tombstone: totalTombstone,
              solderBridge: totalBridge,
              missingComp: totalMissing,
              offsetShift: totalOffset,
              polarityRev: totalPolarity
            }
          });
        }

        aggregatedFleet[mId] = {
          ...baseMachine,
          runningModel: 'ALL MODELS',
          targetUph: baseMachine.targetUph * AVAILABLE_AOI_MODELS.length,
          hourlyData: hourlySlots
        };
      });

      return aggregatedFleet;
    }
    return modelFleets[selectedModelFilter] || generateModelHourlyFleet(selectedModelFilter);
  }, [modelFleets, selectedModelFilter]);

  // All 6 machines for the selected model
  const fleetList = useMemo(() => Object.values(fleet) as AoiMachineDataset[], [fleet]);

  // Convert fleetList into standard OvenUnit[] format for OvenFleetCombinedChart
  const aoiUnits: OvenUnit[] = useMemo(() => {
    return fleetList.map((m, idx) => {
      const totalIn = m.hourlyData.reduce((sum, h) => sum + h.actualIn, 0);
      const totalGood = m.hourlyData.reduce((sum, h) => sum + h.goodCount, 0);
      const yieldPct = totalIn > 0 ? Number(((totalGood / totalIn) * 100).toFixed(1)) : 99.5;
      const isOnline = m.status ? m.status.includes('ONLINE') : true;
      const isUnit2 = idx === 1 || m.machineId === 'AOI-02';
      return {
        id: m.machineId,
        name: `AOI Unit 0${idx + 1}`,
        subType: 'AOI' as const,
        status: (isOnline ? 'RUNNING' : 'STOP') as OvenUnit['status'],
        chamberLabel: `${m.line} • ${m.lineDesc}`,
        operatorId: `Staff ID: ${m.operatorId}`,
        magazinesCount: Math.round(totalGood / 60) || (isUnit2 ? 156 : 208),
        pcsCount: totalGood || (isUnit2 ? 9350 : 12450),
        runningModel: selectedModelFilter === 'ALL' ? 'All Models' : `Model ${m.runningModel}`,
        program: `AOI-OPT-3D-P${idx + 1}`,
        tempCelsius: 24.5 + idx * 0.4,
        targetTempMin: 22.0,
        targetTempMax: 26.0,
        pressurePa: 101.3,
        remainingSeconds: 0,
        uph: m.hourlyData[m.hourlyData.length - 1]?.actualIn || (isUnit2 ? 890 : 1180),
        targetUph: m.targetUph || (isUnit2 ? 950 : 1150),
        inputCount: totalIn || (isUnit2 ? 9420 : 12500),
        outputCount: totalGood || (isUnit2 ? 9350 : 12450),
        oeePercent: yieldPct,
        yieldPercent: yieldPct
      };
    });
  }, [fleetList, selectedModelFilter]);

  // Active Machine (selected unit or AOI-01)
  const activeMachine = (selectedUnitId !== 'ALL' ? fleet[selectedUnitId] : null) || fleet[selectedMachineKey] || fleetList[0] || fleet['AOI-01'];

  const activeAoiOvenUnit = useMemo(() => {
    return aoiUnits.find((u) => u.id === selectedUnitId) || aoiUnits[0];
  }, [aoiUnits, selectedUnitId]);

  // All fleet total production counts across all AOI units
  const allFleetTotalGood = useMemo(() => {
    return fleetList.reduce((sum, m) => sum + m.hourlyData.reduce((hSum, h) => hSum + h.goodCount, 0), 0);
  }, [fleetList]);

  const allFleetTotalIn = useMemo(() => {
    return fleetList.reduce((sum, m) => sum + m.hourlyData.reduce((hSum, h) => hSum + h.actualIn, 0), 0);
  }, [fleetList]);

  // Current active model metadata
  const activeModelMeta = useMemo(() => {
    if (selectedModelFilter === 'ALL') {
      return {
        id: 'ALL',
        name: 'All Models',
        title: 'All Active Production Models',
        desc: 'Fleet Total Production Across All 5 Models (504-2187, 504-2268, 504-2154, 504-2224, 504-2454)',
        rev: 'Fleet-wide',
        packageType: 'Mixed Multi-Chip Modules',
        productionRun: 'All Active Runs (Full Fleet)',
        lotNumber: 'ALL ACTIVE LOTS',
        targetYield: 99.5
      };
    }
    return AVAILABLE_AOI_MODELS.find((m) => m.id === selectedModelFilter) || AVAILABLE_AOI_MODELS[0];
  }, [selectedModelFilter]);

  // Handle model filter selection
  const handleModelSelect = (modelId: string) => {
    setSelectedModelFilter(modelId);
  };

  // Toggle machine RUNNING / STOP status (consistent with Vacuum chamber control)
  const handleToggleMachineStatus = (machineId: string) => {
    setModelFleets((prev) => {
      const targetModelKey = selectedModelFilter === 'ALL' ? AVAILABLE_AOI_MODELS[0].id : selectedModelFilter;
      const curFleet = prev[targetModelKey] || fleet;
      const curMachine = curFleet[machineId];
      if (!curMachine) return prev;
      const isOnline = curMachine.status ? curMachine.status.includes('ONLINE') : true;
      const updatedMachine: AoiMachineDataset = {
        ...curMachine,
        status: isOnline ? 'STANDBY' : 'ONLINE (HOURLY SYNC)'
      };
      const updated = {
        ...prev,
        [targetModelKey]: {
          ...curFleet,
          [machineId]: updatedMachine
        }
      };
      try {
        localStorage.setItem(STORAGE_AOI_HOURLY_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Save changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AOI_HOURLY_KEY, JSON.stringify(modelFleets));
    } catch (e) {}
  }, [modelFleets]);

  // Active machine slots for the selected model
  const activeMachineFilteredSlots = useMemo(() => {
    return activeMachine.hourlyData;
  }, [activeMachine]);

  // Aggregated Shift Totals for Active Machine
  const shiftSummary = useMemo(() => {
    const slots = activeMachineFilteredSlots;
    const totalIn = slots.reduce((sum, s) => sum + s.actualIn, 0);
    const totalGood = slots.reduce((sum, s) => sum + s.goodCount, 0);
    const totalNg = slots.reduce((sum, s) => sum + s.ngCount, 0);
    const avgYield = totalIn > 0 ? Number(((totalGood / totalIn) * 100).toFixed(2)) : 0;
    const avgCycle = Number((slots.reduce((sum, s) => sum + s.cycleTimeSec, 0) / (slots.length || 1)).toFixed(2));
    
    // Top Side Aggregation
    const totalTopIn = slots.reduce((sum, s) => sum + s.topInspected, 0);
    const totalTopGood = slots.reduce((sum, s) => sum + s.topGood, 0);
    const totalTopNg = slots.reduce((sum, s) => sum + s.topNg, 0);
    const avgTopYield = totalTopIn > 0 ? Number(((totalTopGood / totalTopIn) * 100).toFixed(2)) : 0;

    // Bottom Side Aggregation
    const totalBtmIn = slots.reduce((sum, s) => sum + s.bottomInspected, 0);
    const totalBtmGood = slots.reduce((sum, s) => sum + s.bottomGood, 0);
    const totalBtmNg = slots.reduce((sum, s) => sum + s.bottomNg, 0);
    const avgBtmYield = totalBtmIn > 0 ? Number(((totalBtmGood / totalBtmIn) * 100).toFixed(2)) : 0;

    // Defects
    const totalTombstone = slots.reduce((sum, s) => sum + s.defects.tombstone, 0);
    const totalBridge = slots.reduce((sum, s) => sum + s.defects.solderBridge, 0);
    const totalMissing = slots.reduce((sum, s) => sum + s.defects.missingComp, 0);
    const totalOffset = slots.reduce((sum, s) => sum + s.defects.offsetShift, 0);
    const totalPolarity = slots.reduce((sum, s) => sum + s.defects.polarityRev, 0);

    return {
      totalIn,
      totalGood,
      totalNg,
      avgYield,
      avgCycle,
      totalTopIn,
      totalTopGood,
      totalTopNg,
      avgTopYield,
      totalBtmIn,
      totalBtmGood,
      totalBtmNg,
      avgBtmYield,
      totalTombstone,
      totalBridge,
      totalMissing,
      totalOffset,
      totalPolarity,
      slotsCount: slots.length
    };
  }, [activeMachineFilteredSlots]);

  // Min and Max throughput across active machine slots for color gradient scaling
  const { minThroughput, maxThroughput } = useMemo(() => {
    const values = activeMachine.hourlyData.map((d) => d.actualIn);
    return {
      minThroughput: Math.min(...values),
      maxThroughput: Math.max(...values)
    };
  }, [activeMachine]);

  // Active slot for detailed view
  const activeSlot = useMemo(() => {
    if (selectedHourFilter === 'ALL') {
      return activeMachineFilteredSlots[activeMachineFilteredSlots.length - 1] || activeMachine.hourlyData[activeMachine.hourlyData.length - 1];
    }
    return (
      activeMachine.hourlyData.find((s) => s.hourShort === selectedHourFilter) ||
      activeMachine.hourlyData[0]
    );
  }, [activeMachine, activeMachineFilteredSlots, selectedHourFilter]);

  // Handle slot update
  const handleUpdateSlot = (idx: number, updatedSlot: Partial<AoiHourlySlot>) => {
    setModelFleets((prev) => {
      const targetModelKey = selectedModelFilter === 'ALL' ? AVAILABLE_AOI_MODELS[0].id : selectedModelFilter;
      const curFleet = prev[targetModelKey] || generateModelHourlyFleet(targetModelKey);
      const curMachine = curFleet[selectedMachineKey] || curFleet['AOI-01'];
      const newSlots = [...curMachine.hourlyData];
      const target = { ...newSlots[idx], ...updatedSlot };
      
      // Sync totals if top/bottom changed
      if (updatedSlot.topGood !== undefined || updatedSlot.topNg !== undefined || updatedSlot.bottomGood !== undefined || updatedSlot.bottomNg !== undefined) {
        target.topInspected = target.topGood + target.topNg;
        target.bottomInspected = target.bottomGood + target.bottomNg;
        target.topYield = target.topInspected > 0 ? Number(((target.topGood / target.topInspected) * 100).toFixed(2)) : 100;
        target.bottomYield = target.bottomInspected > 0 ? Number(((target.bottomGood / target.bottomInspected) * 100).toFixed(2)) : 100;

        target.goodCount = target.topGood + target.bottomGood;
        target.ngCount = target.topNg + target.bottomNg;
        target.actualIn = target.goodCount + target.ngCount;
        target.yieldPercent = target.actualIn > 0 ? Number(((target.goodCount / target.actualIn) * 100).toFixed(2)) : 100;
      } else if (target.actualIn > 0) {
        target.yieldPercent = Number(((target.goodCount / target.actualIn) * 100).toFixed(2));
      }
      newSlots[idx] = target;

      const updatedMachine = {
        ...curMachine,
        hourlyData: newSlots
      };

      const updatedFleet = {
        ...curFleet,
        [selectedMachineKey]: updatedMachine
      };

      return {
        ...prev,
        [targetModelKey]: updatedFleet
      };
    });
  };

  // Reset to default
  const handleResetDefaults = () => {
    const initial: Record<string, Record<string, AoiMachineDataset>> = {};
    AVAILABLE_AOI_MODELS.forEach((m) => {
      initial[m.id] = generateModelHourlyFleet(m.id);
    });
    setModelFleets(initial);
    localStorage.removeItem(STORAGE_AOI_HOURLY_KEY);
  };

  // Export CSV of hourly slots
  const handleExportCsv = () => {
    const rows = [
      ['Hour Slot', 'Running Model', 'Target UPH', 'Actual In', 'Total Good', 'Total NG', 'Yield %', 'Top In', 'Top Good', 'Top NG', 'Top Yield %', 'Btm In', 'Btm Good', 'Btm NG', 'Btm Yield %', 'Cycle (s)'],
      ...activeMachine.hourlyData.map((s) => [
        s.hour,
        s.runningModel,
        s.targetUph.toString(),
        s.actualIn.toString(),
        s.goodCount.toString(),
        s.ngCount.toString(),
        s.yieldPercent.toString() + '%',
        s.topInspected.toString(),
        s.topGood.toString(),
        s.topNg.toString(),
        s.topYield.toString() + '%',
        s.bottomInspected.toString(),
        s.bottomGood.toString(),
        s.bottomNg.toString(),
        s.bottomYield.toString() + '%',
        s.cycleTimeSec.toString()
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AOI_${activeMachine.machineId}_Model_${selectedModelFilter}_Hourly_Records.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for computing bar color: Green for passing/meeting target (>= target), Yellow for below target (< target)
  const getBarColor = (actualIn: number, target: number = activeMachine.targetUph || 1100) => {
    if (actualIn >= target) return '#4db6ac'; // Green (#4db6ac)
    return '#fff176'; // Yellow (#fff176)
  };

  return (
    <div className="w-full pb-16 font-sans">
      <Header
        title={selectedUnitId === 'ALL' ? "AOI Machine Monitoring" : `${activeMachine.name} Telemetry Window`}
        subtitle="Automated Optical Inspection Fleet — Dedicated 3-4 Day Model Production Runs & Hourly Records"
        badge={
          <span className="text-[11px] font-mono font-bold text-sky-950 bg-[#b3e5fc] border border-sky-300 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>
            PROCESS • {selectedUnitId === 'ALL' ? '2 AOI MACHINES ONLINE (AOI-01 & AOI-02)' : `AOI ${activeMachine.machineId} ONLINE`}
          </span>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Unified Standard Analytics Control Strip & Breakdown */}
        <MachineAnalyticsControlBar
          totalOutput={selectedUnitId === 'ALL' ? allFleetTotalGood : shiftSummary.totalGood}
          outputUnit="boards"
          activeHours={(activeMachine?.hourlyData || []).filter((s) => s.actualIn > 0).length || 8}
          peakHourLabel="02 SEPT 15:00"
          peakHourValue={
            selectedUnitId === 'ALL'
              ? Math.round((allFleetTotalGood / 8) * 1.25)
              : activeMachine?.hourlyData && activeMachine.hourlyData.length > 0
                ? Math.max(...activeMachine.hourlyData.map((s) => s.goodCount), 120)
                : 120
          }
          avgPerActiveHour={Math.round(
            (selectedUnitId === 'ALL' ? allFleetTotalGood : shiftSummary.totalGood) /
              Math.max(1, (activeMachine?.hourlyData || []).filter((s) => s.actualIn > 0).length || 8)
          )}
          lines={['All AOI Fleet', ...fleetList.map((m) => `${m.line} (${m.machineId})`)]}
          selectedLine={selectedUnitId === 'ALL' ? 'All AOI Fleet' : `${activeMachine.line} (${activeMachine.machineId})`}
          onLineChange={(l) => {
            if (l === 'All AOI Fleet' || l === 'All') {
              handleUnitSelect('ALL');
            } else {
              const found = fleetList.find((m) => l.includes(m.machineId));
              if (found) handleUnitSelect(found.machineId);
            }
          }}
          products={['All', ...AVAILABLE_AOI_MODELS.map((m) => `${m.id} - ${m.title}`)]}
          selectedProduct={selectedModelFilter === 'ALL' ? 'All' : `${activeModelMeta.id} - ${activeModelMeta.title}`}
          onProductChange={(p) => {
            if (p === 'All' || p === 'All Models' || p.startsWith('All')) {
              handleModelSelect('ALL');
            } else {
              const found = AVAILABLE_AOI_MODELS.find((m) => p.includes(m.id));
              if (found) handleModelSelect(found.id);
            }
          }}
          selectedOperator={selectedOperator}
          onOperatorChange={setSelectedOperator}
          selectedLot={selectedLot}
          onLotChange={setSelectedLot}
          selectedRack={selectedRack}
          onRackChange={setSelectedRack}
          breakdownData={{
            Line: fleetList.map((m) => ({
              name: `${m.line} (${m.machineId})`,
              count: m.hourlyData.reduce((sum, h) => sum + h.goodCount, 0)
            })),
            Product: AVAILABLE_AOI_MODELS.map((m) => {
              const count = selectedModelFilter === 'ALL'
                ? Object.values(modelFleets[m.id] || {}).reduce((acc, machine) => acc + machine.hourlyData.reduce((hSum, h) => hSum + h.goodCount, 0), 0)
                : (m.id === activeModelMeta.id ? shiftSummary.totalGood : Math.round(shiftSummary.totalGood * 0.35));
              return {
                name: `${m.name} (${m.title})`,
                count
              };
            }),
            Operator: [
              { name: `${activeMachine.operatorId} (Lead Tech)`, count: Math.round(shiftSummary.totalGood * 0.65) },
              { name: 'OP-AOI-02 (Shift 2)', count: Math.round(shiftSummary.totalGood * 0.35) },
            ],
            Lot: [
              { name: 'LOT-2026-09A', count: Math.round(shiftSummary.totalGood * 0.50) },
              { name: 'LOT-2026-09B', count: Math.round(shiftSummary.totalGood * 0.35) },
              { name: 'LOT-2026-08F', count: Math.round(shiftSummary.totalGood * 0.15) },
            ],
            Rack: [
              { name: 'Rack R-01 (Infeed Top)', count: Math.round(shiftSummary.totalGood * 0.42) },
              { name: 'Rack R-02 (Infeed Bottom)', count: Math.round(shiftSummary.totalGood * 0.38) },
              { name: 'Rack R-03 (Re-inspection)', count: Math.round(shiftSummary.totalGood * 0.20) },
            ]
          }}
          extraActions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-1.5 bg-white hover:bg-sky-100/60 text-sky-900 border border-sky-300 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                <span>Edit Hourly Data</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          }
        />

        {/* Machine Quick Switcher Tabs (Consistent with Vacuum & Bake) */}
        <div className="flex items-center justify-between gap-3 bg-sky-50/70 p-2.5 rounded-2xl border border-sky-200">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <span className="text-xs font-mono font-bold text-sky-950 shrink-0">Active View:</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleUnitSelect('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedUnitId === 'ALL'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-sky-100/60 border border-sky-200'
                }`}
              >
                Combined (2 Machines)
              </button>
              {aoiUnits.map((u, idx) => (
                <button
                  key={u.id}
                  onClick={() => handleUnitSelect(u.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    selectedUnitId === u.id
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-sky-100/60 border border-sky-200'
                  }`}
                >
                  <span>{u.name} (Line 0{idx + 1})</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'RUNNING' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                </button>
              ))}
            </div>
          </div>
          {selectedUnitId !== 'ALL' && (
            <button
              onClick={() => handleUnitSelect('ALL')}
              className="text-[11px] font-mono text-sky-900 font-bold bg-white px-3 py-1.5 rounded-lg border border-sky-200 hover:bg-sky-100 cursor-pointer shrink-0 shadow-2xs flex items-center gap-1"
            >
              <span>← Back to Combined (Both Machines)</span>
            </button>
          )}
        </div>

        {/* STANDARDIZED ALL FLEET OR SINGLE MACHINE VIEW (MATCHING DISPENSING, BAKE, VACUUM) */}
        {selectedUnitId === 'ALL' ? (
          <div className="space-y-6">
            <ThermalAllFleetChart
              processType="AOI"
              units={aoiUnits}
              selectedUnitId={selectedUnitId}
              onSelectUnit={(id) => handleUnitSelect(id)}
              onBackToFleet={() => handleUnitSelect('ALL')}
            />

            {/* Individual Machine Mini Overview Windows (Matching Vacuum & Bake) */}
            <InspectionMachinesOverviewSection
              processType="AOI"
              units={aoiUnits}
              selectedUnitId={selectedUnitId}
              onSelectUnit={(id) => handleUnitSelect(id)}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <ThermalSingleMachineChart
              processType="AOI"
              unit={activeAoiOvenUnit}
              allUnits={aoiUnits}
              onSelectUnit={(id) => handleUnitSelect(id)}
              onBackToFleet={() => handleUnitSelect('ALL')}
              onToggleStatus={(id, st) => handleToggleMachineStatus(id)}
            />

            {/* DEFECT PARETO & SENSOR STATUS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Defect Distribution */}
                <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-4">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Defect Distribution (Pareto) &amp; Side Split
                  </h5>

                  {/* Side Split Summary (Top Side NG vs Bot Side NG) */}
                  <div className="mb-3 p-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                    <div className="flex justify-between items-center text-[11px] font-mono mb-1.5">
                      <span className="flex items-center gap-1.5 text-blue-800 font-bold">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Top Side NG: {shiftSummary.totalTopNg} pcs
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-800 font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Bot Side NG: {shiftSummary.totalBtmNg} pcs
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${(shiftSummary.totalTopNg / Math.max(1, shiftSummary.totalNg)) * 100}%` }}
                        title={`Top Side NG: ${shiftSummary.totalTopNg} pcs`}
                      />
                      <div
                        className="h-full bg-amber-500 transition-all"
                        style={{ width: `${(shiftSummary.totalBtmNg / Math.max(1, shiftSummary.totalNg)) * 100}%` }}
                        title={`Bot Side NG: ${shiftSummary.totalBtmNg} pcs`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-600">Tombstone Shift</span>
                        <span className="font-bold text-slate-900">{shiftSummary.totalTombstone} pcs</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-600 rounded-full" style={{ width: `${(shiftSummary.totalTombstone / (shiftSummary.totalNg || 1)) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-600">Solder Bridge</span>
                        <span className="font-bold text-slate-900">{shiftSummary.totalBridge} pcs</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(shiftSummary.totalBridge / (shiftSummary.totalNg || 1)) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-600">Missing Component</span>
                        <span className="font-bold text-slate-900">{shiftSummary.totalMissing} pcs</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-400 rounded-full" style={{ width: `${(shiftSummary.totalMissing / (shiftSummary.totalNg || 1)) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-600">Component Offset</span>
                        <span className="font-bold text-slate-900">{shiftSummary.totalOffset} pcs</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(shiftSummary.totalOffset / (shiftSummary.totalNg || 1)) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-600">Polarity Reversed</span>
                        <span className="font-bold text-slate-900">{shiftSummary.totalPolarity} pcs</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(shiftSummary.totalPolarity / (shiftSummary.totalNg || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Camera & Inspection Specs */}
                <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                      <ScanLine className="w-3.5 h-3.5 text-sky-600" />
                      Optical Cameras & Telecentric Specs
                    </h5>
                    <div className="space-y-2 text-xs font-mono text-slate-600">
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span>Top 3D Sensor:</span>
                        <strong className="text-slate-900">{activeMachine.topCameraSpec}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span>Bottom Fast Sensor:</span>
                        <strong className="text-slate-900">{activeMachine.bottomCameraSpec}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span>Exposure Time:</span>
                        <strong className="text-slate-900">{activeMachine.exposureTimeMs} ms</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Running PCB Package:</span>
                        <strong className="text-slate-900">{activeMachine.packageType || 'FCBGA-676 / High-Density'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Inspection Standard: <strong>IPC-A-610 Class 3</strong></span>
                    <span className="text-emerald-700 font-bold">100% Dual-Side Passed</span>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* FULL HOURLY AOI DATA TABLE - Displayed when a machine is selected */}
        {selectedUnitId !== 'ALL' && activeMachine && (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                Hourly AOI Inspection Records ({activeMachine.machineId} — Multi-Model Shift Log)
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Comprehensive hourly inspection log (07:00 - 18:00) with running model badge and Top/Bottom Side breakdown
              </p>
            </div>

            <button
              onClick={() => setShowEditModal(true)}
              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-600" />
              <span>Modify Hourly Slot Table</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 font-bold">Hour Slot</th>
                  <th className="p-2.5 font-bold">Model</th>
                  <th className="p-2.5 font-bold text-right">Target</th>
                  <th className="p-2.5 font-bold text-right">Inspected</th>
                  <th className="p-2.5 font-bold text-right text-emerald-700">Good</th>
                  <th className="p-2.5 font-bold text-right text-rose-700" title="Total NG (Top + Bot Side)">NG (Top/Bot)</th>
                  <th className="p-2.5 font-bold text-right text-blue-800">Top Side (Good/NG)</th>
                  <th className="p-2.5 font-bold text-right text-amber-800">Bot Side (Good/NG)</th>
                  <th className="p-2.5 font-bold text-right">Yield %</th>
                  <th className="p-2.5 font-bold text-right">Cycle (s)</th>
                  <th className="p-2.5 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeMachineFilteredSlots.map((slot) => {
                  const badge = getModelBadge(slot.runningModel);
                  return (
                    <tr
                      key={slot.hour}
                      onClick={() => setSelectedHourFilter(slot.hourShort)}
                      className={`transition-colors cursor-pointer ${
                        selectedHourFilter === slot.hourShort
                          ? 'bg-sky-50/90 font-bold'
                          : 'hover:bg-sky-50/50'
                      }`}
                    >
                      <td className="p-2.5 text-slate-900 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-sky-500 opacity-70" />
                        {slot.hour}
                      </td>
                      <td className="p-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10.5px] border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {slot.runningModel}
                        </span>
                      </td>
                      <td className="p-2.5 text-right text-slate-500">{slot.targetUph}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{slot.actualIn}</td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectionPopup({
                              stationName: activeMachine.machineId,
                              stationType: 'AOI',
                              hourSlot: slot.hour,
                              jobNo: `JOB-${slot.runningModel}-${slot.hourShort.replace(':', '')}`,
                              product: slot.runningModel,
                              side: 'TOP/BOT',
                              category: 'GOOD',
                              count: slot.goodCount
                            });
                          }}
                          className="font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/70 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view Good units (JOB NO, PRODUCT, SIDE, Details)"
                        >
                          {slot.goodCount}
                        </button>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectionPopup({
                              stationName: activeMachine.machineId,
                              stationType: 'AOI',
                              hourSlot: slot.hour,
                              jobNo: `JOB-${slot.runningModel}-${slot.hourShort.replace(':', '')}`,
                              product: slot.runningModel,
                              side: 'TOP/BOT',
                              category: 'NG',
                              count: slot.ngCount
                            });
                          }}
                          className="font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-100/70 px-1.5 py-0.5 rounded cursor-pointer transition-colors inline-flex items-center gap-1"
                          title="Click to view all NG units (Top & Bot Side)"
                        >
                          <span>{slot.ngCount}</span>
                          <span className="text-[9.5px] font-normal text-slate-400">
                            ({slot.topNg}T/{slot.bottomNg}B)
                          </span>
                        </button>
                      </td>
                      <td className="p-2.5 text-right text-blue-800">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectionPopup({
                              stationName: activeMachine.machineId,
                              stationType: 'AOI',
                              hourSlot: slot.hour,
                              jobNo: `JOB-${slot.runningModel}-${slot.hourShort.replace(':', '')}`,
                              product: slot.runningModel,
                              side: 'TOP',
                              category: 'GOOD',
                              count: slot.topGood
                            });
                          }}
                          className="font-semibold hover:underline hover:bg-blue-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view Top Side Good units"
                        >
                          {slot.topGood}
                        </button>
                        <span className="text-slate-300 mx-0.5">/</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectionPopup({
                              stationName: activeMachine.machineId,
                              stationType: 'AOI',
                              hourSlot: slot.hour,
                              jobNo: `JOB-${slot.runningModel}-${slot.hourShort.replace(':', '')}`,
                              product: slot.runningModel,
                              side: 'TOP',
                              category: 'NG',
                              count: slot.topNg
                            });
                          }}
                          className="text-rose-600 font-semibold hover:underline hover:bg-rose-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view Top Side NG units"
                        >
                          {slot.topNg}
                        </button>
                        <span className="text-[10px] text-blue-600 ml-1">({slot.topYield}%)</span>
                      </td>
                      <td className="p-2.5 text-right text-amber-800">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectionPopup({
                              stationName: activeMachine.machineId,
                              stationType: 'AOI',
                              hourSlot: slot.hour,
                              jobNo: `JOB-${slot.runningModel}-${slot.hourShort.replace(':', '')}`,
                              product: slot.runningModel,
                              side: 'BOT',
                              category: 'GOOD',
                              count: slot.bottomGood
                            });
                          }}
                          className="font-semibold hover:underline hover:bg-amber-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view Bot Side Good units"
                        >
                          {slot.bottomGood}
                        </button>
                        <span className="text-slate-300 mx-0.5">/</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectionPopup({
                              stationName: activeMachine.machineId,
                              stationType: 'AOI',
                              hourSlot: slot.hour,
                              jobNo: `JOB-${slot.runningModel}-${slot.hourShort.replace(':', '')}`,
                              product: slot.runningModel,
                              side: 'BOT',
                              category: 'NG',
                              count: slot.bottomNg
                            });
                          }}
                          className="text-rose-600 font-bold hover:underline hover:bg-rose-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view Bot Side NG units (JOB NO, PRODUCT, SIDE, NG Defect Details)"
                        >
                          {slot.bottomNg}
                        </button>
                        <span className="text-[10px] text-amber-600 ml-1">({slot.bottomYield}%)</span>
                      </td>
                      <td className="p-2.5 text-right font-bold text-sky-950">{slot.yieldPercent}%</td>
                      <td className="p-2.5 text-right text-slate-600">{slot.cycleTimeSec}s</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            slot.yieldPercent >= 99.0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {slot.yieldPercent >= 99.0 ? 'NORMAL' : 'WATCH'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-200">
                <tr>
                  <td className="p-2.5" colSpan={2}>
                    {selectedModelFilter === 'ALL' ? 'SHIFT TOTAL' : `TOTAL FOR MODEL ${selectedModelFilter}`}
                  </td>
                  <td className="p-2.5 text-right">{activeMachine.targetUph * shiftSummary.slotsCount}</td>
                  <td className="p-2.5 text-right">{shiftSummary.totalIn}</td>
                  <td className="p-2.5 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setInspectionPopup({
                          stationName: activeMachine.machineId,
                          stationType: 'AOI',
                          hourSlot: 'Shift Total (07:00 - 18:00)',
                          jobNo: `JOB-${selectedModelFilter === 'ALL' ? 'ALL' : selectedModelFilter}-SHIFT`,
                          product: selectedModelFilter === 'ALL' ? 'Multi-Model' : selectedModelFilter,
                          side: 'TOP/BOT',
                          category: 'GOOD',
                          count: shiftSummary.totalGood
                        })
                      }
                      className="font-bold text-emerald-800 hover:underline hover:bg-emerald-200/60 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      title="Click to view all Good units for shift"
                    >
                      {shiftSummary.totalGood}
                    </button>
                  </td>
                  <td className="p-2.5 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setInspectionPopup({
                          stationName: activeMachine.machineId,
                          stationType: 'AOI',
                          hourSlot: 'Shift Total (07:00 - 18:00)',
                          jobNo: `JOB-${selectedModelFilter === 'ALL' ? 'ALL' : selectedModelFilter}-SHIFT`,
                          product: selectedModelFilter === 'ALL' ? 'Multi-Model' : selectedModelFilter,
                          side: 'TOP/BOT',
                          category: 'NG',
                          count: shiftSummary.totalNg
                        })
                      }
                      className="font-bold text-rose-800 hover:underline hover:bg-rose-200/60 px-1.5 py-0.5 rounded cursor-pointer transition-colors inline-flex items-center gap-1"
                      title="Click to view all NG units for shift (Top & Bot Side)"
                    >
                      <span>{shiftSummary.totalNg}</span>
                      <span className="text-[9.5px] font-normal text-slate-500">
                        ({shiftSummary.totalTopNg}T/{shiftSummary.totalBtmNg}B)
                      </span>
                    </button>
                  </td>
                  <td className="p-2.5 text-right text-blue-900">
                    <button
                      type="button"
                      onClick={() =>
                        setInspectionPopup({
                          stationName: activeMachine.machineId,
                          stationType: 'AOI',
                          hourSlot: 'Shift Total (07:00 - 18:00)',
                          jobNo: `JOB-${selectedModelFilter === 'ALL' ? 'ALL' : selectedModelFilter}-SHIFT`,
                          product: selectedModelFilter === 'ALL' ? 'Multi-Model' : selectedModelFilter,
                          side: 'TOP',
                          category: 'GOOD',
                          count: shiftSummary.totalTopGood
                        })
                      }
                      className="hover:underline hover:bg-blue-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                      title="Click to view Top Side Good units for shift"
                    >
                      {shiftSummary.totalTopGood}
                    </button>
                    <span className="text-slate-300 mx-0.5">/</span>
                    <button
                      type="button"
                      onClick={() =>
                        setInspectionPopup({
                          stationName: activeMachine.machineId,
                          stationType: 'AOI',
                          hourSlot: 'Shift Total (07:00 - 18:00)',
                          jobNo: `JOB-${selectedModelFilter === 'ALL' ? 'ALL' : selectedModelFilter}-SHIFT`,
                          product: selectedModelFilter === 'ALL' ? 'Multi-Model' : selectedModelFilter,
                          side: 'TOP',
                          category: 'NG',
                          count: shiftSummary.totalTopNg
                        })
                      }
                      className="text-rose-700 hover:underline hover:bg-rose-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                      title="Click to view Top Side NG units for shift"
                    >
                      {shiftSummary.totalTopNg}
                    </button>
                    <span className="text-[10px] text-blue-800 ml-1">({shiftSummary.avgTopYield}%)</span>
                  </td>
                  <td className="p-2.5 text-right text-amber-900">
                    <button
                      type="button"
                      onClick={() =>
                        setInspectionPopup({
                          stationName: activeMachine.machineId,
                          stationType: 'AOI',
                          hourSlot: 'Shift Total (07:00 - 18:00)',
                          jobNo: `JOB-${selectedModelFilter === 'ALL' ? 'ALL' : selectedModelFilter}-SHIFT`,
                          product: selectedModelFilter === 'ALL' ? 'Multi-Model' : selectedModelFilter,
                          side: 'BOT',
                          category: 'GOOD',
                          count: shiftSummary.totalBtmGood
                        })
                      }
                      className="hover:underline hover:bg-amber-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                      title="Click to view Bot Side Good units for shift"
                    >
                      {shiftSummary.totalBtmGood}
                    </button>
                    <span className="text-slate-300 mx-0.5">/</span>
                    <button
                      type="button"
                      onClick={() =>
                        setInspectionPopup({
                          stationName: activeMachine.machineId,
                          stationType: 'AOI',
                          hourSlot: 'Shift Total (07:00 - 18:00)',
                          jobNo: `JOB-${selectedModelFilter === 'ALL' ? 'ALL' : selectedModelFilter}-SHIFT`,
                          product: selectedModelFilter === 'ALL' ? 'Multi-Model' : selectedModelFilter,
                          side: 'BOT',
                          category: 'NG',
                          count: shiftSummary.totalBtmNg
                        })
                      }
                      className="text-rose-700 hover:underline hover:bg-rose-100/60 px-1 py-0.5 rounded cursor-pointer transition-colors"
                      title="Click to view Bot Side NG units for shift"
                    >
                      {shiftSummary.totalBtmNg}
                    </button>
                    <span className="text-[10px] text-amber-800 ml-1">({shiftSummary.avgBtmYield}%)</span>
                  </td>
                  <td className="p-2.5 text-right text-sky-950">{shiftSummary.avgYield}%</td>
                  <td className="p-2.5 text-right">{shiftSummary.avgCycle}s</td>
                  <td className="p-2.5 text-center text-emerald-800">PASSED</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
        )}
      </div>

      {/* EDIT HOURLY DATA MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl max-w-5xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-sky-700 to-sky-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-white/20">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Edit Hourly AOI Inspection Records &amp; Model Assignment</h3>
                  <p className="text-xs text-sky-100">Machine: {activeMachine.name} (Interchangeable Model Configuration)</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="space-y-3">
                {activeMachine.hourlyData.map((slot, idx) => (
                  <div key={slot.hour} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-7 gap-2 text-xs font-mono items-center">
                    <div className="font-bold text-slate-800">
                      {slot.hourShort}
                      <span className="block text-[10px] text-slate-400">Total: {slot.actualIn} pcs</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-sky-900 block font-bold">Running Model:</span>
                      <select
                        value={slot.runningModel}
                        onChange={(e) => {
                          handleUpdateSlot(idx, { runningModel: e.target.value });
                        }}
                        className="w-full px-2 py-1 bg-sky-50 border border-sky-300 rounded-lg text-sky-950 font-bold text-xs"
                      >
                        {ROTATION_MODELS.map((mid) => (
                          <option key={mid} value={mid}>
                            {mid}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-blue-700 block font-bold">Top GOOD:</span>
                      <input
                        type="number"
                        value={slot.topGood}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleUpdateSlot(idx, { topGood: val });
                        }}
                        className="w-full px-2 py-1 bg-blue-50 border border-blue-300 rounded-lg text-blue-900 font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-blue-700 block font-bold">Top NG:</span>
                      <input
                        type="number"
                        value={slot.topNg}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleUpdateSlot(idx, { topNg: val });
                        }}
                        className="w-full px-2 py-1 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-amber-700 block font-bold">Bot GOOD:</span>
                      <input
                        type="number"
                        value={slot.bottomGood}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleUpdateSlot(idx, { bottomGood: val });
                        }}
                        className="w-full px-2 py-1 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-amber-700 block font-bold">Bot NG:</span>
                      <input
                        type="number"
                        value={slot.bottomNg}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleUpdateSlot(idx, { bottomNg: val });
                        }}
                        className="w-full px-2 py-1 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Overall Yield:</span>
                      <div className="px-2 py-1 bg-sky-50 border border-sky-200 rounded-lg text-sky-950 font-black">
                        {slot.yieldPercent}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={handleResetDefaults}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Reset Default Factory Data
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Save &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Detail Breakdown Popup (JOB NO, PRODUCT, SIDE, NG) */}
      <InspectionDetailModal
        isOpen={!!inspectionPopup}
        onClose={() => setInspectionPopup(null)}
        data={inspectionPopup}
      />
    </div>
  );
};
