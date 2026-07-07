// Business validation engine for retrocession data.

import type { RetroClaim, RetroProgramme } from '@/components/DataStore';
import { ClaimRecovery, ValidationIssue } from './types';

export const validateProgrammes = (programmes: RetroProgramme[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  // Duplicate programme codes
  const codes = new Map<string, number>();
  programmes.forEach(p => codes.set(p.programmeCode, (codes.get(p.programmeCode) ?? 0) + 1));
  codes.forEach((count, code) => {
    if (count > 1) issues.push({ severity: 'error', scope: code, message: `Duplicate programme code — ${count} programmes share ${code}` });
  });

  programmes.forEach(p => {
    // Date consistency
    if (new Date(p.expiryDate) <= new Date(p.effectiveDate)) {
      issues.push({ severity: 'error', scope: p.programmeCode, message: 'Expiry date must be after the effective date' });
    }

    // Proportional programmes need a cession percentage
    if ((p.type === 'Quota Share' || p.type === 'Surplus') && !(p.cessionPct && p.cessionPct > 0 && p.cessionPct <= 100)) {
      issues.push({ severity: 'error', scope: p.programmeCode, message: 'Proportional programme requires a cession percentage between 0 and 100' });
    }

    // Layer checks
    const sorted = [...p.layers].sort((a, b) => a.attachmentPoint - b.attachmentPoint);
    sorted.forEach((layer, i) => {
      const placementTotal = layer.placements.reduce((s, pl) => s + pl.signedLinePct, 0);
      if (Math.abs(placementTotal - 100) > 0.01) {
        issues.push({
          severity: placementTotal > 100 ? 'error' : 'warning',
          scope: `${p.programmeCode} / ${layer.name}`,
          message: `Signed lines total ${placementTotal.toFixed(2)}% — must equal 100% (${placementTotal > 100 ? 'over-placed' : 'under-placed'})`
        });
      }
      layer.placements.forEach(pl => {
        if (pl.signedLinePct <= 0 || pl.signedLinePct > 100) {
          issues.push({ severity: 'error', scope: `${p.programmeCode} / ${layer.name}`, message: `Placement percentage ${pl.signedLinePct}% is out of range` });
        }
      });
      if (layer.limit <= 0) {
        issues.push({ severity: 'error', scope: `${p.programmeCode} / ${layer.name}`, message: 'Layer limit must be positive' });
      }
      // Overlap / gap with next layer (non-proportional programmes only)
      if (p.type !== 'Quota Share' && p.type !== 'Surplus' && i < sorted.length - 1) {
        const exhaustion = layer.attachmentPoint + layer.limit;
        const next = sorted[i + 1];
        if (next.attachmentPoint < exhaustion) {
          issues.push({ severity: 'error', scope: `${p.programmeCode}`, message: `${layer.name} overlaps ${next.name} (exhausts at ${exhaustion.toLocaleString()}, next attaches at ${next.attachmentPoint.toLocaleString()})` });
        } else if (next.attachmentPoint > exhaustion) {
          issues.push({ severity: 'warning', scope: `${p.programmeCode}`, message: `Coverage gap between ${layer.name} and ${next.name} (${(next.attachmentPoint - exhaustion).toLocaleString()} unprotected)` });
        }
      }
    });
  });

  return issues;
};

export const validateRetroClaims = (
  retroClaims: RetroClaim[],
  recoveries: ClaimRecovery[],
  programmes: RetroProgramme[]
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  retroClaims.forEach(rc => {
    const programme = programmes.find(p => p.id === rc.programmeId);
    if (!programme) {
      issues.push({ severity: 'error', scope: rc.id, message: 'Retro claim references a missing programme' });
      return;
    }
    const recovery = recoveries.find(r =>
      r.claimId === rc.originalClaimId && r.programmeId === rc.programmeId && r.layerId === rc.layerId);
    if (!recovery) {
      issues.push({ severity: 'warning', scope: rc.id, message: `No computed recoverable for this claim on ${programme.programmeCode} — the claim may not reach the layer` });
      return;
    }
    if (rc.expectedRecovery > recovery.recoverableAmount * 1.001) {
      issues.push({
        severity: 'error', scope: rc.id,
        message: `Expected recovery ${rc.expectedRecovery.toLocaleString()} exceeds the calculated recoverable ${Math.round(recovery.recoverableAmount).toLocaleString()}`
      });
    }
    if (rc.settledRecovery > rc.expectedRecovery * 1.001) {
      issues.push({ severity: 'error', scope: rc.id, message: 'Settled recovery exceeds the expected recovery' });
    }
  });

  return issues;
};

export const validateAll = (
  programmes: RetroProgramme[],
  retroClaims: RetroClaim[],
  recoveries: ClaimRecovery[]
): ValidationIssue[] => [
  ...validateProgrammes(programmes),
  ...validateRetroClaims(retroClaims, recoveries, programmes)
];
