/**
 * Utility functions for normalizing machine IDs and routing
 * for X-ray (Units 1, 2, 3, 4, 5) and AOI (Units 1, 2).
 */

export const ALL_XRAY_MACHINES = [
  { id: 'X-RAY 01', num: 1, label: 'X-Ray 1', line: 'Line 1', desc: 'Top Fill & Bake Radiography' },
  { id: 'X-RAY 02', num: 2, label: 'X-Ray 2', line: 'Line 2', desc: 'Top Fill & Vacuum Inspection' },
  { id: 'X-RAY 03', num: 3, label: 'X-Ray 3', line: 'Line 3', desc: 'Under Fill & Bake NDT' },
  { id: 'X-RAY 04', num: 4, label: 'X-Ray 4', line: 'Line 4', desc: 'Under Fill & Vacuum Chamber' },
  { id: 'X-RAY 05', num: 5, label: 'X-Ray 5', line: 'Line 5', desc: 'High-Density Micro-Focus Core' },
  { id: 'X-RAY 06', num: 6, label: 'X-Ray 6', line: 'Line 6', desc: 'Radiography & Final Void Inspection' }
] as const;

export const ALL_AOI_MACHINES = [
  { id: 'AOI-01', num: 1, label: 'AOI 1', line: 'Line 1', desc: 'Top Fill & Pre-Pack' },
  { id: 'AOI-02', num: 2, label: 'AOI 2', line: 'Line 2', desc: 'Top Fill & Vacuum A' }
] as const;

/**
 * Normalizes any variation of X-ray machine reference to canonical "X-RAY 01" .. "X-RAY 06"
 */
export function normalizeXrayMachineId(rawId?: string): string {
  if (!rawId) return 'X-RAY 01';
  const clean = rawId.toUpperCase().replace(/\s+/g, '').replace(/-/g, '');

  if (clean.includes('06') || clean.includes('XRAY6') || clean.endsWith('6') || clean.includes('OCR06') || clean.includes('L6')) return 'X-RAY 06';
  if (clean.includes('05') || clean.includes('XRAY5') || clean.endsWith('5') || clean.includes('OCR05') || clean.includes('L5')) return 'X-RAY 05';
  if (clean.includes('04') || clean.includes('XRAY4') || clean.endsWith('4') || clean.includes('OCR04') || clean.includes('L4')) return 'X-RAY 04';
  if (clean.includes('03') || clean.includes('XRAY3') || clean.endsWith('3') || clean.includes('OCR03') || clean.includes('L3')) return 'X-RAY 03';
  if (clean.includes('02') || clean.includes('XRAY2') || clean.endsWith('2') || clean.includes('OCR02') || clean.includes('L2')) return 'X-RAY 02';
  return 'X-RAY 01';
}

/**
 * Normalizes any variation of AOI machine reference to canonical "AOI-01" or "AOI-02"
 */
export function normalizeAoiMachineId(rawId?: string): string {
  if (!rawId) return 'AOI-01';
  const clean = rawId.toUpperCase().replace(/\s+/g, '').replace(/-/g, '');

  if (clean.includes('02') || clean.includes('AOI2') || clean.endsWith('2') || clean.includes('PACK02') || clean.includes('L2')) return 'AOI-02';
  return 'AOI-01';
}
