import { Machine, MachineStatus } from '../types';
import { MachineRunSummary, ModelRunDetail, LotRunRecord } from './machineModelData';

export interface DispensingMachineSlotData {
  slotNumber: number; // 1 to 13
  machineId: string; // MC-01 to MC-13
  name: string;
  line: string;
  processType: 'Top Fill' | 'Under Fill';
  status: MachineStatus;
  downtimeReason?: string;
  operatorId: string;
  uph: number;
  totalOutput: number;
  targetUph: number;
  yieldRate: number;
  glueType: string;
  syringeRemainingMins: number;
  syringeLevelPercent: number;
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
    efficiencyPercent: number;
    isHigh: boolean;
  }[];
}

export const DISPENSING_HOURS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

/**
 * Base data definition for 13 dispensing machines
 */
export const INITIAL_DISPENSING_SLOTS: DispensingMachineSlotData[] = [
  // 1. MC-01 (Top Fill, Line 01)
  {
    slotNumber: 1,
    machineId: 'MC-01',
    name: 'Dispenser MC-01',
    line: 'Line 01',
    processType: 'Top Fill',
    status: 'RUNNING',
    operatorId: 'OP-T1001 (Somkid J.)',
    uph: 950,
    totalOutput: 1075,
    targetUph: 1000,
    yieldRate: 99.5,
    glueType: 'U8410-405',
    syringeRemainingMins: 112,
    syringeLevelPercent: 62,
    runningModel: 'MODEL 504-2224',
    topModel: {
      modelId: '504-2224',
      modelName: 'Model 504-2224 (Auto MCU)',
      quantity: 750,
      percentage: 69.8,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Auto MCU)',
        quantity: 750,
        percentage: 69.8,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#0284c7'
      },
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Module)',
        quantity: 215,
        percentage: 20.0,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#38bdf8'
      },
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        quantity: 110,
        percentage: 10.2,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        isHighest: false,
        color: '#94a3b8'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 88, targetPcs: 95, efficiencyPercent: 92.6, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 96, targetPcs: 95, efficiencyPercent: 101.0, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 102, targetPcs: 95, efficiencyPercent: 107.3, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 105, targetPcs: 95, efficiencyPercent: 110.5, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 98, targetPcs: 95, efficiencyPercent: 103.1, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 84, targetPcs: 95, efficiencyPercent: 88.4, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 106, targetPcs: 95, efficiencyPercent: 111.5, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 108, targetPcs: 95, efficiencyPercent: 113.6, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 110, targetPcs: 95, efficiencyPercent: 115.7, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 98, targetPcs: 95, efficiencyPercent: 103.1, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 80, targetPcs: 95, efficiencyPercent: 84.2, isHigh: false }
    ]
  },

  // 2. MC-02 (Top Fill, Line 01)
  {
    slotNumber: 2,
    machineId: 'MC-02',
    name: 'Dispenser MC-02',
    line: 'Line 01',
    processType: 'Top Fill',
    status: 'RUNNING',
    operatorId: 'OP-T1002 (Kamonrat N.)',
    uph: 970,
    totalOutput: 1148,
    targetUph: 1000,
    yieldRate: 99.8,
    glueType: 'U8410-405',
    syringeRemainingMins: 120,
    syringeLevelPercent: 67,
    runningModel: 'MODEL 504-2224',
    topModel: {
      modelId: '504-2224',
      modelName: 'Model 504-2224 (Auto MCU)',
      quantity: 860,
      percentage: 74.9,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Auto MCU)',
        quantity: 860,
        percentage: 74.9,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#0284c7'
      },
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (WiFi Comm)',
        quantity: 288,
        percentage: 25.1,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#38bdf8'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 95, targetPcs: 98, efficiencyPercent: 96.9, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 104, targetPcs: 98, efficiencyPercent: 106.1, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 110, targetPcs: 98, efficiencyPercent: 112.2, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 112, targetPcs: 98, efficiencyPercent: 114.2, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 105, targetPcs: 98, efficiencyPercent: 107.1, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 92, targetPcs: 98, efficiencyPercent: 93.8, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 114, targetPcs: 98, efficiencyPercent: 116.3, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 116, targetPcs: 98, efficiencyPercent: 118.3, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 115, targetPcs: 98, efficiencyPercent: 117.3, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 100, targetPcs: 98, efficiencyPercent: 102.0, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 85, targetPcs: 98, efficiencyPercent: 86.7, isHigh: false }
    ]
  },

  // 3. MC-03 (Top Fill, Line 02)
  {
    slotNumber: 3,
    machineId: 'MC-03',
    name: 'Dispenser MC-03',
    line: 'Line 02',
    processType: 'Top Fill',
    status: 'STOP',
    downtimeReason: 'Sensor Calibration',
    operatorId: 'OP-T1003 (Chaiwat B.)',
    uph: 0,
    totalOutput: 580,
    targetUph: 1000,
    yieldRate: 96.6,
    glueType: 'U8410-405',
    syringeRemainingMins: 30,
    syringeLevelPercent: 18,
    runningModel: 'MODEL 504-2268',
    topModel: {
      modelId: '504-2268',
      modelName: 'Model 504-2268 (WiFi Comm)',
      quantity: 370,
      percentage: 63.8,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (WiFi Comm)',
        quantity: 370,
        percentage: 63.8,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#0284c7'
      },
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        quantity: 210,
        percentage: 36.2,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#38bdf8'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 85, targetPcs: 90, efficiencyPercent: 94.4, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 92, targetPcs: 90, efficiencyPercent: 102.2, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 95, targetPcs: 90, efficiencyPercent: 105.5, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 98, targetPcs: 90, efficiencyPercent: 108.8, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 88, targetPcs: 90, efficiencyPercent: 97.7, isHigh: false },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 78, targetPcs: 90, efficiencyPercent: 86.6, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 44, targetPcs: 90, efficiencyPercent: 48.8, isHigh: false },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 0, targetPcs: 90, efficiencyPercent: 0, isHigh: false },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 0, targetPcs: 90, efficiencyPercent: 0, isHigh: false },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 0, targetPcs: 90, efficiencyPercent: 0, isHigh: false },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 0, targetPcs: 90, efficiencyPercent: 0, isHigh: false }
    ]
  },

  // 4. MC-04 (Top Fill, Line 02)
  {
    slotNumber: 4,
    machineId: 'MC-04',
    name: 'Dispenser MC-04',
    line: 'Line 02',
    processType: 'Top Fill',
    status: 'RUNNING',
    operatorId: 'OP-T1004 (Preecha S.)',
    uph: 940,
    totalOutput: 1095,
    targetUph: 1000,
    yieldRate: 99.5,
    glueType: 'U8410-405',
    syringeRemainingMins: 150,
    syringeLevelPercent: 83,
    runningModel: 'MODEL 504-2154',
    topModel: {
      modelId: '504-2154',
      modelName: 'Model 504-2154 (RF Module)',
      quantity: 720,
      percentage: 65.8,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Module)',
        quantity: 720,
        percentage: 65.8,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#0284c7'
      },
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Auto MCU)',
        quantity: 375,
        percentage: 34.2,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#38bdf8'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 90, targetPcs: 95, efficiencyPercent: 94.7, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 98, targetPcs: 95, efficiencyPercent: 103.1, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 104, targetPcs: 95, efficiencyPercent: 109.4, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 108, targetPcs: 95, efficiencyPercent: 113.6, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 100, targetPcs: 95, efficiencyPercent: 105.2, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 86, targetPcs: 95, efficiencyPercent: 90.5, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 108, targetPcs: 95, efficiencyPercent: 113.6, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 110, targetPcs: 95, efficiencyPercent: 115.7, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 112, targetPcs: 95, efficiencyPercent: 117.8, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 99, targetPcs: 95, efficiencyPercent: 104.2, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 80, targetPcs: 95, efficiencyPercent: 84.2, isHigh: false }
    ]
  },

  // 5. MC-05 (Under Fill / Bot, Line 03)
  {
    slotNumber: 5,
    machineId: 'MC-05',
    name: 'Dispenser MC-05',
    line: 'Line 03',
    processType: 'Under Fill',
    status: 'RUNNING',
    operatorId: 'OP-E7721 (Niran K.)',
    uph: 942,
    totalOutput: 1102,
    targetUph: 1000,
    yieldRate: 99.7,
    glueType: 'U8410-405',
    syringeRemainingMins: 112,
    syringeLevelPercent: 62,
    runningModel: 'MODEL 504-2224',
    topModel: {
      modelId: '504-2224',
      modelName: 'Model 504-2224 (Auto MCU)',
      quantity: 640,
      percentage: 58.1,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Auto MCU)',
        quantity: 640,
        percentage: 58.1,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#6366f1'
      },
      {
        modelId: '504-2454',
        modelName: 'Model 504-2454 (Server Core)',
        quantity: 330,
        percentage: 29.9,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#a855f7'
      },
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Module)',
        quantity: 132,
        percentage: 12.0,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        isHighest: false,
        color: '#cbd5e1'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 89, targetPcs: 95, efficiencyPercent: 93.6, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 99, targetPcs: 95, efficiencyPercent: 104.2, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 105, targetPcs: 95, efficiencyPercent: 110.5, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 108, targetPcs: 95, efficiencyPercent: 113.6, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 100, targetPcs: 95, efficiencyPercent: 105.2, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 85, targetPcs: 95, efficiencyPercent: 89.4, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 110, targetPcs: 95, efficiencyPercent: 115.7, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 112, targetPcs: 95, efficiencyPercent: 117.8, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 114, targetPcs: 95, efficiencyPercent: 120.0, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 100, targetPcs: 95, efficiencyPercent: 105.2, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 80, targetPcs: 95, efficiencyPercent: 84.2, isHigh: false }
    ]
  },

  // 6. MC-06 (Under Fill / Bot, Line 03)
  {
    slotNumber: 6,
    machineId: 'MC-06',
    name: 'Dispenser MC-06',
    line: 'Line 03',
    processType: 'Under Fill',
    status: 'STOP',
    downtimeReason: 'Nozzle Clean Required',
    operatorId: 'OP-E3302 (Thanakorn M.)',
    uph: 0,
    totalOutput: 510,
    targetUph: 1000,
    yieldRate: 98.1,
    glueType: 'U8410-405',
    syringeRemainingMins: 15,
    syringeLevelPercent: 8,
    runningModel: 'MODEL 504-2187',
    topModel: {
      modelId: '504-2187',
      modelName: 'Model 504-2187 (Logic Core)',
      quantity: 410,
      percentage: 80.4,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        quantity: 410,
        percentage: 80.4,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#6366f1'
      },
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (WiFi Comm)',
        quantity: 100,
        percentage: 19.6,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#a855f7'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 80, targetPcs: 85, efficiencyPercent: 94.1, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 88, targetPcs: 85, efficiencyPercent: 103.5, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 92, targetPcs: 85, efficiencyPercent: 108.2, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 95, targetPcs: 85, efficiencyPercent: 111.7, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 85, targetPcs: 85, efficiencyPercent: 100.0, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 70, targetPcs: 85, efficiencyPercent: 82.3, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 0, targetPcs: 85, efficiencyPercent: 0, isHigh: false },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 0, targetPcs: 85, efficiencyPercent: 0, isHigh: false },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 0, targetPcs: 85, efficiencyPercent: 0, isHigh: false },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 0, targetPcs: 85, efficiencyPercent: 0, isHigh: false },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 0, targetPcs: 85, efficiencyPercent: 0, isHigh: false }
    ]
  },

  // 7. MC-07 (Under Fill / Bot, Line 04)
  {
    slotNumber: 7,
    machineId: 'MC-07',
    name: 'Dispenser MC-07',
    line: 'Line 04',
    processType: 'Under Fill',
    status: 'RUNNING',
    operatorId: 'OP-E5501 (Wichan P.)',
    uph: 960,
    totalOutput: 1135,
    targetUph: 1000,
    yieldRate: 99.6,
    glueType: 'U8410-405',
    syringeRemainingMins: 200,
    syringeLevelPercent: 95,
    runningModel: 'MODEL 504-2187',
    topModel: {
      modelId: '504-2187',
      modelName: 'Model 504-2187 (Logic Core)',
      quantity: 610,
      percentage: 53.7,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        quantity: 610,
        percentage: 53.7,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#6366f1'
      },
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Module)',
        quantity: 350,
        percentage: 30.8,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#a855f7'
      },
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Auto MCU)',
        quantity: 175,
        percentage: 15.5,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        isHighest: false,
        color: '#cbd5e1'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 93, targetPcs: 98, efficiencyPercent: 94.9, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 102, targetPcs: 98, efficiencyPercent: 104.1, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 108, targetPcs: 98, efficiencyPercent: 110.2, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 111, targetPcs: 98, efficiencyPercent: 113.3, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 104, targetPcs: 98, efficiencyPercent: 106.1, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 90, targetPcs: 98, efficiencyPercent: 91.8, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 112, targetPcs: 98, efficiencyPercent: 114.3, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 115, targetPcs: 98, efficiencyPercent: 117.3, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 116, targetPcs: 98, efficiencyPercent: 118.4, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 101, targetPcs: 98, efficiencyPercent: 103.1, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 83, targetPcs: 98, efficiencyPercent: 84.7, isHigh: false }
    ]
  },

  // 8. MC-08 (Under Fill / Bot, Line 04)
  {
    slotNumber: 8,
    machineId: 'MC-08',
    name: 'Dispenser MC-08',
    line: 'Line 04',
    processType: 'Under Fill',
    status: 'RUNNING',
    operatorId: 'OP-E1122 (Songkran D.)',
    uph: 950,
    totalOutput: 1175,
    targetUph: 1000,
    yieldRate: 99.6,
    glueType: 'U8410-405',
    syringeRemainingMins: 140,
    syringeLevelPercent: 78,
    runningModel: 'MODEL 504-2268',
    topModel: {
      modelId: '504-2268',
      modelName: 'Model 504-2268 (WiFi Comm)',
      quantity: 825,
      percentage: 70.2,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (WiFi Comm)',
        quantity: 825,
        percentage: 70.2,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#6366f1'
      },
      {
        modelId: '504-2454',
        modelName: 'Model 504-2454 (Server Core)',
        quantity: 350,
        percentage: 29.8,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#a855f7'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 96, targetPcs: 100, efficiencyPercent: 96.0, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 106, targetPcs: 100, efficiencyPercent: 106.0, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 112, targetPcs: 100, efficiencyPercent: 112.0, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 116, targetPcs: 100, efficiencyPercent: 116.0, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 108, targetPcs: 100, efficiencyPercent: 108.0, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 94, targetPcs: 100, efficiencyPercent: 94.0, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 118, targetPcs: 100, efficiencyPercent: 118.0, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 120, targetPcs: 100, efficiencyPercent: 120.0, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 119, targetPcs: 100, efficiencyPercent: 119.0, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 102, targetPcs: 100, efficiencyPercent: 102.0, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 84, targetPcs: 100, efficiencyPercent: 84.0, isHigh: false }
    ]
  },

  // 9. MC-09 (Under Fill / Bot, Line 05)
  {
    slotNumber: 9,
    machineId: 'MC-09',
    name: 'Dispenser MC-09',
    line: 'Line 05',
    processType: 'Under Fill',
    status: 'RUNNING',
    operatorId: 'OP-E6677 (Kittisak N.)',
    uph: 955,
    totalOutput: 1195,
    targetUph: 1000,
    yieldRate: 99.6,
    glueType: 'U8410-405',
    syringeRemainingMins: 135,
    syringeLevelPercent: 75,
    runningModel: 'MODEL 504-2268',
    topModel: {
      modelId: '504-2268',
      modelName: 'Model 504-2268 (WiFi Comm)',
      quantity: 740,
      percentage: 61.9,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (WiFi Comm)',
        quantity: 740,
        percentage: 61.9,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#6366f1'
      },
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Auto MCU)',
        quantity: 335,
        percentage: 28.0,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#a855f7'
      },
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        quantity: 120,
        percentage: 10.1,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        isHighest: false,
        color: '#cbd5e1'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 98, targetPcs: 100, efficiencyPercent: 98.0, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 108, targetPcs: 100, efficiencyPercent: 108.0, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 114, targetPcs: 100, efficiencyPercent: 114.0, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 118, targetPcs: 100, efficiencyPercent: 118.0, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 110, targetPcs: 100, efficiencyPercent: 110.0, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 96, targetPcs: 100, efficiencyPercent: 96.0, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 120, targetPcs: 100, efficiencyPercent: 120.0, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 122, targetPcs: 100, efficiencyPercent: 122.0, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 121, targetPcs: 100, efficiencyPercent: 121.0, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 103, targetPcs: 100, efficiencyPercent: 103.0, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 85, targetPcs: 100, efficiencyPercent: 85.0, isHigh: false }
    ]
  },

  // 10. MC-10 (Under Fill / Bot, Line 05)
  {
    slotNumber: 10,
    machineId: 'MC-10',
    name: 'Dispenser MC-10',
    line: 'Line 05',
    processType: 'Under Fill',
    status: 'STOP',
    downtimeReason: 'JAM CLEAR',
    operatorId: 'OP-E8811 (Anan C.)',
    uph: 0,
    totalOutput: 410,
    targetUph: 1000,
    yieldRate: 91.1,
    glueType: 'U8410-405',
    syringeRemainingMins: 35,
    syringeLevelPercent: 20,
    runningModel: 'MODEL 504-2187',
    topModel: {
      modelId: '504-2187',
      modelName: 'Model 504-2187 (Logic Core)',
      quantity: 275,
      percentage: 67.1,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        quantity: 275,
        percentage: 67.1,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#6366f1'
      },
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Module)',
        quantity: 135,
        percentage: 32.9,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#a855f7'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 65, targetPcs: 85, efficiencyPercent: 76.5, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 78, targetPcs: 85, efficiencyPercent: 91.8, isHigh: false },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 82, targetPcs: 85, efficiencyPercent: 96.5, isHigh: false },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 85, targetPcs: 85, efficiencyPercent: 100.0, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 60, targetPcs: 85, efficiencyPercent: 70.6, isHigh: false },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 40, targetPcs: 85, efficiencyPercent: 47.1, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 0, targetPcs: 85, efficiencyPercent: 0, isHigh: false },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 0, targetPcs: 85, efficiencyPercent: 0, isHigh: false },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 0, targetPcs: 85, efficiencyPercent: 0, isHigh: false },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 0, targetPcs: 85, efficiencyPercent: 0, isHigh: false },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 0, targetPcs: 85, efficiencyPercent: 0, isHigh: false }
    ]
  },

  // 11. MC-11 (Under Fill / Bot, Line 06)
  {
    slotNumber: 11,
    machineId: 'MC-11',
    name: 'Dispenser MC-11',
    line: 'Line 06',
    processType: 'Under Fill',
    status: 'RUNNING',
    operatorId: 'OP-E2299 (Phanuwat T.)',
    uph: 980,
    totalOutput: 1308,
    targetUph: 1000,
    yieldRate: 99.8,
    glueType: 'U8410-405',
    syringeRemainingMins: 185,
    syringeLevelPercent: 88,
    runningModel: 'MODEL 504-2154',
    topModel: {
      modelId: '504-2154',
      modelName: 'Model 504-2154 (RF Module)',
      quantity: 960,
      percentage: 73.4,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Module)',
        quantity: 960,
        percentage: 73.4,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#6366f1'
      },
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (WiFi Comm)',
        quantity: 348,
        percentage: 26.6,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#a855f7'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 105, targetPcs: 105, efficiencyPercent: 100.0, isHigh: true },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 118, targetPcs: 105, efficiencyPercent: 112.4, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 125, targetPcs: 105, efficiencyPercent: 119.0, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 130, targetPcs: 105, efficiencyPercent: 123.8, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 120, targetPcs: 105, efficiencyPercent: 114.3, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 105, targetPcs: 105, efficiencyPercent: 100.0, isHigh: true },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 132, targetPcs: 105, efficiencyPercent: 125.7, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 135, targetPcs: 105, efficiencyPercent: 128.6, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 134, targetPcs: 105, efficiencyPercent: 127.6, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 112, targetPcs: 105, efficiencyPercent: 106.7, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 92, targetPcs: 105, efficiencyPercent: 87.6, isHigh: false }
    ]
  },

  // 12. MC-12 (Under Fill / Bot, Line 06)
  {
    slotNumber: 12,
    machineId: 'MC-12',
    name: 'Dispenser MC-12',
    line: 'Line 06',
    processType: 'Under Fill',
    status: 'RUNNING',
    operatorId: 'OP-E5588 (Sarawut O.)',
    uph: 928,
    totalOutput: 1042,
    targetUph: 1000,
    yieldRate: 99.2,
    glueType: 'U8410-405',
    syringeRemainingMins: 82,
    syringeLevelPercent: 45,
    runningModel: 'MODEL 504-2224',
    topModel: {
      modelId: '504-2224',
      modelName: 'Model 504-2224 (Auto MCU)',
      quantity: 710,
      percentage: 68.1,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Auto MCU)',
        quantity: 710,
        percentage: 68.1,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#6366f1'
      },
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        quantity: 332,
        percentage: 31.9,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#a855f7'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 85, targetPcs: 95, efficiencyPercent: 89.5, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 94, targetPcs: 95, efficiencyPercent: 98.9, isHigh: false },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 100, targetPcs: 95, efficiencyPercent: 105.3, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 102, targetPcs: 95, efficiencyPercent: 107.4, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 95, targetPcs: 95, efficiencyPercent: 100.0, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 82, targetPcs: 95, efficiencyPercent: 86.3, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 104, targetPcs: 95, efficiencyPercent: 109.5, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 106, targetPcs: 95, efficiencyPercent: 111.6, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 108, targetPcs: 95, efficiencyPercent: 113.7, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 96, targetPcs: 95, efficiencyPercent: 101.1, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 90, targetPcs: 95, efficiencyPercent: 94.7, isHigh: false }
    ]
  },

  // 13. MC-13 (Under Fill / Bot, Line 06)
  {
    slotNumber: 13,
    machineId: 'MC-13',
    name: 'Dispenser MC-13',
    line: 'Line 06',
    processType: 'Under Fill',
    status: 'RUNNING',
    operatorId: 'OP-E1100 (Worasit L.)',
    uph: 962,
    totalOutput: 1176,
    targetUph: 1000,
    yieldRate: 99.7,
    glueType: 'U8410-405',
    syringeRemainingMins: 145,
    syringeLevelPercent: 80,
    runningModel: 'MODEL 504-2454',
    topModel: {
      modelId: '504-2454',
      modelName: 'Model 504-2454 (Server Core)',
      quantity: 980,
      percentage: 83.3,
      rankLabelTh: 'Highest'
    },
    modelsRun: [
      {
        modelId: '504-2454',
        modelName: 'Model 504-2454 (Server Core)',
        quantity: 980,
        percentage: 83.3,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        isHighest: true,
        color: '#6366f1'
      },
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Auto MCU)',
        quantity: 196,
        percentage: 16.7,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        isHighest: false,
        color: '#a855f7'
      }
    ],
    hourlyData: [
      { hourShort: '07:00', hour: '07:00 - 08:00', actualPcs: 95, targetPcs: 100, efficiencyPercent: 95.0, isHigh: false },
      { hourShort: '08:00', hour: '08:00 - 09:00', actualPcs: 106, targetPcs: 100, efficiencyPercent: 106.0, isHigh: true },
      { hourShort: '09:00', hour: '09:00 - 10:00', actualPcs: 112, targetPcs: 100, efficiencyPercent: 112.0, isHigh: true },
      { hourShort: '10:00', hour: '10:00 - 11:00', actualPcs: 116, targetPcs: 100, efficiencyPercent: 116.0, isHigh: true },
      { hourShort: '11:00', hour: '11:00 - 12:00', actualPcs: 108, targetPcs: 100, efficiencyPercent: 108.0, isHigh: true },
      { hourShort: '12:00', hour: '12:00 - 13:00', actualPcs: 94, targetPcs: 100, efficiencyPercent: 94.0, isHigh: false },
      { hourShort: '13:00', hour: '13:00 - 14:00', actualPcs: 118, targetPcs: 100, efficiencyPercent: 118.0, isHigh: true },
      { hourShort: '14:00', hour: '14:00 - 15:00', actualPcs: 120, targetPcs: 100, efficiencyPercent: 120.0, isHigh: true },
      { hourShort: '15:00', hour: '15:00 - 16:00', actualPcs: 119, targetPcs: 100, efficiencyPercent: 119.0, isHigh: true },
      { hourShort: '16:00', hour: '16:00 - 17:00', actualPcs: 103, targetPcs: 100, efficiencyPercent: 103.0, isHigh: true },
      { hourShort: '17:00', hour: '17:00 - 18:00', actualPcs: 85, targetPcs: 100, efficiencyPercent: 85.0, isHigh: false }
    ]
  }
];

/**
 * Aggregates Top Fill machines (MC-01 to MC-04) into a combined multi-machine hourly series
 */
export function getTopDispensingHourlyFleet(slots: DispensingMachineSlotData[]) {
  const topSlots = slots.filter((s) => s.processType === 'Top Fill');
  return DISPENSING_HOURS.map((hourShort) => {
    const slotObj: Record<string, any> = {
      hourShort,
      hour: `${hourShort} - ${String(Number(hourShort.split(':')[0]) + 1).padStart(2, '0')}:00`,
      target: 400
    };

    let total = 0;
    topSlots.forEach((slot) => {
      const hData = slot.hourlyData.find((h) => h.hourShort === hourShort);
      const val = hData ? hData.actualPcs : 0;
      slotObj[slot.machineId] = val;
      total += val;
    });

    slotObj.totalTop = total;
    slotObj.efficiencyPercent = Number(((total / 400) * 100).toFixed(1));
    return slotObj;
  });
}

/**
 * Aggregates Bot / Under Fill machines (MC-05 to MC-13) into a combined multi-machine hourly series
 */
export function getBotDispensingHourlyFleet(slots: DispensingMachineSlotData[]) {
  const botSlots = slots.filter((s) => s.processType === 'Under Fill');
  return DISPENSING_HOURS.map((hourShort) => {
    const slotObj: Record<string, any> = {
      hourShort,
      hour: `${hourShort} - ${String(Number(hourShort.split(':')[0]) + 1).padStart(2, '0')}:00`,
      target: 900
    };

    let total = 0;
    botSlots.forEach((slot) => {
      const hData = slot.hourlyData.find((h) => h.hourShort === hourShort);
      const val = hData ? hData.actualPcs : 0;
      slotObj[slot.machineId] = val;
      total += val;
    });

    slotObj.totalBot = total;
    slotObj.efficiencyPercent = Number(((total / 900) * 100).toFixed(1));
    return slotObj;
  });
}

/**
 * Converts a slot data into standard MachineRunSummary for the modal
 */
export function convertSlotToRunSummary(slot: DispensingMachineSlotData): MachineRunSummary {
  return {
    machineId: slot.machineId,
    machineName: `${slot.machineId} (${slot.processType})`,
    chamberLabel: `${slot.name} • ${slot.line} (${slot.processType})`,
    subType: 'Dispensing',
    status: slot.status === 'RUNNING' ? 'RUNNING' : slot.status === 'IDLE' ? 'IDLE' : 'STOP',
    totalPcs: slot.totalOutput,
    totalMagazines: Math.round(slot.totalOutput / 60),
    targetPcs: slot.targetUph * 1.1,
    operatorId: slot.operatorId,
    hourlyOutput: slot.hourlyData.map((h) => ({
      hour: h.hourShort,
      actualPcs: h.actualPcs,
      targetPcs: h.targetPcs,
      actualMag: Math.round(h.actualPcs / 60),
      targetMag: 2,
      isHigh: h.isHigh
    })),
    models: slot.modelsRun.map((m, idx) => ({
      modelId: m.modelId,
      modelName: m.modelName,
      category: 'High-Precision Jet Valve Dispense',
      runCount: m.quantity,
      magazinesCount: Math.round(m.quantity / 60),
      targetCount: Math.round(m.quantity * 1.05),
      percentage: m.percentage,
      volumeRank: m.volumeRank,
      volumeRankLabelTh: m.volumeRankLabelTh,
      rankNumber: idx + 1,
      lots: [
        {
          lotId: `LOT-${slot.machineId}-${m.modelId}`,
          quantity: m.quantity,
          magazines: Math.round(m.quantity / 60),
          timeRange:
            slot.modelsRun.length === 1
              ? '08:00 - 17:30'
              : idx === 0
              ? '08:00 - 13:00'
              : idx === 1
              ? slot.modelsRun.length === 2
                ? '13:00 - 17:30'
                : '13:00 - 15:30'
              : '15:30 - 17:30',
          status: 'Completed',
          operatorId: slot.operatorId,
          recipe: `RECIPE-${slot.processType.toUpperCase().replace(' ', '')}-${m.modelId}`,
          tempCelsius: 24.8,
          yieldRate: slot.yieldRate,
          rackShelf: `Station Stage 03 (${slot.line})`
        }
      ]
    }))
  };
}

/**
 * Standard master model colors to ensure distinctive, consistent coloring across the fleet
 */
export const MASTER_DISPENSING_MODELS: Record<
  string,
  { id: string; name: string; color: string; badgeBg: string; text: string; border: string }
> = {
  '504-2224': {
    id: '504-2224',
    name: 'Model 504-2224 (Auto MCU)',
    color: '#0284c7', // Sky Blue
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-300',
    text: 'text-sky-700',
    border: 'border-sky-300'
  },
  '504-2154': {
    id: '504-2154',
    name: 'Model 504-2154 (RF Module)',
    color: '#10b981', // Emerald Green
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    text: 'text-emerald-700',
    border: 'border-emerald-300'
  },
  '504-2268': {
    id: '504-2268',
    name: 'Model 504-2268 (WiFi Comm)',
    color: '#8b5cf6', // Violet
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-300',
    text: 'text-purple-700',
    border: 'border-purple-300'
  },
  '504-2187': {
    id: '504-2187',
    name: 'Model 504-2187 (Logic Core)',
    color: '#f59e0b', // Amber
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
    text: 'text-amber-700',
    border: 'border-amber-300'
  },
  '504-2454': {
    id: '504-2454',
    name: 'Model 504-2454 (Server Core)',
    color: '#ec4899', // Pink
    badgeBg: 'bg-pink-50 text-pink-800 border-pink-300',
    text: 'text-pink-700',
    border: 'border-pink-300'
  }
};

export function getDispensingModelMeta(modelRaw: string): {
  id: string;
  name: string;
  color: string;
  badgeBg: string;
  text: string;
  border: string;
} {
  const norm = (modelRaw || '').toUpperCase();
  for (const [id, meta] of Object.entries(MASTER_DISPENSING_MODELS)) {
    if (norm.includes(id)) {
      return meta;
    }
  }
  return {
    id: '504-2224',
    name: modelRaw || 'Model 504-2224 (Auto MCU)',
    color: '#0284c7',
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-300',
    text: 'text-sky-700',
    border: 'border-sky-300'
  };
}

/**
 * Sync dynamic changes from live context Machine array into slot data
 */
export interface HourlyMachineTelemetry {
  machineId: string;
  name: string;
  line: string;
  processType: 'Top Fill' | 'Under Fill';
  model: string;
  modelId: string;
  modelName: string;
  modelColor: string;
  output: number;
  status: MachineStatus;
  yieldRate: number;
}

export interface HourlyModelBreakdown {
  modelId: string;
  modelName: string;
  color: string;
  output: number;
  percentage: number;
  lines: string[];
  machines: string[];
}

export interface HourlyLineBreakdown {
  line: string;
  processType: 'Top Fill' | 'Under Fill';
  totalOutput: number;
  machines: HourlyMachineTelemetry[];
}

export interface CombinedDispensingHourlyPoint {
  hourShort: string;
  hour: string;
  totalTop: number;
  totalBot: number;
  totalFleet: number;
  topTarget: number;
  botTarget: number;
  topMachines: HourlyMachineTelemetry[];
  botMachines: HourlyMachineTelemetry[];
  allMachines: HourlyMachineTelemetry[];
  modelsBreakdown: HourlyModelBreakdown[];
  linesBreakdown: HourlyLineBreakdown[];
  topMostModelName: string;
  topMostModelOutput: number;
  botMostModelName: string;
  botMostModelOutput: number;
  [key: string]: any;
}

/**
 * Generates a unified dataset where Top and Bot lines live on the SAME chart
 * and each point contains compact machine breakdowns and top models.
 */
export function getCombinedDispensingHourlyFleet(
  slots: DispensingMachineSlotData[]
): CombinedDispensingHourlyPoint[] {
  const topSlots = slots.filter((s) => s.processType === 'Top Fill');
  const botSlots = slots.filter((s) => s.processType === 'Under Fill');

  return DISPENSING_HOURS.map((hourShort) => {
    let totalTop = 0;
    const topModelCounts: Record<string, number> = {};
    const topMachines: HourlyMachineTelemetry[] = topSlots.map((slot) => {
      const hData = slot.hourlyData.find((h) => h.hourShort === hourShort);
      const val = hData ? hData.actualPcs : 0;
      totalTop += val;
      const model = slot.runningModel || 'Model 504-2224';
      const meta = getDispensingModelMeta(model);
      topModelCounts[model] = (topModelCounts[model] || 0) + val;
      return {
        machineId: slot.machineId,
        name: slot.name,
        line: slot.line,
        processType: slot.processType,
        model,
        modelId: meta.id,
        modelName: meta.name,
        modelColor: meta.color,
        output: val,
        status: slot.status,
        yieldRate: slot.yieldRate
      };
    });

    let topMostModelName = 'Model 504-2224';
    let topMostModelOutput = 0;
    Object.entries(topModelCounts).forEach(([mName, count]) => {
      if (count > topMostModelOutput) {
        topMostModelOutput = count;
        topMostModelName = mName;
      }
    });

    let totalBot = 0;
    const botModelCounts: Record<string, number> = {};
    const botMachines: HourlyMachineTelemetry[] = botSlots.map((slot) => {
      const hData = slot.hourlyData.find((h) => h.hourShort === hourShort);
      const val = hData ? hData.actualPcs : 0;
      totalBot += val;
      const model = slot.runningModel || 'Model 504-2268';
      const meta = getDispensingModelMeta(model);
      botModelCounts[model] = (botModelCounts[model] || 0) + val;
      return {
        machineId: slot.machineId,
        name: slot.name,
        line: slot.line,
        processType: slot.processType,
        model,
        modelId: meta.id,
        modelName: meta.name,
        modelColor: meta.color,
        output: val,
        status: slot.status,
        yieldRate: slot.yieldRate
      };
    });

    let botMostModelName = 'Model 504-2268';
    let botMostModelOutput = 0;
    Object.entries(botModelCounts).forEach(([mName, count]) => {
      if (count > botMostModelOutput) {
        botMostModelOutput = count;
        botMostModelName = mName;
      }
    });

    const allMachines = [...topMachines, ...botMachines];
    const totalFleet = totalTop + totalBot;

    // Aggregate models breakdown for this hour
    const modelAgg: Record<
      string,
      {
        modelId: string;
        modelName: string;
        color: string;
        output: number;
        lines: Set<string>;
        machines: Set<string>;
      }
    > = {};

    // Keys for stacked model bars
    const modelBarOutputs: Record<string, number> = {};

    allMachines.forEach((m) => {
      if (!modelAgg[m.modelId]) {
        modelAgg[m.modelId] = {
          modelId: m.modelId,
          modelName: m.modelName,
          color: m.modelColor,
          output: 0,
          lines: new Set(),
          machines: new Set()
        };
      }
      modelAgg[m.modelId].output += m.output;
      modelAgg[m.modelId].lines.add(m.line);
      modelAgg[m.modelId].machines.add(m.machineId);

      // Clean key for recharts
      const key = `model_${m.modelId.replace(/-/g, '_')}`;
      modelBarOutputs[key] = (modelBarOutputs[key] || 0) + m.output;
    });

    const modelsBreakdown: HourlyModelBreakdown[] = Object.values(modelAgg)
      .map((entry) => ({
        modelId: entry.modelId,
        modelName: entry.modelName,
        color: entry.color,
        output: entry.output,
        percentage: Number(((entry.output / Math.max(1, totalFleet)) * 100).toFixed(1)),
        lines: Array.from(entry.lines),
        machines: Array.from(entry.machines)
      }))
      .sort((a, b) => b.output - a.output);

    // Group machines by production line
    const lineMap: Record<string, HourlyLineBreakdown> = {};
    allMachines.forEach((m) => {
      if (!lineMap[m.line]) {
        lineMap[m.line] = {
          line: m.line,
          processType: m.processType,
          totalOutput: 0,
          machines: []
        };
      }
      lineMap[m.line].totalOutput += m.output;
      lineMap[m.line].machines.push(m);
    });

    const linesBreakdown: HourlyLineBreakdown[] = Object.values(lineMap).sort((a, b) =>
      a.line.localeCompare(b.line)
    );

    return {
      hourShort,
      hour: `${hourShort} - ${String(Number(hourShort.split(':')[0]) + 1).padStart(2, '0')}:00`,
      totalTop,
      totalBot,
      totalFleet,
      topTarget: 400,
      botTarget: 900,
      topMachines,
      botMachines,
      allMachines,
      modelsBreakdown,
      linesBreakdown,
      topMostModelName,
      topMostModelOutput,
      botMostModelName,
      botMostModelOutput,
      ...modelBarOutputs
    };
  });
}

export interface GroupHourlyPoint {
  hourShort: string;
  hour: string;
  totalOutput: number;
  target: number;
  modelsBreakdown: HourlyModelBreakdown[];
  linesBreakdown: HourlyLineBreakdown[];
  machines: HourlyMachineTelemetry[];
  topMostModelName: string;
  topMostModelOutput: number;
  [key: string]: any;
}

/**
 * Calculates hourly breakdown for any subset of slots (e.g. only Top Fill, only Bot Under Fill, or a single Line)
 * ensuring each graph represents strictly its own independent dataset.
 */
export function getGroupHourlyFleet(
  slots: DispensingMachineSlotData[],
  targetPerMachine: number = 95
): GroupHourlyPoint[] {
  const target = slots.length * targetPerMachine;

  return DISPENSING_HOURS.map((hourShort) => {
    let totalOutput = 0;
    const modelCounts: Record<string, number> = {};

    const machines: HourlyMachineTelemetry[] = slots.map((slot) => {
      const hData = slot.hourlyData.find((h) => h.hourShort === hourShort);
      const val = hData ? hData.actualPcs : 0;
      totalOutput += val;
      const model = slot.runningModel || 'Model 504-2224';
      const meta = getDispensingModelMeta(model);
      modelCounts[model] = (modelCounts[model] || 0) + val;
      return {
        machineId: slot.machineId,
        name: slot.name,
        line: slot.line,
        processType: slot.processType,
        model,
        modelId: meta.id,
        modelName: meta.name,
        modelColor: meta.color,
        output: val,
        status: slot.status,
        yieldRate: slot.yieldRate
      };
    });

    let topMostModelName = '';
    let topMostModelOutput = 0;
    Object.entries(modelCounts).forEach(([mName, count]) => {
      if (count > topMostModelOutput) {
        topMostModelOutput = count;
        topMostModelName = mName;
      }
    });

    const modelAgg: Record<
      string,
      {
        modelId: string;
        modelName: string;
        color: string;
        output: number;
        lines: Set<string>;
        machines: Set<string>;
      }
    > = {};

    const modelBarOutputs: Record<string, number> = {};

    machines.forEach((m) => {
      if (!modelAgg[m.modelId]) {
        modelAgg[m.modelId] = {
          modelId: m.modelId,
          modelName: m.modelName,
          color: m.modelColor,
          output: 0,
          lines: new Set(),
          machines: new Set()
        };
      }
      modelAgg[m.modelId].output += m.output;
      modelAgg[m.modelId].lines.add(m.line);
      modelAgg[m.modelId].machines.add(m.machineId);

      const key = `model_${m.modelId.replace(/-/g, '_')}`;
      modelBarOutputs[key] = (modelBarOutputs[key] || 0) + m.output;
    });

    const modelsBreakdown: HourlyModelBreakdown[] = Object.values(modelAgg)
      .map((entry) => ({
        modelId: entry.modelId,
        modelName: entry.modelName,
        color: entry.color,
        output: entry.output,
        percentage: Number(((entry.output / Math.max(1, totalOutput)) * 100).toFixed(1)),
        lines: Array.from(entry.lines),
        machines: Array.from(entry.machines)
      }))
      .sort((a, b) => b.output - a.output);

    const lineMap: Record<string, HourlyLineBreakdown> = {};
    machines.forEach((m) => {
      if (!lineMap[m.line]) {
        lineMap[m.line] = {
          line: m.line,
          processType: m.processType,
          totalOutput: 0,
          machines: []
        };
      }
      lineMap[m.line].totalOutput += m.output;
      lineMap[m.line].machines.push(m);
    });

    const linesBreakdown: HourlyLineBreakdown[] = Object.values(lineMap).sort((a, b) =>
      a.line.localeCompare(b.line)
    );

    return {
      hourShort,
      hour: `${hourShort} - ${String(Number(hourShort.split(':')[0]) + 1).padStart(2, '0')}:00`,
      totalOutput,
      target,
      machines,
      modelsBreakdown,
      linesBreakdown,
      topMostModelName,
      topMostModelOutput,
      ...modelBarOutputs
    };
  });
}

/**
 * Sync dynamic changes from live context Machine array into slot data
 */
export function syncDispensingSlotsWithLiveMachines(
  baseSlots: DispensingMachineSlotData[],
  liveMachines: Machine[]
): DispensingMachineSlotData[] {
  return baseSlots.map((slot) => {
    const live = liveMachines.find((m) => m.id === slot.machineId);
    if (!live) return slot;

    const currentLiveModel = live.runningModel || slot.runningModel;
    const isModelMatching = slot.modelsRun.some((m) => currentLiveModel.includes(m.modelId));

    let updatedModels = [...slot.modelsRun];
    if (!isModelMatching && currentLiveModel) {
      const newModelId = currentLiveModel.replace('MODEL ', '').replace('Model ', '').split(' ')[0];
      const primaryCount = Math.round(live.outputCount * 0.75);
      const secondaryCount = Math.max(0, live.outputCount - primaryCount);

      updatedModels = [
        {
          modelId: newModelId,
          modelName: `Model ${newModelId} (Active Recipe)`,
          quantity: primaryCount,
          percentage: 75.0,
          volumeRank: 'highest',
          volumeRankLabelTh: 'Highest',
          isHighest: true,
          color: slot.processType === 'Top Fill' ? '#0284c7' : '#6366f1'
        },
        {
          modelId: '504-2154',
          modelName: 'Model 504-2154 (Secondary Batch)',
          quantity: secondaryCount,
          percentage: 25.0,
          volumeRank: 'medium',
          volumeRankLabelTh: 'Medium',
          isHighest: false,
          color: '#cbd5e1'
        }
      ];
    }

    const topModelEntry = updatedModels.find((m) => m.isHighest) || updatedModels[0];

    const syringeRemaining = live.glueInfo?.remainingMins ?? slot.syringeRemainingMins;
    const syringePercent = Math.min(100, Math.round((syringeRemaining / 180) * 100));

    return {
      ...slot,
      status: live.status,
      downtimeReason: live.downtimeReason || slot.downtimeReason,
      uph: live.uph,
      totalOutput: live.outputCount || slot.totalOutput,
      yieldRate: Number(((live.outputCount / Math.max(1, live.inputCount)) * 100).toFixed(1)) || slot.yieldRate,
      runningModel: currentLiveModel,
      glueType: live.glueInfo?.glueType || slot.glueType,
      syringeRemainingMins: syringeRemaining,
      syringeLevelPercent: syringePercent,
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

