import React, { useState, useMemo } from 'react';
import {
  Barcode,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  Tag,
  ShieldCheck,
  User,
  Box
} from 'lucide-react';
import {
  MachineRunSummary,
  ModelRunDetail,
  LotRunRecord
} from '../data/machineModelData';

interface FlatLotItem extends LotRunRecord {
  modelId: string;
  modelName: string;
  category: string;
  modelColor: string;
  traceSerial: string;
}

interface MachineLotTraceabilityInlineSectionProps {
  machineSummary: MachineRunSummary;
  selectedHour?: string | null;
  onClearHourFilter?: () => void;
  viewUnit?: 'boards' | 'magazines';
  openTraceabilityModal?: (serialOrLot: string) => void;
  processType?: 'Vacuum' | 'Bake' | 'Dispensing' | string;
}

// Master color map for models
const MODEL_COLORS: Record<string, string> = {
  '504-2187': '#0284c7', // Sky Blue
  '504-2154': '#059669', // Emerald
  '504-2224': '#d97706', // Amber
  '504-2268': '#7c3aed', // Purple
  '504-2454': '#e11d48', // Rose
  '504-2090': '#475569'  // Slate
};

export const MachineLotTraceabilityInlineSection: React.FC<MachineLotTraceabilityInlineSectionProps> = ({
  machineSummary,
  selectedHour,
  onClearHourFilter,
  viewUnit = 'boards',
  openTraceabilityModal,
  processType = 'Dispensing'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'In-Progress'>('All');
  const [filterOnlySelectedHour, setFilterOnlySelectedHour] = useState<boolean>(false);

  // Flatten all lots from all models of this machine
  const allLots = useMemo<FlatLotItem[]>(() => {
    if (!machineSummary || !machineSummary.models) return [];

    const list: FlatLotItem[] = [];
    machineSummary.models.forEach((model, mIdx) => {
      const color = MODEL_COLORS[model.modelId] || '#0284c7';
      if (model.lots && model.lots.length > 0) {
        model.lots.forEach((lot, lIdx) => {
          // Deterministic unique workpiece traceability serial
          const numDigits = (lot.lotId + machineSummary.machineId)
            .replace(/[^0-9]/g, '')
            .padEnd(5, '8129');
          const traceSerial = `WP-2026-${numDigits.slice(0, 5)}`;

          list.push({
            ...lot,
            modelId: model.modelId,
            modelName: model.modelName,
            category: model.category,
            modelColor: color,
            traceSerial
          });
        });
      } else {
        // Fallback synthetic lot if none defined
        const traceSerial = `WP-2026-90${mIdx}12`;
        list.push({
          lotId: `LOT-${machineSummary.machineId.toUpperCase()}-0${mIdx + 1}`,
          quantity: model.runCount || 360,
          magazines: model.magazinesCount || 6,
          timeRange: '08:00 - 17:00',
          status: 'Completed',
          operatorId: machineSummary.operatorId || 'Staff ID: 08450',
          recipe: `RECIPE-${machineSummary.subType.toUpperCase()}-${model.modelId}`,
          tempCelsius: 25.0,
          yieldRate: 99.7,
          rackShelf: `Magazine Slot ${mIdx + 1}`,
          modelId: model.modelId,
          modelName: model.modelName,
          category: model.category,
          modelColor: color,
          traceSerial
        });
      }
    });

    return list;
  }, [machineSummary]);

  // Determine if a lot matches the selected hour
  const isLotInHour = (lot: FlatLotItem, hour: string) => {
    if (!hour) return false;
    const hourNum = parseInt(hour.split(':')[0], 10);
    // Parse timeRange like "08:00 - 11:30"
    const parts = lot.timeRange.split('-');
    if (parts.length === 2) {
      const startHour = parseInt(parts[0].trim().split(':')[0], 10);
      const endHour = parseInt(parts[1].trim().split(':')[0], 10);
      return hourNum >= startHour && hourNum <= endHour;
    }
    return lot.timeRange.includes(hour);
  };

  // Filtered lots based on search, status, and selected hour
  const filteredLots = useMemo(() => {
    return allLots.filter((lot) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          lot.lotId.toLowerCase().includes(q) ||
          lot.traceSerial.toLowerCase().includes(q) ||
          lot.modelName.toLowerCase().includes(q) ||
          lot.modelId.toLowerCase().includes(q) ||
          lot.recipe.toLowerCase().includes(q) ||
          lot.operatorId.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status
      if (statusFilter !== 'All' && lot.status !== statusFilter) {
        return false;
      }

      // Filter by hour if toggle active
      if (filterOnlySelectedHour && selectedHour) {
        return isLotInHour(lot, selectedHour);
      }

      return true;
    });
  }, [allLots, searchQuery, statusFilter, filterOnlySelectedHour, selectedHour]);

  // Summary statistics
  const totalLotsCount = allLots.length;
  const totalQuantityPcs = allLots.reduce((acc, l) => acc + (l.quantity || 0), 0);
  const totalMagazines = allLots.reduce((acc, l) => acc + (l.magazines || 0), 0);
  const avgYield =
    allLots.length > 0
      ? (
          allLots.reduce((acc, l) => acc + (l.yieldRate || 99.5), 0) / allLots.length
        ).toFixed(1)
      : '99.6';

  const handleTraceClick = (serial: string) => {
    if (openTraceabilityModal) {
      openTraceabilityModal(serial);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-sky-200/90 shadow-xs p-4 sm:p-5 space-y-4 font-sans text-slate-800">
      {/* ========================================================================= */}
      {/* 1. SECTION HEADER (TITLE & QUICK STATS)                                   */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0 shadow-2xs">
            <Barcode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base font-mono">
                รายละเอียด LOT & TRACEABILITY ของเครื่อง {machineSummary.machineName}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-100 text-sky-950 border border-sky-200">
                {totalLotsCount} Lots
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Yield {avgYield}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ข้อมูลล็อตการผลิต, หมายเลขบาร์โค้ดชิ้นงาน (Workpiece Serial), ช่วงเวลา และบันทึกประวัติการผลิต
            </p>
          </div>
        </div>

        {/* Selected Hour Filter Badge / Reset */}
        {selectedHour && (
          <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-sky-700" />
            <span className="text-slate-700">ชั่วโมงกราฟ:</span>
            <strong className="text-sky-950 font-bold">{selectedHour}</strong>
            <button
              onClick={() => {
                if (onClearHourFilter) onClearHourFilter();
                setFilterOnlySelectedHour(false);
              }}
              className="text-slate-400 hover:text-rose-600 font-bold ml-1.5 text-xs cursor-pointer"
              title="ล้างการเลือกชั่วโมง"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. STATS BANNER                                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] text-slate-500 uppercase block font-medium">จำนวนล็อตทั้งหมด</span>
          <div className="text-base font-black text-slate-900 mt-0.5">
            {totalLotsCount}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">lots</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] text-slate-500 uppercase block font-medium">ยอดผลิตรวมสะสม</span>
          <div className="text-base font-black text-slate-900 mt-0.5">
            {viewUnit === 'magazines'
              ? `${totalMagazines} mags`
              : `${totalQuantityPcs.toLocaleString()} boards`}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] text-slate-500 uppercase block font-medium">โมเดลที่รันในเครื่อง</span>
          <div className="text-base font-black text-sky-950 mt-0.5">
            {machineSummary.models.length}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">models</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
          <span className="text-[10px] text-emerald-800 uppercase block font-medium">Quality Yield Rate</span>
          <div className="text-base font-black text-emerald-700 mt-0.5">
            {avgYield}%{' '}
            <span className="text-[10px] font-normal text-emerald-600 font-sans">PASS</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEARCH & QUICK FILTER CONTROLS                                         */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา Lot ID, Workpiece Serial, Model..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedHour && (
            <button
              onClick={() => setFilterOnlySelectedHour(!filterOnlySelectedHour)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                filterOnlySelectedHour
                  ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-sky-200 hover:bg-sky-50'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>เฉพาะชั่วโมง {selectedHour}</span>
            </button>
          )}

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-mono">
            {(['All', 'Completed', 'In-Progress'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'All' ? 'ทุกล็อต' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LOT & TRACEABILITY TABLE (SHOWN DIRECTLY UNDER GRAPH)                  */}
      {/* ========================================================================= */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-sky-50/80 border-b border-sky-200 text-sky-950 uppercase text-[11px]">
              <th className="py-3 px-3.5">Lot ID & Serial Trace</th>
              <th className="py-3 px-3.5">โมเดล (Model / Recipe)</th>
              <th className="py-3 px-3.5">ช่วงเวลา (Timeline)</th>
              <th className="py-3 px-3.5">จำนวนผลิต (Output)</th>
              <th className="py-3 px-3.5">Yield & คุณภาพ</th>
              <th className="py-3 px-3.5">Operator & Shelf</th>
              <th className="py-3 px-3.5 text-right">การตรวจสอบ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredLots.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <AlertCircle className="w-5 h-5 text-slate-300" />
                    <span>ไม่พบข้อมูล Lot ที่ตรงกับเงื่อนไข</span>
                    {(searchQuery || filterOnlySelectedHour || statusFilter !== 'All') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('All');
                          setFilterOnlySelectedHour(false);
                        }}
                        className="text-xs text-sky-600 hover:underline font-bold mt-1"
                      >
                        ล้างตัวกรองทั้งหมด
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredLots.map((lot) => {
                const isSelectedTime = selectedHour ? isLotInHour(lot, selectedHour) : false;
                const isCompleted = lot.status === 'Completed';

                return (
                  <tr
                    key={lot.lotId}
                    className={`transition-colors group hover:bg-sky-50/50 ${
                      isSelectedTime ? 'bg-sky-50/80 ring-1 ring-inset ring-sky-300' : ''
                    }`}
                  >
                    {/* Lot ID & Barcode Serial */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-1.5">
                        {isSelectedTime && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" title="ตรงกับชั่วโมงที่เลือก" />
                        )}
                        <span className="font-bold text-slate-900 text-xs">
                          {lot.lotId}
                        </span>
                      </div>
                      {/* Clickable Workpiece Trace Serial */}
                      <button
                        onClick={() => handleTraceClick(lot.traceSerial)}
                        className="inline-flex items-center gap-1 mt-1 text-[11px] font-mono font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition-colors cursor-pointer"
                        title="คลิกเพื่อตรวจสอบย้อนกลับ (Traceability Timeline)"
                      >
                        <Barcode className="w-3 h-3 text-sky-600" />
                        <span>{lot.traceSerial}</span>
                      </button>
                    </td>

                    {/* Model & Recipe */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: lot.modelColor }}
                        />
                        <span className="truncate max-w-[190px]">{lot.modelName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        <span className="truncate max-w-[170px]">{lot.recipe}</span>
                      </div>
                    </td>

                    {/* Timeline */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md text-slate-800 text-xs border border-slate-200/70">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{lot.timeRange}</span>
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-black text-slate-900 text-xs">
                        {viewUnit === 'magazines'
                          ? `${lot.magazines} Mags`
                          : `${lot.quantity.toLocaleString()} Boards`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {viewUnit === 'magazines'
                          ? `(${lot.quantity.toLocaleString()} boards)`
                          : `(${lot.magazines} magazines)`}
                      </div>
                    </td>

                    {/* Yield */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-emerald-700 text-xs">
                          {lot.yieldRate || 99.6}%
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          PASS
                        </span>
                      </div>
                      <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, lot.yieldRate || 99.6)}%` }}
                        />
                      </div>
                    </td>

                    {/* Operator & Shelf */}
                    <td className="py-3 px-3.5">
                      <div className="text-xs text-slate-700 font-medium truncate max-w-[160px] flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{lot.operatorId}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[160px] flex items-center gap-1">
                        <Box className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{lot.rackShelf || 'Magazine Shelf A'}</span>
                      </div>
                    </td>

                    {/* Trace Action */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleTraceClick(lot.traceSerial)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-sky-50 border border-sky-300 hover:border-sky-400 text-sky-950 rounded-lg shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
                        title="ดูรายละเอียดการตรวจสอบย้อนกลับ (Traceability Timeline)"
                      >
                        <Barcode className="w-3.5 h-3.5 text-sky-600" />
                        <span>Trace</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
        <span className="flex items-center gap-1">
          <span>💡 สามารถกดปุ่ม</span>
          <strong className="text-sky-700 font-bold">Trace</strong>
          <span>เพื่อเปิดดูประวัติไทม์ไลน์ชิ้นงานและการตรวจสอบย้อนกลับได้ทันที</span>
        </span>
        <span>แสดงผล {filteredLots.length} จากทั้งหมด {totalLotsCount} ล็อต</span>
      </div>
    </div>
  );
};
