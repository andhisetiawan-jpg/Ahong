/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PrintLog, OfficeConfig, DailyPrinterCounter, OPERATOR_OPTIONS } from './types';
import { INITIAL_PRINT_LOGS, DEFAULT_OFFICE_CONFIG, INITIAL_DAILY_COUNTERS } from './data/initialData';
import { Header } from './components/Header';
import { PrintForm } from './components/PrintForm';
import { PrintTable } from './components/PrintTable';
import { DailyCounterCard } from './components/DailyCounterCard';
import { StatsDashboard } from './components/StatsDashboard';
import { ExcelGuideTab } from './components/ExcelGuideTab';
import { SettingsModal } from './components/SettingsModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ReportModal } from './components/ReportModal';
import {
  exportLogsToCSV,
  generateExcelTemplateCSV,
  generateReceiptNo,
  formatNumber,
} from './utils/helpers';
import {
  FileSpreadsheet,
  TrendingUp,
  CheckCircle,
  Gauge,
  ChevronDown,
  ChevronUp,
  Printer,
  User,
} from 'lucide-react';

const STORAGE_KEY_LOGS = 'kantor_print_logs_v2';
const STORAGE_KEY_CONFIG = 'kantor_print_config_v2';
const STORAGE_KEY_COUNTERS = 'kantor_print_counters_v2';

export default function App() {
  // Load data from localStorage or initial
  const [logs, setLogs] = useState<PrintLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved) as PrintLog[];
        // Normalize operator names to standard format without initial (ANDHI, ALDY, EKO, JAMAL)
        return parsed.map((item) => {
          let updatedItem = { ...item };
          let rawName = updatedItem.userName || '';
          if (rawName.includes(':')) {
            rawName = rawName.split(':')[1].trim();
          }
          const match = OPERATOR_OPTIONS.find(
            (o) =>
              o.name.toLowerCase() === rawName.toLowerCase() ||
              o.code.toLowerCase() === rawName.toLowerCase() ||
              o.label.toLowerCase() === rawName.toLowerCase()
          );
          if (match) {
            updatedItem.userName = match.name;
          } else if (rawName) {
            updatedItem.userName = rawName;
          }

          // Also normalize errorBy if present
          if (updatedItem.errorBy) {
            let errName = updatedItem.errorBy;
            if (errName.includes(':')) {
              errName = errName.split(':')[1].trim();
            }
            const matchErr = OPERATOR_OPTIONS.find(
              (o) =>
                o.name.toLowerCase() === errName.toLowerCase() ||
                o.code.toLowerCase() === errName.toLowerCase()
            );
            if (matchErr) {
              updatedItem.errorBy = matchErr.name;
            } else {
              updatedItem.errorBy = errName;
            }
          }

          // Migrate legacy status
          const rawStatus = updatedItem.status as string;
          if (rawStatus === 'Menunggu') {
            updatedItem.status = 'Pending';
          } else if (rawStatus === 'Gagal / Rusak' || rawStatus === 'Gagal') {
            updatedItem.status = 'Paper Jam';
          } else if (rawStatus === 'Dibatalkan') {
            updatedItem.status = 'Salah Print';
          }
          return updatedItem;
        });
      }
    } catch (e) {
      console.error('Error loading logs from localStorage', e);
    }
    return INITIAL_PRINT_LOGS;
  });

  const [counters, setCounters] = useState<DailyPrinterCounter[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COUNTERS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading counters from localStorage', e);
    }
    return INITIAL_DAILY_COUNTERS;
  });

  const [officeConfig, setOfficeConfig] = useState<OfficeConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.officeName === 'PT Nusantara Cipta Digital' || !parsed.officeName) {
          parsed.officeName = 'Unggul Digital Printing';
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading config from localStorage', e);
    }
    return DEFAULT_OFFICE_CONFIG;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'table' | 'counter' | 'stats' | 'excel' | 'settings'>('table');
  const [showInlineCounter, setShowInlineCounter] = useState<boolean>(true);
  const [editingLog, setEditingLog] = useState<PrintLog | null>(null);
  const [selectedReceiptLog, setSelectedReceiptLog] = useState<PrintLog | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportModalMode, setReportModalMode] = useState<'full' | 'operator' | 'counter' | 'logs'>('full');
  const [notification, setNotification] = useState<string | null>(null);

  const handleOpenReportModal = (mode: 'full' | 'operator' | 'counter' | 'logs' = 'full') => {
    setReportModalMode(mode);
    setShowReportModal(true);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Error saving logs to localStorage', e);
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(officeConfig));
    } catch (e) {
      console.error('Error saving config to localStorage', e);
    }
  }, [officeConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COUNTERS, JSON.stringify(counters));
    } catch (e) {
      console.error('Error saving counters to localStorage', e);
    }
  }, [counters]);

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSaveCounter = (savedCounter: DailyPrinterCounter) => {
    setCounters((prev) => {
      const existsIndex = prev.findIndex((c) => c.date === savedCounter.date);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = savedCounter;
        return updated;
      }
      return [savedCounter, ...prev];
    });
    showToast(`Data counter harian tanggal ${savedCounter.date} berhasil disimpan.`);
  };

  const handleDeleteCounter = (id: string) => {
    setCounters((prev) => prev.filter((c) => c.id !== id));
    showToast('Data counter harian berhasil dihapus.');
  };

  // Handlers
  const handleSaveLog = (savedLog: PrintLog) => {
    setLogs((prev) => {
      const exists = prev.some((l) => l.id === savedLog.id);
      if (exists) {
        return prev.map((l) => (l.id === savedLog.id ? savedLog : l));
      }
      return [savedLog, ...prev];
    });
    if (editingLog?.id === savedLog.id) {
      setEditingLog(null);
    }
    showToast(`Data log "${savedLog.receiptNo}" berhasil disimpan.`);
  };

  const handleEditLog = (logToEdit: PrintLog) => {
    setEditingLog(logToEdit);
    setActiveTab('table');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    if (editingLog?.id === id) {
      setEditingLog(null);
    }
    showToast('Log aktivitas cetak berhasil dihapus.');
  };

  const handleDuplicateLog = (log: PrintLog) => {
    const newLog: PrintLog = {
      ...log,
      id: `prn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      receiptNo: generateReceiptNo(logs),
      date: new Date().toISOString().slice(0, 10),
      time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
      createdAt: Date.now(),
    };
    setLogs((prev) => [newLog, ...prev]);
    showToast(`Data diduplikasi ke nota baru "${newLog.receiptNo}".`);
  };

  const handleResetToSampleData = () => {
    if (window.confirm('Muat ulang contoh data log cetak awal kantor? Data saat ini akan diganti dengan data sampel.')) {
      setLogs(INITIAL_PRINT_LOGS);
      showToast('Contoh data riil kantor berhasil dimuat ulang.');
    }
  };

  const handleResetOfficeConfig = () => {
    if (window.confirm('Kembalikan konfigurasi kantor ke default?')) {
      setOfficeConfig(DEFAULT_OFFICE_CONFIG);
      showToast('Pengaturan kantor dikembalikan ke standar.');
    }
  };

  const handleExportCSV = () => {
    exportLogsToCSV(logs);
    showToast('File CSV berhasil diunduh untuk Microsoft Excel.');
  };

  const handleDownloadTemplate = () => {
    generateExcelTemplateCSV();
    showToast('Template Excel dengan rumus siap pakai berhasil diunduh.');
  };

  // Quick top metrics for table tab
  const totalSheetsToday = logs.reduce((acc, curr) => acc + curr.sheets, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header & Tabs */}
      <Header
        officeConfig={officeConfig}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportCSV={handleExportCSV}
        onDownloadTemplate={handleDownloadTemplate}
        onPrintReport={() => handleOpenReportModal('full')}
        totalLogsCount={logs.length}
        totalCountersCount={counters.length}
      />

      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-bottom duration-200 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Tab 1: Tabel Log & Form Input */}
        {activeTab === 'table' && (
          <div className="space-y-6">
            {/* Quick Strip Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-blue-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/30 text-blue-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold">
                    Pusat Pencatatan & Monitoring Cetak Dokumen
                  </h2>
                  <p className="text-xs text-slate-300">
                    Mencakup tanggal, nomor nota, operator (AN, AL, SO, JML), jenis kertas, duplex/simplex, jenis cetak, halaman & status
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs shrink-0 flex-wrap">
                <button
                  onClick={() => setShowInlineCounter(!showInlineCounter)}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm border border-indigo-400/30"
                  title="Tampilkan / Sembunyikan Input Counter Fisik Mesin"
                >
                  <Gauge className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{showInlineCounter ? 'Sembunyikan Counter Mesin' : 'Buka Counter Mesin'}</span>
                  {showInlineCounter ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Total Terpakai:</span>
                  <span className="font-bold text-white text-sm">{formatNumber(totalSheetsToday)} Lembar</span>
                </div>

                <button
                  onClick={() => setActiveTab('excel')}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Lihat Rumus Excel Sederhana"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Lihat Rumus Excel</span>
                </button>
              </div>
            </div>

            {/* Inline Counter Mesin Printer Section */}
            {showInlineCounter && (
              <div className="transition-all duration-200">
                <DailyCounterCard
                  counters={counters}
                  logs={logs}
                  onSaveCounter={handleSaveCounter}
                  onDeleteCounter={handleDeleteCounter}
                />
              </div>
            )}

            {/* Form Input Komprehensif */}
            <PrintForm
              officeConfig={officeConfig}
              existingLogs={logs}
              editingLog={editingLog}
              onSave={handleSaveLog}
              onCancelEdit={() => setEditingLog(null)}
            />

            {/* Tabel Log Aktivitas Printing */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>Daftar Tabel Log Aktivitas Printing Kantor</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({logs.length} data tersimpan)
                  </span>
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Tombol Opsi Cetak Laporan & Rekap Operator */}
                  <div className="inline-flex items-center rounded-xl bg-white border border-slate-300 shadow-xs p-0.5">
                    <button
                      onClick={() => handleOpenReportModal('full')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                      title="Buka Opsi Cetak Laporan Lengkap (Counter & Log)"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Opsi Cetak Laporan</span>
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 my-auto" />
                    <button
                      onClick={() => handleOpenReportModal('operator')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                      title="Cetak Khusus Rekapitulasi Pemakaian per Operator (AN, AL, SO, JML)"
                    >
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cetak Rekap Operator</span>
                    </button>
                  </div>

                  <button
                    onClick={handleResetToSampleData}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer px-2 py-1"
                  >
                    Muat Contoh Data Riil
                  </button>
                </div>
              </div>

              <PrintTable
                logs={logs}
                officeConfig={officeConfig}
                onEdit={handleEditLog}
                onSaveLog={handleSaveLog}
                onDelete={handleDeleteLog}
                onDuplicate={handleDuplicateLog}
                onViewReceipt={(log) => setSelectedReceiptLog(log)}
                onResetToSampleData={handleResetToSampleData}
              />
            </div>
          </div>
        )}

        {/* Tab Dedicated: Counter Mesin (Awal & Akhir) */}
        {activeTab === 'counter' && (
          <div className="space-y-6">
            <DailyCounterCard
              counters={counters}
              logs={logs}
              onSaveCounter={handleSaveCounter}
              onDeleteCounter={handleDeleteCounter}
            />
          </div>
        )}

        {/* Tab 2: Statistik & Rekapitulasi */}
        {activeTab === 'stats' && (
          <StatsDashboard
            logs={logs}
            officeConfig={officeConfig}
            onPrintOperatorReport={() => handleOpenReportModal('operator')}
          />
        )}

        {/* Tab 3: Panduan & Rumus Excel Sederhana */}
        {activeTab === 'excel' && <ExcelGuideTab />}

        {/* Tab 4: Pengaturan Kantor */}
        {activeTab === 'settings' && (
          <SettingsModal
            config={officeConfig}
            onSaveConfig={(cfg) => {
              setOfficeConfig(cfg);
              showToast('Pengaturan kantor berhasil disimpan.');
            }}
            onResetDefault={handleResetOfficeConfig}
          />
        )}
      </main>

      {/* Modal: Slip Bukti Cetak (Print Receipt) */}
      {selectedReceiptLog && (
        <ReceiptModal
          log={selectedReceiptLog}
          officeConfig={officeConfig}
          onClose={() => setSelectedReceiptLog(null)}
        />
      )}

      {/* Modal: Laporan Rekapitulasi Audit Kantor (Full Report Print) */}
      {showReportModal && (
        <ReportModal
          logs={logs}
          counters={counters}
          officeConfig={officeConfig}
          initialMode={reportModalMode}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">Sistem Log Printing Kantor</span>
            <span>•</span>
            <span>Standarisasi Rekapitulasi & Formula Excel Microsoft Office</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Kompatibel: Microsoft Excel, Google Sheets, LibreOffice Calc</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
