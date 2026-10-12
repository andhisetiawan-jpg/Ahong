import React from 'react';
import { PrintLog, OfficeConfig } from '../types';
import { formatNumber } from '../utils/helpers';
import { Printer, X, FileText } from 'lucide-react';

interface ReceiptModalProps {
  log: PrintLog | null;
  officeConfig: OfficeConfig;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ log, officeConfig, onClose }) => {
  if (!log) return null;

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Slip Bukti Aktivitas Cetak</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReceipt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 sm:p-8 space-y-6 printable-receipt text-slate-900">
          {/* Header Kantor */}
          <div className="text-center border-b border-slate-200 pb-4">
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              {officeConfig.officeName}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              SLIP LOG AKTIVITAS PRINTING
            </p>
            <div className="mt-3 inline-block font-mono text-xs font-bold px-3 py-1 bg-slate-100 rounded-lg text-slate-800 border border-slate-300">
              {log.receiptNo}
            </div>
          </div>

          {/* Info Waktu & Pemohon */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tanggal & Jam:</span>
              <span className="font-semibold text-slate-800">{log.date} • {log.time}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Operator:</span>
              <span className="font-semibold text-slate-800">
                {log.userName.includes(':') ? log.userName.split(':')[1].trim() : log.userName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Jenis Kertas:</span>
              <span className="font-semibold text-slate-800">{log.paperType}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status Cetak:</span>
              <span
                className={`font-bold ${
                  log.status === 'Salah Print'
                    ? 'text-rose-700'
                    : log.status === 'Paper Jam'
                    ? 'text-amber-700'
                    : log.status === 'Pending'
                    ? 'text-blue-700'
                    : 'text-emerald-700'
                }`}
              >
                {log.status}
              </span>
              {log.status === 'Salah Print' && log.errorBy && (
                <span className="text-[11px] text-rose-600 block font-medium mt-0.5">
                  (Salah: {log.errorBy})
                </span>
              )}
            </div>
          </div>

          {/* Rincian Cetak Dokumen */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-800 border-b border-slate-100 pb-1">
              Spesifikasi Cetak:
            </div>
            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Cetak Sisi:</span>
                <span className="font-semibold text-slate-800">{log.printSide}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jenis Cetak:</span>
                <span className="font-semibold text-slate-900">{log.printType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Halaman:</span>
                <span className="font-semibold text-slate-900">{log.pages} halaman</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 bg-blue-50/80 p-3 rounded-xl border border-blue-100">
                <span className="text-blue-900">Total Lembar Fisik Kertas:</span>
                <span className="text-blue-700 text-sm">{formatNumber(log.sheets)} Lembar</span>
              </div>
            </div>
          </div>

          {/* Tanda Tangan */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-600">
            <div>
              <p className="text-[11px] text-slate-400">Pengguna / Pemohon,</p>
              <div className="h-14"></div>
              <p className="font-semibold text-slate-800">({log.userName})</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Petugas / Operator,</p>
              <div className="h-14"></div>
              <p className="font-semibold text-slate-800">(.............................)</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
