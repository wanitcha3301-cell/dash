import { ScreenType } from '../types';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED';
export type AlertProcessCategory =
  | 'DISPENSING'
  | 'VACUUM_OVEN'
  | 'BAKE_OVEN'
  | 'FVMI'
  | 'AOI'
  | 'XRAY'
  | 'FACILITY';

export interface FactoryAlertItem {
  id: string;
  code: string;
  title: string;
  description: string;
  category: AlertProcessCategory;
  processLabel: string;
  machineId: string;
  machineName: string;
  line: string;
  stationCode: string;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: string;
  date: string;
  runningModel?: string;
  metricValue?: string;
  operatorId?: string;
  targetScreen: ScreenType;
  targetMachineId?: string;
  suggestedAction: string;
  rootCauseCandidate?: string;
  historyTimeline?: {
    time: string;
    note: string;
    actor: string;
  }[];
}

export const INITIAL_FACTORY_ALERTS: FactoryAlertItem[] = [
  {
    id: 'alt-xray-03-void',
    code: 'ALT-XRAY-301',
    title: 'BGA Solder Void Spec Limit Exceeded (18.2% > 15.0%)',
    description: 'X-Ray Unit 03 radiography inspection detected excessive void formation under CSP-144 U22 package exceeding IPC-A-610G and internal 15.0% spec threshold.',
    category: 'XRAY',
    processLabel: 'X-Ray NDT Radiography',
    machineId: 'X-RAY 03',
    machineName: 'X-Ray Unit 03 (Line 3)',
    line: 'Line 3',
    stationCode: 'XRAY-03',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    timestamp: '14:32:00',
    date: '2026-09-08',
    runningModel: 'Model 504-2224',
    metricValue: 'Max Void: 18.2% (Spec: < 15.0%) | 88 kV / 118 µA',
    operatorId: 'E5198',
    targetScreen: 'packout-xray',
    targetMachineId: 'X-RAY 03',
    suggestedAction: 'Inspect 2D/3D slice radiography scan in PackOut X-Ray view. Check vacuum reflow profile in Oven Line 3.',
    rootCauseCandidate: 'Solder paste flux outgassing rate under vacuum pull down delay.',
    historyTimeline: [
      { time: '14:32:00', note: 'Automated radiography NDT flagged void threshold violation', actor: 'SYSTEM' },
      { time: '14:35:10', note: 'Quality supervisor assigned unit to quarantine rack', actor: 'QC-E9102' }
    ]
  },
  {
    id: 'alt-disp-02-clog',
    code: 'ALT-DISP-201',
    title: 'Syringe Fluid Pressure Fluctuation & Nozzle Warning',
    description: 'Dispenser MC-02 purge cycle timed out. Syringe fluid delivery pressure dropped to 245 kPa (nominal: 320 kPa). Machine status switched to STOP.',
    category: 'DISPENSING',
    processLabel: 'Fluid Dispensing Station',
    machineId: 'MC-02',
    machineName: 'MC-02 Dispenser (Line 2)',
    line: 'Line 2',
    stationCode: 'MC-02',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    timestamp: '13:45:30',
    date: '2026-09-08',
    runningModel: 'MODEL 504-2268',
    metricValue: 'Pressure: 245 kPa | Syringe Temp: 24.2°C | Glue Exp: 42 mins',
    operatorId: 'OP-E3302',
    targetScreen: 'machine-detail',
    targetMachineId: 'MC-02',
    suggestedAction: 'Open MC-02 Dispenser Detail, execute automated nozzle purge, and verify glue pot fluid viscosity.',
    rootCauseCandidate: 'Partial fluid dry-out at nozzle orifice during micro-dwell pause.',
    historyTimeline: [
      { time: '13:45:30', note: 'Pressure drop detected below 280 kPa trip point', actor: 'PLC-MC02' }
    ]
  },
  {
    id: 'alt-aoi-02-bridge',
    code: 'ALT-AOI-201',
    title: 'Bottom Solder Bridge Defect Spike (> 1.2% Threshold)',
    description: 'AOI Unit 02 3D optical inspection flagged consecutive solder bridge defects on component C142 & U04 leads during the 14:00 inspection window.',
    category: 'AOI',
    processLabel: 'AOI Optical Inspection',
    machineId: 'AOI-02',
    machineName: 'AOI Unit 02 (Line 2)',
    line: 'Line 2',
    stationCode: 'AOI-02',
    severity: 'WARNING',
    status: 'ACTIVE',
    timestamp: '14:15:20',
    date: '2026-09-08',
    runningModel: 'Model 504-2268',
    metricValue: 'Current Yield: 98.62% | Hourly NG: 8 pcs | Solder Bridge: 6 pcs',
    operatorId: 'OP-E2219',
    targetScreen: 'packout-aoi',
    targetMachineId: 'AOI-02',
    suggestedAction: 'View AOI Inspection view for AOI-02, review hour 14:00 breakdown, inspect stencil wipe cycle frequency.',
    rootCauseCandidate: 'Aperture solder paste smearing on bottom side stencil.',
    historyTimeline: [
      { time: '14:15:20', note: 'AOI statistical process control (SPC) alarm triggered', actor: 'AOI-SPC' }
    ]
  },
  {
    id: 'alt-vac-02-leak',
    code: 'ALT-VAC-102',
    title: 'Vacuum Chamber Leak Rate Exceeded (0.08 mbar/min)',
    description: 'Vacuum Oven Chamber B seal gasket pressure decay test detected 0.08 mbar/min leakage during evacuation step 3. ME check required.',
    category: 'VACUUM_OVEN',
    processLabel: 'Vacuum Curing Oven',
    machineId: 'oven-2',
    machineName: 'Oven #2 (Chamber B)',
    line: 'Line 1',
    stationCode: 'OV-VAC-02',
    severity: 'WARNING',
    status: 'ACTIVE',
    timestamp: '12:50:00',
    date: '2026-09-08',
    runningModel: 'Model 504-2268',
    metricValue: 'Chamber Pressure: 0.8 Pa | Leak Rate: 0.08 mbar/min | Temp: 175°C',
    operatorId: 'Staff ID: 08453',
    targetScreen: 'vacuum-process',
    targetMachineId: 'oven-2',
    suggestedAction: 'Navigate to Vacuum Process view, inspect Chamber B seal door O-ring and vacuum solenoid valve.',
    rootCauseCandidate: 'Fluoropolymer seal ring wear or silicone particulate on flange surface.',
    historyTimeline: [
      { time: '12:50:00', note: 'Chamber pressure pull down slope degraded', actor: 'SCADA-VAC' }
    ]
  },
  {
    id: 'alt-fvmi-04-particle',
    code: 'ALT-FVMI-401',
    title: 'Top-Side Foreign Particle Contamination Exceeded',
    description: 'FVMI Station 04 automated visual classifier detected particle density exceeding cleanroom class 10,000 standard on panel batch slot 13:00.',
    category: 'FVMI',
    processLabel: 'Final Visual Inspection (FVMI)',
    machineId: 'FVMI-04',
    machineName: 'FVMI Station 04 (Line 4)',
    line: 'Line 4',
    stationCode: 'FVMI-04',
    severity: 'WARNING',
    status: 'INVESTIGATING',
    timestamp: '13:10:45',
    date: '2026-09-08',
    runningModel: 'Model 504-2154',
    metricValue: 'Particle NG: 5 units | Yield: 98.9% | Camera 2 Resolution: 12µm',
    operatorId: 'E4420',
    targetScreen: 'fvmi-detail',
    targetMachineId: 'FVMI-04',
    suggestedAction: 'Open FVMI Detail view, review top-side camera defect review images, verify ionizing blower air pressure.',
    rootCauseCandidate: 'Ionizer air nozzle filter clogged causing static particle attraction.',
    historyTimeline: [
      { time: '13:10:45', note: 'Defect category "Foreign Particle" crossed 4-unit limit', actor: 'FVMI-AI' },
      { time: '13:20:00', note: 'Line engineer investigating ionizer bars', actor: 'ENG-E1022' }
    ]
  },
  {
    id: 'alt-disp-06-align',
    code: 'ALT-DISP-601',
    title: 'Vision Alignment Offset Limit Exceeded (dX: +0.2mm)',
    description: 'Dispenser MC-06 fiducial pattern recognition camera reported position offset out of 0.15mm tolerance. Machine stopped pending purge and recalibration.',
    category: 'DISPENSING',
    processLabel: 'Fluid Dispensing Station',
    machineId: 'MC-06',
    machineName: 'MC-06 Dispenser (Line 6)',
    line: 'Line 6',
    stationCode: 'MC-06',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    timestamp: '11:42:15',
    date: '2026-09-08',
    runningModel: 'Model 504-2454',
    metricValue: 'Offset: dX +0.20mm, dY -0.10mm | Status: STOP',
    operatorId: 'OP-E3302',
    targetScreen: 'machine-detail',
    targetMachineId: 'MC-06',
    suggestedAction: 'Access MC-06 detail, perform automated fiducial mark optical teaching and execute needle calibration offset.',
    rootCauseCandidate: 'Conveyor board clamping rail mechanical backlash.',
    historyTimeline: [
      { time: '11:42:15', note: 'Fiducial teach offset exceeded limit (0.20mm > 0.15mm)', actor: 'VISION-SYS' }
    ]
  },
  {
    id: 'alt-bake-01-temp',
    code: 'ALT-BAKE-101',
    title: 'Thermal Soak Zone 2 Temperature Offset (+3.8°C)',
    description: 'Bake Oven #3 heating element zone 2 thermocouple feedback indicates slight positive deviation from target curing curve (150.0°C setpoint).',
    category: 'BAKE_OVEN',
    processLabel: 'Bake Curing Oven',
    machineId: 'oven-3',
    machineName: 'Bake Oven #3 (Line 4)',
    line: 'Line 4',
    stationCode: 'OV-BAKE-01',
    severity: 'ADVISORY',
    status: 'INVESTIGATING',
    timestamp: '14:05:00',
    date: '2026-09-08',
    runningModel: 'Model 504-2154',
    metricValue: 'Current Temp: 153.8°C (Setpoint: 150.0°C) | N2 Flow: 22 L/min',
    operatorId: 'Staff ID: 08455',
    targetScreen: 'bake-process',
    targetMachineId: 'oven-3',
    suggestedAction: 'Inspect Bake Process thermal telemetry graph and verify PID cooling blower cycle.',
    rootCauseCandidate: 'Exhaust damper butterfly valve position sticking at 85%.',
    historyTimeline: [
      { time: '14:05:00', note: 'Thermal soak curve exceeded +/- 3.0°C threshold band', actor: 'THERMAL-LOG' }
    ]
  },
  {
    id: 'alt-xray-05-filament',
    code: 'ALT-XRAY-501',
    title: 'Filament Current Routine Calibration Due (122 µA)',
    description: 'X-Ray Unit 05 tube filament run hours reached 1,200 hrs calibration threshold. Scheduled maintenance preventive check.',
    category: 'XRAY',
    processLabel: 'X-Ray NDT Radiography',
    machineId: 'X-RAY 05',
    machineName: 'X-Ray Unit 05 (Line 5)',
    line: 'Line 5',
    stationCode: 'XRAY-05',
    severity: 'INFO',
    status: 'RESOLVED',
    timestamp: '09:15:00',
    date: '2026-09-08',
    runningModel: 'Model 504-2454',
    metricValue: 'Filament: 122 µA | Radiation Shield: ENGAGED / SAFE (0.048 µSv/h)',
    operatorId: 'E9901',
    targetScreen: 'packout-xray',
    targetMachineId: 'X-RAY 05',
    suggestedAction: 'Log filament current calibration in equipment maintenance registry.',
    rootCauseCandidate: 'Routine preventive maintenance interval reached.',
    historyTimeline: [
      { time: '09:15:00', note: 'Preventive maintenance reminder triggered', actor: 'MAINT-SYS' },
      { time: '10:00:00', note: 'Technician completed tube focus alignment and logged sign-off', actor: 'TECH-E3101' }
    ]
  }
];

export const getSeverityBadge = (severity: AlertSeverity) => {
  switch (severity) {
    case 'CRITICAL':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        badgeBg: 'bg-rose-500',
        dotColor: 'bg-rose-500',
        iconColor: 'text-rose-600',
        label: 'CRITICAL'
      };
    case 'WARNING':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        badgeBg: 'bg-amber-500',
        dotColor: 'bg-amber-500',
        iconColor: 'text-amber-600',
        label: 'WARNING'
      };
    case 'ADVISORY':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-800',
        border: 'border-sky-200',
        badgeBg: 'bg-sky-500',
        dotColor: 'bg-sky-500',
        iconColor: 'text-sky-600',
        label: 'ADVISORY'
      };
    case 'INFO':
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        badgeBg: 'bg-slate-500',
        dotColor: 'bg-slate-400',
        iconColor: 'text-slate-600',
        label: 'INFO'
      };
  }
};

export const getCategoryBadge = (category: AlertProcessCategory) => {
  switch (category) {
    case 'XRAY':
      return { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-300', label: 'X-Ray NDT' };
    case 'AOI':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', label: 'AOI SMT' };
    case 'DISPENSING':
      return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', label: 'Dispensing' };
    case 'VACUUM_OVEN':
      return { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', label: 'Vacuum Oven' };
    case 'BAKE_OVEN':
      return { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', label: 'Bake Oven' };
    case 'FVMI':
      return { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300', label: 'FVMI Inspection' };
    case 'FACILITY':
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', label: 'Facility' };
  }
};
