
import * as XLSX from 'xlsx';
import { GSTR1_TEMPLATE_BASE64 } from './gstr1Template';

// ─── Column Mappings ───────────────────────────────────────────
const columnMappings: Record<string, Record<string, string | string[]>> = {
  b2b: {
    'GSTIN/UIN of Recipient': 'GSTIN/UIN',
    'Invoice Number': 'Invoice No',
    'Invoice date': 'Date of Invoice',
    'Invoice Value': 'Invoice Value',
    'Rate': 'GST%',
    'Taxable Value': 'Taxable Value',
    'Cess Amount': 'CESS',
    'Place Of Supply': 'Place Of Supply',
    'Reverse Charge': 'RCM Applicable',
    'Invoice Type': 'Invoice Type',
    'E-Commerce GSTIN': 'E-Commerce GSTIN',
  },
  b2cl: {
    'Invoice Number': 'Invoice No',
    'Invoice date': 'Date of Invoice',
    'Invoice Value': 'Invoice Value',
    'Place Of Supply': 'Place Of Supply',
    'Rate': 'GST%',
    'Taxable Value': 'Taxable Value',
    'Cess Amount': 'CESS',
    'E-Commerce GSTIN': 'E-Commerce GSTIN',
  },
  b2cs: {
    'Type': 'Type',
    'Place Of Supply': 'Place Of Supply',
    'Rate': 'GST%',
    'Taxable Value': 'Taxable Value',
    'Cess Amount': 'CESS',
    'E-Commerce GSTIN': 'E-Commerce GSTIN',
  },
  export: {
    'Export Type': 'Export Type',
    'Invoice Number': 'Invoice No',
    'Invoice date': 'Date of Invoice',
    'Invoice Value': 'Invoice Value',
    'Port Code': 'Port Code',
    'Shipping Bill Number': 'Shipping Bill No',
    'Shipping Bill Date': 'Shipping Bill Date',
    'Rate': 'GST%',
    'Taxable Value': 'Taxable Value',
  },
  Nil_exempt_NonGST: {
    'Description': 'Description',
    'Nil Rated Supplies': 'Nil Rated Supplies',
    'Exempted (other than nil rated/non GST supply)': 'Exempted (other than nil rated/non GST supply)',
    'Non-GST supplies': 'Non-GST Supplies',
  },
  cdnr: {
    'GSTIN/UIN of Recipient': 'GSTIN/UIN',
    'Note Number': 'Dr./ Cr. No.',
    'Note Date': 'Dr./Cr. Date',
    'Note Type': 'Type of note                (Dr/ Cr)',
    'Place Of Supply': 'Place of supply',
    'Reverse Charge': 'RCM',
    'Note Supply Type': 'Invoice Type',
    'Note Value': 'Dr./Cr. Value',
    'Rate': 'GST%',
    'Taxable Value': 'Taxable Value',
    'Cess Amount': 'CESS',
  },
  cdnur: {
    'UR Type': 'Supply Type',
    'Note/Refund Voucher Number': 'Dr./ Cr. Note No.',
    'Note/Refund Voucher date': 'Dr./ Cr. Note Date',
    'Document Type': 'Type of note (Dr./ Cr.)',
    'Place Of Supply': 'Place of supply',
    'Note/Refund Voucher Value': 'Dr./Cr. Note Value',
    'Rate': 'GST%',
    'Taxable Value': 'Taxable Value',
    'Cess Amount': 'CESS',
  },
  hsn: {
    'Type': 'Type',
    'HSN': 'HSN',
    'Description': 'Description',
    'UQC': 'UQC',
    'Total Quantity': 'Total Quantity',
    'Total Value': 'Total Value',
    'Rate': 'Rate',
    'Taxable Value': 'Total Taxable Value',
    'Integrated Tax Amount': 'IGST',
    'Central Tax Amount': 'CGST',
    'State/UT Tax Amount': 'SGST',
    'Cess Amount': 'CESS',
  },
};

function getSheetName(fileName: string): string | null {
  const u = fileName.toUpperCase();
  if (u.includes('HSN')) return 'hsn';
  if (u.includes('B2CL')) return 'b2cl';
  if (u.includes('B2CS')) return 'b2cs';
  if (u.includes('B2B')) return 'b2b';
  if (u.includes('EXP')) return 'export';
  if (u.includes('EXEMP')) return 'Nil_exempt_NonGST';
  if (u.includes('CDNUR')) return 'cdnur';
  if (u.includes('CDNR')) return 'cdnr';
  return null;
}

function cleanPlaceOfSupply(value: string): string {
  return value.toString().trim().replace(/^\d+-\s*/, '').trim();
}

function trimAll(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
  );
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];

  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += char; }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  return lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const values = parseLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    });
}

function appendDataToSheet(
  sheet: XLSX.WorkSheet,
  data: Record<string, any>[],
  mapping: Record<string, string | string[]>,
  sheetName: string
) {
  if (!data.length) return;
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

  const templateHeaders: string[] = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: col })];
    templateHeaders.push(cell?.v?.toString().trim() ?? '');
  }

  let startRow = 1;
  for (let row = 1; row <= range.e.r; row++) {
    let hasData = false;
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell?.v !== undefined && cell?.v !== null && cell?.v !== '') { hasData = true; break; }
    }
    if (hasData) startRow = row + 1;
  }

  data.forEach((csvRow, rowIndex) => {
    const excelRow = startRow + rowIndex;
    templateHeaders.forEach((templateHeader, colIndex) => {
      if (!templateHeader) return;

      let csvValue: any = '';
      if (csvRow[templateHeader] !== undefined) {
        csvValue = csvRow[templateHeader];
      } else {
        for (const [csvCol, excelCol] of Object.entries(mapping)) {
          const excelCols = Array.isArray(excelCol) ? excelCol : [excelCol];
          if (excelCols.includes(templateHeader) && csvRow[csvCol] !== undefined) {
            csvValue = csvRow[csvCol];
            break;
          }
        }
      }

      const cellAddr = XLSX.utils.encode_cell({ r: excelRow, c: colIndex });
      if (csvValue === '' || csvValue === undefined) {
        sheet[cellAddr] = { t: 's', v: '' };
        return;
      }

      let finalValue: any = csvValue;
      if (templateHeader.toLowerCase().includes('place of supply')) {
        finalValue = cleanPlaceOfSupply(String(csvValue));
      }

      const numValue = parseFloat(String(finalValue).replace(/,/g, ''));
      if (!isNaN(numValue) && String(finalValue).match(/^-?\d+\.?\d*$/)) {
        sheet[cellAddr] = { t: 'n', v: numValue };
      } else {
        sheet[cellAddr] = { t: 's', v: String(finalValue).trim() };
      }
    });
  });

  range.e.r = startRow + data.length - 1;
  sheet['!ref'] = XLSX.utils.encode_range(range);
}

export interface CsvFileInput {
  name: string;
  content: string;
}

export async function generateGSTR1Excel(
  csvFiles: CsvFileInput[]
): Promise<Blob> {
  // Use a blank workbook if template base64 is not a full valid workbook (common for tiny base64 placeholders)
  let workbook: XLSX.WorkBook;
  try {
    const templateBinary = Uint8Array.from(atob(GSTR1_TEMPLATE_BASE64.trim()), c => c.charCodeAt(0));
    workbook = XLSX.read(templateBinary, { type: 'array' });
  } catch (e) {
    console.warn("Template reading failed, falling back to new workbook", e);
    workbook = XLSX.utils.book_new();
  }

  for (const { name, content } of csvFiles) {
    const sheetName = getSheetName(name);
    if (!sheetName) continue;

    let data = parseCSV(content).map(row => trimAll(row));
    if (!data.length) continue;

    if (!workbook.Sheets[sheetName]) {
      workbook.Sheets[sheetName] = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, workbook.Sheets[sheetName], sheetName);
    } else {
      const sheet = workbook.Sheets[sheetName];
      const sheetMapping = columnMappings[sheetName] || {};
      appendDataToSheet(sheet, data, sheetMapping, sheetName);
    }
  }

  const outputData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([outputData], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
