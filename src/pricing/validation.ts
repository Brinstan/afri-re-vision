// Pricing validation rules: structure sanity, loading consistency, rate
// adequacy, and data-sufficiency warnings.

import { ExperienceYear, PremiumBuildUp, PricingAssumptions, PricingStructure, PricingValidationIssue } from './types';

export const validatePricing = (
  structure: PricingStructure,
  assumptions: PricingAssumptions,
  buildUp: PremiumBuildUp,
  experience: ExperienceYear[]
): PricingValidationIssue[] => {
  const issues: PricingValidationIssue[] = [];

  // Structure
  if (structure.subjectPremium <= 0) {
    issues.push({ severity: 'error', message: 'Subject premium is zero — select lines of business with inward treaties' });
  }
  if ((structure.treatyType === 'Quota Share' || structure.treatyType === 'Surplus')) {
    const c = structure.cessionPct ?? 0;
    if (c <= 0 || c > 100) issues.push({ severity: 'error', message: 'Cession must be between 0 and 100%' });
  }
  if (['XOL', 'Catastrophe', 'Facultative'].includes(structure.treatyType)) {
    if ((structure.limit ?? 0) <= 0) issues.push({ severity: 'error', message: 'Layer limit must be positive' });
    if ((structure.attachment ?? 0) < 0) issues.push({ severity: 'error', message: 'Attachment cannot be negative' });
  }
  if (structure.treatyType === 'Stop Loss') {
    if ((structure.lrExhaustPct ?? 0) <= (structure.lrAttachPct ?? 0)) {
      issues.push({ severity: 'error', message: 'Stop loss exhaustion loss ratio must exceed the attachment loss ratio' });
    }
  }

  // Loadings
  if (buildUp.loadingsSumPct >= 60) {
    issues.push({ severity: buildUp.loadingsSumPct >= 80 ? 'error' : 'warning', message: `Expense + commission + profit loadings total ${buildUp.loadingsSumPct.toFixed(1)}% of office premium — ${buildUp.loadingsSumPct >= 80 ? 'not viable' : 'unusually high'}` });
  }
  if (assumptions.riskLoadingPct < 0 || assumptions.riskLoadingPct > 100) {
    issues.push({ severity: 'error', message: 'Risk loading must be between 0 and 100%' });
  }

  // Rate adequacy sanity
  if (buildUp.ratePct !== null && buildUp.ratePct > 100) {
    issues.push({ severity: 'warning', message: `Office premium exceeds the subject premium (rate ${buildUp.ratePct.toFixed(1)}%) — check the structure` });
  }
  if (buildUp.rateOnLinePct !== null && (buildUp.rateOnLinePct > 100 || buildUp.rateOnLinePct < 0.5)) {
    issues.push({ severity: 'warning', message: `Rate on line ${buildUp.rateOnLinePct.toFixed(1)}% is outside the typical 0.5–100% range` });
  }
  if (buildUp.officePremium > 0 && buildUp.expectedLossCost === 0) {
    issues.push({ severity: 'warning', message: 'Priced entirely on exposure prior — no experience losses reach this structure' });
  }

  // Data sufficiency
  const years = experience.filter(e => e.premium > 0).length;
  const claimCount = experience.reduce((s, e) => s + e.claimCount, 0);
  if (years < 3) issues.push({ severity: 'warning', message: `Only ${years} experience year(s) — credibility is limited, exposure prior dominates` });
  if (claimCount < 5) issues.push({ severity: 'warning', message: `Only ${claimCount} claim(s) in scope — frequency/severity estimates are volatile` });

  return issues;
};
