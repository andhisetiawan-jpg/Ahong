import React, { useState, useEffect } from 'react';
import {
  PrintLog,
  PrintSide,
  PrintType,
  PrintStatus,
  OfficeConfig,
  OPERATOR_OPTIONS,
} from '../types';
import { calculateSheets } from '../utils/helpers';
import {
  X,
  Edit3,
  Calendar,
  Clock,
  User,
  Layers,
  Sparkles,
  FileText,
  AlertTriangle,
  XCircle,
  Clock3,
  CheckCircle2,
  Check,
  Save,
} from 'lucide-react';

interface EditLogModalProps {
  isOpen: boolean;
  log: PrintLog | null;
  officeConfig?: OfficeConfig;
  onSave: (updatedLog: PrintLog) => void;
  onClose: () => void;
}

export const EditLogModal: React.FC<EditLogModalProps> = ({
  isOpen,
  log,
  officeConfig,
  onSave,
  onClose,
}) => {
  if (!isOpen || !log) return null;

  // Form states initialized from current log
  const [receiptNo, setReceiptNo] = useState<string>(log.receiptNo || '');
  const [date, setDate] = useState<string>(log.date || '');
  const [time, setTime] = useState<string>(log.time || '');

  // Helper to get clean operator name without initials (ANDHI, ALDY, EKO, JAMAL)
  const cleanOperatorName = (raw: string) => {
    if (!raw) return 'ANDHI';
    let val = raw;
    if (val.includes(':')) {
      val = val.split(':')[1].trim();
    }
    const match = OPERATOR_OPTIONS.find(
      (o) =>
        o.name.toLowerCase() === val.toLowerCase() ||
        o.code.toLowerCase() === val.toLowerCase()
    );
    if (match) return match.name;
    return val;
  };

  const [userName, setUserName] = useState<string>(() => cleanOperatorName(log.userName));
  const [paperType, setPaperType] = useState<string>(log.paperType || 'A4 (70-80 gsm)');
  const [printSide, setPrintSide] = useState<PrintSide>(log.printSide || '1 Sisi (Simplex)');
  const [printType, setPrintType] = useState<PrintType>(log.printType || 'Hitam Putih');
  const [pages, setPages] = useState<number>(log.pages || 1);
  const [sheets, setSheets] = useState<number>(log.sheets || 1);

  // Status with legacy migration
  const getCleanStatus = (raw: PrintStatus | string): PrintStatus => {
    if (raw === 'Menunggu') return 'Pending';
    if (raw === 'Gagal / Rusak' || raw === 'Gagal') return 'Paper Jam';
    if (raw === 'Dibatalkan') return 'Salah Print';
    return (raw as PrintStatus) || 'Selesai';
  };

  const [status, setStatus] = useState<PrintStatus>(() => getCleanStatus(log.status));
  const [errorBy, setErrorBy] = useState<string>(() => cleanOperatorName(log.errorBy || ''));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset values when log prop changes
  useEffect(() => {
    if (log) {
      setReceiptNo(log.receiptNo || '');
      setDate(log.date || '');
      setTime(log.time || '');
      setUserName(cleanOperatorName(log.userName));
      setPaperType(log.paperType || 'A4 (70-80 gsm)');
      setPrintSide(log.printSide || '1 Sisi (Simplex)');
      setPrintType(log.printType || 'Hitam Putih');
      setPages(log.pages || 1);
      setSheets(log.sheets || 1);
      setStatus(getCleanStatus(log.status));
      setErrorBy(log.errorBy ? cleanOperatorName(log.errorBy) : '');
      setErrorMsg(null);
    }
  }, [log]);

  // Recalculate sheets when pages or printSide change
  const handlePagesChange = (newPages: number) => {
    const p = Math.max(1, newPages);
    setPages(p);
    setSheets(calculateSheets(p, printSide));
  };

  const handlePrintSideChange = (newSide: PrintSide) => {
    setPrintSide(newSide);
    setSheets(calculateSheets(pages, newSide));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!receiptNo.trim()) {
      setErrorMsg('Nomor Nota wajib diisi.');
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
    if (sheets <= 0) {
      setErrorMsg('Jumlah lembar fisik harus lebih dari 0.');
      return;
    }

    const updatedLog: PrintLog = {
      ...log,
      receiptNo: receiptNo.trim(),
      date,
      time,
      userName: userName.trim(),
      paperType,
      printSide,
      printType,
      pages: Number(pages),
      sheets: Number(sheets),
      status,
      errorBy: status === 'Salah Print' ? (errorBy.trim() || undefined) : undefined,
    };

    onSave(updatedLog);
    onClose();
  };

  // Available paper types
  const paperOptions = officeConfig?.paperTypeList?.length
    ? officeConfig.paperTypeList
    : [
        'A4 (70-80 gsm)',
        'F4 / Folio (70-80 gsm)',
        'A3 (80 gsm)',
        'Letter / Kuarto',
        'Glossy Photo Paper',
        'Kertas Sertifikat / Concorde',
        'Lainnya',
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Perbarui Log Baris Ini</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white border border-slate-200 text-blue-700 font-semibold">
                  {log.receiptNo}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Ubah informasi data aktivitas pencetakan pada baris tabel ini
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Baris 1: Nomor Nota, Tanggal & Jam */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Nomor Nota <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                placeholder="Contoh: NOTA-PRN-202610-001"
                required
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-slate-50/50"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Baris 2: Operator (Format tanpa inisial: ANDHI, ALDY, EKO, JAMAL) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Operator <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Pilih atau ketik nama operator:
              </span>
            </div>

            {/* Quick buttons: ANDHI, ALDY, EKO, JAMAL */}
            <div className="grid grid-cols-4 gap-1.5">
              {OPERATOR_OPTIONS.map((op) => {
                const isSelected =
                  userName.toUpperCase() === op.name.toUpperCase();
                return (
                  <button
                    key={op.code}
                    type="button"
                    onClick={() => setUserName(op.name)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {op.name}
                  </button>
                );
              })}
            </div>

            {/* Custom/Selected Operator input */}
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Nama Operator (Contoh: ANDHI, ALDY, EKO, JAMAL)"
              required
              className="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            />
          </div>

          {/* Baris 3: Jenis Kertas, Sisi, dan Jenis Cetak */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Jenis Kertas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Jenis Kertas
              </label>
              <select
                value={paperType}
                onChange={(e) => setPaperType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
              >
                {paperOptions.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
                {!paperOptions.includes(paperType) && (
                  <option value={paperType}>{paperType}</option>
                )}
              </select>
            </div>

            {/* Sisi Cetak */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sisi Cetak
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['1 Sisi (Simplex)', '2 Sisi (Duplex)'] as PrintSide[]).map((side) => {
                  const isSel = printSide === side;
                  return (
                    <button
                      key={side}
                      type="button"
                      onClick={() => handlePrintSideChange(side)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold transition text-center cursor-pointer border ${
                        isSel
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white hover:bg-indigo-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {side === '1 Sisi (Simplex)' ? '1 Sisi' : '2 Sisi'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Jenis Cetak */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Cetak
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Hitam Putih', 'Warna'] as PrintType[]).map((type) => {
                  const isSel = printType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPrintType(type)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold transition text-center cursor-pointer border ${
                        isSel
                          ? type === 'Warna'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Baris 4: Jumlah Halaman & Lembar Fisik */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Halaman Dokumen
              </label>
              <input
                type="number"
                min={1}
                value={pages}
                onChange={(e) => handlePagesChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Total halaman isi dokumen
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lembar Fisik Kertas
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={sheets}
                  onChange={(e) => setSheets(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                />
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                  Lembar
                </span>
              </div>
              <span className="text-[10px] text-blue-700 font-medium mt-1 block">
                {printSide === '2 Sisi (Duplex)'
                  ? `Duplex: ${pages} hal = ${sheets} lembar fisik`
                  : `Simplex: ${pages} hal = ${sheets} lembar fisik`}
              </span>
            </div>
          </div>

          {/* Baris 5: Status Cetak (Selesai, Pending, Paper Jam, Salah Print) */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
              Status Cetak <span className="text-rose-500">*</span>
            </label>

            {/* Status Select Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Selesai')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  status === 'Selesai'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Selesai</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Pending')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  status === 'Pending'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                }`}
              >
                <Clock3 className="w-3.5 h-3.5" />
                <span>Pending</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Paper Jam')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  status === 'Paper Jam'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Paper Jam</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Salah Print')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  status === 'Salah Print'
                    ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                    : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Salah Print</span>
              </button>
            </div>

            {/* Catatan Khusus Paper Jam: Tidak Ikut Counter Mesin */}
            {status === 'Paper Jam' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Ketentuan Paper Jam:</div>
                  <div className="text-[11px] text-amber-800">
                    Status Paper Jam <strong>tidak ikut dihitung ke catatan counter mesin</strong> karena lembar macet tidak tercetak tuntas ke meteran mesin.
                  </div>
                </div>
              </div>
            )}

            {/* Opsi Nama Orang Yang Melakukan Kesalahan (Jika Salah Print) */}
            {status === 'Salah Print' && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-rose-600" />
                    Nama Yang Melakukan Kesalahan (Penanggung Jawab Salah Print)
                  </label>
                  <span className="text-[10px] text-rose-600 font-semibold">Wajib Dipilih/Diisi</span>
                </div>

                {/* Quick Select Buttons: ANDHI, ALDY, EKO, JAMAL */}
                <div className="grid grid-cols-4 gap-1.5">
                  {OPERATOR_OPTIONS.map((op) => {
                    const isSelected =
                      errorBy.toUpperCase() === op.name.toUpperCase();
                    return (
                      <button
                        key={op.code}
                        type="button"
                        onClick={() => setErrorBy(op.name)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition text-center cursor-pointer border ${
                          isSelected
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white hover:bg-rose-100 text-rose-900 border-rose-200'
                        }`}
                      >
                        {op.name}
                      </button>
                    );
                  })}
                </div>

                {/* Input Text Error By */}
                <input
                  type="text"
                  value={errorBy}
                  onChange={(e) => setErrorBy(e.target.value)}
                  placeholder="Ketik atau pilih nama yang salah print (Contoh: ANDHI, ALDY, EKO, JAMAL)"
                  className="w-full px-3 py-1.5 text-xs font-bold border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition bg-white text-rose-950 placeholder-rose-300"
                />
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pembaruan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
