// Actuarial computation library for AfriReVision.
// Pure functions over DataStore entities — no UI, no side effects.

import type { Claim, Treaty } from '@/components/DataStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GroupingDimension = 'accidentYear' | 'underwritingYear' | 'lineOfBusiness' | 'cedant' | 'treaty';

export interface Assumptions {
  claimsInflation: number;        // % per annum applied to historical claims
  premiumInflation: number;       // % per annum applied to historical premiums
  expectedLossRatio: number;      // % used by BF / ELR methods
  tailFactor: number;             // multiplicative tail beyond observed development
  factorMethod: 'simple' | 'weighted';
  selectedMethod: MethodKey | null;
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  claimsInflation: 0,
  premiumInflation: 0,
  expectedLossRatio: 65,
  tailFactor: 1.0,
  factorMethod: 'weighted',
  selectedMethod: null
};

export type MethodKey = 'chainLadder' | 'bornhuetterFerguson' | 'capeCod' | 'expectedLossRatio';

export const METHOD_LABELS: Record<MethodKey, string> = {
  chainLadder: 'Chain Ladder',
  bornhuetterFerguson: 'Bornhuetter-Ferguson',
  capeCod: 'Cape Cod',
  expectedLossRatio: 'Expected Loss Ratio'
};

/** Triangle indexed by origin period, each row cumulative by development age (years). */
export interface Triangle {
  origins: number[];                    // e.g. accident years, ascending
  maxDev: number;                       // highest development age observed
  cells: Record<number, (number | null)[]>; // origin -> cumulative value per dev age (null = future/unobserved)
}

export interface DevelopmentFactor {
  period: string;          // e.g. "0-1"
  fromDev: number;
  simple: number | null;
  weighted: number | null;
  observations: number;
  volatility: number | null; // std dev of individual age-to-age factors
  unstable: boolean;
}

export interface MethodResult {
  method: MethodKey;
  byOrigin: Array<{
    origin: number;
    premium: number;
    paidToDate: number;
    incurredToDate: number;
    ultimate: number;
    ibnr: number;
    rbns: number;
    reserve: number;      // ibnr + rbns
  }>;
  totals: { premium: number; paid: number; incurred: number; ultimate: number; ibnr: number; rbns: number; reserve: number };
  assumptionsNote: string;
}

export interface MackResult {
  byOrigin: Array<{ origin: number; reserve: number; standardError: number; cv: number | null }>;
  totalReserve: number;
  totalStandardError: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const yearOf = (dateStr: string | undefined): number | null => {
  if (!dateStr) return null;
  const y = new Date(dateStr).getFullYear();
  return isNaN(y) ? null : y;
};

export const currentYear = () => new Date().getFullYear();

/** Inflate a historical amount from its origin year to current cost levels. */
export const inflate = (amount: number, originYear: number, ratePct: number): number =>
  amount * Math.pow(1 + ratePct / 100, Math.max(0, currentYear() - originYear));

const claimPaid = (c: Claim): number => {
  if (typeof c.paidAmount === 'number' && c.paidAmount > 0) return c.paidAmount;
  const settled = ['Settled', 'Full Payment', 'Paid'].includes(c.status);
  return settled ? c.claimAmount : 0;
};

const claimCaseReserve = (c: Claim): number => {
  const settled = ['Settled', 'Full Payment', 'Paid'].includes(c.status);
  return settled ? 0 : c.reserveAmount;
};

const claimIncurred = (c: Claim): number => claimPaid(c) + claimCaseReserve(c);

export interface GroupOption { key: string; label: string }

/** Available grouping values for a dimension, derived from live data. */
export const groupOptions = (dimension: GroupingDimension, treaties: Treaty[], claims: Claim[]): GroupOption[] => {
  const set = new Map<string, string>();
  const treatyById = new Map(treaties.map(t => [t.id, t]));
  switch (dimension) {
    case 'accidentYear':
      claims.forEach(c => { const y = yearOf(c.dateOfLoss); if (y) set.set(String(y), String(y)); });
      break;
    case 'underwritingYear':
      treaties.forEach(t => { const y = yearOf(t.inceptionDate); if (y) set.set(String(y), String(y)); });
      break;
    case 'lineOfBusiness':
      treaties.forEach(t => t.lineOfBusiness.forEach(lob => set.set(lob, lob)));
      break;
    case 'cedant':
      treaties.forEach(t => set.set(t.cedant, t.cedant));
      break;
    case 'treaty':
      treaties.forEach(t => set.set(t.id, `${t.treatyName} (${t.contractNumber})`));
      break;
  }
  // Claims may reference treaties for lob/cedant grouping too
  if (dimension === 'lineOfBusiness' || dimension === 'cedant') {
    claims.forEach(c => {
      const t = treatyById.get(c.treatyId);
      if (t) {
        if (dimension === 'lineOfBusiness') t.lineOfBusiness.forEach(lob => set.set(lob, lob));
        else set.set(t.cedant, t.cedant);
      }
    });
  }
  return Array.from(set.entries()).map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label));
};

/** Filter claims to a grouping selection ('all' = no filter). */
export const filterClaims = (
  claims: Claim[],
  treaties: Treaty[],
  dimension: GroupingDimension,
  key: string
): Claim[] => {
  if (key === 'all') return claims;
  const treatyById = new Map(treaties.map(t => [t.id, t]));
  return claims.filter(c => {
    const t = treatyById.get(c.treatyId);
    switch (dimension) {
      case 'accidentYear': return String(yearOf(c.dateOfLoss)) === key;
      case 'underwritingYear': return t ? String(yearOf(t.inceptionDate)) === key : false;
      case 'lineOfBusiness': return t ? t.lineOfBusiness.includes(key) : false;
      case 'cedant': return t ? t.cedant === key : false;
      case 'treaty': return c.treatyId === key;
    }
  });
};

export const filterTreaties = (treaties: Treaty[], dimension: GroupingDimension, key: string): Treaty[] => {
  if (key === 'all') return treaties;
  switch (dimension) {
    case 'underwritingYear': return treaties.filter(t => String(yearOf(t.inceptionDate)) === key);
    case 'lineOfBusiness': return treaties.filter(t => t.lineOfBusiness.includes(key));
    case 'cedant': return treaties.filter(t => t.cedant === key);
    case 'treaty': return treaties.filter(t => t.id === key);
    case 'accidentYear': return treaties; // premium exposure unaffected by accident-year slice
  }
};

// ---------------------------------------------------------------------------
// Triangle engine
// ---------------------------------------------------------------------------

export type TriangleBasis = 'paid' | 'incurred' | 'reported';

/**
 * Build a cumulative development triangle from live claims.
 * Origin = accident year (year of loss). Development age = calendar-year lag
 * at which the amount is known: paid amounts develop at payment date (fall back
 * to approval/report date), case reserves and reported counts at report date.
 */
export const buildTriangle = (
  claims: Claim[],
  basis: TriangleBasis,
  claimsInflationPct = 0
): Triangle => {
  const now = currentYear();
  const increments = new Map<number, Map<number, number>>(); // origin -> dev -> incremental amount

  const add = (origin: number, dev: number, amount: number) => {
    if (!increments.has(origin)) increments.set(origin, new Map());
    const row = increments.get(origin)!;
    row.set(dev, (row.get(dev) || 0) + amount);
  };

  claims.forEach(c => {
    const origin = yearOf(c.dateOfLoss);
    if (!origin) return;
    const reportYear = yearOf(c.dateReported) ?? origin;
    const payYear = yearOf(c.paymentDate) ?? yearOf(c.dateApproved) ?? reportYear;
    const devReport = Math.max(0, reportYear - origin);
    const devPay = Math.max(0, payYear - origin);
    const infl = (amt: number) => inflate(amt, origin, claimsInflationPct);

    if (basis === 'paid') {
      const paid = claimPaid(c);
      if (paid > 0) add(origin, devPay, infl(paid));
      else add(origin, devReport, 0); // ensure origin row exists
    } else if (basis === 'incurred') {
      const paid = claimPaid(c);
      if (paid > 0) add(origin, devPay, infl(paid));
      add(origin, devReport, infl(claimCaseReserve(c)));
    } else {
      add(origin, devReport, 1); // reported claim count
    }
  });

  const origins = Array.from(increments.keys()).sort((a, b) => a - b);
  const maxDev = origins.length > 0 ? Math.max(...origins.map(o => now - o)) : 0;

  const cells: Record<number, (number | null)[]> = {};
  origins.forEach(origin => {
    const observable = now - origin; // dev ages 0..observable are in the past/present
    const row: (number | null)[] = [];
    let cumulative = 0;
    for (let dev = 0; dev <= maxDev; dev++) {
      if (dev <= observable) {
        cumulative += increments.get(origin)!.get(dev) || 0;
        row.push(cumulative);
      } else {
        row.push(null);
      }
    }
    cells[origin] = row;
  });

  return { origins, maxDev, cells };
};

export const latestDiagonal = (t: Triangle): Record<number, number> => {
  const out: Record<number, number> = {};
  t.origins.forEach(origin => {
    const row = t.cells[origin];
    for (let dev = row.length - 1; dev >= 0; dev--) {
      if (row[dev] !== null) { out[origin] = row[dev] as number; break; }
    }
    if (!(origin in out)) out[origin] = 0;
  });
  return out;
};

// ---------------------------------------------------------------------------
// Development factors & diagnostics
// ---------------------------------------------------------------------------

export const developmentFactors = (t: Triangle): DevelopmentFactor[] => {
  const factors: DevelopmentFactor[] = [];
  for (let dev = 0; dev < t.maxDev; dev++) {
    const individual: Array<{ factor: number; weight: number }> = [];
    t.origins.forEach(origin => {
      const from = t.cells[origin][dev];
      const to = t.cells[origin][dev + 1];
      if (from !== null && to !== null && from > 0) {
        individual.push({ factor: to / from, weight: from });
      }
    });

    if (individual.length === 0) {
      factors.push({ period: `${dev}-${dev + 1}`, fromDev: dev, simple: null, weighted: null, observations: 0, volatility: null, unstable: false });
      continue;
    }

    const simple = individual.reduce((s, f) => s + f.factor, 0) / individual.length;
    const totalWeight = individual.reduce((s, f) => s + f.weight, 0);
    const weighted = individual.reduce((s, f) => s + f.factor * f.weight, 0) / totalWeight;
    const variance = individual.length > 1
      ? individual.reduce((s, f) => s + Math.pow(f.factor - simple, 2), 0) / (individual.length - 1)
      : 0;
    const volatility = Math.sqrt(variance);

    factors.push({
      period: `${dev}-${dev + 1}`,
      fromDev: dev,
      simple,
      weighted,
      observations: individual.length,
      volatility,
      // flag if factors vary by more than 15% of the mean, or a lone observation far from 1
      unstable: individual.length > 1 ? volatility / simple > 0.15 : Math.abs(simple - 1) > 0.5
    });
  }
  return factors;
};

/** Cumulative development-to-ultimate factor from a given dev age. */
const cdfFrom = (dev: number, factors: DevelopmentFactor[], method: 'simple' | 'weighted', tail: number): number => {
  let cdf = tail;
  for (let k = factors.length - 1; k >= dev; k--) {
    const f = factors[k];
    const val = (method === 'weighted' ? f.weighted : f.simple) ?? 1;
    cdf *= val;
  }
  return cdf;
};

export interface PaidIncurredRatio { origin: number; paid: number; incurred: number; ratio: number | null }

export const paidToIncurredRatios = (paidT: Triangle, incT: Triangle): PaidIncurredRatio[] => {
  const paidDiag = latestDiagonal(paidT);
  const incDiag = latestDiagonal(incT);
  const origins = Array.from(new Set([...paidT.origins, ...incT.origins])).sort((a, b) => a - b);
  return origins.map(origin => {
    const paid = paidDiag[origin] ?? 0;
    const incurred = incDiag[origin] ?? 0;
    return { origin, paid, incurred, ratio: incurred > 0 ? paid / incurred : null };
  });
};

// ---------------------------------------------------------------------------
// Premium exposure by origin year
// ---------------------------------------------------------------------------

/** Earned premium proxy per origin year: treaty premium allocated to its inception year, inflation-adjusted. */
export const premiumByOrigin = (treaties: Treaty[], origins: number[], premiumInflationPct = 0): Record<number, number> => {
  const out: Record<number, number> = {};
  origins.forEach(o => { out[o] = 0; });
  treaties.forEach(t => {
    const y = yearOf(t.inceptionDate);
    if (y !== null && y in out) out[y] += inflate(t.premium, y, premiumInflationPct);
  });
  // Origins with no matching treaty inception: spread total average so BF/ELR remain usable
  const totalPremium = treaties.reduce((s, t) => s + t.premium, 0);
  const empty = origins.filter(o => out[o] === 0);
  if (empty.length > 0 && totalPremium > 0) {
    const avg = totalPremium / Math.max(origins.length, 1);
    empty.forEach(o => { out[o] = avg; });
  }
  return out;
};

// ---------------------------------------------------------------------------
// Reserving methods
// ---------------------------------------------------------------------------

interface MethodInputs {
  paidTriangle: Triangle;
  incurredTriangle: Triangle;
  premiums: Record<number, number>;
  factors: DevelopmentFactor[];
  assumptions: Assumptions;
}

const buildResult = (
  method: MethodKey,
  inputs: MethodInputs,
  ultimateFor: (origin: number, latestIncurred: number, latestPaid: number, pctDeveloped: number) => number,
  note: string
): MethodResult => {
  const { paidTriangle, incurredTriangle, premiums, factors, assumptions } = inputs;
  const now = currentYear();
  const paidDiag = latestDiagonal(paidTriangle);
  const incDiag = latestDiagonal(incurredTriangle);
  const origins = incurredTriangle.origins.length > 0 ? incurredTriangle.origins : paidTriangle.origins;

  const byOrigin = origins.map(origin => {
    const devAge = Math.min(now - origin, incurredTriangle.maxDev);
    const cdf = cdfFrom(devAge, factors, assumptions.factorMethod, assumptions.tailFactor);
    const pctDeveloped = cdf > 0 ? 1 / cdf : 1;
    const paid = paidDiag[origin] ?? 0;
    const incurred = incDiag[origin] ?? 0;
    const ultimate = Math.max(ultimateFor(origin, incurred, paid, pctDeveloped), incurred);
    const rbns = Math.max(0, incurred - paid);
    const ibnr = Math.max(0, ultimate - incurred);
    return {
      origin,
      premium: premiums[origin] ?? 0,
      paidToDate: paid,
      incurredToDate: incurred,
      ultimate,
      ibnr,
      rbns,
      reserve: ibnr + rbns
    };
  });

  const totals = byOrigin.reduce(
    (acc, r) => ({
      premium: acc.premium + r.premium,
      paid: acc.paid + r.paidToDate,
      incurred: acc.incurred + r.incurredToDate,
      ultimate: acc.ultimate + r.ultimate,
      ibnr: acc.ibnr + r.ibnr,
      rbns: acc.rbns + r.rbns,
      reserve: acc.reserve + r.reserve
    }),
    { premium: 0, paid: 0, incurred: 0, ultimate: 0, ibnr: 0, rbns: 0, reserve: 0 }
  );

  return { method, byOrigin, totals, assumptionsNote: note };
};

export const chainLadder = (inputs: MethodInputs): MethodResult =>
  buildResult(
    'chainLadder',
    inputs,
    (_origin, latestIncurred, _paid, pctDeveloped) =>
      pctDeveloped > 0 ? latestIncurred / pctDeveloped : latestIncurred,
    `Development factors: ${inputs.assumptions.factorMethod} average, tail ${inputs.assumptions.tailFactor.toFixed(3)}`
  );

export const bornhuetterFerguson = (inputs: MethodInputs): MethodResult => {
  const elr = inputs.assumptions.expectedLossRatio / 100;
  return buildResult(
    'bornhuetterFerguson',
    inputs,
    (origin, latestIncurred, _paid, pctDeveloped) => {
      const expectedUltimate = (inputs.premiums[origin] ?? 0) * elr;
      return latestIncurred + expectedUltimate * (1 - pctDeveloped);
    },
    `ELR ${inputs.assumptions.expectedLossRatio}%, ${inputs.assumptions.factorMethod} factors, tail ${inputs.assumptions.tailFactor.toFixed(3)}`
  );
};

export const expectedLossRatioMethod = (inputs: MethodInputs): MethodResult => {
  const elr = inputs.assumptions.expectedLossRatio / 100;
  return buildResult(
    'expectedLossRatio',
    inputs,
    (origin) => (inputs.premiums[origin] ?? 0) * elr,
    `Ultimate = premium × ELR ${inputs.assumptions.expectedLossRatio}% (development ignored)`
  );
};

/** Cape Cod: ELR estimated from the data itself, weighted by used-up premium. */
export const capeCod = (inputs: MethodInputs): { result: MethodResult; impliedElr: number } => {
  const { incurredTriangle, premiums, factors, assumptions } = inputs;
  const now = currentYear();
  const incDiag = latestDiagonal(incurredTriangle);

  let lossSum = 0;
  let usedUpPremium = 0;
  incurredTriangle.origins.forEach(origin => {
    const devAge = Math.min(now - origin, incurredTriangle.maxDev);
    const cdf = cdfFrom(devAge, factors, assumptions.factorMethod, assumptions.tailFactor);
    const pct = cdf > 0 ? 1 / cdf : 1;
    lossSum += incDiag[origin] ?? 0;
    usedUpPremium += (premiums[origin] ?? 0) * pct;
  });
  const impliedElr = usedUpPremium > 0 ? lossSum / usedUpPremium : assumptions.expectedLossRatio / 100;

  const result = buildResult(
    'capeCod',
    inputs,
    (origin, latestIncurred, _paid, pctDeveloped) =>
      latestIncurred + (premiums[origin] ?? 0) * impliedElr * (1 - pctDeveloped),
    `Implied ELR ${(impliedElr * 100).toFixed(1)}% from used-up premium, tail ${assumptions.tailFactor.toFixed(3)}`
  );
  return { result, impliedElr };
};

/** Simplified Mack: per-development-period variance of age-to-age factors → reserve standard errors. */
export const mackStandardErrors = (t: Triangle, factors: DevelopmentFactor[], assumptions: Assumptions, clResult: MethodResult): MackResult => {
  const now = currentYear();
  const diag = latestDiagonal(t);

  const byOrigin = t.origins.map(origin => {
    const devAge = Math.min(now - origin, t.maxDev);
    const latest = diag[origin] ?? 0;
    // Simplified process variance: accumulate sigma^2-style terms over future periods
    let varianceSum = 0;
    let projected = latest;
    for (let k = devAge; k < factors.length; k++) {
      const f = factors[k];
      const factor = (assumptions.factorMethod === 'weighted' ? f.weighted : f.simple) ?? 1;
      const sigma = f.volatility ?? 0;
      varianceSum += Math.pow(projected * sigma, 2);
      projected *= factor;
    }
    const standardError = Math.sqrt(varianceSum);
    const reserve = clResult.byOrigin.find(r => r.origin === origin)?.reserve ?? 0;
    return { origin, reserve, standardError, cv: reserve > 0 ? standardError / reserve : null };
  });

  return {
    byOrigin,
    totalReserve: byOrigin.reduce((s, r) => s + r.reserve, 0),
    totalStandardError: Math.sqrt(byOrigin.reduce((s, r) => s + r.standardError * r.standardError, 0))
  };
};

export const runAllMethods = (inputs: MethodInputs) => {
  const cl = chainLadder(inputs);
  const bf = bornhuetterFerguson(inputs);
  const cc = capeCod(inputs);
  const elr = expectedLossRatioMethod(inputs);
  return { chainLadder: cl, bornhuetterFerguson: bf, capeCod: cc.result, capeCodImpliedElr: cc.impliedElr, expectedLossRatio: elr };
};

export type AllMethods = ReturnType<typeof runAllMethods>;

export const buildMethodInputs = (
  claims: Claim[],
  treaties: Treaty[],
  assumptions: Assumptions
): MethodInputs & { reportedTriangle: Triangle } => {
  const paidTriangle = buildTriangle(claims, 'paid', assumptions.claimsInflation);
  const incurredTriangle = buildTriangle(claims, 'incurred', assumptions.claimsInflation);
  const reportedTriangle = buildTriangle(claims, 'reported');
  const factors = developmentFactors(incurredTriangle);
  const premiums = premiumByOrigin(treaties, incurredTriangle.origins, assumptions.premiumInflation);
  return { paidTriangle, incurredTriangle, reportedTriangle, premiums, factors, assumptions };
};

// ---------------------------------------------------------------------------
// XOL / layer analytics (aligned with ClaimsModuleLinked allocation logic)
// ---------------------------------------------------------------------------

export interface XolTreatyAnalysis {
  treatyId: string;
  treatyName: string;
  contractNumber: string;
  grossClaims: number;
  reinsurerShare: number;      // payable at participation share, within layers
  retroRecovery: number;
  netRetention: number;        // reinsurer share net of retro
  reinstatementPremiums: number;
  layers: Array<{ name: string; limit: number; remainingCapacity: number; utilisationPct: number }>;
}

export const xolAnalysis = (treaties: Treaty[], claims: Claim[]): XolTreatyAnalysis[] =>
  treaties
    .filter(t => t.layers && t.layers.length > 0)
    .map(treaty => {
      const treatyClaims = claims.filter(c => c.treatyId === treaty.id);
      const grossClaims = treatyClaims.reduce((s, c) => s + c.claimAmount, 0);
      const reinsurerShare = treatyClaims.reduce((s, c) => {
        const fromLayers = (c.layerDistribution ?? []).reduce((ls, l: { payableAmount?: number; allocation?: number }) =>
          ls + (l.payableAmount ?? l.allocation ?? 0), 0);
        return s + (fromLayers > 0 ? fromLayers : c.claimAmount * treaty.participationShare / 100);
      }, 0);
      const retroRecovery = treatyClaims.reduce((s, c) => s + (c.retroRecovery ?? 0), 0);
      const reinstatementPremiums = treatyClaims.reduce((s, c) => s + (c.reinstatementPremium ?? 0), 0);
      return {
        treatyId: treaty.id,
        treatyName: treaty.treatyName,
        contractNumber: treaty.contractNumber,
        grossClaims,
        reinsurerShare,
        retroRecovery,
        netRetention: reinsurerShare - retroRecovery,
        reinstatementPremiums,
        layers: (treaty.layers ?? []).map(l => ({
          name: l.name,
          limit: l.limit,
          remainingCapacity: l.remainingCapacity,
          utilisationPct: l.limit > 0 ? ((l.limit - l.remainingCapacity) / l.limit) * 100 : 0
        }))
      };
    });

// ---------------------------------------------------------------------------
// Portfolio analytics
// ---------------------------------------------------------------------------

export interface PortfolioAnalytics {
  totalPremium: number;
  totalIncurred: number;
  totalPaid: number;
  lossRatio: number | null;          // incurred / premium
  commissionRatio: number | null;
  combinedRatio: number | null;      // loss + commission (simplified, no expenses)
  claimFrequency: number | null;     // claims per active treaty
  claimSeverity: number | null;      // average incurred per claim
  premiumTrend: Array<{ year: number; premium: number; incurred: number; lossRatio: number | null }>;
  lossRatioByOrigin: Array<{ origin: number; lossRatio: number | null }>;
}

export const portfolioAnalytics = (treaties: Treaty[], claims: Claim[]): PortfolioAnalytics => {
  const totalPremium = treaties.reduce((s, t) => s + t.premium, 0);
  const totalIncurred = claims.reduce((s, c) => s + claimIncurred(c), 0);
  const totalPaid = claims.reduce((s, c) => s + claimPaid(c), 0);
  const totalCommission = treaties.reduce((s, t) => s + t.premium * t.commission / 100, 0);
  const activeTreaties = treaties.filter(t => t.status === 'Active').length;

  const years = new Map<number, { premium: number; incurred: number }>();
  treaties.forEach(t => {
    const y = yearOf(t.inceptionDate);
    if (y === null) return;
    if (!years.has(y)) years.set(y, { premium: 0, incurred: 0 });
    years.get(y)!.premium += t.premium;
  });
  claims.forEach(c => {
    const y = yearOf(c.dateOfLoss);
    if (y === null) return;
    if (!years.has(y)) years.set(y, { premium: 0, incurred: 0 });
    years.get(y)!.incurred += claimIncurred(c);
  });

  const premiumTrend = Array.from(years.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, v]) => ({ year, premium: v.premium, incurred: v.incurred, lossRatio: v.premium > 0 ? (v.incurred / v.premium) * 100 : null }));

  const originYears = Array.from(new Set(claims.map(c => yearOf(c.dateOfLoss)).filter((y): y is number => y !== null))).sort();
  const lossRatioByOrigin = originYears.map(origin => {
    const incurred = claims.filter(c => yearOf(c.dateOfLoss) === origin).reduce((s, c) => s + claimIncurred(c), 0);
    const premium = years.get(origin)?.premium ?? 0;
    return { origin, lossRatio: premium > 0 ? (incurred / premium) * 100 : null };
  });

  return {
    totalPremium,
    totalIncurred,
    totalPaid,
    lossRatio: totalPremium > 0 ? (totalIncurred / totalPremium) * 100 : null,
    commissionRatio: totalPremium > 0 ? (totalCommission / totalPremium) * 100 : null,
    combinedRatio: totalPremium > 0 ? ((totalIncurred + totalCommission) / totalPremium) * 100 : null,
    claimFrequency: activeTreaties > 0 ? claims.length / activeTreaties : null,
    claimSeverity: claims.length > 0 ? totalIncurred / claims.length : null,
    premiumTrend,
    lossRatioByOrigin
  };
};

// ---------------------------------------------------------------------------
// Exports (CSV / printable report)
// ---------------------------------------------------------------------------

export const triangleToCsv = (t: Triangle, title: string): string => {
  const header = [title, ...Array.from({ length: t.maxDev + 1 }, (_, i) => `Dev ${i}`)];
  const rows = t.origins.map(origin =>
    [String(origin), ...t.cells[origin].map(v => (v === null ? '' : String(Math.round(v))))]
  );
  return [header, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
};

export const downloadFile = (content: string, filename: string, mime = 'text/csv;charset=utf-8;') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
