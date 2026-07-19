import { describe, it, expect } from 'vitest';
import { coveredTreaties, subjectPremium, computeRecoveries, recoveryTotals } from '../retrocession/recoveryEngine';
import { validateProgrammes } from '../retrocession/validation';
import { mkTreaty, mkClaim, mkProgramme, mkLayer } from './helpers';

describe('automatic treaty coverage (LOB + period)', () => {
  const prog = mkProgramme({ linesOfBusiness: ['Fire', 'Engineering'], effectiveDate: '2023-01-01', expiryDate: '2023-12-31' });

  it('covers treaties on matching lines with overlapping periods, and only those', () => {
    const fire = mkTreaty({ lineOfBusiness: ['Fire'], inceptionDate: '2023-03-01', expiryDate: '2024-02-28' });
    const motor = mkTreaty({ lineOfBusiness: ['Motor'], inceptionDate: '2023-03-01', expiryDate: '2024-02-28' });
    const expired = mkTreaty({ lineOfBusiness: ['Fire'], inceptionDate: '2021-01-01', expiryDate: '2021-12-31' });
    const covered = coveredTreaties(prog, [fire, motor, expired]);
    expect(covered.map(t => t.id)).toEqual([fire.id]);
  });

  it('subject premium sums covered treaty premiums', () => {
    const t1 = mkTreaty({ lineOfBusiness: ['Fire'], premium: 300, inceptionDate: '2023-01-01', expiryDate: '2023-12-31' });
    const t2 = mkTreaty({ lineOfBusiness: ['Engineering'], premium: 200, inceptionDate: '2023-06-01', expiryDate: '2024-05-31' });
    expect(subjectPremium(prog, [t1, t2])).toBe(500);
  });
});

describe('recovery engine bases', () => {
  const treaty = mkTreaty({ lineOfBusiness: ['Property'], inceptionDate: '2023-01-01', expiryDate: '2023-12-31' });
  const claim = mkClaim({ treatyId: treaty.id, status: 'Settled', claimAmount: 1_000_000, paidAmount: 1_000_000, dateOfLoss: '2023-06-15' });

  it('quota share recovers cession % of the gross loss', () => {
    const qs = mkProgramme({ type: 'Quota Share', cessionPct: 40, linesOfBusiness: ['Property'], layers: [mkLayer()] });
    const rows = computeRecoveries([claim], [treaty], [qs], [], 0);
    const total = recoveryTotals(rows);
    expect(total.expected).toBeCloseTo(400_000, 2);
  });

  it('XOL recovers only the tranche above attachment, capped at the limit', () => {
    const xol = mkProgramme({
      type: 'XOL', linesOfBusiness: ['Property'],
      layers: [mkLayer({ attachmentPoint: 600_000, limit: 300_000 })],
    });
    const rows = computeRecoveries([claim], [treaty], [xol], [], 0);
    const total = recoveryTotals(rows);
    expect(total.expected).toBeCloseTo(300_000, 2); // 1M − 600k = 400k, capped at 300k
  });

  it('recovery never exceeds gross loss and reserve loads by the IBNR ratio', () => {
    const qs = mkProgramme({ type: 'Quota Share', cessionPct: 50, linesOfBusiness: ['Property'], layers: [mkLayer()] });
    const open = mkClaim({ treatyId: treaty.id, status: 'Outstanding', claimAmount: 200_000, reserveAmount: 200_000, dateOfLoss: '2023-05-01' });
    const rows = computeRecoveries([open], [treaty], [qs], [], 0.25);
    rows.forEach(r => {
      expect(r.recoverableAmount).toBeLessThanOrEqual(r.grossLoss + 1e-6);
      expect(r.recoveryReserve).toBeCloseTo(r.outstandingRecovery * 1.25, 6);
    });
  });

  it('claims outside the programme lines produce no recovery', () => {
    const marine = mkProgramme({ type: 'Quota Share', cessionPct: 50, linesOfBusiness: ['Marine'], layers: [mkLayer()] });
    const rows = computeRecoveries([claim], [treaty], [marine], [], 0);
    expect(rows.length).toBe(0);
  });
});

describe('placement validation', () => {
  it('flags layers whose signed lines do not total 100%', () => {
    const under = mkProgramme({
      layers: [mkLayer({
        placements: [{ id: 'P1', retrocessionaireId: 'R1', retrocessionaireName: 'Re A', signedLinePct: 60, status: 'Bound' }] as never,
      })],
    });
    const issues = validateProgrammes([under]);
    expect(issues.some(i => /100/.test(i.message))).toBe(true);
  });
});
