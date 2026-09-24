import { MachineRunSummary, ModelRunDetail, getMachineRunSummary } from '../data/machineModelData';

export interface HourlyModelDetails {
  modelId: string;
  modelName: string;
  category: string;
  volumeRank: 'highest' | 'medium' | 'lowest' | 'single' | string;
  volumeRankLabelTh: string;
  rankNumber: number;
  lotId: string;
  recipe: string;
  timeRange: string;
  actualPcs: number;
  actualMag: number;
  targetPcs: number;
  targetMag: number;
  efficiencyPercent: number;
  isHigh: boolean;
  status: string;
}

export interface ModelRangeSummary {
  modelId: string;
  modelName: string;
  category: string;
  volumeRank: 'highest' | 'medium' | 'lowest' | 'single' | string;
  volumeRankLabelTh: string;
  rankNumber: number;
  totalPcs: number;
  totalMagazines: number;
  targetPcs: number;
  percentage: number;
  fulfillmentPercent: number;
  activeTimeRange: string;
  minHourlyPcs: number;
  maxHourlyPcs: number;
  avgHourlyPcs: number;
  minHourlyMag: number;
  maxHourlyMag: number;
  activeHours: string[];
  lots: Array<{
    lotId: string;
    quantity: number;
    magazines: number;
    timeRange: string;
    recipe?: string;
    yieldRate?: number;
    status: string;
  }>;
}

/**
 * Maps hour (e.g. "08:00") to the exact model & lot running in that hour
 */
export function getHourlyModelDetails(
  machineSummary: MachineRunSummary,
  hour: string
): HourlyModelDetails {
  const hourNum = parseInt(hour.split(':')[0], 10);
  const hourlySlot = machineSummary.hourlyOutput.find((h) => h.hour === hour) || {
    hour,
    actualPcs: 110,
    targetPcs: 120,
    actualMag: 2,
    targetMag: 2,
    isHigh: true,
  };

  const models = machineSummary.models;

  // Specific mapping for known Vacuum Chamber 1 (oven-1)
  if (machineSummary.machineId === 'oven-1') {
    if (hourNum >= 8 && hourNum < 15) {
      const isFirstHalf = hourNum < 12;
      const model = models[0]; // 504-2187
      const lot = isFirstHalf ? model.lots[0] : (model.lots[1] || model.lots[0]);
      return {
        modelId: model.modelId,
        modelName: model.modelName,
        category: model.category,
        volumeRank: model.volumeRank,
        volumeRankLabelTh: model.volumeRankLabelTh,
        rankNumber: model.rankNumber,
        lotId: lot?.lotId || 'LOT-2026-09A1',
        recipe: lot?.recipe || 'VAC-UF-CORE-180C',
        timeRange: lot?.timeRange || '08:00 - 14:45',
        actualPcs: hourlySlot.actualPcs,
        actualMag: hourlySlot.actualMag,
        targetPcs: hourlySlot.targetPcs,
        targetMag: hourlySlot.targetMag,
        efficiencyPercent: Math.round((hourlySlot.actualPcs / Math.max(1, hourlySlot.targetPcs)) * 100),
        isHigh: hourlySlot.isHigh,
        status: lot?.status || 'Completed',
      };
    } else if (hourNum === 15) {
      const model = models[1] || models[0]; // 504-2154
      const lot = model.lots[0];
      return {
        modelId: model.modelId,
        modelName: model.modelName,
        category: model.category,
        volumeRank: model.volumeRank,
        volumeRankLabelTh: model.volumeRankLabelTh,
        rankNumber: model.rankNumber,
        lotId: lot?.lotId || 'LOT-2026-09B1',
        recipe: lot?.recipe || 'VAC-RF-DEGAS-175C',
        timeRange: lot?.timeRange || '14:45 - 16:00',
        actualPcs: hourlySlot.actualPcs,
        actualMag: hourlySlot.actualMag,
        targetPcs: hourlySlot.targetPcs,
        targetMag: hourlySlot.targetMag,
        efficiencyPercent: Math.round((hourlySlot.actualPcs / Math.max(1, hourlySlot.targetPcs)) * 100),
        isHigh: hourlySlot.isHigh,
        status: lot?.status || 'In-Progress',
      };
    } else {
      const model = models[2] || models[models.length - 1]; // 504-2224
      const lot = model.lots[0];
      return {
        modelId: model.modelId,
        modelName: model.modelName,
        category: model.category,
        volumeRank: model.volumeRank,
        volumeRankLabelTh: model.volumeRankLabelTh,
        rankNumber: model.rankNumber,
        lotId: lot?.lotId || 'LOT-2026-08F9',
        recipe: lot?.recipe || 'VAC-PWR-QUICK-180C',
        timeRange: lot?.timeRange || '16:00 - 17:00',
        actualPcs: hourlySlot.actualPcs,
        actualMag: hourlySlot.actualMag,
        targetPcs: hourlySlot.targetPcs,
        targetMag: hourlySlot.targetMag,
        efficiencyPercent: Math.round((hourlySlot.actualPcs / Math.max(1, hourlySlot.targetPcs)) * 100),
        isHigh: hourlySlot.isHigh,
        status: lot?.status || 'Completed',
      };
    }
  }

  // Specific mapping for known Vacuum Chamber 2 (oven-2)
  if (machineSummary.machineId === 'oven-2') {
    if (hourNum >= 8 && hourNum < 15) {
      const isFirstHalf = hourNum < 12;
      const model = models[0]; // 504-2268
      const lot = isFirstHalf ? model.lots[0] : (model.lots[1] || model.lots[0]);
      return {
        modelId: model.modelId,
        modelName: model.modelName,
        category: model.category,
        volumeRank: model.volumeRank,
        volumeRankLabelTh: model.volumeRankLabelTh,
        rankNumber: model.rankNumber,
        lotId: lot?.lotId || 'LOT-2026-09C1',
        recipe: lot?.recipe || 'VAC-WIFI-COMM-170C',
        timeRange: lot?.timeRange || '08:00 - 15:30',
        actualPcs: hourlySlot.actualPcs,
        actualMag: hourlySlot.actualMag,
        targetPcs: hourlySlot.targetPcs,
        targetMag: hourlySlot.targetMag,
        efficiencyPercent: Math.round((hourlySlot.actualPcs / Math.max(1, hourlySlot.targetPcs)) * 100),
        isHigh: hourlySlot.isHigh,
        status: lot?.status || 'Completed',
      };
    } else if (hourNum === 15 || hourNum === 16) {
      const model = models[1] || models[0]; // 504-2454
      const lot = model.lots[0];
      return {
        modelId: model.modelId,
        modelName: model.modelName,
        category: model.category,
        volumeRank: model.volumeRank,
        volumeRankLabelTh: model.volumeRankLabelTh,
        rankNumber: model.rankNumber,
        lotId: lot?.lotId || 'LOT-2026-09D1',
        recipe: lot?.recipe || 'VAC-SRV-DENSE-185C',
        timeRange: lot?.timeRange || '14:00 - 17:00',
        actualPcs: hourlySlot.actualPcs,
        actualMag: hourlySlot.actualMag,
        targetPcs: hourlySlot.targetPcs,
        targetMag: hourlySlot.targetMag,
        efficiencyPercent: Math.round((hourlySlot.actualPcs / Math.max(1, hourlySlot.targetPcs)) * 100),
        isHigh: hourlySlot.isHigh,
        status: lot?.status || 'Completed',
      };
    } else {
      const model = models[2] || models[models.length - 1]; // 504-2090
      const lot = model.lots[0];
      return {
        modelId: model.modelId,
        modelName: model.modelName,
        category: model.category,
        volumeRank: model.volumeRank,
        volumeRankLabelTh: model.volumeRankLabelTh,
        rankNumber: model.rankNumber,
        lotId: lot?.lotId || 'LOT-2026-08S3',
        recipe: lot?.recipe || 'VAC-SENS-LOW-165C',
        timeRange: lot?.timeRange || '16:00 - 17:00',
        actualPcs: hourlySlot.actualPcs,
        actualMag: hourlySlot.actualMag,
        targetPcs: hourlySlot.targetPcs,
        targetMag: hourlySlot.targetMag,
        efficiencyPercent: Math.round((hourlySlot.actualPcs / Math.max(1, hourlySlot.targetPcs)) * 100),
        isHigh: hourlySlot.isHigh,
        status: lot?.status || 'Completed',
      };
    }
  }

  // Dynamic matching for other machines:
  // Check lot timeRanges first
  for (const model of models) {
    for (const lot of model.lots) {
      if (lot.timeRange) {
        const parts = lot.timeRange.split('-');
        if (parts.length === 2) {
          const startH = parseInt(parts[0].trim().split(':')[0], 10);
          const endH = parseInt(parts[1].trim().split(':')[0], 10);
          if (hourNum >= startH && hourNum < endH) {
            return {
              modelId: model.modelId,
              modelName: model.modelName,
              category: model.category,
              volumeRank: model.volumeRank,
              volumeRankLabelTh: model.volumeRankLabelTh,
              rankNumber: model.rankNumber,
              lotId: lot.lotId,
              recipe: lot.recipe || 'STD-RECIPE',
              timeRange: lot.timeRange,
              actualPcs: hourlySlot.actualPcs,
              actualMag: hourlySlot.actualMag,
              targetPcs: hourlySlot.targetPcs,
              targetMag: hourlySlot.targetMag,
              efficiencyPercent: Math.round((hourlySlot.actualPcs / Math.max(1, hourlySlot.targetPcs)) * 100),
              isHigh: hourlySlot.isHigh,
              status: lot.status,
            };
          }
        }
      }
    }
  }

  // Proportional index fallback
  const idx = hourNum < 14 ? 0 : hourNum < 16 ? Math.min(1, models.length - 1) : Math.min(2, models.length - 1);
  const selectedModel = models[idx] || models[0];
  const defaultLot = selectedModel?.lots[0];

  return {
    modelId: selectedModel.modelId,
    modelName: selectedModel.modelName,
    category: selectedModel.category,
    volumeRank: selectedModel.volumeRank,
    volumeRankLabelTh: selectedModel.volumeRankLabelTh,
    rankNumber: selectedModel.rankNumber,
    lotId: defaultLot?.lotId || 'LOT-2026-DEFAULT',
    recipe: defaultLot?.recipe || 'STD-RECIPE',
    timeRange: defaultLot?.timeRange || `${hour} - 17:00`,
    actualPcs: hourlySlot.actualPcs,
    actualMag: hourlySlot.actualMag,
    targetPcs: hourlySlot.targetPcs,
    targetMag: hourlySlot.targetMag,
    efficiencyPercent: Math.round((hourlySlot.actualPcs / Math.max(1, hourlySlot.targetPcs)) * 100),
    isHigh: hourlySlot.isHigh,
    status: defaultLot?.status || 'Normal',
  };
}

/**
 * Calculates complete Range metrics for every model running on a machine
 */
export function computeModelRangesForMachine(machineSummary: MachineRunSummary): ModelRangeSummary[] {
  const shiftHours = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  return machineSummary.models.map((model) => {
    // Find all hours where this model was active
    const activeHourSlots = shiftHours
      .map((hour) => ({
        hour,
        details: getHourlyModelDetails(machineSummary, hour),
      }))
      .filter((item) => item.details.modelId === model.modelId);

    const pcsValues = activeHourSlots.map((s) => s.details.actualPcs);
    const magValues = activeHourSlots.map((s) => s.details.actualMag);

    const minPcs = pcsValues.length > 0 ? Math.min(...pcsValues) : Math.round(model.runCount / 8);
    const maxPcs = pcsValues.length > 0 ? Math.max(...pcsValues) : Math.round((model.runCount / 8) * 1.2);
    const avgPcs = pcsValues.length > 0
      ? Math.round(pcsValues.reduce((a, b) => a + b, 0) / pcsValues.length)
      : Math.round(model.runCount / (model.magazinesCount || 1));

    const minMag = magValues.length > 0 ? Math.min(...magValues) : 1;
    const maxMag = magValues.length > 0 ? Math.max(...magValues) : 2;

    const fulfillmentPercent = model.targetCount > 0
      ? Math.round((model.runCount / model.targetCount) * 100)
      : 100;

    // Determine overall time range from lots
    const timeRangeStr = model.lots.length > 0
      ? `${model.lots[0].timeRange.split('-')[0].trim()} - ${model.lots[model.lots.length - 1].timeRange.split('-')[1]?.trim() || '17:00'}`
      : activeHourSlots.length > 0
      ? `${activeHourSlots[0].hour} - ${activeHourSlots[activeHourSlots.length - 1].hour}`
      : '08:00 - 17:00';

    return {
      modelId: model.modelId,
      modelName: model.modelName,
      category: model.category,
      volumeRank: model.volumeRank,
      volumeRankLabelTh: model.volumeRankLabelTh,
      rankNumber: model.rankNumber,
      totalPcs: model.runCount,
      totalMagazines: model.magazinesCount,
      targetPcs: model.targetCount,
      percentage: model.percentage,
      fulfillmentPercent,
      activeTimeRange: timeRangeStr,
      minHourlyPcs: minPcs,
      maxHourlyPcs: maxPcs,
      avgHourlyPcs: avgPcs,
      minHourlyMag: minMag,
      maxHourlyMag: maxMag,
      activeHours: activeHourSlots.map((s) => s.hour),
      lots: model.lots.map((l) => ({
        lotId: l.lotId,
        quantity: l.quantity,
        magazines: l.magazines,
        timeRange: l.timeRange,
        recipe: l.recipe,
        yieldRate: l.yieldRate,
        status: l.status,
      })),
    };
  });
}
