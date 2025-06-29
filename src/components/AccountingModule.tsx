import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { DollarSign, FileText, CreditCard, TrendingUp, Download, Plus, Eye, CheckCircle, AlertTriangle, Users, Calculator, Upload, Calendar, Target, PieChart, BarChart3, TrendingDown } from "lucide-react";
import { useDataStore } from './DataStore';

const AccountingModule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("2024-12");
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Premium Management States
  const [selectedPremium, setSelectedPremium] = useState(null);
  const [isPremiumPaymentDialogOpen, setIsPremiumPaymentDialogOpen] = useState(false);
  const [premiumPaymentAmount, setPremiumPaymentAmount] = useState("");
  const [premiumPaymentStatus, setPremiumPaymentStatus] = useState("");
  const [premiumPaymentDate, setPremiumPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [approverName, setApproverName] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  
  // Investment Management States
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false);
  const [investmentType, setInvestmentType] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [expectedReturnRate, setExpectedReturnRate] = useState("");
  const [investmentDate, setInvestmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [maturityDate, setMaturityDate] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [investmentDescription, setInvestmentDescription] = useState("");
  const [investmentNotes, setInvestmentNotes] = useState("");
  const [investments, setInvestments] = useState([
    {
      id: 1,
      type: "Government Bonds",
      amount: 50000000,
      expectedReturnRate: 8.5,
      expectedReturnAmount: 4250000,
      investmentDate: "2024-01-15",
      maturityDate: "2026-01-15",
      riskLevel: "Low",
      description: "Tanzania Government 10-year Treasury Bonds",
      status: "Active",
      actualReturns: 2125000,
      notes: "Quarterly interest payments",
      lastUpdated: "2024-12-20"
    },
    {
      id: 2,
      type: "Fixed Deposits",
      amount: 25000000,
      expectedReturnRate: 12.0,
      expectedReturnAmount: 3000000,
      investmentDate: "2024-06-01",
      maturityDate: "2025-06-01",
      riskLevel: "Low",
      description: "12-month Fixed Deposit with CRDB Bank",
      status: "Active",
      actualReturns: 1500000,
      notes: "Monthly interest accrual",
      lastUpdated: "2024-12-19"
    },
    {
      id: 3,
      type: "Stocks",
      amount: 15000000,
      expectedReturnRate: 15.0,
      expectedReturnAmount: 2250000,
      investmentDate: "2024-03-10",
      maturityDate: null,
      riskLevel: "High",
      description: "Diversified equity portfolio - DSE listed companies",
      status: "Active",
      actualReturns: 1875000,
      notes: "Quarterly dividend payments expected",
      lastUpdated: "2024-12-18"
    }
  ]);

  const { claims, updateClaim, treaties, updatePremiumPaymentStatus } = useDataStore();

  // Sample financial data
  const financialSummary = [
    { metric: "Gross Premium Written", amount: "125,500,000", change: "+8.5%", status: "positive" },
    { metric: "Net Premium Earned", amount: "89,250,000", change: "+5.2%", status: "positive" },
    { metric: "Claims Incurred", amount: "62,175,000", change: "-2.1%", status: "positive" },
    { metric: "Commission Expense", amount: "22,312,500", change: "+3.8%", status: "neutral" },
    { metric: "Underwriting Result", amount: "4,762,500", change: "+15.2%", status: "positive" },
    { metric: "Investment Income", amount: "7,625,000", change: "+12.8%", status: "positive" }
  ];

  const recentTransactions = [
    { date: "2024-12-20", type: "Premium Receipt", reference: "PR-2024-1205", amount: "2,500,000", currency: "USD", status: "Completed" },
    { date: "2024-12-19", type: "Claim Payment", reference: "CP-2024-0892", amount: "-1,850,000", currency: "USD", status: "Completed" },
    { date: "2024-12-18", type: "Investment Income", reference: "INV-2024-0445", amount: "325,000", currency: "USD", status: "Completed" },
    { date: "2024-12-17", type: "Retro Receipt", reference: "RR-2024-0167", amount: "750,000", currency: "USD", status: "Completed" },
    { date: "2024-12-16", type: "Premium Receipt", reference: "PR-2024-1204", amount: "1,200,000", currency: "USD", status: "Completed" }
  ];

  const outstandingItems = [
    { type: "Premium Due", party: "ABC Insurance Ltd", amount: "850,000", dueDate: "2024-12-25", overdue: false },
    { type: "Commission Payable", party: "XYZ Brokers", amount: "125,000", dueDate: "2024-12-22", overdue: true },
    { type: "Claim Settlement", party: "DEF Insurance", amount: "2,200,000", dueDate: "2024-12-28", overdue: false },
    { type: "Investment Maturity", party: "CRDB Bank", amount: "25,000,000", dueDate: "2025-06-01", overdue: false }
  ];

  // Get premium receivables from treaties
  const getPremiumReceivables = () => {
    return treaties.filter(treaty => 
      treaty.premiumBookings && treaty.premiumBookings.some(booking => booking.status !== 'Paid')
    ).map(treaty => {
      const outstandingBookings = treaty.premiumBookings.filter(booking => booking.status !== 'Paid');
      const totalOutstanding = outstandingBookings.reduce((sum, booking) => 
        sum + (booking.amount - (booking.paidAmount || 0)), 0
      );
      
      return {
        treatyId: treaty.id,
        treatyName: treaty.treatyName,
        contractNumber: treaty.contractNumber,
        cedant: treaty.cedant,
        totalOutstanding,
        currency: treaty.currency,
        bookings: outstandingBookings,
        lastPaymentDate: treaty.premiumBookings
          .filter(b => b.paidAmount > 0)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date
      };
    });
  };

  const handlePremiumPaymentProcessing = (premium) => {
    setSelectedPremium(premium);
    setPremiumPaymentAmount(premium.totalOutstanding.toString());
    setPremiumPaymentStatus("Full Payment");
    setIsPremiumPaymentDialogOpen(true);
  };

  const processPremiumPayment = () => {
    if (!selectedPremium || !premiumPaymentAmount || !approverName) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(premiumPaymentAmount);
    const totalOutstanding = selectedPremium.totalOutstanding;

    let newStatus;
    if (amount >= totalOutstanding) {
      newStatus = "Paid";
    } else if (amount > 0) {
      newStatus = "Partially Paid";
    } else {
      toast.error("Invalid payment amount");
      return;
    }

    // Update the first outstanding booking
    const firstOutstandingBooking = selectedPremium.bookings[0];
    updatePremiumPaymentStatus(
      selectedPremium.treatyId, 
      firstOutstandingBooking.id, 
      newStatus, 
      amount
    );

    toast.success(`Premium payment of ${selectedPremium.currency} ${amount.toLocaleString()} processed successfully`);
    
    setIsPremiumPaymentDialogOpen(false);
    setSelectedPremium(null);
    setPremiumPaymentAmount("");
    setApproverName("");
    setPaymentReference("");
  };

  const handleClaimPaymentProcessing = (claim) => {
    setSelectedClaim(claim);
    setPaymentAmount(claim.claimAmount.toString());
    setPaymentStatus("Full Payment");
    setIsPaymentDialogOpen(true);
  };

  const processClaimPayment = () => {
    if (!selectedClaim || !paymentAmount) {
      toast.error("Please enter payment amount");
      return;
    }

    const amount = parseFloat(paymentAmount);
    const totalClaim = selectedClaim.claimAmount;

    let newStatus;
    if (amount >= totalClaim) {
      newStatus = "Full Payment";
    } else if (amount > 0) {
      newStatus = "Partial Payment";
    } else {
      toast.error("Invalid payment amount");
      return;
    }

    updateClaim(selectedClaim.id, {
      status: newStatus,
      paidAmount: amount,
      paymentDate: paymentDate
    });

    toast.success(`Payment of ${selectedClaim.currency} ${amount.toLocaleString()} processed successfully`);
    
    setIsPaymentDialogOpen(false);
    setSelectedClaim(null);
    setPaymentAmount("");
  };

  const addInvestment = () => {
    if (!investmentType || !investmentAmount || !expectedReturnRate || !riskLevel) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(investmentAmount);
    const returnRate = parseFloat(expectedReturnRate);
    const expectedReturn = (amount * returnRate) / 100;

    const newInvestment = {
      id: Date.now(),
      type: investmentType,
      amount: amount,
      expectedReturnRate: returnRate,
      expectedReturnAmount: expectedReturn,
      investmentDate: investmentDate,
      maturityDate: maturityDate || null,
      riskLevel: riskLevel,
      description: investmentDescription,
      status: "Active",
      actualReturns: 0,
      notes: investmentNotes,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    setInvestments([...investments, newInvestment]);
    toast.success("Investment added successfully");
    
    // Reset form
    setIsInvestmentDialogOpen(false);
    setInvestmentType("");
    setInvestmentAmount("");
    setExpectedReturnRate("");
    setInvestmentDate(new Date().toISOString().split('T')[0]);
    setMaturityDate("");
    setRiskLevel("");
    setInvestmentDescription("");
    setInvestmentNotes("");
  };

  const calculateInvestmentMetrics = () => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpectedReturns = investments.reduce((sum, inv) => sum + inv.expectedReturnAmount, 0);
    const totalActualReturns = investments.reduce((sum, inv) => sum + inv.actualReturns, 0);
    const averageReturnRate = investments.length > 0 
      ? investments.reduce((sum, inv) => sum + inv.expectedReturnRate, 0) / investments.length 
      : 0;

    return {
      totalInvested,
      totalExpectedReturns,
      totalActualReturns,
      averageReturnRate,
      performanceRatio: totalExpectedReturns > 0 ? (totalActualReturns / totalExpectedReturns) * 100 : 0
    };
  };

  const investmentMetrics = calculateInvestmentMetrics();

  const downloadDocument = (type, claimNumber) => {
    toast.success(`${type} for claim ${claimNumber} downloaded successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrated Accounting System</h2>
          <p className="text-gray-600">Complete financial management with premium tracking and investment management</p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-12">December 2024</SelectItem>
              <SelectItem value="2024-11">November 2024</SelectItem>
              <SelectItem value="2024-10">October 2024</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Financial Dashboard</TabsTrigger>
          <TabsTrigger value="receivables">Premium Receivables</TabsTrigger>
          <TabsTrigger value="investments">Investment Management</TabsTrigger>
          <TabsTrigger value="payables">Claims Payables</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {financialSummary.map((item, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.metric}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">USD {parseInt(item.amount).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={item.status === 'positive' ? 'text-green-600' : 'text-gray-600'}>
                      {item.change}
                    </span>
                    {" "}from last period
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial transactions including premium receipts and investment income</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.type.includes('Receipt') || transaction.type.includes('Income') ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{transaction.type}</p>
                          <p className="text-xs text-gray-500">{transaction.reference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          transaction.amount.startsWith('-') ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.amount.startsWith('-') ? '' : '+'}USD {parseInt(transaction.amount.replace('-', '')).toLocaleString()}
                        </p>
                        <Badge variant={transaction.status === 'Completed' ? 'secondary' : 'outline'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outstanding Items</CardTitle>
                <CardDescription>Pending receivables, payables, and investment maturities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {outstandingItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{item.type}</p>
                        <p className="text-xs text-gray-500">{item.party}</p>
                        <p className="text-xs text-gray-500">Due: {item.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">USD {parseInt(item.amount).toLocaleString()}</p>
                        <Badge variant={item.overdue ? 'destructive' : 'outline'}>
                          {item.overdue ? 'Overdue' : 'Due'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Premium Receivables Management</CardTitle>
              <CardDescription>Track and manage premium payments from treaties with real-time status updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Outstanding</p>
                    <p className="text-2xl font-bold text-blue-900">
                      USD {getPremiumReceivables().reduce((sum, p) => sum + p.totalOutstanding, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Active Treaties</p>
                    <p className="text-2xl font-bold text-green-900">{getPremiumReceivables().length}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600 font-medium">Overdue Payments</p>
                    <p className="text-2xl font-bold text-yellow-900">2</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Collection Rate</p>
                    <p className="text-2xl font-bold text-red-900">94.2%</p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Treaty Reference</TableHead>
                      <TableHead>Cedant</TableHead>
                      <TableHead>Outstanding Amount</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPremiumReceivables().map((premium) => (
                      <TableRow key={premium.treatyId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{premium.contractNumber}</p>
                            <p className="text-sm text-gray-500">{premium.treatyName}</p>
                          </div>
                        </TableCell>
                        <TableCell>{premium.cedant}</TableCell>
                        <TableCell>
                          <span className="font-medium text-red-600">
                            {premium.currency} {premium.totalOutstanding.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {premium.lastPaymentDate ? (
                            <span className="text-sm">{premium.lastPaymentDate}</span>
                          ) : (
                            <span className="text-sm text-gray-400">No payments</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">Outstanding</Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => handlePremiumPaymentProcessing(premium)}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Process Payment
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {getPremiumReceivables().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                    <p>All premium payments are up to date</p>
                    <p className="text-sm">Outstanding receivables will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Invested</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">USD {investmentMetrics.totalInvested.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Across {investments.length} investments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Expected Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">USD {investmentMetrics.totalExpectedReturns.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Annual projection</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Actual Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">USD {investmentMetrics.totalActualReturns.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{investmentMetrics.performanceRatio.toFixed(1)}% of expected</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Avg Return Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">{investmentMetrics.averageReturnRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Portfolio average</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Investment Portfolio Management
                <Button onClick={() => setIsInvestmentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Investment
                </Button>
              </CardTitle>
              <CardDescription>Track and manage investment portfolio with performance monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investment Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Actual Returns</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Maturity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{investment.type}</p>
                          <p className="text-sm text-gray-500">{investment.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>USD {investment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{investment.expectedReturnRate}%</p>
                          <p className="text-sm text-gray-500">USD {investment.expectedReturnAmount.toLocaleString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-green-600">USD {investment.actualReturns.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">
                            {((investment.actualReturns / investment.expectedReturnAmount) * 100).toFixed(1)}% achieved
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          investment.riskLevel === 'Low' ? 'secondary' : 
                          investment.riskLevel === 'Medium' ? 'default' : 'destructive'
                        }>
                          {investment.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {investment.maturityDate ? investment.maturityDate : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={investment.status === 'Active' ? 'secondary' : 'outline'}>
                          {investment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <TrendingUp className="h-3 w-3 mr-1" />
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
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Claims Payment Processing</CardTitle>
              <CardDescription>Process payments for approved claims with document management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Outstanding Claims</p>
                    <p className="text-2xl font-bold text-blue-900">{claims.filter(c => c.status === 'Outstanding').length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Total Amount Due</p>
                    <p className="text-2xl font-bold text-green-900">
                      USD {claims.filter(c => c.status === 'Outstanding').reduce((sum, claim) => sum + claim.claimAmount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600 font-medium">Expected Retro Recovery</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      USD {claims.filter(c => c.status === 'Outstanding').reduce((sum, claim) => sum + (claim.retroRecovery || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Net Exposure</p>
                    <p className="text-2xl font-bold text-red-900">
                      USD {claims.filter(c => c.status === 'Outstanding').reduce((sum, claim) => sum + (claim.claimAmount - (claim.retroRecovery || 0)), 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim Reference</TableHead>
                      <TableHead>Insured Name</TableHead>
                      <TableHead>Claim Amount</TableHead>
                      <TableHead>Retro Recovery</TableHead>
                      <TableHead>Net Payable</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.filter(claim => claim.status === 'Outstanding').map((claim) => {
                      const netPayable = claim.claimAmount - (claim.retroRecovery || 0);
                      return (
                        <TableRow key={claim.id}>
                          <TableCell className="font-mono text-sm">{claim.claimNumber}</TableCell>
                          <TableCell>{claim.insuredName}</TableCell>
                          <TableCell>{claim.currency} {claim.claimAmount.toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">
                            {claim.currency} {(claim.retroRecovery || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {claim.currency} {netPayable.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">Outstanding</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => downloadDocument("Claim Advice", claim.claimNumber)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Advice
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => downloadDocument("Payment Voucher", claim.claimNumber)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Voucher
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              onClick={() => handleClaimPaymentProcessing(claim)}
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              Process Payment
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {claims.filter(claim => claim.status === 'Outstanding').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                    <p>No outstanding claims for payment</p>
                    <p className="text-sm">Claims awaiting payment will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Generate comprehensive financial statements and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <FileText className="h-8 w-8 mb-2" />
                    <span>Premium Analysis</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <TrendingUp className="h-8 w-8 mb-2" />
                    <span>Investment Performance</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <DollarSign className="h-8 w-8 mb-2" />
                    <span>Cash Flow Statement</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <BarChart3 className="h-8 w-8 mb-2" />
                    <span>Portfolio Analysis</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <PieChart className="h-8 w-8 mb-2" />
                    <span>Asset Allocation</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <Calculator className="h-8 w-8 mb-2" />
                    <span>ROI Analysis</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Premium Payment Processing Dialog */}
      <Dialog open={isPremiumPaymentDialogOpen} onOpenChange={setIsPremiumPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Premium Payment</DialogTitle>
            <DialogDescription>
              Process payment for treaty {selectedPremium?.contractNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPremium && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Premium Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Treaty:</strong> {selectedPremium.treatyName}</p>
                    <p><strong>Cedant:</strong> {selectedPremium.cedant}</p>
                    <p><strong>Total Outstanding:</strong> {selectedPremium.currency} {selectedPremium.totalOutstanding.toLocaleString()}</p>
                  </div>
                  <div>
                    <p><strong>Contract:</strong> {selectedPremium.contractNumber}</p>
                    <p><strong>Currency:</strong> {selectedPremium.currency}</p>
                    <p><strong>Bookings:</strong> {selectedPremium.bookings.length} outstanding</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="premiumPaymentAmount">Payment Amount *</Label>
                    <Input
                      id="premiumPaymentAmount"
                      type="number"
                      value={premiumPaymentAmount}
                      onChange={(e) => setPremiumPaymentAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="premiumPaymentDate">Payment Date *</Label>
                    <Input
                      id="premiumPaymentDate"
                      type="date"
                      value={premiumPaymentDate}
                      onChange={(e) => setPremiumPaymentDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="approverName">Approver Name *</Label>
                    <Input
                      id="approverName"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      placeholder="Enter approver name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentReference">Payment Reference</Label>
                    <Input
                      id="paymentReference"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Enter payment reference"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="premiumPaymentStatus">Payment Status</Label>
                  <Select value={premiumPaymentStatus} onValueChange={setPremiumPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                      <SelectItem value="Full Payment">Full Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {premiumPaymentAmount && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {parseFloat(premiumPaymentAmount) >= selectedPremium.totalOutstanding 
                        ? "✓ This will mark all outstanding bookings as fully paid"
                        : `⚠ Remaining balance: ${selectedPremium.currency} ${(selectedPremium.totalOutstanding - parseFloat(premiumPaymentAmount)).toLocaleString()}`
                      }
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsPremiumPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={processPremiumPayment}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Process Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Investment Management Dialog */}
      <Dialog open={isInvestmentDialogOpen} onOpenChange={setIsInvestmentDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Investment</DialogTitle>
            <DialogDescription>
              Create a new investment entry with comprehensive tracking details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="investmentType">Investment Type *</Label>
                <Select value={investmentType} onValueChange={setInvestmentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select investment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Government Bonds">Government Bonds</SelectItem>
                    <SelectItem value="Corporate Bonds">Corporate Bonds</SelectItem>
                    <SelectItem value="Stocks">Stocks</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Fixed Deposits">Fixed Deposits</SelectItem>
                    <SelectItem value="Treasury Bills">Treasury Bills</SelectItem>
                    <SelectItem value="Mutual Funds">Mutual Funds</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="investmentAmount">Investment Amount (USD) *</Label>
                <Input
                  id="investmentAmount"
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedReturnRate">Expected Return Rate (%) *</Label>
                <Input
                  id="expectedReturnRate"
                  type="number"
                  step="0.01"
                  value={expectedReturnRate}
                  onChange={(e) => setExpectedReturnRate(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Return Amount (USD)</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  {investmentAmount && expectedReturnRate 
                    ? `USD ${((parseFloat(investmentAmount) * parseFloat(expectedReturnRate)) / 100).toLocaleString()}`
                    : 'USD 0'
                  }
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="investmentDate">Investment Date *</Label>
                <Input
                  id="investmentDate"
                  type="date"
                  value={investmentDate}
                  onChange={(e) => setInvestmentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maturityDate">Maturity Date (if applicable)</Label>
                <Input
                  id="maturityDate"
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskLevel">Risk Level *</Label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low Risk</SelectItem>
                  <SelectItem value="Medium">Medium Risk</SelectItem>
                  <SelectItem value="High">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investmentDescription">Investment Description</Label>
              <Textarea
                id="investmentDescription"
                value={investmentDescription}
                onChange={(e) => setInvestmentDescription(e.target.value)}
                placeholder="Describe the investment details..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investmentNotes">Notes/Comments</Label>
              <Textarea
                id="investmentNotes"
                value={investmentNotes}
                onChange={(e) => setInvestmentNotes(e.target.value)}
                placeholder="Additional notes or comments..."
                rows={2}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Supporting Documents</h4>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
                <span className="text-sm text-gray-500">Investment agreements, certificates, etc.</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsInvestmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addInvestment}>
                <Plus className="h-4 w-4 mr-2" />
                Add Investment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Claim Payment Processing Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Claim Payment</DialogTitle>
            <DialogDescription>
              Process payment for claim {selectedClaim?.claimNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClaim && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Claim Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Claim Number:</strong> {selectedClaim.claimNumber}</p>
                    <p><strong>Insured:</strong> {selectedClaim.insuredName}</p>
                    <p><strong>Total Claim:</strong> {selectedClaim.currency} {selectedClaim.claimAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p><strong>Retro Recovery:</strong> {selectedClaim.currency} {(selectedClaim.retroRecovery || 0).toLocaleString()}</p>
                    <p><strong>Net Payable:</strong> {selectedClaim.currency} {(selectedClaim.claimAmount - (selectedClaim.retroRecovery || 0)).toLocaleString()}</p>
                    <p><strong>Current Status:</strong> {selectedClaim.status}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentAmount">Payment Amount</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                      <SelectItem value="Full Payment">Full Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentAmount && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {parseFloat(paymentAmount) >= selectedClaim.claimAmount 
                        ? "✓ This will mark the claim as fully paid"
                        : `⚠ Remaining balance: ${selectedClaim.currency} ${(selectedClaim.claimAmount - parseFloat(paymentAmount)).toLocaleString()}`
                      }
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={processClaimPayment}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Process Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingModule;