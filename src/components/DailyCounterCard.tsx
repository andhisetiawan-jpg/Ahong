import React, { useState, useEffect } from 'react';
import { DailyPrinterCounter, PrintLog } from '../types';
import { formatNumber } from '../utils/helpers';
import {
  Gauge,
  Calendar,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  RotateCcw,
  History,
  Trash2,
  Sparkles,
  Layers,
} from 'lucide-react';

interface DailyCounterCardProps {
  counters: DailyPrinterCounter[];
  logs: PrintLog[];
  onSaveCounter: (counter: DailyPrinterCounter) => void;
  onDeleteCounter: (id: string) => void;
}

export const DailyCounterCard: React.FC<DailyCounterCardProps> = ({
  counters,
  logs,
  onSaveCounter,
  onDeleteCounter,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Form inputs: CLR (Warna) & BW (Hitam Putih)
  const [startColor, setStartColor] = useState<number>(0);
  const [startBw, setStartBw] = useState<number>(0);

  const [endColor, setEndColor] = useState<number>(0);
  const [endBw, setEndBw] = useState<number>(0);

  // Total counter otomatis merupakan penjumlahan dari counter Warna (CLR) dan counter BW:
  const startTotal = (Number(startColor) || 0) + (Number(startBw) || 0);
  const endTotal = (Number(endColor) || 0) + (Number(endBw) || 0);

  const [notes, setNotes] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Load existing counter for selected date, or predict from previous date
  useEffect(() => {
    const existing = counters.find((c) => c.date === selectedDate);
    if (existing) {
      setStartColor(existing.startColor);
      setStartBw(existing.startBw);
      setEndColor(existing.endColor);
      setEndBw(existing.endBw);
      setNotes(existing.notes || '');
    } else {
      // Find the most recent counter before selectedDate to suggest start counter
      const sorted = [...counters].sort((a, b) => b.date.localeCompare(a.date));
      const previous = sorted.find((c) => c.date < selectedDate);
      if (previous && (previous.endColor > 0 || previous.endBw > 0)) {
        setStartColor(previous.endColor);
        setStartBw(previous.endBw);
        // Default end counter same as start counter initially
        setEndColor(previous.endColor);
        setEndBw(previous.endBw);
      } else {
        setStartColor(0);
        setStartBw(0);
        setEndColor(0);
        setEndBw(0);
      }
      setNotes('');
    }
  }, [selectedDate, counters]);

  // Calculations for Machine Meter Differences (dalam satuan counter)
  const diffTotal = Math.max(0, endTotal - startTotal);
  const diffColor = Math.max(0, endColor - startColor);
  const diffBw = Math.max(0, endBw - startBw);

  // Aturan Hitungan: 1 Counter = 2 A4
  const a4EquivalentTotal = diffTotal * 2;
  const a4EquivalentColor = diffColor * 2;
  const a4EquivalentBw = diffBw * 2;

  // Calculations for Log Table on the selected date (dalam lembar A4)
  // Catatan: Status "Paper Jam" tidak ikut catatan counter mesin
  const logsOnDate = logs.filter((l) => l.date === selectedDate);
  const counterValidLogs = logsOnDate.filter(
    (l) => l.status !== 'Paper Jam' && l.status !== ('Gagal / Rusak' as any)
  );
  const paperJamLogsCount = logsOnDate.filter(
    (l) => l.status === 'Paper Jam' || l.status === ('Gagal / Rusak' as any)
  ).length;
  const paperJamSheets = logsOnDate
    .filter((l) => l.status === 'Paper Jam' || l.status === ('Gagal / Rusak' as any))
    .reduce((acc, curr) => acc + curr.sheets, 0);

  const logTotalSheets = counterValidLogs.reduce((acc, curr) => acc + curr.sheets, 0);
  const logColorSheets = counterValidLogs
    .filter((l) => l.printType === 'Warna')
    .reduce((acc, curr) => acc + curr.sheets, 0);
  const logBwSheets = counterValidLogs
    .filter((l) => l.printType === 'Hitam Putih')
    .reduce((acc, curr) => acc + curr.sheets, 0);

  // Equivalent counter dari catatan log (log lembar A4 / 2)
  const logEquivalentCounterTotal = logTotalSheets / 2;
  const logEquivalentCounterColor = logColorSheets / 2;
  const logEquivalentCounterBw = logBwSheets / 2;

  // Variances / Discrepancies (Selisih Mesin vs Log) dalam Lembar A4
  const varianceA4Total = a4EquivalentTotal - logTotalSheets;
  const varianceA4Color = a4EquivalentColor - logColorSheets;
  const varianceA4Bw = a4EquivalentBw - logBwSheets;

  // Variances dalam satuan Counter
  const varianceCounterTotal = diffTotal - logEquivalentCounterTotal;

  const handleCopyFromYesterday = () => {
    const sorted = [...counters].sort((a, b) => b.date.localeCompare(a.date));
    const previous = sorted.find((c) => c.date < selectedDate);
    if (previous) {
      setStartColor(previous.endColor);
      setStartBw(previous.endBw);
      setSaveSuccessMsg('Counter akhir kemarin (CLR & BW) berhasil disalin ke counter awal!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = counters.find((c) => c.date === selectedDate);
    const calculatedStartTotal = Number(startColor) + Number(startBw);
    const calculatedEndTotal = Number(endColor) + Number(endBw);

    const payload: DailyPrinterCounter = {
      id: existing ? existing.id : `cnt-${selectedDate.replace(/-/g, '')}`,
      date: selectedDate,
      startTotal: calculatedStartTotal,
      startColor: Number(startColor) || 0,
      startBw: Number(startBw) || 0,
      endTotal: calculatedEndTotal,
      endColor: Number(endColor) || 0,
      endBw: Number(endBw) || 0,
      notes: notes.trim(),
      updatedAt: Date.now(),
    };

    onSaveCounter(payload);
    setSaveSuccessMsg(`Counter harian untuk tanggal ${selectedDate} berhasil disimpan!`);
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 3500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300">
            <Gauge className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Counter Fisik Mesin Printer & Rekonsiliasi Harian
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-400 text-slate-950 shadow-sm">
                1 Counter = 2 A4
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Pencatatan meteran counter awal & akhir (Total, CLR, BW) serta konversi setara lembar A4 dan selisih lebih/kurang
            </p>
          </div>
        </div>

        {/* Date Selector & History Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-medium outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition border border-slate-700"
          >
            <History className="w-3.5 h-3.5" />
            <span>{showHistory ? 'Tutup Riwayat' : `Riwayat (${counters.length})`}</span>
          </button>
        </div>
      </div>

      {/* Main Counter Form */}
      <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Warning if end counter is smaller than start counter */}
        {endTotal > 0 && endTotal < startTotal && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Perhatian: Counter Total Akhir ({endTotal}) lebih kecil daripada Counter Awal ({startTotal}). Mohon periksa kembali inputan meteran mesin.
            </span>
          </div>
        )}

        {/* Grid Inputs: Counter Awal vs Counter Akhir */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Input 1: Counter Awal */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  1. Input Counter Awal (Pagi / Mulai)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCopyFromYesterday}
                title="Salin nilai Counter Akhir hari sebelumnya"
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Ambil dr Kemarin
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Counter CLR Awal */}
              <div>
                <label className="block text-xs font-semibold text-purple-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Counter CLR Awal
                  </span>
                  <span className="text-[10px] text-purple-600 font-bold bg-purple-100 px-1 py-0.2 rounded">
                    Warna
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={startColor || ''}
                  onChange={(e) => setStartColor(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-purple-300 rounded-xl bg-purple-50/50 focus:ring-2 focus:ring-purple-500 outline-none text-purple-900"
                />
                <span className="text-[10px] text-purple-500 mt-0.5 block">Meteran cetak warna</span>
              </div>

              {/* Counter BW Awal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                    Counter BW Awal
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold bg-slate-200 px-1 py-0.2 rounded">
                    Hitam Putih
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={startBw || ''}
                  onChange={(e) => setStartBw(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-slate-500 outline-none text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Meteran cetak B&W</span>
              </div>

              {/* Counter Total Awal (CLR + BW) */}
              <div>
                <label className="block text-xs font-semibold text-blue-900 mb-1 flex items-center justify-between">
                  <span>Counter Total Awal</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                    = CLR + BW
                  </span>
                </label>
                <input
                  type="number"
                  value={startTotal || 0}
                  readOnly
                  className="w-full px-3 py-2 text-sm font-mono font-black border border-blue-300 rounded-xl bg-blue-50/80 text-blue-950 outline-none cursor-default shadow-xs"
                />
                <span className="text-[10px] text-blue-700 mt-0.5 block font-semibold truncate">
                  {formatNumber(startColor)} + {formatNumber(startBw)} = {formatNumber(startTotal)} cnt
                </span>
              </div>
            </div>
          </div>

          {/* Card Input 2: Counter Akhir */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-200/70 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  2. Input Counter Akhir (Sore / Tutup)
                </h4>
              </div>
              <span className="text-[11px] text-indigo-700 font-medium">Meteran penutupan hari</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Counter CLR Akhir */}
              <div>
                <label className="block text-xs font-semibold text-purple-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Counter CLR Akhir
                  </span>
                  <span className="text-[10px] text-purple-600 font-bold bg-purple-100 px-1 py-0.2 rounded">
                    Warna
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={endColor || ''}
                  onChange={(e) => setEndColor(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-purple-300 rounded-xl bg-purple-50/60 focus:ring-2 focus:ring-purple-500 outline-none text-purple-900"
                />
                <span className="text-[10px] text-purple-500 mt-0.5 block">Meteran cetak warna</span>
              </div>

              {/* Counter BW Akhir */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                    Counter BW Akhir
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold bg-slate-200 px-1 py-0.2 rounded">
                    Hitam Putih
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={endBw || ''}
                  onChange={(e) => setEndBw(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-slate-500 outline-none text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Meteran cetak B&W</span>
              </div>

              {/* Counter Total Akhir (CLR + BW) */}
              <div>
                <label className="block text-xs font-semibold text-indigo-900 mb-1 flex items-center justify-between">
                  <span>Counter Total Akhir</span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">
                    = CLR + BW
                  </span>
                </label>
                <input
                  type="number"
                  value={endTotal || 0}
                  readOnly
                  className="w-full px-3 py-2 text-sm font-mono font-black border border-indigo-300 rounded-xl bg-indigo-50/80 text-indigo-950 outline-none cursor-default shadow-xs"
                />
                <span className="text-[10px] text-indigo-700 mt-0.5 block font-semibold truncate">
                  {formatNumber(endColor)} + {formatNumber(endBw)} = {formatNumber(endTotal)} cnt
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* HASIL PERHITUNGAN: SELISIH COUNTER, KONVERSI 1 COUNTER = 2 A4 & REKONSILIASI LOG */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  Hasil Kalkulasi Counter Harian ({selectedDate})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-400 text-slate-950 rounded">
                  Rumus: 1 Counter = 2 A4
                </span>
              </div>
              <h4 className="text-base font-bold text-white mt-0.5">
                Selisih Meteran Mesin & Rekonsiliasi Lebih / Kurang terhadap Log
              </h4>
            </div>

            {/* Status Rekonsiliasi Badge */}
            <div>
              {diffTotal === 0 ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Belum ada selisih counter
                </span>
              ) : varianceA4Total === 0 ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Klop 100% Sesuai dengan Catatan Log
                </span>
              ) : varianceA4Total > 0 ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Ada Selisih Lebih +{formatNumber(varianceA4Total)} Lembar A4 (+{varianceCounterTotal} Counter)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/40 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Ada Selisih Kurang {formatNumber(varianceA4Total)} Lembar A4 ({varianceCounterTotal} Counter)
                </span>
              )}
            </div>
          </div>

          {/* 3 Metric Comparison Columns: TOTAL, CLR (WARNA), BW (HITAM PUTIH) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: COUNTER TOTAL */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
              <div className="flex justify-between items-center text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  TOTAL COUNTER (CLR + BW)
                </span>
                <span className="font-mono text-indigo-300 text-[11px] font-bold bg-indigo-900/70 px-1.5 py-0.5 rounded border border-indigo-700/60">
                  {diffColor} CLR + {diffBw} BW
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-black text-white font-mono">
                    {formatNumber(diffTotal)} <span className="text-xs font-normal text-slate-400">counter</span>
                  </div>
                  {/* Konversi 1 counter = 2 A4 */}
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 mt-1">
                    <Layers className="w-3 h-3" />
                    <span>Setara {formatNumber(a4EquivalentTotal)} Lembar A4</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    ({endTotal} - {startTotal} = {diffTotal} counter)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Catatan Tabel Log:</span>
                  <span className="font-bold text-sm text-indigo-300">{formatNumber(logTotalSheets)} lbr A4</span>
                  <span className="text-[10px] text-slate-400 block">
                    (setara {logEquivalentCounterTotal} counter)
                  </span>
                </div>
              </div>

              {/* Variance explanation */}
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Selisih / Lebih:</span>
                <span
                  className={`font-mono font-bold ${
                    varianceA4Total === 0
                      ? 'text-emerald-400'
                      : varianceA4Total > 0
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {varianceA4Total === 0
                    ? '0 (Klop)'
                    : varianceA4Total > 0
                    ? `+${varianceA4Total} lbr A4 (+${varianceCounterTotal} cnt)`
                    : `${varianceA4Total} lbr A4 (${varianceCounterTotal} cnt)`}
                </span>
              </div>
            </div>

            {/* Box 2: COUNTER CLR (WARNA) */}
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40 space-y-2.5">
              <div className="flex justify-between items-center text-xs text-purple-200 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  WARNA (CLR)
                </span>
                <span className="font-mono text-purple-400">Akhir - Awal</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-black text-purple-300 font-mono">
                    {formatNumber(diffColor)} <span className="text-xs font-normal text-purple-400">counter</span>
                  </div>
                  {/* Konversi 1 counter = 2 A4 */}
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-purple-200 bg-purple-400/20 px-2 py-0.5 rounded border border-purple-400/30 mt-1">
                    <Layers className="w-3 h-3 text-purple-300" />
                    <span>Setara {formatNumber(a4EquivalentColor)} Lembar A4</span>
                  </div>
                  <span className="text-[11px] text-purple-400/80 block mt-1">
                    ({endColor} - {startColor} = {diffColor} counter)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-purple-300/70 block uppercase font-medium">Catatan Tabel Log:</span>
                  <span className="font-bold text-sm text-purple-200">{formatNumber(logColorSheets)} lbr A4</span>
                  <span className="text-[10px] text-purple-300/70 block">
                    (setara {logEquivalentCounterColor} counter)
                  </span>
                </div>
              </div>

              {/* Variance explanation */}
              <div className="pt-2 border-t border-purple-800/40 flex items-center justify-between text-xs">
                <span className="text-purple-300/70">Selisih / Lebih:</span>
                <span
                  className={`font-mono font-bold ${
                    varianceA4Color === 0
                      ? 'text-emerald-400'
                      : varianceA4Color > 0
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {varianceA4Color === 0
                    ? '0 (Klop)'
                    : varianceA4Color > 0
                    ? `+${varianceA4Color} lbr A4`
                    : `${varianceA4Color} lbr A4`}
                </span>
              </div>
            </div>

            {/* Box 3: COUNTER BW (HITAM PUTIH) */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
              <div className="flex justify-between items-center text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  HITAM PUTIH (BW)
                </span>
                <span className="font-mono text-slate-400">Akhir - Awal</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-black text-slate-200 font-mono">
                    {formatNumber(diffBw)} <span className="text-xs font-normal text-slate-400">counter</span>
                  </div>
                  {/* Konversi 1 counter = 2 A4 */}
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-200 bg-slate-700/80 px-2 py-0.5 rounded border border-slate-600 mt-1">
                    <Layers className="w-3 h-3 text-slate-300" />
                    <span>Setara {formatNumber(a4EquivalentBw)} Lembar A4</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    ({endBw} - {startBw} = {diffBw} counter)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Catatan Tabel Log:</span>
                  <span className="font-bold text-sm text-slate-200">{formatNumber(logBwSheets)} lbr A4</span>
                  <span className="text-[10px] text-slate-400 block">
                    (setara {logEquivalentCounterBw} counter)
                  </span>
                </div>
              </div>

              {/* Variance explanation */}
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Selisih / Lebih:</span>
                <span
                  className={`font-mono font-bold ${
                    varianceA4Bw === 0
                      ? 'text-emerald-400'
                      : varianceA4Bw > 0
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {varianceA4Bw === 0
                    ? '0 (Klop)'
                    : varianceA4Bw > 0
                    ? `+${varianceA4Bw} lbr A4`
                    : `${varianceA4Bw} lbr A4`}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Advice Note & Paper Jam Rule */}
          <div className="text-[11px] text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col sm:flex-row items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">Pedoman Perhitungan Unggul Digital Printing:</strong>{' '}
                Setiap <strong>1 Counter mesin printer = 2 Lembar A4</strong> (karena 1 kali perputaran meteran mesin mencetak 2 sisi A4 atau setara ukuran A3/A3+).
                Kalkulasi rekonsiliasi membandingkan <em>(Selisih Counter &times; 2)</em> terhadap total lembar A4 tercatat di tabel log.
                <div className="mt-1 text-amber-300/90 font-medium">
                  * <strong>Ketentuan Paper Jam:</strong> Status <u>Paper Jam tidak ikut catatan counter mesin</u> (lembar yang mengalami macet/rusak tidak masuk hitungan meteran mesin).
                </div>
              </div>
            </div>
            {paperJamLogsCount > 0 && (
              <div className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                ⚠️ {paperJamSheets} lbr Paper Jam ({paperJamLogsCount} transaksi) dikecualikan
              </div>
            )}
          </div>
        </div>

        {/* Catatan / Keterangan & Tombol Simpan */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="w-full sm:w-2/3">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan counter harian (opsional, cth: tes kalibrasi 2 A4 / 1 counter)..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Counter ({selectedDate})</span>
            </button>
          </div>
        </div>
      </form>

      {/* Riwayat Counter Harian (History List Accordion) */}
      {showHistory && (
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/70 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600" />
              Riwayat Pencatatan Counter Harian ({counters.length} Data) — Aturan: 1 Counter = 2 A4
            </h4>
            <span className="text-[11px] text-slate-500">Klik tanggal untuk memuat data</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3 text-right">Awal Total</th>
                  <th className="py-2.5 px-3 text-right">Akhir Total</th>
                  <th className="py-2.5 px-3 text-right font-bold text-blue-900">Δ Total Counter</th>
                  <th className="py-2.5 px-3 text-right font-bold text-amber-900 bg-amber-50">Setara Lembar A4 (×2)</th>
                  <th className="py-2.5 px-3 text-right text-purple-900">Δ CLR</th>
                  <th className="py-2.5 px-3 text-right text-slate-900">Δ BW</th>
                  <th className="py-2.5 px-3">Catatan</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {counters.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400">
                      Belum ada riwayat counter tersimpan.
                    </td>
                  </tr>
                ) : (
                  counters
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((item) => {
                      const totalDiff = Math.max(0, item.endTotal - item.startTotal);
                      const a4Total = totalDiff * 2;
                      const clrDiff = Math.max(0, item.endColor - item.startColor);
                      const bwDiff = Math.max(0, item.endBw - item.startBw);
                      const isSelected = item.date === selectedDate;
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-blue-50/50 transition cursor-pointer ${
                            isSelected ? 'bg-blue-50/80 font-medium' : ''
                          }`}
                          onClick={() => setSelectedDate(item.date)}
                        >
                          <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{item.date}</span>
                            {isSelected && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-600 text-white">
                                Aktif
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">{formatNumber(item.startTotal)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{formatNumber(item.endTotal)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                            {formatNumber(totalDiff)} cnt
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700 bg-amber-50/50">
                            {formatNumber(a4Total)} A4
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-purple-700">
                            {formatNumber(clrDiff)} cnt
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                            {formatNumber(bwDiff)} cnt
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 truncate max-w-[180px]">{item.notes || '-'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Hapus counter tanggal ${item.date}?`)) {
                                  onDeleteCounter(item.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Hapus riwayat counter ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
