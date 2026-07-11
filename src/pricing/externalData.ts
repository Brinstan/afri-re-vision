// External experience: standard LOB catalogue, CSV import (Excel "Save as
// CSV"), template generation, and scope filtering for the pricing engines.

import type { ExternalExperienceRow } from '@/components/DataStore';
import { downloadFile } from '@/lib/actuarial';
import { PricingStructure } from './types';

/** Standard reinsurance lines of business, merged with whatever the portfolio/imports contain. */
export const STANDARD_LOBS = [
  'Motor', 'Property', 'Fire', 'Engineering', 'Marine', 'Aviation',
  'Liability', 'Agriculture', 'Accident & Health', 'Energy', 'Bonds & Credit', 'Miscellaneous'
];

// ---------------------------------------------------------------------------
// CSV parsing (tolerant of header naming and quoting)
// ---------------------------------------------------------------------------

const splitCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur); cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map(s => s.trim());
};

const HEADER_ALIASES: Record<string, string[]> = {
  year: ['year', 'uw year', 'underwriting year', 'accident year', 'yr'],
  cedant: ['cedant', 'ceding company', 'client', 'company', 'insured'],
  contractNumber: ['contract', 'contract number', 'contract no', 'policy', 'policy number', 'treaty number', 'reference'],
  lineOfBusiness: ['line of business', 'lob', 'line', 'class', 'class of business'],
  premium: ['premium', 'gross premium', 'written premium', 'gwp', 'premium income'],
  losses: ['losses', 'claims', 'incurred', 'incurred losses', 'claims incurred', 'loss amount', 'claim amount'],
  claimCount: ['claim count', 'claims count', 'count', 'number of claims', 'no of claims', 'frequency']
};

const matchHeader = (header: string): string | null => {
  const h = header.toLowerCase().replace(/[_-]/g, ' ').trim();
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(h)) return field;
  }
  return null;
};

const parseNumber = (v: string): number => {
  const n = parseFloat(v.replace(/[,\s]/g, '').replace(/[()]/g, m => m === '(' ? '-' : ''));
  return isNaN(n) ? 0 : n;
};

export interface ParseResult {
  rows: Omit<ExternalExperienceRow, 'id' | 'source'>[];
  errors: string[];
  skipped: number;
}

/**
 * Parse experience CSV content. Required columns: Year, Premium.
 * Optional: Cedant, Contract Number, Line of Business, Losses, Claim Count.
 */
export const parseExperienceCsv = (content: string): ParseResult => {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const errors: string[] = [];
  if (lines.length < 2) return { rows: [], errors: ['File has no data rows — expected a header row plus at least one data row'], skipped: 0 };

  const headers = splitCsvLine(lines[0]).map(matchHeader);
  const fieldIndex = (field: string) => headers.indexOf(field);

  if (fieldIndex('year') === -1) errors.push('Missing a "Year" column (accepted: Year, UW Year, Accident Year)');
  if (fieldIndex('premium') === -1) errors.push('Missing a "Premium" column (accepted: Premium, GWP, Written Premium)');
  if (errors.length > 0) return { rows: [], errors, skipped: 0 };

  const rows: ParseResult['rows'] = [];
  let skipped = 0;
  const get = (cells: string[], field: string): string => {
    const i = fieldIndex(field);
    return i >= 0 && i < cells.length ? cells[i] : '';
  };

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const year = Math.round(parseNumber(get(cells, 'year')));
    const premium = parseNumber(get(cells, 'premium'));
    if (year < 1980 || year > 2100 || premium <= 0) {
      skipped++;
      if (skipped <= 3) errors.push(`Row ${i + 1} skipped: needs a valid year and a positive premium`);
      continue;
    }
    rows.push({
      year,
      cedant: get(cells, 'cedant') || 'Unknown',
      contractNumber: get(cells, 'contractNumber') || '',
      lineOfBusiness: get(cells, 'lineOfBusiness') || 'Miscellaneous',
      premium,
      losses: Math.max(0, parseNumber(get(cells, 'losses'))),
      claimCount: Math.max(0, Math.round(parseNumber(get(cells, 'claimCount'))))
    });
  }
  if (skipped > 3) errors.push(`…and ${skipped - 3} more rows skipped`);
  return { rows, errors, skipped };
};

export const downloadExperienceTemplate = () => {
  const template = [
    'Year,Cedant,Contract Number,Line of Business,Premium,Losses,Claim Count',
    '2021,Century Insurance Ltd,12345,Motor,18500000,11200000,42',
    '2022,Century Insurance Ltd,12345,Motor,21000000,15800000,55',
    '2023,Century Insurance Ltd,12388,Fire,9500000,3100000,8',
    '2024,Jubilee Insurance,12401,Engineering,12000000,7400000,15'
  ].join('\n');
  downloadFile(template, 'pricing-experience-template.csv');
};

// ---------------------------------------------------------------------------
// Scope filtering & synthetic loss explosion
// ---------------------------------------------------------------------------

/** External rows that fall into the structure's pricing scope. */
export const scopeExternalRows = (
  rows: ExternalExperienceRow[],
  structure: PricingStructure
): ExternalExperienceRow[] =>
  rows.filter(r => {
    if (structure.cedant && r.cedant.toLowerCase() !== structure.cedant.toLowerCase()) return false;
    if (structure.contractNumber && !r.contractNumber.toLowerCase().includes(structure.contractNumber.toLowerCase())) return false;
    if (structure.linesOfBusiness.length > 0 &&
        !structure.linesOfBusiness.some(l => l.toLowerCase() === r.lineOfBusiness.toLowerCase())) return false;
    return true;
  });

/**
 * Explode a row's aggregate losses into per-loss amounts so per-claim structure
 * mapping (XOL capping etc.) can apply: claimCount losses of average severity,
 * or a single loss when no count is given.
 */
export const explodeLosses = (row: ExternalExperienceRow): number[] => {
  if (row.losses <= 0) return [];
  const count = row.claimCount > 0 ? row.claimCount : 1;
  return Array(count).fill(row.losses / count);
};
