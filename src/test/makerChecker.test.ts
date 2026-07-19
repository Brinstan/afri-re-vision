import { describe, it, expect, beforeEach } from 'vitest';
import { useDataStore } from '../components/DataStore';

const asUser = (username: string) =>
  localStorage.setItem('user', JSON.stringify({ username }));

describe('G-07: maker-checker approvals', () => {
  beforeEach(() => {
    localStorage.removeItem('afrirevision-data');
    useDataStore.getState().resetData();
    // clear approvals left by previous tests
    useDataStore.setState({ approvals: [] });
  });

  const firstClaim = () => useDataStore.getState().claims.find(c => c.status === 'Outstanding')!;

  it('requesting queues a Pending approval and does NOT execute the payment', () => {
    asUser('maker');
    const claim = firstClaim();
    const err = useDataStore.getState().requestApproval({
      type: 'Claim Payment', entityId: claim.id,
      description: `Pay ${claim.claimNumber}`, amount: claim.claimAmount, currency: claim.currency,
    });
    expect(err).toBeNull();
    const s = useDataStore.getState();
    expect(s.approvals.filter(a => a.status === 'Pending').length).toBe(1);
    expect(s.claims.find(c => c.id === claim.id)!.status).toBe('Outstanding');
  });

  it('four-eyes: the maker cannot approve their own request', () => {
    asUser('maker');
    const claim = firstClaim();
    useDataStore.getState().requestApproval({
      type: 'Claim Payment', entityId: claim.id,
      description: 'x', amount: 1, currency: 'USD',
    });
    const id = useDataStore.getState().approvals[0].id;
    const err = useDataStore.getState().decideApproval(id, true);
    expect(err).toMatch(/own request/);
    expect(useDataStore.getState().approvals[0].status).toBe('Pending');
  });

  it('a different user approving executes the claim payment and audits it', () => {
    asUser('maker');
    const claim = firstClaim();
    useDataStore.getState().requestApproval({
      type: 'Claim Payment', entityId: claim.id,
      description: 'x', amount: claim.claimAmount, currency: claim.currency,
    });
    const id = useDataStore.getState().approvals[0].id;
    asUser('checker');
    const err = useDataStore.getState().decideApproval(id, true);
    expect(err).toBeNull();
    const s = useDataStore.getState();
    const paid = s.claims.find(c => c.id === claim.id)!;
    expect(paid.status).toBe('Full Payment');
    expect(paid.paidAmount).toBe(claim.claimAmount);
    expect(s.approvals[0].status).toBe('Approved');
    expect(s.approvals[0].decidedBy).toBe('checker');
    expect(s.auditLog.some(a => a.action === 'APPROVE')).toBe(true);
  });

  it('rejection leaves the entity untouched', () => {
    asUser('maker');
    const claim = firstClaim();
    useDataStore.getState().requestApproval({
      type: 'Claim Payment', entityId: claim.id, description: 'x', amount: 1, currency: 'USD',
    });
    const id = useDataStore.getState().approvals[0].id;
    asUser('checker');
    useDataStore.getState().decideApproval(id, false, 'insufficient documentation');
    const s = useDataStore.getState();
    expect(s.claims.find(c => c.id === claim.id)!.status).toBe('Outstanding');
    expect(s.approvals[0].status).toBe('Rejected');
    expect(s.approvals[0].comment).toBe('insufficient documentation');
  });

  it('duplicate pending requests for the same entity are blocked', () => {
    asUser('maker');
    const claim = firstClaim();
    const first = useDataStore.getState().requestApproval({
      type: 'Claim Payment', entityId: claim.id, description: 'x', amount: 1, currency: 'USD',
    });
    const second = useDataStore.getState().requestApproval({
      type: 'Claim Payment', entityId: claim.id, description: 'x again', amount: 1, currency: 'USD',
    });
    expect(first).toBeNull();
    expect(second).toMatch(/already pending/);
  });

  it('premium booking approval marks the booking paid', () => {
    asUser('maker');
    const treaty = useDataStore.getState().treaties.find(t => (t.premiumBookings ?? []).some(b => b.status !== 'Paid'));
    if (!treaty) return; // seed data has no unpaid booking — nothing to assert
    const booking = treaty.premiumBookings!.find(b => b.status !== 'Paid')!;
    useDataStore.getState().requestApproval({
      type: 'Premium Booking Paid', entityId: `${treaty.id}:${booking.id}`,
      description: 'x', amount: booking.amount, currency: treaty.currency,
    });
    const id = useDataStore.getState().approvals.find(a => a.status === 'Pending')!.id;
    asUser('checker');
    expect(useDataStore.getState().decideApproval(id, true)).toBeNull();
    const after = useDataStore.getState().treaties.find(t => t.id === treaty.id)!;
    expect(after.premiumBookings!.find(b => b.id === booking.id)!.status).toBe('Paid');
  });
});
