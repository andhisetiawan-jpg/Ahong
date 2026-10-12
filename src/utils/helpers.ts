import { PrintLog, PrintSide } from '../types';

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function calculateSheets(pages: number, printSide: PrintSide): number {
  const safePages = Math.max(1, Number(pages) || 1);
  return printSide === '2 Sisi (Duplex)' ? Math.ceil(safePages / 2) : safePages;
}

export function generateReceiptNo(existingLogs: PrintLog[]): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `NOTA-PRN-${year}${month}${day}`;

  // Find how many logs today
  const countToday = existingLogs.filter((log) => log.receiptNo.startsWith(datePrefix)).length;
  const nextSeq = String(countToday + 1).padStart(3, '0');

  return `${datePrefix}-${nextSeq}`;
}

export function exportLogsToCSV(logs: PrintLog[], delimiter: ';' | ',' = ';'): void {
  const headers = [
    'Tanggal',
    'Jam',
    'Nomor Nota',
    'Operator',
    'Jenis Kertas',
    'Cetak Sisi',
    'Jenis Cetak',
    'Jml Halaman',
    'Lembar Fisik Kertas',
    'Status',
    'Penanggung Jawab / Orang Salah Print',
  ];

  const rows = logs.map((log) => [
    `"${log.date}"`,
    `"${log.time}"`,
    `"${log.receiptNo}"`,
    `"${log.userName.replace(/"/g, '""')}"`,
    `"${log.paperType.replace(/"/g, '""')}"`,
    `"${log.printSide}"`,
    `"${log.printType}"`,
    log.pages,
    log.sheets,
    `"${log.status}"`,
    `"${(log.errorBy || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Excel compatibility in Windows/Mac
    [headers.join(delimiter), ...rows.map((r) => r.join(delimiter))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Log_Printing_Kantor_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateExcelTemplateCSV(): void {
  const delimiter = ';';
  const headers = [
    'Tanggal',
    'Nomor Nota',
    'Operator',
    'Jenis Kertas',
    'Cetak Sisi',
    'Jenis Cetak',
    'Halaman Dokumen',
    'Lembar Fisik Kertas [Rumus Excel]',
    'Status',
  ];

  // Provide example rows with direct Excel formulas!
  const sampleRows = [
    [
      '2026-10-08',
      'NOTA-PRN-001',
      'ANDHI',
      'A4 (70-80 gsm)',
      '2 Sisi (Duplex)',
      'Hitam Putih',
      24,
      '=IF(E2="2 Sisi (Duplex)", ROUNDUP(G2/2, 0), G2)',
      'Selesai',
    ],
    [
      '2026-10-08',
      'NOTA-PRN-002',
      'ALDY',
      'A4 (70-80 gsm)',
      '2 Sisi (Duplex)',
      'Warna',
      18,
      '=IF(E3="2 Sisi (Duplex)", ROUNDUP(G3/2, 0), G3)',
      'Selesai',
    ],
    [
      '2026-10-08',
      'NOTA-PRN-003',
      'EKO',
      'F4 / Folio (70-80 gsm)',
      '1 Sisi (Simplex)',
      'Hitam Putih',
      6,
      '=IF(E4="2 Sisi (Duplex)", ROUNDUP(G4/2, 0), G4)',
      'Selesai',
    ],
  ];

  const content =
    '\uFEFF' +
    [
      headers.join(delimiter),
      ...sampleRows.map((row) =>
        row
          .map((item) => (typeof item === 'string' && item.startsWith('=') ? item : `"${String(item).replace(/"/g, '""')}"`))
          .join(delimiter)
      ),
    ].join('\r\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Template_Log_Printing_Excel_Rumus.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
