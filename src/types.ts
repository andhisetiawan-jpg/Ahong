export type PrintSide = '1 Sisi (Simplex)' | '2 Sisi (Duplex)';
export type PrintType = 'Hitam Putih' | 'Warna';
export type PrintStatus = 'Selesai' | 'Pending' | 'Paper Jam' | 'Salah Print';

export type PaperType =
  | 'A4 (70-80 gsm)'
  | 'F4 / Folio (70-80 gsm)'
  | 'A3 (80 gsm)'
  | 'Letter / Kuarto'
  | 'Glossy Photo Paper'
  | 'Kertas Sertifikat / Concorde'
  | 'Lainnya';

export interface PrintLog {
  id: string;
  receiptNo: string;             // Nomor Nota
  date: string;                  // Format YYYY-MM-DD
  time: string;                  // Format HH:mm
  userName: string;              // Operator (Nama / Inisial)
  paperType: PaperType | string; // Jenis Kertas
  printSide: PrintSide;          // 1 Sisi / 2 Sisi
  printType: PrintType;          // Warna / Hitam Putih
  pages: number;                 // Jumlah Halaman
  sheets: number;                // Lembar Fisik Kertas
  status: PrintStatus;           // Status cetak: Selesai, Pending, Paper Jam, Salah Print
  errorBy?: string;              // Nama orang yang melakukan kesalahan (jika status 'Salah Print')
  createdAt: number;
}

export interface OperatorOption {
  code: string;
  name: string;
  label: string;
}

export const OPERATOR_OPTIONS: OperatorOption[] = [
  { code: 'AN', name: 'ANDHI', label: 'ANDHI' },
  { code: 'AL', name: 'ALDY', label: 'ALDY' },
  { code: 'SO', name: 'EKO', label: 'EKO' },
  { code: 'JML', name: 'JAMAL', label: 'JAMAL' },
];

export interface OfficeConfig {
  officeName: string;
  paperTypeList: string[];
}

export interface DailyPrinterCounter {
  id: string;
  date: string;               // Format YYYY-MM-DD
  // Counter Awal
  startTotal: number;         // Counter Total Awal
  startColor: number;         // Counter CLR (Colour) Awal
  startBw: number;            // Counter Black & White (BW) Awal
  // Counter Akhir
  endTotal: number;           // Counter Total Akhir
  endColor: number;           // Counter CLR (Colour) Akhir
  endBw: number;              // Counter Black & White (BW) Akhir
  notes?: string;
  updatedAt: number;
}

export interface ExcelFormulaGuide {
  id: string;
  title: string;
  category: 'Dasar' | 'Kondisional (IF)' | 'Rekap (SUMIF/COUNTIF)';
  purpose: string;
  englishFormula: string;
  indonesianFormula: string;
  columnExplanation: string;
  exampleData: {
    input: string;
    output: string;
  };
  tip: string;
}
