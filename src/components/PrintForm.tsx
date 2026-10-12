import React, { useState, useEffect } from 'react';
import {
  PrintLog,
  PrintSide,
  PrintType,
  PrintStatus,
  OfficeConfig,
  OPERATOR_OPTIONS,
} from '../types';
import { QUICK_PRESETS, QuickPreset } from '../data/initialData';
import { calculateSheets, generateReceiptNo } from '../utils/helpers';
import {
  PlusCircle,
  FileText,
  Calendar,
  Clock,
  User,
  Sparkles,
  RefreshCw,
  Layers,
  AlertCircle,
  CheckCircle,
  Check,
  X,
  FileCheck,
} from 'lucide-react';

interface PrintFormProps {
  officeConfig: OfficeConfig;
  existingLogs: PrintLog[];
  editingLog: PrintLog | null;
  onSave: (log: PrintLog) => void;
  onCancelEdit: () => void;
}

export const PrintForm: React.FC<PrintFormProps> = ({
  officeConfig,
  existingLogs,
  editingLog,
  onSave,
  onCancelEdit,
}) => {
  const getTodayDate = () => new Date().toISOString().slice(0, 10);
  const getCurrentTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Form states
  const [receiptNo, setReceiptNo] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDate());
  const [time, setTime] = useState<string>(getCurrentTime());
  const [userName, setUserName] = useState<string>('ANDHI');
  const [paperType, setPaperType] = useState<string>(officeConfig.paperTypeList[0] || 'A4 (70-80 gsm)');
  const [printSide, setPrintSide] = useState<PrintSide>('1 Sisi (Simplex)');
  const [printType, setPrintType] = useState<PrintType>('Hitam Putih');
  const [pages, setPages] = useState<number>(1);
  const [status, setStatus] = useState<PrintStatus>('Selesai');
  const [errorBy, setErrorBy] = useState<string>('');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Validation & alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Initialize or handle editing mode
  useEffect(() => {
    if (editingLog) {
      setReceiptNo(editingLog.receiptNo);
      setDate(editingLog.date);
      setTime(editingLog.time);
      // Clean up operator name if it contains initials
      let cleanUser = editingLog.userName || '';
      if (cleanUser.includes(':')) {
        cleanUser = cleanUser.split(':')[1].trim();
      }
      setUserName(cleanUser);
      setPaperType(editingLog.paperType);
      setPrintSide(editingLog.printSide);
      setPrintType(editingLog.printType);
      setPages(editingLog.pages);
      // Migrate legacy status if editing an old record
      let currentStatus: PrintStatus = editingLog.status;
      if ((currentStatus as string) === 'Menunggu') currentStatus = 'Pending';
      if ((currentStatus as string) === 'Gagal / Rusak' || (currentStatus as string) === 'Gagal') currentStatus = 'Paper Jam';
      if ((currentStatus as string) === 'Dibatalkan') currentStatus = 'Salah Print';
      setStatus(currentStatus);
      let cleanErr = editingLog.errorBy || '';
      if (cleanErr.includes(':')) {
        cleanErr = cleanErr.split(':')[1].trim();
      }
      setErrorBy(cleanErr);
      setActivePresetId(null);
    } else {
      // Auto-generate next receipt number
      setReceiptNo(generateReceiptNo(existingLogs));
      setErrorBy('');
    }
  }, [editingLog, existingLogs]);

  // Real-time calculation
  const sheets = calculateSheets(pages, printSide);

  const handleAutoGenerateReceiptNo = () => {
    setReceiptNo(generateReceiptNo(existingLogs));
  };

  const handleApplyPreset = (preset: QuickPreset) => {
    setActivePresetId(preset.id);
    if (preset.data.paperType) setPaperType(preset.data.paperType);
    if (preset.data.printSide) setPrintSide(preset.data.printSide);
    if (preset.data.printType) setPrintType(preset.data.printType);
    if (preset.data.pages) setPages(preset.data.pages);
    if (!userName) setUserName('ANDHI');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!receiptNo.trim()) {
      setErrorMsg('Nomor Nota wajib diisi atau klik tombol Auto.');
      return;
    }
    if (!userName.trim()) {
      setErrorMsg('Operator wajib dipilih atau diisi.');
      return;
    }
    if (pages <= 0) {
      setErrorMsg('Jumlah halaman harus lebih dari 0.');
      return;
    }

    const payload: PrintLog = {
      id: editingLog ? editingLog.id : `prn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      receiptNo: receiptNo.trim(),
      date,
      time,
      userName: userName.trim(),
      paperType,
      printSide,
      printType,
      pages: Number(pages),
      sheets,
      status,
      errorBy: status === 'Salah Print' ? (errorBy.trim() || undefined) : undefined,
      createdAt: editingLog ? editingLog.createdAt : Date.now(),
    };

    onSave(payload);
    setSuccessToast(editingLog ? 'Log berhasil diperbarui!' : 'Log cetak berhasil ditambahkan!');

    setTimeout(() => {
      setSuccessToast(null);
    }, 3000);

    // If was creating new, reset non-sticky fields
    if (!editingLog) {
      setPages(1);
      setActivePresetId(null);
      setErrorBy('');
      setReceiptNo(generateReceiptNo([...existingLogs, payload]));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition">
      {/* Header Form */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
            {editingLog ? <FileCheck className="w-5 h-5 text-amber-400" /> : <PlusCircle className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              {editingLog ? 'Edit Data Log Aktivitas Cetak' : 'Input Data Log Aktivitas Printing'}
              {editingLog && (
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                  Sedang Mengedit
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Input data log aktivitas cetak: tanggal, nomor nota, operator (ANDHI, ALDY, EKO, JAMAL), kertas, sisi, jenis cetak, halaman & status
            </p>
          </div>
        </div>

        {editingLog && (
          <button
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Batal Edit
          </button>
        )}
      </div>

      {/* Quick Fill Presets (Contoh Cara Pengisian Cepat) */}
      {!editingLog && (
        <div className="bg-blue-50/60 border-b border-blue-100 p-3 sm:px-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Contoh Pengisian Cepat:
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {QUICK_PRESETS.map((p) => {
              const isSelected = activePresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white hover:bg-blue-50/80 border-blue-200 text-slate-700 hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className={`mt-1 flex items-center justify-between text-[11px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    <span>{p.badge}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Baris 1: Nomor Nota, Tanggal & Jam, Nama Pengguna */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Nomor Nota <span className="text-rose-500">*</span>
              </span>
              <button
                type="button"
                onClick={handleAutoGenerateReceiptNo}
                title="Generate Otomatis No Nota"
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Auto
              </button>
            </label>
            <input
              type="text"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
              placeholder="Contoh: NOTA-PRN-202610-001"
              required
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Tanggal Cetak <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Waktu / Jam
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Operator <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Pilih Operator</span>
            </label>

            {/* Tombol Nama Operator Cepat: ANDHI, ALDY, EKO, JAMAL */}
            <div className="grid grid-cols-4 gap-1.5 mb-1.5">
              {OPERATOR_OPTIONS.map((op) => {
                const isSelected =
                  userName === op.name ||
                  userName.toLowerCase() === op.name.toLowerCase() ||
                  userName === op.code;
                return (
                  <button
                    key={op.code}
                    type="button"
                    onClick={() => setUserName(op.name)}
                    title={op.name}
                    className={`py-1.5 px-1 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-600'
                        : 'bg-slate-100 hover:bg-blue-50 text-slate-700 border border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {op.name}
                  </button>
                );
              })}
            </div>

            {/* Dropdown Operator (ANDHI, ALDY, EKO, JAMAL) */}
            <select
              value={
                OPERATOR_OPTIONS.some((o) => o.name === userName)
                  ? userName
                  : OPERATOR_OPTIONS.some((o) => userName.includes(o.name))
                  ? OPERATOR_OPTIONS.find((o) => userName.includes(o.name))?.name
                  : userName
              }
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-slate-800"
            >
              {OPERATOR_OPTIONS.map((op) => (
                <option key={op.code} value={op.name}>
                  {op.name}
                </option>
              ))}
              {!OPERATOR_OPTIONS.some((o) => o.name === userName) && userName && (
                <option value={userName}>{userName}</option>
              )}
            </select>
          </div>
        </div>

        {/* Baris 2: Parameter Kertas & Cetak (Jenis Kertas, 1 Sisi/2 Sisi, Jenis Cetak Warna/BW) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
          {/* Jenis Kertas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Jenis Kertas
            </label>
            <select
              value={paperType}
              onChange={(e) => setPaperType(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            >
              {officeConfig.paperTypeList.map((paper) => (
                <option key={paper} value={paper}>
                  {paper}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Pilihan: A4, F4 / Folio, A3, Letter, dll.</p>
          </div>

          {/* Cetak 1 Sisi / 2 Sisi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Cetak 1 Sisi / 2 Sisi</span>
              {printSide === '2 Sisi (Duplex)' && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Hemat 50% Kertas
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrintSide('1 Sisi (Simplex)')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  printSide === '1 Sisi (Simplex)'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>1 Sisi (Simplex)</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintSide('2 Sisi (Duplex)')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  printSide === '2 Sisi (Duplex)'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>2 Sisi (Duplex)</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {printSide === '2 Sisi (Duplex)'
                ? 'Kertas bolak-balik (hemat lembar fisik)'
                : 'Cetak satu muka'}
            </p>
          </div>

          {/* Jenis Cetak (Warna vs Hitam Putih) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jenis Cetak
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrintType('Hitam Putih')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  printType === 'Hitam Putih'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span>Hitam Putih</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintType('Warna')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  printType === 'Warna'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-400" />
                <span>Warna (Color)</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Pilih Hitam Putih atau Warna</p>
          </div>
        </div>

        {/* Baris 3: Halaman, Status & Kalkulasi Lembar Fisik */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jumlah Halaman Dokumen <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={pages}
              onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
              Status Cetak <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value as PrintStatus;
                setStatus(newStatus);
                if (newStatus === 'Salah Print' && !errorBy) {
                  // Default errorBy with current operator for quick convenience
                  setErrorBy(userName || 'AN : ANDHI');
                }
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            >
              <option value="Selesai">✅ Selesai</option>
              <option value="Pending">⏳ Pending</option>
              <option value="Paper Jam">⚠️ Paper Jam (Tidak Masuk Counter)</option>
              <option value="Salah Print">❌ Salah Print</option>
            </select>
          </div>

          {/* Real-time Lembar Fisik Box */}
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-[11px] font-semibold text-blue-900 uppercase block tracking-wider">
              Total Lembar Fisik Kertas:
            </span>
            <div className="text-lg font-bold text-blue-900 mt-0.5">
              {sheets} <span className="text-xs font-normal text-blue-700">lembar kertas</span>
            </div>
            <span className="text-[10px] text-blue-600 block">
              {printSide === '2 Sisi (Duplex)' ? `(${pages} halaman bolak-balik)` : `(${pages} halaman 1 sisi)`}
            </span>
          </div>
        </div>

        {/* Opsi Nama Orang yang Melakukan Kesalahan (Khusus Status Salah Print) */}
        {status === 'Salah Print' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3 transition">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                Nama Orang yang Melakukan Kesalahan:
              </label>
              <span className="text-[11px] text-rose-700 font-semibold bg-rose-100/90 px-2 py-0.5 rounded border border-rose-200">
                Pilih Operator atau Ketik Bebas
              </span>
            </div>

            {/* Quick buttons to select operator who made the mistake */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-rose-800 font-medium mr-1">Pilihan Cepat:</span>
              {OPERATOR_OPTIONS.map((op) => (
                <button
                  key={op.code}
                  type="button"
                  onClick={() => setErrorBy(op.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    errorBy === op.name || errorBy.toLowerCase() === op.name.toLowerCase()
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white hover:bg-rose-100 border-rose-300 text-rose-900'
                  }`}
                >
                  {op.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 items-center">
              <div>
                <input
                  type="text"
                  value={errorBy}
                  onChange={(e) => setErrorBy(e.target.value)}
                  placeholder="Ketik nama yang melakukan kesalahan..."
                  className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border border-rose-300 rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-rose-950 placeholder:text-rose-300"
                />
              </div>
              <p className="text-[11px] text-rose-700 leading-snug">
                Nama ini akan dicatat dalam database laporan sebagai penanggung jawab kekeliruan cetak.
              </p>
            </div>
          </div>
        )}

        {/* Info Notifikasi Paper Jam (Tidak ikut catatan counter) */}
        {status === 'Paper Jam' && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Pemberitahuan Paper Jam:</strong> Status Paper Jam <u>tidak dihitung</u> ke dalam catatan counter fisik mesin printer.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-slate-700">Rumus Lembar Fisik:</span>
            <span>
              {printSide === '2 Sisi (Duplex)'
                ? `= ROUNDUP(${pages} / 2; 0) = ${sheets} lembar`
                : `= ${pages} lembar`}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {editingLog && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="w-1/2 sm:w-auto px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
            )}

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold transition shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              {editingLog ? <FileCheck className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              <span>{editingLog ? 'Simpan Perubahan Log' : 'Tambahkan ke Tabel Log'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
