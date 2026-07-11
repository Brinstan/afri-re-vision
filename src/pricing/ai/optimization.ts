// Portfolio & business-mix optimization: transparent greedy reweighting toward
// adequately-priced, profitable lines under a concentration cap.

import type { Claim, Treaty } from '@/components/DataStore';
import { RateAdequacyRow } from '../analytics';
import { MixSuggestion } from './types';

const MAX_LINE_SHARE_PCT = 45;
const SHIFT_STEP_PCT = 5;

export const businessMixOptimization = (
  treaties: Treaty[],
  adequacy: RateAdequacyRow[]
): MixSuggestion[] => {
  const totalPremium = treaties.reduce((s, t) => s + t.premium, 0);
  if (totalPremium <= 0) return [];

  const rows = adequacy.map(a => ({
    lob: a.lineOfBusiness,
    sharePct: (a.bookedPremium / totalPremium) * 100,
    adequacy: a.adequacyPct ?? 100,
    lossRatio: a.actualLossRatioPct
  }));

  return rows.map(r => {
    const profitable = r.adequacy >= 100 && (r.lossRatio === null || r.lossRatio <= 70);
    const inadequate = r.adequacy < 85 || (r.lossRatio !== null && r.lossRatio > 95);
    let direction: MixSuggestion['direction'] = 'Hold';
    let suggested = r.sharePct;
    let rationale: string;

    if (profitable && r.sharePct < MAX_LINE_SHARE_PCT) {
      direction = 'Grow';
      suggested = Math.min(MAX_LINE_SHARE_PCT, r.sharePct + SHIFT_STEP_PCT);
      rationale = `Rate-adequate (${r.adequacy.toFixed(0)}%) and profitable — grow up to the ${MAX_LINE_SHARE_PCT}% concentration cap.`;
    } else if (inadequate) {
      direction = 'Shrink';
      suggested = Math.max(0, r.sharePct - SHIFT_STEP_PCT);
      rationale = `Under-priced (adequacy ${r.adequacy.toFixed(0)}%${r.lossRatio !== null ? `, LR ${r.lossRatio.toFixed(0)}%` : ''}) — reduce until rates harden.`;
    } else if (r.sharePct > MAX_LINE_SHARE_PCT) {
      direction = 'Shrink';
      suggested = MAX_LINE_SHARE_PCT;
      rationale = `Above the ${MAX_LINE_SHARE_PCT}% single-line concentration cap — diversify.`;
    } else {
      rationale = `Adequacy ${r.adequacy.toFixed(0)}% and share ${r.sharePct.toFixed(0)}% are balanced — hold.`;
    }

    return {
      lineOfBusiness: r.lob,
      currentSharePct: r.sharePct,
      suggestedSharePct: suggested,
      direction,
      rationale
    };
  }).sort((a, b) => b.currentSharePct - a.currentSharePct);
};
