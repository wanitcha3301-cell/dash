import React, { useMemo } from 'react';
import { useFactory } from '../context/FactoryContext';
import { FactoryAlertItem } from '../data/factoryAlertsData';
import {
  AlertTriangle,
  ArrowUpRight,
  MapPin,
  CheckCheck
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const {
    factoryAlerts,
    navigate
  } = useFactory();

  // List of unique active machines
  const activeAlertingMachines = useMemo(() => {
    const map = new Map<string, FactoryAlertItem>();
    factoryAlerts.forEach((a) => {
      if (a.status !== 'RESOLVED' && !map.has(a.machineName)) {
        map.set(a.machineName, a);
      }
    });
    return Array.from(map.values());
  }, [factoryAlerts]);

  // Jump to station
  const handleJumpToStation = (alert: FactoryAlertItem) => {
    navigate(alert.targetScreen, alert.targetMachineId);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Active Machine Alerts
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                List of machines with active errors, faults, or telemetry warnings
              </p>
            </div>
          </div>
        </div>

        {/* CAD Floor Link */}
        <button
          onClick={() => navigate('main-floor')}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <MapPin className="w-4 h-4 text-slate-500" />
          <span>View on CAD Floor Map</span>
        </button>
      </div>

      {/* Quick Summary Alerting Machine Chips */}
      {activeAlertingMachines.length > 0 ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-rose-800 tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>Machines with active alerts ({activeAlertingMachines.length} Units):</span>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {activeAlertingMachines.map((m) => (
              <button
                key={m.id}
                onClick={() => handleJumpToStation(m)}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-rose-300 hover:border-rose-400 hover:bg-rose-100/50 text-slate-900 transition-all cursor-pointer shadow-2xs group text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${m.severity === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <div>
                    <span className="font-mono font-black text-sm text-slate-900 block group-hover:text-rose-950">
                      {m.machineName}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {m.line} • {m.processLabel}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-xs font-bold text-rose-700 shrink-0">
                  <span className="hidden sm:inline">View Station</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center space-x-3 text-emerald-800">
          <CheckCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="text-sm font-bold">
            All machines operating normally. No active alerts.
          </div>
        </div>
      )}
    </div>
  );
};
