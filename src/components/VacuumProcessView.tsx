import React, { useState } from 'react';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import { MachineAnalyticsControlBar } from './MachineAnalyticsControlBar';
import {
  Wind,
  Barcode,
  BarChart3,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { Header } from './Header';
import { ThermalAllFleetChart } from './ThermalAllFleetChart';
import { ThermalSingleMachineChart } from './ThermalSingleMachineChart';
import { VacuumChambersOverviewSection } from './VacuumChambersOverviewSection';
import { OvenUnit } from '../types';

export const VacuumProcessView: React.FC = () => {
  const {
    pstTime,
    ovenUnits,
    updateOvenStatus,
    updateOvenFull,
    openTraceabilityModal,
    selectedMachineId,
    setSelectedMachineId
  } = useFactory();
  const { t } = useLanguage();

  const vacuumUnits = ovenUnits.filter((u) => u.subType === 'Vacuum');

  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => {
    if (selectedMachineId && vacuumUnits.some((u) => u.id === selectedMachineId)) {
      return selectedMachineId;
    }
    return 'ALL';
  });

  React.useEffect(() => {
    if (selectedMachineId && vacuumUnits.some((u) => u.id === selectedMachineId)) {
      setSelectedUnitId(selectedMachineId);
    }
  }, [selectedMachineId]);

  const [selectedProduct, setSelectedProduct] = useState<string>('All');
  const [selectedOperator, setSelectedOperator] = useState<string>('All');
  const [selectedLot, setSelectedLot] = useState<string>('All');
  const [selectedRack, setSelectedRack] = useState<string>('All');

  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<OvenUnit>>({});

  const isAllFleet = selectedUnitId === 'ALL';

  const displayUnits = isAllFleet
    ? vacuumUnits
    : vacuumUnits.filter((u) => u.id === selectedUnitId);

  const activeUnit = vacuumUnits.find((u) => u.id === selectedUnitId) || vacuumUnits[0];

  const totalPcs = displayUnits.reduce((acc, u) => acc + (u.pcsCount || 480), 0);
  const totalFleetOutput = vacuumUnits.reduce((acc, u) => acc + (u.pcsCount || 480), 0);

  const handleOpenEdit = (unit: OvenUnit) => {
    setEditingUnitId(unit.id);
    setEditFormData({
      operatorId: unit.operatorId,
      magazinesCount: unit.magazinesCount,
      pcsCount: unit.pcsCount,
      tempCelsius: unit.tempCelsius,
      pressurePa: unit.pressurePa,
      program: unit.program,
      stepCurrent: unit.stepCurrent,
      stepTotal: unit.stepTotal,
      remainingSeconds: unit.remainingSeconds
    });
  };

  const handleSaveEdit = () => {
    if (editingUnitId) {
      updateOvenFull(editingUnitId, editFormData);
      setEditingUnitId(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-[#1b1b1d] pb-20 md:pb-8 font-sans">
      <Header
        title={isAllFleet ? "Vacuum Oven Process" : `${activeUnit.name} Telemetry Window`}
        subtitle="2 Vacuum Chambers • High-Vacuum Degas & Multi-Zone Thermal Curves"
        badge={
          <span className="text-[11px] font-mono font-semibold text-sky-900 bg-sky-50 border border-sky-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            PROCESS • {isAllFleet ? '2 VACUUM CHAMBERS ONLINE' : `${activeUnit.name} ONLINE`}
          </span>
        }
      />

      <div className="pt-4 px-4 md:px-6 max-w-7xl mx-auto w-full space-y-5">
        {/* Unified Standard Analytics Control Strip & Breakdown */}
        <MachineAnalyticsControlBar
          totalOutput={isAllFleet ? totalFleetOutput : (activeUnit.pcsCount || 480)}
          outputUnit="boards"
          activeHours={8}
          peakHourLabel="02 SEPT 15:00"
          peakHourValue={120}
          avgPerActiveHour={Math.round((isAllFleet ? totalFleetOutput : (activeUnit.pcsCount || 480)) / 8)}
          lines={['All Vacuum Chambers (2 Chambers)', ...vacuumUnits.map((u, idx) => `Line 06 (Chamber ${idx === 0 ? 'A' : 'B'} - ${u.name})`)]}
          selectedLine={isAllFleet ? 'All Vacuum Chambers (2 Chambers)' : `Line 06 (Chamber ${vacuumUnits.findIndex((u) => u.id === activeUnit.id) === 0 ? 'A' : 'B'} - ${activeUnit.name})`}
          onLineChange={(l) => {
            if (l.includes('All')) {
              setSelectedUnitId('ALL');
              setSelectedMachineId(null);
            } else {
              const match = vacuumUnits.find((u) => l.includes(u.id) || l.includes(u.name));
              if (match) {
                setSelectedUnitId(match.id);
                setSelectedMachineId(match.id);
              }
            }
          }}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          selectedOperator={selectedOperator}
          onOperatorChange={(op) => {
            setSelectedOperator(op);
            const match = vacuumUnits.find((u) => op.includes(u.operatorId));
            if (match && selectedUnitId === 'ALL') {
              setSelectedUnitId(match.id);
            }
          }}
          selectedLot={selectedLot}
          onLotChange={setSelectedLot}
          selectedRack={selectedRack}
          onRackChange={setSelectedRack}
          breakdownData={{
            Line: [
              { name: 'All Vacuum (2 Chambers)', count: totalFleetOutput },
              ...vacuumUnits.map((u, idx) => ({
                name: `Line 06 (Chamber ${idx === 0 ? 'A' : 'B'} - ${u.name})`,
                count: u.pcsCount || 480
              }))
            ],
            Product: [
              { name: 'Model 504-2154 (RF Module)', count: Math.round(totalPcs * 0.40) },
              { name: 'Model 504-2224 (Power Board)', count: Math.round(totalPcs * 0.35) },
              { name: 'Model 504-2187 (Logic Core)', count: Math.round(totalPcs * 0.25) },
            ],
            Operator: vacuumUnits.map((u) => ({
              name: `${u.operatorId} (${u.name})`,
              count: u.pcsCount || 480
            })),
            Lot: [
              { name: 'LOT-2026-09A', count: Math.round(totalPcs * 0.50) },
              { name: 'LOT-2026-09B', count: Math.round(totalPcs * 0.30) },
              { name: 'LOT-2026-08F', count: Math.round(totalPcs * 0.20) },
            ],
            Rack: [
              { name: 'Magazine Mag-01 (Shelf A)', count: Math.round(totalPcs * 0.34) },
              { name: 'Magazine Mag-02 (Shelf B)', count: Math.round(totalPcs * 0.33) },
              { name: 'Magazine Mag-03 (Shelf C)', count: Math.round(totalPcs * 0.33) },
            ]
          }}
          extraActions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => openTraceabilityModal('WP-2026-90412')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              >
                <Barcode className="w-3.5 h-3.5 text-sky-600" />
                <span>Trace Workpiece</span>
              </button>
              <div className="text-right bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-1 text-xs font-mono">
                <span className="text-[10px] text-slate-400 uppercase mr-1">Clock:</span>
                <strong className="text-slate-800">{pstTime} PST</strong>
              </div>
            </div>
          }
        />

        {/* Machine Quick Switcher Bar (Serene, eye-friendly styling matching Bake) */}
        <div className="flex items-center justify-between gap-3 bg-slate-50/80 p-2 rounded-2xl border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="text-xs font-mono font-semibold text-slate-600 shrink-0 pl-1">Active View:</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setSelectedUnitId('ALL');
                  setSelectedMachineId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isAllFleet
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100/80 border border-slate-200/80'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>All Vacuum Graph</span>
              </button>
              {vacuumUnits.map((u, idx) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedUnitId(u.id);
                    setSelectedMachineId(u.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    !isAllFleet && activeUnit.id === u.id
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100/80 border border-slate-200/80'
                  }`}
                >
                  <span>Chamber {idx === 0 ? 'A' : 'B'} ({u.name})</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'RUNNING' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                </button>
              ))}
            </div>
          </div>

          {!isAllFleet && (
            <button
              onClick={() => {
                setSelectedUnitId('ALL');
                setSelectedMachineId(null);
              }}
              className="text-[11px] font-mono text-sky-800 font-bold bg-white px-2.5 py-1 rounded-lg border border-sky-200/80 hover:bg-sky-50 cursor-pointer shrink-0 shadow-2xs transition-colors"
            >
              ← กลับหน้ากราฟรวม (All Fleet)
            </button>
          )}
        </div>

        {/* Content Area: Matching Dispensing Process Suite Structure */}
        {isAllFleet ? (
          <div className="space-y-6">
            {/* 1. Fleet Total Graph (First Page Only) */}
            <ThermalAllFleetChart
              processType="Vacuum"
              units={vacuumUnits}
              selectedUnitId="ALL"
              onSelectUnit={(id) => {
                setSelectedUnitId(id);
                setSelectedMachineId(id);
              }}
              openTraceabilityModal={openTraceabilityModal}
            />

            {/* 2. Vacuum Chamber Overview Section (First Page Only) */}
            <VacuumChambersOverviewSection
              units={vacuumUnits}
              onSelectChamber={(id) => {
                setSelectedUnitId(id);
                setSelectedMachineId(id);
              }}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Standardized Single Machine Chart (Line chart default + toggle to Bar) */}
            <ThermalSingleMachineChart
              processType="Vacuum"
              unit={activeUnit}
              allUnits={vacuumUnits}
              onSelectUnit={(id) => {
                setSelectedUnitId(id);
                setSelectedMachineId(id);
              }}
              onBackToFleet={() => {
                setSelectedUnitId('ALL');
                setSelectedMachineId(null);
              }}
              openTraceabilityModal={openTraceabilityModal}
              onOpenEdit={handleOpenEdit}
              onToggleStatus={(id, s) => updateOvenStatus(id, s)}
            />
          </div>
        )}
      </div>

      {/* Edit Chamber Parameters Modal */}
      {editingUnitId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-600" />
                {`Edit Chamber Parameters for ${editingUnitId}`}
              </h3>
              <button onClick={() => setEditingUnitId(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Operator ID</label>
                <input
                  type="text"
                  value={editFormData.operatorId || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, operatorId: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Program / Recipe</label>
                <input
                  type="text"
                  value={editFormData.program || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, program: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editFormData.tempCelsius || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, tempCelsius: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-sky-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Pressure (Pa)</label>
                <input
                  type="number"
                  value={editFormData.pressurePa || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, pressurePa: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-sky-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Loaded Magazines</label>
                <input
                  type="number"
                  value={editFormData.magazinesCount || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, magazinesCount: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Remaining Time (Secs)</label>
                <input
                  type="number"
                  value={editFormData.remainingSeconds || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, remainingSeconds: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingUnitId(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
