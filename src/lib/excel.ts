// Native .xlsx support (G-12) via SheetJS — real Excel files in and out,
// replacing the CSV-labelled-as-Excel interim.

import * as XLSX from 'xlsx';

export interface SheetSpec {
  name: string;                       // ≤31 chars, Excel limit
  /** Rows as arrays (first row = header) or objects (keys become headers). */
  rows: (string | number | null)[][] | Record<string, string | number | null>[];
}

/** Build and download a real .xlsx workbook. */
export const downloadXlsx = (filename: string, sheets: SheetSpec[]): void => {
  const wb = XLSX.utils.book_new();
  sheets.forEach(s => {
    const ws = Array.isArray(s.rows[0])
      ? XLSX.utils.aoa_to_sheet(s.rows as (string | number | null)[][])
      : XLSX.utils.json_to_sheet(s.rows as Record<string, string | number | null>[]);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  });
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};

/** Convert CSV text (our existing export format) into a downloaded .xlsx. */
export const downloadCsvAsXlsx = (filename: string, csv: string, sheetName = 'Sheet1'): void => {
  const ws = XLSX.read(csv, { type: 'string' }).Sheets.Sheet1;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};

/**
 * Read the first sheet of an uploaded .xlsx/.xls/.csv file as CSV text, so
 * existing tolerant CSV parsers (pricing experience import) accept Excel
 * files directly — no more "Save As CSV" detour.
 */
export const fileToCsv = async (file: File): Promise<string> => {
  if (/\.csv$/i.test(file.name)) return file.text();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const first = wb.SheetNames[0];
  if (!first) throw new Error('Workbook has no sheets');
  return XLSX.utils.sheet_to_csv(wb.Sheets[first]);
};

export const isSpreadsheetFile = (name: string): boolean => /\.(csv|xlsx|xls)$/i.test(name);
