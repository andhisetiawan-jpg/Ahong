import React, { useState } from 'react';
import { EXCEL_FORMULAS, EXCEL_COLUMN_GUIDE } from '../data/excelFormulas';
import { generateExcelTemplateCSV } from '../utils/helpers';
import {
  FileSpreadsheet,
  Copy,
  Check,
  Download,
  Lightbulb,
  Table,
  Info,
  Calculator,
} from 'lucide-react';

export const ExcelGuideTab: React.FC = () => {
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [activeCellFormula, setActiveCellFormula] = useState<string>(
    '=IF(E2="2 Sisi (Duplex)", ROUNDUP(G2/2, 0), G2)'
  );
  const [activeCellName, setActiveCellName] = useState<string>('H2');

  const categories = ['Semua', 'Kondisional (IF)', 'Rekap (SUMIF/COUNTIF)', 'Dasar'];

  const filteredFormulas =
    activeCategory === 'Semua'
      ? EXCEL_FORMULAS
      : EXCEL_FORMULAS.filter((f) => f.category === activeCategory);

  const handleCopyFormula = (id: string, formulaText: string) => {
    navigator.clipboard.writeText(formulaText);
    setCopiedFormulaId(id);
    setTimeout(() => {
      setCopiedFormulaId(null);
    }, 2500);
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner Panduan & Download Template */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-700/50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold uppercase tracking-wider">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Panduan Resmi Microsoft Excel & Spreadsheet Kantor
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Contoh Cara Pengisian & Rumus Excel Log Printing Kantor
            </h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Panduan lengkap pengisian tabel log cetak serta rumus Excel otomatis untuk menghitung
              lembar fisik (1 sisi vs 2 sisi bolak-balik) serta rekapitulasi SUMIF per pengguna dan jenis cetak.
            </p>
          </div>

          <button
            onClick={generateExcelTemplateCSV}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/30 cursor-pointer text-sm shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Template Excel (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Bagian 1: Tata Cara Pengisian Data Log Kantor */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              A. Contoh Cara Pengisian Tabel Log Printing Kantor
            </h3>
            <p className="text-xs text-slate-500">
              Ikuti standarisasi pengisian kolom agar pencatatan lembar kertas rapi dan akurat
            </p>
          </div>
        </div>

        {/* 4 Langkah Praktis Pengisian */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h4 className="font-semibold text-sm text-slate-800">Nomor Nota & Tanggal</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Isi tanggal dan nomor nota unik (misal: <code>NOTA-PRN-202610-001</code>) sebagai referensi bukti cetak.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h4 className="font-semibold text-sm text-slate-800">Operator</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pilih operator cetak dengan inisial (AN : ANDHI, AL : ALDY, SO : EKO, JML : JAMAL) untuk monitoring produksi per operator.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h4 className="font-semibold text-sm text-slate-800">Sisi & Jenis Kertas</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pilih <strong>2 Sisi (Duplex)</strong> untuk menghemat 50% lembar kertas, atau <strong>1 Sisi (Simplex)</strong> jika dibutuhkan.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              4
            </div>
            <h4 className="font-semibold text-sm text-slate-800">Warna & Halaman</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tentukan jenis cetak <strong>Hitam Putih</strong> atau <strong>Warna</strong>, masukkan jumlah halaman dokumen, dan pilih status akhir.
            </p>
          </div>
        </div>

        {/* Tabel Penjelasan Struktur Kolom Excel Standar */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 text-center">Kolom</th>
                <th className="py-2.5 px-3">Nama Kolom (Header)</th>
                <th className="py-2.5 px-3">Tipe / Format</th>
                <th className="py-2.5 px-3">Contoh Pengisian</th>
                <th className="py-2.5 px-3">Rumus Excel (Jika Ada)</th>
                <th className="py-2.5 px-3">Kegunaan untuk Kantor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {EXCEL_COLUMN_GUIDE.map((row) => (
                <tr key={row.col} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600 bg-slate-50/50">
                    {row.col}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{row.header}</td>
                  <td className="py-2.5 px-3 text-slate-600">{row.format}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-emerald-800 bg-emerald-50/40 rounded">
                    {row.sample}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs text-blue-800">
                    {row.formula !== '-' ? (
                      <span className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
                        {row.formula}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-xs">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bagian 2: Simulasi Spreadsheet Interaktif (Interactive Excel Sheet Preview) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                B. Simulasi Tampilan Lembar Kerja Microsoft Excel Asli
              </h3>
              <p className="text-xs text-slate-500">
                Klik cell bertanda hijau di bawah untuk melihat rumusnya muncul pada Formula Bar (fx)
              </p>
            </div>
          </div>
          <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">
            Cell Terpilih: <strong className="text-slate-900">{activeCellName}</strong>
          </div>
        </div>

        {/* Excel Formula Bar Mockup */}
        <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-100 font-mono text-xs">
          <div className="flex items-center bg-slate-200 px-3 py-1.5 border-b border-slate-300 text-slate-700 gap-2">
            <span className="font-bold text-slate-800 px-2 py-0.5 bg-white border border-slate-300 rounded">
              {activeCellName}
            </span>
            <span className="italic text-slate-500 font-serif font-bold">fx</span>
            <div className="flex-1 bg-white px-3 py-1 rounded border border-slate-300 text-slate-900 truncate">
              {activeCellFormula}
            </div>
          </div>

          {/* Mini Excel Table Grid */}
          <div className="overflow-x-auto bg-white">
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead className="bg-slate-100 text-slate-600 text-center font-bold">
                <tr>
                  <th className="w-8 border border-slate-300 p-1 bg-slate-200"></th>
                  <th className="border border-slate-300 p-1.5 w-24">A (Tanggal)</th>
                  <th className="border border-slate-300 p-1.5 w-28">B (No Nota)</th>
                  <th className="border border-slate-300 p-1.5 w-32">C (Operator)</th>
                  <th className="border border-slate-300 p-1.5 w-24">D (Kertas)</th>
                  <th className="border border-slate-300 p-1.5 w-24">E (Sisi)</th>
                  <th className="border border-slate-300 p-1.5 w-24">F (Warna/BW)</th>
                  <th className="border border-slate-300 p-1.5 w-16">G (Hlm)</th>
                  <th className="border border-slate-300 p-1.5 w-24 bg-emerald-50 text-emerald-900">
                    H (Lembar Fisik) ⚡
                  </th>
                  <th className="border border-slate-300 p-1.5 w-20">I (Status)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Row 2 */}
                <tr>
                  <td className="p-1 text-center font-bold bg-slate-200 border border-slate-300 text-slate-600">2</td>
                  <td className="p-1.5 border border-slate-300">2026-10-08</td>
                  <td className="p-1.5 border border-slate-300 font-mono">NOTA-001</td>
                  <td className="p-1.5 border border-slate-300 font-bold text-blue-900">AN : ANDHI</td>
                  <td className="p-1.5 border border-slate-300">A4</td>
                  <td className="p-1.5 border border-slate-300 font-semibold">2 Sisi (Duplex)</td>
                  <td className="p-1.5 border border-slate-300">Hitam Putih</td>
                  <td className="p-1.5 border border-slate-300 text-center">24</td>
                  {/* Column H2: Clickable formula */}
                  <td
                    onClick={() => {
                      setActiveCellName('H2');
                      setActiveCellFormula('=IF(E2="2 Sisi (Duplex)", ROUNDUP(G2/2, 0), G2)');
                    }}
                    className={`p-1.5 border border-slate-300 text-right font-bold cursor-pointer transition ${
                      activeCellName === 'H2' ? 'bg-emerald-200 ring-2 ring-emerald-500' : 'bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    12
                  </td>
                  <td className="p-1.5 border border-slate-300 text-center font-medium text-emerald-700">Selesai</td>
                </tr>

                {/* Row 3 */}
                <tr>
                  <td className="p-1.5 text-center font-bold bg-slate-200 border border-slate-300 text-slate-600">3</td>
                  <td className="p-1.5 border border-slate-300">2026-10-08</td>
                  <td className="p-1.5 border border-slate-300 font-mono">NOTA-002</td>
                  <td className="p-1.5 border border-slate-300 font-bold text-blue-900">AL : ALDY</td>
                  <td className="p-1.5 border border-slate-300">A4</td>
                  <td className="p-1.5 border border-slate-300 font-semibold">2 Sisi (Duplex)</td>
                  <td className="p-1.5 border border-slate-300 text-purple-700 font-bold">Warna</td>
                  <td className="p-1.5 border border-slate-300 text-center">18</td>
                  <td
                    onClick={() => {
                      setActiveCellName('H3');
                      setActiveCellFormula('=IF(E3="2 Sisi (Duplex)", ROUNDUP(G3/2, 0), G3)');
                    }}
                    className={`p-1.5 border border-slate-300 text-right font-bold cursor-pointer transition ${
                      activeCellName === 'H3' ? 'bg-emerald-200 ring-2 ring-emerald-500' : 'bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    9
                  </td>
                  <td className="p-1.5 border border-slate-300 text-center font-medium text-emerald-700">Selesai</td>
                </tr>

                {/* Row 4 (1 Sisi Simplex) */}
                <tr>
                  <td className="p-1.5 text-center font-bold bg-slate-200 border border-slate-300 text-slate-600">4</td>
                  <td className="p-1.5 border border-slate-300">2026-10-08</td>
                  <td className="p-1.5 border border-slate-300 font-mono">NOTA-003</td>
                  <td className="p-1.5 border border-slate-300 font-bold text-blue-900">SO : EKO</td>
                  <td className="p-1.5 border border-slate-300">F4</td>
                  <td className="p-1.5 border border-slate-300 font-semibold">1 Sisi (Simplex)</td>
                  <td className="p-1.5 border border-slate-300">Hitam Putih</td>
                  <td className="p-1.5 border border-slate-300 text-center">6</td>
                  <td
                    onClick={() => {
                      setActiveCellName('H4');
                      setActiveCellFormula('=IF(E4="2 Sisi (Duplex)", ROUNDUP(G4/2, 0), G4)');
                    }}
                    className={`p-1.5 border border-slate-300 text-right font-bold cursor-pointer transition ${
                      activeCellName === 'H4' ? 'bg-emerald-200 ring-2 ring-emerald-500' : 'bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    6
                  </td>
                  <td className="p-1.5 border border-slate-300 text-center font-medium text-emerald-700">Selesai</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bagian 3: Koleksi Rumus Excel Sederhana & Praktis */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                C. Kumpulan Rumus Excel Sederhana untuk Rekap Printing Kantor
              </h3>
              <p className="text-xs text-slate-500">
                Klik tombol "Salin Rumus" di kanan untuk menempelkan (paste) langsung ke dokumen Excel Anda
              </p>
            </div>
          </div>

          {/* Filter Kategori Rumus */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar Kartu Rumus */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFormulas.map((item) => {
            const isCopied = copiedFormulaId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition shadow-sm hover:shadow flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Category & Title */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {item.category}
                    </span>
                    <button
                      onClick={() => handleCopyFormula(item.id, item.englishFormula)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700'
                      }`}
                      title="Salin rumus ke clipboard"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{isCopied ? 'Tersalin!' : 'Salin Rumus'}</span>
                    </button>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{item.purpose}</p>

                  {/* Formula Code Box */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-1.5 shadow-inner">
                    <div>
                      <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                        Formula Excel Standar (English / Global):
                      </div>
                      <div className="text-emerald-400 font-bold overflow-x-auto py-0.5 scrollbar-none">
                        {item.englishFormula}
                      </div>
                    </div>
                    {item.indonesianFormula !== item.englishFormula && (
                      <div className="pt-1 border-t border-slate-800">
                        <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                          Versi Regional Indonesia (Pemisah titik koma ;):
                        </div>
                        <div className="text-teal-300 font-semibold overflow-x-auto py-0.5 scrollbar-none">
                          {item.indonesianFormula}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Penjelasan Kolom & Contoh Input Output */}
                  <div className="mt-2.5 text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-800">Kolom Acuan:</span>{' '}
                      <span className="text-slate-600">{item.columnExplanation}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Hasil Contoh:</span>{' '}
                      <span className="text-emerald-700 font-medium">{item.exampleData.output}</span>
                    </div>
                  </div>
                </div>

                {/* Practical Tip */}
                <div className="pt-2 border-t border-slate-200/80 flex items-start gap-2 text-[11px] text-amber-900 bg-amber-50/70 p-2 rounded-lg">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Tips Kantor:</strong> {item.tip}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
