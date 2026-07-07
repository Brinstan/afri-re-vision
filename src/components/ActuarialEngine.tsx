import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/sonner";
import { Calculator, Download, AlertTriangle, CheckCircle, FileText, TrendingUp, Layers, Activity } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useDataStore } from './DataStore';
import {
  Assumptions, DEFAULT_ASSUMPTIONS, GroupingDimension, MethodKey, METHOD_LABELS, Triangle, TriangleBasis,
  buildMethodInputs, runAllMethods, mackStandardErrors, developmentFactors, paidToIncurredRatios,
  groupOptions, filterClaims, filterTreaties, xolAnalysis, portfolioAnalytics,
  triangleToCsv, downloadFile, latestDiagonal, currentYear
} from '@/lib/actuarial';

const ASSUMPTIONS_STORAGE_KEY = 'afrirevision-actuarial-assumptions';

const fmt = (n: number) => Math.round(n).toLocaleString();
const fmtM = (n: number) => `USD ${(n / 1_000_000).toFixed(2)}M`;
const pct = (n: number | null, dp = 1) => (n === null ? '—' : `${n.toFixed(dp)}%`);

const GROUPING_LABELS: Record<GroupingDimension, string> = {
  accidentYear: 'Accident Year',
  underwritingYear: 'Underwriting Year',
  lineOfBusiness: 'Line of Business',
  cedant: 'Cedant',
  treaty: 'Treaty'
};

const TriangleTable = ({ triangle, title, basis }: { triangle: Triangle; title: string; basis: TriangleBasis }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Cumulative by accident year and development age (years)</CardDescription>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          downloadFile(triangleToCsv(triangle, title), `${basis}-triangle-${new Date().toISOString().split('T')[0]}.csv`);
          toast.success(`${title} exported as CSV`);
        }}
      >
        <Download className="h-3 w-3 mr-1" />
        CSV
      </Button>
    </CardHeader>
    <CardContent>
      {triangle.origins.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">No claims data for this selection yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Accident Year</TableHead>
                {Array.from({ length: triangle.maxDev + 1 }, (_, i) => (
                  <TableHead key={i} className="text-right">Dev {i}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {triangle.origins.map(origin => (
                <TableRow key={origin}>
                  <TableCell className="font-medium">{origin}</TableCell>
                  {triangle.cells[origin].map((v, i) => (
                    <TableCell key={i} className="text-right font-mono text-sm">
                      {v === null ? <span className="text-muted-foreground">·</span> : basis === 'reported' ? v : fmt(v)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>
);

const ActuarialEngine = () => {
  const { treaties, claims } = useDataStore();

  const [dimension, setDimension] = useState<GroupingDimension>('accidentYear');
  const [groupKey, setGroupKey] = useState('all');
  const [assumptions, setAssumptions] = useState<Assumptions>(() => {
    try {
      const saved = localStorage.getItem(ASSUMPTIONS_STORAGE_KEY);
      return saved ? { ...DEFAULT_ASSUMPTIONS, ...JSON.parse(saved) } : DEFAULT_ASSUMPTIONS;
    } catch {
      return DEFAULT_ASSUMPTIONS;
    }
  });

  useEffect(() => {
    localStorage.setItem(ASSUMPTIONS_STORAGE_KEY, JSON.stringify(assumptions));
  }, [assumptions]);

  useEffect(() => { setGroupKey('all'); }, [dimension]);

  const setAssumption = <K extends keyof Assumptions>(key: K, value: Assumptions[K]) =>
    setAssumptions(a => ({ ...a, [key]: value }));

  // ---- Live computation pipeline -----------------------------------------
  const scopedClaims = useMemo(() => filterClaims(claims, treaties, dimension, groupKey), [claims, treaties, dimension, groupKey]);
  const scopedTreaties = useMemo(() => filterTreaties(treaties, dimension, groupKey), [treaties, dimension, groupKey]);

  const inputs = useMemo(() => buildMethodInputs(scopedClaims, scopedTreaties, assumptions), [scopedClaims, scopedTreaties, assumptions]);
  const methods = useMemo(() => runAllMethods(inputs), [inputs]);
  const factors = inputs.factors;
  const mack = useMemo(() => mackStandardErrors(inputs.incurredTriangle, factors, assumptions, methods.chainLadder), [inputs, factors, assumptions, methods]);
  const paidIncRatios = useMemo(() => paidToIncurredRatios(inputs.paidTriangle, inputs.incurredTriangle), [inputs]);
  const xol = useMemo(() => xolAnalysis(scopedTreaties, scopedClaims), [scopedTreaties, scopedClaims]);
  const analytics = useMemo(() => portfolioAnalytics(scopedTreaties, scopedClaims), [scopedTreaties, scopedClaims]);
  const options = useMemo(() => groupOptions(dimension, treaties, claims), [dimension, treaties, claims]);

  const methodList = [methods.chainLadder, methods.bornhuetterFerguson, methods.capeCod, methods.expectedLossRatio];
  const selectedResult = methodList.find(m => m.method === assumptions.selectedMethod) ?? methods.chainLadder;

  // ---- Chart data ----------------------------------------------------------
  const devChartData = useMemo(() => {
    const t = inputs.incurredTriangle;
    return Array.from({ length: t.maxDev + 1 }, (_, dev) => {
      const point: Record<string, number | string | null> = { dev: `Dev ${dev}` };
      t.origins.forEach(origin => { point[String(origin)] = t.cells[origin][dev]; });
      return point;
    });
  }, [inputs.incurredTriangle]);

  const runoffChartData = selectedResult.byOrigin.map(r => ({
    origin: String(r.origin), RBNS: Math.round(r.rbns), IBNR: Math.round(r.ibnr)
  }));

  const paidVsIncurredData = paidIncRatios.map(r => ({
    origin: String(r.origin), Paid: Math.round(r.paid), Incurred: Math.round(r.incurred)
  }));

  const lossRatioTrendData = analytics.premiumTrend.map(p => ({
    year: String(p.year), 'Loss Ratio %': p.lossRatio === null ? null : Number(p.lossRatio.toFixed(1))
  }));

  // ---- Exports -------------------------------------------------------------
  const exportAllTriangles = () => {
    const stamp = new Date().toISOString().split('T')[0];
    const csv = [
      triangleToCsv(inputs.paidTriangle, 'PAID LOSS TRIANGLE'),
      '',
      triangleToCsv(inputs.incurredTriangle, 'INCURRED LOSS TRIANGLE'),
      '',
      triangleToCsv(inputs.reportedTriangle, 'REPORTED CLAIMS TRIANGLE')
    ].join('\n');
    downloadFile(csv, `actuarial-triangles-${stamp}.csv`);
    toast.success("All triangles exported as CSV");
  };

  const exportReserveReport = () => {
    const w = window.open('', '_blank');
    if (!w) {
      toast.error("Pop-up blocked — allow pop-ups to export the PDF report");
      return;
    }
    const rows = methodList.map(m => `
      <tr>
        <td>${METHOD_LABELS[m.method]}${m.method === assumptions.selectedMethod ? ' ★' : ''}</td>
        <td style="text-align:right">${fmt(m.totals.ultimate)}</td>
        <td style="text-align:right">${fmt(m.totals.ibnr)}</td>
        <td style="text-align:right">${fmt(m.totals.rbns)}</td>
        <td style="text-align:right">${fmt(m.totals.reserve)}</td>
        <td>${m.assumptionsNote}</td>
      </tr>`).join('');
    const originRows = selectedResult.byOrigin.map(r => `
      <tr>
        <td>${r.origin}</td>
        <td style="text-align:right">${fmt(r.premium)}</td>
        <td style="text-align:right">${fmt(r.paidToDate)}</td>
        <td style="text-align:right">${fmt(r.incurredToDate)}</td>
        <td style="text-align:right">${fmt(r.ultimate)}</td>
        <td style="text-align:right">${fmt(r.ibnr)}</td>
        <td style="text-align:right">${fmt(r.rbns)}</td>
        <td style="text-align:right">${fmt(r.reserve)}</td>
      </tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Reserve Summary Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #111; }
        h1 { font-size: 20px; } h2 { font-size: 15px; margin-top: 24px; }
        table { border-collapse: collapse; width: 100%; font-size: 12px; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
        th { background: #f0f2f5; }
        .meta { color: #555; font-size: 12px; }
      </style></head><body>
      <h1>AfriReVision — Actuarial Reserve Summary</h1>
      <p class="meta">Generated ${new Date().toLocaleString()} · Scope: ${GROUPING_LABELS[dimension]} = ${groupKey === 'all' ? 'All' : options.find(o => o.key === groupKey)?.label ?? groupKey}
      · ${scopedClaims.length} claims, ${scopedTreaties.length} treaties</p>
      <h2>Methodology Comparison</h2>
      <table><tr><th>Method</th><th>Ultimate Loss</th><th>IBNR</th><th>RBNS</th><th>Total Reserve</th><th>Assumptions</th></tr>${rows}</table>
      <h2>Selected Method Detail — ${METHOD_LABELS[selectedResult.method]}</h2>
      <table><tr><th>Accident Year</th><th>Premium</th><th>Paid</th><th>Incurred</th><th>Ultimate</th><th>IBNR</th><th>RBNS</th><th>Reserve</th></tr>${originRows}</table>
      <h2>Governance Record</h2>
      <table>
        <tr><th>Selected methodology</th><td>${assumptions.selectedMethod ? METHOD_LABELS[assumptions.selectedMethod] : 'Not yet selected'}</td></tr>
        <tr><th>Claims inflation</th><td>${assumptions.claimsInflation}% p.a.</td></tr>
        <tr><th>Premium inflation</th><td>${assumptions.premiumInflation}% p.a.</td></tr>
        <tr><th>Expected loss ratio</th><td>${assumptions.expectedLossRatio}%</td></tr>
        <tr><th>Development factor selection</th><td>${assumptions.factorMethod} average</td></tr>
        <tr><th>Tail factor</th><td>${assumptions.tailFactor}</td></tr>
        <tr><th>Mack total SE (Chain Ladder)</th><td>${fmt(mack.totalStandardError)}</td></tr>
      </table>
      <script>window.onload = () => window.print();</script>
      </body></html>`);
    w.document.close();
    toast.success("Reserve report opened — use the print dialog to save as PDF");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Actuarial Reserving Workbench</h2>
          <p className="text-gray-600">Live reserving computations from {claims.length} claims and {treaties.length} treaties in the system</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportAllTriangles}>
            <Download className="h-4 w-4 mr-2" />
            Export Triangles
          </Button>
          <Button onClick={exportReserveReport}>
            <FileText className="h-4 w-4 mr-2" />
            Reserve Report (PDF)
          </Button>
        </div>
      </div>

      {/* Scope + headline reserves */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Analysis Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={dimension} onValueChange={(v) => setDimension(v as GroupingDimension)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(GROUPING_LABELS) as GroupingDimension[]).map(d => (
                  <SelectItem key={d} value={d}>{GROUPING_LABELS[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupKey} onValueChange={setGroupKey}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {options.map(o => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ultimate Loss ({METHOD_LABELS[selectedResult.method]})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtM(selectedResult.totals.ultimate)}</div>
            <p className="text-xs text-muted-foreground">Incurred to date {fmtM(selectedResult.totals.incurred)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">IBNR / RBNS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtM(selectedResult.totals.ibnr)}</div>
            <p className="text-xs text-muted-foreground">RBNS {fmtM(selectedResult.totals.rbns)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding Reserves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtM(selectedResult.totals.reserve)}</div>
            <p className="text-xs text-muted-foreground">Mack SE ±{fmtM(mack.totalStandardError)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assumptions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="triangles">Triangles</TabsTrigger>
          <TabsTrigger value="factors">Dev Factors</TabsTrigger>
          <TabsTrigger value="comparison">Method Comparison</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="xol">XOL Analysis</TabsTrigger>
          <TabsTrigger value="analytics">Portfolio Analytics</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------ Assumptions */}
        <TabsContent value="assumptions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inflation & Trend Adjustments</CardTitle>
                <CardDescription>Historical data is restated to current cost levels before development methods are applied</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="claimsInflation">Claims Inflation (% p.a.)</Label>
                    <Input
                      id="claimsInflation" type="number" step="0.1"
                      value={assumptions.claimsInflation}
                      onChange={(e) => setAssumption('claimsInflation', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="premiumInflation">Premium Trend (% p.a.)</Label>
                    <Input
                      id="premiumInflation" type="number" step="0.1"
                      value={assumptions.premiumInflation}
                      onChange={(e) => setAssumption('premiumInflation', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Claim from year Y is multiplied by (1 + rate)^({currentYear()} − Y). Premium adjustment feeds the ELR, BF and Cape Cod methods.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reserving Assumptions</CardTitle>
                <CardDescription>Applied consistently across all methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="elr">Expected Loss Ratio (%)</Label>
                    <Input
                      id="elr" type="number" step="0.5"
                      value={assumptions.expectedLossRatio}
                      onChange={(e) => setAssumption('expectedLossRatio', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tail">Tail Factor</Label>
                    <Input
                      id="tail" type="number" step="0.005" min="1"
                      value={assumptions.tailFactor}
                      onChange={(e) => setAssumption('tailFactor', Math.max(1, parseFloat(e.target.value) || 1))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Development Factor Selection</Label>
                  <Select value={assumptions.factorMethod} onValueChange={(v) => setAssumption('factorMethod', v as 'simple' | 'weighted')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weighted">Volume-Weighted Average</SelectItem>
                      <SelectItem value="simple">Simple Average</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Governance record */}
          <Card>
            <CardHeader>
              <CardTitle>Assumption Governance Record</CardTitle>
              <CardDescription>Current basis of the reserving exercise — persisted across sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Selected Methodology</p>
                  <p className="font-medium">{assumptions.selectedMethod ? METHOD_LABELS[assumptions.selectedMethod] : 'Not selected — Chain Ladder shown by default'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Claims Inflation</p>
                  <p className="font-medium">{assumptions.claimsInflation}% p.a.</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Premium Trend</p>
                  <p className="font-medium">{assumptions.premiumInflation}% p.a.</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expected Loss Ratio</p>
                  <p className="font-medium">{assumptions.expectedLossRatio}% (Cape Cod implies {(methods.capeCodImpliedElr * 100).toFixed(1)}%)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Factor Selection</p>
                  <p className="font-medium capitalize">{assumptions.factorMethod} average</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tail Factor</p>
                  <p className="font-medium">{assumptions.tailFactor.toFixed(3)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Triangles */}
        <TabsContent value="triangles" className="space-y-4">
          <TriangleTable triangle={inputs.paidTriangle} title="Paid Loss Triangle" basis="paid" />
          <TriangleTable triangle={inputs.incurredTriangle} title="Incurred Loss Triangle" basis="incurred" />
          <TriangleTable triangle={inputs.reportedTriangle} title="Reported Claims Triangle (counts)" basis="reported" />

          {devChartData.length > 1 && inputs.incurredTriangle.origins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Incurred Loss Development</CardTitle>
                <CardDescription>Cumulative incurred by development age, per accident year</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={devChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dev" />
                    <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                    <ChartTooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    {inputs.incurredTriangle.origins.map((origin, i) => (
                      <Line key={origin} type="monotone" dataKey={String(origin)} stroke={['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c'][i % 5]} connectNulls={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ------------------------------------------------ Development factors */}
        <TabsContent value="factors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Age-to-Age Development Factors</CardTitle>
              <CardDescription>Computed from the incurred triangle; unstable periods are flagged</CardDescription>
            </CardHeader>
            <CardContent>
              {factors.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  Not enough development history to estimate factors — projections fall back to the tail factor. Add claims across multiple years to build history.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Simple Avg</TableHead>
                      <TableHead className="text-right">Weighted Avg</TableHead>
                      <TableHead className="text-right">Observations</TableHead>
                      <TableHead className="text-right">Volatility (SD)</TableHead>
                      <TableHead>Stability</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factors.map(f => (
                      <TableRow key={f.period}>
                        <TableCell className="font-medium">{f.period}</TableCell>
                        <TableCell className="text-right font-mono">{f.simple === null ? '—' : f.simple.toFixed(4)}</TableCell>
                        <TableCell className="text-right font-mono">{f.weighted === null ? '—' : f.weighted.toFixed(4)}</TableCell>
                        <TableCell className="text-right">{f.observations}</TableCell>
                        <TableCell className="text-right font-mono">{f.volatility === null ? '—' : f.volatility.toFixed(4)}</TableCell>
                        <TableCell>
                          {f.observations === 0 ? (
                            <Badge variant="outline">No data</Badge>
                          ) : f.unstable ? (
                            <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Unstable</Badge>
                          ) : (
                            <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Stable</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                Active selection: <span className="font-medium capitalize">{assumptions.factorMethod} average</span> with tail factor {assumptions.tailFactor.toFixed(3)}.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mack Chain Ladder — Reserve Variability</CardTitle>
              <CardDescription>Simplified process-variance estimate of Chain Ladder reserve uncertainty</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Accident Year</TableHead>
                    <TableHead className="text-right">CL Reserve</TableHead>
                    <TableHead className="text-right">Standard Error</TableHead>
                    <TableHead className="text-right">CV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mack.byOrigin.map(r => (
                    <TableRow key={r.origin}>
                      <TableCell className="font-medium">{r.origin}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.reserve)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.standardError)}</TableCell>
                      <TableCell className="text-right font-mono">{r.cv === null ? '—' : `${(r.cv * 100).toFixed(1)}%`}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right font-mono">{fmt(mack.totalReserve)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(mack.totalStandardError)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {mack.totalReserve > 0 ? `${((mack.totalStandardError / mack.totalReserve) * 100).toFixed(1)}%` : '—'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Method comparison */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reserving Methodology Comparison</CardTitle>
              <CardDescription>Select the preferred method — the choice is recorded in the governance panel and used across the workbench</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Ultimate Loss</TableHead>
                    <TableHead className="text-right">IBNR</TableHead>
                    <TableHead className="text-right">RBNS</TableHead>
                    <TableHead className="text-right">Total Reserve</TableHead>
                    <TableHead className="text-right">Diff. vs Chain Ladder</TableHead>
                    <TableHead>Assumptions</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methodList.map(m => {
                    const diff = m.totals.ultimate - methods.chainLadder.totals.ultimate;
                    const isSelected = assumptions.selectedMethod === m.method;
                    return (
                      <TableRow key={m.method} className={isSelected ? 'bg-blue-50 dark:bg-blue-950' : ''}>
                        <TableCell className="font-medium">{METHOD_LABELS[m.method]}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(m.totals.ultimate)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(m.totals.ibnr)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(m.totals.rbns)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(m.totals.reserve)}</TableCell>
                        <TableCell className={`text-right font-mono ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : ''}`}>
                          {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${fmt(diff)}`}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-56">{m.assumptionsNote}</TableCell>
                        <TableCell>
                          {isSelected ? (
                            <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Selected</Badge>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => {
                              setAssumption('selectedMethod', m.method);
                              toast.success(`${METHOD_LABELS[m.method]} recorded as the preferred reserving methodology`);
                            }}>
                              Select
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected Method by Accident Year — {METHOD_LABELS[selectedResult.method]}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Accident Year</TableHead>
                    <TableHead className="text-right">Premium</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Incurred</TableHead>
                    <TableHead className="text-right">Ultimate</TableHead>
                    <TableHead className="text-right">IBNR</TableHead>
                    <TableHead className="text-right">RBNS</TableHead>
                    <TableHead className="text-right">Reserve</TableHead>
                    <TableHead className="text-right">Ult. Loss Ratio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedResult.byOrigin.map(r => (
                    <TableRow key={r.origin}>
                      <TableCell className="font-medium">{r.origin}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.premium)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.paidToDate)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.incurredToDate)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.ultimate)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.ibnr)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.rbns)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.reserve)}</TableCell>
                      <TableCell className="text-right font-mono">{r.premium > 0 ? pct((r.ultimate / r.premium) * 100) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {runoffChartData.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Reserve Run-off by Accident Year</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={runoffChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="origin" />
                      <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                      <ChartTooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="RBNS" stackId="a" fill="#2563eb" />
                      <Bar dataKey="IBNR" stackId="a" fill="#93c5fd" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Diagnostics */}
        <TabsContent value="diagnostics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paid-to-Incurred Ratio Analysis</CardTitle>
              <CardDescription>Claims maturity by accident year — low ratios indicate immature years with more development to come</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Accident Year</TableHead>
                    <TableHead className="text-right">Cumulative Paid</TableHead>
                    <TableHead className="text-right">Cumulative Incurred</TableHead>
                    <TableHead className="text-right">Paid / Incurred</TableHead>
                    <TableHead>Maturity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidIncRatios.map(r => (
                    <TableRow key={r.origin}>
                      <TableCell className="font-medium">{r.origin}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.paid)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.incurred)}</TableCell>
                      <TableCell className="text-right font-mono">{r.ratio === null ? '—' : `${(r.ratio * 100).toFixed(1)}%`}</TableCell>
                      <TableCell>
                        {r.ratio === null ? <Badge variant="outline">No data</Badge> :
                          r.ratio >= 0.9 ? <Badge variant="secondary">Mature</Badge> :
                          r.ratio >= 0.5 ? <Badge>Developing</Badge> :
                          <Badge variant="destructive">Immature</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {paidVsIncurredData.length > 0 && (
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={paidVsIncurredData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="origin" />
                      <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                      <ChartTooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="Paid" fill="#16a34a" />
                      <Bar dataKey="Incurred" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reserve Adequacy & Development Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const flags: Array<{ level: 'warn' | 'ok'; text: string }> = [];
                factors.filter(f => f.unstable).forEach(f =>
                  flags.push({ level: 'warn', text: `Development period ${f.period} shows unstable age-to-age factors (SD ${f.volatility?.toFixed(3)}) — review before relying on Chain Ladder for immature years.` }));
                const clVsBf = methods.chainLadder.totals.ultimate - methods.bornhuetterFerguson.totals.ultimate;
                if (Math.abs(clVsBf) > 0.15 * Math.max(methods.bornhuetterFerguson.totals.ultimate, 1)) {
                  flags.push({ level: 'warn', text: `Chain Ladder and Bornhuetter-Ferguson ultimates differ by ${fmt(Math.abs(clVsBf))} (>15%) — data may be too immature for pure development methods.` });
                }
                paidIncRatios.filter(r => r.ratio !== null && r.ratio < 0.5).forEach(r =>
                  flags.push({ level: 'warn', text: `Accident year ${r.origin} is immature (paid/incurred ${(r.ratio! * 100).toFixed(0)}%) — reserves rely heavily on case estimates.` }));
                selectedResult.byOrigin.filter(r => r.premium > 0 && r.ultimate / r.premium > 1).forEach(r =>
                  flags.push({ level: 'warn', text: `Accident year ${r.origin} ultimate loss ratio exceeds 100% (${((r.ultimate / r.premium) * 100).toFixed(0)}%) — potential reserve strengthening or under-pricing.` }));
                if (flags.length === 0) flags.push({ level: 'ok', text: 'No unusual development or adequacy flags for the current selection.' });
                return flags.map((f, i) => (
                  <div key={i} className={`flex items-start space-x-2 p-3 rounded-lg ${f.level === 'warn' ? 'bg-amber-50 dark:bg-amber-950' : 'bg-green-50 dark:bg-green-950'}`}>
                    {f.level === 'warn'
                      ? <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      : <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />}
                    <p className="text-sm">{f.text}</p>
                  </div>
                ));
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ XOL */}
        <TabsContent value="xol" className="space-y-4">
          {xol.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Layers className="h-8 w-8 mx-auto mb-2" />
                <p>No XOL-structured treaties in the current selection.</p>
              </CardContent>
            </Card>
          ) : xol.map(t => (
            <Card key={t.treatyId}>
              <CardHeader>
                <CardTitle className="text-lg">{t.treatyName} <span className="text-sm font-normal text-muted-foreground">({t.contractNumber})</span></CardTitle>
                <CardDescription>Layer recoveries, retention and reinstatement impact from linked claims</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Gross Claims</p>
                    <p className="font-bold">{fmt(t.grossClaims)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reinsurer Share</p>
                    <p className="font-bold text-blue-600">{fmt(t.reinsurerShare)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Retro Recovery</p>
                    <p className="font-bold text-purple-600">{fmt(t.retroRecovery)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net Retention</p>
                    <p className="font-bold text-orange-600">{fmt(t.netRetention)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reinstatement Premiums</p>
                    <p className="font-bold text-green-600">{fmt(t.reinstatementPremiums)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {t.layers.map(l => (
                    <div key={l.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{l.name} — limit {fmt(l.limit)}</span>
                        <span>{l.utilisationPct.toFixed(1)}% utilised · {fmt(l.remainingCapacity)} remaining</span>
                      </div>
                      <Progress value={Math.min(100, l.utilisationPct)} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ------------------------------------------------ Portfolio analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Loss Ratio', value: pct(analytics.lossRatio), icon: <Activity className="h-4 w-4" /> },
              { label: 'Combined Ratio', value: pct(analytics.combinedRatio), icon: <Calculator className="h-4 w-4" /> },
              { label: 'Commission Ratio', value: pct(analytics.commissionRatio), icon: <TrendingUp className="h-4 w-4" /> },
              { label: 'Claim Frequency', value: analytics.claimFrequency === null ? '—' : `${analytics.claimFrequency.toFixed(2)} / treaty`, icon: <FileText className="h-4 w-4" /> },
              { label: 'Claim Severity', value: analytics.claimSeverity === null ? '—' : fmtM(analytics.claimSeverity), icon: <AlertTriangle className="h-4 w-4" /> }
            ].map(kpi => (
              <Card key={kpi.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                  {kpi.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{kpi.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Premium vs Incurred by Year</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.premiumTrend.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No data for this selection.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={analytics.premiumTrend.map(p => ({ year: String(p.year), Premium: p.premium, Incurred: p.incurred }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                      <ChartTooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="Premium" fill="#2563eb" />
                      <Bar dataKey="Incurred" fill="#dc2626" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loss Ratio Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {lossRatioTrendData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No data for this selection.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={lossRatioTrendData}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ActuarialEngine;
