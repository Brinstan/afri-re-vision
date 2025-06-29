import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/sonner";
import { 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Plus, 
  Eye, 
  Edit, 
  Save, 
  Download, 
  RefreshCw,
  Calculator,
  BarChart3,
  PieChart,
  Building,
  CreditCard,
  Wallet,
  Target,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import { useDataStore } from './DataStore';
import PortfolioAnalysis from './PortfolioAnalysis';

const AccountingModule = () => {
  const [activeTab, setActiveTab] = useState("receivables");
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [showPayableForm, setShowPayableForm] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [payableType, setPayableType] = useState("claims");
  const [reportType, setReportType] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [paymentForm, setPaymentForm] = useState({
    paymentAmount: '',
    paymentType: 'full',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    reference: '',
    notes: ''
  });

  // Investment form state
  const [investmentForm, setInvestmentForm] = useState({
    investmentEntity: '',
    entityType: '',
    investmentType: '',
    investmentDate: '',
    amount: '',
    expectedReturnRate: '',
    expectedReturnAmount: '',
    maturityDate: '',
    riskLevel: '',
    description: '',
    status: 'Active'
  });

  const { treaties, claims, updateClaim, addPremiumBooking } = useDataStore();

  // Sample data for investments
  const [investments, setInvestments] = useState([
    {
      id: 1,
      investmentEntity: 'Tanzania Government Bonds',
      entityType: 'Government',
      investmentType: 'Bonds',
      investmentDate: '2024-01-15',
      amount: 50000000,
      expectedReturnRate: 8.5,
      expectedReturnAmount: 4250000,
      maturityDate: '2029-01-15',
      riskLevel: 'Low',
      description: '5-year Treasury Bonds',
      status: 'Active',
      actualReturns: 2125000,
      currency: 'USD'
    },
    {
      id: 2,
      investmentEntity: 'Vodacom Tanzania PLC',
      entityType: 'Corporation',
      investmentType: 'Stocks',
      investmentDate: '2024-03-10',
      amount: 25000000,
      expectedReturnRate: 12.0,
      expectedReturnAmount: 3000000,
      maturityDate: '2025-03-10',
      riskLevel: 'Medium',
      description: 'Equity investment in telecommunications',
      status: 'Active',
      actualReturns: 1800000,
      currency: 'USD'
    }
  ]);

  // Generate payables from claims and other sources
  const generatePayables = () => {
    const claimPayables = claims
      .filter(claim => claim.status === 'Outstanding' || claim.status === 'Approved')
      .map(claim => {
        const treaty = treaties.find(t => t.id === claim.treatyId);
        return {
          id: `claim_${claim.id}`,
          type: 'claims',
          description: `Claim Settlement - ${claim.claimNumber}`,
          amount: claim.claimAmount,
          paidAmount: 0,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          status: 'Outstanding',
          vendor: claim.insuredName,
          treatyReference: claim.claimNumber,
          claimId: claim.id,
          treatyId: claim.treatyId,
          treatyName: treaty?.treatyName || 'Unknown Treaty'
        };
      });

    const commissionPayables = treaties.map(treaty => ({
      id: `commission_${treaty.id}`,
      type: 'commissions',
      description: `Broker Commission - ${treaty.treatyName}`,
      amount: treaty.premium * (treaty.commission / 100),
      paidAmount: 0,
      dueDate: '2024-12-31',
      status: 'Pending',
      vendor: treaty.broker,
      treatyReference: treaty.contractNumber,
      treatyId: treaty.id,
      treatyName: treaty.treatyName
    }));

    return [...claimPayables, ...commissionPayables];
  };

  const [payables, setPayables] = useState(generatePayables());

  // Calculate premium receivables from treaties
  const calculatePremiumReceivables = () => {
    return treaties.map(treaty => {
      const totalBookings = treaty.premiumBookings?.reduce((sum, booking) => sum + booking.amount, 0) || 0;
      const totalPaid = treaty.premiumBookings?.reduce((sum, booking) => sum + (booking.paidAmount || 0), 0) || 0;
      const outstanding = totalBookings - totalPaid;
      
      return {
        treatyId: treaty.id,
        treatyName: treaty.treatyName,
        contractNumber: treaty.contractNumber,
        totalBookings,
        totalPaid,
        outstanding,
        status: outstanding === 0 ? 'Fully Paid' : totalPaid > 0 ? 'Partially Paid' : 'Unpaid'
      };
    });
  };

  // Handle payment processing
  const handlePayment = (payable) => {
    setSelectedPayable(payable);
    setPaymentForm({
      paymentAmount: payable.amount.toString(),
      paymentType: 'full',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      reference: `PAY-${Date.now()}`,
      notes: ''
    });
    setShowPaymentDialog(true);
  };

  // Process payment and update all related systems
  const processPayment = () => {
    if (!selectedPayable || !paymentForm.paymentAmount) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    const paymentAmount = parseFloat(paymentForm.paymentAmount);
    const isFullPayment = paymentForm.paymentType === 'full' || paymentAmount >= selectedPayable.amount;
    
    // Update payable status
    setPayables(prev => prev.map(payable => {
      if (payable.id === selectedPayable.id) {
        const newPaidAmount = (payable.paidAmount || 0) + paymentAmount;
        const newStatus = newPaidAmount >= payable.amount ? 'Paid' : 'Partially Paid';
        
        return {
          ...payable,
          paidAmount: newPaidAmount,
          status: newStatus,
          lastPaymentDate: paymentForm.paymentDate,
          lastPaymentAmount: paymentAmount,
          paymentReference: paymentForm.reference
        };
      }
      return payable;
    }));

    // If this is a claim payment, update the claim status in the claims module
    if (selectedPayable.type === 'claims' && selectedPayable.claimId) {
      const newClaimStatus = isFullPayment ? 'Settled' : 'Partial Payment';
      
      updateClaim(selectedPayable.claimId, {
        status: newClaimStatus,
        paidAmount: paymentAmount,
        paymentDate: paymentForm.paymentDate,
        paymentReference: paymentForm.reference
      });

      // Create accounting entry for the payment
      const accountingEntry = {
        id: Date.now().toString(),
        amount: paymentAmount,
        type: 'Claim Payment',
        date: paymentForm.paymentDate,
        status: 'Completed',
        reference: paymentForm.reference,
        description: `Payment for claim ${selectedPayable.treatyReference}`
      };

      // Add to treaty's premium bookings for tracking
      if (selectedPayable.treatyId) {
        addPremiumBooking(selectedPayable.treatyId, accountingEntry);
      }

      toast.success(`Claim payment processed successfully. Status updated to: ${newClaimStatus}`);
    } else if (selectedPayable.type === 'commissions') {
      toast.success(`Commission payment of ${paymentForm.paymentAmount} processed successfully`);
    }

    // Close dialog and reset form
    setShowPaymentDialog(false);
    setSelectedPayable(null);
    setPaymentForm({
      paymentAmount: '',
      paymentType: 'full',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      reference: '',
      notes: ''
    });

    // Refresh payables data
    setTimeout(() => {
      setPayables(generatePayables());
    }, 100);
  };

  // Handle new payable creation
  const handleNewPayable = () => {
    setShowPayableForm(true);
  };

  // Create new payable
  const createNewPayable = () => {
    const newPayable = {
      id: `manual_${Date.now()}`,
      type: payableType,
      description: 'Manual payable entry',
      amount: 0,
      paidAmount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Outstanding',
      vendor: 'Manual Entry',
      treatyReference: 'MANUAL',
      createdDate: new Date().toISOString().split('T')[0]
    };

    setPayables(prev => [...prev, newPayable]);
    setShowPayableForm(false);
    toast.success("New payable created successfully");
  };

  // Handle investment form submission
  const handleInvestmentSubmit = () => {
    if (!investmentForm.investmentEntity || !investmentForm.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newInvestment = {
      id: Date.now(),
      ...investmentForm,
      amount: parseFloat(investmentForm.amount),
      expectedReturnRate: parseFloat(investmentForm.expectedReturnRate),
      expectedReturnAmount: parseFloat(investmentForm.expectedReturnAmount),
      actualReturns: 0,
      currency: 'USD'
    };

    setInvestments([...investments, newInvestment]);
    setShowInvestmentForm(false);
    setInvestmentForm({
      investmentEntity: '',
      entityType: '',
      investmentType: '',
      investmentDate: '',
      amount: '',
      expectedReturnRate: '',
      expectedReturnAmount: '',
      maturityDate: '',
      riskLevel: '',
      description: '',
      status: 'Active'
    });
    
    toast.success("Investment record created successfully");
  };

  // Handle investment view
  const handleViewInvestment = (investment) => {
    setSelectedInvestment(investment);
    setIsViewDialogOpen(true);
  };

  // Handle investment edit
  const handleEditInvestment = (investment) => {
    setSelectedInvestment(investment);
    setEditFormData(investment);
    setIsEditDialogOpen(true);
  };

  // Save investment edits
  const handleSaveEdit = () => {
    setInvestments(investments.map(inv => 
      inv.id === selectedInvestment.id ? { ...editFormData } : inv
    ));
    setIsEditDialogOpen(false);
    toast.success("Investment updated successfully");
  };

  // Generate financial reports
  const generateReport = async (type) => {
    setReportType(type);
    setIsGeneratingReport(true);
    setReportProgress(0);

    try {
      // Simulate report generation with progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setReportProgress(i);
      }

      // Generate actual report content based on type
      const reportData = generateReportContent(type);
      downloadReport(reportData, type);
      
      toast.success(`${getReportTitle(type)} generated successfully`);
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setIsGeneratingReport(false);
      setReportProgress(0);
    }
  };

  // Get report title
  const getReportTitle = (type) => {
    const titles = {
      'trial-balance': 'Trial Balance',
      'profit-loss': 'Profit & Loss Statement',
      'balance-sheet': 'Balance Sheet',
      'cash-flow': 'Cash Flow Statement',
      'technical-account': 'Technical Account',
      'regulatory-returns': 'Regulatory Returns'
    };
    return titles[type] || 'Financial Report';
  };

  // Generate report content
  const generateReportContent = (type) => {
    const receivables = calculatePremiumReceivables();
    const totalReceivables = receivables.reduce((sum, r) => sum + r.outstanding, 0);
    const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPayables = payables.reduce((sum, p) => sum + (p.amount - (p.paidAmount || 0)), 0);
    const totalPaidPayables = payables.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    const baseContent = `
${getReportTitle(type)}
${'='.repeat(getReportTitle(type).length)}

Generated: ${new Date().toLocaleString()}
Reporting Period: ${new Date().getFullYear()}

SUMMARY
=======
Premium Receivables: USD ${(totalReceivables / 1000000).toFixed(1)}M
Investment Portfolio: USD ${(totalInvestments / 1000000).toFixed(1)}M
Outstanding Payables: USD ${(totalPayables / 1000000).toFixed(1)}M
Paid Payables: USD ${(totalPaidPayables / 1000000).toFixed(1)}M
    `;

    switch (type) {
      case 'trial-balance':
        return baseContent + `

TRIAL BALANCE
=============
Assets:
  Premium Receivables: USD ${totalReceivables.toLocaleString()}
  Investments: USD ${totalInvestments.toLocaleString()}
  
Liabilities:
  Claims Payables: USD ${payables.filter(p => p.type === 'claims').reduce((sum, p) => sum + (p.amount - (p.paidAmount || 0)), 0).toLocaleString()}
  Commission Payables: USD ${payables.filter(p => p.type === 'commissions').reduce((sum, p) => sum + (p.amount - (p.paidAmount || 0)), 0).toLocaleString()}
        `;

      case 'profit-loss':
        return baseContent + `

PROFIT & LOSS STATEMENT
=======================
Revenue:
  Premium Income: USD ${treaties.reduce((sum, t) => sum + t.premium, 0).toLocaleString()}
  Investment Income: USD ${investments.reduce((sum, inv) => sum + (inv.actualReturns || 0), 0).toLocaleString()}

Expenses:
  Claims Paid: USD ${payables.filter(p => p.type === 'claims').reduce((sum, p) => sum + (p.paidAmount || 0), 0).toLocaleString()}
  Commissions Paid: USD ${payables.filter(p => p.type === 'commissions').reduce((sum, p) => sum + (p.paidAmount || 0), 0).toLocaleString()}
        `;

      default:
        return baseContent + `\n\nDetailed ${getReportTitle(type)} data would be generated here.`;
    }
  };

  // Download report
  const downloadReport = (content, type) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getReportTitle(type).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Entity suggestions for autocomplete
  const entitySuggestions = [
    'Tanzania Government Bonds',
    'Bank of Tanzania',
    'Vodacom Tanzania PLC',
    'Tanzania Breweries Limited',
    'CRDB Bank PLC',
    'NMB Bank PLC',
    'Dar es Salaam Stock Exchange',
    'Kenya Government Securities',
    'Safaricom PLC',
    'Equity Bank Group'
  ];

  const receivables = calculatePremiumReceivables();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accounting Module</h2>
          <p className="text-gray-600">Comprehensive financial management and reporting</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setPayables(generatePayables())}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button>
            <Calculator className="h-4 w-4 mr-2" />
            Financial Summary
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="receivables">Premium Receivables</TabsTrigger>
          <TabsTrigger value="payables">Payables</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio Analysis</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Premium Receivables</CardTitle>
              <CardDescription>Outstanding premium payments from treaties</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Treaty</TableHead>
                    <TableHead>Contract Number</TableHead>
                    <TableHead>Total Bookings</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivables.map((receivable) => (
                    <TableRow key={receivable.treatyId}>
                      <TableCell className="font-medium">{receivable.treatyName}</TableCell>
                      <TableCell>{receivable.contractNumber}</TableCell>
                      <TableCell>USD {receivable.totalBookings.toLocaleString()}</TableCell>
                      <TableCell>USD {receivable.totalPaid.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${receivable.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          USD {receivable.outstanding.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          receivable.status === 'Fully Paid' ? 'secondary' :
                          receivable.status === 'Partially Paid' ? 'default' : 'destructive'
                        }>
                          {receivable.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Allocate Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Payables Management</h3>
            <Button onClick={handleNewPayable}>
              <Plus className="h-4 w-4 mr-2" />
              New Payable
            </Button>
          </div>

          <Tabs defaultValue="claims" className="space-y-4">
            <TabsList>
              <TabsTrigger value="claims">Claims Payables</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
            </TabsList>

            <TabsContent value="claims">
              <Card>
                <CardHeader>
                  <CardTitle>Claims Payables</CardTitle>
                  <CardDescription>Outstanding claim payments with integrated status tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Vendor/Claimant</TableHead>
                        <TableHead>Treaty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payables.filter(p => p.type === 'claims').map((payable) => (
                        <TableRow key={payable.id}>
                          <TableCell className="font-medium">{payable.description}</TableCell>
                          <TableCell>USD {payable.amount.toLocaleString()}</TableCell>
                          <TableCell>USD {(payable.paidAmount || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${
                              (payable.amount - (payable.paidAmount || 0)) > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              USD {(payable.amount - (payable.paidAmount || 0)).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>{payable.dueDate}</TableCell>
                          <TableCell>{payable.vendor}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payable.treatyName}</p>
                              <p className="text-xs text-gray-500">{payable.treatyReference}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              payable.status === 'Paid' ? 'secondary' :
                              payable.status === 'Partially Paid' ? 'default' : 'destructive'
                            }>
                              {payable.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handlePayment(payable)}
                                disabled={payable.status === 'Paid'}
                              >
                                <Wallet className="h-3 w-3 mr-1" />
                                {payable.status === 'Paid' ? 'Paid' : 'Pay'}
                              </Button>
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commissions">
              <Card>
                <CardHeader>
                  <CardTitle>Commission Payables</CardTitle>
                  <CardDescription>Outstanding broker and agent commissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Broker/Agent</TableHead>
                        <TableHead>Treaty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payables.filter(p => p.type === 'commissions').map((payable) => (
                        <TableRow key={payable.id}>
                          <TableCell className="font-medium">{payable.description}</TableCell>
                          <TableCell>USD {payable.amount.toLocaleString()}</TableCell>
                          <TableCell>USD {(payable.paidAmount || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${
                              (payable.amount - (payable.paidAmount || 0)) > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              USD {(payable.amount - (payable.paidAmount || 0)).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>{payable.dueDate}</TableCell>
                          <TableCell>{payable.vendor}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payable.treatyName}</p>
                              <p className="text-xs text-gray-500">{payable.treatyReference}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              payable.status === 'Paid' ? 'secondary' :
                              payable.status === 'Partially Paid' ? 'default' : 'destructive'
                            }>
                              {payable.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handlePayment(payable)}
                                disabled={payable.status === 'Paid'}
                              >
                                <Wallet className="h-3 w-3 mr-1" />
                                {payable.status === 'Paid' ? 'Paid' : 'Pay'}
                              </Button>
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Investment Management</h3>
            <Button onClick={() => setShowInvestmentForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Investment
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Investment Portfolio</CardTitle>
              <CardDescription>Manage and track investment allocations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investment Entity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Actual Returns</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{investment.investmentEntity}</p>
                          <p className="text-xs text-gray-500">{investment.entityType}</p>
                        </div>
                      </TableCell>
                      <TableCell>{investment.investmentType}</TableCell>
                      <TableCell>USD {investment.amount.toLocaleString()}</TableCell>
                      <TableCell>{investment.expectedReturnRate}%</TableCell>
                      <TableCell>USD {(investment.actualReturns || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          investment.riskLevel === 'Low' ? 'secondary' :
                          investment.riskLevel === 'Medium' ? 'default' : 'destructive'
                        }>
                          {investment.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{investment.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" onClick={() => handleViewInvestment(investment)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditInvestment(investment)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Update
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Investment Form Dialog */}
          {showInvestmentForm && (
            <Dialog open={showInvestmentForm} onOpenChange={setShowInvestmentForm}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>New Investment</DialogTitle>
                  <DialogDescription>Add a new investment to the portfolio</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Investment Entity *</Label>
                      <Input
                        value={investmentForm.investmentEntity}
                        onChange={(e) => setInvestmentForm({...investmentForm, investmentEntity: e.target.value})}
                        placeholder="e.g., Tanzania Government Bonds"
                        list="entity-suggestions"
                      />
                      <datalist id="entity-suggestions">
                        {entitySuggestions.map((entity, index) => (
                          <option key={index} value={entity} />
                        ))}
                      </datalist>
                    </div>
                    <div className="space-y-2">
                      <Label>Entity Type</Label>
                      <Select value={investmentForm.entityType} onValueChange={(value) => setInvestmentForm({...investmentForm, entityType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select entity type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Government">Government</SelectItem>
                          <SelectItem value="Corporation">Corporation</SelectItem>
                          <SelectItem value="Financial Institution">Financial Institution</SelectItem>
                          <SelectItem value="Real Estate">Real Estate</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Investment Type</Label>
                      <Select value={investmentForm.investmentType} onValueChange={(value) => setInvestmentForm({...investmentForm, investmentType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bonds">Bonds</SelectItem>
                          <SelectItem value="Stocks">Stocks</SelectItem>
                          <SelectItem value="Real Estate">Real Estate</SelectItem>
                          <SelectItem value="Fixed Deposits">Fixed Deposits</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Investment Date</Label>
                      <Input
                        type="date"
                        value={investmentForm.investmentDate}
                        onChange={(e) => setInvestmentForm({...investmentForm, investmentDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount Allocated *</Label>
                      <Input
                        type="number"
                        value={investmentForm.amount}
                        onChange={(e) => setInvestmentForm({...investmentForm, amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Return Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={investmentForm.expectedReturnRate}
                        onChange={(e) => setInvestmentForm({...investmentForm, expectedReturnRate: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Maturity Date</Label>
                      <Input
                        type="date"
                        value={investmentForm.maturityDate}
                        onChange={(e) => setInvestmentForm({...investmentForm, maturityDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Risk Level</Label>
                      <Select value={investmentForm.riskLevel} onValueChange={(value) => setInvestmentForm({...investmentForm, riskLevel: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Investment Description</Label>
                    <Textarea
                      value={investmentForm.description}
                      onChange={(e) => setInvestmentForm({...investmentForm, description: e.target.value})}
                      placeholder="Enter investment description..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowInvestmentForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInvestmentSubmit}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Investment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Generate comprehensive financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              {isGeneratingReport && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Generating {getReportTitle(reportType)}...
                    </span>
                    <span className="text-sm text-blue-700">{reportProgress}%</span>
                  </div>
                  <Progress value={reportProgress} className="w-full" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => generateReport('trial-balance')}
                  disabled={isGeneratingReport}
                >
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span>Trial Balance</span>
                </Button>

                <Button 
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => generateReport('profit-loss')}
                  disabled={isGeneratingReport}
                >
                  <TrendingUp className="h-6 w-6 mb-2" />
                  <span>Profit & Loss</span>
                </Button>

                <Button 
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => generateReport('balance-sheet')}
                  disabled={isGeneratingReport}
                >
                  <Building className="h-6 w-6 mb-2" />
                  <span>Balance Sheet</span>
                </Button>

                <Button 
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => generateReport('cash-flow')}
                  disabled={isGeneratingReport}
                >
                  <DollarSign className="h-6 w-6 mb-2" />
                  <span>Cash Flow</span>
                </Button>

                <Button 
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => generateReport('technical-account')}
                  disabled={isGeneratingReport}
                >
                  <Calculator className="h-6 w-6 mb-2" />
                  <span>Technical Account</span>
                </Button>

                <Button 
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => generateReport('regulatory-returns')}
                  disabled={isGeneratingReport}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Regulatory Returns</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <PortfolioAnalysis />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  USD {(receivables.reduce((sum, r) => sum + r.outstanding, 0) / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground">Outstanding premium payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Investment Portfolio</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  USD {(investments.reduce((sum, inv) => sum + inv.amount, 0) / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground">Total invested amount</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Payables</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  USD {(payables.reduce((sum, p) => sum + (p.amount - (p.paidAmount || 0)), 0) / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground">Pending payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Investment Returns</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  USD {(investments.reduce((sum, inv) => sum + (inv.actualReturns || 0), 0) / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground">Realized returns</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Processing Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Process payment for: {selectedPayable?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayable && (
            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Total Amount:</p>
                    <p>USD {selectedPayable.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Already Paid:</p>
                    <p>USD {(selectedPayable.paidAmount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Outstanding:</p>
                    <p className="text-red-600 font-bold">
                      USD {(selectedPayable.amount - (selectedPayable.paidAmount || 0)).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Vendor:</p>
                    <p>{selectedPayable.vendor}</p>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select value={paymentForm.paymentType} onValueChange={(value) => setPaymentForm({...paymentForm, paymentType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Payment</SelectItem>
                      <SelectItem value="partial">Partial Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Amount *</Label>
                  <Input
                    type="number"
                    value={paymentForm.paymentAmount}
                    onChange={(e) => setPaymentForm({...paymentForm, paymentAmount: e.target.value})}
                    placeholder="0.00"
                    max={selectedPayable.amount - (selectedPayable.paidAmount || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm({...paymentForm, paymentMethod: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Reference</Label>
                <Input
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                  placeholder="Payment reference number"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              {/* Integration Notice */}
              {selectedPayable.type === 'claims' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">System Integration Notice</p>
                      <p className="text-sm text-blue-800">
                        This payment will automatically update the claim status in the Claims module and reflect in all related reports.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={processPayment}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Process Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Investment View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Investment Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedInvestment?.investmentEntity}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvestment && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Investment Entity</Label>
                  <p className="text-sm">{selectedInvestment.investmentEntity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Entity Type</Label>
                  <p className="text-sm">{selectedInvestment.entityType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Investment Type</Label>
                  <p className="text-sm">{selectedInvestment.investmentType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm">USD {selectedInvestment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Expected Return Rate</Label>
                  <p className="text-sm">{selectedInvestment.expectedReturnRate}%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Risk Level</Label>
                  <Badge variant={
                    selectedInvestment.riskLevel === 'Low' ? 'secondary' :
                    selectedInvestment.riskLevel === 'Medium' ? 'default' : 'destructive'
                  }>
                    {selectedInvestment.riskLevel}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm">{selectedInvestment.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Investment Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Investment</DialogTitle>
            <DialogDescription>
              Modify investment details for {selectedInvestment?.investmentEntity}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Investment Entity</Label>
                <Input
                  value={editFormData.investmentEntity || ''}
                  onChange={(e) => setEditFormData({...editFormData, investmentEntity: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={editFormData.amount || ''}
                  onChange={(e) => setEditFormData({...editFormData, amount: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Return Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editFormData.expectedReturnRate || ''}
                  onChange={(e) => setEditFormData({...editFormData, expectedReturnRate: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Actual Returns</Label>
                <Input
                  type="number"
                  value={editFormData.actualReturns || ''}
                  onChange={(e) => setEditFormData({...editFormData, actualReturns: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingModule;