import React from 'react';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  MapPin,
  CheckCircle2,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { getSeverityBadge, FactoryAlertItem } from '../data/factoryAlertsData';

export const AlertHistoryModal: React.FC = () => {
  const {
    showAlertHistoryModal,
    setShowAlertHistoryModal,
    factoryAlerts,
    activeAlertsCount,
    updateAlertStatus,
    resolveAlert,
    navigate
  } = useFactory();

  const { t } = useLanguage();

  if (!showAlertHistoryModal) return null;

  const activeAlerts = factoryAlerts.filter((a) => a.status !== 'RESOLVED');

  const handleJumpToStation = (alert: FactoryAlertItem) => {
    setShowAlertHistoryModal(false);
    navigate(alert.targetScreen, alert.targetMachineId);
  };

  const handleLocateOnFloor = (alert: FactoryAlertItem) => {
    setShowAlertHistoryModal(false);
    navigate('main-floor', alert.targetMachineId || alert.machineId);
  };

  const handleOpenFullScreenAlerts = () => {
    setShowAlertHistoryModal(false);
    navigate('alerts');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Active Machine Alerts ({activeAlertsCount} Units)
                </h2>
              </div>
              <p className="text-xs text-slate-300">
                Click "Go to Station" to navigate to the machine with active alert
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAlertHistoryModal(false)}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {activeAlerts.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                No Active Alerts
              </h4>
              <p className="text-xs text-slate-500">
                All machines and stations in production lines are operating normally
              </p>
            </div>
          ) : (
            activeAlerts.map((alert) => {
              const sev = getSeverityBadge(alert.severity);

              return (
                <div
                  key={alert.id}
                  className={`border rounded-2xl p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    alert.severity === 'CRITICAL'
                      ? 'border-rose-300 bg-rose-50/20 shadow-2xs'
                      : 'border-amber-200 bg-amber-50/20 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-white ${sev.badgeBg}`}>
                        {sev.label}
                      </span>
                      <span className="font-mono font-black text-sm text-slate-900">
                        {alert.machineName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                        {alert.line}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-auto">
                        {alert.timestamp}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 line-clamp-1">
                      {alert.title}
                    </p>

                    {alert.metricValue && (
                      <p className="text-[11px] font-mono text-rose-700">
                        {alert.metricValue}
                      </p>
                    )}
                  </div>

                  {/* Station jump button */}
                  <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      onClick={() => handleJumpToStation(alert)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-black bg-sky-600 hover:bg-sky-700 text-white transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Go to Station</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleLocateOnFloor(alert)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="View on CAD map"
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="px-2 py-1 text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg cursor-pointer"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={handleOpenFullScreenAlerts}
            className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Alerts & Logs History</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowAlertHistoryModal(false)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
