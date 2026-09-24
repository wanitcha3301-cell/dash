import React, { useState, useEffect, useMemo } from 'react';
import { MachineAnalyticsControlBar } from './MachineAnalyticsControlBar';
import {
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
  Edit3,
  Plus,
  Trash2,
  Sparkles,
  Check,
  X,
  Sliders,
  ArrowUpRight,
  Maximize2,
  ShieldCheck,
  Zap,
  Download,
  RotateCcw,
  Activity,
  Layers,
  Cpu,
  ScanLine,
  Thermometer,
  Shield,
  FileText,
  Calendar,
  Filter,
  Info,
  Eye,
  Contact
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
import { InspectionDetailModal, InspectionPopupPayload } from './InspectionDetailModal';
import { normalizeXrayMachineId } from '../utils/machineLinkUtils';
import { ThermalAllFleetChart } from './ThermalAllFleetChart';
import { ThermalSingleMachineChart } from './ThermalSingleMachineChart';
import { InspectionMachinesOverviewSection } from './InspectionMachinesOverviewSection';
import { OvenUnit } from '../types';

export interface XrayHourlySlot {
  hour: string; // "07:00 - 08:00"
  hourShort: string; // "07:00"
  runningModel: string; // Dynamic model for this hour slot
  targetUph: number;
  actualInspected: number;
  passCount: number;
  failCount: number;
  yieldPercent: number;
  avgVoidPercent: number;
  maxVoidPercent: number;
  tubeKvAvg: number;
  filamentMicroAmpAvg: number;
  radiationLeakageDose: number; // in uSv/hr (<0.1 is safe)
  defects: {
    bgaVoidExceed: number;
    solderBridging: number;
    wireDeformation: number;
    hipDefect: number;
  };
  representativeScan: {
    panelId: string;
    bgaZone: string;
    voidPercent: number;
    status: 'PASS' | 'NG';
    defectType?: string;
    timestamp: string;
    operator: string;
  };
}

export interface XrayMachineDataset {
  machineId: string;
  name: string;
  line: string;
  lineDesc: string;
  operatorId: string;
  lotNumber: string;
  activeRecipe: string;
  runningModel: string;
  modelDesc?: string;
  packageType?: string;
  status: 'ONLINE (HOURLY SYNC)' | 'STANDBY' | 'MAINTENANCE';
  targetUph: number;
  maxVoidThreshold: number; // 15.0%
  detectorTempCelsius: number;
  focalSpotMicron: number;
  radiationShieldStatus: 'ENGAGED / SAFE';
  hourlyData: XrayHourlySlot[];
}

export interface AvailableXrayModel {
  id: string;
  name: string;
  title: string;
  desc: string;
  rev: string;
  packageType: string;
  productionRun: string;
  lotNumber: string;
  bgaZone: string;
  recipeName: string;
}

export const AVAILABLE_XRAY_MODELS: AvailableXrayModel[] = [
  {
    id: '504-2268',
    name: 'Model 504-2268',
    title: 'Power Management Board',
    desc: 'PMIC U01 High-Power Thermal Pad Void Inspection',
    rev: 'Rev 1.4B',
    packageType: 'QFN-64 / PMIC U01',
    productionRun: 'Run Duration: 3-4 Days (Active Production)',
    lotNumber: 'LOT-XRAY-2026-0830-B',
    bgaZone: 'U01 (Power PMIC)',
    recipeName: 'PMIC-ThermalPad-Void-Spec-V2.1'
  },
  {
    id: '504-2154',
    name: 'Model 504-2154',
    title: 'Communication Module',
    desc: 'RF Shield Baseband Wire Bond & Solder Joint Verification',
    rev: 'Rev 3.0C',
    packageType: 'RF Shield / Dual BGA',
    productionRun: 'Run Duration: 3-4 Days (Dedicated Run)',
    lotNumber: 'LOT-XRAY-2026-0902-C',
    bgaZone: 'U08 (RF Transceiver)',
    recipeName: 'RF-Shield-WireBond-Joint-V4.0'
  },
  {
    id: '504-2224',
    name: 'Model 504-2224',
    title: 'Sensor Node Interface',
    desc: 'High-Density Mixed-Signal CSP-144 Solder Integrity',
    rev: 'Rev 1.8A',
    packageType: 'CSP-144 / QFN',
    productionRun: 'Run Duration: 3-4 Days (Active Batch)',
    lotNumber: 'LOT-XRAY-2026-0829-D',
    bgaZone: 'U22 (CSP-144 Sensor)',
    recipeName: 'CSP-MicroBGA-Interconnect-V1.9'
  },
  {
    id: '504-2454',
    name: 'Model 504-2454',
    title: 'High-Speed Processor Board',
    desc: 'FCBGA-1156 Micro-Bump & High-Density Interconnect',
    rev: 'Rev 4.2D',
    packageType: 'FCBGA-1156 / High-Speed',
    productionRun: 'Run Duration: 3-4 Days (Dedicated Run)',
    lotNumber: 'LOT-XRAY-2026-0901-E',
    bgaZone: 'U10 (FCBGA NPU Host)',
    recipeName: 'FCBGA-1156-Bump-Quality-V5.0'
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
        bar: '#0284c7'
      };
    case '504-2268':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        dot: 'bg-sky-600',
        bar: '#0284c7'
      };
    case '504-2154':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-600',
        bar: '#10b981'
      };
    case '504-2224':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-600',
        bar: '#f59e0b'
      };
    case '504-2454':
      return {
        bg: 'bg-sky-100',
        text: 'text-sky-900',
        border: 'border-sky-300',
        dot: 'bg-sky-600',
        bar: '#0ea5e9'
      };
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-600',
        bar: '#94a3b8'
      };
  }
};

const STORAGE_XRAY_HOURLY_KEY = 'factory_xray_hourly_monitoring_v8';

const BASE_XRAY_HOURS = [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export const generateModelXraySlots = (modelId: string, lineOffset: number): XrayHourlySlot[] => {
  const modelSpecs: Record<string, { baseIn: number; avgVoid: number; tubeKv: number; zone: string }> = {
    '504-2268': { baseIn: 76, avgVoid: 6.8, tubeKv: 88.0, zone: 'U01 (Power PMIC)' },
    '504-2154': { baseIn: 85, avgVoid: 4.5, tubeKv: 82.5, zone: 'U08 (RF Transceiver)' },
    '504-2224': { baseIn: 82, avgVoid: 5.8, tubeKv: 84.0, zone: 'U22 (CSP-144 Sensor)' },
    '504-2454': { baseIn: 74, avgVoid: 5.0, tubeKv: 90.0, zone: 'U10 (FCBGA NPU Host)' }
  };

  const mSpec = modelSpecs[modelId] || { baseIn: 80, avgVoid: 5.0, tubeKv: 85.0, zone: 'BGA Zone' };

  const hourOffsets = [
    { inMod: -2, passMod: -1, voidMod: 0.2, maxMod: 3.2 },
    { inMod: 2, passMod: 0, voidMod: -0.4, maxMod: 2.1 },
    { inMod: 0, passMod: -1, voidMod: 0.9, maxMod: 11.2 },
    { inMod: -1, passMod: -1, voidMod: 0.0, maxMod: 3.9 },
    { inMod: 1, passMod: 0, voidMod: -0.3, maxMod: 1.8 },
    { inMod: -4, passMod: -1, voidMod: 0.5, maxMod: 6.0 },
    { inMod: 3, passMod: 0, voidMod: -0.6, maxMod: 1.5 },
    { inMod: 0, passMod: -1, voidMod: 0.3, maxMod: 10.6 },
    { inMod: 1, passMod: 0, voidMod: -0.5, maxMod: 2.0 },
    { inMod: -1, passMod: 0, voidMod: -0.2, maxMod: 2.5 },
    { inMod: 2, passMod: -1, voidMod: 0.1, maxMod: 4.2 }
  ];

  return BASE_XRAY_HOURS.map((hourShort, idx) => {
    const nextHour = (parseInt(hourShort.split(':')[0], 10) + 1).toString().padStart(2, '0') + ':00';
    const hourLabel = `${hourShort} - ${nextHour}`;
    const hConf = hourOffsets[idx];

    const actualInspected = Math.max(50, Math.round((mSpec.baseIn + hConf.inMod) * (1 + (lineOffset * 0.02 - 0.04))));
    const failCount = (idx === 2 || idx === 7 || (idx + lineOffset) % 4 === 0) ? 1 : 0;
    const passCount = Math.max(0, actualInspected - failCount);
    const yieldPercent = Number(((passCount / actualInspected) * 100).toFixed(2));
    const avgVoidPercent = Number(Math.max(2.0, mSpec.avgVoid + hConf.voidMod + (lineOffset * 0.1)).toFixed(2));
    const maxVoidPercent = Number(Math.min(25.0, avgVoidPercent + hConf.maxMod + (failCount > 0 ? 8.5 : 2.0)).toFixed(1));
    const tubeKvAvg = Number((mSpec.tubeKv + (idx * 0.05) - 0.2).toFixed(1));

    return {
      hour: hourLabel,
      hourShort,
      runningModel: modelId,
      targetUph: mSpec.baseIn,
      actualInspected,
      passCount,
      failCount,
      yieldPercent,
      avgVoidPercent,
      maxVoidPercent,
      tubeKvAvg,
      filamentMicroAmpAvg: 112 + lineOffset * 2,
      radiationLeakageDose: Number((0.038 + lineOffset * 0.003).toFixed(3)),
      defects: {
        bgaVoidExceed: maxVoidPercent > 15 ? 1 : 0,
        solderBridging: failCount > 0 && maxVoidPercent <= 15 ? 1 : 0,
        wireDeformation: 0,
        hipDefect: 0
      },
      representativeScan: {
        panelId: `PNL-${modelId.replace('504-', '')}-${hourShort.replace(':', '')}`,
        bgaZone: mSpec.zone,
        voidPercent: avgVoidPercent,
        status: maxVoidPercent > 15 ? 'NG' : 'PASS',
        defectType: maxVoidPercent > 15 ? 'BGA Voiding > 15.0% Spec Limit' : undefined,
        timestamp: `${hourShort}:30`,
        operator: `E829${lineOffset + 1}`
      }
    };
  });
};

export const generateModelXrayFleet = (modelId: string): Record<string, XrayMachineDataset> => {
  const modelMeta = AVAILABLE_XRAY_MODELS.find(m => m.id === modelId) || AVAILABLE_XRAY_MODELS[0];

  return {
    'X-RAY 01': {
      machineId: 'X-RAY 01',
      name: 'X-Ray Unit 01 (Line 1)',
      line: 'Line 1',
      lineDesc: 'Top Fill & Bake Radiography',
      operatorId: 'E8291',
      lotNumber: modelMeta.lotNumber,
      activeRecipe: modelMeta.recipeName,
      runningModel: modelId,
      status: 'ONLINE (HOURLY SYNC)',
      targetUph: 80,
      maxVoidThreshold: 15.0,
      detectorTempCelsius: 18.2,
      focalSpotMicron: 5.0,
      radiationShieldStatus: 'ENGAGED / SAFE',
      hourlyData: generateModelXraySlots(modelId, 0)
    },
    'X-RAY 02': {
      machineId: 'X-RAY 02',
      name: 'X-Ray Unit 02 (Line 2)',
      line: 'Line 2',
      lineDesc: 'Top Fill & Vacuum Inspection',
      operatorId: 'E6402',
      lotNumber: modelMeta.lotNumber,
      activeRecipe: modelMeta.recipeName,
      runningModel: modelId,
      status: 'ONLINE (HOURLY SYNC)',
      targetUph: 80,
      maxVoidThreshold: 15.0,
      detectorTempCelsius: 17.9,
      focalSpotMicron: 5.0,
      radiationShieldStatus: 'ENGAGED / SAFE',
      hourlyData: generateModelXraySlots(modelId, 1)
    },
    'X-RAY 03': {
      machineId: 'X-RAY 03',
      name: 'X-Ray Unit 03 (Line 3)',
      line: 'Line 3',
      lineDesc: 'Under Fill & Bake NDT',
      operatorId: 'E5198',
      lotNumber: modelMeta.lotNumber,
      activeRecipe: modelMeta.recipeName,
      runningModel: modelId,
      status: 'ONLINE (HOURLY SYNC)',
      targetUph: 80,
      maxVoidThreshold: 15.0,
      detectorTempCelsius: 18.5,
      focalSpotMicron: 5.0,
      radiationShieldStatus: 'ENGAGED / SAFE',
      hourlyData: generateModelXraySlots(modelId, 2)
    },
    'X-RAY 04': {
      machineId: 'X-RAY 04',
      name: 'X-Ray Unit 04 (Line 4)',
      line: 'Line 4',
      lineDesc: 'Under Fill & Vacuum Chamber',
      operatorId: 'E3341',
      lotNumber: modelMeta.lotNumber,
      activeRecipe: modelMeta.recipeName,
      runningModel: modelId,
      status: 'ONLINE (HOURLY SYNC)',
      targetUph: 80,
      maxVoidThreshold: 15.0,
      detectorTempCelsius: 18.1,
      focalSpotMicron: 5.0,
      radiationShieldStatus: 'ENGAGED / SAFE',
      hourlyData: generateModelXraySlots(modelId, 3)
    },
    'X-RAY 05': {
      machineId: 'X-RAY 05',
      name: 'X-Ray Unit 05 (Line 5)',
      line: 'Line 5',
      lineDesc: 'High-Density Micro-Focus Core',
      operatorId: 'E1109',
      lotNumber: modelMeta.lotNumber,
      activeRecipe: modelMeta.recipeName,
      runningModel: modelId,
      status: 'ONLINE (HOURLY SYNC)',
      targetUph: 80,
      maxVoidThreshold: 15.0,
      detectorTempCelsius: 18.3,
      focalSpotMicron: 5.0,
      radiationShieldStatus: 'ENGAGED / SAFE',
      hourlyData: generateModelXraySlots(modelId, 4)
    },
    'X-RAY 06': {
      machineId: 'X-RAY 06',
      name: 'X-Ray Unit 06 (Line 6)',
      line: 'Line 6',
      lineDesc: 'Radiography & Final Void Inspection',
      operatorId: 'E7720',
      lotNumber: modelMeta.lotNumber,
      activeRecipe: modelMeta.recipeName,
      runningModel: modelId,
      status: 'ONLINE (HOURLY SYNC)',
      targetUph: 80,
      maxVoidThreshold: 15.0,
      detectorTempCelsius: 18.0,
      focalSpotMicron: 5.0,
      radiationShieldStatus: 'ENGAGED / SAFE',
      hourlyData: generateModelXraySlots(modelId, 5)
    }
  };
};

const INITIAL_MODEL_XRAY_FLEETS: Record<string, Record<string, XrayMachineDataset>> = {
  '504-2268': generateModelXrayFleet('504-2268'),
  '504-2154': generateModelXrayFleet('504-2154'),
  '504-2224': generateModelXrayFleet('504-2224'),
  '504-2454': generateModelXrayFleet('504-2454')
};

const XRAY_MACHINE_IDS = ['X-RAY 01', 'X-RAY 02', 'X-RAY 03', 'X-RAY 04', 'X-RAY 05', 'X-RAY 06'];

export const PackOutOcrView: React.FC = () => {
  const { t } = useLanguage();
  const { selectedMachineId, setSelectedMachineId } = useFactory();

  const [modelFleets, setModelFleets] = useState<Record<string, Record<string, XrayMachineDataset>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_XRAY_HOURLY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const merged: Record<string, Record<string, XrayMachineDataset>> = { ...INITIAL_MODEL_XRAY_FLEETS };
          Object.keys(INITIAL_MODEL_XRAY_FLEETS).forEach((modelId) => {
            merged[modelId] = {
              ...INITIAL_MODEL_XRAY_FLEETS[modelId],
              ...(parsed[modelId] || {})
            };
          });
          return merged;
        }
      }
    } catch (e) {}
    return INITIAL_MODEL_XRAY_FLEETS;
  });

  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => {
    if (selectedMachineId === 'ALL') return 'ALL';
    if (selectedMachineId && XRAY_MACHINE_IDS.includes(selectedMachineId)) {
      return selectedMachineId;
    }
    return 'ALL';
  });
  const [selectedMachineKey, setSelectedMachineKey] = useState<string>(() => {
    if (selectedMachineId && selectedMachineId !== 'ALL' && XRAY_MACHINE_IDS.includes(selectedMachineId)) {
      return selectedMachineId;
    }
    return 'X-RAY 01';
  });
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('ALL');
  const [selectedHourFilter, setSelectedHourFilter] = useState<string>('ALL');
  const [selectedOperator, setSelectedOperator] = useState<string>('All');
  const [selectedLot, setSelectedLot] = useState<string>('All');
  const [selectedRack, setSelectedRack] = useState<string>('All');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [inspectionPopup, setInspectionPopup] = useState<InspectionPopupPayload | null>(null);

  // Sync selected machine from FactoryContext
  useEffect(() => {
    if (selectedMachineId === 'ALL') {
      setSelectedUnitId('ALL');
      setSelectedModelFilter('ALL');
    } else if (selectedMachineId && XRAY_MACHINE_IDS.includes(selectedMachineId)) {
      setSelectedUnitId(selectedMachineId);
      setSelectedMachineKey(selectedMachineId);
    } else if (selectedMachineId && (selectedMachineId.toUpperCase().includes('XRAY') || selectedMachineId.toUpperCase().includes('X-RAY'))) {
      const normalized = normalizeXrayMachineId(selectedMachineId);
      setSelectedUnitId(normalized);
      setSelectedMachineKey(normalized);
    }
  }, [selectedMachineId]);

  const handleUnitSelect = (uId: string) => {
    setSelectedUnitId(uId);
    if (uId === 'ALL') {
      setSelectedMachineId('ALL');
    } else {
      setSelectedMachineKey(uId);
      setSelectedMachineId(uId);
    }
  };

  const handleMachineSelect = (mId: string) => {
    handleUnitSelect(mId);
  };

  // Active Model Meta
  const activeModelMeta = useMemo(() => {
    if (selectedModelFilter === 'ALL') {
      return {
        id: 'ALL',
        name: 'All Models',
        title: 'All Active Production Models',
        desc: 'Fleet Total X-Ray BGA Void Inspection Across All Models (504-2268, 504-2154, 504-2224, 504-2454)',
        rev: 'Fleet-wide',
        packageType: 'Multi-Package BGA / CSP / QFN',
        productionRun: 'All Active Runs (Full Fleet)',
        lotNumber: 'ALL ACTIVE LOTS',
        bgaZone: 'All BGA & CSP Zones',
        recipeName: 'Multi-Model Fleet Inspection'
      };
    }
    return AVAILABLE_XRAY_MODELS.find((m) => m.id === selectedModelFilter) || AVAILABLE_XRAY_MODELS[0];
  }, [selectedModelFilter]);

  // Active Fleet for selected Model (aggregates all models if 'ALL' is selected)
  const activeFleet = useMemo(() => {
    if (selectedModelFilter === 'ALL') {
      const aggregatedFleet: Record<string, XrayMachineDataset> = {};
      XRAY_MACHINE_IDS.forEach((mId) => {
        const firstModelId = AVAILABLE_XRAY_MODELS[0]?.id || '504-2268';
        const baseMachine = modelFleets[firstModelId]?.[mId] || INITIAL_MODEL_XRAY_FLEETS[firstModelId]?.[mId] || INITIAL_MODEL_XRAY_FLEETS['504-2268']['X-RAY 01'];
        const numSlots = baseMachine.hourlyData.length;
        const hourlySlots: XrayHourlySlot[] = [];

        for (let sIdx = 0; sIdx < numSlots; sIdx++) {
          const baseSlot = baseMachine.hourlyData[sIdx];
          let totalActual = 0;
          let totalPass = 0;
          let totalFail = 0;
          let sumAvgVoid = 0;
          let maxObservedVoid = 0;
          let sumTubeKv = 0;
          let sumRadiation = 0;
          let totalBgaVoid = 0;
          let totalBridge = 0;
          let totalWire = 0;
          let totalHip = 0;
          let count = 0;

          AVAILABLE_XRAY_MODELS.forEach((m) => {
            const mMachine = modelFleets[m.id]?.[mId];
            const slot = mMachine?.hourlyData[sIdx];
            if (slot) {
              totalActual += slot.actualInspected || 0;
              totalPass += slot.passCount || 0;
              totalFail += slot.failCount || 0;
              sumAvgVoid += slot.avgVoidPercent || 0;
              maxObservedVoid = Math.max(maxObservedVoid, slot.maxVoidPercent || 0);
              sumTubeKv += slot.tubeKvAvg || 0;
              sumRadiation += slot.radiationLeakageDose || 0;
              if (slot.defects) {
                totalBgaVoid += slot.defects.bgaVoidExceed || 0;
                totalBridge += slot.defects.solderBridging || 0;
                totalWire += slot.defects.wireDeformation || 0;
                totalHip += slot.defects.hipDefect || 0;
              }
              count++;
            }
          });

          const avgVoid = count > 0 ? Number((sumAvgVoid / count).toFixed(2)) : 5.0;
          const avgKv = count > 0 ? Number((sumTubeKv / count).toFixed(1)) : 85.0;
          const avgRad = count > 0 ? Number((sumRadiation / count).toFixed(3)) : 0.04;
          const yld = totalActual > 0 ? Number(((totalPass / totalActual) * 100).toFixed(2)) : 99.0;

          hourlySlots.push({
            ...baseSlot,
            runningModel: 'ALL MODELS',
            actualInspected: totalActual,
            passCount: totalPass,
            failCount: totalFail,
            yieldPercent: yld,
            avgVoidPercent: avgVoid,
            maxVoidPercent: maxObservedVoid,
            tubeKvAvg: avgKv,
            radiationLeakageDose: avgRad,
            targetUph: baseSlot.targetUph * AVAILABLE_XRAY_MODELS.length,
            defects: {
              bgaVoidExceed: totalBgaVoid,
              solderBridging: totalBridge,
              wireDeformation: totalWire,
              hipDefect: totalHip
            }
          });
        }

        aggregatedFleet[mId] = {
          ...baseMachine,
          runningModel: 'ALL MODELS',
          targetUph: baseMachine.targetUph * AVAILABLE_XRAY_MODELS.length,
          hourlyData: hourlySlots
        };
      });

      return aggregatedFleet;
    }
    return modelFleets[selectedModelFilter] || modelFleets['504-2268'] || INITIAL_MODEL_XRAY_FLEETS['504-2268'];
  }, [modelFleets, selectedModelFilter]);

  // Active Machine
  const activeMachine = activeFleet[selectedMachineKey] || activeFleet['X-RAY 01'];

  // Full fleet list for currently selected model
  const fleetList = useMemo(() => {
    return Object.values(activeFleet) as XrayMachineDataset[];
  }, [activeFleet]);

  const xrayUnits: OvenUnit[] = useMemo(() => {
    return fleetList.map((m, idx) => {
      const totalIn = m.hourlyData.reduce((sum, h) => sum + h.actualInspected, 0);
      const totalGood = m.hourlyData.reduce((sum, h) => sum + h.passCount, 0);
      const yieldPct = totalIn > 0 ? Number(((totalGood / totalIn) * 100).toFixed(1)) : 99.2;
      const latestSlot = m.hourlyData[m.hourlyData.length - 1];
      const avgVoid = Number((m.hourlyData.reduce((acc, h) => acc + (h.avgVoidPercent || 2.1), 0) / Math.max(1, m.hourlyData.length)).toFixed(1));
      const avgKv = Math.round(m.hourlyData.reduce((acc, h) => acc + (h.tubeKvAvg || 90), 0) / Math.max(1, m.hourlyData.length));
      const avgFilament = Math.round(m.hourlyData.reduce((acc, h) => acc + (h.filamentMicroAmpAvg || 120), 0) / Math.max(1, m.hourlyData.length));
      return {
        id: m.machineId,
        name: `X-Ray Unit 0${idx + 1}`,
        subType: 'XRAY' as const,
        status: (idx === 5 ? 'STOP' : 'RUNNING') as OvenUnit['status'],
        chamberLabel: `${m.line} • ${m.lineDesc}`,
        operatorId: `Tech ID: ${m.operatorId || 'E8291'}`,
        magazinesCount: Math.round(totalGood / 60) || 20,
        pcsCount: totalGood || 1020,
        runningModel: selectedModelFilter === 'ALL' ? 'All Models' : `Model ${m.runningModel}`,
        program: m.activeRecipe || `XRAY-PROG-0${idx + 1}`,
        tempCelsius: m.detectorTempCelsius || 21.4,
        targetTempMin: 20.0,
        targetTempMax: 24.0,
        pressurePa: 101.3,
        remainingSeconds: 0,
        uph: latestSlot?.passCount || 128,
        targetUph: m.targetUph || 130,
        inputCount: totalIn || 1040,
        outputCount: totalGood || 1020,
        oeePercent: yieldPct,
        yieldPercent: yieldPct,
        voidPercent: avgVoid || 2.1,
        tubeKv: avgKv || 90,
        filamentMicroAmp: avgFilament || 120,
        lineId: `Line 0${idx + 1}`
      };
    });
  }, [fleetList, selectedModelFilter]);

  const activeXrayOvenUnit = useMemo(() => {
    return xrayUnits.find((u) => u.id === selectedUnitId) || xrayUnits[0];
  }, [xrayUnits, selectedUnitId]);

  const allFleetTotalPass = useMemo(() => {
    return fleetList.reduce((sum, m) => sum + m.hourlyData.reduce((hSum, h) => hSum + h.passCount, 0), 0);
  }, [fleetList]);

  const allFleetTotalIn = useMemo(() => {
    return fleetList.reduce((sum, m) => sum + m.hourlyData.reduce((hSum, h) => hSum + h.actualInspected, 0), 0);
  }, [fleetList]);

  // Handle Model Selection
  const handleModelSelect = (modelId: string) => {
    setSelectedModelFilter(modelId);
  };

  // Save changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_XRAY_HOURLY_KEY, JSON.stringify(modelFleets));
    } catch (e) {}
  }, [modelFleets]);

  // Aggregated Shift Summary
  const shiftSummary = useMemo(() => {
    const slots = activeMachine.hourlyData;
    const totalIn = slots.reduce((sum, s) => sum + s.actualInspected, 0);
    const totalPass = slots.reduce((sum, s) => sum + s.passCount, 0);
    const totalFail = slots.reduce((sum, s) => sum + s.failCount, 0);
    const avgYield = totalIn > 0 ? Number(((totalPass / totalIn) * 100).toFixed(2)) : 0;
    const avgVoid = Number((slots.reduce((sum, s) => sum + s.avgVoidPercent, 0) / (slots.length || 1)).toFixed(2));
    const maxShiftVoid = Math.max(...slots.map((s) => s.maxVoidPercent), 0);
    const avgTubeKv = Number((slots.reduce((sum, s) => sum + s.tubeKvAvg, 0) / (slots.length || 1)).toFixed(1));
    const avgRadiation = Number((slots.reduce((sum, s) => sum + s.radiationLeakageDose, 0) / (slots.length || 1)).toFixed(3));
    const totalBgaVoidDefect = slots.reduce((sum, s) => sum + s.defects.bgaVoidExceed, 0);
    const totalBridgeDefect = slots.reduce((sum, s) => sum + s.defects.solderBridging, 0);
    const totalWireDefect = slots.reduce((sum, s) => sum + s.defects.wireDeformation, 0);
    const totalHipDefect = slots.reduce((sum, s) => sum + s.defects.hipDefect, 0);

    return {
      totalIn,
      totalPass,
      totalFail,
      avgYield,
      avgVoid,
      maxShiftVoid,
      avgTubeKv,
      avgRadiation,
      totalBgaVoidDefect,
      totalBridgeDefect,
      totalWireDefect,
      totalHipDefect,
      slotCount: slots.length
    };
  }, [activeMachine]);

  // Hourly slots for active machine and selected model
  const displayHourlySlots = useMemo(() => {
    return activeMachine.hourlyData;
  }, [activeMachine]);

  // Calculate min and max inspected volume for dynamic intensity color scale (Low = light, High = dark)
  const { minSlotVal, maxSlotVal } = useMemo(() => {
    if (!displayHourlySlots || displayHourlySlots.length === 0) return { minSlotVal: 0, maxSlotVal: 100 };
    const vals = displayHourlySlots.map((s) => s.actualInspected);
    return {
      minSlotVal: Math.min(...vals),
      maxSlotVal: Math.max(...vals)
    };
  }, [displayHourlySlots]);

  // Volume scale color mapping:
  // Green for Pass / Meets Target (>= Target), Yellow for Below Target (< Target)
  const getBarColor = (actualIn: number, target: number = activeMachine.targetUph || 70) => {
    if (actualIn >= target) return '#4db6ac'; // Green (#4db6ac)
    return '#fff176'; // Yellow (#fff176)
  };

  // Helper function: Dynamic Pink Intensity Scale
  // Lower value -> Light Rose/Pink, Higher value -> Deep Dark Magenta/Pink
  const getDynamicSlotColor = (value: number, min: number, max: number) => {
    if (max === min) return '#ec4899';
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const hue = 335;
    const sat = Math.round(68 + ratio * 24); // 68% -> 92%
    const light = Math.round(82 - ratio * 52); // 82% (light pink) -> 30% (deep pink)
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  };

  // Helper for fail bar shading (light red for few, deep red for more)
  const getDynamicFailColor = (failCount: number) => {
    if (failCount <= 0) return 'transparent';
    if (failCount === 1) return '#fca5a5';
    if (failCount === 2) return '#f43f5e';
    return '#be123c';
  };

  // Active slot for detailed inspection sample
  const activeSlot = useMemo(() => {
    if (selectedHourFilter === 'ALL') {
      return displayHourlySlots[displayHourlySlots.length - 1] || displayHourlySlots[0];
    }
    return (
      displayHourlySlots.find((s) => s.hourShort === selectedHourFilter) ||
      displayHourlySlots[0]
    );
  }, [displayHourlySlots, selectedHourFilter]);

  // Handle slot update
  const handleUpdateSlot = (idx: number, updatedSlot: Partial<XrayHourlySlot>) => {
    setModelFleets((prev) => {
      const targetModelKey = selectedModelFilter === 'ALL' ? AVAILABLE_XRAY_MODELS[0].id : selectedModelFilter;
      const curFleet = prev[targetModelKey] || INITIAL_MODEL_XRAY_FLEETS[targetModelKey];
      const curMachine = curFleet[selectedMachineKey] || curFleet['X-RAY 01'];
      const newSlots = [...curMachine.hourlyData];
      const target = { ...newSlots[idx], ...updatedSlot };
      
      // Recalculate yield
      if (target.actualInspected > 0) {
        target.yieldPercent = Number(((target.passCount / target.actualInspected) * 100).toFixed(2));
      }
      newSlots[idx] = target;

      return {
        ...prev,
        [targetModelKey]: {
          ...curFleet,
          [selectedMachineKey]: {
            ...curMachine,
            hourlyData: newSlots
          }
        }
      };
    });
  };

  // Reset to default
  const handleResetDefaults = () => {
    setModelFleets(INITIAL_MODEL_XRAY_FLEETS);
    localStorage.removeItem(STORAGE_XRAY_HOURLY_KEY);
  };

  // Export CSV of hourly slots
  const handleExportCsv = () => {
    const rows = [
      ['Hour Slot', 'Model ID', 'Model Name', 'Target UPH', 'Actual Inspected', 'Pass Count', 'Fail Count', 'Yield %', 'Avg Void %', 'Max Void %', 'Tube kV Avg', 'Radiation (uSv/h)', 'BGA Void Defects', 'Solder Bridge', 'Wire Deform', 'HIP Defects'],
      ...activeMachine.hourlyData.map((s) => [
        s.hour,
        s.runningModel,
        activeModelMeta.title,
        s.targetUph.toString(),
        s.actualInspected.toString(),
        s.passCount.toString(),
        s.failCount.toString(),
        s.yieldPercent.toString() + '%',
        s.avgVoidPercent.toString() + '%',
        s.maxVoidPercent.toString() + '%',
        s.tubeKvAvg.toString(),
        s.radiationLeakageDose.toString(),
        s.defects.bgaVoidExceed.toString(),
        s.defects.solderBridging.toString(),
        s.defects.wireDeformation.toString(),
        s.defects.hipDefect.toString()
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `XRAY_${selectedModelFilter}_${activeMachine.machineId.replace(' ', '_')}_Hourly_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-screen bg-white text-[#1b1b1d] pb-20 md:pb-8 font-sans">
      <Header
        title={selectedUnitId === 'ALL' ? "X-Ray Inspection Process" : `${activeMachine.name} Telemetry Window`}
        subtitle="6 Micro-Focus Radiography Stations • 2D/3D NDT Void Inspection & Tube Telemetry"
        badge={
          <span className="text-[11px] font-mono font-bold text-sky-950 bg-[#b3e5fc] border border-sky-300 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>
            PROCESS • {selectedUnitId === 'ALL' ? '6 X-RAY MACHINES ONLINE (XRAY-01 to XRAY-06)' : `X-RAY ${activeMachine.machineId} ONLINE`}
          </span>
        }
      />

      <div className="pt-4 px-4 md:px-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Unified Standard Analytics Control Strip & Breakdown */}
        <MachineAnalyticsControlBar
          totalOutput={selectedUnitId === 'ALL' ? allFleetTotalPass : shiftSummary.totalPass}
          outputUnit="boards"
          activeHours={8}
          peakHourLabel="02 SEPT 15:00"
          peakHourValue={selectedUnitId === 'ALL' ? Math.round((allFleetTotalPass / 8) * 1.25) : Math.max(...activeMachine.hourlyData.map((s) => s.passCount), 125)}
          avgPerActiveHour={Math.round((selectedUnitId === 'ALL' ? allFleetTotalPass : shiftSummary.totalPass) / 8)}
          lines={['All X-Ray Fleet', ...fleetList.map((m, idx) => `Line 0${idx + 1} (${m.machineId})`)]}
          selectedLine={selectedUnitId === 'ALL' ? 'All X-Ray Fleet' : `Line 0${fleetList.findIndex((m) => m.machineId === activeMachine.machineId) + 1} (${activeMachine.machineId})`}
          onLineChange={(l) => {
            if (l === 'All X-Ray Fleet' || l === 'All') {
              handleUnitSelect('ALL');
            } else {
              const found = fleetList.find((m) => l.includes(m.machineId));
              if (found) handleUnitSelect(found.machineId);
            }
          }}
          products={['All', ...AVAILABLE_XRAY_MODELS.map((m) => `${m.id} - ${m.name}`)]}
          selectedProduct={selectedModelFilter === 'ALL' ? 'All' : `${activeModelMeta.id} - ${activeModelMeta.name}`}
          onProductChange={(p) => {
            if (p === 'All' || p === 'All Models' || p.startsWith('All')) {
              handleModelSelect('ALL');
            } else {
              const found = AVAILABLE_XRAY_MODELS.find((m) => p.includes(m.id));
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
              count: m.hourlyData.reduce((sum, h) => sum + h.passCount, 0)
            })),
            Product: AVAILABLE_XRAY_MODELS.map((m) => {
              const count = selectedModelFilter === 'ALL'
                ? Object.values(modelFleets[m.id] || {}).reduce((acc, machine) => acc + machine.hourlyData.reduce((hSum, h) => hSum + h.passCount, 0), 0)
                : (m.id === activeModelMeta.id ? shiftSummary.totalPass : Math.round(shiftSummary.totalPass * 0.35));
              return {
                name: `${m.name} (${m.title})`,
                count
              };
            }),
            Operator: [
              { name: `${activeMachine.operatorId || 'E8291'} (Lead Tech)`, count: Math.round(shiftSummary.totalPass * 0.65) },
              { name: 'OP-NDT-02 (Shift 2)', count: Math.round(shiftSummary.totalPass * 0.35) },
            ],
            Lot: [
              { name: 'LOT-2026-09A', count: Math.round(shiftSummary.totalPass * 0.45) },
              { name: 'LOT-2026-09B', count: Math.round(shiftSummary.totalPass * 0.35) },
              { name: 'LOT-2026-08F', count: Math.round(shiftSummary.totalPass * 0.20) },
            ],
            Rack: [
              { name: 'Magazine Mag-01 (Infeed A)', count: Math.round(shiftSummary.totalPass * 0.38) },
              { name: 'Magazine Mag-02 (Infeed B)', count: Math.round(shiftSummary.totalPass * 0.34) },
              { name: 'Magazine Mag-03 (Passed Tray)', count: Math.round(shiftSummary.totalPass * 0.28) },
            ]
          }}
          extraActions={
            <div className="flex items-center gap-2">
              <button
                id="btn-all-xray-top"
                onClick={() => handleUnitSelect('ALL')}
                className={`px-3 py-1.5 font-bold text-xs rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  selectedUnitId === 'ALL'
                    ? 'bg-sky-700 text-white border-sky-700 shadow-sm ring-2 ring-sky-300'
                    : 'bg-white text-sky-950 border-sky-300 hover:bg-sky-50'
                }`}
                title="Click to view combined chart for All X-Ray"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All X-Ray</span>
              </button>
              <span className="px-3 py-1.5 bg-sky-50 text-sky-900 font-bold text-xs rounded-xl border border-sky-200 shadow-2xs">
                {selectedUnitId === 'ALL' ? '6 Total Units Active' : `Selected: ${activeMachine.machineId}`}
              </span>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-1.5 bg-white hover:bg-sky-100 text-sky-900 border border-sky-300 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors text-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                <span>Edit Hourly Data</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          }
        />

        {/* STANDARDIZED ALL FLEET OR SINGLE MACHINE VIEW (MATCHING DISPENSING, BAKE, VACUUM) */}
        {selectedUnitId === 'ALL' ? (
          <div className="space-y-6">
            <ThermalAllFleetChart
              processType="X-ray"
              units={xrayUnits}
              selectedUnitId={selectedUnitId}
              onSelectUnit={(id) => handleUnitSelect(id)}
              onBackToFleet={() => handleUnitSelect('ALL')}
            />

            {/* Individual Machine Mini Overview Windows (Matching Vacuum & Bake) */}
            <InspectionMachinesOverviewSection
              processType="X-ray"
              units={xrayUnits}
              selectedUnitId={selectedUnitId}
              onSelectUnit={(id) => handleUnitSelect(id)}
            />
          </div>
        ) : (
          <ThermalSingleMachineChart
            processType="X-ray"
            unit={activeXrayOvenUnit}
            allUnits={xrayUnits}
            onSelectUnit={(id) => handleUnitSelect(id)}
            onBackToFleet={() => handleUnitSelect('ALL')}
            onToggleStatus={(id, st) => {}}
          />
        )}

        {/* SHIFT DEFECT PARETO BREAKDOWN */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-sky-600" />
                Hourly X-ray Defect Distribution ({activeMachine.machineId})
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Shift Total NG: <strong className="text-rose-600">{shiftSummary.totalFail} pcs</strong> • Standard: <strong>IPC-A-610 Class 3 (15% Max Void Spec)</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between font-mono mb-1.5">
                <span className="font-semibold text-slate-700">BGA Voiding &gt; 15%</span>
                <span className="font-bold text-sky-950">{shiftSummary.totalBgaVoidDefect} ({((shiftSummary.totalBgaVoidDefect / (shiftSummary.totalFail || 1)) * 100).toFixed(1)}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-sky-600 rounded-full" style={{ width: `${(shiftSummary.totalBgaVoidDefect / (shiftSummary.totalFail || 1)) * 100}%` }} />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between font-mono mb-1.5">
                <span className="font-semibold text-slate-700">Solder Bridging (X-ray)</span>
                <span className="font-bold text-sky-950">{shiftSummary.totalBridgeDefect} ({((shiftSummary.totalBridgeDefect / (shiftSummary.totalFail || 1)) * 100).toFixed(1)}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(shiftSummary.totalBridgeDefect / (shiftSummary.totalFail || 1)) * 100}%` }} />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between font-mono mb-1.5">
                <span className="font-semibold text-slate-700">Wire Bond Deformation</span>
                <span className="font-bold text-sky-950">{shiftSummary.totalWireDefect} ({((shiftSummary.totalWireDefect / (shiftSummary.totalFail || 1)) * 100).toFixed(1)}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-sky-400 rounded-full" style={{ width: `${(shiftSummary.totalWireDefect / (shiftSummary.totalFail || 1)) * 100}%` }} />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between font-mono mb-1.5">
                <span className="font-semibold text-slate-700">Head-in-Pillow (HIP)</span>
                <span className="font-bold text-sky-950">{shiftSummary.totalHipDefect} ({((shiftSummary.totalHipDefect / (shiftSummary.totalFail || 1)) * 100).toFixed(1)}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(shiftSummary.totalHipDefect / (shiftSummary.totalFail || 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* FULL HOURLY X-RAY INSPECTION RECORDS TABLE (MATCHING AOI TABLE STRUCTURE) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                Hourly X-ray Inspection Records ({activeMachine.machineId} — Multi-Model Shift Log)
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Complete shift record by hourly time slots (07:00 - 18:00) with micro-focus NDT radiography analysis
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                <span>Modify Hourly Records</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
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
                  <th className="p-2.5 font-bold text-right text-rose-700">NG</th>
                  <th className="p-2.5 font-bold text-right text-sky-800">Avg Void %</th>
                  <th className="p-2.5 font-bold text-right text-slate-600">Max Void %</th>
                  <th className="p-2.5 font-bold text-right text-slate-600">Tube &amp; Rad</th>
                  <th className="p-2.5 font-bold text-right">Yield %</th>
                  <th className="p-2.5 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayHourlySlots.map((slot) => {
                  const badge = getModelBadge(slot.runningModel);
                  const isSelected = selectedHourFilter === slot.hourShort;

                  return (
                    <tr
                      key={slot.hour}
                      onClick={() => setSelectedHourFilter(slot.hourShort)}
                      className={`hover:bg-sky-50/50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-50/80 font-bold' : ''
                      }`}
                    >
                      <td className="p-2.5 text-slate-900 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-sky-500 opacity-70" />
                        {slot.hour}
                      </td>
                      <td className="p-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {slot.runningModel}
                        </span>
                      </td>
                      <td className="p-2.5 text-right text-slate-500">{slot.targetUph}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{slot.actualInspected}</td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectionPopup({
                              stationName: activeMachine.machineId,
                              stationType: 'XRAY',
                              hourSlot: slot.hour,
                              jobNo: `JOB-${slot.runningModel}-${slot.hourShort.replace(':', '')}`,
                              product: slot.runningModel,
                              side: 'DUAL',
                              category: 'GOOD',
                              count: slot.passCount
                            });
                          }}
                          className="font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/70 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view Good units (JOB NO, PRODUCT, SIDE, Details)"
                        >
                          {slot.passCount}
                        </button>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectionPopup({
                              stationName: activeMachine.machineId,
                              stationType: 'XRAY',
                              hourSlot: slot.hour,
                              jobNo: `JOB-${slot.runningModel}-${slot.hourShort.replace(':', '')}`,
                              product: slot.runningModel,
                              side: 'DUAL',
                              category: 'NG',
                              count: slot.failCount
                            });
                          }}
                          className="font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-100/70 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          title="Click to view NG defect units (JOB NO, PRODUCT, SIDE, NG Details)"
                        >
                          {slot.failCount}
                        </button>
                      </td>
                      <td className="p-2.5 text-right text-sky-800 font-bold">{slot.avgVoidPercent}%</td>
                      <td className="p-2.5 text-right text-slate-700">{slot.maxVoidPercent}%</td>
                      <td className="p-2.5 text-right text-slate-600">{slot.tubeKvAvg} kV / {slot.radiationLeakageDose} μSv/h</td>
                      <td className="p-2.5 text-right font-bold text-sky-950">{slot.yieldPercent}%</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            slot.yieldPercent >= 98.5
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {slot.yieldPercent >= 98.5 ? 'NORMAL' : 'WATCH'}
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
                  <td className="p-2.5 text-right">{activeMachine.targetUph * shiftSummary.slotCount}</td>
                  <td className="p-2.5 text-right">{shiftSummary.totalIn}</td>
                  <td className="p-2.5 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setInspectionPopup({
                          stationName: activeMachine.machineId,
                          stationType: 'XRAY',
                          hourSlot: 'Shift Total (07:00 - 18:00)',
                          jobNo: `JOB-${selectedModelFilter === 'ALL' ? 'ALL' : selectedModelFilter}-SHIFT`,
                          product: selectedModelFilter === 'ALL' ? 'Multi-Model' : selectedModelFilter,
                          side: 'DUAL',
                          category: 'GOOD',
                          count: shiftSummary.totalPass
                        })
                      }
                      className="font-bold text-emerald-800 hover:underline hover:bg-emerald-200/60 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      title="Click to view all Good units for shift"
                    >
                      {shiftSummary.totalPass}
                    </button>
                  </td>
                  <td className="p-2.5 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setInspectionPopup({
                          stationName: activeMachine.machineId,
                          stationType: 'XRAY',
                          hourSlot: 'Shift Total (07:00 - 18:00)',
                          jobNo: `JOB-${selectedModelFilter === 'ALL' ? 'ALL' : selectedModelFilter}-SHIFT`,
                          product: selectedModelFilter === 'ALL' ? 'Multi-Model' : selectedModelFilter,
                          side: 'DUAL',
                          category: 'NG',
                          count: shiftSummary.totalFail
                        })
                      }
                      className="font-bold text-rose-800 hover:underline hover:bg-rose-200/60 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      title="Click to view all NG units for shift"
                    >
                      {shiftSummary.totalFail}
                    </button>
                  </td>
                  <td className="p-2.5 text-right text-sky-800 font-bold">{shiftSummary.avgVoid}%</td>
                  <td className="p-2.5 text-right text-slate-800">{shiftSummary.maxShiftVoid}%</td>
                  <td className="p-2.5 text-right text-slate-800">{shiftSummary.avgTubeKv} kV / {shiftSummary.avgRadiation} μSv/h</td>
                  <td className="p-2.5 text-right text-sky-950">{shiftSummary.avgYield}%</td>
                  <td className="p-2.5 text-center text-emerald-800">PASSED</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>

      {/* EDIT HOURLY DATA MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl max-w-4xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-sky-700 to-sky-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-white/20">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Edit Hourly X-ray Radiography Records</h3>
                  <p className="text-xs text-sky-100">Machine: {activeMachine.name} (Multi-Model Rotation)</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="space-y-3">
                {activeMachine.hourlyData.map((slot, idx) => (
                  <div key={slot.hour} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs font-mono items-center">
                    <div className="font-bold text-slate-800">
                      <div>{slot.hourShort}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Model:</span>
                      <select
                        value={slot.runningModel}
                        onChange={(e) => {
                          handleUpdateSlot(idx, { runningModel: e.target.value });
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                      >
                        {AVAILABLE_XRAY_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Scanned In:</span>
                      <input
                        type="number"
                        value={slot.actualInspected}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleUpdateSlot(idx, { actualInspected: val, passCount: Math.max(0, val - slot.failCount) });
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Pass Count:</span>
                      <input
                        type="number"
                        value={slot.passCount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleUpdateSlot(idx, { passCount: val, failCount: Math.max(0, slot.actualInspected - val) });
                        }}
                        className="w-full px-2 py-1 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Fail Count:</span>
                      <input
                        type="number"
                        value={slot.failCount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleUpdateSlot(idx, { failCount: val, passCount: Math.max(0, slot.actualInspected - val) });
                        }}
                        className="w-full px-2 py-1 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Avg Void %:</span>
                      <input
                        type="number"
                        step="0.1"
                        value={slot.avgVoidPercent}
                        onChange={(e) => {
                          handleUpdateSlot(idx, { avgVoidPercent: Number(e.target.value) });
                        }}
                        className="w-full px-2 py-1 bg-sky-50 border border-sky-300 rounded-lg text-sky-950 font-bold"
                      />
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
                Save & Close
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
