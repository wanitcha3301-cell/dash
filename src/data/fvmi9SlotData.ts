import { MachineStatus } from '../types';
import { FVMIMachineHourlyData } from '../components/FVMIFleetMonitor';

export interface FvmiMachineSlotData {
  slotNumber: number; // 1 to 9
  machineId: string; // 'FVMI-01' to 'FVMI-09'
  name: string;
  line: string;
  processType: string;
  status: MachineStatus;
  downtimeReason?: string;
  operatorId: string;
  operatorName: string;
  uph: number;
  totalOutput: number;
  passCount: number;
  failCount: number;
  targetUph: number;
  yieldRate: number;
  runningModel: string;
  topModel: {
    modelId: string;
    modelName: string;
    quantity: number;
    percentage: number;
    rankLabelTh: string;
  };
  modelsRun: {
    modelId: string;
    modelName: string;
    quantity: number;
    percentage: number;
    volumeRank: 'highest' | 'medium' | 'lowest';
    volumeRankLabelTh: string;
    isHighest: boolean;
    color: string;
  }[];
  hourlyData: {
    hourShort: string;
    hour: string;
    actualPcs: number;
    targetPcs: number;
    passPcs: number;
    failPcs: number;
    yieldPercent: number;
    isHigh: boolean;
  }[];
}

export interface FvmiHourlyStationTelemetry {
  machineId: string;
  model: string;
  output: number;
  passCount: number;
  failCount: number;
  status: MachineStatus;
  yieldPercent: number;
}

export interface CombinedFvmiHourlyPoint {
  hourShort: string;
  hour: string;
  totalFleet: number; // Single line aggregate for all 9 machines
  targetFleet: number; // 9,900
  totalPass: number;
  totalFail: number;
  yieldPercent: number;
  topMostModelName: string;
  topMostModelOutput: number;
  machines: FvmiHourlyStationTelemetry[];
}

export const FVMI_HOURS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export const INITIAL_FVMI_9_SLOTS: FvmiMachineSlotData[] = [
  // 1. FVMI-01 (Line 01)
  {
    slotNumber: 1,
    machineId: 'FVMI-01',
    name: 'FVMI Station #1',
    line: 'Line 01',
    processType: '25MP Optical AOI',
    status: 'RUNNING',
    operatorId: 'OP-V0102',
    operatorName: 'Somchai Prasert',
    uph: 1140,
    totalOutput: 8940,
    passCount: 8825,
    failCount: 115,
    targetUph: 1100,
    yieldRate: 98.7,
    runningModel: 'MODEL 504-2187',
    topModel: {
      modelId: '504-2187',
      modelName: 'Model 504-2187 (Auto MCU)',
      quantity: 5360,
      percentage: 60.0,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Auto MCU)',
        quantity: 5360,
        percentage: 60.0,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#0284c7'
      },
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (Engine Control)',
        quantity: 2235,
        percentage: 25.0,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#059669'
      },
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Module)',
        quantity: 1345,
        percentage: 15.0,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        isHighest: false,
        color: '#8b5cf6'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 1090, targetPcs: 1100, passPcs: 1076, failPcs: 14, yieldPercent: 98.7, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 1145, targetPcs: 1100, passPcs: 1130, failPcs: 15, yieldPercent: 98.7, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 1130, targetPcs: 1100, passPcs: 1115, failPcs: 15, yieldPercent: 98.7, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 1160, targetPcs: 1100, passPcs: 1145, failPcs: 15, yieldPercent: 98.7, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 1120, targetPcs: 1100, passPcs: 1105, failPcs: 15, yieldPercent: 98.7, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 1050, targetPcs: 1100, passPcs: 1037, failPcs: 13, yieldPercent: 98.8, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 1150, targetPcs: 1100, passPcs: 1135, failPcs: 15, yieldPercent: 98.7, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 1180, targetPcs: 1100, passPcs: 1165, failPcs: 15, yieldPercent: 98.7, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 1115, targetPcs: 1100, passPcs: 1101, failPcs: 14, yieldPercent: 98.7, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 1120, targetPcs: 1100, passPcs: 1106, failPcs: 14, yieldPercent: 98.8, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 1100, targetPcs: 1100, passPcs: 1085, failPcs: 15, yieldPercent: 98.6, isHigh: false },
      { hourShort: '18:00', hour: '18:00 - 19:00', actualPcs: 1080, targetPcs: 1100, passPcs: 1065, failPcs: 15, yieldPercent: 98.6, isHigh: false }
    ]
  },

  // 2. FVMI-02 (Line 02)
  {
    slotNumber: 2,
    machineId: 'FVMI-02',
    name: 'FVMI Station #2',
    line: 'Line 02',
    processType: 'Top & Side Inspection',
    status: 'RUNNING',
    operatorId: 'OP-V0204',
    operatorName: 'Apinya Suksom',
    uph: 1120,
    totalOutput: 8780,
    passCount: 8685,
    failCount: 95,
    targetUph: 1100,
    yieldRate: 98.9,
    runningModel: 'MODEL 504-2268',
    topModel: {
      modelId: '504-2268',
      modelName: 'Model 504-2268 (Engine Control)',
      quantity: 5700,
      percentage: 64.9,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (Engine Control)',
        quantity: 5700,
        percentage: 64.9,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#059669'
      },
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Auto MCU)',
        quantity: 2100,
        percentage: 23.9,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#0284c7'
      },
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Smart Sensor)',
        quantity: 980,
        percentage: 11.2,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        isHighest: false,
        color: '#d97706'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 1080, targetPcs: 1100, passPcs: 1068, failPcs: 12, yieldPercent: 98.9, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 1120, targetPcs: 1100, passPcs: 1108, failPcs: 12, yieldPercent: 98.9, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 1140, targetPcs: 1100, passPcs: 1128, failPcs: 12, yieldPercent: 98.9, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 1110, targetPcs: 1100, passPcs: 1098, failPcs: 12, yieldPercent: 98.9, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 1135, targetPcs: 1100, passPcs: 1123, failPcs: 12, yieldPercent: 98.9, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 1020, targetPcs: 1100, passPcs: 1009, failPcs: 11, yieldPercent: 98.9, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 1150, targetPcs: 1100, passPcs: 1138, failPcs: 12, yieldPercent: 99.0, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 1160, targetPcs: 1100, passPcs: 1148, failPcs: 12, yieldPercent: 99.0, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 1125, targetPcs: 1100, passPcs: 1113, failPcs: 12, yieldPercent: 98.9, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 1110, targetPcs: 1100, passPcs: 1098, failPcs: 12, yieldPercent: 98.9, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 1090, targetPcs: 1100, passPcs: 1078, failPcs: 12, yieldPercent: 98.9, isHigh: false },
      { hourShort: '18:00', hour: '18:00 - 19:00', actualPcs: 1070, targetPcs: 1100, passPcs: 1058, failPcs: 12, yieldPercent: 98.9, isHigh: false }
    ]
  },

  // 3. FVMI-03 (Line 03)
  {
    slotNumber: 3,
    machineId: 'FVMI-03',
    name: 'FVMI Station #3',
    line: 'Line 03',
    processType: '3D Optical AOI',
    status: 'RUNNING',
    operatorId: 'OP-V0312',
    operatorName: 'Tanawat Kittichai',
    uph: 1090,
    totalOutput: 8560,
    passCount: 8430,
    failCount: 130,
    targetUph: 1100,
    yieldRate: 98.5,
    runningModel: 'MODEL 504-2154',
    topModel: {
      modelId: '504-2154',
      modelName: 'Model 504-2154 (RF Module)',
      quantity: 4980,
      percentage: 58.2,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Module)',
        quantity: 4980,
        percentage: 58.2,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#8b5cf6'
      },
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Smart Sensor)',
        quantity: 2420,
        percentage: 28.3,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#d97706'
      },
      {
        modelId: '504-2454',
        modelName: 'Model 504-2454 (Power Inverter)',
        quantity: 1160,
        percentage: 13.5,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        isHighest: false,
        color: '#e11d48'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 1050, targetPcs: 1100, passPcs: 1034, failPcs: 16, yieldPercent: 98.5, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 1110, targetPcs: 1100, passPcs: 1093, failPcs: 17, yieldPercent: 98.5, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 1120, targetPcs: 1100, passPcs: 1103, failPcs: 17, yieldPercent: 98.5, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 1080, targetPcs: 1100, passPcs: 1064, failPcs: 16, yieldPercent: 98.5, isHigh: false },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 1115, targetPcs: 1100, passPcs: 1098, failPcs: 17, yieldPercent: 98.5, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 990, targetPcs: 1100, passPcs: 975, failPcs: 15, yieldPercent: 98.5, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 1130, targetPcs: 1100, passPcs: 1113, failPcs: 17, yieldPercent: 98.5, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 1140, targetPcs: 1100, passPcs: 1123, failPcs: 17, yieldPercent: 98.5, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 1095, targetPcs: 1100, passPcs: 1079, failPcs: 16, yieldPercent: 98.5, isHigh: false },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 1100, targetPcs: 1100, passPcs: 1084, failPcs: 16, yieldPercent: 98.5, isHigh: false },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 1080, targetPcs: 1100, passPcs: 1064, failPcs: 16, yieldPercent: 98.5, isHigh: false },
      { hourShort: '18:00', hour: '18:00 - 19:00', actualPcs: 1050, targetPcs: 1100, passPcs: 1034, failPcs: 16, yieldPercent: 98.5, isHigh: false }
    ]
  },

  // 4. FVMI-04 (Line 04)
  {
    slotNumber: 4,
    machineId: 'FVMI-04',
    name: 'FVMI Station #4',
    line: 'Line 04',
    processType: 'Telecentric AOI',
    status: 'RUNNING',
    operatorId: 'OP-V0408',
    operatorName: 'Kittisak Manotham',
    uph: 1150,
    totalOutput: 9020,
    passCount: 8935,
    failCount: 85,
    targetUph: 1100,
    yieldRate: 99.1,
    runningModel: 'MODEL 504-2224',
    topModel: {
      modelId: '504-2224',
      modelName: 'Model 504-2224 (Smart Sensor)',
      quantity: 6100,
      percentage: 67.6,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Smart Sensor)',
        quantity: 6100,
        percentage: 67.6,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#d97706'
      },
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Auto MCU)',
        quantity: 1950,
        percentage: 21.6,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#0284c7'
      },
      {
        modelId: '504-2090',
        modelName: 'Model 504-2090 (BCU Module)',
        quantity: 970,
        percentage: 10.8,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        isHighest: false,
        color: '#4f46e5'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 1100, targetPcs: 1100, passPcs: 1090, failPcs: 10, yieldPercent: 99.1, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 1150, targetPcs: 1100, passPcs: 1139, failPcs: 11, yieldPercent: 99.0, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 1165, targetPcs: 1100, passPcs: 1154, failPcs: 11, yieldPercent: 99.1, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 1170, targetPcs: 1100, passPcs: 1159, failPcs: 11, yieldPercent: 99.1, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 1140, targetPcs: 1100, passPcs: 1130, failPcs: 10, yieldPercent: 99.1, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 1060, targetPcs: 1100, passPcs: 1050, failPcs: 10, yieldPercent: 99.1, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 1160, targetPcs: 1100, passPcs: 1149, failPcs: 11, yieldPercent: 99.1, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 1175, targetPcs: 1100, passPcs: 1164, failPcs: 11, yieldPercent: 99.1, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 1130, targetPcs: 1100, passPcs: 1120, failPcs: 10, yieldPercent: 99.1, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 1120, targetPcs: 1100, passPcs: 1110, failPcs: 10, yieldPercent: 99.1, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 1110, targetPcs: 1100, passPcs: 1100, failPcs: 10, yieldPercent: 99.1, isHigh: true },
      { hourShort: '18:00', hour: '18:00 - 19:00', actualPcs: 1090, targetPcs: 1100, passPcs: 1080, failPcs: 10, yieldPercent: 99.1, isHigh: false }
    ]
  },

  // 5. FVMI-05 (Line 05)
  {
    slotNumber: 5,
    machineId: 'FVMI-05',
    name: 'FVMI Station #5',
    line: 'Line 05',
    processType: 'High-Speed Dual Matrix',
    status: 'RUNNING',
    operatorId: 'OP-V0515',
    operatorName: 'Natthaporn Ruangdet',
    uph: 1130,
    totalOutput: 8850,
    passCount: 8740,
    failCount: 110,
    targetUph: 1100,
    yieldRate: 98.8,
    runningModel: 'MODEL 504-2454',
    topModel: {
      modelId: '504-2454',
      modelName: 'Model 504-2454 (Power Inverter)',
      quantity: 5200,
      percentage: 58.8,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2454',
        modelName: 'Model 504-2454 (Power Inverter)',
        quantity: 5200,
        percentage: 58.8,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#e11d48'
      },
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (Engine Control)',
        quantity: 2350,
        percentage: 26.5,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#059669'
      },
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Auto MCU)',
        quantity: 1300,
        percentage: 14.7,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        isHighest: false,
        color: '#0284c7'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 1080, targetPcs: 1100, passPcs: 1067, failPcs: 13, yieldPercent: 98.8, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 1130, targetPcs: 1100, passPcs: 1116, failPcs: 14, yieldPercent: 98.8, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 1145, targetPcs: 1100, passPcs: 1131, failPcs: 14, yieldPercent: 98.8, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 1135, targetPcs: 1100, passPcs: 1121, failPcs: 14, yieldPercent: 98.8, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 1125, targetPcs: 1100, passPcs: 1111, failPcs: 14, yieldPercent: 98.8, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 1040, targetPcs: 1100, passPcs: 1027, failPcs: 13, yieldPercent: 98.8, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 1150, targetPcs: 1100, passPcs: 1136, failPcs: 14, yieldPercent: 98.8, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 1155, targetPcs: 1100, passPcs: 1141, failPcs: 14, yieldPercent: 98.8, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 1110, targetPcs: 1100, passPcs: 1097, failPcs: 13, yieldPercent: 98.8, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 1105, targetPcs: 1100, passPcs: 1092, failPcs: 13, yieldPercent: 98.8, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 1090, targetPcs: 1100, passPcs: 1077, failPcs: 13, yieldPercent: 98.8, isHigh: false },
      { hourShort: '18:00', hour: '18:00 - 19:00', actualPcs: 1070, targetPcs: 1100, passPcs: 1057, failPcs: 13, yieldPercent: 98.8, isHigh: false }
    ]
  },

  // 6. FVMI-06 (Line 06 Bay A)
  {
    slotNumber: 6,
    machineId: 'FVMI-06',
    name: 'FVMI Station #6',
    line: 'Line 06 (Bay A)',
    processType: '25MP Optical AOI',
    status: 'RUNNING',
    operatorId: 'OP-V0621',
    operatorName: 'Prasert Thongdee',
    uph: 1115,
    totalOutput: 8710,
    passCount: 8605,
    failCount: 105,
    targetUph: 1100,
    yieldRate: 98.8,
    runningModel: 'MODEL 504-2090',
    topModel: {
      modelId: '504-2090',
      modelName: 'Model 504-2090 (BCU Module)',
      quantity: 5120,
      percentage: 58.8,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2090',
        modelName: 'Model 504-2090 (BCU Module)',
        quantity: 5120,
        percentage: 58.8,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#4f46e5'
      },
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Module)',
        quantity: 2190,
        percentage: 25.1,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#8b5cf6'
      },
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Smart Sensor)',
        quantity: 1400,
        percentage: 16.1,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        isHighest: false,
        color: '#d97706'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 1070, targetPcs: 1100, passPcs: 1057, failPcs: 13, yieldPercent: 98.8, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 1120, targetPcs: 1100, passPcs: 1106, failPcs: 14, yieldPercent: 98.8, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 1130, targetPcs: 1100, passPcs: 1116, failPcs: 14, yieldPercent: 98.8, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 1115, targetPcs: 1100, passPcs: 1102, failPcs: 13, yieldPercent: 98.8, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 1120, targetPcs: 1100, passPcs: 1107, failPcs: 13, yieldPercent: 98.8, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 1010, targetPcs: 1100, passPcs: 998, failPcs: 12, yieldPercent: 98.8, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 1140, targetPcs: 1100, passPcs: 1126, failPcs: 14, yieldPercent: 98.8, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 1145, targetPcs: 1100, passPcs: 1131, failPcs: 14, yieldPercent: 98.8, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 1100, targetPcs: 1100, passPcs: 1087, failPcs: 13, yieldPercent: 98.8, isHigh: false },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 1090, targetPcs: 1100, passPcs: 1077, failPcs: 13, yieldPercent: 98.8, isHigh: false },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 1080, targetPcs: 1100, passPcs: 1067, failPcs: 13, yieldPercent: 98.8, isHigh: false },
      { hourShort: '18:00', hour: '18:00 - 19:00', actualPcs: 1060, targetPcs: 1100, passPcs: 1047, failPcs: 13, yieldPercent: 98.8, isHigh: false }
    ]
  },

  // 7. FVMI-07 (Line 06 Bay B)
  {
    slotNumber: 7,
    machineId: 'FVMI-07',
    name: 'FVMI Station #7',
    line: 'Line 06 (Bay B)',
    processType: 'Dual Matrix Inspector',
    status: 'RUNNING',
    operatorId: 'OP-V0703',
    operatorName: 'Wichai Damrong',
    uph: 1105,
    totalOutput: 8640,
    passCount: 8520,
    failCount: 120,
    targetUph: 1100,
    yieldRate: 98.6,
    runningModel: 'MODEL 504-2090',
    topModel: {
      modelId: '504-2090',
      modelName: 'Model 504-2090 (BCU Module)',
      quantity: 4850,
      percentage: 56.1,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2090',
        modelName: 'Model 504-2090 (BCU Module)',
        quantity: 4850,
        percentage: 56.1,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#4f46e5'
      },
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Auto MCU)',
        quantity: 2430,
        percentage: 28.1,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#0284c7'
      },
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (Engine Control)',
        quantity: 1360,
        percentage: 15.8,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        isHighest: false,
        color: '#059669'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 1060, targetPcs: 1100, passPcs: 1045, failPcs: 15, yieldPercent: 98.6, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 1115, targetPcs: 1100, passPcs: 1100, failPcs: 15, yieldPercent: 98.7, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 1120, targetPcs: 1100, passPcs: 1104, failPcs: 16, yieldPercent: 98.6, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 1110, targetPcs: 1100, passPcs: 1095, failPcs: 15, yieldPercent: 98.6, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 1115, targetPcs: 1100, passPcs: 1100, failPcs: 15, yieldPercent: 98.7, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 1000, targetPcs: 1100, passPcs: 986, failPcs: 14, yieldPercent: 98.6, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 1135, targetPcs: 1100, passPcs: 1119, failPcs: 16, yieldPercent: 98.6, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 1140, targetPcs: 1100, passPcs: 1124, failPcs: 16, yieldPercent: 98.6, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 1090, targetPcs: 1100, passPcs: 1075, failPcs: 15, yieldPercent: 98.6, isHigh: false },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 1085, targetPcs: 1100, passPcs: 1070, failPcs: 15, yieldPercent: 98.6, isHigh: false },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 1075, targetPcs: 1100, passPcs: 1060, failPcs: 15, yieldPercent: 98.6, isHigh: false },
      { hourShort: '18:00', hour: '18:00 - 19:00', actualPcs: 1050, targetPcs: 1100, passPcs: 1035, failPcs: 15, yieldPercent: 98.6, isHigh: false }
    ]
  },

  // 8. FVMI-08 (Line 06 Bay C)
  {
    slotNumber: 8,
    machineId: 'FVMI-08',
    name: 'FVMI Station #8',
    line: 'Line 06 (Bay C)',
    processType: '3D Optical Defect Analyzer',
    status: 'RUNNING',
    operatorId: 'OP-V0811',
    operatorName: 'Siriporn Jaturon',
    uph: 1125,
    totalOutput: 8810,
    passCount: 8715,
    failCount: 95,
    targetUph: 1100,
    yieldRate: 98.9,
    runningModel: 'MODEL 504-2187',
    topModel: {
      modelId: '504-2187',
      modelName: 'Model 504-2187 (Auto MCU)',
      quantity: 5600,
      percentage: 63.6,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Auto MCU)',
        quantity: 5600,
        percentage: 63.6,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#0284c7'
      },
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Smart Sensor)',
        quantity: 2150,
        percentage: 24.4,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#d97706'
      },
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Module)',
        quantity: 1060,
        percentage: 12.0,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        isHighest: false,
        color: '#8b5cf6'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 1080, targetPcs: 1100, passPcs: 1068, failPcs: 12, yieldPercent: 98.9, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 1130, targetPcs: 1100, passPcs: 1118, failPcs: 12, yieldPercent: 98.9, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 1140, targetPcs: 1100, passPcs: 1128, failPcs: 12, yieldPercent: 98.9, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 1125, targetPcs: 1100, passPcs: 1113, failPcs: 12, yieldPercent: 98.9, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 1135, targetPcs: 1100, passPcs: 1123, failPcs: 12, yieldPercent: 98.9, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 1030, targetPcs: 1100, passPcs: 1019, failPcs: 11, yieldPercent: 98.9, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 1150, targetPcs: 1100, passPcs: 1138, failPcs: 12, yieldPercent: 99.0, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 1160, targetPcs: 1100, passPcs: 1148, failPcs: 12, yieldPercent: 99.0, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 1115, targetPcs: 1100, passPcs: 1103, failPcs: 12, yieldPercent: 98.9, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 1100, targetPcs: 1100, passPcs: 1088, failPcs: 12, yieldPercent: 98.9, isHigh: false },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 1090, targetPcs: 1100, passPcs: 1078, failPcs: 12, yieldPercent: 98.9, isHigh: false },
      { hourShort: '18:00', hour: '18:00 - 19:00', actualPcs: 1065, targetPcs: 1100, passPcs: 1053, failPcs: 12, yieldPercent: 98.9, isHigh: false }
    ]
  },

  // 9. FVMI-09 (Line 06 Bay D)
  {
    slotNumber: 9,
    machineId: 'FVMI-09',
    name: 'FVMI Station #9',
    line: 'Line 06 (Bay D)',
    processType: 'Telecentric AOI',
    status: 'RUNNING',
    operatorId: 'OP-V0918',
    operatorName: 'Anan Charoensuk',
    uph: 1135,
    totalOutput: 8890,
    passCount: 8790,
    failCount: 100,
    targetUph: 1100,
    yieldRate: 98.9,
    runningModel: 'MODEL 504-2454',
    topModel: {
      modelId: '504-2454',
      modelName: 'Model 504-2454 (Power Inverter)',
      quantity: 5800,
      percentage: 65.2,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2454',
        modelName: 'Model 504-2454 (Power Inverter)',
        quantity: 5800,
        percentage: 65.2,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#e11d48'
      },
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Auto MCU)',
        quantity: 1950,
        percentage: 21.9,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#0284c7'
      },
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (Engine Control)',
        quantity: 1140,
        percentage: 12.8,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        isHighest: false,
        color: '#059669'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 1090, targetPcs: 1100, passPcs: 1078, failPcs: 12, yieldPercent: 98.9, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 1140, targetPcs: 1100, passPcs: 1127, failPcs: 13, yieldPercent: 98.9, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 1150, targetPcs: 1100, passPcs: 1137, failPcs: 13, yieldPercent: 98.9, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 1135, targetPcs: 1100, passPcs: 1122, failPcs: 13, yieldPercent: 98.9, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 1145, targetPcs: 1100, passPcs: 1132, failPcs: 13, yieldPercent: 98.9, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 1045, targetPcs: 1100, passPcs: 1033, failPcs: 12, yieldPercent: 98.9, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 1160, targetPcs: 1100, passPcs: 1147, failPcs: 13, yieldPercent: 98.9, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 1165, targetPcs: 1100, passPcs: 1152, failPcs: 13, yieldPercent: 98.9, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 1120, targetPcs: 1100, passPcs: 1107, failPcs: 13, yieldPercent: 98.8, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 1110, targetPcs: 1100, passPcs: 1097, failPcs: 13, yieldPercent: 98.8, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 1095, targetPcs: 1100, passPcs: 1082, failPcs: 13, yieldPercent: 98.8, isHigh: false },
      { hourShort: '18:00', hour: '18:00 - 19:00', actualPcs: 1070, targetPcs: 1100, passPcs: 1058, failPcs: 12, yieldPercent: 98.9, isHigh: false }
    ]
  }
];

/**
 * Single Unified Fleet Graph calculation for 9 machines
 */
export function getCombinedFvmiHourlyFleet(slots: FvmiMachineSlotData[]): CombinedFvmiHourlyPoint[] {
  return FVMI_HOURS.map((hourShort) => {
    let totalFleet = 0;
    let totalPass = 0;
    let totalFail = 0;
    const modelCounts: Record<string, number> = {};

    const machineTelemetries: FvmiHourlyStationTelemetry[] = slots.map((slot) => {
      const hData = slot.hourlyData.find((h) => h.hourShort === hourShort);
      const actual = hData ? hData.actualPcs : 0;
      const pass = hData ? hData.passPcs : 0;
      const fail = hData ? hData.failPcs : 0;

      totalFleet += actual;
      totalPass += pass;
      totalFail += fail;

      const model = slot.runningModel || 'MODEL 504-2187';
      modelCounts[model] = (modelCounts[model] || 0) + actual;

      return {
        machineId: slot.machineId,
        model,
        output: actual,
        passCount: pass,
        failCount: fail,
        status: slot.status,
        yieldPercent: actual > 0 ? Number(((pass / actual) * 100).toFixed(1)) : 100
      };
    });

    // Find which model has the highest output in this hour across all 9 machines
    let topMostModelName = 'MODEL 504-2187';
    let topMostModelOutput = 0;
    Object.entries(modelCounts).forEach(([mName, count]) => {
      if (count > topMostModelOutput) {
        topMostModelOutput = count;
        topMostModelName = mName;
      }
    });

    const yieldPercent = totalFleet > 0 ? Number(((totalPass / totalFleet) * 100).toFixed(2)) : 100;

    return {
      hourShort,
      hour: `${hourShort} - ${String(Number(hourShort.split(':')[0]) + 1).padStart(2, '0')}:00`,
      totalFleet,
      targetFleet: 9900, // 9 x 1,100
      totalPass,
      totalFail,
      yieldPercent,
      topMostModelName,
      topMostModelOutput,
      machines: machineTelemetries
    };
  });
}

/**
 * Sync dynamic changes from live FVMIMachineHourlyData array into 9 slot structures
 */
export function syncFvmiSlotsWithLiveFleet(
  baseSlots: FvmiMachineSlotData[],
  liveFleet: FVMIMachineHourlyData[]
): FvmiMachineSlotData[] {
  return baseSlots.map((slot) => {
    const live = liveFleet.find((m) => m.id === slot.machineId);
    if (!live) return slot;

    const currentLiveModel = live.runningModel || slot.runningModel;
    const isModelMatching = slot.modelsRun.some((m) => currentLiveModel.includes(m.modelId));

    let updatedModels = [...slot.modelsRun];
    if (!isModelMatching && currentLiveModel) {
      const newModelId = currentLiveModel.replace('MODEL ', '').replace('Model ', '').split(' ')[0];
      const primaryCount = Math.round(slot.totalOutput * 0.7);
      const secondaryCount = Math.max(0, slot.totalOutput - primaryCount);

      updatedModels = [
        {
          modelId: newModelId,
          modelName: `Model ${newModelId} (Active Inspection)`,
          quantity: primaryCount,
          percentage: 70.0,
          volumeRank: 'highest',
          volumeRankLabelTh: 'Highest',
          isHighest: true,
          color: '#0284c7'
        },
        {
          modelId: '504-2187',
          modelName: 'Model 504-2187 (Secondary Batch)',
          quantity: secondaryCount,
          percentage: 30.0,
          volumeRank: 'medium',
          volumeRankLabelTh: 'Medium',
          isHighest: false,
          color: '#cbd5e1'
        }
      ];
    }

    const topModelEntry = updatedModels.find((m) => m.isHighest) || updatedModels[0];

    // Compute live slot totals from live.hourlyData if present
    const liveTotalInput = live.hourlyData && live.hourlyData.length > 0
      ? live.hourlyData.reduce((sum, h) => sum + h.actualIn, 0)
      : slot.totalOutput;

    const livePassCount = live.hourlyData && live.hourlyData.length > 0
      ? live.hourlyData.reduce((sum, h) => sum + h.passCount, 0)
      : slot.passCount;

    const liveFailCount = live.hourlyData && live.hourlyData.length > 0
      ? live.hourlyData.reduce((sum, h) => sum + h.failCount, 0)
      : slot.failCount;

    const liveYield = liveTotalInput > 0
      ? Number(((livePassCount / liveTotalInput) * 100).toFixed(1))
      : slot.yieldRate;

    return {
      ...slot,
      status: live.status,
      downtimeReason: live.downtimeReason || slot.downtimeReason,
      uph: live.status === 'STOP' ? 0 : (live.hourlyData?.[live.hourlyData.length - 1]?.actualIn || slot.uph),
      totalOutput: liveTotalInput,
      passCount: livePassCount,
      failCount: liveFailCount,
      yieldRate: liveYield,
      runningModel: currentLiveModel,
      topModel: {
        modelId: topModelEntry.modelId,
        modelName: topModelEntry.modelName,
        quantity: topModelEntry.quantity,
        percentage: topModelEntry.percentage,
        rankLabelTh: topModelEntry.volumeRankLabelTh
      },
      modelsRun: updatedModels
    };
  });
}
