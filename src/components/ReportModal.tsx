import React, { useState, useMemo } from 'react';
import { PrintLog, OfficeConfig, DailyPrinterCounter, OPERATOR_OPTIONS } from '../types';
import { formatNumber } from '../utils/helpers';
import {
  Printer,
  X,
  FileText,
  Gauge,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react';

interface ReportModalProps {
  logs: PrintLog[];
  counters: DailyPrinterCounter[];
  officeConfig: OfficeConfig;
  initialMode?: 'full' | 'operator' | 'counter' | 'logs';
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  logs,
  counters,
  officeConfig,
  initialMode,
  onClose,
}) => {
  // Sorted counters by date descending
  const sortedCounters = useMemo(() => {
    return [...counters].sort((a, b) => b.date.localeCompare(a.date));
  }, [counters]);

  // Unique dates from logs and counters
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    counters.forEach((c) => dates.add(c.date));
    logs.forEach((l) => dates.add(l.date));
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [counters, logs]);

  // Default selected date: latest counter date, latest log date, or today
  const defaultDate =
    sortedCounters[0]?.date ||
    logs[0]?.date ||
    new Date().toISOString().slice(0, 10);

  // User's chosen date for report and counter
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);

  // Mode filter tabel log dokumen: default hanya tanggal pilihan agar klop 100%
  const [showOnlySelectedDateLogs, setShowOnlySelectedDateLogs] = useState<boolean>(true);

  // Counter data KHUSUS untuk tanggal pilihan saja
  const selectedDayCounter = useMemo(() => {
    return counters.find((c) => c.date === selectedDate) || null;
  }, [counters, selectedDate]);

  // Logs untuk tanggal pilihan
  const logsOnSelectedDate = useMemo(() => {
    return logs.filter((l) => l.date === selectedDate);
  }, [logs, selectedDate]);

  // Logs yang ditampilkan pada Bagian 2
  const displayedLogs = useMemo(() => {
    return showOnlySelectedDateLogs ? logsOnSelectedDate : logs;
  }, [showOnlySelectedDateLogs, logsOnSelectedDate, logs]);

  // Counter data dengan rumus Total = CLR (Warna) + BW (Hitam Putih)
  const startClrVal = selectedDayCounter?.startColor || 0;
  const startBwVal = selectedDayCounter?.startBw || 0;
  const startTotVal = startClrVal + startBwVal;

  const endClrVal = selectedDayCounter?.endColor || 0;
  const endBwVal = selectedDayCounter?.endBw || 0;
  const endTotVal = endClrVal + endBwVal;

  // Perhitungan selisih pemakaian counter khusus tanggal pilihan
  const diffClr = Math.max(0, endClrVal - startClrVal);
  const diffBwVal = Math.max(0, endBwVal - startBwVal);
  const diffTot = Math.max(0, endTotVal - startTotVal); // = diffClr + diffBwVal

  // Aturan Konversi: 1 Counter = 2 A4
  const a4Tot = diffTot * 2;
  const a4Clr = diffClr * 2;
  const a4Bw = diffBwVal * 2;

  // Lembar log pada tanggal pilihan (Paper Jam tidak ikut catatan counter mesin)
  const counterValidLogsOnDate = logsOnSelectedDate.filter(
    (l) => l.status !== 'Paper Jam' && l.status !== ('Gagal / Rusak' as any)
  );
  const logSheetsOnSelectedDate = counterValidLogsOnDate.reduce((acc, curr) => acc + curr.sheets, 0);
  const logColorSheetsOnSelectedDate = counterValidLogsOnDate
    .filter((l) => l.printType === 'Warna')
    .reduce((acc, curr) => acc + curr.sheets, 0);
  const logBwSheetsOnSelectedDate = counterValidLogsOnDate
    .filter((l) => l.printType === 'Hitam Putih')
    .reduce((acc, curr) => acc + curr.sheets, 0);

  // Selisih antara mesin setara A4 dan catatan log pada tanggal pilihan
  // 1. Total Counter (= CLR + BW)
  const varianceA4 = a4Tot - logSheetsOnSelectedDate;
  const varianceCounter = diffTot - logSheetsOnSelectedDate / 2;

  // 2. Counter Warna (CLR)
  const varianceA4Clr = a4Clr - logColorSheetsOnSelectedDate;
  const varianceCounterClr = diffClr - logColorSheetsOnSelectedDate / 2;

  // 3. Counter Hitam Putih (BW)
  const varianceA4Bw = a4Bw - logBwSheetsOnSelectedDate;
  const varianceCounterBw = diffBwVal - logBwSheetsOnSelectedDate / 2;

  // Total lembar log yang ditampilkan
  const totalDisplayedSheets = displayedLogs.reduce((acc, curr) => acc + curr.sheets, 0);
  const completedDisplayedCount = displayedLogs.filter((l) => l.status === 'Selesai').length;

  // Rekapitulasi Data Print Setiap Operator (Bagian Bawah Laporan)
  const operatorSummary = useMemo(() => {
    // Kumpulkan grup berdasarkan operator
    const map = new Map<
      string,
      {
        initial: string;
        fullName: string;
        label: string;
        trxCount: number;
        colorSheets: number;
        bwSheets: number;
        totalPages: number;
        totalSheets: number;
      }
    >();

    displayedLogs.forEach((l) => {
      // Tentukan identitas operator
      let initial = 'OP';
      let fullName = l.userName || 'Operator';
      let label = l.userName || 'Operator';

      if (l.userName.includes(':')) {
        const parts = l.userName.split(':');
        initial = parts[0].trim();
        fullName = parts[1].trim();
        label = `${initial} : ${fullName}`;
      } else {
        const matched = OPERATOR_OPTIONS.find(
          (op) =>
            op.name.toLowerCase() === l.userName.toLowerCase() ||
            op.code.toLowerCase() === l.userName.toLowerCase()
        );
        if (matched) {
          initial = matched.code;
          fullName = matched.name;
          label = matched.label;
        } else {
          initial = l.userName.slice(0, 3).toUpperCase();
          fullName = l.userName;
          label = `${initial} : ${fullName}`;
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
        totalPages: 0,
        totalSheets: 0,
      };

      current.trxCount += 1;
      current.totalPages += l.pages;
      current.totalSheets += l.sheets;
      if (l.printType === 'Warna') {
        current.colorSheets += l.sheets;
      } else {
        current.bwSheets += l.sheets;
      }

      map.set(key, current);
    });

    // Urutkan berdasarkan totalSheets terbanyak
    return Array.from(map.values()).sort((a, b) => b.totalSheets - a.totalSheets);
  }, [displayedLogs]);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      if (!y || !m || !d) return dateStr;
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      return dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Format nomor nota hanya 4 digit angka terakhir contoh 0001
  const formatReceiptShort = (receiptNo: string): string => {
    if (!receiptNo) return '0000';
    const match = receiptNo.match(/(\d+)$/);
    if (match) {
      return match[1].slice(-4).padStart(4, '0');
    }
    const digits = receiptNo.replace(/\D/g, '');
    if (digits.length > 0) {
      return digits.slice(-4).padStart(4, '0');
    }
    return receiptNo.slice(-4).padStart(4, '0');
  };

  // Format isian operator hanya inisial saja (AN, AL, SO, JML)
  const formatOperatorInitial = (userName: string): string => {
    if (!userName) return '-';
    if (userName.includes(':')) {
      return userName.split(':')[0].trim();
    }
    if (userName.includes('-')) {
      return userName.split('-')[0].trim();
    }
    const matched = OPERATOR_OPTIONS.find(
      (op) =>
        op.name.toLowerCase() === userName.toLowerCase() ||
        op.code.toLowerCase() === userName.toLowerCase()
    );
    if (matched) return matched.code;
    const trimmed = userName.trim();
    if (trimmed.length <= 4) return trimmed.toUpperCase();
    return trimmed
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
  };

  // Format jenis cetak inisial: CLR untuk warna dan BW untuk hitam putih
  const formatPrintTypeInitial = (type: string): string => {
    if (!type) return '-';
    const lower = type.toLowerCase();
    if (lower.includes('warna') || lower.includes('color') || lower === 'clr') {
      return 'CLR';
    }
    if (lower.includes('hitam') || lower.includes('bw') || lower.includes('b&w')) {
      return 'BW';
    }
    return type;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <span className="font-bold text-sm block">
                Pratinjau Cetak Laporan Harian & Counter Mesin
              </span>
              <span className="text-xs text-slate-400">
                Menampilkan tanggal pilihan untuk Rekapitulasi Counter Awal & Akhir
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Input & Selector Tanggal Pilihan */}
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-slate-300 font-medium">Tanggal Pilihan:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-900 text-white font-bold px-2 py-0.5 rounded border border-slate-600 outline-none cursor-pointer text-xs"
              />
              {availableDates.length > 0 && (
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-indigo-300 font-medium outline-none cursor-pointer text-xs max-w-[130px]"
                  title="Pilih dari riwayat tanggal yang ada"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white">
                      {d} {counters.some((c) => c.date === d) ? '✓' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Toggle Filter Log */}
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800">
              <input
                type="checkbox"
                checked={showOnlySelectedDateLogs}
                onChange={(e) => setShowOnlySelectedDateLogs(e.target.checked)}
                className="rounded accent-blue-600 cursor-pointer"
              />
              <span>Hanya Log Tgl Ini</span>
            </label>

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

        {/* Printable Document Body */}
        <div className="p-8 sm:p-10 space-y-7 overflow-y-auto print:p-0 print:overflow-visible text-slate-900 bg-white">
          {/* Header Surat Laporan Resmi */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900">
              {officeConfig.officeName}
            </h1>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wider">
              Laporan Rekapitulasi Log Printing & Meteran Counter Mesin
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-slate-600 font-semibold">
                Periode Laporan: {formatDateDisplay(selectedDate)} ({selectedDate})
              </span>
              <span>•</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 border border-blue-300 text-blue-900">
                Total Counter = CLR + BW
              </span>
              <span>•</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900">
                Aturan Konversi: 1 Counter = 2 A4
              </span>
            </div>
          </div>

          {/* Ringkasan Eksekutif Khusus Tanggal Pilihan */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">Tanggal Terpilih:</span>
              <strong className="text-sm font-bold text-slate-900 font-mono">
                {selectedDate}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Total Lembar Log (A4):</span>
              <strong className="text-sm font-bold text-slate-900">
                {formatNumber(logSheetsOnSelectedDate)} Lembar A4
              </strong>
              <span className="text-[10px] text-slate-500 block">
                ({logsOnSelectedDate.length} transaksi)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Pemakaian Counter Mesin:</span>
              <strong className="text-sm font-bold text-blue-900">
                {formatNumber(diffTot)} Counter (≈ {formatNumber(a4Tot)} A4)
              </strong>
              <span className="text-[10px] text-slate-500 block">
                (Akhir {selectedDayCounter?.endTotal || 0} - Awal {selectedDayCounter?.startTotal || 0})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Hasil Rekonsiliasi (Selisih/Lebih):</span>
              {!selectedDayCounter ? (
                <strong className="text-sm font-bold text-slate-400">Belum Ada Counter</strong>
              ) : (
                <div className="space-y-0.5 mt-0.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Total (CLR+BW):</span>
                    <strong
                      className={
                        varianceA4 === 0
                          ? 'text-emerald-700'
                          : varianceA4 > 0
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }
                    >
                      {varianceA4 === 0
                        ? '0 (Klop)'
                        : varianceA4 > 0
                        ? `+${formatNumber(varianceA4)} lbr (+${varianceCounter} cnt)`
                        : `${formatNumber(varianceA4)} lbr (${varianceCounter} cnt)`}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-700">CLR (Warna):</span>
                    <strong
                      className={
                        varianceA4Clr === 0
                          ? 'text-emerald-700'
                          : varianceA4Clr > 0
                          ? 'text-purple-700'
                          : 'text-rose-700'
                      }
                    >
                      {varianceA4Clr === 0
                        ? '0 (Klop)'
                        : varianceA4Clr > 0
                        ? `+${formatNumber(varianceA4Clr)} lbr (+${varianceCounterClr} cnt)`
                        : `${formatNumber(varianceA4Clr)} lbr (${varianceCounterClr} cnt)`}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">BW (B&W):</span>
                    <strong
                      className={
                        varianceA4Bw === 0
                          ? 'text-emerald-700'
                          : varianceA4Bw > 0
                          ? 'text-slate-800'
                          : 'text-rose-700'
                      }
                    >
                      {varianceA4Bw === 0
                        ? '0 (Klop)'
                        : varianceA4Bw > 0
                        ? `+${formatNumber(varianceA4Bw)} lbr (+${varianceCounterBw} cnt)`
                        : `${formatNumber(varianceA4Bw)} lbr (${varianceCounterBw} cnt)`}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BAGIAN 1: REKAPITULASI COUNTER AWAL & COUNTER AKHIR MESIN PRINTER (TANGGAL PILIHAN SAJA) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 flex-wrap gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Gauge className="w-4 h-4 text-indigo-600 print:text-slate-800 shrink-0" />
                <span>
                  1. Rekapitulasi Counter Awal & Counter Akhir Mesin Printer (Tanggal Pilihan: {selectedDate})
                </span>
              </h3>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                1 Tanggal Terpilih: {selectedDate}
              </span>
            </div>

            {!selectedDayCounter ? (
              <div className="p-4 border border-dashed border-amber-300 bg-amber-50/50 rounded-xl text-center text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Data Counter Mesin Belum Diinput untuk Tanggal {selectedDate}</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  Silakan masukkan counter awal dan counter akhir untuk tanggal {selectedDate} pada form Counter Mesin printer.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Tabel Hanya 1 Tanggal Pilihan */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                    <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                      <tr>
                        <th rowSpan={2} className="p-2 border border-slate-300 text-center w-24">
                          Tanggal Pilihan
                        </th>
                        <th colSpan={3} className="p-2 border border-slate-300 text-center bg-blue-50/70">
                          Counter Awal (Pagi / Mulai)
                        </th>
                        <th colSpan={3} className="p-2 border border-slate-300 text-center bg-indigo-50/70">
                          Counter Akhir (Sore / Tutup)
                        </th>
                        <th colSpan={3} className="p-2 border border-slate-300 text-center bg-emerald-50/70">
                          Δ Pemakaian Counter (Akhir - Awal)
                        </th>
                        <th rowSpan={2} className="p-2 border border-slate-300 text-right bg-amber-50/70 font-black text-amber-950">
                          Setara Lembar A4 (×2)
                        </th>
                        <th rowSpan={2} className="p-2 border border-slate-300 text-right">
                          Tabel Log
                        </th>
                        <th colSpan={3} className="p-2 border border-slate-300 text-center bg-rose-50/70 text-slate-900 font-bold">
                          Selisih / Lebih (Masing-Masing Counter)
                        </th>
                      </tr>
                      <tr>
                        {/* Counter Awal subheaders */}
                        <th className="p-1.5 border border-slate-300 text-right font-bold text-blue-950 bg-blue-50/50">
                          Total (=CLR+BW)
                        </th>
                        <th className="p-1.5 border border-slate-300 text-right font-semibold text-purple-800">
                          CLR
                        </th>
                        <th className="p-1.5 border border-slate-300 text-right font-semibold">BW</th>
                        {/* Counter Akhir subheaders */}
                        <th className="p-1.5 border border-slate-300 text-right font-bold text-indigo-950 bg-indigo-50/50">
                          Total (=CLR+BW)
                        </th>
                        <th className="p-1.5 border border-slate-300 text-right font-semibold text-purple-800">
                          CLR
                        </th>
                        <th className="p-1.5 border border-slate-300 text-right font-semibold">BW</th>
                        {/* Selisih Counter subheaders */}
                        <th className="p-1.5 border border-slate-300 text-right font-bold text-blue-900">
                          Δ Total
                        </th>
                        <th className="p-1.5 border border-slate-300 text-right font-bold text-purple-900">
                          Δ CLR
                        </th>
                        <th className="p-1.5 border border-slate-300 text-right font-bold text-slate-900">
                          Δ BW
                        </th>
                        {/* Selisih / Lebih Masing-Masing Counter subheaders */}
                        <th className="p-1.5 border border-slate-300 text-center font-bold text-blue-950 bg-blue-50/70">
                          Selisih Total
                        </th>
                        <th className="p-1.5 border border-slate-300 text-center font-bold text-purple-950 bg-purple-50/70">
                          Selisih CLR
                        </th>
                        <th className="p-1.5 border border-slate-300 text-center font-bold text-slate-950 bg-slate-100">
                          Selisih BW
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="p-2.5 border border-slate-300 font-bold text-center whitespace-nowrap bg-slate-50/60 font-mono">
                          {selectedDayCounter.date}
                        </td>
                        {/* Counter Awal */}
                        <td className="p-2.5 border border-slate-300 text-right font-mono font-bold bg-blue-50/30 text-blue-950">
                          {formatNumber(startTotVal)}
                        </td>
                        <td className="p-2.5 border border-slate-300 text-right font-mono text-purple-800 font-semibold">
                          {formatNumber(startClrVal)}
                        </td>
                        <td className="p-2.5 border border-slate-300 text-right font-mono text-slate-700 font-semibold">
                          {formatNumber(startBwVal)}
                        </td>
                        {/* Counter Akhir */}
                        <td className="p-2.5 border border-slate-300 text-right font-mono font-bold bg-indigo-50/30 text-indigo-950">
                          {formatNumber(endTotVal)}
                        </td>
                        <td className="p-2.5 border border-slate-300 text-right font-mono text-purple-800 bg-indigo-50/20 font-semibold">
                          {formatNumber(endClrVal)}
                        </td>
                        <td className="p-2.5 border border-slate-300 text-right font-mono text-slate-700 bg-indigo-50/20 font-semibold">
                          {formatNumber(endBwVal)}
                        </td>
                        {/* Selisih Counter Mesin */}
                        <td className="p-2.5 border border-slate-300 text-right font-mono font-bold text-blue-900 bg-emerald-50/30">
                          {formatNumber(diffTot)} cnt
                        </td>
                        <td className="p-2.5 border border-slate-300 text-right font-mono font-bold text-purple-900 bg-emerald-50/30">
                          {formatNumber(diffClr)} cnt
                        </td>
                        <td className="p-2.5 border border-slate-300 text-right font-mono font-bold text-slate-800 bg-emerald-50/30">
                          {formatNumber(diffBwVal)} cnt
                        </td>
                        {/* Setara Lembar A4 (1 Counter = 2 A4) */}
                        <td className="p-2.5 border border-slate-300 text-right font-mono bg-amber-50/60">
                          <div className="font-black text-amber-950">{formatNumber(a4Tot)} lbr A4</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            CLR: {formatNumber(a4Clr)} | BW: {formatNumber(a4Bw)}
                          </div>
                        </td>
                        {/* Log Catatan Tanggal Pilihan */}
                        <td className="p-2.5 border border-slate-300 text-right font-mono">
                          <div className="font-semibold text-slate-900">{formatNumber(logSheetsOnSelectedDate)} lbr A4</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            CLR: {formatNumber(logColorSheetsOnSelectedDate)} | BW: {formatNumber(logBwSheetsOnSelectedDate)}
                          </div>
                        </td>
                        {/* Selisih Total */}
                        <td className="p-2.5 border border-slate-300 text-center font-mono font-bold bg-blue-50/20">
                          {varianceA4 === 0 ? (
                            <span className="text-emerald-700 font-bold">0 (Klop)</span>
                          ) : varianceA4 > 0 ? (
                            <span className="text-amber-700 font-bold">
                              +{formatNumber(varianceA4)} lbr<br />
                              <span className="text-[10px] text-amber-800 font-medium">
                                (+{formatNumber(varianceCounter)} cnt)
                              </span>
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold">
                              {formatNumber(varianceA4)} lbr<br />
                              <span className="text-[10px] text-rose-800 font-medium">
                                ({formatNumber(varianceCounter)} cnt)
                              </span>
                            </span>
                          )}
                        </td>
                        {/* Selisih CLR */}
                        <td className="p-2.5 border border-slate-300 text-center font-mono font-bold bg-purple-50/20">
                          {varianceA4Clr === 0 ? (
                            <span className="text-emerald-700 font-bold">0 (Klop)</span>
                          ) : varianceA4Clr > 0 ? (
                            <span className="text-purple-700 font-bold">
                              +{formatNumber(varianceA4Clr)} lbr<br />
                              <span className="text-[10px] text-purple-800 font-medium">
                                (+{formatNumber(varianceCounterClr)} cnt)
                              </span>
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold">
                              {formatNumber(varianceA4Clr)} lbr<br />
                              <span className="text-[10px] text-rose-800 font-medium">
                                ({formatNumber(varianceCounterClr)} cnt)
                              </span>
                            </span>
                          )}
                        </td>
                        {/* Selisih BW */}
                        <td className="p-2.5 border border-slate-300 text-center font-mono font-bold bg-slate-50/40">
                          {varianceA4Bw === 0 ? (
                            <span className="text-emerald-700 font-bold">0 (Klop)</span>
                          ) : varianceA4Bw > 0 ? (
                            <span className="text-slate-800 font-bold">
                              +{formatNumber(varianceA4Bw)} lbr<br />
                              <span className="text-[10px] text-slate-700 font-medium">
                                (+{formatNumber(varianceCounterBw)} cnt)
                              </span>
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold">
                              {formatNumber(varianceA4Bw)} lbr<br />
                              <span className="text-[10px] text-rose-800 font-medium">
                                ({formatNumber(varianceCounterBw)} cnt)
                              </span>
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3 Box Rincian Selisih / Lebih Masing-Masing Counter */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {/* Card 1: Total */}
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-blue-950">
                      <span>1. Selisih Total (=CLR+BW)</span>
                      <span className="font-mono text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded border border-blue-300">
                        Total Counter
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span>Mesin (×2 A4):</span>
                      <strong className="font-mono text-slate-900">
                        {formatNumber(diffTot)} cnt ({formatNumber(a4Tot)} A4)
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span>Tabel Log:</span>
                      <strong className="font-mono text-slate-900">
                        {formatNumber(logSheetsOnSelectedDate)} lbr A4
                      </strong>
                    </div>
                    <div className="pt-1 border-t border-blue-200 flex justify-between font-bold text-xs">
                      <span>Hasil Selisih/Lebih:</span>
                      <span
                        className={
                          varianceA4 === 0
                            ? 'text-emerald-700'
                            : varianceA4 > 0
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }
                      >
                        {varianceA4 === 0
                          ? '0 (Klop)'
                          : varianceA4 > 0
                          ? `+${formatNumber(varianceA4)} lbr (+${varianceCounter} cnt)`
                          : `${formatNumber(varianceA4)} lbr (${varianceCounter} cnt)`}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Warna CLR */}
                  <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-purple-950">
                      <span>2. Selisih Warna (CLR)</span>
                      <span className="font-mono text-[10px] bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded border border-purple-300">
                        Warna
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span>Mesin (×2 A4):</span>
                      <strong className="font-mono text-purple-950">
                        {formatNumber(diffClr)} cnt ({formatNumber(a4Clr)} A4)
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span>Tabel Log:</span>
                      <strong className="font-mono text-purple-950">
                        {formatNumber(logColorSheetsOnSelectedDate)} lbr A4
                      </strong>
                    </div>
                    <div className="pt-1 border-t border-purple-200 flex justify-between font-bold text-xs">
                      <span>Hasil Selisih/Lebih:</span>
                      <span
                        className={
                          varianceA4Clr === 0
                            ? 'text-emerald-700'
                            : varianceA4Clr > 0
                            ? 'text-purple-700'
                            : 'text-rose-700'
                        }
                      >
                        {varianceA4Clr === 0
                          ? '0 (Klop)'
                          : varianceA4Clr > 0
                          ? `+${formatNumber(varianceA4Clr)} lbr (+${varianceCounterClr} cnt)`
                          : `${formatNumber(varianceA4Clr)} lbr (${varianceCounterClr} cnt)`}
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Hitam Putih BW */}
                  <div className="p-3 bg-slate-100/70 border border-slate-300 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>3. Selisih Hitam Putih (BW)</span>
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded border border-slate-300">
                        Hitam Putih
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span>Mesin (×2 A4):</span>
                      <strong className="font-mono text-slate-900">
                        {formatNumber(diffBwVal)} cnt ({formatNumber(a4Bw)} A4)
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span>Tabel Log:</span>
                      <strong className="font-mono text-slate-900">
                        {formatNumber(logBwSheetsOnSelectedDate)} lbr A4
                      </strong>
                    </div>
                    <div className="pt-1 border-t border-slate-300 flex justify-between font-bold text-xs">
                      <span>Hasil Selisih/Lebih:</span>
                      <span
                        className={
                          varianceA4Bw === 0
                            ? 'text-emerald-700'
                            : varianceA4Bw > 0
                            ? 'text-slate-800'
                            : 'text-rose-700'
                        }
                      >
                        {varianceA4Bw === 0
                          ? '0 (Klop)'
                          : varianceA4Bw > 0
                          ? `+${formatNumber(varianceA4Bw)} lbr (+${varianceCounterBw} cnt)`
                          : `${formatNumber(varianceA4Bw)} lbr (${varianceCounterBw} cnt)`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Catatan Tambahan Counter jika ada */}
                {selectedDayCounter.notes && (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                    <span className="font-semibold text-slate-700 shrink-0">Catatan Tanggal {selectedDate}:</span>
                    <span>{selectedDayCounter.notes}</span>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 italic">
                  * Catatan: Status cetak "Paper Jam" tidak dihitung ke dalam catatan counter mesin printer.
                </div>
              </div>
            )}
          </div>

          {/* BAGIAN 2: RINCIAN TABEL LOG AKTIVITAS PRINTING DOKUMEN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 flex-wrap gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-blue-600 print:text-slate-800 shrink-0" />
                <span>
                  2. Rincian Tabel Log Aktivitas Printing Dokumen{' '}
                  {showOnlySelectedDateLogs
                    ? `(Tanggal Pilihan: ${selectedDate})`
                    : '(Semua Riwayat Log)'}
                </span>
              </h3>
              <span className="text-[11px] text-slate-500">
                {displayedLogs.length} Catatan Dokumen
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border border-slate-300 text-center w-20">No. Nota</th>
                    <th className="p-2 border border-slate-300 text-center w-16">Operator</th>
                    <th className="p-2 border border-slate-300">Jenis Kertas</th>
                    <th className="p-2 border border-slate-300 text-center">Sisi Cetak</th>
                    <th className="p-2 border border-slate-300 text-center w-20">Jenis Cetak</th>
                    <th className="p-2 border border-slate-300 text-center">Jml Halaman</th>
                    <th className="p-2 border border-slate-300 text-right">Lembar Fisik</th>
                    <th className="p-2 border border-slate-300 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-500">
                        Tidak ada catatan log aktivitas cetak pada tanggal {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    displayedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        {/* 4 Digit Angka Terakhir No. Nota (contoh 0001) */}
                        <td className="p-2 border border-slate-300 font-mono font-bold text-center text-blue-950">
                          {formatReceiptShort(log.receiptNo)}
                        </td>
                        {/* Isian Operator Cukup Inisial Saja */}
                        <td className="p-2 border border-slate-300 text-center font-mono font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-900 text-xs font-black">
                            {formatOperatorInitial(log.userName)}
                          </span>
                        </td>
                        {/* Kolom Jenis Kertas (Dipisah dari Sisi) */}
                        <td className="p-2 border border-slate-300 font-medium">
                          {log.paperType}
                        </td>
                        {/* Kolom Sisi Cetak */}
                        <td className="p-2 border border-slate-300 text-center whitespace-nowrap">
                          {log.printSide}
                        </td>
                        {/* Jenis Cetak Inisial: CLR / BW */}
                        <td className="p-2 border border-slate-300 text-center font-mono font-bold">
                          {formatPrintTypeInitial(log.printType) === 'CLR' ? (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200 text-xs font-black">
                              CLR
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-900 border border-slate-300 text-xs font-black">
                              BW
                            </span>
                          )}
                        </td>
                        <td className="p-2 border border-slate-300 text-center">{log.pages} hlm</td>
                        <td className="p-2 border border-slate-300 text-right font-bold font-mono">
                          {formatNumber(log.sheets)}
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-semibold">
                          {log.status === 'Salah Print' || (log.status as any) === 'Dibatalkan' ? (
                            <div className="flex flex-col items-center">
                              <span className="text-rose-700 font-bold">Salah Print</span>
                              {log.errorBy && (
                                <span className="text-[10px] text-rose-600 font-semibold">
                                  ({log.errorBy})
                                </span>
                              )}
                            </div>
                          ) : log.status === 'Paper Jam' || (log.status as any) === 'Gagal / Rusak' ? (
                            <span className="text-amber-700 font-bold">Paper Jam</span>
                          ) : log.status === 'Pending' || (log.status as any) === 'Menunggu' ? (
                            <span className="text-blue-700 font-bold">Pending</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">Selesai</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                  <tr>
                    <td colSpan={6} className="p-2.5 text-right border border-slate-300">
                      TOTAL LEMBAR FISIK DARI LOG KANTOR:
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 text-blue-900 font-black font-mono">
                      {formatNumber(totalDisplayedSheets)} lbr A4
                    </td>
                    <td className="p-2.5 text-center border border-slate-300 font-semibold">
                      {completedDisplayedCount} Sukses
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* BAGIAN 3: REKAPITULASI DATA PRINT SETIAP OPERATOR */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 flex-wrap gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Users className="w-4 h-4 text-indigo-600 print:text-slate-800 shrink-0" />
                <span>
                  3. Rekapitulasi Data Print Setiap Operator{' '}
                  {showOnlySelectedDateLogs
                    ? `(Tanggal Pilihan: ${selectedDate})`
                    : '(Semua Riwayat Log)'}
                </span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {operatorSummary.length} Operator Terlibat
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border border-slate-300 text-center w-12">No.</th>
                    <th className="p-2 border border-slate-300 text-center w-20">Inisial</th>
                    <th className="p-2 border border-slate-300">Nama Operator</th>
                    <th className="p-2 border border-slate-300 text-center w-24">Jml Transaksi</th>
                    <th className="p-2 border border-slate-300 text-right w-24">Cetak Warna (CLR)</th>
                    <th className="p-2 border border-slate-300 text-right w-24">Hitam Putih (BW)</th>
                    <th className="p-2 border border-slate-300 text-center w-24">Total Halaman</th>
                    <th className="p-2 border border-slate-300 text-right w-28 bg-blue-50/60 font-black text-blue-950">
                      Total Lembar (A4)
                    </th>
                    <th className="p-2 border border-slate-300 text-right w-20">Kontribusi (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {operatorSummary.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-slate-500">
                        Tidak ada aktivitas cetak operator pada tanggal {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    operatorSummary.map((op, idx) => {
                      const sharePct =
                        totalDisplayedSheets > 0
                          ? ((op.totalSheets / totalDisplayedSheets) * 100).toFixed(1)
                          : '0.0';
                      return (
                        <tr key={op.initial} className="hover:bg-slate-50/50">
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
                          <td className="p-2 border border-slate-300 text-right font-mono text-purple-900 font-semibold">
                            {formatNumber(op.colorSheets)} lbr
                          </td>
                          <td className="p-2 border border-slate-300 text-right font-mono text-slate-800 font-semibold">
                            {formatNumber(op.bwSheets)} lbr
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-mono">
                            {formatNumber(op.totalPages)} hlm
                          </td>
                          <td className="p-2 border border-slate-300 text-right font-mono font-black text-blue-900 bg-blue-50/40">
                            {formatNumber(op.totalSheets)} lbr
                          </td>
                          <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-700">
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
                      TOTAL KESELURUHAN OPERATOR:
                    </td>
                    <td className="p-2.5 text-center border border-slate-300 font-mono font-bold">
                      {operatorSummary.reduce((acc, curr) => acc + curr.trxCount, 0)} nota
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 text-purple-950 font-black font-mono">
                      {formatNumber(operatorSummary.reduce((acc, curr) => acc + curr.colorSheets, 0))} lbr
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 text-slate-900 font-black font-mono">
                      {formatNumber(operatorSummary.reduce((acc, curr) => acc + curr.bwSheets, 0))} lbr
                    </td>
                    <td className="p-2.5 text-center border border-slate-300 font-mono font-bold">
                      {formatNumber(operatorSummary.reduce((acc, curr) => acc + curr.totalPages, 0))} hlm
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 text-blue-950 font-black font-mono bg-blue-100/60">
                      {formatNumber(totalDisplayedSheets)} lbr A4
                    </td>
                    <td className="p-2.5 text-right border border-slate-300 font-mono font-bold">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
