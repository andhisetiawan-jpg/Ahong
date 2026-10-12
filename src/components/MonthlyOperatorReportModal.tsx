import React, { useState, useMemo } from 'react';
import { PrintLog, OfficeConfig, OPERATOR_OPTIONS } from '../types';
import { formatNumber } from '../utils/helpers';
import {
  Printer,
  X,
  FileText,
  Calendar,
  Users,
  Award,
  Sparkles,
  Layers,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface MonthlyOperatorReportModalProps {
  logs: PrintLog[];
  officeConfig: OfficeConfig;
  initialMonth?: string; // YYYY-MM
  onClose: () => void;
}

export const MonthlyOperatorReportModal: React.FC<MonthlyOperatorReportModalProps> = ({
  logs,
  officeConfig,
  initialMonth,
  onClose,
}) => {
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

  // Bulan yang dipilih
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialMonth || availableMonths[0] || new Date().toISOString().slice(0, 7)
  );

  // Filter logs berdasarkan bulan yang dipilih
  const monthlyLogs = useMemo(() => {
    return logs.filter((l) => l.date && l.date.startsWith(selectedMonth));
  }, [logs, selectedMonth]);

  // Kalkulasi total bulanan
  const totalMonthlySheets = useMemo(() => {
    return monthlyLogs.reduce((acc, curr) => acc + curr.sheets, 0);
  }, [monthlyLogs]);

  const totalMonthlyPages = useMemo(() => {
    return monthlyLogs.reduce((acc, curr) => acc + curr.pages, 0);
  }, [monthlyLogs]);

  const totalMonthlyTrx = monthlyLogs.length;

  const totalMonthlyColorSheets = useMemo(() => {
    return monthlyLogs
      .filter((l) => l.printType === 'Warna')
      .reduce((acc, curr) => acc + curr.sheets, 0);
  }, [monthlyLogs]);

  const totalMonthlyBwSheets = useMemo(() => {
    return monthlyLogs
      .filter((l) => l.printType === 'Hitam Putih')
      .reduce((acc, curr) => acc + curr.sheets, 0);
  }, [monthlyLogs]);

  // Kelompokkan data per operator
  const operatorMonthlyStats = useMemo(() => {
    const map = new Map<
      string,
      {
        initial: string;
        fullName: string;
        label: string;
        trxCount: number;
        colorSheets: number;
        bwSheets: number;
        simplexSheets: number;
        duplexSheets: number;
        totalPages: number;
        totalSheets: number;
        activeDays: Set<string>;
      }
    >();

    monthlyLogs.forEach((l) => {
      let initial = 'OP';
      let fullName = l.userName || 'Operator';
      let label = l.userName || 'Operator';

      if (l.userName.includes(':')) {
        const parts = l.userName.split(':');
        initial = parts[0].trim();
        fullName = parts[1].trim();
        label = fullName;
      } else {
        const matched = OPERATOR_OPTIONS.find(
          (op) =>
            op.name.toLowerCase() === l.userName.toLowerCase() ||
            op.code.toLowerCase() === l.userName.toLowerCase()
        );
        if (matched) {
          initial = matched.code;
          fullName = matched.name;
          label = matched.name;
        } else {
          initial = l.userName.slice(0, 3).toUpperCase();
          fullName = l.userName;
          label = fullName;
        }
      }

      const key = initial;
      const current = map.get(key) || {
        initial,
        fullName,
        label,
        trxCount: 0,
        colorSheets: 0,
        bwSheets: 0,
        simplexSheets: 0,
        duplexSheets: 0,
        totalPages: 0,
        totalSheets: 0,
        activeDays: new Set<string>(),
      };

      current.trxCount += 1;
      current.totalPages += l.pages;
      current.totalSheets += l.sheets;
      current.activeDays.add(l.date);

      if (l.printType === 'Warna') {
        current.colorSheets += l.sheets;
      } else {
        current.bwSheets += l.sheets;
      }

      if (l.printSide === '2 Sisi (Duplex)') {
        current.duplexSheets += l.sheets;
      } else {
        current.simplexSheets += l.sheets;
      }

      map.set(key, current);
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        activeDaysCount: item.activeDays.size,
      }))
      .sort((a, b) => b.totalSheets - a.totalSheets);
  }, [monthlyLogs]);

  // Format Nama Bulan Indonesia
  const formatMonthTitle = (monthStr: string) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <span className="font-bold text-sm block">
                Cetak Laporan Rekapitulasi Pemakaian per Operator Bulanan
              </span>
              <span className="text-xs text-slate-400">
                Laporan produktivitas dan kontribusi cetak operator bulanan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Pemilih Bulan */}
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-slate-300 font-medium">Periode Bulan:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-900 text-white font-bold px-2 py-0.5 rounded border border-slate-600 outline-none cursor-pointer text-xs"
              />
              {availableMonths.length > 0 && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-indigo-300 font-medium outline-none cursor-pointer text-xs max-w-[130px]"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m} className="bg-slate-900 text-white">
                      {formatMonthTitle(m)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Tombol Cetak */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>

            {/* Tombol Tutup */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-0 print:space-y-4 print:text-black">
          {/* Header Dokumen Laporan Cetak */}
          <div className="border-b-2 border-slate-900 pb-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-block px-2.5 py-0.5 mb-1 text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900 rounded print:border print:border-indigo-400">
                LAPORAN PRODUKTIVITAS OPERATOR MESIN
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                {officeConfig.officeName}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Rekapitulasi Pemakaian Lembar Cetak & Aktivitas Mesin per Operator Bulanan
              </p>
            </div>

            <div className="text-right text-xs space-y-1">
              <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 inline-block text-left">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Periode Laporan:</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {formatMonthTitle(selectedMonth)}
                </span>
                <span className="text-[11px] text-slate-600 block">
                  Format ISO: {selectedMonth}
                </span>
              </div>
            </div>
          </div>

          {/* Ringkasan Eksekutif Bulanan (KPI Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Total Pemakaian:</span>
              <strong className="text-lg font-black text-slate-900 font-mono">
                {formatNumber(totalMonthlySheets)} <span className="text-xs font-normal">lbr A4</span>
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                ≈ {(totalMonthlySheets / 500).toFixed(1)} Rim Kertas
              </span>
            </div>

            <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200">
              <span className="text-[11px] text-purple-700 block font-medium">Cetak Warna (CLR):</span>
              <strong className="text-lg font-black text-purple-950 font-mono">
                {formatNumber(totalMonthlyColorSheets)} <span className="text-xs font-normal">lbr</span>
              </strong>
              <span className="text-[10px] text-purple-700 block mt-0.5">
                {totalMonthlySheets > 0 ? ((totalMonthlyColorSheets / totalMonthlySheets) * 100).toFixed(1) : 0}% porsi
              </span>
            </div>

            <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-300">
              <span className="text-[11px] text-slate-700 block font-medium">Hitam Putih (BW):</span>
              <strong className="text-lg font-black text-slate-900 font-mono">
                {formatNumber(totalMonthlyBwSheets)} <span className="text-xs font-normal">lbr</span>
              </strong>
              <span className="text-[10px] text-slate-600 block mt-0.5">
                {totalMonthlySheets > 0 ? ((totalMonthlyBwSheets / totalMonthlySheets) * 100).toFixed(1) : 0}% porsi
              </span>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
              <span className="text-[11px] text-blue-700 block font-medium">Total Nota / Transaksi:</span>
              <strong className="text-lg font-black text-blue-950 font-mono">
                {totalMonthlyTrx} <span className="text-xs font-normal">nota</span>
              </strong>
              <span className="text-[10px] text-blue-700 block mt-0.5">
                {operatorMonthlyStats.length} Operator Aktif
              </span>
            </div>
          </div>

          {/* Tabel Utama: Rekapitulasi Pemakaian per Operator Bulanan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 flex-wrap gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Users className="w-4 h-4 text-indigo-600 print:text-slate-800 shrink-0" />
                <span>
                  Tabel Rekapitulasi Pemakaian per Operator ({formatMonthTitle(selectedMonth)})
                </span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {operatorMonthlyStats.length} Operator Bertugas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border border-slate-300 text-center w-10">No.</th>
                    <th className="p-2 border border-slate-300 text-center w-16">Inisial</th>
                    <th className="p-2 border border-slate-300">Nama Operator</th>
                    <th className="p-2 border border-slate-300 text-center w-20">Jml Nota</th>
                    <th className="p-2 border border-slate-300 text-center w-20">Hari Aktif</th>
                    <th className="p-2 border border-slate-300 text-right w-24">Cetak CLR</th>
                    <th className="p-2 border border-slate-300 text-right w-24">Cetak BW</th>
                    <th className="p-2 border border-slate-300 text-right w-20">1 Sisi</th>
                    <th className="p-2 border border-slate-300 text-right w-20">2 Sisi</th>
                    <th className="p-2 border border-slate-300 text-center w-24">Total Hlm</th>
                    <th className="p-2 border border-slate-300 text-right w-28 bg-blue-50/70 font-black text-blue-950">
                      Total Lembar (A4)
                    </th>
                    <th className="p-2 border border-slate-300 text-right w-20">Porsi (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {operatorMonthlyStats.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-6 text-center text-slate-500">
                        Tidak ada catatan log aktivitas cetak pada bulan {formatMonthTitle(selectedMonth)}.
                      </td>
                    </tr>
                  ) : (
                    operatorMonthlyStats.map((op, idx) => {
                      const sharePct =
                        totalMonthlySheets > 0
                          ? ((op.totalSheets / totalMonthlySheets) * 100).toFixed(1)
                          : '0.0';
                      return (
                        <tr key={op.initial} className="hover:bg-slate-50/60">
                          <td className="p-2 border border-slate-300 text-center font-medium text-slate-600">
                            {idx + 1}
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-mono font-bold">
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-black">
                              {op.initial}
                            </span>
                          </td>
                          <td className="p-2 border border-slate-300 font-bold text-slate-900">
                            {op.label}
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-medium">
                            {op.trxCount} nota
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-medium text-slate-700">
                            {op.activeDaysCount} hari
                          </td>
                          <td className="p-2 border border-slate-300 text-right font-mono text-purple-900 font-semibold">
                            {formatNumber(op.colorSheets)}
                          </td>
                          <td className="p-2 border border-slate-300 text-right font-mono text-slate-800 font-semibold">
                            {formatNumber(op.bwSheets)}
                          </td>
                          <td className="p-2 border border-slate-300 text-right font-mono text-slate-600">
                            {formatNumber(op.simplexSheets)}
                          </td>
                          <td className="p-2 border border-slate-300 text-right font-mono text-emerald-800 font-medium">
                            {formatNumber(op.duplexSheets)}
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-mono">
                            {formatNumber(op.totalPages)}
                          </td>
                          <td className="p-2 border border-slate-300 text-right font-mono font-black text-blue-900 bg-blue-50/40">
                            {formatNumber(op.totalSheets)} lbr
                          </td>
                          <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-800">
                            {sharePct}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                  <tr>
                    <td colSpan={3} className="p-2.5 text-right border border-slate-300">
                      TOTAL REKAPITULASI BULANAN:
                    </td>
                    <td className="p-2.5 text-center border border-slate-300 font-mono font-bold">
                      {totalMonthlyTrx} nota
                    </td>
                    <td className="p-2.5 text-center border border-slate-300 text-slate-600">
                      -
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 text-purple-950 font-black font-mono">
                      {formatNumber(totalMonthlyColorSheets)}
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 text-slate-900 font-black font-mono">
                      {formatNumber(totalMonthlyBwSheets)}
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 font-mono">
                      {formatNumber(operatorMonthlyStats.reduce((acc, curr) => acc + curr.simplexSheets, 0))}
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 font-mono text-emerald-900">
                      {formatNumber(operatorMonthlyStats.reduce((acc, curr) => acc + curr.duplexSheets, 0))}
                    </td>
                    <td className="p-2.5 text-center border border-slate-300 font-mono font-bold">
                      {formatNumber(totalMonthlyPages)}
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 text-blue-950 font-black font-mono bg-blue-100/60">
                      {formatNumber(totalMonthlySheets)} lbr A4
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 font-mono font-bold">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Ranking & Kontribusi Operator */}
          {operatorMonthlyStats.length > 0 && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Award className="w-4 h-4 text-amber-500" />
                Catatan Evaluasi Bulanan:
              </span>
              <p className="text-slate-600 leading-relaxed">
                Operator dengan volume cetak tertinggi pada bulan{' '}
                <strong className="text-slate-900">{formatMonthTitle(selectedMonth)}</strong> adalah{' '}
                <strong className="text-blue-900 font-mono">
                  {operatorMonthlyStats[0]?.label}
                </strong>{' '}
                dengan total{' '}
                <strong className="text-slate-900 font-mono">
                  {formatNumber(operatorMonthlyStats[0]?.totalSheets)} lembar
                </strong>{' '}
                ({((operatorMonthlyStats[0]?.totalSheets / totalMonthlySheets) * 100).toFixed(1)}% dari total produksi).
              </p>
            </div>
          )}

          {/* Footer Tanggal Cetak */}
          <div className="pt-4 border-t border-slate-300 flex justify-between items-center text-[11px] text-slate-500">
            <span>
              Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
            </span>
            <span className="font-mono">
              Sistem Log & Counter Mesin — {officeConfig.officeName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
