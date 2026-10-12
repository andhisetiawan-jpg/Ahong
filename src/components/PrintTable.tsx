import React, { useState, useMemo } from 'react';
import { PrintLog, PrintStatus, OfficeConfig, OPERATOR_OPTIONS } from '../types';
import { formatNumber } from '../utils/helpers';
import { EditLogModal } from './EditLogModal';
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Receipt,
  Copy,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface PrintTableProps {
  logs: PrintLog[];
  officeConfig?: OfficeConfig;
  onEdit: (log: PrintLog) => void;
  onSaveLog?: (log: PrintLog) => void;
  onDelete: (id: string) => void;
  onDuplicate: (log: PrintLog) => void;
  onViewReceipt: (log: PrintLog) => void;
  onResetToSampleData: () => void;
}

export const PrintTable: React.FC<PrintTableProps> = ({
  logs,
  officeConfig,
  onEdit,
  onSaveLog,
  onDelete,
  onDuplicate,
  onViewReceipt,
  onResetToSampleData,
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sideFilter, setSideFilter] = useState<string>('ALL');
  const [paperFilter, setPaperFilter] = useState<string>('ALL');
  const [operatorFilter, setOperatorFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'date' | 'sheets'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State dialog konfirmasi hapus data
  const [logToDelete, setLogToDelete] = useState<PrintLog | null>(null);

  // State dialog perbarui log baris ini
  const [logToEditInModal, setLogToEditInModal] = useState<PrintLog | null>(null);

  // Helper to format operator as simple name: 'ANDHI', 'ALDY', 'EKO', 'JAMAL'
  const getOperatorName = (rawName: string) => {
    if (!rawName) return '';
    let cleaned = rawName;
    if (cleaned.includes(':')) {
      cleaned = cleaned.split(':')[1].trim();
    }
    const match = OPERATOR_OPTIONS.find(
      (o) =>
        o.name.toLowerCase() === cleaned.toLowerCase() ||
        o.code.toLowerCase() === cleaned.toLowerCase() ||
        o.label.toLowerCase() === cleaned.toLowerCase()
    );
    if (match) return match.name;
    return cleaned;
  };

  // Unique lists for dropdowns
  const uniquePaperTypes = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.paperType)));
  }, [logs]);

  const uniqueOperators = useMemo(() => {
    // Show standard operators plus any custom operator in logs
    const standardNames = OPERATOR_OPTIONS.map((o) => o.name);
    const existing = logs.map((l) => getOperatorName(l.userName));
    return Array.from(new Set([...standardNames, ...existing])).filter(Boolean);
  }, [logs]);

  // Filtered & Sorted Logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        // Search by receiptNo or operator or errorBy
        const search = searchTerm.toLowerCase();
        const opName = getOperatorName(log.userName).toLowerCase();
        const errorPerson = getOperatorName(log.errorBy || '').toLowerCase();
        const matchesSearch =
          !searchTerm ||
          log.receiptNo.toLowerCase().includes(search) ||
          log.userName.toLowerCase().includes(search) ||
          opName.includes(search) ||
          errorPerson.includes(search);

        // Filters
        const matchesStatus =
          statusFilter === 'ALL' ||
          log.status === statusFilter ||
          (statusFilter === 'Pending' && (log.status as string) === 'Menunggu') ||
          (statusFilter === 'Paper Jam' && ((log.status as string) === 'Gagal / Rusak' || (log.status as string) === 'Gagal')) ||
          (statusFilter === 'Salah Print' && (log.status as string) === 'Dibatalkan');

        const matchesType = typeFilter === 'ALL' || log.printType === typeFilter;
        const matchesSide = sideFilter === 'ALL' || log.printSide === sideFilter;
        const matchesPaper = paperFilter === 'ALL' || log.paperType === paperFilter;
        const currentOpName = getOperatorName(log.userName);
        const matchesOperator =
          operatorFilter === 'ALL' ||
          log.userName === operatorFilter ||
          currentOpName === operatorFilter;

        return matchesSearch && matchesStatus && matchesType && matchesSide && matchesPaper && matchesOperator;
      })
      .sort((a, b) => {
        let valA: number = 0;
        let valB: number = 0;

        if (sortField === 'date') {
          valA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
          valB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
        } else if (sortField === 'sheets') {
          valA = a.sheets;
          valB = b.sheets;
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [logs, searchTerm, statusFilter, typeFilter, sideFilter, paperFilter, sortField, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const toggleSort = (field: 'date' | 'sheets') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setSideFilter('ALL');
    setPaperFilter('ALL');
    setOperatorFilter('ALL');
    setCurrentPage(1);
  };

  const renderStatusBadge = (status: PrintStatus, errorBy?: string) => {
    switch (status) {
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Selesai
          </span>
        );
      case 'Pending':
      case 'Menunggu' as any:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            Pending
          </span>
        );
      case 'Paper Jam':
      case 'Gagal / Rusak' as any:
      case 'Gagal' as any:
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300"
            title="Kertas macet di printer (tidak masuk catatan counter mesin)"
          >
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Paper Jam
          </span>
        );
      case 'Salah Print':
      case 'Dibatalkan' as any:
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
              <XCircle className="w-3 h-3 text-rose-600" />
              Salah Print
            </span>
            {errorBy && (
              <span
                className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 truncate max-w-[130px]"
                title={`Orang yang melakukan kesalahan: ${getOperatorName(errorBy)}`}
              >
                Salah: {getOperatorName(errorBy)}
              </span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
      {/* Search and Filters Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari operator (AN, AL, SO, JML) atau nomor nota..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /> Urutkan:
            </span>
            <button
              onClick={() => toggleSort('date')}
              className={`px-2.5 py-1.5 rounded-lg border font-medium cursor-pointer transition ${
                sortField === 'date'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Waktu {sortField === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
            </button>
            <button
              onClick={() => toggleSort('sheets')}
              className={`px-2.5 py-1.5 rounded-lg border font-medium cursor-pointer transition ${
                sortField === 'sheets'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Lembar {sortField === 'sheets' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
            </button>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-semibold mr-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>Filter:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="Selesai">Selesai</option>
            <option value="Pending">Pending</option>
            <option value="Paper Jam">Paper Jam</option>
            <option value="Salah Print">Salah Print</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Semua Jenis Cetak</option>
            <option value="Hitam Putih">Hitam Putih (B&W)</option>
            <option value="Warna">Warna (Color)</option>
          </select>

          {/* Side Filter */}
          <select
            value={sideFilter}
            onChange={(e) => {
              setSideFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Semua Sisi Cetak</option>
            <option value="1 Sisi (Simplex)">1 Sisi (Simplex)</option>
            <option value="2 Sisi (Duplex)">2 Sisi (Duplex)</option>
          </select>

          {/* Paper Filter */}
          <select
            value={paperFilter}
            onChange={(e) => {
              setPaperFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Semua Jenis Kertas</option>
            {uniquePaperTypes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Operator Filter */}
          <select
            value={operatorFilter}
            onChange={(e) => {
              setOperatorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">Semua Operator</option>
            {uniqueOperators.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>

          {(searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL' || sideFilter !== 'ALL' || paperFilter !== 'ALL' || operatorFilter !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-medium transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filter
            </button>
          )}

          <span className="ml-auto text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-slate-800">{filteredLogs.length}</span> dari {logs.length} data
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-300 sticky top-0 z-10 text-xs">
            <tr>
              <th className="py-3 px-3 sm:px-4">No. Nota & Waktu</th>
              <th className="py-3 px-3 sm:px-4">Operator</th>
              <th className="py-3 px-3 sm:px-4">Kertas & Sisi</th>
              <th className="py-3 px-3 sm:px-4 text-center">Jenis Cetak</th>
              <th className="py-3 px-3 sm:px-4 text-center">Jml Halaman</th>
              <th className="py-3 px-3 sm:px-4 text-right">Lembar Fisik</th>
              <th className="py-3 px-3 sm:px-4 text-center">Status</th>
              <th className="py-3 px-3 sm:px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <div className="max-w-xs mx-auto space-y-3">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-medium text-slate-700">Tidak ada data log yang sesuai pencarian atau filter.</p>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={handleResetFilters}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Reset Filter
                      </button>
                      <button
                        onClick={onResetToSampleData}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-xs text-white hover:bg-blue-700 cursor-pointer"
                      >
                        Muat Contoh Data Kantor
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => {
                const isDuplex = log.printSide === '2 Sisi (Duplex)';
                return (
                  <tr key={log.id} className="hover:bg-blue-50/30 transition group">
                    {/* Nota & Tanggal */}
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-blue-700 text-xs">{log.receiptNo}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span>{log.date}</span>
                        <span>•</span>
                        <span>{log.time}</span>
                      </div>
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        {getOperatorName(log.userName)}
                      </span>
                    </td>

                    {/* Kertas & Sisi */}
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 text-xs">{log.paperType}</div>
                      <div className="mt-0.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isDuplex
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isDuplex ? '2 Sisi (Duplex)' : '1 Sisi (Simplex)'}
                        </span>
                      </div>
                    </td>

                    {/* Jenis Cetak */}
                    <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                      {log.printType === 'Warna' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          Warna
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                          <span className="w-2 h-2 rounded-full bg-slate-600" />
                          Hitam Putih
                        </span>
                      )}
                    </td>

                    {/* Halaman */}
                    <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                      <div className="font-medium text-slate-800">
                        {log.pages} hlm
                      </div>
                    </td>

                    {/* Lembar Fisik */}
                    <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-slate-900 text-sm">{formatNumber(log.sheets)}</span>
                      <span className="text-xs text-slate-500 ml-1">lbr</span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                      {renderStatusBadge(log.status, log.errorBy)}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {/* Lihat Nota / Cetak Slip */}
                        <button
                          onClick={() => onViewReceipt(log)}
                          title="Lihat & Cetak Nota Struk"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        {/* Duplikasi Baris */}
                        <button
                          onClick={() => onDuplicate(log)}
                          title="Duplikasi Data ini"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Edit Baris */}
                        <button
                          onClick={() => setLogToEditInModal(log)}
                          title="Edit Baris ini (Buka Kotak Dialog Pembaruan)"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Hapus Baris */}
                        <button
                          onClick={() => setLogToDelete(log)}
                          title="Hapus Log ini"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredLogs.length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredLogs.length)} dari {filteredLogs.length} data log
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium cursor-pointer"
            >
              ← Sebelumnya
            </button>

            <span className="px-2 font-semibold text-slate-800">
              Halaman {currentPage} dari {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium cursor-pointer"
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      )}

      {/* Kotak Dialog Konfirmasi Hapus Data Log */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Kotak Dialog */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3.5 bg-rose-50/70">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfirmasi Hapus Data Log
                </h3>
                <p className="text-xs text-slate-500">
                  Data yang dihapus akan hilang dari catatan sistem
                </p>
              </div>
            </div>

            {/* Rincian Data yang Akan Dihapus */}
            <div className="p-5 space-y-3">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Apakah Anda yakin data ini akan dihapus?
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nomor Nota:</span>
                  <span className="font-mono font-bold text-blue-700">{logToDelete.receiptNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Operator:</span>
                  <span className="font-bold text-slate-800">{getOperatorName(logToDelete.userName)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Kertas & Sisi:</span>
                  <span className="text-slate-800">{logToDelete.paperType} • {logToDelete.printSide}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Jenis Cetak:</span>
                  <span className="font-semibold text-slate-800">{logToDelete.printType} ({formatNumber(logToDelete.sheets)} lembar)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tanggal & Jam:</span>
                  <span className="text-slate-600">{logToDelete.date} • {logToDelete.time}</span>
                </div>
              </div>
            </div>

            {/* Pilihan Tombol Iya atau Tidak */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(logToDelete.id);
                  setLogToDelete(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/25 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Iya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kotak Dialog Perbarui Log Baris Ini */}
      {logToEditInModal && (
        <EditLogModal
          isOpen={!!logToEditInModal}
          log={logToEditInModal}
          officeConfig={officeConfig}
          onSave={(updatedLog) => {
            if (onSaveLog) {
              onSaveLog(updatedLog);
            } else {
              onEdit(updatedLog);
            }
            setLogToEditInModal(null);
          }}
          onClose={() => setLogToEditInModal(null)}
        />
      )}
    </div>
  );
};
