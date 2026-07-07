// Multi-currency support: configurable closing & historical rates, translation,
// and exchange gain/loss on outstanding foreign-currency balances.

import type { Treaty } from '@/components/DataStore';
import { FxRates } from './types';

export const FX_RATES_KEY = 'afrirevision-fx-rates';

export const SUPPORTED_CURRENCIES = ['USD', 'TZS', 'KES', 'UGX', 'RWF', 'EUR', 'GBP'] as const;

/** Default indicative rates: units of USD per 1 unit of currency. */
export const DEFAULT_FX_RATES: FxRates = {
  reportingCurrency: 'USD',
  closing:    { USD: 1, TZS: 0.00040, KES: 0.0078, UGX: 0.00027, RWF: 0.00077, EUR: 1.09, GBP: 1.27 },
  historical: { USD: 1, TZS: 0.00042, KES: 0.0080, UGX: 0.00028, RWF: 0.00079, EUR: 1.07, GBP: 1.25 }
};

export const loadFxRates = (): FxRates => {
  try {
    const saved = localStorage.getItem(FX_RATES_KEY);
    if (!saved) return DEFAULT_FX_RATES;
    const parsed = JSON.parse(saved);
    return {
      reportingCurrency: parsed.reportingCurrency ?? 'USD',
      closing: { ...DEFAULT_FX_RATES.closing, ...parsed.closing },
      historical: { ...DEFAULT_FX_RATES.historical, ...parsed.historical }
    };
  } catch { return DEFAULT_FX_RATES; }
};

export const saveFxRates = (rates: FxRates) =>
  localStorage.setItem(FX_RATES_KEY, JSON.stringify(rates));

/**
 * Translate an amount from `currency` into the reporting currency.
 * Rates are stored as USD per unit; a non-USD reporting currency divides back out.
 */
export const translate = (
  amount: number,
  currency: string,
  rates: FxRates,
  basis: 'closing' | 'historical' = 'closing'
): number => {
  const table = basis === 'closing' ? rates.closing : rates.historical;
  const toUsd = table[currency] ?? 1;
  const reportingToUsd = table[rates.reportingCurrency] ?? 1;
  return amount * toUsd / reportingToUsd;
};

export interface FxExposure {
  currency: string;
  outstandingForeign: number;     // in original currency
  atHistorical: number;           // reporting currency at historical rate
  atClosing: number;              // reporting currency at closing rate
  gainLoss: number;               // closing − historical (gain > 0)
}

/**
 * Exchange gain/loss on outstanding premium receivables held in foreign
 * currencies: the difference between the historical rate the receivable was
 * booked at and the closing rate it is retranslated at.
 */
export const fxExposures = (treaties: Treaty[], rates: FxRates): FxExposure[] => {
  const byCurrency = new Map<string, number>();
  treaties.forEach(t => {
    const outstanding = (t.premiumBookings ?? [])
      .reduce((s, b) => s + b.amount - (b.paidAmount ?? 0), 0);
    if (outstanding > 0 && t.currency !== rates.reportingCurrency) {
      byCurrency.set(t.currency, (byCurrency.get(t.currency) ?? 0) + outstanding);
    }
  });
  return Array.from(byCurrency.entries()).map(([currency, outstandingForeign]) => {
    const atHistorical = translate(outstandingForeign, currency, rates, 'historical');
    const atClosing = translate(outstandingForeign, currency, rates, 'closing');
    return { currency, outstandingForeign, atHistorical, atClosing, gainLoss: atClosing - atHistorical };
  });
};

export const totalFxGainLoss = (treaties: Treaty[], rates: FxRates): number =>
  fxExposures(treaties, rates).reduce((s, e) => s + e.gainLoss, 0);
