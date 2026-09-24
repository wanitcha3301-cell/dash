export interface LotRunRecord {
  lotId: string;
  quantity: number;
  magazines: number;
  timeRange: string;
  status: 'Completed' | 'In-Progress' | 'Pending';
  operatorId: string;
  recipe: string;
  targetPressurePa?: number;
  tempCelsius: number;
  yieldRate: number; // e.g. 99.6
  rackShelf: string;
}

export interface ModelRunDetail {
  modelId: string;
  modelName: string;
  category: string;
  runCount: number;
  magazinesCount: number;
  targetCount: number;
  percentage: number; // 0 - 100
  volumeRank: 'highest' | 'medium' | 'lowest' | 'single' | string;
  volumeRankLabelTh?: 'Highest' | 'Medium' | 'Lowest' | 'Single Share' | 'Normal' | string;
  rankNumber: number; // 1, 2, 3...
  lots: LotRunRecord[];
}

export interface MachineRunSummary {
  machineId: string;
  machineName: string;
  chamberLabel: string;
  subType: 'Vacuum' | 'Bake' | 'Dispensing' | 'FVMI' | 'AOI' | 'X-ray';
  status: 'RUNNING' | 'STOP' | 'IDLE' | 'WARNING';
  totalPcs: number;
  totalMagazines: number;
  targetPcs: number;
  operatorId: string;
  hourlyOutput: {
    hour: string;
    actualPcs: number;
    targetPcs: number;
    actualMag: number;
    targetMag: number;
    isHigh: boolean;
  }[];
  models: ModelRunDetail[];
}

export const HOURLY_TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

/**
 * Standard Machine Model Datastore
 * Populated with realistic production lots, hourly curves, and high/low volume rankings.
 */
export const MACHINE_MODEL_DATA: Record<string, MachineRunSummary> = {
  // Vacuum Oven #1 (Chamber A)
  'oven-1': {
    machineId: 'oven-1',
    machineName: 'Oven #1',
    chamberLabel: 'Chamber A • Vacuum Degas (Line 06)',
    subType: 'Vacuum',
    status: 'RUNNING',
    totalPcs: 1200,
    totalMagazines: 20,
    targetPcs: 1200,
    operatorId: 'Staff ID: 08452 (Somchai P.)',
    hourlyOutput: [
      { hour: '08:00', actualPcs: 110, targetPcs: 120, actualMag: 2, targetMag: 2, isHigh: false },
      { hour: '09:00', actualPcs: 130, targetPcs: 120, actualMag: 2, targetMag: 2, isHigh: true },
      { hour: '10:00', actualPcs: 125, targetPcs: 120, actualMag: 2, targetMag: 2, isHigh: true },
      { hour: '11:00', actualPcs: 140, targetPcs: 120, actualMag: 2, targetMag: 2, isHigh: true },
      { hour: '12:00', actualPcs: 100, targetPcs: 120, actualMag: 2, targetMag: 2, isHigh: false },
      { hour: '13:00', actualPcs: 135, targetPcs: 120, actualMag: 2, targetMag: 2, isHigh: true },
      { hour: '14:00', actualPcs: 125, targetPcs: 120, actualMag: 2, targetMag: 2, isHigh: true },
      { hour: '15:00', actualPcs: 130, targetPcs: 120, actualMag: 2, targetMag: 2, isHigh: true },
      { hour: '16:00', actualPcs: 115, targetPcs: 120, actualMag: 2, targetMag: 2, isHigh: false },
      { hour: '17:00', actualPcs: 90, targetPcs: 120, actualMag: 2, targetMag: 2, isHigh: false },
    ],
    models: [
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        category: 'Under Fill Process',
        runCount: 720,
        magazinesCount: 12,
        targetCount: 700,
        percentage: 60.0,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        rankNumber: 1,
        lots: [
          {
            lotId: 'LOT-2026-09A1',
            quantity: 360,
            magazines: 6,
            timeRange: '08:00 - 11:30',
            status: 'Completed',
            operatorId: 'Staff ID: 08452',
            recipe: 'VAC-UF-CORE-180C',
            targetPressurePa: 0.45,
            tempCelsius: 180.2,
            yieldRate: 99.7,
            rackShelf: 'Magazine Mag-01 (Shelf A1-A6)'
          },
          {
            lotId: 'LOT-2026-09A2',
            quantity: 360,
            magazines: 6,
            timeRange: '11:30 - 14:45',
            status: 'Completed',
            operatorId: 'Staff ID: 08452',
            recipe: 'VAC-UF-CORE-180C',
            targetPressurePa: 0.46,
            tempCelsius: 179.8,
            yieldRate: 99.5,
            rackShelf: 'Magazine Mag-02 (Shelf A7-A12)'
          }
        ]
      },
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Module)',
        category: 'Under Fill Process',
        runCount: 360,
        magazinesCount: 6,
        targetCount: 360,
        percentage: 30.0,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        rankNumber: 2,
        lots: [
          {
            lotId: 'LOT-2026-09B1',
            quantity: 360,
            magazines: 6,
            timeRange: '14:45 - 17:00',
            status: 'In-Progress',
            operatorId: 'Staff ID: 08452',
            recipe: 'VAC-RF-DEGAS-175C',
            targetPressurePa: 0.48,
            tempCelsius: 176.5,
            yieldRate: 99.8,
            rackShelf: 'Magazine Mag-03 (Shelf B1-B6)'
          }
        ]
      },
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Power Board)',
        category: 'Under Fill Process',
        runCount: 120,
        magazinesCount: 2,
        targetCount: 140,
        percentage: 10.0,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        rankNumber: 3,
        lots: [
          {
            lotId: 'LOT-2026-08F9',
            quantity: 120,
            magazines: 2,
            timeRange: '16:00 - 17:00',
            status: 'Completed',
            operatorId: 'Staff ID: 08452',
            recipe: 'VAC-PWR-QUICK-180C',
            targetPressurePa: 0.50,
            tempCelsius: 180.0,
            yieldRate: 99.2,
            rackShelf: 'Magazine Mag-04 (Shelf B7-B8)'
          }
        ]
      }
    ]
  },

  // Vacuum Oven #2 (Chamber B)
  'oven-2': {
    machineId: 'oven-2',
    machineName: 'Oven #2',
    chamberLabel: 'Chamber B • Vacuum Degas (Line 06)',
    subType: 'Vacuum',
    status: 'RUNNING',
    totalPcs: 900,
    totalMagazines: 15,
    targetPcs: 1000,
    operatorId: 'Staff ID: 08453 (Apinya K.)',
    hourlyOutput: [
      { hour: '08:00', actualPcs: 95, targetPcs: 100, actualMag: 2, targetMag: 2, isHigh: true },
      { hour: '09:00', actualPcs: 105, targetPcs: 100, actualMag: 2, targetMag: 2, isHigh: true },
      { hour: '10:00', actualPcs: 110, targetPcs: 100, actualMag: 2, targetMag: 2, isHigh: true },
      { hour: '11:00', actualPcs: 80, targetPcs: 100, actualMag: 1, targetMag: 2, isHigh: false },
      { hour: '12:00', actualPcs: 95, targetPcs: 100, actualMag: 2, targetMag: 2, isHigh: true },
      { hour: '13:00', actualPcs: 105, targetPcs: 100, actualMag: 2, targetMag: 2, isHigh: true },
      { hour: '14:00', actualPcs: 100, targetPcs: 100, actualMag: 2, targetMag: 2, isHigh: true },
      { hour: '15:00', actualPcs: 85, targetPcs: 100, actualMag: 1, targetMag: 2, isHigh: false },
      { hour: '16:00', actualPcs: 75, targetPcs: 100, actualMag: 1, targetMag: 2, isHigh: false },
      { hour: '17:00', actualPcs: 50, targetPcs: 100, actualMag: 1, targetMag: 2, isHigh: false },
    ],
    models: [
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (WiFi Comm Module)',
        category: 'Under Fill Process',
        runCount: 540,
        magazinesCount: 9,
        targetCount: 550,
        percentage: 60.0,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        rankNumber: 1,
        lots: [
          {
            lotId: 'LOT-2026-09C1',
            quantity: 300,
            magazines: 5,
            timeRange: '08:00 - 12:00',
            status: 'Completed',
            operatorId: 'Staff ID: 08453',
            recipe: 'VAC-WIFI-COMM-170C',
            targetPressurePa: 0.44,
            tempCelsius: 171.0,
            yieldRate: 99.9,
            rackShelf: 'Magazine Mag-05 (Shelf C1-C5)'
          },
          {
            lotId: 'LOT-2026-09C2',
            quantity: 240,
            magazines: 4,
            timeRange: '12:00 - 15:30',
            status: 'Completed',
            operatorId: 'Staff ID: 08453',
            recipe: 'VAC-WIFI-COMM-170C',
            targetPressurePa: 0.45,
            tempCelsius: 170.8,
            yieldRate: 99.6,
            rackShelf: 'Magazine Mag-06 (Shelf C6-C9)'
          }
        ]
      },
      {
        modelId: '504-2454',
        modelName: 'Model 504-2454 (Server Core)',
        category: 'Under Fill Process',
        runCount: 270,
        magazinesCount: 4.5,
        targetCount: 300,
        percentage: 30.0,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        rankNumber: 2,
        lots: [
          {
            lotId: 'LOT-2026-09D1',
            quantity: 270,
            magazines: 4.5,
            timeRange: '14:00 - 17:00',
            status: 'Completed',
            operatorId: 'Staff ID: 08453',
            recipe: 'VAC-SRV-DENSE-185C',
            targetPressurePa: 0.42,
            tempCelsius: 184.5,
            yieldRate: 99.4,
            rackShelf: 'Magazine Mag-07 (Shelf D1-D5)'
          }
        ]
      },
      {
        modelId: '504-2090',
        modelName: 'Model 504-2090 (Sensor Module)',
        category: 'Under Fill Process',
        runCount: 90,
        magazinesCount: 1.5,
        targetCount: 150,
        percentage: 10.0,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        rankNumber: 3,
        lots: [
          {
            lotId: 'LOT-2026-08S3',
            quantity: 90,
            magazines: 1.5,
            timeRange: '16:00 - 17:00',
            status: 'Completed',
            operatorId: 'Staff ID: 08453',
            recipe: 'VAC-SENS-LOW-165C',
            targetPressurePa: 0.52,
            tempCelsius: 165.0,
            yieldRate: 99.1,
            rackShelf: 'Magazine Mag-08 (Shelf D6)'
          }
        ]
      }
    ]
  },

  // Bake Oven #1
  'bake-1': {
    machineId: 'bake-1',
    machineName: 'Bake Oven #1',
    chamberLabel: 'Bake Oven Zone 01 (Line 06)',
    subType: 'Bake',
    status: 'RUNNING',
    totalPcs: 1440,
    totalMagazines: 24,
    targetPcs: 1500,
    operatorId: 'Staff ID: 08454 (Prasert T.)',
    hourlyOutput: HOURLY_TIME_SLOTS.map((hour, idx) => ({
      hour,
      actualPcs: 130 + ((idx * 7) % 30),
      targetPcs: 150,
      actualMag: 2,
      targetMag: 2,
      isHigh: (130 + ((idx * 7) % 30)) >= 140
    })),
    models: [
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Curing)',
        category: 'Thermal Polymerization',
        runCount: 864,
        magazinesCount: 14.4,
        targetCount: 900,
        percentage: 60.0,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        rankNumber: 1,
        lots: [
          {
            lotId: 'LOT-BAKE-01A',
            quantity: 864,
            magazines: 14.4,
            timeRange: '08:00 - 14:00',
            status: 'Completed',
            operatorId: 'Staff ID: 08454',
            recipe: 'BAKE-150C-PROFILE-3',
            tempCelsius: 150.4,
            yieldRate: 99.8,
            rackShelf: 'Bake Carrier BK-01'
          }
        ]
      },
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Power Board)',
        category: 'Thermal Polymerization',
        runCount: 432,
        magazinesCount: 7.2,
        targetCount: 450,
        percentage: 30.0,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        rankNumber: 2,
        lots: [
          {
            lotId: 'LOT-BAKE-01B',
            quantity: 432,
            magazines: 7.2,
            timeRange: '14:00 - 16:30',
            status: 'Completed',
            operatorId: 'Staff ID: 08454',
            recipe: 'BAKE-155C-PROFILE-1',
            tempCelsius: 155.0,
            yieldRate: 99.6,
            rackShelf: 'Bake Carrier BK-02'
          }
        ]
      },
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        category: 'Thermal Polymerization',
        runCount: 144,
        magazinesCount: 2.4,
        targetCount: 150,
        percentage: 10.0,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        rankNumber: 3,
        lots: [
          {
            lotId: 'LOT-BAKE-01C',
            quantity: 144,
            magazines: 2.4,
            timeRange: '16:30 - 17:30',
            status: 'Completed',
            operatorId: 'Staff ID: 08454',
            recipe: 'BAKE-148C-QUICK',
            tempCelsius: 148.0,
            yieldRate: 99.5,
            rackShelf: 'Bake Carrier BK-03'
          }
        ]
      }
    ]
  },

  // Bake Oven #2
  'bake-2': {
    machineId: 'bake-2',
    machineName: 'Bake Oven #2',
    chamberLabel: 'Bake Oven Zone 02 (Line 06)',
    subType: 'Bake',
    status: 'RUNNING',
    totalPcs: 1380,
    totalMagazines: 23,
    targetPcs: 1500,
    operatorId: 'Staff ID: 08455 (Kittisak N.)',
    hourlyOutput: HOURLY_TIME_SLOTS.map((hour, idx) => ({
      hour,
      actualPcs: 125 + ((idx * 9) % 35),
      targetPcs: 150,
      actualMag: 2,
      targetMag: 2,
      isHigh: (125 + ((idx * 9) % 35)) >= 140
    })),
    models: [
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Power Board)',
        category: 'Thermal Polymerization',
        runCount: 759,
        magazinesCount: 12.6,
        targetCount: 800,
        percentage: 55.0,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        rankNumber: 1,
        lots: [
          {
            lotId: 'LOT-BAKE-02A',
            quantity: 759,
            magazines: 12.6,
            timeRange: '08:00 - 13:30',
            status: 'Completed',
            operatorId: 'Staff ID: 08455',
            recipe: 'BAKE-155C-PROFILE-1',
            tempCelsius: 155.2,
            yieldRate: 99.7,
            rackShelf: 'Bake Carrier BK-04'
          }
        ]
      },
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        category: 'Thermal Polymerization',
        runCount: 483,
        magazinesCount: 8.0,
        targetCount: 500,
        percentage: 35.0,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        rankNumber: 2,
        lots: [
          {
            lotId: 'LOT-BAKE-02B',
            quantity: 483,
            magazines: 8.0,
            timeRange: '13:30 - 16:30',
            status: 'Completed',
            operatorId: 'Staff ID: 08455',
            recipe: 'BAKE-150C-PROFILE-2',
            tempCelsius: 150.0,
            yieldRate: 99.8,
            rackShelf: 'Bake Carrier BK-05'
          }
        ]
      },
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (WiFi Comm)',
        category: 'Thermal Polymerization',
        runCount: 138,
        magazinesCount: 2.3,
        targetCount: 200,
        percentage: 10.0,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        rankNumber: 3,
        lots: [
          {
            lotId: 'LOT-BAKE-02C',
            quantity: 138,
            magazines: 2.3,
            timeRange: '16:30 - 17:30',
            status: 'Completed',
            operatorId: 'Staff ID: 08455',
            recipe: 'BAKE-145C-WIFI',
            tempCelsius: 145.0,
            yieldRate: 99.4,
            rackShelf: 'Bake Carrier BK-06'
          }
        ]
      }
    ]
  },

  // Bake Oven #3
  'bake-3': {
    machineId: 'bake-3',
    machineName: 'Bake Oven #3',
    chamberLabel: 'Bake Oven Zone 03 (Line 06)',
    subType: 'Bake',
    status: 'RUNNING',
    totalPcs: 1410,
    totalMagazines: 23.5,
    targetPcs: 1500,
    operatorId: 'Staff ID: 08456 (Wichai S.)',
    hourlyOutput: HOURLY_TIME_SLOTS.map((hour, idx) => ({
      hour,
      actualPcs: 135 + ((idx * 5) % 25),
      targetPcs: 150,
      actualMag: 2,
      targetMag: 2,
      isHigh: (135 + ((idx * 5) % 25)) >= 140
    })),
    models: [
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        category: 'Thermal Polymerization',
        runCount: 775,
        magazinesCount: 13,
        targetCount: 800,
        percentage: 55.0,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        rankNumber: 1,
        lots: [
          {
            lotId: 'LOT-BAKE-03A',
            quantity: 775,
            magazines: 13,
            timeRange: '08:00 - 13:40',
            status: 'Completed',
            operatorId: 'Staff ID: 08456',
            recipe: 'BAKE-150C-PROFILE-1',
            tempCelsius: 150.1,
            yieldRate: 99.9,
            rackShelf: 'Bake Carrier BK-07'
          }
        ]
      },
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Curing)',
        category: 'Thermal Polymerization',
        runCount: 494,
        magazinesCount: 8.2,
        targetCount: 500,
        percentage: 35.0,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        rankNumber: 2,
        lots: [
          {
            lotId: 'LOT-BAKE-03B',
            quantity: 494,
            magazines: 8.2,
            timeRange: '13:40 - 16:45',
            status: 'Completed',
            operatorId: 'Staff ID: 08456',
            recipe: 'BAKE-152C-RF',
            tempCelsius: 152.0,
            yieldRate: 99.6,
            rackShelf: 'Bake Carrier BK-08'
          }
        ]
      },
      {
        modelId: '504-2454',
        modelName: 'Model 504-2454 (Server Core)',
        category: 'Thermal Polymerization',
        runCount: 141,
        magazinesCount: 2.3,
        targetCount: 200,
        percentage: 10.0,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        rankNumber: 3,
        lots: [
          {
            lotId: 'LOT-BAKE-03C',
            quantity: 141,
            magazines: 2.3,
            timeRange: '16:45 - 17:30',
            status: 'Completed',
            operatorId: 'Staff ID: 08456',
            recipe: 'BAKE-160C-DENSE',
            tempCelsius: 160.0,
            yieldRate: 99.3,
            rackShelf: 'Bake Carrier BK-09'
          }
        ]
      }
    ]
  },

  // Bake Oven #4
  'bake-4': {
    machineId: 'bake-4',
    machineName: 'Bake Oven #4',
    chamberLabel: 'Bake Oven Zone 04 (Line 06)',
    subType: 'Bake',
    status: 'RUNNING',
    totalPcs: 1470,
    totalMagazines: 24.5,
    targetPcs: 1500,
    operatorId: 'Staff ID: 08457 (Nattaporn R.)',
    hourlyOutput: HOURLY_TIME_SLOTS.map((hour, idx) => ({
      hour,
      actualPcs: 140 + ((idx * 8) % 20),
      targetPcs: 150,
      actualMag: 2,
      targetMag: 2,
      isHigh: true
    })),
    models: [
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (WiFi Comm)',
        category: 'Thermal Polymerization',
        runCount: 882,
        magazinesCount: 14.7,
        targetCount: 900,
        percentage: 60.0,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        rankNumber: 1,
        lots: [
          {
            lotId: 'LOT-BAKE-04A',
            quantity: 882,
            magazines: 14.7,
            timeRange: '08:00 - 14:15',
            status: 'Completed',
            operatorId: 'Staff ID: 08457',
            recipe: 'BAKE-145C-WIFI',
            tempCelsius: 145.3,
            yieldRate: 99.8,
            rackShelf: 'Bake Carrier BK-10'
          }
        ]
      },
      {
        modelId: '504-2454',
        modelName: 'Model 504-2454 (Server Core)',
        category: 'Thermal Polymerization',
        runCount: 441,
        magazinesCount: 7.3,
        targetCount: 450,
        percentage: 30.0,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        rankNumber: 2,
        lots: [
          {
            lotId: 'LOT-BAKE-04B',
            quantity: 441,
            magazines: 7.3,
            timeRange: '14:15 - 16:45',
            status: 'Completed',
            operatorId: 'Staff ID: 08457',
            recipe: 'BAKE-160C-DENSE',
            tempCelsius: 160.2,
            yieldRate: 99.5,
            rackShelf: 'Bake Carrier BK-11'
          }
        ]
      },
      {
        modelId: '504-2090',
        modelName: 'Model 504-2090 (Sensor Module)',
        category: 'Thermal Polymerization',
        runCount: 147,
        magazinesCount: 2.5,
        targetCount: 150,
        percentage: 10.0,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        rankNumber: 3,
        lots: [
          {
            lotId: 'LOT-BAKE-04C',
            quantity: 147,
            magazines: 2.5,
            timeRange: '16:45 - 17:30',
            status: 'Completed',
            operatorId: 'Staff ID: 08457',
            recipe: 'BAKE-140C-SENS',
            tempCelsius: 140.0,
            yieldRate: 99.2,
            rackShelf: 'Bake Carrier BK-12'
          }
        ]
      }
    ]
  },

  // Bake Oven #5
  'bake-5': {
    machineId: 'bake-5',
    machineName: 'Bake Oven #5',
    chamberLabel: 'Bake Oven Zone 05 (Line 06)',
    subType: 'Bake',
    status: 'RUNNING',
    totalPcs: 1350,
    totalMagazines: 22.5,
    targetPcs: 1500,
    operatorId: 'Staff ID: 08458 (Supachai B.)',
    hourlyOutput: HOURLY_TIME_SLOTS.map((hour, idx) => ({
      hour,
      actualPcs: 125 + ((idx * 6) % 30),
      targetPcs: 150,
      actualMag: 2,
      targetMag: 2,
      isHigh: (125 + ((idx * 6) % 30)) >= 140
    })),
    models: [
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Curing)',
        category: 'Thermal Polymerization',
        runCount: 742,
        magazinesCount: 12.4,
        targetCount: 800,
        percentage: 55.0,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Highest',
        rankNumber: 1,
        lots: [
          {
            lotId: 'LOT-BAKE-05A',
            quantity: 742,
            magazines: 12.4,
            timeRange: '08:00 - 13:30',
            status: 'Completed',
            operatorId: 'Staff ID: 08458',
            recipe: 'BAKE-150C-PROFILE-3',
            tempCelsius: 150.1,
            yieldRate: 99.7,
            rackShelf: 'Bake Carrier BK-13'
          }
        ]
      },
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Power Board)',
        category: 'Thermal Polymerization',
        runCount: 473,
        magazinesCount: 7.9,
        targetCount: 500,
        percentage: 35.0,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Medium',
        rankNumber: 2,
        lots: [
          {
            lotId: 'LOT-BAKE-05B',
            quantity: 473,
            magazines: 7.9,
            timeRange: '13:30 - 16:30',
            status: 'Completed',
            operatorId: 'Staff ID: 08458',
            recipe: 'BAKE-155C-PROFILE-1',
            tempCelsius: 155.0,
            yieldRate: 99.6,
            rackShelf: 'Bake Carrier BK-14'
          }
        ]
      },
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        category: 'Thermal Polymerization',
        runCount: 135,
        magazinesCount: 2.2,
        targetCount: 200,
        percentage: 10.0,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Lowest',
        rankNumber: 3,
        lots: [
          {
            lotId: 'LOT-BAKE-05C',
            quantity: 135,
            magazines: 2.2,
            timeRange: '16:30 - 17:30',
            status: 'Completed',
            operatorId: 'Staff ID: 08458',
            recipe: 'BAKE-148C-QUICK',
            tempCelsius: 148.0,
            yieldRate: 99.4,
            rackShelf: 'Bake Carrier BK-15'
          }
        ]
      }
    ]
  }
};

/**
 * Helper to get or generate machine model breakdown
 */
export function getMachineRunSummary(machineId: string, customName?: string, subType?: any): MachineRunSummary {
  if (MACHINE_MODEL_DATA[machineId]) {
    return MACHINE_MODEL_DATA[machineId];
  }

  // Dedicated dynamic generator for AOI inspection machines
  if (subType === 'AOI' || machineId.toUpperCase().includes('AOI')) {
    const aoiTotalPcs = 10850;
    const aoiModels: ModelRunDetail[] = [
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        category: 'SMT Optical Inspection',
        runCount: 5425,
        magazinesCount: 90,
        targetCount: 5500,
        percentage: 50.0,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Normal',
        rankNumber: 1,
        lots: [
          {
            lotId: `LOT-${machineId.toUpperCase()}-01`,
            quantity: 5425,
            magazines: 90,
            timeRange: '08:00 - 13:00',
            status: 'Completed',
            operatorId: 'Somchai P.',
            recipe: 'AOI-OPT-3D-P1',
            tempCelsius: 24.5,
            yieldRate: 99.8,
            rackShelf: 'Infeed Bay 1',
          },
        ],
      },
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (Automotive ASIC)',
        category: 'SMT Optical Inspection',
        runCount: 3255,
        magazinesCount: 54,
        targetCount: 3300,
        percentage: 30.0,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Normal',
        rankNumber: 2,
        lots: [
          {
            lotId: `LOT-${machineId.toUpperCase()}-02`,
            quantity: 3255,
            magazines: 54,
            timeRange: '13:00 - 15:30',
            status: 'Completed',
            operatorId: 'Somchai P.',
            recipe: 'AOI-OPT-3D-P2',
            tempCelsius: 24.8,
            yieldRate: 99.7,
            rackShelf: 'Infeed Bay 2',
          },
        ],
      },
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Transceiver)',
        category: 'SMT Optical Inspection',
        runCount: 2170,
        magazinesCount: 36,
        targetCount: 2200,
        percentage: 20.0,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Normal',
        rankNumber: 3,
        lots: [
          {
            lotId: `LOT-${machineId.toUpperCase()}-03`,
            quantity: 2170,
            magazines: 36,
            timeRange: '15:30 - 17:00',
            status: 'Completed',
            operatorId: 'Somchai P.',
            recipe: 'AOI-OPT-3D-P3',
            tempCelsius: 24.6,
            yieldRate: 99.9,
            rackShelf: 'Infeed Bay 3',
          },
        ],
      },
    ];

    const baseHourly = [960, 1040, 1145, 1090, 1135, 920, 1125, 1110, 1160, 1140];
    const seed = machineId.split('').reduce((acc, c, idx) => acc + c.charCodeAt(0) * (idx + 1), 0);

    return {
      machineId,
      machineName: customName || machineId.toUpperCase(),
      chamberLabel: `${customName || machineId.toUpperCase()} High-Speed AOI`,
      subType: 'AOI',
      status: 'RUNNING',
      totalPcs: aoiTotalPcs,
      totalMagazines: 180,
      targetPcs: 11000,
      operatorId: 'Staff ID: 08452 (Somchai P.)',
      hourlyOutput: HOURLY_TIME_SLOTS.map((hour, idx) => {
        const val = Math.max(650, (baseHourly[idx] || 1100) + Math.round(Math.sin(seed + idx) * 30));
        return {
          hour,
          actualPcs: val,
          targetPcs: 1100,
          actualMag: Math.round(val / 60),
          targetMag: 18,
          isHigh: val >= 1100,
        };
      }),
      models: aoiModels,
    };
  }

  // Dedicated dynamic generator for X-Ray NDT machines
  if (subType === 'XRAY' || subType === 'X-ray' || machineId.toUpperCase().includes('XRAY') || machineId.toUpperCase().includes('X-RAY')) {
    const xrayTotalPcs = 1240;
    const xrayModels: ModelRunDetail[] = [
      {
        modelId: '504-2268',
        modelName: 'Model 504-2268 (Power PMIC)',
        category: 'X-Ray NDT Radiography',
        runCount: 620,
        magazinesCount: 10,
        targetCount: 650,
        percentage: 50.0,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Normal',
        rankNumber: 1,
        lots: [
          {
            lotId: `LOT-${machineId.toUpperCase().replace(/\s+/g, '-')}-01`,
            quantity: 620,
            magazines: 10,
            timeRange: '08:00 - 12:30',
            status: 'Completed',
            operatorId: 'Nattapong K.',
            recipe: 'NDT-90KV-VOID-P1',
            tempCelsius: 24.2,
            yieldRate: 99.6,
            rackShelf: 'Lead Bay 1',
          },
        ],
      },
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Shield Module)',
        category: 'X-Ray NDT Radiography',
        runCount: 380,
        magazinesCount: 6,
        targetCount: 400,
        percentage: 30.0,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Normal',
        rankNumber: 2,
        lots: [
          {
            lotId: `LOT-${machineId.toUpperCase().replace(/\s+/g, '-')}-02`,
            quantity: 380,
            magazines: 6,
            timeRange: '12:30 - 15:30',
            status: 'Completed',
            operatorId: 'Nattapong K.',
            recipe: 'NDT-90KV-VOID-P2',
            tempCelsius: 24.5,
            yieldRate: 99.8,
            rackShelf: 'Lead Bay 2',
          },
        ],
      },
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        category: 'X-Ray NDT Radiography',
        runCount: 240,
        magazinesCount: 4,
        targetCount: 250,
        percentage: 20.0,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Normal',
        rankNumber: 3,
        lots: [
          {
            lotId: `LOT-${machineId.toUpperCase().replace(/\s+/g, '-')}-03`,
            quantity: 240,
            magazines: 4,
            timeRange: '15:30 - 17:00',
            status: 'Completed',
            operatorId: 'Nattapong K.',
            recipe: 'NDT-90KV-VOID-P3',
            tempCelsius: 24.3,
            yieldRate: 99.7,
            rackShelf: 'Lead Bay 3',
          },
        ],
      },
    ];

    const baseHourly = [118, 126, 134, 130, 135, 110, 132, 128, 136, 130];
    const seed = machineId.split('').reduce((acc, c, idx) => acc + c.charCodeAt(0) * (idx + 1), 0);

    return {
      machineId,
      machineName: customName || machineId.toUpperCase(),
      chamberLabel: `${customName || machineId.toUpperCase()} Micro-Focus NDT`,
      subType: 'X-ray',
      status: 'RUNNING',
      totalPcs: xrayTotalPcs,
      totalMagazines: 20,
      targetPcs: 1300,
      operatorId: 'Staff ID: 08460 (Nattapong K.)',
      hourlyOutput: HOURLY_TIME_SLOTS.map((hour, idx) => {
        const val = Math.max(70, (baseHourly[idx] || 130) + Math.round(Math.sin(seed + idx) * 4));
        return {
          hour,
          actualPcs: val,
          targetPcs: 130,
          actualMag: 2,
          targetMag: 2,
          isHigh: val >= 130,
        };
      }),
      models: xrayModels,
    };
  }

  // Dedicated dynamic generator for FVMI Optical stations
  if (subType === 'FVMI' || machineId.toUpperCase().includes('FVMI')) {
    const fvmiTotalPcs = 11200;
    const fvmiModels: ModelRunDetail[] = [
      {
        modelId: '504-2187',
        modelName: 'Model 504-2187 (Logic Core)',
        category: 'FVMI Optical Classification',
        runCount: 5600,
        magazinesCount: 93,
        targetCount: 5700,
        percentage: 50.0,
        volumeRank: 'highest',
        volumeRankLabelTh: 'Normal',
        rankNumber: 1,
        lots: [
          {
            lotId: `LOT-${machineId.toUpperCase()}-01`,
            quantity: 5600,
            magazines: 93,
            timeRange: '08:00 - 13:00',
            status: 'Completed',
            operatorId: 'Chaiwat T.',
            recipe: 'FVMI-25MP-P1',
            tempCelsius: 23.5,
            yieldRate: 99.85,
            rackShelf: 'Infeed Stn 1',
          },
        ],
      },
      {
        modelId: '504-2224',
        modelName: 'Model 504-2224 (Power Board)',
        category: 'FVMI Optical Classification',
        runCount: 3360,
        magazinesCount: 56,
        targetCount: 3400,
        percentage: 30.0,
        volumeRank: 'medium',
        volumeRankLabelTh: 'Normal',
        rankNumber: 2,
        lots: [
          {
            lotId: `LOT-${machineId.toUpperCase()}-02`,
            quantity: 3360,
            magazines: 56,
            timeRange: '13:00 - 15:30',
            status: 'Completed',
            operatorId: 'Chaiwat T.',
            recipe: 'FVMI-25MP-P2',
            tempCelsius: 23.8,
            yieldRate: 99.75,
            rackShelf: 'Infeed Stn 2',
          },
        ],
      },
      {
        modelId: '504-2154',
        modelName: 'Model 504-2154 (RF Module)',
        category: 'FVMI Optical Classification',
        runCount: 2240,
        magazinesCount: 37,
        targetCount: 2300,
        percentage: 20.0,
        volumeRank: 'lowest',
        volumeRankLabelTh: 'Normal',
        rankNumber: 3,
        lots: [
          {
            lotId: `LOT-${machineId.toUpperCase()}-03`,
            quantity: 2240,
            magazines: 37,
            timeRange: '15:30 - 17:00',
            status: 'Completed',
            operatorId: 'Chaiwat T.',
            recipe: 'FVMI-25MP-P3',
            tempCelsius: 23.6,
            yieldRate: 99.9,
            rackShelf: 'Infeed Stn 3',
          },
        ],
      },
    ];

    const baseHourly = [980, 1060, 1150, 1100, 1140, 930, 1130, 1115, 1165, 1145];
    const seed = machineId.split('').reduce((acc, c, idx) => acc + c.charCodeAt(0) * (idx + 1), 0);

    return {
      machineId,
      machineName: customName || machineId.toUpperCase(),
      chamberLabel: `${customName || machineId.toUpperCase()} 25MP Telecentric`,
      subType: 'FVMI',
      status: 'RUNNING',
      totalPcs: fvmiTotalPcs,
      totalMagazines: 186,
      targetPcs: 11000,
      operatorId: 'Staff ID: 08440 (Chaiwat T.)',
      hourlyOutput: HOURLY_TIME_SLOTS.map((hour, idx) => {
        const val = Math.max(650, (baseHourly[idx] || 1100) + Math.round(Math.sin(seed + idx) * 25));
        return {
          hour,
          actualPcs: val,
          targetPcs: 1100,
          actualMag: Math.round(val / 60),
          targetMag: 18,
          isHigh: val >= 1100,
        };
      }),
      models: fvmiModels,
    };
  }

  // Fallback dynamic generator for other machines (Dispensing)
  const defaultTotal = 1200;
  const models: ModelRunDetail[] = [
    {
      modelId: '504-2187',
      modelName: 'Model 504-2187 (Logic Core)',
      category: 'Surface Mount / Packaging',
      runCount: 660,
      magazinesCount: 11,
      targetCount: 700,
      percentage: 55.0,
      volumeRank: 'highest',
      volumeRankLabelTh: 'Highest',
      rankNumber: 1,
      lots: [
        {
          lotId: `LOT-${machineId.toUpperCase()}-01`,
          quantity: 660,
          magazines: 11,
          timeRange: '08:00 - 13:00',
          status: 'Completed',
          operatorId: 'Operator A',
          recipe: 'STANDARD-RUN-01',
          tempCelsius: 25.0,
          yieldRate: 99.7,
          rackShelf: 'Tray Slot A'
        }
      ]
    },
    {
      modelId: '504-2154',
      modelName: 'Model 504-2154 (RF Module)',
      category: 'Surface Mount / Packaging',
      runCount: 420,
      magazinesCount: 7,
      targetCount: 450,
      percentage: 35.0,
      volumeRank: 'medium',
      volumeRankLabelTh: 'Medium',
      rankNumber: 2,
      lots: [
        {
          lotId: `LOT-${machineId.toUpperCase()}-02`,
          quantity: 420,
          magazines: 7,
          timeRange: '13:00 - 16:00',
          status: 'Completed',
          operatorId: 'Operator A',
          recipe: 'STANDARD-RUN-02',
          tempCelsius: 25.0,
          yieldRate: 99.6,
          rackShelf: 'Tray Slot B'
        }
      ]
    },
    {
      modelId: '504-2224',
      modelName: 'Model 504-2224 (Power Board)',
      category: 'Surface Mount / Packaging',
      runCount: 120,
      magazinesCount: 2,
      targetCount: 150,
      percentage: 10.0,
      volumeRank: 'lowest',
      volumeRankLabelTh: 'Lowest',
      rankNumber: 3,
      lots: [
        {
          lotId: `LOT-${machineId.toUpperCase()}-03`,
          quantity: 120,
          magazines: 2,
          timeRange: '16:00 - 17:00',
          status: 'Completed',
          operatorId: 'Operator A',
          recipe: 'STANDARD-RUN-03',
          tempCelsius: 25.0,
          yieldRate: 99.4,
          rackShelf: 'Tray Slot C'
        }
      ]
    }
  ];

  return {
    machineId,
    machineName: customName || machineId.toUpperCase(),
    chamberLabel: `${customName || machineId.toUpperCase()} Unit Flow`,
    subType: subType || 'Dispensing',
    status: 'RUNNING',
    totalPcs: defaultTotal,
    totalMagazines: 20,
    targetPcs: 1300,
    operatorId: 'Staff ID: 08450',
    hourlyOutput: HOURLY_TIME_SLOTS.map((hour, idx) => ({
      hour,
      actualPcs: 110 + ((idx * 7) % 30),
      targetPcs: 130,
      actualMag: 2,
      targetMag: 2,
      isHigh: (110 + ((idx * 7) % 30)) >= 120
    })),
    models
  };
}

export function getHourlyModelDetails(
  summary: MachineRunSummary | null,
  hour: string
): ModelRunDetail | null {
  if (!summary || !summary.models || summary.models.length === 0) return null;
  if (summary.models.length === 1) return summary.models[0];

  for (const model of summary.models) {
    if (model.lots) {
      for (const lot of model.lots) {
        if (lot.timeRange && lot.timeRange.includes(hour)) {
          return model;
        }
      }
    }
  }

  const hourIdx = HOURLY_TIME_SLOTS.indexOf(hour);
  if (hourIdx !== -1) {
    const modelIdx = Math.floor((hourIdx / HOURLY_TIME_SLOTS.length) * summary.models.length);
    return summary.models[modelIdx] || summary.models[0];
  }

  return summary.models[0];
}
