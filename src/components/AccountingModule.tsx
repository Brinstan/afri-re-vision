import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import {
  BookOpen, Building, Calculator, CheckCircle, CreditCard, Download, Eye,
  FileSpreadsheet, FileText, Landmark, Plus, Save, Scale, Search, Target,
  TrendingUp, Wallet, X
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDataStore, Investment, ManualJournal } from './DataStore';
import PortfolioAnalysis from './PortfolioAnalysis';
import {
  buildMethodInputs, runAllMethods, METHOD_LABELS, MethodKey,
  DEFAULT_ASSUMPTIONS as ACTUARIAL_DEFAULTS
} from '@/lib/actuarial';
import { Account, Journal } from '@/accounting/types';
import { allAccounts, accountsByCategory, loadCustomAccounts, saveCustomAccounts } from '@/accounting/chartOfAccounts';
import { SUPPORTED_CURRENCIES, loadFxRates, saveFxRates, translate, fxExposures } from '@/accounting/currency';
import { allJournals } from '@/accounting/journals';
import { toLedger, filterLedger } from '@/accounting/ledger';
import { premiumReceivables, counterpartyReceivables, agingAnalysis, paymentHistory } from '@/accounting/receivables';
import { claimsPayables, commissionPayables, retroPayables, paymentSchedule } from '@/accounting/payables';
import { deriveCashBook, bankPositions, receiptRegister, paymentRegister, loadReconciled, saveReconciled, reconciliationKey } from '@/accounting/bank';
import { trialBalance, trialBalanceTotals } from '@/accounting/trialBalance';
import { buildStatements, StatementLine } from '@/accounting/financialStatements';
import { exportLedgerCsv, exportTrialBalanceCsv, exportFinanceExcel, exportManagementReport } from '@/accounting/reports';

const fmt = (n: number) => Math.round(n).toLocaleString();
const fmtM = (n: number) => `${(n / 1_000_000).toFixed(2)}M`;

const StatementTable = ({ title, lines, description }: { title: string; lines: StatementLine[]; description?: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>
      <Table>
        <TableBody>
          {lines.map((l, i) => (
            <TableRow key={i} className={l.emphasis ? 'font-bold border-t-2' : ''}>
              <TableCell>{l.label}</TableCell>
              <TableCell className={`text-right font-mono ${l.amount < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                {l.amount < 0 ? `(${fmt(Math.abs(l.amount))})` : fmt(l.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const AccountingModule = () => {
  const {
    treaties, claims, investments, bankAccounts, manualJournals, auditLog,
    retroProgrammes, retroClaims,
    updateClaim, addPremiumBooking, addInvestment, updateInvestment,
    addBankAccount, addManualJournal, logAudit
  } = useDataStore();

  const [activeTab, setActiveTab] = useState("dashboard");

  // FX rates & custom accounts (persisted outside the domain store)
  const [fxRates, setFxRates] = useState(loadFxRates);
  const [customAccounts, setCustomAccounts] = useState<Account[]>(loadCustomAccounts);
  const [reconciled, setReconciled] = useState<Set<string>>(loadReconciled);

  // ---- IBNR from the actuarial engine (feeds the IFRS adjustment journal) ---
  const totalIbnr = useMemo(() => {
    try {
      const saved = localStorage.getItem('afrirevision-actuarial-assumptions');
      const assumptions = saved ? { ...ACTUARIAL_DEFAULTS, ...JSON.parse(saved) } : ACTUARIAL_DEFAULTS;
      const methods = runAllMethods(buildMethodInputs(claims, treaties, assumptions));
      const key: MethodKey = assumptions.selectedMethod ?? 'chainLadder';
      const list = [methods.chainLadder, methods.bornhuetterFerguson, methods.capeCod, methods.expectedLossRatio];
      return (list.find(m => m.method === key) ?? methods.chainLadder).totals.ibnr;
    } catch { return 0; }
  }, [claims, treaties]);

  // ---- Accounting pipeline (all derived, recomputes on any store change) ----
  const journals = useMemo(
    () => allJournals(treaties, claims, investments, manualJournals, totalIbnr, retroProgrammes, retroClaims),
    [treaties, claims, investments, manualJournals, totalIbnr, retroProgrammes, retroClaims]
  );
  const ledger = useMemo(() => toLedger(journals, fxRates), [journals, fxRates]);
  const tbUnadjusted = useMemo(() => trialBalance(ledger, 'unadjusted', customAccounts), [ledger, customAccounts]);
  const tbAdjusted = useMemo(() => trialBalance(ledger, 'adjusted', customAccounts), [ledger, customAccounts]);
  const cashBook = useMemo(() => deriveCashBook(treaties, claims, investments, bankAccounts), [treaties, claims, investments, bankAccounts]);
  const banks = useMemo(() => bankPositions(bankAccounts, cashBook), [bankAccounts, cashBook]);
  const openingCash = useMemo(
    () => bankAccounts.reduce((s, b) => s + translate(b.openingBalance, b.currency, fxRates), 0),
    [bankAccounts, fxRates]
  );
  const statements = useMemo(() => buildStatements(tbAdjusted, cashBook, openingCash), [tbAdjusted, cashBook, openingCash]);

  const receivableRows = useMemo(() => premiumReceivables(treaties), [treaties]);
  const brokerRows = useMemo(() => counterpartyReceivables(treaties, 'broker'), [treaties]);
  const cedantRows = useMemo(() => counterpartyReceivables(treaties, 'cedant'), [treaties]);
  const aging = useMemo(() => agingAnalysis(receivableRows), [receivableRows]);
  const receipts = useMemo(() => paymentHistory(treaties), [treaties]);

  const allPayables = useMemo(
    () => [...claimsPayables(claims, treaties), ...commissionPayables(treaties), ...retroPayables(treaties)],
    [claims, treaties]
  );
  const schedule = useMemo(() => paymentSchedule(allPayables), [allPayables]);
  const exposures = useMemo(() => fxExposures(treaties, fxRates), [treaties, fxRates]);

  // ---- Ledger drill-down state ----------------------------------------------
  const [ledgerFilters, setLedgerFilters] = useState({ account: 'all', source: 'all', search: '' });
  const filteredLedger = useMemo(() => filterLedger(ledger, ledgerFilters), [ledger, ledgerFilters]);
  const [viewedJournal, setViewedJournal] = useState<Journal | null>(null);

  // ---- Dialog state ----------------------------------------------------------
  const [payingClaim, setPayingClaim] = useState<{ claimId: string; label: string; outstanding: number; currency: string } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [journalForm, setJournalForm] = useState({ debitAccount: '', creditAccount: '', amount: '', narration: '', reference: '', adjustment: false });
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({ code: '', name: '', category: 'Assets', normalSide: 'debit' });
  const [investmentDialogOpen, setInvestmentDialogOpen] = useState(false);
  const [investmentForm, setInvestmentForm] = useState({
    investmentEntity: '', entityType: '', investmentType: '', investmentDate: '',
    amount: '', expectedReturnRate: '', maturityDate: '', riskLevel: '', description: '', bankAccountId: ''
  });
  const [returnDialog, setReturnDialog] = useState<Investment | null>(null);
  const [returnAmount, setReturnAmount] = useState('');
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ name: '', bank: '', accountNumber: '', currency: 'USD', openingBalance: '' });

  // ---- Handlers --------------------------------------------------------------
  const handlePayClaim = () => {
    if (!payingClaim) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid payment amount"); return; }
    if (amount > payingClaim.outstanding) {
      toast.error(`Payment cannot exceed the outstanding ${payingClaim.currency} ${fmt(payingClaim.outstanding)}`);
      return;
    }
    const claim = claims.find(c => c.id === payingClaim.claimId);
    if (!claim) return;
    const isFull = amount >= payingClaim.outstanding;
    const reference = `PAY-${Date.now()}`;
    updateClaim(claim.id, {
      status: isFull ? 'Settled' : 'Partial Payment',
      paidAmount: (claim.paidAmount ?? 0) + amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentReference: reference
    });
    addPremiumBooking(claim.treatyId, {
      id: `${Date.now()}-cp`,
      amount,
      type: `Claim Payment (${reference})`,
      date: new Date().toISOString().split('T')[0],
      status: 'Paid',
      paidAmount: amount
    });
    toast.success(`Payment of ${payingClaim.currency} ${fmt(amount)} processed — claim ${isFull ? 'settled' : 'partially paid'}; journals updated automatically`);
    setPayingClaim(null);
    setPaymentAmount('');
  };

  const handleAddJournal = () => {
    const amount = parseFloat(journalForm.amount);
    if (!journalForm.debitAccount || !journalForm.creditAccount) { toast.error("Select debit and credit accounts"); return; }
    if (journalForm.debitAccount === journalForm.creditAccount) { toast.error("Debit and credit accounts must differ"); return; }
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!journalForm.narration) { toast.error("Enter a narration"); return; }
    const userStr = (() => { try { return JSON.parse(localStorage.getItem('user') ?? '{}').username ?? 'finance'; } catch { return 'finance'; } })();
    const journal: ManualJournal = {
      id: `JN-MAN-${Date.now()}`,
      postingDate: new Date().toISOString().split('T')[0],
      reference: journalForm.reference || `MAN-${Date.now()}`,
      narration: journalForm.narration,
      currency: fxRates.reportingCurrency,
      debitAccount: journalForm.debitAccount,
      creditAccount: journalForm.creditAccount,
      amount,
      postedBy: userStr,
      adjustment: journalForm.adjustment
    };
    addManualJournal(journal);
    setJournalDialogOpen(false);
    setJournalForm({ debitAccount: '', creditAccount: '', amount: '', narration: '', reference: '', adjustment: false });
    toast.success(`Manual journal ${journal.id} posted`);
  };

  const handleAddAccount = () => {
    if (!/^\d{4}$/.test(accountForm.code)) { toast.error("Account code must be a 4-digit number"); return; }
    if (allAccounts(customAccounts).some(a => a.code === accountForm.code)) { toast.error(`Account ${accountForm.code} already exists`); return; }
    if (!accountForm.name) { toast.error("Enter an account name"); return; }
    const updated = [...customAccounts, { ...accountForm, category: accountForm.category as Account['category'], normalSide: accountForm.normalSide as Account['normalSide'] }];
    setCustomAccounts(updated);
    saveCustomAccounts(updated);
    logAudit({ action: 'CREATE', entity: 'Account', entityId: accountForm.code, sourceModule: 'Accounting', newValue: accountForm.name });
    setAccountDialogOpen(false);
    setAccountForm({ code: '', name: '', category: 'Assets', normalSide: 'debit' });
    toast.success(`Account ${accountForm.code} added to the chart of accounts`);
  };

  const handleAddInvestment = () => {
    const amount = parseFloat(investmentForm.amount);
    if (!investmentForm.investmentEntity) { toast.error("Enter the investment entity"); return; }
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!investmentForm.investmentDate) { toast.error("Select the investment date"); return; }
    if (!investmentForm.bankAccountId) { toast.error("Select the funding bank account"); return; }
    const funding = banks.find(b => b.account.id === investmentForm.bankAccountId);
    if (funding && amount > funding.balance) {
      toast.error(`Insufficient funds: ${funding.account.name} balance is ${funding.account.currency} ${fmt(funding.balance)}`);
      return;
    }
    const rate = parseFloat(investmentForm.expectedReturnRate) || 0;
    addInvestment({
      id: `inv-${Date.now()}`,
      investmentEntity: investmentForm.investmentEntity,
      entityType: investmentForm.entityType || 'Other',
      investmentType: investmentForm.investmentType || 'Others',
      investmentDate: investmentForm.investmentDate,
      amount,
      expectedReturnRate: rate,
      expectedReturnAmount: amount * rate / 100,
      maturityDate: investmentForm.maturityDate,
      riskLevel: investmentForm.riskLevel || 'Medium',
      description: investmentForm.description,
      status: 'Active',
      actualReturns: 0,
      currency: funding?.account.currency ?? fxRates.reportingCurrency,
      bankAccountId: investmentForm.bankAccountId
    });
    setInvestmentDialogOpen(false);
    setInvestmentForm({ investmentEntity: '', entityType: '', investmentType: '', investmentDate: '', amount: '', expectedReturnRate: '', maturityDate: '', riskLevel: '', description: '', bankAccountId: '' });
    toast.success("Investment recorded — purchase journal and cash book entry generated automatically");
  };

  const handleRecordReturn = () => {
    if (!returnDialog) return;
    const amount = parseFloat(returnAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid return amount"); return; }
    updateInvestment(returnDialog.id, { actualReturns: returnDialog.actualReturns + amount });
    setReturnDialog(null);
    setReturnAmount('');
    toast.success(`Return of ${fmt(amount)} recorded — investment income journal generated automatically`);
  };

  const handleAddBank = () => {
    if (!bankForm.name || !bankForm.bank) { toast.error("Enter the account name and bank"); return; }
    const opening = parseFloat(bankForm.openingBalance) || 0;
    addBankAccount({
      id: `bank-${Date.now()}`,
      name: bankForm.name,
      bank: bankForm.bank,
      accountNumber: bankForm.accountNumber || 'N/A',
      currency: bankForm.currency,
      openingBalance: opening
    });
    setBankDialogOpen(false);
    setBankForm({ name: '', bank: '', accountNumber: '', currency: 'USD', openingBalance: '' });
    toast.success("Bank account added");
  };

  const toggleReconciled = (key: string) => {
    const next = new Set(reconciled);
    if (next.has(key)) next.delete(key); else next.add(key);
    setReconciled(next);
    saveReconciled(next);
  };

  const setRate = (currency: string, basis: 'closing' | 'historical', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return;
    const next = { ...fxRates, [basis]: { ...fxRates[basis], [currency]: num } };
    setFxRates(next);
    saveFxRates(next);
  };

  const handleManagementReport = () => {
    const ok = exportManagementReport({
      statements,
      tbTotals: trialBalanceTotals(tbAdjusted),
      reportingCurrency: fxRates.reportingCurrency,
      kpis: [
        ['Premium collected', `${fmtM(receipts.reduce((s, r) => s + r.amount, 0))}`],
        ['Premium receivables outstanding', `${fmtM(receivableRows.reduce((s, r) => s + r.outstanding, 0))}`],
        ['Outstanding claims payable', `${fmtM(allPayables.filter(p => p.type === 'Claims').reduce((s, p) => s + p.outstanding, 0))}`],
        ['Cash position (all banks)', `${fmtM(banks.reduce((s, b) => s + translate(b.balance, b.account.currency, fxRates), 0))}`],
        ['Technical result', `${fmtM(statements.technicalResult)}`],
        ['Net profit', `${fmtM(statements.netProfit)}`]
      ]
    });
    if (ok) toast.success("Management report opened — use the print dialog to save as PDF");
    else toast.error("Pop-up blocked — allow pop-ups to export the report");
  };

  const totalCashReporting = banks.reduce((s, b) => s + translate(b.balance, b.account.currency, fxRates), 0);
  const accounts = allAccounts(customAccounts);
  const grouped = accountsByCategory(customAccounts);
  const monthlyPerformance = useMemo(() => {
    const months = new Map<string, { receipts: number; payments: number }>();
    cashBook.forEach(t => {
      const month = t.date.slice(0, 7);
      const m = months.get(month) ?? { receipts: 0, payments: 0 };
      if (t.type === 'Receipt') m.receipts += translate(t.amount, bankAccounts.find(b => b.id === t.bankAccountId)?.currency ?? 'USD', fxRates);
      else m.payments += translate(t.amount, bankAccounts.find(b => b.id === t.bankAccountId)?.currency ?? 'USD', fxRates);
      months.set(month, m);
    });
    return Array.from(months.entries()).sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, Receipts: Math.round(v.receipts), Payments: Math.round(v.payments) }));
  }, [cashBook, bankAccounts, fxRates]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Enterprise Accounting & Finance</h2>
          <p className="text-muted-foreground">
            {journals.length} journals auto-generated from operations · reporting in {fxRates.reportingCurrency}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => { exportFinanceExcel(tbAdjusted, statements); toast.success("Financial analysis exported"); }}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel Analysis
          </Button>
          <Button onClick={handleManagementReport}>
            <FileText className="h-4 w-4 mr-2" />
            Management Report (PDF)
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="coa">Accounts</TabsTrigger>
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="payables">Payables</TabsTrigger>
          <TabsTrigger value="cash">Cash</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="tb">Trial Balance</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------ Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Cash Position', value: totalCashReporting, sub: `${bankAccounts.length} bank accounts`, icon: <Landmark className="h-4 w-4" /> },
              { label: 'Premium Collection', value: receipts.reduce((s, r) => s + r.amount, 0), sub: `${receipts.length} receipts`, icon: <CreditCard className="h-4 w-4" /> },
              { label: 'Outstanding Claims', value: allPayables.filter(p => p.type === 'Claims').reduce((s, p) => s + p.outstanding, 0), sub: 'Payable to cedants', icon: <Scale className="h-4 w-4" /> },
              { label: 'Technical Profit', value: statements.technicalResult, sub: `Net profit ${fmtM(statements.netProfit)}`, icon: <TrendingUp className="h-4 w-4" /> }
            ].map(kpi => (
              <Card key={kpi.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                  {kpi.icon}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${kpi.value < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                    {fxRates.reportingCurrency} {fmtM(kpi.value)}
                  </div>
                  <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Broker & Cedant Balances</CardTitle>
                <CardDescription>Outstanding receivables by counterparty</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...brokerRows, ...cedantRows].filter(r => r.outstanding > 0).slice(0, 6).map(r => (
                  <div key={`${r.type}-${r.key}`} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                    <div>
                      <p className="font-medium">{r.key}</p>
                      <p className="text-xs text-muted-foreground">{r.type} · {r.agingBucket}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium">{r.currency} {fmt(r.outstanding)}</p>
                      <Badge variant={r.collectionStatus === 'Overdue' ? 'destructive' : r.collectionStatus === 'Follow-up' ? 'default' : 'secondary'}>
                        {r.collectionStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
                {[...brokerRows, ...cedantRows].filter(r => r.outstanding > 0).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">All counterparty balances are settled.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Cash Performance</CardTitle>
                <CardDescription>Receipts vs payments ({fxRates.reportingCurrency})</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyPerformance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No cash movements yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                      <ChartTooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="Receipts" fill="#16a34a" />
                      <Bar dataKey="Payments" fill="#dc2626" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expense & Income Breakdown</CardTitle>
              <CardDescription>From the adjusted trial balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  ['Investment Income', statements.profitOrLoss.find(l => l.label === 'Investment income')?.amount ?? 0],
                  ['Claims Incurred', -(statements.profitOrLoss.find(l => l.label === 'Gross claims incurred')?.amount ?? 0)],
                  ['Commission Expense', -(statements.profitOrLoss.find(l => l.label === 'Broker commission expense')?.amount ?? 0)],
                  ['Retro Ceded', -(statements.profitOrLoss.find(l => l.label === 'Retrocession premium ceded')?.amount ?? 0)]
                ].map(([label, value]) => (
                  <div key={label as string} className="border rounded-lg p-3">
                    <p className="text-muted-foreground">{label}</p>
                    <p className="font-bold text-lg">{fxRates.reportingCurrency} {fmtM(value as number)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <PortfolioAnalysis />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ General Ledger */}
        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>General Ledger</CardTitle>
                <CardDescription>{filteredLedger.length} entries · translated to {fxRates.reportingCurrency} at closing rates</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => setJournalDialogOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Manual Journal
                </Button>
                <Button size="sm" variant="outline" onClick={() => { exportLedgerCsv(filteredLedger); toast.success("Ledger exported as CSV"); }}>
                  <Download className="h-3 w-3 mr-1" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select value={ledgerFilters.account} onValueChange={(v) => setLedgerFilters(f => ({ ...f, account: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All accounts</SelectItem>
                    {accounts.map(a => <SelectItem key={a.code} value={a.code}>{a.code} — {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={ledgerFilters.source} onValueChange={(v) => setLedgerFilters(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    {['Premium Booking', 'Premium Receipt', 'Claim Registration', 'Claim Payment', 'Reinsurance Recovery', 'Broker Commission', 'Retrocession Premium', 'Retrocession Recovery', 'Reinstatement Premium', 'IFRS Adjustment', 'Investment Purchase', 'Investment Income', 'Manual'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search journal, reference, narration…"
                    value={ledgerFilters.search}
                    onChange={(e) => setLedgerFilters(f => ({ ...f, search: e.target.value }))} />
                </div>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Journal</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Treaty / Claim</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLedger.slice(0, 100).map((e, i) => (
                      <TableRow key={`${e.journalNumber}-${e.accountCode}-${i}`}>
                        <TableCell className="font-mono text-xs">{e.journalNumber}</TableCell>
                        <TableCell>{e.postingDate}</TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{e.accountCode}</p>
                          <p className="text-xs text-muted-foreground">{e.accountName}</p>
                        </TableCell>
                        <TableCell className="text-right font-mono">{e.debit > 0 ? fmt(e.debitReporting) : ''}</TableCell>
                        <TableCell className="text-right font-mono">{e.credit > 0 ? fmt(e.creditReporting) : ''}</TableCell>
                        <TableCell><Badge variant="outline">{e.sourceModule}</Badge></TableCell>
                        <TableCell className="text-xs">{e.claimReference ?? e.treatyReference ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={e.status === 'Adjustment' ? 'default' : 'secondary'}>{e.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => setViewedJournal(journals.find(j => j.journalNumber === e.journalNumber) ?? null)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredLedger.length === 0 && (
                  <p className="text-center text-muted-foreground py-6">No ledger entries match the filters.</p>
                )}
                {filteredLedger.length > 100 && (
                  <p className="text-center text-xs text-muted-foreground py-2">Showing first 100 of {filteredLedger.length} entries — refine filters or export CSV for the full ledger.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Chart of Accounts */}
        <TabsContent value="coa" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Chart of Accounts</CardTitle>
                <CardDescription>Reinsurance chart with technical accounts · {accounts.length} accounts</CardDescription>
              </div>
              <Button size="sm" onClick={() => setAccountDialogOpen(true)}>
                <Plus className="h-3 w-3 mr-1" />
                New Account
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(grouped).map(([category, accs]) => (
                <div key={category}>
                  <h4 className="font-semibold mb-2">{category}</h4>
                  <div className="border rounded-lg">
                    <Table>
                      <TableBody>
                        {accs.map(a => (
                          <TableRow key={a.code}>
                            <TableCell className={`font-mono ${a.parent ? 'pl-10' : 'font-medium'}`}>{a.code}</TableCell>
                            <TableCell className={a.parent ? 'pl-4 text-muted-foreground' : 'font-medium'}>{a.name}</TableCell>
                            <TableCell><Badge variant="outline">{a.normalSide}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{a.description ?? ''}</TableCell>
                            <TableCell className="text-right font-mono">
                              {(() => {
                                const tbRow = tbAdjusted.find(r => r.accountCode === a.code);
                                if (!tbRow) return '—';
                                const bal = tbRow.debit - tbRow.credit;
                                return `${bal < 0 ? '(' : ''}${fmt(Math.abs(bal))}${bal < 0 ? ')' : ''}`;
                              })()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Receivables */}
        <TabsContent value="receivables" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {aging.map(bucket => (
              <Card key={bucket.label}>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{bucket.label}</CardTitle></CardHeader>
                <CardContent>
                  <div className={`text-xl font-bold ${bucket.label === '90+ days' && bucket.amount > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                    {fmtM(bucket.amount)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Premium Receivables & Aging</CardTitle>
              <CardDescription>Per treaty, aged on the oldest unpaid booking</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Treaty</TableHead>
                    <TableHead className="text-right">Booked</TableHead>
                    <TableHead className="text-right">Collected</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Aging</TableHead>
                    <TableHead>Collection Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivableRows.map(r => (
                    <TableRow key={r.reference}>
                      <TableCell>
                        <p className="font-medium">{r.key}</p>
                        <p className="text-xs text-muted-foreground">{r.reference} · {r.currency}</p>
                      </TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.totalBooked)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.totalPaid)}</TableCell>
                      <TableCell className={`text-right font-mono ${r.outstanding > 0 ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>{fmt(r.outstanding)}</TableCell>
                      <TableCell>{r.daysOutstanding ?? '—'}</TableCell>
                      <TableCell><Badge variant="outline">{r.agingBucket}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={r.collectionStatus === 'Overdue' ? 'destructive' : r.collectionStatus === 'Follow-up' ? 'default' : 'secondary'}>
                          {r.collectionStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {([['Broker Receivables', brokerRows], ['Cedant Receivables', cedantRows]] as const).map(([title, rows]) => (
              <Card key={title}>
                <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Counterparty</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map(r => (
                        <TableRow key={r.key}>
                          <TableCell className="font-medium">{r.key}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(r.outstanding)}</TableCell>
                          <TableCell>
                            <Badge variant={r.collectionStatus === 'Overdue' ? 'destructive' : r.collectionStatus === 'Settled' ? 'secondary' : 'default'}>
                              {r.collectionStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Premium receipts across all treaties</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Treaty</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.slice(0, 15).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{r.treatyName}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell className="text-right font-mono">{r.currency} {fmt(r.amount)}</TableCell>
                      <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Payables */}
        <TabsContent value="payables" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['Claims', 'Commission', 'Retrocession', 'Supplier'] as const).map(type => (
              <Card key={type}>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{type} Payables</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {fmtM(allPayables.filter(p => p.type === type).reduce((s, p) => s + p.outstanding, 0))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Schedule</CardTitle>
              <CardDescription>All outstanding payables ordered by due date — paying a claim updates the Claims module and regenerates journals</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payable</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((p, i) => (
                    <TableRow key={`${p.type}-${i}`}>
                      <TableCell>
                        <p className="font-medium text-sm">{p.key}</p>
                        <p className="text-xs text-muted-foreground">{p.reference}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                      <TableCell>{p.dueDate}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(p.amount)}</TableCell>
                      <TableCell className="text-right font-mono text-red-600 dark:text-red-400">{fmt(p.outstanding)}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'Paid' ? 'secondary' : p.status === 'Partially Paid' ? 'default' : 'destructive'}>{p.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {p.type === 'Claims' ? (
                          <Button size="sm" variant="outline" onClick={() => {
                            const claim = claims.find(c => p.key.startsWith(c.claimNumber));
                            if (!claim) return;
                            setPayingClaim({ claimId: claim.id, label: p.key, outstanding: p.outstanding, currency: p.currency });
                            setPaymentAmount(String(p.outstanding));
                          }}>
                            <Wallet className="h-3 w-3 mr-1" />
                            Pay
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Accrued</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {schedule.length === 0 && <p className="text-center text-muted-foreground py-6">No outstanding payables.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Cash Management */}
        <TabsContent value="cash" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Cash Position</h3>
            <Button size="sm" onClick={() => setBankDialogOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Add Bank Account
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banks.map(b => (
              <Card key={b.account.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{b.account.name}</span>
                    <Badge variant="outline">{b.account.currency}</Badge>
                  </CardTitle>
                  <CardDescription>{b.account.bank} · {b.account.accountNumber}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{b.account.currency} {fmt(b.balance)}</div>
                  <p className="text-xs text-muted-foreground">
                    Opening {fmt(b.account.openingBalance)} · receipts {fmt(b.receipts)} · payments {fmt(b.payments)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cash Book & Bank Reconciliation</CardTitle>
              <CardDescription>All cash movements derived from operations — tick entries as they appear on the bank statement</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Reconciled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashBook.map((t, i) => {
                    const key = reconciliationKey(t);
                    const bank = bankAccounts.find(b => b.id === t.bankAccountId);
                    return (
                      <TableRow key={`${key}-${i}`}>
                        <TableCell>{t.date}</TableCell>
                        <TableCell className="text-sm">{t.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{bank?.name ?? t.bankAccountId}</TableCell>
                        <TableCell>
                          <Badge variant={t.type === 'Receipt' ? 'secondary' : 'destructive'}>{t.type}</Badge>
                        </TableCell>
                        <TableCell className={`text-right font-mono ${t.type === 'Payment' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {t.type === 'Payment' ? '-' : '+'}{fmt(t.amount)}
                        </TableCell>
                        <TableCell className="text-xs">{t.sourceModule}</TableCell>
                        <TableCell>
                          <Button size="sm" variant={reconciled.has(key) ? 'secondary' : 'outline'} onClick={() => toggleReconciled(key)}>
                            {reconciled.has(key) ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                            {reconciled.has(key) ? 'Reconciled' : 'Reconcile'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {cashBook.length === 0 && <p className="text-center text-muted-foreground py-6">No cash movements yet.</p>}
              <p className="text-xs text-muted-foreground mt-3">
                {reconciled.size} of {cashBook.length} transactions reconciled · Receipt register: {receiptRegister(cashBook).length} · Payment register: {paymentRegister(cashBook).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exchange Rates & FX Exposure</CardTitle>
              <CardDescription>Rates are {fxRates.reportingCurrency} per unit · gain/loss retranslates outstanding foreign receivables from historical to closing rate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Currency</TableHead>
                      <TableHead>Historical Rate</TableHead>
                      <TableHead>Closing Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SUPPORTED_CURRENCIES.filter(c => c !== fxRates.reportingCurrency).map(c => (
                      <TableRow key={c}>
                        <TableCell className="font-medium">{c}</TableCell>
                        <TableCell>
                          <Input type="number" step="0.0001" className="w-32"
                            value={fxRates.historical[c] ?? ''}
                            onChange={(e) => setRate(c, 'historical', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.0001" className="w-32"
                            value={fxRates.closing[c] ?? ''}
                            onChange={(e) => setRate(c, 'closing', e.target.value)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {exposures.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Outstanding (FC)</TableHead>
                      <TableHead className="text-right">At Historical</TableHead>
                      <TableHead className="text-right">At Closing</TableHead>
                      <TableHead className="text-right">Gain / (Loss)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exposures.map(e => (
                      <TableRow key={e.currency}>
                        <TableCell className="font-medium">{e.currency}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(e.outstandingForeign)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(e.atHistorical)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(e.atClosing)}</TableCell>
                        <TableCell className={`text-right font-mono ${e.gainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {e.gainLoss < 0 ? `(${fmt(Math.abs(e.gainLoss))})` : fmt(e.gainLoss)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No foreign-currency exposure — all outstanding balances are in {fxRates.reportingCurrency}.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Investments */}
        <TabsContent value="investments" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['Portfolio Value', investments.filter(i => i.status === 'Active').reduce((s, i) => s + i.amount, 0)],
              ['Realised Returns', investments.reduce((s, i) => s + i.actualReturns, 0)],
              ['Expected Annual Return', investments.filter(i => i.status === 'Active').reduce((s, i) => s + i.expectedReturnAmount, 0)],
              ['Yield Achieved', 0]
            ].map(([label, value], idx) => (
              <Card key={label as string}>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {idx === 3
                      ? (() => {
                          const invested = investments.reduce((s, i) => s + i.amount, 0);
                          const returns = investments.reduce((s, i) => s + i.actualReturns, 0);
                          return invested > 0 ? `${((returns / invested) * 100).toFixed(1)}%` : '—';
                        })()
                      : fmtM(value as number)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Investment Portfolio</CardTitle>
                <CardDescription>
                  Store-backed and fully integrated: purchases draw on bank balances, returns post investment income journals, and values flow into the statements
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setInvestmentDialogOpen(true)}>
                <Plus className="h-3 w-3 mr-1" />
                New Investment
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Funding Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Realised</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <p className="font-medium">{inv.investmentEntity}</p>
                        <p className="text-xs text-muted-foreground">{inv.entityType} · matures {inv.maturityDate || '—'}</p>
                      </TableCell>
                      <TableCell>{inv.investmentType}</TableCell>
                      <TableCell className="text-xs">{bankAccounts.find(b => b.id === inv.bankAccountId)?.name ?? '—'}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(inv.amount)}</TableCell>
                      <TableCell className="text-right font-mono">{inv.expectedReturnRate}% ({fmt(inv.expectedReturnAmount)})</TableCell>
                      <TableCell className="text-right font-mono text-green-600 dark:text-green-400">{fmt(inv.actualReturns)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.riskLevel === 'Low' ? 'secondary' : inv.riskLevel === 'Medium' ? 'default' : 'destructive'}>{inv.riskLevel}</Badge>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{inv.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" onClick={() => { setReturnDialog(inv); setReturnAmount(''); }}>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Record Return
                          </Button>
                          {inv.status === 'Active' && (
                            <Button size="sm" variant="outline" onClick={() => {
                              updateInvestment(inv.id, { status: 'Matured' });
                              toast.success(`${inv.investmentEntity} marked as matured`);
                            }}>
                              <Target className="h-3 w-3 mr-1" />
                              Mature
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {investments.length === 0 && <p className="text-center text-muted-foreground py-6">No investments recorded.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------ Trial Balance */}
        <TabsContent value="tb" className="space-y-4">
          {([
            ['Unadjusted Trial Balance', tbUnadjusted, 'unadjusted', 'Operational journals only'],
            ['Adjusted Trial Balance', tbAdjusted, 'adjusted', 'Includes IBNR/IFRS provisions and manual adjustments']
          ] as const).map(([title, rows, variant, desc]) => {
            const totals = trialBalanceTotals(rows);
            const balanced = Math.abs(totals.debit - totals.credit) < 1;
            return (
              <Card key={variant}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      {title}
                      <Badge className="ml-2" variant={balanced ? 'secondary' : 'destructive'}>
                        {balanced ? 'Balanced' : 'Out of balance'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{desc} · {fxRates.reportingCurrency}</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { exportTrialBalanceCsv([...rows], variant); toast.success(`${title} exported`); }}>
                    <Download className="h-3 w-3 mr-1" />
                    CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map(r => (
                        <TableRow key={r.accountCode}>
                          <TableCell className="font-mono">{r.accountCode}</TableCell>
                          <TableCell>{r.accountName}</TableCell>
                          <TableCell><Badge variant="outline">{r.category}</Badge></TableCell>
                          <TableCell className="text-right font-mono">{r.debit > 0 ? fmt(r.debit) : ''}</TableCell>
                          <TableCell className="text-right font-mono">{r.credit > 0 ? fmt(r.credit) : ''}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell className="text-right font-mono">{fmt(totals.debit)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(totals.credit)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ------------------------------------------------ Statements */}
        <TabsContent value="statements" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatementTable title="Statement of Profit or Loss" lines={statements.profitOrLoss} description={`Draft · ${fxRates.reportingCurrency}`} />
            <div className="space-y-6">
              <StatementTable title="Statement of Financial Position — Assets" lines={statements.financialPosition.assets} />
              <StatementTable title="Liabilities & Equity" lines={[...statements.financialPosition.liabilities, ...statements.financialPosition.equity]} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatementTable title="Cash Flow Statement" lines={statements.cashFlow} description="Direct method, from the cash book" />
            <StatementTable title="Statement of Changes in Equity" lines={statements.changesInEquity} />
            <StatementTable title="Technical Account" lines={statements.technicalAccount} description="Underwriting result" />
          </div>
        </TabsContent>

        {/* ------------------------------------------------ Audit Trail */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>{auditLog.length} recorded actions across all modules (newest first)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Source Module</TableHead>
                    <TableHead>Previous → New</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...auditLog].reverse().slice(0, 100).map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs">{new Date(e.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{e.user}</TableCell>
                      <TableCell>
                        <Badge variant={e.action === 'RESET' ? 'destructive' : e.action === 'PAYMENT' ? 'default' : 'secondary'}>{e.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{e.entity}</p>
                        <p className="text-xs text-muted-foreground">{e.entityId}</p>
                      </TableCell>
                      <TableCell className="text-xs">{e.sourceModule}</TableCell>
                      <TableCell className="text-xs max-w-64">
                        {e.previousValue && <span className="text-muted-foreground">{e.previousValue} → </span>}
                        {e.newValue ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {auditLog.length === 0 && (
                <p className="text-center text-muted-foreground py-6">
                  No audited actions yet — create, update, or pay something anywhere in the application and it will appear here.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---------------- Journal detail dialog */}
      <Dialog open={!!viewedJournal} onOpenChange={(open) => !open && setViewedJournal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono">{viewedJournal?.journalNumber}</DialogTitle>
            <DialogDescription>{viewedJournal?.narration}</DialogDescription>
          </DialogHeader>
          {viewedJournal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Posting Date</p><p className="font-medium">{viewedJournal.postingDate}</p></div>
                <div><p className="text-muted-foreground">Reference</p><p className="font-medium">{viewedJournal.reference}</p></div>
                <div><p className="text-muted-foreground">Source</p><p className="font-medium">{viewedJournal.sourceModule}</p></div>
                <div><p className="text-muted-foreground">Posted By</p><p className="font-medium">{viewedJournal.postedBy}</p></div>
                {viewedJournal.treatyReference && <div><p className="text-muted-foreground">Treaty</p><p className="font-medium">{viewedJournal.treatyReference}</p></div>}
                {viewedJournal.claimReference && <div><p className="text-muted-foreground">Claim</p><p className="font-medium">{viewedJournal.claimReference}</p></div>}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit ({viewedJournal.currency})</TableHead>
                    <TableHead className="text-right">Credit ({viewedJournal.currency})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewedJournal.lines.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>{l.accountCode} — {l.accountName}</TableCell>
                      <TableCell className="text-right font-mono">{l.debit > 0 ? fmt(l.debit) : ''}</TableCell>
                      <TableCell className="text-right font-mono">{l.credit > 0 ? fmt(l.credit) : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------------- Pay claim dialog */}
      <Dialog open={!!payingClaim} onOpenChange={(open) => !open && setPayingClaim(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Claim Payment</DialogTitle>
            <DialogDescription>{payingClaim?.label}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground">Outstanding</p>
              <p className="font-bold text-lg">{payingClaim?.currency} {payingClaim ? fmt(payingClaim.outstanding) : ''}</p>
            </div>
            <div className="space-y-2">
              <Label>Payment Amount</Label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">
              The claim status, cash book, and general ledger update automatically on payment.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingClaim(null)}>
              <X className="h-4 w-4 mr-2" />Cancel
            </Button>
            <Button onClick={handlePayClaim}>
              <CheckCircle className="h-4 w-4 mr-2" />Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Manual journal dialog */}
      <Dialog open={journalDialogOpen} onOpenChange={setJournalDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post Manual Journal</DialogTitle>
            <DialogDescription>Double-entry in {fxRates.reportingCurrency} — mark as adjustment to include only in the adjusted trial balance</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Debit Account</Label>
                <Select value={journalForm.debitAccount} onValueChange={(v) => setJournalForm(f => ({ ...f, debitAccount: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => <SelectItem key={a.code} value={a.code}>{a.code} — {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credit Account</Label>
                <Select value={journalForm.creditAccount} onValueChange={(v) => setJournalForm(f => ({ ...f, creditAccount: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => <SelectItem key={a.code} value={a.code}>{a.code} — {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={journalForm.amount} onChange={(e) => setJournalForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Reference</Label>
                <Input value={journalForm.reference} onChange={(e) => setJournalForm(f => ({ ...f, reference: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Narration</Label>
              <Textarea rows={2} value={journalForm.narration} onChange={(e) => setJournalForm(f => ({ ...f, narration: e.target.value }))} />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="adj" checked={journalForm.adjustment}
                onChange={(e) => setJournalForm(f => ({ ...f, adjustment: e.target.checked }))} />
              <Label htmlFor="adj">Adjustment journal (adjusted TB only)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJournalDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddJournal}><Save className="h-4 w-4 mr-2" />Post Journal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- New account dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Ledger Account</DialogTitle>
            <DialogDescription>Extends the chart of accounts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Code (4 digits)</Label>
                <Input value={accountForm.code} onChange={(e) => setAccountForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. 5350" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={accountForm.category} onValueChange={(v) => setAccountForm(f => ({ ...f, category: v, normalSide: ['Assets', 'Expenses'].includes(v) ? 'debit' : 'credit' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses', 'Technical'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input value={accountForm.name} onChange={(e) => setAccountForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Regulatory Levies" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAccount}><Save className="h-4 w-4 mr-2" />Add Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- New investment dialog */}
      <Dialog open={investmentDialogOpen} onOpenChange={setInvestmentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Investment</DialogTitle>
            <DialogDescription>Funds are drawn from the selected bank account; a purchase journal posts automatically</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Investment Entity *</Label>
              <Input value={investmentForm.investmentEntity}
                onChange={(e) => setInvestmentForm(f => ({ ...f, investmentEntity: e.target.value }))}
                placeholder="e.g. Tanzania Government Bonds" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={investmentForm.entityType} onValueChange={(v) => setInvestmentForm(f => ({ ...f, entityType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['Government', 'Corporation', 'Financial Institution', 'Real Estate', 'Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Investment Type</Label>
                <Select value={investmentForm.investmentType} onValueChange={(v) => setInvestmentForm(f => ({ ...f, investmentType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['Bonds', 'Stocks', 'Real Estate', 'Fixed Deposits', 'Others'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" value={investmentForm.amount} onChange={(e) => setInvestmentForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Funding Bank Account *</Label>
                <Select value={investmentForm.bankAccountId} onValueChange={(v) => setInvestmentForm(f => ({ ...f, bankAccountId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {banks.map(b => (
                      <SelectItem key={b.account.id} value={b.account.id}>
                        {b.account.name} ({b.account.currency} {fmt(b.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Investment Date *</Label>
                <Input type="date" value={investmentForm.investmentDate} onChange={(e) => setInvestmentForm(f => ({ ...f, investmentDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Maturity Date</Label>
                <Input type="date" value={investmentForm.maturityDate} onChange={(e) => setInvestmentForm(f => ({ ...f, maturityDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Expected Return %</Label>
                <Input type="number" step="0.1" value={investmentForm.expectedReturnRate} onChange={(e) => setInvestmentForm(f => ({ ...f, expectedReturnRate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Risk Level</Label>
                <Select value={investmentForm.riskLevel} onValueChange={(v) => setInvestmentForm(f => ({ ...f, riskLevel: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['Low', 'Medium', 'High'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={investmentForm.description} onChange={(e) => setInvestmentForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddInvestment}><Save className="h-4 w-4 mr-2" />Place Investment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Record return dialog */}
      <Dialog open={!!returnDialog} onOpenChange={(open) => !open && setReturnDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Investment Return</DialogTitle>
            <DialogDescription>{returnDialog?.investmentEntity} — realised to date: {returnDialog ? fmt(returnDialog.actualReturns) : ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Return Amount ({returnDialog?.currency})</Label>
            <Input type="number" value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} />
            <p className="text-xs text-muted-foreground">Posts an investment income journal (Dr Bank / Cr Investment Income) and a receipt in the cash book.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialog(null)}>Cancel</Button>
            <Button onClick={handleRecordReturn}><TrendingUp className="h-4 w-4 mr-2" />Record Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- New bank account dialog */}
      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Name *</Label>
                <Input value={bankForm.name} onChange={(e) => setBankForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. EUR Settlements" />
              </div>
              <div className="space-y-2">
                <Label>Bank *</Label>
                <Input value={bankForm.bank} onChange={(e) => setBankForm(f => ({ ...f, bank: e.target.value }))} placeholder="e.g. Stanbic" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label>Currency</Label>
                <Select value={bankForm.currency} onValueChange={(v) => setBankForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input value={bankForm.accountNumber} onChange={(e) => setBankForm(f => ({ ...f, accountNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Opening Balance</Label>
                <Input type="number" value={bankForm.openingBalance} onChange={(e) => setBankForm(f => ({ ...f, openingBalance: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddBank}><Landmark className="h-4 w-4 mr-2" />Add Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingModule;
