import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Download, AlertTriangle, CheckCircle2, ShieldAlert, Cpu, Layers, Tag, Clock } from 'lucide-react';

export type InspectionCategoryType = 'GOOD' | 'PASS' | 'NG' | 'FAIL' | 'XOUT' | 'REWORK' | 'DISCARD';
export type InspectionStationType = 'FVMI' | 'AOI' | 'XRAY';

export interface InspectionPopupPayload {
  stationName: string; // e.g. "AOI-01", "FVMI-03", "X-RAY-01"
  stationType: InspectionStationType;
  hourSlot: string; // e.g. "09:00 - 10:00"
  jobNo: string; // e.g. "JOB-504-2187-0900"
  product: string; // e.g. "504-2187"
  side: 'TOP' | 'BOTTOM' | 'DUAL' | 'TOP/BOT' | 'BOT';
  category: InspectionCategoryType;
  count: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: InspectionPopupPayload | null;
}

const AOI_DEFECTS = [
  'Missing Component (C204 0402 Cap)',
  'Solder Bridge (QFP-64 Pin 14-15)',
  'Misaligned IC (QFP-48 12° Skew)',
  'Insufficient Solder Fillet (R15 Pad)',
  'Tombstone Defect (Resistor 0402 R88)',
  'Polarity Inverted (Diode D3)',
  'Excess Solder Ball on Lead (U4)',
  'Lifted Lead (SOIC-8 Pin 1)',
  'Billboard / Shifted Passive (C112)',
  'Foreign Material on Trace (L2 Area)'
];

const XRAY_DEFECTS = [
  'BGA Solder Ball Void (19.8% > 15.0% Spec)',
  'QFN Center Ground Pad Void (24.2%)',
  'Solder Bridge under BGA Grid F7-F8',
  'Head-in-Pillow (HiP) Non-Wet Joint (Ball C4)',
  'Micro-Crack in BGA Intermetallic Layer',
  'Thermal Pad Excessive Voiding (22.5%)',
  'Partial Joint Separation under Package',
  'Solder Beading under CSP Die Area'
];

const FVMI_DEFECTS = [
  'Underfill Epoxy Bleedout > 0.5mm',
  'Underfill Edge Void / Air Bubble',
  'Epoxy Fillet Height Deficit (< 50%)',
  'Foreign Particle Contamination on Die',
  'Die Surface Scratch / Edge Chip-Out',
  'Epoxy Overflow onto Adjacent Passives',
  'Dispense Incomplete Coverage at Corner',
  'Epoxy Meniscus Incomplete Cure Texture'
];

const XOUT_DEFECTS = [
  'Bad Board Marked (Array Unit X-Out)',
  'Fabrication Defect Mark Stamped',
  'Pre-Assembly Panel Reject Unit',
  'Array Skipping Marker Detected'
];

const REWORK_DEFECTS = [
  'Underfill Fillet Touch-Up Required',
  'Excess Adhesive Surface Wipe Required',
  'Secondary Cure Touch-up Required',
  'Edge Delamination Touch-up Required'
];

const DISCARD_DEFECTS = [
  'Cracked Substrate Core - Irrecoverable',
  'Severe Die Fractured by Nozzle Impact',
  'Gross Epoxy Contamination over Active Sensor',
  'Terminal Burn / Blistered Substrate Layer'
];

export const InspectionDetailModal: React.FC<Props> = ({ isOpen, onClose, data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sideFilter, setSideFilter] = useState<'ALL' | 'TOP' | 'BOT'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Reset page and search on new open
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSideFilter('ALL');
      setCurrentPage(1);
    }
  }, [isOpen, data]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isGood = data ? (data.category === 'GOOD' || data.category === 'PASS') : false;
  const isXout = data ? data.category === 'XOUT' : false;
  const isNg = data ? (data.category === 'NG' || data.category === 'FAIL') : false;
  const isRework = data ? data.category === 'REWORK' : false;
  const isDiscard = data ? data.category === 'DISCARD' : false;

  // Generate list of items according to the exact count requested
  const allUnits = useMemo(() => {
    if (!data || data.count <= 0) return [];
    
    const count = data.count;
    const hourPrefix = data.hourSlot ? data.hourSlot.slice(0, 2) : '08';
    const prodClean = data.product ? data.product.replace(/[^a-zA-Z0-9]/g, '') : '2187';

    let defectPool = AOI_DEFECTS;
    if (data.stationType === 'XRAY') {
      defectPool = XRAY_DEFECTS;
    } else if (data.stationType === 'FVMI') {
      defectPool = FVMI_DEFECTS;
    }
    if (isXout) {
      defectPool = XOUT_DEFECTS;
    } else if (isRework) {
      defectPool = REWORK_DEFECTS;
    } else if (isDiscard) {
      defectPool = DISCARD_DEFECTS;
    }

    const items = [];
    for (let i = 1; i <= count; i++) {
      const serialNum = `${String(1000 + i).slice(1)}`;
      const serialNo = `WP-${prodClean}-${hourPrefix}${serialNum}`;
      
      let ngDescription = 'PASS (All Inspection Criteria Met)';
      let defectLocation = '-';

      if (isNg) {
        const defectIndex = (i - 1) % defectPool.length;
        ngDescription = defectPool[defectIndex];
        const compTypes = ['U', 'C', 'R', 'D', 'BGA', 'QFN'];
        const compType = compTypes[(i * 3) % compTypes.length];
        const compNum = ((i * 7) % 50) + 1;
        defectLocation = `${compType}${compNum}${compType === 'U' || compType === 'BGA' ? `-Pin${(i * 5) % 32 + 1}` : '-Pad'}`;
      } else if (isXout) {
        const defectIndex = (i - 1) % defectPool.length;
        ngDescription = defectPool[defectIndex];
        defectLocation = `ARRAY-POS-${((i - 1) % 12) + 1}`;
      } else if (isRework) {
        const defectIndex = (i - 1) % defectPool.length;
        ngDescription = defectPool[defectIndex];
        defectLocation = `REWORK-STATION-${((i - 1) % 3) + 1}`;
      } else if (isDiscard) {
        const defectIndex = (i - 1) % defectPool.length;
        ngDescription = defectPool[defectIndex];
        defectLocation = 'DISCARD-BIN-CRITICAL';
      }

      // Distribute timestamps through the hour slot
      const minute = Math.min(59, Math.floor(((i - 1) / Math.max(1, count)) * 58) + 1);
      const second = (i * 19) % 60;
      const timestamp = `${hourPrefix}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

      // FVMI sample sides: alternating/randomized BOT and TOP
      // AOI NG units: include BOT side as well
      let unitSide: 'TOP' | 'BOTTOM' | 'DUAL' | 'TOP/BOT' | 'BOT' = 'TOP';

      if (data.side === 'BOT' || data.side === 'BOTTOM') {
        unitSide = 'BOT';
      } else if (data.side === 'TOP' && !(data.stationType === 'AOI' && isNg)) {
        unitSide = 'TOP';
      } else if (
        data.stationType === 'FVMI' ||
        data.stationType === 'AOI' ||
        data.side === 'TOP/BOT' ||
        data.side === 'DUAL' ||
        data.stationName.toUpperCase().includes('FVMI') ||
        data.stationName.toUpperCase().includes('AOI')
      ) {
        // Natural alternating & pseudo-randomized sequence (TOP, BOT, TOP, BOT, BOT, TOP, BOT, TOP, TOP, BOT)
        const sidePattern = ['TOP', 'BOT', 'TOP', 'BOT', 'BOT', 'TOP', 'BOT', 'TOP', 'TOP', 'BOT', 'BOT', 'TOP'];
        const seedShift = ((prodClean.charCodeAt(0) || 7) + (hourPrefix.charCodeAt(0) || 3)) % sidePattern.length;
        unitSide = sidePattern[(i + seedShift) % sidePattern.length] as 'TOP' | 'BOTTOM' | 'DUAL' | 'TOP/BOT' | 'BOT';
      } else {
        unitSide = data.side;
      }

      items.push({
        index: i,
        serialNo,
        jobNo: data.jobNo,
        product: data.product,
        side: unitSide,
        ng: ngDescription,
        location: defectLocation,
        timestamp,
        status: data.category
      });
    }

    return items;
  }, [data, isNg, isXout, isRework, isDiscard]);

  // Filtered units by search term and side
  const filteredUnits = useMemo(() => {
    let list = allUnits;
    if (sideFilter !== 'ALL') {
      list = list.filter((u) => {
        if (sideFilter === 'BOT') return u.side === 'BOT' || u.side === 'BOTTOM';
        if (sideFilter === 'TOP') return u.side === 'TOP';
        return true;
      });
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.serialNo.toLowerCase().includes(q) ||
          u.jobNo.toLowerCase().includes(q) ||
          u.product.toLowerCase().includes(q) ||
          u.side.toLowerCase().includes(q) ||
          u.ng.toLowerCase().includes(q) ||
          u.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allUnits, searchTerm, sideFilter]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / pageSize));
  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUnits.slice(start, start + pageSize);
  }, [filteredUnits, currentPage, pageSize]);

  if (!isOpen || !data) return null;

  const handleExportCSV = () => {
    const headers = ['No', 'Serial No', 'Job No', 'Product', 'Side', 'NG / Status', 'Location', 'Timestamp', 'Category'];
    const rows = filteredUnits.map((u) => [
      u.index,
      u.serialNo,
      `"${u.jobNo}"`,
      `"${u.product}"`,
      u.side,
      `"${u.ng}"`,
      `"${u.location}"`,
      u.timestamp,
      u.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${data.stationName}_${data.category}_${data.product}_${data.jobNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryBadgeClass = () => {
    if (isGood) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (isNg) return 'bg-rose-100 text-rose-800 border-rose-300';
    if (isXout) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (isRework) return 'bg-sky-100 text-sky-800 border-sky-300';
    if (isDiscard) return 'bg-rose-200 text-rose-900 border-rose-400';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  const getCategoryIcon = () => {
    if (isGood) return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (isNg) return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    if (isXout) return <ShieldAlert className="w-4 h-4 text-amber-600" />;
    if (isRework) return <Cpu className="w-4 h-4 text-sky-600" />;
    if (isDiscard) return <AlertTriangle className="w-4 h-4 text-rose-700" />;
    return <Cpu className="w-4 h-4 text-sky-600" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs ${getCategoryBadgeClass()}`}>
              {getCategoryIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {data.stationName} • {data.category} Details
                </h3>
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass()}`}>
                  {data.category} ({data.count.toLocaleString()} pcs)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Hour Slot: {data.hourSlot}</span>
                <span className="text-slate-300">•</span>
                <span>Type: {data.stationType}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredUnits.length === 0}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Core Inspection Cards (JOB NO, PRODUCT, SIDE, NG) */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* JOB NO */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                JOB NO
              </span>
              <span className="text-xs sm:text-sm font-black font-mono text-slate-900 mt-1 truncate" title={data.jobNo}>
                {data.jobNo}
              </span>
            </div>

            {/* PRODUCT */}
            <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200/80 flex flex-col">
              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3 h-3 text-sky-600" />
                PRODUCT
              </span>
              <span className="text-xs sm:text-sm font-black font-mono text-sky-950 mt-1 truncate" title={data.product}>
                {data.product}
              </span>
            </div>

            {/* SIDE */}
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/80 flex flex-col">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-600" />
                SIDE
              </span>
              <div className="text-xs sm:text-sm font-black font-mono text-indigo-950 mt-1">
                {data.side === 'BOT' || data.side === 'BOTTOM' ? (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold font-mono">
                    BOT (Bottom Side)
                  </span>
                ) : data.side === 'TOP' && !((data.stationType === 'AOI' || data.stationType === 'FVMI') && isNg) ? (
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold font-mono">
                    TOP (Top Side)
                  </span>
                ) : (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold font-mono">TOP</span>
                    <span className="text-slate-400 font-sans text-xs">/</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold font-mono">BOT</span>
                    <span className="text-[10px] font-normal text-slate-500 font-sans">(Top &amp; Bot)</span>
                  </div>
                )}
              </div>
            </div>

            {/* NG / CATEGORY */}
            <div className={`p-3 rounded-xl border flex flex-col ${
              isNg ? 'bg-rose-50/70 border-rose-200 text-rose-950' :
              isGood ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' :
              'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                STATUS / NG
              </span>
              <span className="text-xs sm:text-sm font-black font-mono mt-1 flex items-center justify-between">
                <span>{data.category}</span>
                <span className="text-xs font-bold font-mono">
                  {data.count.toLocaleString()} pcs
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search serial, defect, pin location..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Quick Side Filter */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Side:</span>
            <button
              type="button"
              onClick={() => {
                setSideFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                sideFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setSideFilter('TOP');
                setCurrentPage(1);
              }}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                sideFilter === 'TOP'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              TOP
            </button>
            <button
              type="button"
              onClick={() => {
                setSideFilter('BOT');
                setCurrentPage(1);
              }}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                sideFilter === 'BOT'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
              }`}
            >
              BOT
            </button>
          </div>

          <span className="text-xs font-mono text-slate-500 shrink-0">
            Showing <strong className="text-slate-800">{filteredUnits.length}</strong> of {allUnits.length} units
          </span>
        </div>

        {/* Units Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredUnits.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              No matching records found.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 font-bold w-12 text-center">#</th>
                    <th className="p-2.5 font-bold">Serial ID</th>
                    <th className="p-2.5 font-bold">JOB NO</th>
                    <th className="p-2.5 font-bold">PRODUCT</th>
                    <th className="p-2.5 font-bold text-center">SIDE</th>
                    <th className="p-2.5 font-bold">NG / Inspection Detail</th>
                    <th className="p-2.5 font-bold">Location</th>
                    <th className="p-2.5 font-bold text-center">Time</th>
                    <th className="p-2.5 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUnits.map((u) => {
                    const isUnitNg = u.status === 'NG' || u.status === 'FAIL';
                    const isUnitXout = u.status === 'XOUT';
                    return (
                      <tr key={u.index} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 text-center text-slate-400 font-bold">{u.index}</td>
                        <td className="p-2.5 font-bold text-slate-900">{u.serialNo}</td>
                        <td className="p-2.5 text-slate-700 font-semibold">{u.jobNo}</td>
                        <td className="p-2.5 text-sky-800 font-bold">{u.product}</td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] border font-mono ${
                              u.side === 'BOT' || u.side === 'BOTTOM'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {u.side === 'BOTTOM' ? 'BOT' : u.side}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {isUnitNg ? (
                            <span className="text-rose-700 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              {u.ng}
                            </span>
                          ) : isUnitXout ? (
                            <span className="text-amber-700 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {u.ng}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {u.ng}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600 font-medium">{u.location}</td>
                        <td className="p-2.5 text-center text-slate-500 text-[11px]">{u.timestamp}</td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isUnitNg
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isUnitXout
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="text-slate-500">
            Total <strong className="text-slate-800">{allUnits.length}</strong> units recorded for this slot
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer transition-colors"
            >
              Prev
            </button>
            <span className="text-slate-600 font-bold px-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer transition-colors"
            >
              Next
            </button>

            <button
              onClick={onClose}
              className="ml-2 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
