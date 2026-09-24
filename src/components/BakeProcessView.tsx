import React, { useState } from 'react';
import { Header } from './Header';
import { useFactory } from '../context/FactoryContext';
import { MachineAnalyticsControlBar } from './MachineAnalyticsControlBar';
import { Flame, BarChart3, Layers, Barcode } from 'lucide-react';
import { ThermalAllFleetChart } from './ThermalAllFleetChart';
import { ThermalSingleMachineChart } from './ThermalSingleMachineChart';
import { BakeOvensOverviewSection } from './BakeOvensOverviewSection';
import { OvenUnit } from '../types';

export const BakeProcessView: React.FC = () => {
  const {
    pstTime,
    ovenUnits,
    updateOvenStatus,
    openTraceabilityModal,
    selectedMachineId,
    setSelectedMachineId
  } = useFactory();

  const bakeUnits = ovenUnits.filter((u) => u.subType === 'Bake');

  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => {
    if (selectedMachineId && bakeUnits.some((u) => u.id === selectedMachineId)) {
      return selectedMachineId;
    }
    return 'ALL';
  });

  React.useEffect(() => {
    if (selectedMachineId && bakeUnits.some((u) => u.id === selectedMachineId)) {
      setSelectedUnitId(selectedMachineId);
    }
  }, [selectedMachineId]);

  const [selectedProduct, setSelectedProduct] = useState<string>('All');
  const [selectedOperator, setSelectedOperator] = useState<string>('All');
  const [selectedLot, setSelectedLot] = useState<string>('All');
  const [selectedRack, setSelectedRack] = useState<string>('All');

  const isAllFleet = selectedUnitId === 'ALL';

  const displayUnits = isAllFleet
    ? bakeUnits
    : bakeUnits.filter((u) => u.id === selectedUnitId);

  const activeUnit = bakeUnits.find((u) => u.id === selectedUnitId) || bakeUnits[0];

  const totalPcs = displayUnits.reduce((acc, u) => acc + (u.pcsCount || 520), 0);
  const totalFleetOutput = bakeUnits.reduce((acc, u) => acc + (u.pcsCount || 520), 0);

  return (
    <div className="w-full min-h-screen bg-white text-[#1b1b1d] pb-20 md:pb-8 font-sans">
      <Header
        title={isAllFleet ? "Bake Oven Process" : `${activeUnit.name} Telemetry Window`}
        subtitle="5 Conveyorized & Thermal Baking Ovens • Multi-Zone Temperatures & Telemetry"
        badge={
          <span className="text-[11px] font-mono font-semibold text-sky-900 bg-sky-50 border border-sky-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            PROCESS • {isAllFleet ? '5 BAKE OVENS ONLINE' : `${activeUnit.name} ONLINE`}
          </span>
        }
      />

      <div className="pt-4 px-4 md:px-6 max-w-7xl mx-auto w-full space-y-5">
        {/* Unified Standard Analytics Control Strip & Breakdown */}
        <MachineAnalyticsControlBar
          totalOutput={isAllFleet ? totalFleetOutput : (activeUnit.pcsCount || 520)}
          outputUnit="boards"
          activeHours={8}
          peakHourLabel="02 SEPT 15:00"
          peakHourValue={135}
          avgPerActiveHour={Math.round((isAllFleet ? totalFleetOutput : (activeUnit.pcsCount || 520)) / 8)}
          lines={['All Bake Ovens (5 Ovens)', ...bakeUnits.map((u, idx) => `Line 0${idx + 1} (${u.name})`)]}
          selectedLine={isAllFleet ? 'All Bake Ovens (5 Ovens)' : `Line 0${bakeUnits.findIndex((u) => u.id === activeUnit.id) + 1} (${activeUnit.name})`}
          onLineChange={(l) => {
            if (l.includes('All')) {
              setSelectedUnitId('ALL');
              setSelectedMachineId(null);
            } else {
              const match = bakeUnits.find((u) => l.includes(u.id) || l.includes(u.name));
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
            const match = bakeUnits.find((u) => op.includes(u.operatorId));
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
              { name: 'All Bake (Total 5 Ovens)', count: totalFleetOutput },
              ...bakeUnits.map((u, idx) => ({
                name: `Line 0${idx + 1} (${u.name})`,
                count: u.pcsCount || 520
              }))
            ],
            Product: [
              { name: 'Model 504-2154 (RF Curing)', count: Math.round(totalPcs * 0.38) },
              { name: 'Model 504-2224 (Power Board)', count: Math.round(totalPcs * 0.34) },
              { name: 'Model 504-2187 (Logic Core)', count: Math.round(totalPcs * 0.28) },
            ],
            Operator: bakeUnits.map((u) => ({
              name: `${u.operatorId} (${u.name})`,
              count: u.pcsCount || 520
            })),
            Lot: [
              { name: 'LOT-2026-09A', count: Math.round(totalPcs * 0.45) },
              { name: 'LOT-2026-09B', count: Math.round(totalPcs * 0.35) },
              { name: 'LOT-2026-08F', count: Math.round(totalPcs * 0.20) },
            ],
            Rack: [
              { name: 'Magazine Mag-01 (Infeed A)', count: Math.round(totalPcs * 0.35) },
              { name: 'Magazine Mag-02 (Infeed B)', count: Math.round(totalPcs * 0.35) },
              { name: 'Magazine Mag-03 (Cooling Buffer)', count: Math.round(totalPcs * 0.30) },
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

        {/* Machine Quick Switcher Bar (Softer, serene styling) */}
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
                <span>All Bake Graph</span>
              </button>
              {bakeUnits.map((u, idx) => (
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
                  <span>Line 0{idx + 1} ({u.name})</span>
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
              processType="Bake"
              units={bakeUnits}
              selectedUnitId="ALL"
              onSelectUnit={(id) => {
                setSelectedUnitId(id);
                setSelectedMachineId(id);
              }}
              openTraceabilityModal={openTraceabilityModal}
            />

            {/* 2. Bake Ovens Overview Section (First Page Only) */}
            <BakeOvensOverviewSection
              units={bakeUnits}
              onSelectOven={(id) => {
                setSelectedUnitId(id);
                setSelectedMachineId(id);
              }}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Standardized Single Machine Chart (Line chart default + toggle to Bar) */}
            <ThermalSingleMachineChart
              processType="Bake"
              unit={activeUnit}
              allUnits={bakeUnits}
              onSelectUnit={(id) => {
                setSelectedUnitId(id);
                setSelectedMachineId(id);
              }}
              onBackToFleet={() => {
                setSelectedUnitId('ALL');
                setSelectedMachineId(null);
              }}
              openTraceabilityModal={openTraceabilityModal}
              onToggleStatus={(id, s) => updateOvenStatus(id, s)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
