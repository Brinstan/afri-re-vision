import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import {
  AlertTriangle, Bell, CheckCircle, Download, FileText, Layers, Plus,
  RotateCcw, Save, Scale, Search, Shield, TrendingDown, Wallet
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDataStore, RetroProgramme, RetroClaim } from './DataStore';
import {
  buildMethodInputs, runAllMethods, DEFAULT_ASSUMPTIONS as ACTUARIAL_DEFAULTS, MethodKey
} from '@/lib/actuarial';
import { ALL_RETRO_FILTERS, RetroFilters } from '@/retrocession/types';
import { computeRecoveries, recoveryTotals, subjectPremium } from '@/retrocession/recoveryEngine';
import { Checkbox } from "@/components/ui/checkbox";
import { layerMetrics, programmeUtilization } from '@/retrocession/capacityEngine';
import { counterpartyMetrics, concentrationFlags } from '@/retrocession/counterpartyEngine';
import { validateAll } from '@/retrocession/validation';
import { programmeProfitability, portfolioProtection, exposureBy, lossPotential, recoveryAging } from '@/retrocession/analytics';
import {
  exportProgrammeSummaryCsv, exportRecoveryRegisterCsv, exportRetroClaimsRegisterCsv,
  exportCounterpartyCsv, exportCapacityCsv, exportExecutiveReport
} from '@/retrocession/reporting';

const fmt = (n: number) => Math.round(n).toLocaleString();
const fmtM = (n: number) => `${(n / 1_000_000).toFixed(2)}M`;

const PROGRAMME_TYPES: RetroProgramme['type'][] = ['Quota Share', 'Surplus', 'XOL', 'Stop Loss', 'Facultative', 'Catastrophe', 'Aggregate'];

const RetrocessionModule = () => {
  const {
    treaties, claims, retroProgrammes, retroClaims, retrocessionaires,
    addRetroProgramme, updateRetroProgramme, addRetroClaim, updateRetroClaim, addRetrocessionaire
  } = useDataStore();

  const [filters, setFilters] = useState<RetroFilters>(ALL_RETRO_FILTERS);
  const setFilter = <K extends keyof RetroFilters>(key: K, value: string) =>
    setFilters(f => ({ ...f, [key]: value }));

  // IBNR/incurred ratio from the actuarial engine (drives recovery reserves)
  const ibnrRatio = useMemo(() => {
    try {
      const saved = localStorage.getItem('afrirevision-actuarial-assumptions');
      const assumptions = saved ? { ...ACTUARIAL_DEFAULTS, ...JSON.parse(saved) } : ACTUARIAL_DEFAULTS;
      const methods = runAllMethods(buildMethodInputs(claims, treaties, assumptions));
      const key: MethodKey = assumptions.selectedMethod ?? 'chainLadder';
      const list = [methods.chainLadder, methods.bornhuetterFerguson, methods.capeCod, methods.expectedLossRatio];
      const selected = list.find(m => m.method === key) ?? methods.chainLadder;
      return selected.totals.incurred > 0 ? selected.totals.ibnr / selected.totals.incurred : 0;
    } catch { return 0; }
  }, [claims, treaties]);

  // ---- Filtered scope --------------------------------------------------------
  const scopedProgrammes = useMemo(() => retroProgrammes.filter(p =>
    (filters.programmeId === 'all' || p.id === filters.programmeId) &&
    (filters.broker === 'all' || p.retroBroker === filters.broker) &&
    (filters.status === 'all' || p.status === filters.status) &&
    (filters.lineOfBusiness === 'all' || p.linesOfBusiness.includes(filters.lineOfBusiness)) &&
    (filters.retrocessionaireId === 'all' ||
      p.layers.some(l => l.placements.some(pl => pl.retrocessionaireId === filters.retrocessionaireId))) &&
    (!filters.search ||
      [p.programmeCode, p.programmeName, p.retroBroker, p.territory]
        .some(v => v.toLowerCase().includes(filters.search.toLowerCase())))
  ), [retroProgrammes, filters]);

  // ---- Engine pipeline -------------------------------------------------------
  const recoveries = useMemo(
    () => computeRecoveries(claims, treaties, scopedProgrammes, retroClaims, ibnrRatio),
    [claims, treaties, scopedProgrammes, retroClaims, ibnrRatio]
  );
  const totals = useMemo(() => recoveryTotals(recoveries), [recoveries]);
  const layers = useMemo(() => layerMetrics(scopedProgrammes, recoveries), [scopedProgrammes, recoveries]);
  const counterparties = useMemo(
    () => counterpartyMetrics(retrocessionaires, scopedProgrammes, recoveries, retroClaims),
    [retrocessionaires, scopedProgrammes, recoveries, retroClaims]
  );
  const issues = useMemo(() => validateAll(scopedProgrammes, retroClaims, recoveries), [scopedProgrammes, retroClaims, recoveries]);
  const profitability = useMemo(() => programmeProfitability(scopedProgrammes, recoveries), [scopedProgrammes, recoveries]);
  const protection = useMemo(() => portfolioProtection(claims, recoveries), [claims, recoveries]);
  const aging = useMemo(() => recoveryAging(retroClaims), [retroClaims]);
  const potential = useMemo(() => lossPotential(scopedProgrammes), [scopedProgrammes]);
  const [exposureDim, setExposureDim] = useState<'country' | 'cedant' | 'broker' | 'lineOfBusiness' | 'treaty'>('lineOfBusiness');
  const exposure = useMemo(() => exposureBy(treaties, recoveries, claims, exposureDim), [treaties, recoveries, claims, exposureDim]);

  const scopedRetroClaims = useMemo(() => retroClaims.filter(rc =>
    (filters.programmeId === 'all' || rc.programmeId === filters.programmeId) &&
    (filters.recoveryStatus === 'all' || rc.status === filters.recoveryStatus)
  ), [retroClaims, filters]);

  const brokers = Array.from(new Set(retroProgrammes.map(p => p.retroBroker)));
  const lobs = Array.from(new Set(retroProgrammes.flatMap(p => p.linesOfBusiness)));
  const errorCount = issues.filter(i => i.severity === 'error').length;

  // ---- Dialog state ----------------------------------------------------------
  const [programmeDialogOpen, setProgrammeDialogOpen] = useState(false);
  const emptyProgrammeForm = {
    programmeName: '', type: 'XOL' as RetroProgramme['type'], effectiveDate: '', expiryDate: '',
    currency: 'USD', territory: 'East Africa', retroBroker: '',
    commissionPct: '', linesOfBusiness: [] as string[],
    // Quota Share
    cessionPct: '', eventLimit: '',
    // Surplus
    maxLinePerRisk: '', numberOfLines: '', avgCessionPct: '',
    // XOL / Catastrophe
    layerAttachment: '', layerLimit: '', rateOnLinePct: '', reinstatementsCount: '', reinstatementRatePct: '',
    // Stop Loss
    lossRatioAttachmentPct: '', lossRatioLimitPct: '', premiumRatePct: '',
    // Aggregate
    aggregateAttachment: '', aggregateLimit: '',
    // Facultative
    linkedTreatyId: '',
    // Premium (all types — auto-suggested, editable)
    layerPremium: ''
  };
  const [programmeForm, setProgrammeForm] = useState(emptyProgrammeForm);

  // LOBs available in the inward portfolio (the programme picks from these)
  const portfolioLobs = useMemo(
    () => Array.from(new Set(treaties.flatMap(t => t.lineOfBusiness))).sort(),
    [treaties]
  );

  // Live preview: which inward covers fall into the arrangement being drafted
  const draftCoveredTreaties = useMemo(() => {
    if (programmeForm.type === 'Facultative') {
      return treaties.filter(t => t.id === programmeForm.linkedTreatyId);
    }
    if (programmeForm.linesOfBusiness.length === 0) return [];
    return treaties.filter(t =>
      t.lineOfBusiness.some(lob => programmeForm.linesOfBusiness.includes(lob)) &&
      (!programmeForm.effectiveDate || !programmeForm.expiryDate ||
        (t.inceptionDate <= programmeForm.expiryDate && t.expiryDate >= programmeForm.effectiveDate))
    );
  }, [treaties, programmeForm.linesOfBusiness, programmeForm.linkedTreatyId, programmeForm.type, programmeForm.effectiveDate, programmeForm.expiryDate]);

  const draftSubjectPremium = draftCoveredTreaties.reduce((s, t) => s + t.premium, 0);

  // Auto-suggested retro premium per arrangement type (user can override)
  const suggestedPremium = useMemo(() => {
    const f = programmeForm;
    switch (f.type) {
      case 'Quota Share':
        return draftSubjectPremium * (parseFloat(f.cessionPct) || 0) / 100;
      case 'Surplus':
        return draftSubjectPremium * (parseFloat(f.avgCessionPct) || 0) / 100;
      case 'XOL':
      case 'Catastrophe':
        return (parseFloat(f.layerLimit) || 0) * (parseFloat(f.rateOnLinePct) || 0) / 100;
      case 'Stop Loss':
        return draftSubjectPremium * (parseFloat(f.premiumRatePct) || 0) / 100;
      default:
        return 0;
    }
  }, [programmeForm, draftSubjectPremium]);
  const [placementDialog, setPlacementDialog] = useState<{ programmeId: string; layerId: string } | null>(null);
  const [placementForm, setPlacementForm] = useState({ retrocessionaireId: '', signedLinePct: '', slipStatus: 'Signed' });
  const [settleDialog, setSettleDialog] = useState<RetroClaim | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [disputeDialog, setDisputeDialog] = useState<RetroClaim | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [counterpartyDialogOpen, setCounterpartyDialogOpen] = useState(false);
  const [counterpartyForm, setCounterpartyForm] = useState({ name: '', country: '', creditRating: '', financialStrength: '', capacityOffered: '' });

  // ---- Handlers --------------------------------------------------------------
  const handleCreateProgramme = () => {
    const f = programmeForm;
    const num = (v: string) => parseFloat(v) || 0;

    // ---- Common validation
    if (!f.programmeName || !f.retroBroker) { toast.error("Enter the programme name and retro broker"); return; }
    if (!f.effectiveDate || !f.expiryDate || new Date(f.expiryDate) <= new Date(f.effectiveDate)) {
      toast.error("Enter a valid coverage period (expiry after effective date)"); return;
    }
    if (f.type !== 'Facultative' && f.linesOfBusiness.length === 0) {
      toast.error("Select at least one line of business — the arrangement picks up all inward covers on those lines"); return;
    }
    if (f.type === 'Facultative' && !f.linkedTreatyId) {
      toast.error("Facultative retro protects one specific inward treaty — select it"); return;
    }
    if (f.type !== 'Facultative' && draftCoveredTreaties.length === 0) {
      toast.error("No inward treaties fall into this arrangement — check the lines of business and coverage period"); return;
    }

    const premium = num(f.layerPremium) || suggestedPremium;
    if (premium <= 0) { toast.error("Enter or accept a retro premium greater than zero"); return; }

    // ---- Type-specific validation + layer construction
    let layer: { attachmentPoint: number; limit: number; name: string };
    let cessionPct: number | undefined;
    let retention = 0;
    const extras: Partial<RetroProgramme> = {};

    switch (f.type) {
      case 'Quota Share': {
        const cession = num(f.cessionPct);
        if (cession <= 0 || cession > 100) { toast.error("Quota share cession must be between 0 and 100%"); return; }
        const eventLimit = num(f.eventLimit) || draftSubjectPremium * cession / 100;
        cessionPct = cession;
        retention = draftSubjectPremium * (100 - cession) / 100;
        layer = { attachmentPoint: 0, limit: eventLimit, name: `${cession}% Quota Share (event limit ${(eventLimit / 1_000_000).toFixed(1)}M)` };
        break;
      }
      case 'Surplus': {
        const maxLine = num(f.maxLinePerRisk);
        const lines = num(f.numberOfLines);
        const avgCession = num(f.avgCessionPct);
        if (maxLine <= 0) { toast.error("Enter the maximum line retained per risk"); return; }
        if (lines < 1) { toast.error("Enter the number of surplus lines (≥ 1)"); return; }
        if (avgCession <= 0 || avgCession > 100) { toast.error("Enter the estimated average cession % (0–100) — actual cession varies per risk with sum insured"); return; }
        cessionPct = avgCession;
        retention = maxLine;
        extras.maxLinePerRisk = maxLine;
        extras.numberOfLines = lines;
        layer = { attachmentPoint: 0, limit: maxLine * lines, name: `${lines}-line Surplus (max line ${(maxLine / 1_000_000).toFixed(1)}M, capacity ${((maxLine * lines) / 1_000_000).toFixed(1)}M)` };
        break;
      }
      case 'XOL':
      case 'Catastrophe': {
        const attachment = num(f.layerAttachment);
        const limit = num(f.layerLimit);
        if (attachment <= 0) { toast.error("Enter the layer attachment point (your retention per event)"); return; }
        if (limit <= 0) { toast.error("Enter the layer limit"); return; }
        retention = attachment;
        extras.reinstatementsCount = num(f.reinstatementsCount) || undefined;
        extras.reinstatementRatePct = num(f.reinstatementRatePct) || undefined;
        layer = {
          attachmentPoint: attachment, limit,
          name: `${f.type === 'Catastrophe' ? 'Cat ' : ''}Layer — ${(limit / 1_000_000).toFixed(0)}M xs ${(attachment / 1_000_000).toFixed(0)}M${extras.reinstatementsCount ? ` (${extras.reinstatementsCount} reinst @ ${extras.reinstatementRatePct ?? 100}%)` : ''}`
        };
        break;
      }
      case 'Stop Loss': {
        const lrAttach = num(f.lossRatioAttachmentPct);
        const lrLimit = num(f.lossRatioLimitPct);
        if (lrAttach <= 0 || lrLimit <= 0) { toast.error("Enter attachment and exhaustion loss ratios (% of subject premium)"); return; }
        if (lrLimit <= lrAttach) { toast.error(`Exhaustion (${lrLimit}%) must exceed the attachment (${lrAttach}%)`); return; }
        extras.lossRatioAttachmentPct = lrAttach;
        extras.lossRatioLimitPct = lrLimit;
        retention = draftSubjectPremium * lrAttach / 100;
        layer = {
          attachmentPoint: retention,
          limit: draftSubjectPremium * (lrLimit - lrAttach) / 100,
          name: `Stop Loss ${lrLimit}% xs ${lrAttach}% of subject premium`
        };
        break;
      }
      case 'Aggregate': {
        const aggAttach = num(f.aggregateAttachment);
        const aggLimit = num(f.aggregateLimit);
        if (aggLimit <= 0) { toast.error("Enter the annual aggregate limit"); return; }
        extras.aggregateAttachment = aggAttach;
        extras.aggregateLimit = aggLimit;
        retention = aggAttach;
        layer = { attachmentPoint: aggAttach, limit: aggLimit, name: `Annual Aggregate ${(aggLimit / 1_000_000).toFixed(0)}M xs ${(aggAttach / 1_000_000).toFixed(0)}M` };
        break;
      }
      case 'Facultative': {
        const attachment = num(f.layerAttachment);
        const limit = num(f.layerLimit);
        if (limit <= 0) { toast.error("Enter the facultative cover limit"); return; }
        const linked = treaties.find(t => t.id === f.linkedTreatyId);
        extras.linkedTreatyId = f.linkedTreatyId;
        retention = attachment;
        layer = { attachmentPoint: attachment, limit, name: `Fac on ${linked?.treatyName ?? 'treaty'} — ${(limit / 1_000_000).toFixed(1)}M xs ${(attachment / 1_000_000).toFixed(1)}M` };
        break;
      }
    }

    const code = `RP-${new Date(f.effectiveDate).getFullYear()}-${String(retroProgrammes.length + 1).padStart(3, '0')}`;
    const linkedTreaty = treaties.find(t => t.id === f.linkedTreatyId);
    addRetroProgramme({
      id: `rp-${Date.now()}`,
      programmeCode: code,
      programmeName: f.programmeName,
      type: f.type,
      effectiveDate: f.effectiveDate,
      expiryDate: f.expiryDate,
      currency: f.currency,
      linesOfBusiness: f.type === 'Facultative' ? (linkedTreaty?.lineOfBusiness ?? []) : f.linesOfBusiness,
      territory: f.territory,
      cedingCompany: 'AfriRe Tanzania',
      retroBroker: f.retroBroker,
      retention,
      cessionPct,
      commissionPct: num(f.commissionPct),
      status: 'Active',
      renewalStatus: 'New',
      ...extras,
      layers: [{
        id: `rl-${Date.now()}`,
        name: layer.name,
        attachmentPoint: layer.attachmentPoint,
        limit: layer.limit,
        premium,
        placements: []
      }]
    });
    setProgrammeDialogOpen(false);
    setProgrammeForm(emptyProgrammeForm);
    toast.success(
      `Programme ${code} created covering ${f.type === 'Facultative' ? 1 : draftCoveredTreaties.length} inward ${draftCoveredTreaties.length === 1 ? 'treaty' : 'treaties'} — place the layer next (signed lines must reach 100%)`
    );
  };

  const handleAddPlacement = () => {
    if (!placementDialog) return;
    const pct = parseFloat(placementForm.signedLinePct);
    if (!placementForm.retrocessionaireId) { toast.error("Select a retrocessionaire"); return; }
    if (isNaN(pct) || pct <= 0 || pct > 100) { toast.error("Signed line must be between 0 and 100%"); return; }
    const programme = retroProgrammes.find(p => p.id === placementDialog.programmeId);
    const layer = programme?.layers.find(l => l.id === placementDialog.layerId);
    if (!programme || !layer) return;
    if (layer.placements.some(pl => pl.retrocessionaireId === placementForm.retrocessionaireId)) {
      toast.error("This retrocessionaire already participates on the layer"); return;
    }
    const existing = layer.placements.reduce((s, pl) => s + pl.signedLinePct, 0);
    if (existing + pct > 100.01) {
      toast.error(`Over-placement: ${existing.toFixed(1)}% already signed, only ${(100 - existing).toFixed(1)}% remains`);
      return;
    }
    updateRetroProgramme(programme.id, {
      layers: programme.layers.map(l => l.id === layer.id
        ? { ...l, placements: [...l.placements, { retrocessionaireId: placementForm.retrocessionaireId, signedLinePct: pct, slipStatus: placementForm.slipStatus as 'Signed' }] }
        : l)
    });
    setPlacementDialog(null);
    setPlacementForm({ retrocessionaireId: '', signedLinePct: '', slipStatus: 'Signed' });
    const newTotal = existing + pct;
    toast.success(`Placement added — layer now ${newTotal.toFixed(1)}% placed${Math.abs(newTotal - 100) < 0.01 ? ' (fully placed)' : ''}`);
  };

  const handleNotifyRecovery = (recovery: typeof recoveries[number]) => {
    if (recovery.outstandingRecovery <= 0) { toast.info("Nothing outstanding to notify on this recovery"); return; }
    addRetroClaim({
      id: `rcl-${Date.now()}`,
      originalClaimId: recovery.claimId,
      programmeId: recovery.programmeId,
      layerId: recovery.layerId,
      notificationDate: new Date().toISOString().split('T')[0],
      expectedRecovery: recovery.outstandingRecovery,
      settledRecovery: 0,
      status: 'Notified',
      notes: `Auto-notified from recovery engine — claim ${recovery.claimNumber}`
    });
    toast.success(`Recovery notified to markets on ${recovery.programmeCode} / ${recovery.layerName}`);
  };

  const handleSettle = () => {
    if (!settleDialog) return;
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid settlement amount"); return; }
    if (amount > settleDialog.expectedRecovery - settleDialog.settledRecovery + 0.01) {
      toast.error("Settlement cannot exceed the outstanding expected recovery"); return;
    }
    updateRetroClaim(settleDialog.id, {
      settledRecovery: settleDialog.settledRecovery + amount,
      settlementDate: new Date().toISOString().split('T')[0],
      status: 'Settled'
    });
    setSettleDialog(null);
    setSettleAmount('');
    toast.success(`Recovery of ${fmt(amount)} settled — cash and ledger journals update automatically in Accounting`);
  };

  const handleDispute = () => {
    if (!disputeDialog) return;
    if (!disputeReason) { toast.error("Enter the dispute reason"); return; }
    updateRetroClaim(disputeDialog.id, { status: 'Disputed', disputeReason });
    setDisputeDialog(null);
    setDisputeReason('');
    toast.success("Retro claim marked as disputed");
  };

  const handleAddCounterparty = () => {
    if (!counterpartyForm.name || !counterpartyForm.creditRating) { toast.error("Enter the name and credit rating"); return; }
    const capacity = parseFloat(counterpartyForm.capacityOffered);
    if (isNaN(capacity) || capacity <= 0) { toast.error("Enter a valid offered capacity"); return; }
    addRetrocessionaire({
      id: `rc-${Date.now()}`,
      name: counterpartyForm.name,
      country: counterpartyForm.country || '—',
      creditRating: counterpartyForm.creditRating,
      financialStrength: counterpartyForm.financialStrength || 'Not rated',
      capacityOffered: capacity
    });
    setCounterpartyDialogOpen(false);
    setCounterpartyForm({ name: '', country: '', creditRating: '', financialStrength: '', capacityOffered: '' });
    toast.success("Retrocessionaire added to the security panel");
  };

  const handleExecutiveReport = () => {
    const ok = exportExecutiveReport({ profitability, counterparties, protection, totals, retrocessionaires });
    if (ok) toast.success("Executive report opened — use the print dialog to save as PDF");
    else toast.error("Pop-up blocked — allow pop-ups to export the report");
  };

  const rcName = (id: string) => retrocessionaires.find(r => r.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Retrocession Management Platform</h2>
          <p className="text-gray-600">
            {retroProgrammes.length} programmes · {retrocessionaires.length} markets · recoveries recompute live from claims
          </p>
        </div>
        <div className="flex space-x-2">
          {errorCount > 0 && (
            <Badge variant="destructive" className="self-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {errorCount} validation error{errorCount > 1 ? 's' : ''}
            </Badge>
          )}
          <Button onClick={handleExecutiveReport}>
            <FileText className="h-4 w-4 mr-2" />
            Executive Report (PDF)
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Select value={filters.programmeId} onValueChange={(v) => setFilter('programmeId', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programmes</SelectItem>
                {retroProgrammes.map(p => <SelectItem key={p.id} value={p.id}>{p.programmeCode}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.retrocessionaireId} onValueChange={(v) => setFilter('retrocessionaireId', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All retrocessionaires</SelectItem>
                {retrocessionaires.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.broker} onValueChange={(v) => setFilter('broker', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All brokers</SelectItem>
                {brokers.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => setFilter('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {['Active', 'Pending', 'Expired', 'Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.lineOfBusiness} onValueChange={(v) => setFilter('lineOfBusiness', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All lines</SelectItem>
                {lobs.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search…" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
            </div>
          </div>
          {Object.entries(filters).some(([k, v]) => v !== (ALL_RETRO_FILTERS as Record<string, string>)[k]) && (
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setFilters(ALL_RETRO_FILTERS)}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Headline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Portfolio Protection', value: `${protection.protectionPct.toFixed(1)}%`, sub: `Gross ${fmtM(protection.grossClaims)} → Net ${fmtM(protection.netClaims)}`, icon: <Shield className="h-4 w-4" /> },
          { label: 'Expected Recoveries', value: fmtM(totals.expected), sub: `Paid ${fmtM(totals.paid)}`, icon: <Wallet className="h-4 w-4" /> },
          { label: 'Outstanding Recoveries', value: fmtM(totals.outstanding), sub: `Reserve ${fmtM(totals.reserve)} (IBNR-loaded)`, icon: <Scale className="h-4 w-4" /> },
          { label: 'MPL / PML', value: fmtM(potential.maxPossibleLoss), sub: `PML ${fmtM(potential.probableMaximumLoss)}`, icon: <TrendingDown className="h-4 w-4" /> }
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="programmes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="programmes">Programmes</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
          <TabsTrigger value="recoveries">Recoveries</TabsTrigger>
          <TabsTrigger value="retro-claims">Retro Claims</TabsTrigger>
          <TabsTrigger value="counterparties">Counterparties</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------ Programmes */}
        <TabsContent value="programmes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Retrocession Programmes</h3>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={() => { exportProgrammeSummaryCsv(scopedProgrammes, profitability); toast.success("Programme summary exported"); }}>
                <Download className="h-3 w-3 mr-1" />
                CSV
              </Button>
              <Button size="sm" onClick={() => setProgrammeDialogOpen(true)}>
                <Plus className="h-3 w-3 mr-1" />
                New Programme
              </Button>
            </div>
          </div>

          {scopedProgrammes.map(p => {
            const prof = profitability.find(x => x.programmeId === p.id);
            const util = programmeUtilization(p, layers);
            return (
              <Card key={p.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {p.programmeCode} — {p.programmeName}
                        <Badge className="ml-2" variant={p.status === 'Active' ? 'secondary' : 'outline'}>{p.status}</Badge>
                        <Badge className="ml-1" variant="outline">{p.type}</Badge>
                        <Badge className="ml-1" variant="outline">{p.renewalStatus}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {p.effectiveDate} → {p.expiryDate} · {p.currency} · {p.territory} · Broker: {p.retroBroker} · Lines: {p.linesOfBusiness.join(', ')}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      {p.status === 'Active' && (
                        <Button size="sm" variant="outline" onClick={() => {
                          updateRetroProgramme(p.id, { renewalStatus: 'Mid-term Adjustment' });
                          toast.success(`${p.programmeCode} flagged for mid-term adjustment`);
                        }}>
                          Mid-term Adjust
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => {
                        updateRetroProgramme(p.id, { status: p.status === 'Active' ? 'Expired' : 'Active' });
                        toast.success(`${p.programmeCode} ${p.status === 'Active' ? 'expired' : 'reactivated'}`);
                      }}>
                        {p.status === 'Active' ? 'Expire' : 'Reactivate'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Retention</p><p className="font-bold">{fmt(p.retention)}</p></div>
                    <div><p className="text-muted-foreground">Capacity</p><p className="font-bold">{fmt(prof?.capacity ?? 0)}</p></div>
                    <div><p className="text-muted-foreground">Retro Premium</p><p className="font-bold">{fmt(prof?.retroPremium ?? 0)}</p></div>
                    <div><p className="text-muted-foreground">Expected Recoveries</p><p className="font-bold text-green-600">{fmt(prof?.expectedRecoveries ?? 0)}</p></div>
                    <div><p className="text-muted-foreground">Net Cost</p><p className={`font-bold ${(prof?.netCost ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(prof?.netCost ?? 0)}</p></div>
                  </div>
                  {/* Layer structure visual */}
                  <div className="space-y-2">
                    {layers.filter(l => l.programmeId === p.id).map(l => (
                      <div key={l.layerId}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{l.layerName} · attaches {fmt(l.attachmentPoint)}, exhausts {fmt(l.exhaustionPoint)}</span>
                          <span>{l.utilizationPct.toFixed(1)}% utilised · {fmt(l.remainingCapacity)} remaining · lines {l.placementTotalPct.toFixed(0)}%</span>
                        </div>
                        <Progress value={Math.min(100, l.utilizationPct)} className="h-2" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Programme utilization {util.toFixed(1)}% · Commission {p.commissionPct}%{p.cessionPct ? ` · Cession ${p.cessionPct}%` : ''}
                    {p.type === 'Stop Loss' && p.lossRatioAttachmentPct ? ` · ${p.lossRatioLimitPct}% xs ${p.lossRatioAttachmentPct}% LR` : ''}
                    {p.maxLinePerRisk ? ` · Max line ${fmt(p.maxLinePerRisk)} × ${p.numberOfLines} lines` : ''}
                    {p.reinstatementsCount ? ` · ${p.reinstatementsCount} reinst @ ${p.reinstatementRatePct ?? 100}%` : ''}
                  </p>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    Covers {p.linkedTreatyId
                      ? `1 linked treaty (${treaties.find(t => t.id === p.linkedTreatyId)?.treatyName ?? '—'})`
                      : `${treaties.filter(t =>
                          t.lineOfBusiness.some(lob => p.linesOfBusiness.includes(lob)) &&
                          t.inceptionDate <= p.expiryDate && t.expiryDate >= p.effectiveDate
                        ).length} inward treaties on ${p.linesOfBusiness.join(', ')}`}
                    {' '}· subject premium {p.currency} {fmt(subjectPremium(p, treaties))} — new treaties on these lines fall in automatically
                  </p>
                </CardContent>
              </Card>
            );
          })}
          {scopedProgrammes.length === 0 && (
            <Card><CardContent className="py-10 text-center text-muted-foreground">
              <Layers className="h-8 w-8 mx-auto mb-2" />
              No programmes match the current filters.
            </CardContent></Card>
          )}
        </TabsContent>

        {/* ------------------------------------------------ Placements */}
        <TabsContent value="placements" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Placement Management</h3>
            <Button size="sm" variant="outline" onClick={() => { exportCapacityCsv(layers); toast.success("Capacity report exported"); }}>
              <Download className="h-3 w-3 mr-1" />
              Capacity CSV
            </Button>
          </div>
          {scopedProgrammes.flatMap(p => p.layers.map(layer => {
            const placed = layer.placements.reduce((s, pl) => s + pl.signedLinePct, 0);
            const fullyPlaced = Math.abs(placed - 100) < 0.01;
            return (
              <Card key={layer.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{p.programmeCode} · {layer.name}</CardTitle>
                    <CardDescription>
                      Premium {fmt(layer.premium)} · Signed lines {placed.toFixed(1)}%
                      {fullyPlaced
                        ? <Badge className="ml-2" variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Fully placed</Badge>
                        : <Badge className="ml-2" variant={placed > 100 ? 'destructive' : 'default'}>{placed > 100 ? 'Over-placed' : `${(100 - placed).toFixed(1)}% open`}</Badge>}
                    </CardDescription>
                  </div>
                  {!fullyPlaced && placed < 100 && (
                    <Button size="sm" onClick={() => setPlacementDialog({ programmeId: p.id, layerId: layer.id })}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Placement
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Retrocessionaire</TableHead>
                        <TableHead>Security</TableHead>
                        <TableHead className="text-right">Signed Line</TableHead>
                        <TableHead className="text-right">Capacity Share</TableHead>
                        <TableHead className="text-right">Premium Share</TableHead>
                        <TableHead>Slip Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {layer.placements.map(pl => {
                        const rc = retrocessionaires.find(r => r.id === pl.retrocessionaireId);
                        return (
                          <TableRow key={pl.retrocessionaireId}>
                            <TableCell className="font-medium">{rc?.name ?? pl.retrocessionaireId}</TableCell>
                            <TableCell><Badge variant="outline">{rc?.creditRating ?? '—'}</Badge> <span className="text-xs text-muted-foreground">{rc?.financialStrength}</span></TableCell>
                            <TableCell className="text-right font-mono">{pl.signedLinePct.toFixed(1)}%</TableCell>
                            <TableCell className="text-right font-mono">{fmt(layer.limit * pl.signedLinePct / 100)}</TableCell>
                            <TableCell className="text-right font-mono">{fmt(layer.premium * pl.signedLinePct / 100)}</TableCell>
                            <TableCell><Badge variant={pl.slipStatus === 'Bound' ? 'secondary' : 'outline'}>{pl.slipStatus}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {layer.placements.length === 0 && <p className="text-center text-muted-foreground py-4">No placements yet — the layer is 100% open.</p>}
                </CardContent>
              </Card>
            );
          }))}
        </TabsContent>

        {/* ------------------------------------------------ Recoveries */}
        <TabsContent value="recoveries" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recovery Engine</CardTitle>
                <CardDescription>
                  Automatic per-claim allocation across programme layers · reserves loaded with the actuarial IBNR ratio ({(ibnrRatio * 100).toFixed(1)}%)
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => { exportRecoveryRegisterCsv(recoveries); toast.success("Recovery register exported"); }}>
                <Download className="h-3 w-3 mr-1" />
                Recovery Register CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim</TableHead>
                      <TableHead>Programme / Layer</TableHead>
                      <TableHead className="text-right">Gross Loss</TableHead>
                      <TableHead className="text-right">Retention</TableHead>
                      <TableHead className="text-right">Recoverable</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-right">Reserve</TableHead>
                      <TableHead className="text-right">Net Retained</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recoveries.map((r, i) => {
                      const alreadyNotified = retroClaims.some(rc =>
                        rc.originalClaimId === r.claimId && rc.programmeId === r.programmeId && rc.layerId === r.layerId && rc.status !== 'Settled');
                      return (
                        <TableRow key={i}>
                          <TableCell>
                            <p className="font-mono text-xs">{r.claimNumber}</p>
                            <p className="text-xs text-muted-foreground">{r.treatyName}</p>
                          </TableCell>
                          <TableCell className="text-xs">{r.programmeCode}<br />{r.layerName}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(r.grossLoss)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(r.retention)}</TableCell>
                          <TableCell className="text-right font-mono text-blue-600">{fmt(r.recoverableAmount)}</TableCell>
                          <TableCell className="text-right font-mono text-green-600">{fmt(r.paidRecovery)}</TableCell>
                          <TableCell className="text-right font-mono text-red-600">{fmt(r.outstandingRecovery)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(r.recoveryReserve)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(r.netRetainedLoss)}</TableCell>
                          <TableCell>
                            {r.outstandingRecovery > 0 && !alreadyNotified && (
                              <Button size="sm" variant="outline" onClick={() => handleNotifyRecovery(r)}>
                                <Bell className="h-3 w-3 mr-1" />
                                Notify
                              </Button>
                            )}
                            {alreadyNotified && <Badge variant="outline">Notified</Badge>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {recoveries.length === 0 && (
                <p className="text-center text-muted-foreground py-6">
                  No recoverable claims for the current programme scope — recoveries appear automatically when claims breach programme attachments.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Retro Claims */}
        <TabsContent value="retro-claims" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Retro Claims Lifecycle</CardTitle>
                <CardDescription>Notification → Approval → Settlement (or Dispute) · settlements post cash and ledger entries automatically</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Select value={filters.recoveryStatus} onValueChange={(v) => setFilter('recoveryStatus', v)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {['Notified', 'Approved', 'Settled', 'Disputed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => { exportRetroClaimsRegisterCsv(scopedRetroClaims, retroProgrammes); toast.success("Retro claims register exported"); }}>
                  <Download className="h-3 w-3 mr-1" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Retro Claim</TableHead>
                    <TableHead>Original Claim / Treaty</TableHead>
                    <TableHead>Programme / Layer</TableHead>
                    <TableHead>Notified</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Settled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedRetroClaims.map(rc => {
                    const originalClaim = claims.find(c => c.id === rc.originalClaimId);
                    const programme = retroProgrammes.find(p => p.id === rc.programmeId);
                    const layer = programme?.layers.find(l => l.id === rc.layerId);
                    return (
                      <TableRow key={rc.id}>
                        <TableCell className="font-mono text-xs">{rc.id}</TableCell>
                        <TableCell className="text-xs">
                          {originalClaim?.claimNumber ?? rc.originalClaimId}<br />
                          <span className="text-muted-foreground">{treaties.find(t => t.id === originalClaim?.treatyId)?.treatyName ?? ''}</span>
                        </TableCell>
                        <TableCell className="text-xs">{programme?.programmeCode}<br />{layer?.name}</TableCell>
                        <TableCell>{rc.notificationDate}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(rc.expectedRecovery)}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">{fmt(rc.settledRecovery)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            rc.status === 'Settled' ? 'secondary' :
                            rc.status === 'Disputed' ? 'destructive' :
                            rc.status === 'Approved' ? 'default' : 'outline'
                          }>{rc.status}</Badge>
                          {rc.disputeReason && <p className="text-xs text-red-600 mt-1">{rc.disputeReason}</p>}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {rc.status === 'Notified' && (
                              <Button size="sm" variant="outline" onClick={() => {
                                updateRetroClaim(rc.id, { status: 'Approved' });
                                toast.success(`${rc.id} approved for settlement`);
                              }}>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                            )}
                            {(rc.status === 'Approved' || rc.status === 'Notified') && (
                              <>
                                <Button size="sm" onClick={() => { setSettleDialog(rc); setSettleAmount(String(rc.expectedRecovery - rc.settledRecovery)); }}>
                                  <Wallet className="h-3 w-3 mr-1" />
                                  Settle
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setDisputeDialog(rc)}>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Dispute
                                </Button>
                              </>
                            )}
                            {rc.status === 'Disputed' && (
                              <Button size="sm" variant="outline" onClick={() => {
                                updateRetroClaim(rc.id, { status: 'Notified', disputeReason: undefined });
                                toast.success("Dispute resolved — retro claim reopened");
                              }}>
                                Resolve
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {scopedRetroClaims.length === 0 && (
                <p className="text-center text-muted-foreground py-6">No retro claims — notify recoveries from the Recoveries tab.</p>
              )}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {aging.map(bucket => (
                  <div key={bucket.label} className="border rounded-lg p-3 text-sm">
                    <p className="text-muted-foreground">{bucket.label}</p>
                    <p className="font-bold">{bucket.count} claim(s) · {fmt(bucket.amount)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Counterparties */}
        <TabsContent value="counterparties" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Counterparty Security Dashboard</h3>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={() => { exportCounterpartyCsv(counterparties); toast.success("Counterparty report exported"); }}>
                <Download className="h-3 w-3 mr-1" />
                CSV
              </Button>
              <Button size="sm" onClick={() => setCounterpartyDialogOpen(true)}>
                <Plus className="h-3 w-3 mr-1" />
                Add Retrocessionaire
              </Button>
            </div>
          </div>

          {concentrationFlags(counterparties).map(m => (
            <div key={m.id} className="flex items-start space-x-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm">
                Concentration risk: <span className="font-medium">{m.name}</span> holds {m.concentrationPct.toFixed(1)}% of placed capacity — consider diversifying above the 40% threshold.
              </p>
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {counterparties.map(m => (
              <Card key={m.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{m.name}</span>
                    <span>
                      <Badge variant="outline">{m.creditRating}</Badge>
                      <Badge className="ml-1" variant="secondary">{m.financialStrength}</Badge>
                    </span>
                  </CardTitle>
                  <CardDescription>{m.country} · {m.programmes.join(', ') || 'No participations'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-muted-foreground">Capacity Used / Offered</p><p className="font-bold">{fmt(m.capacityUsed)} / {fmt(m.capacityOffered)}</p></div>
                    <div><p className="text-muted-foreground">Exposure (expected recoveries)</p><p className="font-bold">{fmt(m.exposure)}</p></div>
                    <div><p className="text-muted-foreground">Outstanding Recoveries</p><p className="font-bold text-red-600">{fmt(m.outstandingRecoveries)}</p></div>
                    <div><p className="text-muted-foreground">Recovery Speed</p><p className="font-bold">{m.recoverySpeedDays === null ? '—' : `${Math.round(m.recoverySpeedDays)} days avg`}</p></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Concentration of placed capacity</span>
                      <span>{m.concentrationPct.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(100, m.concentrationPct)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ------------------------------------------------ Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gross vs Net Claims</CardTitle>
                <CardDescription>Portfolio protection from the retro programme</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={[{ name: 'Claims', Gross: Math.round(protection.grossClaims), Recoveries: Math.round(protection.expectedRecoveries), Net: Math.round(protection.netClaims) }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                    <ChartTooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="Gross" fill="#dc2626" />
                    <Bar dataKey="Recoveries" fill="#16a34a" />
                    <Bar dataKey="Net" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Programme Cost vs Recoveries</CardTitle>
                <CardDescription>Retro premium, commission, and expected recoveries</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={profitability.map(p => ({
                    name: p.programmeCode, Premium: Math.round(p.retroPremium), Commission: Math.round(p.commissionIncome), Recoveries: Math.round(p.expectedRecoveries)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                    <ChartTooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="Premium" fill="#9333ea" />
                    <Bar dataKey="Commission" fill="#eab308" />
                    <Bar dataKey="Recoveries" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Exposure Distribution</CardTitle>
                <CardDescription>Gross vs protected vs net exposure by dimension</CardDescription>
              </div>
              <Select value={exposureDim} onValueChange={(v) => setExposureDim(v as typeof exposureDim)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {([['lineOfBusiness', 'Line of Business'], ['country', 'Country'], ['cedant', 'Cedant'], ['broker', 'Broker'], ['treaty', 'Treaty']] as const).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{exposureDim === 'lineOfBusiness' ? 'Line of Business' : exposureDim[0].toUpperCase() + exposureDim.slice(1)}</TableHead>
                    <TableHead className="text-right">Gross Exposure</TableHead>
                    <TableHead className="text-right">Protected</TableHead>
                    <TableHead className="text-right">Net Exposure</TableHead>
                    <TableHead className="text-right">Protection %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exposure.map(row => (
                    <TableRow key={row.key}>
                      <TableCell className="font-medium">{row.key}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(row.grossExposure)}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">{fmt(row.protectedExposure)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(row.netExposure)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.grossExposure > 0 ? `${((row.protectedExposure / row.grossExposure) * 100).toFixed(1)}%` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Programme Profitability & Layer Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Programme</TableHead>
                    <TableHead className="text-right">Retro Premium</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Expected Recoveries</TableHead>
                    <TableHead className="text-right">Net Cost</TableHead>
                    <TableHead className="text-right">Recovery Ratio</TableHead>
                    <TableHead className="text-right">Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitability.map(p => (
                    <TableRow key={p.programmeId}>
                      <TableCell className="font-medium">{p.programmeCode}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(p.retroPremium)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(p.commissionIncome)}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">{fmt(p.expectedRecoveries)}</TableCell>
                      <TableCell className={`text-right font-mono ${p.netCost > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(p.netCost)}</TableCell>
                      <TableCell className="text-right font-mono">{p.recoveryRatio === null ? '—' : `${p.recoveryRatio.toFixed(1)}%`}</TableCell>
                      <TableCell className="text-right font-mono">{p.utilizationPct.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Validation */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validation Engine</CardTitle>
              <CardDescription>
                Placement totals, capacity limits, duplicates, overlapping layers, date consistency, and recovery amounts — evaluated live
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {issues.length === 0 ? (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-sm">All retrocession validations pass — programmes, placements, and retro claims are consistent.</p>
                </div>
              ) : issues.map((issue, i) => (
                <div key={i} className={`flex items-start space-x-2 p-3 rounded-lg ${issue.severity === 'error' ? 'bg-red-50 dark:bg-red-950' : 'bg-amber-50 dark:bg-amber-950'}`}>
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
                  <div>
                    <p className="text-sm">{issue.message}</p>
                    <p className="text-xs text-muted-foreground">{issue.scope} · {issue.severity}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---------------- New programme dialog (type-specific arrangement forms) */}
      <Dialog open={programmeDialogOpen} onOpenChange={setProgrammeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Retrocession Programme — {programmeForm.type}</DialogTitle>
            <DialogDescription>
              {programmeForm.type === 'Quota Share' && 'A fixed share of every covered inward treaty is ceded; premium follows the cession.'}
              {programmeForm.type === 'Surplus' && 'Cessions above your maximum line per risk, up to the number of lines. Actual cession varies by risk size.'}
              {programmeForm.type === 'XOL' && 'Per-risk/per-event excess of loss: recoveries when a loss exceeds the attachment, up to the layer limit.'}
              {programmeForm.type === 'Catastrophe' && 'Event-based excess of loss protecting accumulations from a single catastrophe across covered lines.'}
              {programmeForm.type === 'Stop Loss' && 'Aggregate protection: pays when the covered loss ratio exceeds the attachment, up to the exhaustion — both as % of subject premium.'}
              {programmeForm.type === 'Aggregate' && 'Annual aggregate cover: pays when total covered losses in the period exceed the monetary attachment, up to the aggregate limit.'}
              {programmeForm.type === 'Facultative' && 'Protects one specific inward treaty rather than a whole line of business.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* ---- Common details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Programme Name *</Label>
                <Input value={programmeForm.programmeName} onChange={(e) => setProgrammeForm(f => ({ ...f, programmeName: e.target.value }))} placeholder="e.g. Fire & Engineering Surplus 2025" />
              </div>
              <div className="space-y-2">
                <Label>Arrangement Type</Label>
                <Select value={programmeForm.type} onValueChange={(v) => setProgrammeForm(f => ({ ...f, type: v as RetroProgramme['type'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROGRAMME_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Effective Date *</Label>
                <Input type="date" value={programmeForm.effectiveDate} onChange={(e) => setProgrammeForm(f => ({ ...f, effectiveDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date *</Label>
                <Input type="date" value={programmeForm.expiryDate} onChange={(e) => setProgrammeForm(f => ({ ...f, expiryDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={programmeForm.currency} onValueChange={(v) => setProgrammeForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['USD', 'TZS', 'EUR', 'GBP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Retro Broker *</Label>
                <Input value={programmeForm.retroBroker} onChange={(e) => setProgrammeForm(f => ({ ...f, retroBroker: e.target.value }))} placeholder="e.g. Guy Carpenter" />
              </div>
              <div className="space-y-2">
                <Label>Territory</Label>
                <Input value={programmeForm.territory} onChange={(e) => setProgrammeForm(f => ({ ...f, territory: e.target.value }))} />
              </div>
            </div>

            {/* ---- Business covered: LOB auto-pick or fac treaty link */}
            {programmeForm.type === 'Facultative' ? (
              <div className="space-y-2">
                <Label>Protected Inward Treaty *</Label>
                <Select value={programmeForm.linkedTreatyId} onValueChange={(v) => setProgrammeForm(f => ({ ...f, linkedTreatyId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select the treaty this fac protects" /></SelectTrigger>
                  <SelectContent>
                    {treaties.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.treatyName} ({t.contractNumber}) — {t.lineOfBusiness.join(', ')} · premium {fmt(t.premium)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Lines of Business Covered * <span className="text-xs text-muted-foreground font-normal">(from your inward portfolio — every treaty on these lines falls into the cover)</span></Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-lg p-3">
                  {portfolioLobs.map(lob => (
                    <div key={lob} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lob-${lob}`}
                        checked={programmeForm.linesOfBusiness.includes(lob)}
                        onCheckedChange={(checked) => setProgrammeForm(f => ({
                          ...f,
                          linesOfBusiness: checked
                            ? [...f.linesOfBusiness, lob]
                            : f.linesOfBusiness.filter(l => l !== lob)
                        }))}
                      />
                      <Label htmlFor={`lob-${lob}`} className="text-sm font-normal">{lob}</Label>
                    </div>
                  ))}
                  {portfolioLobs.length === 0 && <p className="text-sm text-muted-foreground col-span-3">No inward treaties exist yet — write business first.</p>}
                </div>
              </div>
            )}

            {/* ---- Live covered-business preview */}
            {(programmeForm.linesOfBusiness.length > 0 || programmeForm.linkedTreatyId) && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm space-y-1">
                <p className="font-medium">
                  {draftCoveredTreaties.length} inward {draftCoveredTreaties.length === 1 ? 'treaty falls' : 'treaties fall'} into this arrangement
                  · subject premium {programmeForm.currency} {fmt(draftSubjectPremium)}
                </p>
                {draftCoveredTreaties.slice(0, 5).map(t => (
                  <p key={t.id} className="text-xs text-muted-foreground">
                    • {t.treatyName} ({t.lineOfBusiness.join(', ')}) — premium {fmt(t.premium)}
                  </p>
                ))}
                {draftCoveredTreaties.length > 5 && <p className="text-xs text-muted-foreground">…and {draftCoveredTreaties.length - 5} more</p>}
                {draftCoveredTreaties.length === 0 && <p className="text-xs text-red-600">Nothing matches yet — adjust the lines or coverage period.</p>}
              </div>
            )}

            {/* ---- Type-specific arrangement terms */}
            {programmeForm.type === 'Quota Share' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cession % *</Label>
                  <Input type="number" step="0.5" value={programmeForm.cessionPct} onChange={(e) => setProgrammeForm(f => ({ ...f, cessionPct: e.target.value }))} placeholder="25" />
                </div>
                <div className="space-y-2">
                  <Label>Event Limit <span className="text-xs text-muted-foreground font-normal">(optional cap per loss)</span></Label>
                  <Input type="number" value={programmeForm.eventLimit} onChange={(e) => setProgrammeForm(f => ({ ...f, eventLimit: e.target.value }))} placeholder="defaults to ceded premium" />
                </div>
              </div>
            )}

            {programmeForm.type === 'Surplus' && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Max Line per Risk *</Label>
                  <Input type="number" value={programmeForm.maxLinePerRisk} onChange={(e) => setProgrammeForm(f => ({ ...f, maxLinePerRisk: e.target.value }))} placeholder="1000000" />
                </div>
                <div className="space-y-2">
                  <Label>Number of Lines *</Label>
                  <Input type="number" value={programmeForm.numberOfLines} onChange={(e) => setProgrammeForm(f => ({ ...f, numberOfLines: e.target.value }))} placeholder="9" />
                  {(parseFloat(programmeForm.maxLinePerRisk) || 0) > 0 && (parseFloat(programmeForm.numberOfLines) || 0) > 0 && (
                    <p className="text-xs text-muted-foreground">Capacity: {fmt((parseFloat(programmeForm.maxLinePerRisk) || 0) * (parseFloat(programmeForm.numberOfLines) || 0))}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Est. Avg Cession % *</Label>
                  <Input type="number" step="0.5" value={programmeForm.avgCessionPct} onChange={(e) => setProgrammeForm(f => ({ ...f, avgCessionPct: e.target.value }))} placeholder="60" />
                  <p className="text-xs text-muted-foreground">Actual cession varies per risk with sum insured (no per-risk data yet)</p>
                </div>
              </div>
            )}

            {(programmeForm.type === 'XOL' || programmeForm.type === 'Catastrophe' || programmeForm.type === 'Facultative') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Attachment Point {programmeForm.type !== 'Facultative' && '*'} <span className="text-xs text-muted-foreground font-normal">(your retention per {programmeForm.type === 'Catastrophe' ? 'event' : 'risk'})</span></Label>
                  <Input type="number" value={programmeForm.layerAttachment} onChange={(e) => setProgrammeForm(f => ({ ...f, layerAttachment: e.target.value }))} placeholder="2000000" />
                </div>
                <div className="space-y-2">
                  <Label>Layer Limit *</Label>
                  <Input type="number" value={programmeForm.layerLimit} onChange={(e) => setProgrammeForm(f => ({ ...f, layerLimit: e.target.value }))} placeholder="8000000" />
                </div>
                {programmeForm.type !== 'Facultative' && (
                  <>
                    <div className="space-y-2">
                      <Label>Reinstatements</Label>
                      <Input type="number" value={programmeForm.reinstatementsCount} onChange={(e) => setProgrammeForm(f => ({ ...f, reinstatementsCount: e.target.value }))} placeholder="1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Reinstatement Rate %</Label>
                      <Input type="number" step="5" value={programmeForm.reinstatementRatePct} onChange={(e) => setProgrammeForm(f => ({ ...f, reinstatementRatePct: e.target.value }))} placeholder="100" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Rate on Line % <span className="text-xs text-muted-foreground font-normal">(drives the suggested premium: ROL × limit)</span></Label>
                      <Input type="number" step="0.5" value={programmeForm.rateOnLinePct} onChange={(e) => setProgrammeForm(f => ({ ...f, rateOnLinePct: e.target.value }))} placeholder="12" />
                    </div>
                  </>
                )}
              </div>
            )}

            {programmeForm.type === 'Stop Loss' && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Attachment Loss Ratio % *</Label>
                  <Input type="number" step="5" value={programmeForm.lossRatioAttachmentPct} onChange={(e) => setProgrammeForm(f => ({ ...f, lossRatioAttachmentPct: e.target.value }))} placeholder="80" />
                </div>
                <div className="space-y-2">
                  <Label>Exhaustion Loss Ratio % *</Label>
                  <Input type="number" step="5" value={programmeForm.lossRatioLimitPct} onChange={(e) => setProgrammeForm(f => ({ ...f, lossRatioLimitPct: e.target.value }))} placeholder="120" />
                  {draftSubjectPremium > 0 && (parseFloat(programmeForm.lossRatioLimitPct) || 0) > (parseFloat(programmeForm.lossRatioAttachmentPct) || 0) && (
                    <p className="text-xs text-muted-foreground">
                      ≈ cover of {fmt(draftSubjectPremium * ((parseFloat(programmeForm.lossRatioLimitPct) || 0) - (parseFloat(programmeForm.lossRatioAttachmentPct) || 0)) / 100)} on current subject premium
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Premium Rate % of Subject *</Label>
                  <Input type="number" step="0.25" value={programmeForm.premiumRatePct} onChange={(e) => setProgrammeForm(f => ({ ...f, premiumRatePct: e.target.value }))} placeholder="5" />
                </div>
              </div>
            )}

            {programmeForm.type === 'Aggregate' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Aggregate Attachment</Label>
                  <Input type="number" value={programmeForm.aggregateAttachment} onChange={(e) => setProgrammeForm(f => ({ ...f, aggregateAttachment: e.target.value }))} placeholder="5000000" />
                </div>
                <div className="space-y-2">
                  <Label>Annual Aggregate Limit *</Label>
                  <Input type="number" value={programmeForm.aggregateLimit} onChange={(e) => setProgrammeForm(f => ({ ...f, aggregateLimit: e.target.value }))} placeholder="20000000" />
                </div>
              </div>
            )}

            {/* ---- Premium & commission (all types) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Retro Premium *</Label>
                <Input
                  type="number"
                  value={programmeForm.layerPremium}
                  onChange={(e) => setProgrammeForm(f => ({ ...f, layerPremium: e.target.value }))}
                  placeholder={suggestedPremium > 0 ? `suggested: ${Math.round(suggestedPremium).toLocaleString()}` : 'enter premium'}
                />
                {suggestedPremium > 0 && !programmeForm.layerPremium && (
                  <p className="text-xs text-muted-foreground">Leave blank to accept the suggested {fmt(suggestedPremium)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Override Commission %</Label>
                <Input type="number" step="0.5" value={programmeForm.commissionPct} onChange={(e) => setProgrammeForm(f => ({ ...f, commissionPct: e.target.value }))} placeholder="10" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgrammeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateProgramme}><Save className="h-4 w-4 mr-2" />Create Programme</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Add placement dialog */}
      <Dialog open={!!placementDialog} onOpenChange={(open) => !open && setPlacementDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Placement</DialogTitle>
            <DialogDescription>Sign a line on the layer — total signed lines must not exceed 100%</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Retrocessionaire *</Label>
              <Select value={placementForm.retrocessionaireId} onValueChange={(v) => setPlacementForm(f => ({ ...f, retrocessionaireId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select market" /></SelectTrigger>
                <SelectContent>
                  {retrocessionaires.map(r => <SelectItem key={r.id} value={r.id}>{r.name} ({r.creditRating})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Signed Line % *</Label>
                <Input type="number" step="0.5" value={placementForm.signedLinePct} onChange={(e) => setPlacementForm(f => ({ ...f, signedLinePct: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Slip Status</Label>
                <Select value={placementForm.slipStatus} onValueChange={(v) => setPlacementForm(f => ({ ...f, slipStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Quoted', 'Signed', 'Bound'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlacementDialog(null)}>Cancel</Button>
            <Button onClick={handleAddPlacement}><Save className="h-4 w-4 mr-2" />Add Placement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Settle dialog */}
      <Dialog open={!!settleDialog} onOpenChange={(open) => !open && setSettleDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Settle Retro Recovery</DialogTitle>
            <DialogDescription>
              {settleDialog?.id} · outstanding {settleDialog ? fmt(settleDialog.expectedRecovery - settleDialog.settledRecovery) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Settlement Amount</Label>
            <Input type="number" value={settleAmount} onChange={(e) => setSettleAmount(e.target.value)} />
            <p className="text-xs text-muted-foreground">Posts Dr Bank / Cr Retro Recoverable in the general ledger and a receipt in the cash book.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleDialog(null)}>Cancel</Button>
            <Button onClick={handleSettle}><Wallet className="h-4 w-4 mr-2" />Settle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Dispute dialog */}
      <Dialog open={!!disputeDialog} onOpenChange={(open) => !open && setDisputeDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dispute Retro Claim</DialogTitle>
            <DialogDescription>{disputeDialog?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Dispute Reason *</Label>
            <Textarea rows={3} value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="e.g. Coverage interpretation on the hours clause" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDispute}><AlertTriangle className="h-4 w-4 mr-2" />Mark Disputed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Add counterparty dialog */}
      <Dialog open={counterpartyDialogOpen} onOpenChange={setCounterpartyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Retrocessionaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={counterpartyForm.name} onChange={(e) => setCounterpartyForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Hannover Re" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={counterpartyForm.country} onChange={(e) => setCounterpartyForm(f => ({ ...f, country: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Credit Rating *</Label>
                <Input value={counterpartyForm.creditRating} onChange={(e) => setCounterpartyForm(f => ({ ...f, creditRating: e.target.value }))} placeholder="AA-" />
              </div>
              <div className="space-y-2">
                <Label>Financial Strength</Label>
                <Input value={counterpartyForm.financialStrength} onChange={(e) => setCounterpartyForm(f => ({ ...f, financialStrength: e.target.value }))} placeholder="Superior" />
              </div>
              <div className="space-y-2">
                <Label>Capacity Offered *</Label>
                <Input type="number" value={counterpartyForm.capacityOffered} onChange={(e) => setCounterpartyForm(f => ({ ...f, capacityOffered: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterpartyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCounterparty}><Save className="h-4 w-4 mr-2" />Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RetrocessionModule;
