import React from 'react';
import { Printer, FileSpreadsheet, Download, Sliders, TableProperties, BarChart3, Gauge, FileText } from 'lucide-react';
import { OfficeConfig } from '../types';

interface HeaderProps {
  officeConfig: OfficeConfig;
  activeTab: 'table' | 'counter' | 'stats' | 'excel' | 'settings';
  setActiveTab: (tab: 'table' | 'counter' | 'stats' | 'excel' | 'settings') => void;
  onExportCSV: () => void;
  onDownloadTemplate: () => void;
  onPrintReport: () => void;
  totalLogsCount: number;
  totalCountersCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  officeConfig,
  activeTab,
  setActiveTab,
  onExportCSV,
  onDownloadTemplate,
  onPrintReport,
  totalLogsCount,
  totalCountersCount = 0,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          {/* Logo & Office Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30">
              <Printer className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Log Printing Kantor</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {officeConfig.officeName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sistem Pencatatan, Rekapitulasi Pemakaian Kertas & Perhitungan Rumus Excel
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2 text-sm">
            <button
              onClick={onDownloadTemplate}
              title="Download Template Format Excel dengan Rumus"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-medium transition cursor-pointer text-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Template Excel + Rumus</span>
            </button>

            <button
              onClick={onExportCSV}
              title="Ekspor Data Log ke format CSV/Excel"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium transition cursor-pointer text-xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Ekspor CSV ({totalLogsCount})</span>
            </button>

            <button
              onClick={onPrintReport}
              title="Cetak Laporan Rekapitulasi Kantor"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition cursor-pointer text-xs shadow-sm shadow-indigo-500/30"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-t border-slate-800/80 pt-2 pb-1 overflow-x-auto text-sm scrollbar-none">
          <button
            onClick={() => setActiveTab('table')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs sm:text-sm transition cursor-pointer shrink-0 ${
              activeTab === 'table'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TableProperties className="w-4 h-4" />
            <span>Tabel Log & Form Input</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-xs ${
                activeTab === 'table' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {totalLogsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('counter')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs sm:text-sm transition cursor-pointer shrink-0 ${
              activeTab === 'counter'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-300/80 hover:text-indigo-200 hover:bg-indigo-950/40'
            }`}
          >
            <Gauge className="w-4 h-4 text-indigo-400" />
            <span>Counter Mesin (Awal & Akhir)</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-xs ${
                activeTab === 'counter' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {totalCountersCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs sm:text-sm transition cursor-pointer shrink-0 ${
              activeTab === 'stats'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistik & Rekapitulasi</span>
          </button>

          <button
            onClick={() => setActiveTab('excel')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs sm:text-sm transition cursor-pointer shrink-0 ${
              activeTab === 'excel'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-950/40'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>Panduan & Rumus Excel</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
              10 Rumus
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs sm:text-sm transition cursor-pointer shrink-0 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Profil Kantor</span>
          </button>
        </div>
      </div>
    </header>
  );
};
