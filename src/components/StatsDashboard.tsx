import React, { useState, useMemo } from 'react';
import { PrintLog, OfficeConfig, OPERATOR_OPTIONS } from '../types';
import { formatNumber } from '../utils/helpers';
import {
  FileText,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingDown,
  User,
  Users,
  Printer,
  Calendar,
} from 'lucide-react';
import { MonthlyOperatorReportModal } from './MonthlyOperatorReportModal';

interface StatsDashboardProps {
  logs: PrintLog[];
  officeConfig: OfficeConfig;
  onPrintOperatorReport?: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ logs, officeConfig }) => {
  // Ambil daftar bulan unik dari data log (format YYYY-MM)
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    logs.forEach((l) => {
      if (l.date && l.date.length >= 7) {
        months.add(l.date.slice(0, 7));
      }
    });
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    months.add(currentMonthStr);
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [logs]);

  // Mode periode operator: 'ALL' (Semua Riwayat) atau format YYYY-MM
  const [operatorPeriod, setOperatorPeriod] = useState<string>(
    availableMonths[0] || 'ALL'
  );

  // State untuk modal cetak laporan bulanan
  const [showMonthlyPrintModal, setShowMonthlyPrintModal] = useState<boolean>(false);

  // Calculations untuk KPI umum (seluruh log)
  const totalTransactions = logs.length;
  const totalSheets = logs.reduce((acc, curr) => acc + curr.sheets, 0);

  const bwSheets = logs.filter((l) => l.printType === 'Hitam Putih').reduce((acc, curr) => acc + curr.sheets, 0);
  const colorSheets = logs.filter((l) => l.printType === 'Warna').reduce((acc, curr) => acc + curr.sheets, 0);

  const completedCount = logs.filter((l) => l.status === 'Selesai').length;
  const pendingCount = logs.filter((l) => l.status === 'Pending' || (l.status as any) === 'Menunggu').length;
  const paperJamCount = logs.filter((l) => l.status === 'Paper Jam' || (l.status as any) === 'Gagal / Rusak' || (l.status as any) === 'Gagal').length;
  const wrongPrintCount = logs.filter((l) => l.status === 'Salah Print' || (l.status as any) === 'Dibatalkan').length;

  // Duplex savings calculation
  const duplexLogs = logs.filter((l) => l.printSide === '2 Sisi (Duplex)');
  const duplexSavedSheets = duplexLogs.reduce((acc, curr) => {
    const potentialSimplex = curr.pages;
    const actual = curr.sheets;
    return acc + Math.max(0, potentialSimplex - actual);
  }, 0);

  // Filter logs khusus untuk rekapitulasi operator berdasarkan operatorPeriod
  const logsForOperatorStats = useMemo(() => {
    if (operatorPeriod === 'ALL') return logs;
    return logs.filter((l) => l.date && l.date.startsWith(operatorPeriod));
  }, [logs, operatorPeriod]);

  const operatorPeriodTotalSheets = useMemo(() => {
    return logsForOperatorStats.reduce((acc, curr) => acc + curr.sheets, 0);
  }, [logsForOperatorStats]);

  // Breakdown per Operator dengan normalisasi AN : ANDHI
  const userStats = useMemo(() => {
    const map = new Map<
      string,
      {
        initial: string;
        fullName: string;
        label: string;
        sheets: number;
        count: number;
        colorSheets: number;
        bwSheets: number;
        pages: number;
      }
    >();

    logsForOperatorStats.forEach((log) => {
      let initial = 'OP';
      let fullName = log.userName || 'Operator';
      let label = log.userName || 'Operator';

      if (log.userName.includes(':')) {
        const parts = log.userName.split(':');
        initial = parts[0].trim();
        fullName = parts[1].trim();
        label = fullName;
      } else {
        const matched = OPERATOR_OPTIONS.find(
          (op) =>
            op.name.toLowerCase() === log.userName.toLowerCase() ||
            op.code.toLowerCase() === log.userName.toLowerCase()
        );
        if (matched) {
          initial = matched.code;
          fullName = matched.name;
          label = matched.name;
        } else {
          initial = log.userName.slice(0, 3).toUpperCase();
          fullName = log.userName;
          label = fullName;
        }
      }

      const key = initial;
      const current = map.get(key) || {
        initial,
        fullName,
        label,
        sheets: 0,
        count: 0,
        colorSheets: 0,
        bwSheets: 0,
        pages: 0,
      };

      current.sheets += log.sheets;
      current.count += 1;
      current.pages += log.pages;
      if (log.printType === 'Warna') {
        current.colorSheets += log.sheets;
      } else {
        current.bwSheets += log.sheets;
      }

      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => b.sheets - a.sheets);
  }, [logsForOperatorStats]);

  // Breakdown per Paper Type
  const paperStats: { [key: string]: { sheets: number; count: number } } = {};
  logs.forEach((log) => {
    if (!paperStats[log.paperType]) {
      paperStats[log.paperType] = { sheets: 0, count: 0 };
    }
    paperStats[log.paperType].sheets += log.sheets;
    paperStats[log.paperType].count += 1;
  });

  const rimCount = (totalSheets / 500).toFixed(2);
  const successRate = totalTransactions > 0 ? ((completedCount / totalTransactions) * 100).toFixed(1) : '100';

  const formatMonthTitle = (monthStr: string) => {
    if (monthStr === 'ALL') return 'Semua Periode Riwayat';
    try {
      const [year, month] = monthStr.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, 1);
      return dateObj.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return monthStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Lembar & Rim */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Pemakaian Kertas
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatNumber(totalSheets)} <span className="text-sm font-normal text-slate-500">Lembar</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600">
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                ≈ {rimCount} Rim Kertas
              </span>
              <span>(1 rim = 500 lbr)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Dokumen Dicatat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Transaksi Log
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatNumber(totalTransactions)} <span className="text-sm font-normal text-slate-500">Aktivitas</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Dokumen tercatat dalam sistem
            </p>
          </div>
        </div>

        {/* Card 3: Duplex Paper Savings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Hemat Kertas (Duplex)
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-indigo-700 tracking-tight">
              +{formatNumber(duplexSavedSheets)} <span className="text-sm font-normal text-slate-500">Lembar</span>
            </div>
            <p className="mt-1.5 text-xs text-indigo-600 font-medium">
              Efisiensi berkat cetak bolak-balik
            </p>
          </div>
        </div>

        {/* Card 4: Success Rate & Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tingkat Keberhasilan
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {successRate}%
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold">{completedCount} Selesai</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">{pendingCount} Pending</span>
              {paperJamCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-600 font-semibold">{paperJamCount} Paper Jam</span>
                </>
              )}
              {wrongPrintCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-600 font-semibold">{wrongPrintCount} Salah Print</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Visual Comparison (Hitam Putih vs Warna) & Status Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warna vs B&W Ratio */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Proporsi Jenis Cetak
            </h3>
            <span className="text-xs text-slate-400">Total {totalSheets} lbr</span>
          </div>

          <div className="space-y-4">
            {/* Progress bar */}
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-slate-700 h-full transition-all duration-500"
                style={{
                  width: `${totalSheets > 0 ? (bwSheets / totalSheets) * 100 : 50}%`,
                }}
                title={`Hitam Putih: ${bwSheets} lembar`}
              />
              <div
                className="bg-gradient-to-r from-amber-400 to-rose-500 h-full transition-all duration-500"
                style={{
                  width: `${totalSheets > 0 ? (colorSheets / totalSheets) * 100 : 50}%`,
                }}
                title={`Warna: ${colorSheets} lembar`}
              />
            </div>

            {/* Labels */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span>Hitam Putih (B&W)</span>
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {formatNumber(bwSheets)} <span className="text-xs font-normal text-slate-500">lbr</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {totalSheets > 0 ? ((bwSheets / totalSheets) * 100).toFixed(1) : 0}% pemakaian
                </div>
              </div>

              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-1.5 text-xs text-purple-700 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500" />
                  <span>Berwarna (Color)</span>
                </div>
                <div className="text-lg font-bold text-purple-900">
                  {formatNumber(colorSheets)} <span className="text-xs font-normal text-purple-600">lbr</span>
                </div>
                <div className="text-xs text-purple-600 mt-0.5">
                  {totalSheets > 0 ? ((colorSheets / totalSheets) * 100).toFixed(1) : 0}% pemakaian
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Monitoring */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Distribusi Status Cetak
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-medium text-emerald-900">Selesai Dicetak</span>
              </div>
              <span className="font-bold text-xs text-emerald-700">{completedCount} Dokumen</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-medium text-blue-900">Pending</span>
              </div>
              <span className="font-bold text-xs text-blue-700">{pendingCount} Dokumen</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="text-xs font-medium text-amber-900 block leading-tight">Paper Jam</span>
                  <span className="text-[10px] text-amber-700 leading-none">Tidak masuk counter mesin</span>
                </div>
              </div>
              <span className="font-bold text-xs text-amber-700">{paperJamCount} Dokumen</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <span className="text-xs font-medium text-rose-900 block leading-tight">Salah Print</span>
                  <span className="text-[10px] text-rose-700 leading-none">Opsi nama penanggung jawab</span>
                </div>
              </div>
              <span className="font-bold text-xs text-rose-700">{wrongPrintCount} Dokumen</span>
            </div>
          </div>
        </div>

        {/* Paper Type Consumption */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            Konsumsi Jenis Kertas
          </h3>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {Object.entries(paperStats).map(([paper, data]) => {
              const pct = totalSheets > 0 ? ((data.sheets / totalSheets) * 100).toFixed(0) : 0;
              return (
                <div key={paper} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-700 truncate">{paper}</span>
                    <span className="font-bold text-slate-900">{formatNumber(data.sheets)} lbr ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Operator Breakdown Table dengan Filter Bulanan & Cetak Laporan */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Rekapitulasi Pemakaian per Operator ({formatMonthTitle(operatorPeriod)})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoring penggunaan lembar fisik cetak, warna, dan hitam putih per operator (AN, AL, SO, JML)
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Periode Bulanan */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-slate-600 font-medium">Bulan:</span>
              <select
                value={operatorPeriod}
                onChange={(e) => setOperatorPeriod(e.target.value)}
                className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer text-xs"
              >
                <option value="ALL">Semua Riwayat</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthTitle(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Cetak Laporan Bulanan */}
            <button
              type="button"
              onClick={() => setShowMonthlyPrintModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan Operator</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4 text-center">Jml Transaksi</th>
                <th className="py-3 px-4 text-right">Cetak Warna (CLR)</th>
                <th className="py-3 px-4 text-right">Hitam Putih (BW)</th>
                <th className="py-3 px-4 text-right font-black text-slate-800">Total Lembar Fisik</th>
                <th className="py-3 px-4 text-right">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {userStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Tidak ada aktivitas cetak operator pada periode {formatMonthTitle(operatorPeriod)}.
                  </td>
                </tr>
              ) : (
                userStats.map((item, idx) => {
                  const percentage =
                    operatorPeriodTotalSheets > 0
                      ? ((item.sheets / operatorPeriodTotalSheets) * 100).toFixed(1)
                      : '0';
                  return (
                    <tr key={idx} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 inline-flex items-center justify-center text-xs font-bold font-mono">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm">
                          {item.fullName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">{item.count} nota</td>
                      <td className="py-3 px-4 text-right font-mono text-purple-900 font-semibold">
                        {formatNumber(item.colorSheets)} lbr
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800 font-semibold">
                        {formatNumber(item.bwSheets)} lbr
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {formatNumber(item.sheets)} lembar
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="text-xs font-medium">{percentage}%</span>
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden inline-block">
                            <div className="bg-blue-600 h-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {userStats.length > 0 && (
              <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200 text-slate-900 text-xs sm:text-sm">
                <tr>
                  <td className="py-3 px-4 text-slate-700">TOTAL PERIODE:</td>
                  <td className="py-3 px-4 text-center font-mono">
                    {userStats.reduce((acc, curr) => acc + curr.count, 0)} nota
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-purple-950 font-bold">
                    {formatNumber(userStats.reduce((acc, curr) => acc + curr.colorSheets, 0))} lbr
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold">
                    {formatNumber(userStats.reduce((acc, curr) => acc + curr.bwSheets, 0))} lbr
                  </td>
                  <td className="py-3 px-4 text-right font-black text-blue-900 font-mono">
                    {formatNumber(operatorPeriodTotalSheets)} lembar
                  </td>
                  <td className="py-3 px-4 text-right font-mono">100%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal Cetak Laporan Bulanan Operator */}
      {showMonthlyPrintModal && (
        <MonthlyOperatorReportModal
          logs={logs}
          officeConfig={officeConfig}
          initialMonth={operatorPeriod === 'ALL' ? availableMonths[0] : operatorPeriod}
          onClose={() => setShowMonthlyPrintModal(false)}
        />
      )}
    </div>
  );
};
