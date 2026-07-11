import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { AlertTriangle, Calculator, CheckCircle, Download, FileText, Save, Scale, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDataStore } from './DataStore';
import {
  PricingAssumptions, PricingRecord, PricingStructure, PricingTreatyType, PRICING_METHOD_LABELS
} from '@/pricing/types';
import {
  DEFAULT_PRICING_ASSUMPTIONS, loadPricingAssumptions, savePricingAssumptions, PRICING_HISTORY_KEY
} from '@/pricing/assumptions';
import { priceStructure } from '@/pricing/treatyPricing';
import { runScenarios } from '@/pricing/scenario';
import { validatePricing } from '@/pricing/validation';
import { rateAdequacyByLob } from '@/pricing/analytics';
import { exportPricingCsv, exportPricingMemoPdf } from '@/pricing/reporting';
import { STANDARD_LOBS, parseExperienceCsv, downloadExperienceTemplate, scopeExternalRows } from '@/pricing/externalData';
import { Progress } from "@/components/ui/progress";
import { Brain } from "lucide-react";
import { buildFeatures } from '@/pricing/ai/features';
import { riskScore, portfolioFit, appetiteAssessment, MODEL_REGISTRY } from '@/pricing/ai/models';
import { buildRecommendations, renewalRecommendations } from '@/pricing/ai/recommendations';
import { businessMixOptimization } from '@/pricing/ai/optimization';
import { Explanation } from '@/pricing/ai/types';

const fmt = (n: number) => Math.round(n).toLocaleString();
const fmtM = (n: number) => `${(n / 1_000_000).toFixed(2)}M`;

const TREATY_TYPES: PricingTreatyType[] = ['Quota Share', 'Surplus', 'XOL', 'Stop Loss', 'Catastrophe', 'Facultative'];

/** Renders an explanation: factor weights, confidence, sensitivity — no black boxes. */
const ExplanationBlock = ({ explanation }: { explanation: Explanation }) => (
  <div className="space-y-3 text-sm">
    <div className="space-y-2">
      {explanation.factors.map(factor => (
        <div key={factor.name}>
          <div className="flex justify-between text-xs mb-1">
            <span>
              {factor.name}: <span className="font-medium">{factor.value}</span>
              <Badge className="ml-2" variant={factor.direction === 'increases' ? 'destructive' : factor.direction === 'decreases' ? 'secondary' : 'outline'}>
                {factor.direction}
              </Badge>
            </span>
            <span className="text-muted-foreground">{factor.weightPct}% weight</span>
          </div>
          <Progress value={factor.weightPct} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-0.5">{factor.detail}</p>
        </div>
      ))}
    </div>
    <div className="flex items-center justify-between rounded bg-muted/50 px-3 py-2">
      <span className="text-xs">Confidence: <span className="font-bold">{explanation.confidencePct}%</span> — {explanation.confidenceBasis}</span>
    </div>
    {explanation.sensitivity.length > 0 && (
      <div>
        <p className="text-xs font-medium mb-1">Sensitivity (each variable shifted {explanation.sensitivity[0]?.shift}):</p>
        {explanation.sensitivity.map(s => (
          <p key={s.variable} className="text-xs text-muted-foreground">
            • {s.variable} → result moves {s.resultShiftPct >= 0 ? '+' : ''}{s.resultShiftPct.toFixed(1)}%
          </p>
        ))}
      </div>
    )}
  </div>
);

const loadHistory = (): PricingRecord[] => {
  try {
    const saved = localStorage.getItem(PRICING_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const PricingSystem = () => {
  const { treaties, claims, externalExperience, importExternalExperience, clearExternalExperience } = useDataStore();

  const [assumptions, setAssumptions] = useState<PricingAssumptions>(loadPricingAssumptions);
  useEffect(() => { savePricingAssumptions(assumptions); }, [assumptions]);
  const setAssumption = <K extends keyof PricingAssumptions>(key: K, value: number) =>
    setAssumptions(a => ({ ...a, [key]: value }));

  const [history, setHistory] = useState<PricingRecord[]>(loadHistory);
  useEffect(() => { localStorage.setItem(PRICING_HISTORY_KEY, JSON.stringify(history)); }, [history]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // ---- Structure being priced ------------------------------------------------
  const [treatyType, setTreatyType] = useState<PricingTreatyType>('XOL');
  const [selectedLobs, setSelectedLobs] = useState<string[]>([]);
  const [linkedTreatyId, setLinkedTreatyId] = useState('');
  const [cessionPct, setCessionPct] = useState('');
  const [attachment, setAttachment] = useState('');
  const [limit, setLimit] = useState('');
  const [lrAttachPct, setLrAttachPct] = useState('');
  const [lrExhaustPct, setLrExhaustPct] = useState('');
  const [subjectPremiumOverride, setSubjectPremiumOverride] = useState('');
  const [cedantFilter, setCedantFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Standard reinsurance lines merged with the live portfolio and imported data
  const portfolioLobs = useMemo(
    () => Array.from(new Set([
      ...STANDARD_LOBS,
      ...treaties.flatMap(t => t.lineOfBusiness),
      ...externalExperience.map(r => r.lineOfBusiness)
    ])).sort(),
    [treaties, externalExperience]
  );

  // Known cedants from the portfolio and imported history
  const knownCedants = useMemo(
    () => Array.from(new Set([
      ...treaties.map(t => t.cedant),
      ...externalExperience.map(r => r.cedant)
    ].filter(c => c && c !== 'Unknown'))).sort(),
    [treaties, externalExperience]
  );

  const scopeTreaties = useMemo(() => {
    let scoped = treaties;
    if (treatyType === 'Facultative') return treaties.filter(t => t.id === linkedTreatyId);
    if (cedantFilter !== 'all') scoped = scoped.filter(t => t.cedant === cedantFilter);
    if (contractFilter) scoped = scoped.filter(t => t.contractNumber.toLowerCase().includes(contractFilter.toLowerCase()));
    if (selectedLobs.length === 0) return [];
    return scoped.filter(t => t.lineOfBusiness.some(l => selectedLobs.includes(l)));
  }, [treaties, treatyType, linkedTreatyId, selectedLobs, cedantFilter, contractFilter]);

  const derivedSubjectPremium = scopeTreaties.reduce((s, t) => s + t.premium, 0);
  const subjectPremium = parseFloat(subjectPremiumOverride) || derivedSubjectPremium;

  const structure: PricingStructure = useMemo(() => ({
    treatyType,
    linesOfBusiness: treatyType === 'Facultative'
      ? (scopeTreaties[0]?.lineOfBusiness ?? [])
      : selectedLobs,
    subjectPremium,
    currency: scopeTreaties[0]?.currency ?? 'USD',
    cessionPct: parseFloat(cessionPct) || undefined,
    attachment: parseFloat(attachment) || undefined,
    limit: parseFloat(limit) || undefined,
    lrAttachPct: parseFloat(lrAttachPct) || undefined,
    lrExhaustPct: parseFloat(lrExhaustPct) || undefined,
    linkedTreatyId: treatyType === 'Facultative' ? linkedTreatyId || undefined : undefined,
    cedant: cedantFilter !== 'all' ? cedantFilter : undefined,
    contractNumber: contractFilter || undefined
  }), [treatyType, selectedLobs, subjectPremium, cessionPct, attachment, limit, lrAttachPct, lrExhaustPct, linkedTreatyId, scopeTreaties, cedantFilter, contractFilter]);

  const scopedExternalCount = useMemo(
    () => scopeExternalRows(externalExperience, structure).length,
    [externalExperience, structure]
  );

  // ---- Pricing pipeline (live) -------------------------------------------------
  const output = useMemo(() => priceStructure(claims, treaties, structure, assumptions, externalExperience), [claims, treaties, structure, assumptions, externalExperience]);
  const scenarios = useMemo(() => runScenarios(claims, treaties, structure, assumptions, externalExperience), [claims, treaties, structure, assumptions, externalExperience]);
  const issues = useMemo(() => validatePricing(structure, assumptions, output.buildUp, output.experience), [structure, assumptions, output]);
  const adequacy = useMemo(() => rateAdequacyByLob(treaties, claims, assumptions), [treaties, claims, assumptions]);
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const b = output.buildUp;

  // ---- Stage 6B: explainable AI layer (augments, never replaces, 6A) --------
  const features = useMemo(() => buildFeatures(structure, output, treaties, claims, adequacy), [structure, output, treaties, claims, adequacy]);
  const aiRisk = useMemo(() => riskScore(features), [features]);
  const aiFit = useMemo(() => portfolioFit(features), [features]);
  const aiAppetite = useMemo(() => appetiteAssessment(features), [features]);
  const aiRecs = useMemo(() => buildRecommendations(structure, output, features, assumptions), [structure, output, features, assumptions]);
  const renewals = useMemo(() => renewalRecommendations(treaties, claims), [treaties, claims]);
  const mix = useMemo(() => businessMixOptimization(treaties, adequacy), [treaties, adequacy]);

  const handleSavePricing = (outcome: PricingRecord['outcome']) => {
    if (errorCount > 0) { toast.error("Resolve validation errors before saving the pricing"); return; }
    if (b.officePremium <= 0) { toast.error("Nothing to save — the office premium is zero"); return; }
    const record: PricingRecord = {
      id: `pr-${Date.now()}`,
      date: new Date().toISOString(),
      treatyType,
      linesOfBusiness: structure.linesOfBusiness,
      subjectPremium,
      officePremium: b.officePremium,
      ratePct: b.ratePct,
      selectedBasis: output.selectedBasis,
      outcome
    };
    setHistory(prev => [...prev, record]);
    toast.success(`Pricing saved as ${outcome} — office premium ${structure.currency} ${fmt(b.officePremium)}`);
  };

  const handleExportMemo = () => {
    const ok = exportPricingMemoPdf({ structure, assumptions, output, scenarios, issues, adequacy });
    if (ok) toast.success("Pricing memo opened — use the print dialog to save as PDF");
    else toast.error("Pop-up blocked — allow pop-ups to export the memo");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error("Import a .csv file — in Excel use File → Save As → CSV");
      setImportErrors(['Only .csv files are supported. In Excel: File → Save As → CSV (Comma delimited).']);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseExperienceCsv(String(reader.result ?? ''));
      setImportErrors(result.errors);
      if (result.rows.length === 0) {
        toast.error("No valid rows found — check the column headers against the template");
      } else {
        importExternalExperience(
          result.rows.map((r, i) => ({ ...r, id: `ext-${Date.now()}-${i}`, source: file.name })),
          file.name
        );
        toast.success(`${result.rows.length} experience rows imported from ${file.name}${result.skipped > 0 ? ` (${result.skipped} skipped)` : ''} — pricing recomputed`);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const typeHelp: Record<PricingTreatyType, string> = {
    'Quota Share': 'Fixed share of every risk on the covered lines. Loss cost follows the cession.',
    'Surplus': 'Cessions above the retained line. Priced on the estimated ceded share (no per-risk profile yet).',
    'XOL': 'Per-risk excess of loss. Losses above the attachment, capped at the limit.',
    'Stop Loss': 'Aggregate protection on the annual loss ratio, as % of subject premium.',
    'Catastrophe': 'Per-event excess of loss for accumulations.',
    'Facultative': 'One specific inward treaty priced individually.'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pricing System</h2>
          <p className="text-gray-600">
            Deterministic actuarial pricing from live portfolio data · {claims.length} claims, {treaties.length} treaties in evidence
          </p>
        </div>
        <div className="flex space-x-2">
          {errorCount > 0 && (
            <Badge variant="destructive" className="self-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {errorCount} validation error{errorCount > 1 ? 's' : ''}
            </Badge>
          )}
          <Button variant="outline" onClick={() => setHistoryOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Pricing History ({history.length})
          </Button>
          <Button variant="outline" onClick={() => { exportPricingCsv(structure, output); toast.success("Pricing exercise exported as CSV"); }}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button onClick={handleExportMemo}>
            <FileText className="h-4 w-4 mr-2" />
            Pricing Memo (PDF)
          </Button>
        </div>
      </div>

      {/* Headline result */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Office Premium', value: `${structure.currency} ${fmtM(b.officePremium)}`, sub: output.selectedBasis, icon: <Calculator className="h-4 w-4" /> },
          { label: 'Technical Premium', value: `${structure.currency} ${fmtM(b.technicalPremium)}`, sub: `Loss cost ${fmtM(b.expectedLossCost)} + risk ${assumptions.riskLoadingPct}%`, icon: <Scale className="h-4 w-4" /> },
          { label: 'Rate on Subject', value: b.ratePct === null ? '—' : `${b.ratePct.toFixed(2)}%`, sub: `Subject premium ${fmtM(subjectPremium)}`, icon: <TrendingUp className="h-4 w-4" /> },
          { label: 'Rate on Line', value: b.rateOnLinePct === null ? 'n/a' : `${b.rateOnLinePct.toFixed(2)}%`, sub: b.rateOnLinePct === null ? 'Proportional / aggregate basis' : `Limit ${fmtM(parseFloat(limit) || 0)}`, icon: <Scale className="h-4 w-4" /> }
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground truncate" title={kpi.sub}>{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="methods">Methods</TabsTrigger>
          <TabsTrigger value="buildup">Build-Up</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-advisor">AI Advisor</TabsTrigger>
          <TabsTrigger value="ai-risk">Risk & Fit</TabsTrigger>
          <TabsTrigger value="ai-optimize">Optimization</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------ Setup */}
        <TabsContent value="setup" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Deal Structure</CardTitle>
                <CardDescription>{typeHelp[treatyType]}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Arrangement Type</Label>
                  <Select value={treatyType} onValueChange={(v) => setTreatyType(v as PricingTreatyType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TREATY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {treatyType === 'Facultative' ? (
                  <div className="space-y-2">
                    <Label>Inward Treaty Being Priced *</Label>
                    <Select value={linkedTreatyId} onValueChange={setLinkedTreatyId}>
                      <SelectTrigger><SelectValue placeholder="Select the treaty" /></SelectTrigger>
                      <SelectContent>
                        {treaties.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.treatyName} ({t.contractNumber}) — {t.lineOfBusiness.join(', ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Lines of Business * <span className="text-xs text-muted-foreground font-normal">(experience and exposure come from these lines)</span></Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border rounded-lg p-3">
                      {portfolioLobs.map(lob => (
                        <div key={lob} className="flex items-center space-x-2">
                          <Checkbox
                            id={`plob-${lob}`}
                            checked={selectedLobs.includes(lob)}
                            onCheckedChange={(checked) => setSelectedLobs(prev =>
                              checked ? [...prev, lob] : prev.filter(l => l !== lob))}
                          />
                          <Label htmlFor={`plob-${lob}`} className="text-sm font-normal">{lob}</Label>
                        </div>
                      ))}
                      {portfolioLobs.length === 0 && <p className="text-sm text-muted-foreground col-span-3">No inward treaties yet.</p>}
                    </div>
                  </div>
                )}

                {treatyType !== 'Facultative' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cedant <span className="text-xs text-muted-foreground font-normal">(recalls their past data)</span></Label>
                      <Select value={cedantFilter} onValueChange={setCedantFilter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All cedants</SelectItem>
                          {knownCedants.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Contract Number <span className="text-xs text-muted-foreground font-normal">(optional match)</span></Label>
                      <Input value={contractFilter} onChange={(e) => setContractFilter(e.target.value)} placeholder="e.g. 12345" />
                    </div>
                  </div>
                )}

                {(selectedLobs.length > 0 || linkedTreatyId) && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm space-y-1">
                    <p className="font-medium">
                      {scopeTreaties.length} treat{scopeTreaties.length === 1 ? 'y' : 'ies'} in scope · derived subject premium {structure.currency} {fmt(derivedSubjectPremium)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {scopedExternalCount > 0
                        ? `${scopedExternalCount} imported experience row(s) also feed this pricing${cedantFilter !== 'all' ? ` for ${cedantFilter}` : ''}`
                        : externalExperience.length > 0
                          ? 'No imported rows match this scope — check lines/cedant spelling against the imported data'
                          : 'No imported history — the Historical Experience card below accepts CSV imports'}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Subject Premium Override <span className="text-xs text-muted-foreground font-normal">(leave blank to use the derived figure)</span></Label>
                  <Input type="number" value={subjectPremiumOverride}
                    onChange={(e) => setSubjectPremiumOverride(e.target.value)}
                    placeholder={derivedSubjectPremium > 0 ? fmt(derivedSubjectPremium) : 'e.g. 25000000'} />
                </div>

                {/* Type-specific structure */}
                {(treatyType === 'Quota Share' || treatyType === 'Surplus') && (
                  <div className="space-y-2">
                    <Label>{treatyType === 'Surplus' ? 'Estimated Ceded Share % *' : 'Cession % *'}</Label>
                    <Input type="number" step="0.5" value={cessionPct} onChange={(e) => setCessionPct(e.target.value)} placeholder="25" />
                  </div>
                )}
                {(treatyType === 'XOL' || treatyType === 'Catastrophe' || treatyType === 'Facultative') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Attachment *</Label>
                      <Input type="number" value={attachment} onChange={(e) => setAttachment(e.target.value)} placeholder="2000000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Limit *</Label>
                      <Input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="8000000" />
                    </div>
                  </div>
                )}
                {treatyType === 'Stop Loss' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Attachment Loss Ratio % *</Label>
                      <Input type="number" step="5" value={lrAttachPct} onChange={(e) => setLrAttachPct(e.target.value)} placeholder="80" />
                    </div>
                    <div className="space-y-2">
                      <Label>Exhaustion Loss Ratio % *</Label>
                      <Input type="number" step="5" value={lrExhaustPct} onChange={(e) => setLrExhaustPct(e.target.value)} placeholder="120" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing Assumptions</CardTitle>
                <CardDescription>Persisted across sessions — every figure recomputes as you type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Claims Inflation % p.a.</Label>
                    <Input type="number" step="0.5" value={assumptions.claimsInflationPct}
                      onChange={(e) => setAssumption('claimsInflationPct', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Premium Trend % p.a.</Label>
                    <Input type="number" step="0.5" value={assumptions.premiumTrendPct}
                      onChange={(e) => setAssumption('premiumTrendPct', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Loss Ratio % (prior)</Label>
                    <Input type="number" step="1" value={assumptions.expectedLossRatioPct}
                      onChange={(e) => setAssumption('expectedLossRatioPct', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Risk Loading %</Label>
                    <Input type="number" step="1" value={assumptions.riskLoadingPct}
                      onChange={(e) => setAssumption('riskLoadingPct', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expense Loading %</Label>
                    <Input type="number" step="0.5" value={assumptions.expenseLoadingPct}
                      onChange={(e) => setAssumption('expenseLoadingPct', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Commission Loading %</Label>
                    <Input type="number" step="0.5" value={assumptions.commissionLoadingPct}
                      onChange={(e) => setAssumption('commissionLoadingPct', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Profit Loading %</Label>
                    <Input type="number" step="0.5" value={assumptions.profitLoadingPct}
                      onChange={(e) => setAssumption('profitLoadingPct', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Full-Credibility Claims</Label>
                    <Input type="number" step="5" value={assumptions.fullCredibilityClaims}
                      onChange={(e) => setAssumption('fullCredibilityClaims', parseFloat(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Exposure Curve Exponent</Label>
                    <Input type="number" step="0.1" value={assumptions.exposureCurveExponent}
                      onChange={(e) => setAssumption('exposureCurveExponent', parseFloat(e.target.value) || 1)} />
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setAssumptions(DEFAULT_PRICING_ASSUMPTIONS); toast.info("Assumptions reset to defaults"); }}>
                  Reset to defaults
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Historical experience import */}
          <Card>
            <CardHeader>
              <CardTitle>Historical Experience Import</CardTitle>
              <CardDescription>
                Bring past premium and claims data into the pricing evidence — from Excel use File → Save As → CSV.
                Columns: Year, Cedant, Contract Number, Line of Business, Premium, Losses, Claim Count (Year and Premium required).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Input type="file" accept=".csv" onChange={handleImportFile} className="max-w-xs" />
                <Button size="sm" variant="outline" onClick={downloadExperienceTemplate}>
                  <Download className="h-3 w-3 mr-1" />
                  Download Template
                </Button>
                {externalExperience.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => {
                    clearExternalExperience();
                    setImportErrors([]);
                    toast.info("Imported experience cleared — pricing recomputed on portfolio data only");
                  }}>
                    Clear Imported Data ({externalExperience.length} rows)
                  </Button>
                )}
              </div>

              {importErrors.length > 0 && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3 space-y-1">
                  {importErrors.map((err, i) => (
                    <p key={i} className="text-xs text-amber-800 dark:text-amber-200 flex items-start">
                      <AlertTriangle className="h-3 w-3 mr-1 mt-0.5 shrink-0" />{err}
                    </p>
                  ))}
                </div>
              )}

              {externalExperience.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Cedant</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Line</TableHead>
                      <TableHead className="text-right">Premium</TableHead>
                      <TableHead className="text-right">Losses</TableHead>
                      <TableHead className="text-right">Claims</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {externalExperience.slice(0, 10).map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.year}</TableCell>
                        <TableCell>{r.cedant}</TableCell>
                        <TableCell className="font-mono text-xs">{r.contractNumber || '—'}</TableCell>
                        <TableCell>{r.lineOfBusiness}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(r.premium)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(r.losses)}</TableCell>
                        <TableCell className="text-right">{r.claimCount}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.source}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {externalExperience.length > 10 && (
                <p className="text-xs text-muted-foreground">Showing first 10 of {externalExperience.length} imported rows.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Methods */}
        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Method Comparison</CardTitle>
              <CardDescription>Five deterministic methods on the same structure — the credibility blend below drives the premium</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Loss Cost</TableHead>
                    <TableHead className="text-right">Rate %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Basis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {output.methods.map(m => (
                    <TableRow key={m.method}>
                      <TableCell className="font-medium">{PRICING_METHOD_LABELS[m.method]}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(m.lossCost)}</TableCell>
                      <TableCell className="text-right font-mono">{m.lossCostRatePct?.toFixed(2) ?? '—'}</TableCell>
                      <TableCell>
                        {m.usable
                          ? <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Usable</Badge>
                          : <Badge variant="outline">Insufficient data</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-96">{m.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-950 p-4 space-y-1">
                <p className="font-medium text-sm">Credibility Blend — {fmt(output.blend.blendedLossCost)}</p>
                <p className="text-xs text-muted-foreground">{output.blend.note}</p>
                <p className="text-xs text-muted-foreground">
                  Experience side {fmt(output.blend.experienceLossCost)} · Exposure prior {fmt(output.blend.priorLossCost)} · {output.blend.claimCount} claims in scope
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trended Experience</CardTitle>
              <CardDescription>
                Losses inflated at {assumptions.claimsInflationPct}% p.a., premiums trended at {assumptions.premiumTrendPct}% p.a., mapped into the priced structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {output.experience.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No experience in scope — select lines of business with claims history.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-right">Trended Premium</TableHead>
                      <TableHead className="text-right">Trended Gross Losses</TableHead>
                      <TableHead className="text-right">Losses in Structure</TableHead>
                      <TableHead className="text-right">Claims</TableHead>
                      <TableHead className="text-right">Loss Ratio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {output.experience.map(e => (
                      <TableRow key={e.year}>
                        <TableCell className="font-medium">{e.year}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(e.premium)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(e.losses)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(e.lossesInStructure)}</TableCell>
                        <TableCell className="text-right">{e.claimCount}</TableCell>
                        <TableCell className="text-right font-mono">{e.lossRatioPct === null ? '—' : `${e.lossRatioPct.toFixed(1)}%`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Premium build-up */}
        <TabsContent value="buildup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical → Office Premium</CardTitle>
              <CardDescription>Loadings are percentages of the office premium (standard division method)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {([
                    ['Expected loss cost (credibility blend)', b.expectedLossCost, false],
                    [`Risk loading (${assumptions.riskLoadingPct}% of loss cost)`, b.riskLoading, false],
                    ['Technical premium', b.technicalPremium, true],
                    [`Expense loading (${assumptions.expenseLoadingPct}%)`, b.expenseLoading, false],
                    [`Commission loading (${assumptions.commissionLoadingPct}%)`, b.commissionLoading, false],
                    [`Profit loading (${assumptions.profitLoadingPct}%)`, b.profitLoading, false],
                    ['Office premium', b.officePremium, true]
                  ] as Array<[string, number, boolean]>).map(([label, value, emphasis]) => (
                    <TableRow key={label} className={emphasis ? 'font-bold border-t-2' : ''}>
                      <TableCell>{label}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
                <div className="border rounded-lg p-3">
                  <p className="text-muted-foreground">Rate on subject premium</p>
                  <p className="font-bold text-lg">{b.ratePct === null ? '—' : `${b.ratePct.toFixed(2)}%`}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-muted-foreground">Rate on line</p>
                  <p className="font-bold text-lg">{b.rateOnLinePct === null ? 'n/a' : `${b.rateOnLinePct.toFixed(2)}%`}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-muted-foreground">Total loadings</p>
                  <p className="font-bold text-lg">{b.loadingsSumPct.toFixed(1)}% of office</p>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button onClick={() => handleSavePricing('Quoted')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save as Quoted
                </Button>
                <Button variant="outline" onClick={() => handleSavePricing('Draft')}>
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Scenarios */}
        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Modelling</CardTitle>
              <CardDescription>Standard stresses re-run through the full pricing pipeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    <TableHead className="text-right">Loss Shock</TableHead>
                    <TableHead className="text-right">Inflation Shift</TableHead>
                    <TableHead className="text-right">Retention Shift</TableHead>
                    <TableHead className="text-right">Office Premium</TableHead>
                    <TableHead className="text-right">vs Base</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarios.map(s => (
                    <TableRow key={s.id} className={s.name === 'Base' ? 'font-medium' : ''}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell className="text-right">{s.lossShockPct ? `+${s.lossShockPct}%` : '—'}</TableCell>
                      <TableCell className="text-right">{s.inflationShiftPct ? `+${s.inflationShiftPct}%` : '—'}</TableCell>
                      <TableCell className="text-right">{s.structureShiftPct ? `+${s.structureShiftPct}%` : '—'}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(s.officePremium)}</TableCell>
                      <TableCell className={`text-right font-mono ${(s.deltaVsBasePct ?? 0) > 0 ? 'text-red-600' : (s.deltaVsBasePct ?? 0) < 0 ? 'text-green-600' : ''}`}>
                        {s.deltaVsBasePct === null || s.name === 'Base' ? '—' : `${s.deltaVsBasePct >= 0 ? '+' : ''}${s.deltaVsBasePct.toFixed(1)}%`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={scenarios.map(s => ({ name: s.name.length > 22 ? s.name.slice(0, 22) + '…' : s.name, 'Office Premium': Math.round(s.officePremium) }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                  <ChartTooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Office Premium" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Validation */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Validation</CardTitle>
              <CardDescription>Structure, loadings, rate sanity, and data sufficiency — evaluated live</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {issues.length === 0 ? (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-sm">All pricing validations pass.</p>
                </div>
              ) : issues.map((issue, i) => (
                <div key={i} className={`flex items-start space-x-2 p-3 rounded-lg ${issue.severity === 'error' ? 'bg-red-50 dark:bg-red-950' : 'bg-amber-50 dark:bg-amber-950'}`}>
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
                  <div>
                    <p className="text-sm">{issue.message}</p>
                    <p className="text-xs text-muted-foreground">{issue.severity}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Portfolio analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Rate Adequacy</CardTitle>
              <CardDescription>
                Booked premium vs the premium the current basis would require (max of incurred and ELR losses, grossed up for loadings)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line of Business</TableHead>
                    <TableHead className="text-right">Treaties</TableHead>
                    <TableHead className="text-right">Booked Premium</TableHead>
                    <TableHead className="text-right">Incurred Losses</TableHead>
                    <TableHead className="text-right">Actual LR</TableHead>
                    <TableHead className="text-right">Required Premium</TableHead>
                    <TableHead className="text-right">Adequacy</TableHead>
                    <TableHead>Verdict</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adequacy.map(a => (
                    <TableRow key={a.lineOfBusiness}>
                      <TableCell className="font-medium">{a.lineOfBusiness}</TableCell>
                      <TableCell className="text-right">{a.treatyCount}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(a.bookedPremium)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(a.incurredLosses)}</TableCell>
                      <TableCell className="text-right font-mono">{a.actualLossRatioPct === null ? '—' : `${a.actualLossRatioPct.toFixed(1)}%`}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(a.requiredPremium)}</TableCell>
                      <TableCell className="text-right font-mono">{a.adequacyPct === null ? '—' : `${a.adequacyPct.toFixed(0)}%`}</TableCell>
                      <TableCell>
                        <Badge variant={a.verdict === 'Adequate' ? 'secondary' : a.verdict === 'Marginal' ? 'default' : a.verdict === 'Inadequate' ? 'destructive' : 'outline'}>
                          {a.verdict}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {adequacy.length > 0 && (
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={adequacy.map(a => ({ name: a.lineOfBusiness, Booked: Math.round(a.bookedPremium), Required: Math.round(a.requiredPremium) }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                      <ChartTooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="Booked" fill="#2563eb" />
                      <Bar dataKey="Required" fill="#dc2626" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* ------------------------------------------------ AI Advisor */}
        <TabsContent value="ai-advisor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Explainable Recommendations
              </CardTitle>
              <CardDescription>
                Every suggestion is anchored to the deterministic 6A office premium and shows its variables, weights, confidence, and sensitivity — no black boxes.
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {aiRecs.map(rec => (
              <Card key={rec.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{rec.label}</span>
                    <Badge variant="secondary">{rec.explanation.confidencePct}% confidence</Badge>
                  </CardTitle>
                  <div className="text-2xl font-bold">{rec.value}</div>
                  <CardDescription>{rec.rationale}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ExplanationBlock explanation={rec.explanation} />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Model Registry</CardTitle>
              <CardDescription>Active heuristic models and their backend-ML replacement paths (future integration seam)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Backend Replacement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODEL_REGISTRY.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell><Badge variant="outline">v{m.version}</Badge></TableCell>
                      <TableCell className="text-xs">{m.type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-56">{m.features.join(', ')}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-56">{m.backendReady}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Risk & Fit */}
        <TabsContent value="ai-risk" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Risk Score</span>
                  <Badge variant={aiRisk.band === 'Low' ? 'secondary' : aiRisk.band === 'Medium' ? 'default' : 'destructive'}>{aiRisk.band}</Badge>
                </CardTitle>
                <div className="text-3xl font-bold">{aiRisk.score.toFixed(1)} / 10</div>
              </CardHeader>
              <CardContent>
                <ExplanationBlock explanation={aiRisk.explanation} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Portfolio Fit</span>
                  <Badge variant={aiFit.score >= 55 ? 'secondary' : 'destructive'}>{aiFit.verdict}</Badge>
                </CardTitle>
                <div className="text-3xl font-bold">{aiFit.score.toFixed(0)} / 100</div>
              </CardHeader>
              <CardContent>
                <ExplanationBlock explanation={aiFit.explanation} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Risk Appetite Assessment</span>
                <Badge variant={aiAppetite.withinAppetite ? 'secondary' : 'destructive'}>
                  {aiAppetite.withinAppetite ? 'Within appetite' : 'Outside appetite'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aiAppetite.checks.map(c => (
                    <TableRow key={c.rule}>
                      <TableCell className="font-medium">{c.rule}</TableCell>
                      <TableCell>{c.actual}</TableCell>
                      <TableCell>{c.limit}</TableCell>
                      <TableCell>
                        <Badge variant={c.pass ? 'secondary' : 'destructive'}>
                          {c.pass ? <><CheckCircle className="h-3 w-3 mr-1" />Pass</> : <><AlertTriangle className="h-3 w-3 mr-1" />Breach</>}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Renewal Recommendations</CardTitle>
              <CardDescription>Underwriting decision support across the in-force book</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Treaty</TableHead>
                    <TableHead className="text-right">Loss Ratio</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Rate Change</TableHead>
                    <TableHead>Rationale</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renewals.map(r => (
                    <TableRow key={r.treatyId}>
                      <TableCell>
                        <p className="font-medium text-sm">{r.treatyName}</p>
                        <p className="text-xs text-muted-foreground">{r.cedant}</p>
                      </TableCell>
                      <TableCell className="text-right font-mono">{r.lossRatioPct === null ? '—' : `${r.lossRatioPct.toFixed(0)}%`}</TableCell>
                      <TableCell>
                        <Badge variant={r.action === 'Renew as-is' ? 'secondary' : r.action === 'Decline' ? 'destructive' : 'default'}>{r.action}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{r.suggestedRateChangePct > 0 ? `+${r.suggestedRateChangePct}%` : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-72">{r.rationale}</TableCell>
                      <TableCell className="text-right">{r.confidencePct}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Optimization */}
        <TabsContent value="ai-optimize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Mix Optimization</CardTitle>
              <CardDescription>
                Greedy reweighting toward rate-adequate, profitable lines under a 45% single-line concentration cap — fully rule-based and disclosed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line of Business</TableHead>
                    <TableHead className="text-right">Current Share</TableHead>
                    <TableHead className="text-right">Suggested Share</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Rationale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mix.map(m => (
                    <TableRow key={m.lineOfBusiness}>
                      <TableCell className="font-medium">{m.lineOfBusiness}</TableCell>
                      <TableCell className="text-right font-mono">{m.currentSharePct.toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-mono">{m.suggestedSharePct.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge variant={m.direction === 'Grow' ? 'secondary' : m.direction === 'Shrink' ? 'destructive' : 'outline'}>{m.direction}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-96">{m.rationale}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {mix.length === 0 && <p className="text-center text-muted-foreground py-6">No portfolio data to optimise yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Executive AI Dashboard</CardTitle>
              <CardDescription>Deal and portfolio intelligence at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  ['Deal Risk Score', `${aiRisk.score.toFixed(1)}/10`, aiRisk.band],
                  ['Portfolio Fit', `${aiFit.score.toFixed(0)}/100`, aiFit.verdict],
                  ['Appetite', aiAppetite.withinAppetite ? 'Within' : 'Breached', `${aiAppetite.checks.filter(c => c.pass).length}/${aiAppetite.checks.length} rules pass`],
                  ['Renewal Actions', `${renewals.filter(r => r.action !== 'Renew as-is').length} of ${renewals.length}`, 'treaties need attention']
                ].map(([label, value, sub]) => (
                  <div key={label as string} className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                All AI outputs are deterministic, explainable heuristics over the Stage 6A actuarial engines — the Model Registry (AI Advisor tab) documents the backend-ML replacement path for each.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pricing history dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pricing History</DialogTitle>
            <DialogDescription>Saved pricing exercises (persisted)</DialogDescription>
          </DialogHeader>
          {history.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {[...history].reverse().map(r => (
                <div key={r.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                  <div>
                    <p className="font-medium">{r.treatyType} — {r.linesOfBusiness.join(', ') || 'linked treaty'}</p>
                    <p className="text-muted-foreground text-xs">{new Date(r.date).toLocaleString()} · {r.selectedBasis}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium">{fmt(r.officePremium)}</p>
                    <Badge variant={r.outcome === 'Bound' ? 'secondary' : r.outcome === 'Declined' ? 'destructive' : 'outline'}>{r.outcome}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No saved pricings yet.</p>
              <p className="text-sm">Price a structure and save it from the Premium Build-Up tab.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingSystem;
