import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { BookOpen, Download, FileSpreadsheet, FileText, Filter, RotateCcw, Scale, Shield, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useDataStore } from './DataStore';
import {
  buildMethodInputs, runAllMethods, portfolioAnalytics, METHOD_LABELS, MethodKey,
  DEFAULT_ASSUMPTIONS as ACTUARIAL_DEFAULTS, Assumptions as ActuarialAssumptions
} from '@/lib/actuarial';
import { Ifrs17Assumptions, Ifrs17Filters, ALL_FILTERS, MeasurementModel } from '@/ifrs17/types';
import { loadAssumptions, saveAssumptions, measurementModel, earnedFraction } from '@/ifrs17/assumptions';
import { riskAdjustmentMethodLabel } from '@/ifrs17/riskAdjustment';
import { lrcRollForward, lrcTotals } from '@/ifrs17/lrc';
import { licRollForward, licTotals, allocateIbnr } from '@/ifrs17/lic';
import { fulfilmentCashFlows } from '@/ifrs17/fulfilmentCashFlows';
import { reinsuranceIssued, reinsuranceHeld, financialStatements, portfolioPerformance } from '@/ifrs17/financialStatements';
import { exportLrcCsv, exportLicCsv, exportAnalysisExcel, exportManagementReportPdf } from '@/ifrs17/reporting';

const fmt = (n: number) => Math.round(n).toLocaleString();
const fmtM = (n: number) => `${(n / 1_000_000).toFixed(2)}M`;

const ACTUARIAL_KEY = 'afrirevision-actuarial-assumptions';

const IfrsReporting = () => {
  const { treaties, claims } = useDataStore();

  const [assumptions, setAssumptions] = useState<Ifrs17Assumptions>(loadAssumptions);
  const [filters, setFilters] = useState<Ifrs17Filters>(ALL_FILTERS);

  useEffect(() => { saveAssumptions(assumptions); }, [assumptions]);

  const setAssumption = <K extends keyof Ifrs17Assumptions>(key: K, value: Ifrs17Assumptions[K]) =>
    setAssumptions(a => ({ ...a, [key]: value }));
  const setFilter = <K extends keyof Ifrs17Filters>(key: K, value: string) =>
    setFilters(f => ({ ...f, [key]: value }));

  // Actuarial assumptions (ELR, selected method) are reused from the Stage 2 workbench.
  const actuarialAssumptions: ActuarialAssumptions = useMemo(() => {
    try {
      const saved = localStorage.getItem(ACTUARIAL_KEY);
      return saved ? { ...ACTUARIAL_DEFAULTS, ...JSON.parse(saved) } : ACTUARIAL_DEFAULTS;
    } catch { return ACTUARIAL_DEFAULTS; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treaties, claims]);

  // ---- Filtering ----------------------------------------------------------
  const filteredTreaties = useMemo(() => treaties.filter(t =>
    (filters.cedant === 'all' || t.cedant === filters.cedant) &&
    (filters.treatyId === 'all' || t.id === filters.treatyId) &&
    (filters.broker === 'all' || t.broker === filters.broker) &&
    (filters.country === 'all' || t.country === filters.country) &&
    (filters.lineOfBusiness === 'all' || t.lineOfBusiness.includes(filters.lineOfBusiness)) &&
    (filters.underwritingYear === 'all' || t.inceptionDate.startsWith(filters.underwritingYear))
  ), [treaties, filters]);

  const filteredClaims = useMemo(() => {
    const treatyIds = new Set(filteredTreaties.map(t => t.id));
    return claims.filter(c =>
      treatyIds.has(c.treatyId) &&
      (filters.accidentYear === 'all' || c.dateOfLoss.startsWith(filters.accidentYear)) &&
      new Date(c.dateOfLoss) <= new Date(assumptions.valuationDate)
    );
  }, [claims, filteredTreaties, filters.accidentYear, assumptions.valuationDate]);

  const filterOptions = useMemo(() => ({
    cedants: Array.from(new Set(treaties.map(t => t.cedant))).sort(),
    brokers: Array.from(new Set(treaties.map(t => t.broker))).sort(),
    countries: Array.from(new Set(treaties.map(t => t.country))).sort(),
    lobs: Array.from(new Set(treaties.flatMap(t => t.lineOfBusiness))).sort(),
    accidentYears: Array.from(new Set(claims.map(c => c.dateOfLoss.slice(0, 4)))).sort(),
    uwYears: Array.from(new Set(treaties.map(t => t.inceptionDate.slice(0, 4)))).sort()
  }), [treaties, claims]);

  const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;

  // ---- IBNR from the actuarial engine (reused, not duplicated) -------------
  const { totalIbnr, actuarialMethodLabel } = useMemo(() => {
    const inputs = buildMethodInputs(filteredClaims, filteredTreaties, actuarialAssumptions);
    const methods = runAllMethods(inputs);
    const key: MethodKey = actuarialAssumptions.selectedMethod ?? 'chainLadder';
    const list = [methods.chainLadder, methods.bornhuetterFerguson, methods.capeCod, methods.expectedLossRatio];
    const selected = list.find(m => m.method === key) ?? methods.chainLadder;
    return { totalIbnr: selected.totals.ibnr, actuarialMethodLabel: METHOD_LABELS[selected.method] };
  }, [filteredClaims, filteredTreaties, actuarialAssumptions]);

  // ---- Core IFRS 17 computations -------------------------------------------
  const ibnrAllocation = useMemo(() => allocateIbnr(filteredTreaties, filteredClaims, totalIbnr),
    [filteredTreaties, filteredClaims, totalIbnr]);

  const lrcRows = useMemo(() =>
    filteredTreaties.map(t => lrcRollForward(t, filteredClaims, assumptions, actuarialAssumptions.expectedLossRatio)),
    [filteredTreaties, filteredClaims, assumptions, actuarialAssumptions.expectedLossRatio]);
  const lrcTotal = useMemo(() => lrcTotals(lrcRows), [lrcRows]);

  const licRows = useMemo(() =>
    filteredTreaties.map(t => licRollForward(t, filteredClaims, assumptions, ibnrAllocation[t.id] ?? 0)),
    [filteredTreaties, filteredClaims, assumptions, ibnrAllocation]);
  const licTotal = useMemo(() => licTotals(licRows), [licRows]);

  const fcf = useMemo(() =>
    fulfilmentCashFlows(filteredTreaties, filteredClaims, assumptions, actuarialAssumptions.expectedLossRatio, totalIbnr),
    [filteredTreaties, filteredClaims, assumptions, actuarialAssumptions.expectedLossRatio, totalIbnr]);

  const issued = useMemo(() => reinsuranceIssued(filteredTreaties, filteredClaims, assumptions), [filteredTreaties, filteredClaims, assumptions]);
  const held = useMemo(() => reinsuranceHeld(filteredTreaties, filteredClaims, assumptions), [filteredTreaties, filteredClaims, assumptions]);
  const statements = useMemo(() => financialStatements(issued, held, licTotal.closingBalance, licTotal.riskAdjustment, assumptions),
    [issued, held, licTotal, assumptions]);

  const treatyPerformance = useMemo(() => portfolioPerformance(filteredTreaties, filteredClaims, assumptions, 'treaty'), [filteredTreaties, filteredClaims, assumptions]);
  const cedantPerformance = useMemo(() => portfolioPerformance(filteredTreaties, filteredClaims, assumptions, 'cedant'), [filteredTreaties, filteredClaims, assumptions]);
  const analytics = useMemo(() => portfolioAnalytics(filteredTreaties, filteredClaims), [filteredTreaties, filteredClaims]);

  // Premium receivables roll-forward source
  const receivables = useMemo(() => filteredTreaties.map(t => {
    const booked = (t.premiumBookings ?? []).reduce((s, b) => s + b.amount, 0);
    const paid = (t.premiumBookings ?? []).reduce((s, b) => s + (b.paidAmount ?? 0), 0);
    return { treatyName: t.treatyName, booked, paid, outstanding: booked - paid };
  }), [filteredTreaties]);

  const scopeDescription = activeFilterCount === 0
    ? 'Full portfolio'
    : Object.entries(filters).filter(([, v]) => v !== 'all')
        .map(([k, v]) => `${k}=${k === 'treatyId' ? (treaties.find(t => t.id === v)?.treatyName ?? v) : v}`).join(', ');

  const handleExportPdf = () => {
    const ok = exportManagementReportPdf({
      assumptions, statements, fcf, issued, held,
      lrcTotal, licTotal, scopeDescription, actuarialMethodLabel
    });
    if (ok) toast.success("Management report opened — use the print dialog to save as PDF");
    else toast.error("Pop-up blocked — allow pop-ups to export the PDF report");
  };

  const modelBadge = (model: MeasurementModel) => (
    <Badge variant={model === 'PAA' ? 'secondary' : model === 'GMM' ? 'default' : 'outline'}>{model}</Badge>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">IFRS 17 Reporting Workstation</h2>
          <p className="text-muted-foreground">
            Live measurement from {filteredTreaties.length} treaties and {filteredClaims.length} claims · IBNR from {actuarialMethodLabel}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => {
            exportAnalysisExcel(lrcRows, licRows, treatyPerformance, statements);
            toast.success("Excel analysis exported");
          }}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel Analysis
          </Button>
          <Button onClick={handleExportPdf}>
            <FileText className="h-4 w-4 mr-2" />
            Management Report (PDF)
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Reporting Scope {activeFilterCount > 0 && <Badge className="ml-2" variant="secondary">{activeFilterCount} active</Badge>}
            </CardTitle>
            {activeFilterCount > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setFilters(ALL_FILTERS)}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Valuation Date</Label>
              <Input type="date" value={assumptions.valuationDate} onChange={(e) => setAssumption('valuationDate', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Currency</Label>
              <Select value={assumptions.reportingCurrency} onValueChange={(v) => setAssumption('reportingCurrency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['USD', 'TZS', 'EUR', 'GBP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {([
              ['cedant', 'Cedant', filterOptions.cedants],
              ['broker', 'Broker', filterOptions.brokers],
              ['country', 'Country', filterOptions.countries],
              ['lineOfBusiness', 'Line of Business', filterOptions.lobs],
              ['accidentYear', 'Accident Year', filterOptions.accidentYears],
              ['underwritingYear', 'UW Year', filterOptions.uwYears]
            ] as Array<[keyof Ifrs17Filters, string, string[]]>).map(([key, label, opts]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Select value={filters[key]} onValueChange={(v) => setFilter(key, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Label className="text-xs">Treaty</Label>
            <Select value={filters.treatyId} onValueChange={(v) => setFilter('treatyId', v)}>
              <SelectTrigger className="max-w-md"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All treaties</SelectItem>
                {treaties.map(t => <SelectItem key={t.id} value={t.id}>{t.treatyName} ({t.contractNumber})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Headline balances */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'LRC Closing', value: lrcTotal.closingBalance, sub: `CSM ${fmtM(lrcTotal.csm)} · Loss comp. ${fmtM(lrcTotal.lossComponent)}`, icon: <Scale className="h-4 w-4" /> },
          { label: 'LIC Closing', value: licTotal.closingBalance, sub: `IBNR ${fmtM(licTotal.ibnrMovement)} · RA ${fmtM(licTotal.riskAdjustment)}`, icon: <Shield className="h-4 w-4" /> },
          { label: 'Insurance Revenue', value: statements.insuranceRevenue, sub: `Written ${fmtM(issued.premium)}`, icon: <TrendingUp className="h-4 w-4" /> },
          { label: 'Technical Result', value: statements.technicalResult, sub: `Service result ${fmtM(statements.insuranceServiceResult)}`, icon: <BookOpen className="h-4 w-4" /> }
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.label === 'Technical Result' && kpi.value < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                {assumptions.reportingCurrency} {fmtM(kpi.value)}
              </div>
              <p className="text-xs text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="statements" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="lrc">LRC</TabsTrigger>
          <TabsTrigger value="lic">LIC & FCF</TabsTrigger>
          <TabsTrigger value="reinsurance">Reinsurance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------ Statements */}
        <TabsContent value="statements" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Statement of Insurance Service Result</CardTitle>
                <CardDescription>Draft, derived from live data at {assumptions.valuationDate}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {([
                      ['Insurance revenue', statements.insuranceRevenue, false],
                      ['Insurance service expenses', -statements.insuranceServiceExpenses, false],
                      ['Insurance service result', statements.insuranceServiceResult, true],
                      ['Insurance finance income/(expense)', -statements.insuranceFinanceExpense, false],
                      ['Net result from reinsurance held', statements.reinsuranceHeldResult, false],
                      ['Technical result', statements.technicalResult, true]
                    ] as Array<[string, number, boolean]>).map(([label, value, emphasis]) => (
                      <TableRow key={label} className={emphasis ? 'font-bold border-t-2' : ''}>
                        <TableCell>{label}</TableCell>
                        <TableCell className={`text-right font-mono ${value < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {value < 0 ? `(${fmt(Math.abs(value))})` : fmt(value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Roll-Forward Summary</CardTitle>
                <CardDescription>Movement in key balances (opening balances are zero in this prototype)</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Balance</TableHead>
                      <TableHead className="text-right">Opening</TableHead>
                      <TableHead className="text-right">Movement</TableHead>
                      <TableHead className="text-right">Closing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {([
                      ['LRC', 0, lrcTotal.closingBalance],
                      ['LIC', 0, licTotal.closingBalance],
                      ['IBNR', 0, licTotal.ibnrMovement],
                      ['Outstanding claims (RBNS)', 0, licTotal.claimsIncurred - licTotal.claimsPaid],
                      ['Premium receivables', 0, receivables.reduce((s, r) => s + r.outstanding, 0)]
                    ] as Array<[string, number, number]>).map(([label, opening, closing]) => (
                      <TableRow key={label}>
                        <TableCell className="font-medium">{label}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(opening)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(closing - opening)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(closing)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
              <CardDescription>Insurance service result by treaty at the valuation date</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Treaty</TableHead>
                    <TableHead className="text-right">Written Premium</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Claims Incurred</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                    <TableHead className="text-right">Loss Ratio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatyPerformance.map(p => (
                    <TableRow key={p.key}>
                      <TableCell className="font-medium">{p.key}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(p.premium)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(p.revenue)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(p.claimsIncurred)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(p.expenses)}</TableCell>
                      <TableCell className={`text-right font-mono ${p.result < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{fmt(p.result)}</TableCell>
                      <TableCell className="text-right font-mono">{p.lossRatio === null ? '—' : `${p.lossRatio.toFixed(1)}%`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ LRC */}
        <TabsContent value="lrc" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Liability for Remaining Coverage</CardTitle>
                <CardDescription>Roll-forward by treaty · PAA earns premium over coverage; GMM carries FCF + CSM</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => { exportLrcCsv(lrcRows); toast.success("LRC roll-forward exported"); }}>
                <Download className="h-3 w-3 mr-1" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Treaty</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Opening</TableHead>
                    <TableHead className="text-right">Premium Received</TableHead>
                    <TableHead className="text-right">Revenue Recognized</TableHead>
                    <TableHead className="text-right">Acquisition CF</TableHead>
                    <TableHead className="text-right">CSM</TableHead>
                    <TableHead className="text-right">Loss Component</TableHead>
                    <TableHead className="text-right">Closing</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lrcRows.map(r => (
                    <TableRow key={r.treatyId}>
                      <TableCell className="font-medium">{r.treatyName}</TableCell>
                      <TableCell>{modelBadge(r.model)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.openingBalance)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.premiumReceived)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.revenueRecognized)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.acquisitionCashFlows)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.csm)}</TableCell>
                      <TableCell className={`text-right font-mono ${r.lossComponent > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{fmt(r.lossComponent)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{fmt(r.closingBalance)}</TableCell>
                      <TableCell className="text-right">{(r.earnedFraction * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t-2">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right font-mono">{fmt(lrcTotal.openingBalance)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(lrcTotal.premiumReceived)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(lrcTotal.revenueRecognized)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(lrcTotal.acquisitionCashFlows)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(lrcTotal.csm)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(lrcTotal.lossComponent)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(lrcTotal.closingBalance)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
              {lrcRows.length === 0 && <p className="text-center text-muted-foreground py-6">No treaties in the current scope.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ LIC & FCF */}
        <TabsContent value="lic" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Liability for Incurred Claims</CardTitle>
                <CardDescription>Case reserves + IBNR ({actuarialMethodLabel}) + risk adjustment ({riskAdjustmentMethodLabel(assumptions)})</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => { exportLicCsv(licRows); toast.success("LIC roll-forward exported"); }}>
                <Download className="h-3 w-3 mr-1" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Treaty</TableHead>
                    <TableHead className="text-right">Opening</TableHead>
                    <TableHead className="text-right">Claims Incurred</TableHead>
                    <TableHead className="text-right">Claims Paid</TableHead>
                    <TableHead className="text-right">IBNR</TableHead>
                    <TableHead className="text-right">Risk Adjustment</TableHead>
                    <TableHead className="text-right">Closing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licRows.map(r => (
                    <TableRow key={r.treatyId}>
                      <TableCell className="font-medium">{r.treatyName}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.openingBalance)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.claimsIncurred)}</TableCell>
                      <TableCell className="text-right font-mono">({fmt(r.claimsPaid)})</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.ibnrMovement)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.riskAdjustment)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{fmt(r.closingBalance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t-2">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right font-mono">{fmt(licTotal.openingBalance)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(licTotal.claimsIncurred)}</TableCell>
                    <TableCell className="text-right font-mono">({fmt(licTotal.claimsPaid)})</TableCell>
                    <TableCell className="text-right font-mono">{fmt(licTotal.ibnrMovement)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(licTotal.riskAdjustment)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(licTotal.closingBalance)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fulfilment Cash Flows</CardTitle>
                <CardDescription>Discounted at {assumptions.discountRate}% p.a. (simplified one-year duration)</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {([
                      ['Expected claims (case + IBNR + unearned exposure)', fcf.expectedClaims],
                      ['Expected attributable expenses', fcf.expectedExpenses],
                      ['Reinsurance recoveries', -fcf.reinsuranceRecoveries],
                      ['Effect of discounting', -fcf.discountEffect],
                      ['Risk adjustment', fcf.riskAdjustment]
                    ] as Array<[string, number]>).map(([label, value]) => (
                      <TableRow key={label}>
                        <TableCell>{label}</TableCell>
                        <TableCell className={`text-right font-mono ${value < 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                          {value < 0 ? `(${fmt(Math.abs(value))})` : fmt(value)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell>Total fulfilment cash flows</TableCell>
                      <TableCell className="text-right font-mono">{fmt(fcf.totalFcf)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Premium Receivables Roll-Forward</CardTitle>
                <CardDescription>Booked vs settled premium by treaty</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Treaty</TableHead>
                      <TableHead className="text-right">Booked</TableHead>
                      <TableHead className="text-right">Settled</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivables.map(r => (
                      <TableRow key={r.treatyName}>
                        <TableCell className="font-medium">{r.treatyName}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(r.booked)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(r.paid)}</TableCell>
                        <TableCell className={`text-right font-mono ${r.outstanding > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{fmt(r.outstanding)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ------------------------------------------------ Reinsurance */}
        <TabsContent value="reinsurance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reinsurance Issued (Inward)</CardTitle>
                <CardDescription>The reinsurance business AfriRe writes</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {([
                      ['Written premium', issued.premium],
                      ['Premium received', issued.premiumReceived],
                      ['Insurance revenue (earned)', issued.revenue],
                      ['Claims incurred', issued.claimsIncurred],
                      ['Claims paid', issued.claimsPaid],
                      ['Expenses (commission + attributable)', issued.expenses],
                      ['Insurance service result', issued.serviceResult]
                    ] as Array<[string, number]>).map(([label, value], i, arr) => (
                      <TableRow key={label} className={i === arr.length - 1 ? 'font-bold border-t-2' : ''}>
                        <TableCell>{label}</TableCell>
                        <TableCell className={`text-right font-mono ${value < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{fmt(value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reinsurance Held (Retrocession)</CardTitle>
                <CardDescription>Protection AfriRe buys, from treaty retro percentages and recorded recoveries</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {([
                      ['Ceded (retro) premium — earned share', held.cededPremium],
                      ['Retro recoveries on claims', held.recoveries],
                      ['Net cost of reinsurance held', held.netRetroCost]
                    ] as Array<[string, number]>).map(([label, value], i, arr) => (
                      <TableRow key={label} className={i === arr.length - 1 ? 'font-bold border-t-2' : ''}>
                        <TableCell>{label}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-4">
                  Retro recoveries flow from claims recorded in the Claims module; ceded premium applies each treaty's
                  retrocession percentage to earned premium at the valuation date.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ------------------------------------------------ Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              ['Loss Ratio', analytics.lossRatio === null ? '—' : `${analytics.lossRatio.toFixed(1)}%`],
              ['Combined Ratio', analytics.combinedRatio === null ? '—' : `${analytics.combinedRatio.toFixed(1)}%`],
              ['Claim Frequency', analytics.claimFrequency === null ? '—' : `${analytics.claimFrequency.toFixed(2)} / treaty`],
              ['Claim Severity', analytics.claimSeverity === null ? '—' : `${assumptions.reportingCurrency} ${fmtM(analytics.claimSeverity)}`]
            ] as Array<[string, string]>).map(([label, value]) => (
              <Card key={label}>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader>
                <CardContent><div className="text-xl font-bold">{value}</div></CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Premium & Claims Trend</CardTitle></CardHeader>
              <CardContent>
                {analytics.premiumTrend.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No data in scope.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={analytics.premiumTrend.map(p => ({
                      year: String(p.year), Premium: p.premium, Claims: p.incurred
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                      <ChartTooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="Premium" fill="#2563eb" />
                      <Bar dataKey="Claims" fill="#dc2626" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Loss Ratio Trend</CardTitle></CardHeader>
              <CardContent>
                {analytics.premiumTrend.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No data in scope.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={analytics.premiumTrend.map(p => ({
                      year: String(p.year), 'Loss Ratio %': p.lossRatio === null ? null : Number(p.lossRatio.toFixed(1))
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(v) => `${v}%`} />
                      <ChartTooltip formatter={(v: number) => `${v}%`} />
                      <Legend />
                      <Line type="monotone" dataKey="Loss Ratio %" stroke="#dc2626" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cedant Profitability</CardTitle>
              <CardDescription>Insurance service result by cedant</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cedant</TableHead>
                    <TableHead className="text-right">Premium</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Claims</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                    <TableHead className="text-right">Loss Ratio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cedantPerformance.map(p => (
                    <TableRow key={p.key}>
                      <TableCell className="font-medium">{p.key}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(p.premium)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(p.revenue)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(p.claimsIncurred)}</TableCell>
                      <TableCell className={`text-right font-mono ${p.result < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{fmt(p.result)}</TableCell>
                      <TableCell className="text-right font-mono">{p.lossRatio === null ? '—' : `${p.lossRatio.toFixed(1)}%`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Assumptions */}
        <TabsContent value="assumptions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Assumptions</CardTitle>
                <CardDescription>Set by the preparer — persisted across sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Rate (% p.a.)</Label>
                    <Input type="number" step="0.1" value={assumptions.discountRate}
                      onChange={(e) => setAssumption('discountRate', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expense Ratio (% of premium)</Label>
                    <Input type="number" step="0.1" value={assumptions.expenseRatio}
                      onChange={(e) => setAssumption('expenseRatio', parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Risk Adjustment Method</Label>
                  <Select value={assumptions.riskAdjustmentMethod}
                    onValueChange={(v) => setAssumption('riskAdjustmentMethod', v as Ifrs17Assumptions['riskAdjustmentMethod'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentOfReserves">Percentage of Reserves</SelectItem>
                      <SelectItem value="confidenceLevel">Confidence Level</SelectItem>
                      <SelectItem value="costOfCapital">Cost of Capital (placeholder)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {assumptions.riskAdjustmentMethod === 'percentOfReserves' && (
                  <div className="space-y-2">
                    <Label>Risk Adjustment (% of reserves)</Label>
                    <Input type="number" step="0.5" value={assumptions.riskAdjustmentPercent}
                      onChange={(e) => setAssumption('riskAdjustmentPercent', parseFloat(e.target.value) || 0)} />
                  </div>
                )}
                {assumptions.riskAdjustmentMethod === 'confidenceLevel' && (
                  <div className="space-y-2">
                    <Label>Confidence Level</Label>
                    <Select value={String(assumptions.confidenceLevel)}
                      onValueChange={(v) => setAssumption('confidenceLevel', parseInt(v) as Ifrs17Assumptions['confidenceLevel'])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[65, 75, 85, 95].map(c => <SelectItem key={c} value={String(c)}>{c}%</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {assumptions.riskAdjustmentMethod === 'costOfCapital' && (
                  <div className="space-y-2">
                    <Label>Cost of Capital Rate (% p.a.)</Label>
                    <Input type="number" step="0.5" value={assumptions.costOfCapitalRate}
                      onChange={(e) => setAssumption('costOfCapitalRate', parseFloat(e.target.value) || 0)} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calculated / Inherited Values</CardTitle>
                <CardDescription>Derived by the engine — not directly editable here</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {([
                      ['Expected loss ratio', `${actuarialAssumptions.expectedLossRatio}% (from Actuarial Engine)`],
                      ['Reserving method for IBNR', `${actuarialMethodLabel} (selected in Actuarial Engine)`],
                      ['Claims inflation', `${actuarialAssumptions.claimsInflation}% p.a. (from Actuarial Engine)`],
                      ['Total IBNR in scope', `${assumptions.reportingCurrency} ${fmt(totalIbnr)}`],
                      ['Risk adjustment basis', riskAdjustmentMethodLabel(assumptions)],
                      ['Reporting date', assumptions.valuationDate]
                    ] as Array<[string, string]>).map(([label, value]) => (
                      <TableRow key={label}>
                        <TableCell className="text-muted-foreground">{label}</TableCell>
                        <TableCell className="font-medium">{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Measurement Model Assignment</CardTitle>
              <CardDescription>PAA applies automatically to coverage ≤ 12 months; override per treaty (VFA is a placeholder)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Treaty</TableHead>
                    <TableHead>Coverage Period</TableHead>
                    <TableHead>Earned</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Override</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treaties.map(t => {
                    const model = measurementModel(t, assumptions);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.treatyName}</TableCell>
                        <TableCell>{t.inceptionDate} → {t.expiryDate}</TableCell>
                        <TableCell>{(earnedFraction(t, assumptions.valuationDate) * 100).toFixed(0)}%</TableCell>
                        <TableCell>{modelBadge(model)}</TableCell>
                        <TableCell>
                          <Select
                            value={assumptions.modelOverrides[t.id] ?? 'auto'}
                            onValueChange={(v) => {
                              const overrides = { ...assumptions.modelOverrides };
                              if (v === 'auto') delete overrides[t.id];
                              else overrides[t.id] = v as MeasurementModel;
                              setAssumption('modelOverrides', overrides);
                              toast.success(`${t.treatyName}: measurement model ${v === 'auto' ? 'reset to automatic' : `set to ${v}`}`);
                            }}
                          >
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Automatic</SelectItem>
                              <SelectItem value="PAA">PAA</SelectItem>
                              <SelectItem value="GMM">GMM</SelectItem>
                              <SelectItem value="VFA">VFA</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IfrsReporting;
