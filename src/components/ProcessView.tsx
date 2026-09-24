import React from 'react';
import { Header } from './Header';
import { useFactory } from '../context/FactoryContext';
import { Activity, ChevronRight, Wind, Flame, Eye, Cpu, Layers } from 'lucide-react';
import { ProcessViewHourlyChart } from './ProcessViewHourlyChart';

export const ProcessView: React.FC = () => {
  const { processNodes, navigate } = useFactory();

  const handleNodeClick = (nodeNumber: number) => {
    if (nodeNumber === 1) navigate('vacuum-process');
    else if (nodeNumber === 2) navigate('bake-process');
    else if (nodeNumber === 3) navigate('machine-detail', 'ALL');
    else if (nodeNumber === 4) navigate('fvmi');
    else if (nodeNumber === 5) navigate('packout-aoi', 'ALL');
    else if (nodeNumber === 6) navigate('packout-xray', 'ALL');
    else navigate('analytics');
  };

  return (
    <div className="w-full pb-16">
      <Header
        title="Process View"
        subtitle="SMT Production Flow, Station Nodes & Real-Time Performance"
        badge={
          <span className="text-[11px] font-mono font-bold text-sky-950 bg-[#b3e5fc] border border-sky-300 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
            ALL MACHINE PROCESSES ONLINE
          </span>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hourly Output Combined Chart: All 6 SMT Machine Stages */}
        <ProcessViewHourlyChart />

        {/* Process Flow Stepper Cards for Every Machine - Styled with #b3e5fc */}
        <section className="bg-white rounded-2xl border border-sky-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-sky-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <span>Sequential Process Nodes</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#b3e5fc] text-sky-950 border border-sky-300">
                  PROCESS
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any machine process stage below to inspect stations and individual machine controls
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-sky-950 bg-[#b3e5fc] px-2.5 py-1 rounded-md border border-sky-300 hidden sm:inline-block shadow-2xs">
              {processNodes.length} Machine Stages
            </span>
          </div>

          {/* 3 : 3 Grid Layout (3 machines top row, 3 machines bottom row) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5">
            {processNodes.map((node) => (
              <div
                key={node.id}
                onClick={() => handleNodeClick(node.nodeNumber)}
                className="flex flex-col justify-between p-4.5 sm:p-5 rounded-2xl bg-[#b3e5fc]/20 hover:bg-[#b3e5fc]/40 border border-sky-300/90 hover:border-sky-400 hover:shadow-md cursor-pointer transition-all duration-200 group relative overflow-hidden"
              >
                {/* Header: Stage Number, Machine Count & Online Status */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#b3e5fc] text-sky-950 border border-sky-300 font-black flex items-center justify-center text-xs shadow-2xs group-hover:scale-105 transition-transform">
                        0{node.nodeNumber}
                      </div>
                      <span className="text-[11px] font-mono font-bold text-sky-900 uppercase tracking-wider">
                        Stage {node.nodeNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        RUNNING
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#b3e5fc] text-sky-950 border border-sky-300 shadow-2xs">
                        {node.assignedMachinesLabel}
                      </span>
                    </div>
                  </div>

                  {/* Title & Process Node Content */}
                  <div className="mt-3.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 border border-sky-200 group-hover:bg-sky-200 transition-colors">
                        {node.nodeNumber === 1 && <Wind className="w-4 h-4 text-sky-800 shrink-0" />}
                        {node.nodeNumber === 2 && <Flame className="w-4 h-4 text-sky-800 shrink-0" />}
                        {node.nodeNumber === 3 && <Cpu className="w-4 h-4 text-sky-800 shrink-0" />}
                        {node.nodeNumber === 4 && <Eye className="w-4 h-4 text-sky-800 shrink-0" />}
                        {node.nodeNumber === 5 && <Layers className="w-4 h-4 text-sky-800 shrink-0" />}
                        {node.nodeNumber === 6 && <Activity className="w-4 h-4 text-sky-800 shrink-0" />}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-sky-950 transition-colors leading-snug">
                        {node.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {node.nodeNumber === 1 && 'Degassing & Bubble Elimination (-98 kPa Vacuum • 2 Units)'}
                      {node.nodeNumber === 2 && 'Thermal Curing & Polymerization (150°C Profile • 5 Units)'}
                      {node.nodeNumber === 3 && 'High-Precision Jet Valve Top & Under Fill (MC-01 to MC-12 • 12 Units)'}
                      {node.nodeNumber === 4 && 'Final Visual Mechanical Inspection (25MP Optical • 9 Stations)'}
                      {node.nodeNumber === 5 && 'High-Speed Automated Optical AOI Inspection (2 Units)'}
                      {node.nodeNumber === 6 && '90kV Micro-Focus NDT Radiography Inspection (5 Units)'}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-sky-200/80 flex items-center justify-between text-xs font-bold text-sky-900 group-hover:text-sky-950 group-hover:translate-x-0.5 transition-all">
                  <span className="font-mono text-[11px]">Inspect Stage &amp; Machines</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-sans font-normal text-sky-700">Open</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
