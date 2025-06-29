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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { DollarSign, FileText, CreditCard, TrendingUp, Download, Plus, Eye, CheckCircle, AlertTriangle, Users, Calculator, Edit, Save, X, Upload, Calendar, Target, BarChart3, PieChart, TrendingDown } from "lucide-react";
import { useDataStore } from './DataStore';

const AccountingModule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("2024-12");
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [approverName, setApproverName] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  
  // Investment states
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [isEditingInvestment, setIsEditingInvestment] = useState(false);
  const [investmentFormData, setInvestmentFormData] = useState({});
  const [isNewInvestment, setIsNewInvestment] = useState(false);
  
  // Premium receivables states
  const [isPremiumPaymentDialogOpen, setIsPremiumPaymentDialogOpen] = useState(false);
  const [selectedPremiumBooking, setSelectedPremiumBooking] = useState(null);
  const [premiumPaymentAmount, setPremiumPaymentAmount] = useState("");
  const [premiumPaymentStatus, setPremiumPaymentStatus] = useState("");
  const [premiumApproverName, setPremiumApproverName] = useState("");
  const [premiumPaymentReference, setPremiumPaymentReference] = useState("");

  // Claims validation state
  const [claimValidationAlert, setClaimValidationAlert] = useState(null);

  const { claims, updateClaim, treaties, updateTreaty } = useDataStore();

  // Sample financial data
  const financialSummary = [
    { metric: "Gross Premium Written", amount: "125,500,000", change: "+8.5%", status: "positive" },
    { metric: "Net Premium Earned", amount: "89,250,000", change: "+5.2%", status: "positive" },
    { metric: "Claims Incurred", amount: "62,175,000", change: "-2.1%", status: "positive" },
    { metric: "Commission Expense", amount: "22,312,500", change: "+3.8%", status: "neutral" },
    { metric: "Underwriting Result", amount: "4,762,500", change: "+15.2%", status: "positive" },
    { metric: "Investment Income", amount: "8,450,000", change: "+12.3%", status: "positive" }
  ];

  const recentTransactions = [
    { date: "2024-12-20", type: "Premium Receipt", reference: "PR-2024-1205", amount: "2,500,000", currency: "USD", status: "Completed" },
    { date: "2024-12-19", type: "Claim Payment", reference: "CP-2024-0892", amount: "-1,850,000", currency: "USD", status: "Completed" },
    { date: "2024-12-18", type: "Commission Payment", reference: "COM-2024-0445", amount: "-325,000", currency: "USD", status: "Pending" },
    { date: "2024-12-17", type: "Investment Income", reference: "INV-2024-0167", amount: "750,000", currency: "USD", status: "Completed" },
    { date: "2024-12-16", type: "Premium Receipt", reference: "PR-2024-1204", amount: "1,200,000", currency: "USD", status: "Completed" }
  ];

  const outstandingItems = [
    { type: "Premium Due", party: "ABC Insurance Ltd", amount: "850,000", dueDate: "2024-12-25", overdue: false },
    { type: "Commission Payable", party: "XYZ Brokers", amount: "125,000", dueDate: "2024-12-22", overdue: true },
    { type: "Claim Settlement", party: "DEF Insurance", amount: "2,200,000", dueDate: "2024-12-28", overdue: false },
    { type: "Investment Maturity", party: "Government Bonds", amount: "5,000,000", dueDate: "2024-12-30", overdue: false }
  ];

  // Sample premium receivables data
  const [premiumReceivables] = useState([
    {
      id: 1,
      treatyId: "1",
      treatyName: "Motor Treaty 2024",
      premiumAmount: 25500000,
      paidAmount: 25500000,
      outstandingAmount: 0,
      currency: "USD",
      status: "Full Payment",
      lastPaymentDate: "2024-01-15",
      approver: "John Smith",
      paymentReference: "PAY-2024-001"
    },
    {
      id: 2,
      treatyId: "2", 
      treatyName: "Property XOL 2024",
      premiumAmount: 18750000,
      paidAmount: 12000000,
      outstandingAmount: 6750000,
      currency: "USD",
      status: "Partial Payment",
      lastPaymentDate: "2024-06-15",
      approver: "Sarah Johnson",
      paymentReference: "PAY-2024-002"
    }
  ]);

  // Sample investment data
  const [investments, setInvestments] = useState([
    {
      id: 1,
      investmentType: "Government Bonds",
      investmentDate: "2024-01-15",
      amountAllocated: 10000000,
      expectedReturnRate: 8.5,
      expectedReturnAmount: 850000,
      maturityDate: "2025-01-15",
      riskLevel: "Low",
      description: "5-year Treasury Bonds",
      status: "Active",
      actualReturns: 425000,
      investmentManager: "Central Bank",
      notes: "Quarterly interest payments",
      performanceRatio: 1.05
    },
    {
      id: 2,
      investmentType: "Corporate Bonds",
      investmentDate: "2024-03-10",
      amountAllocated: 5000000,
      expectedReturnRate: 12.0,
      expectedReturnAmount: 600000,
      maturityDate: "2026-03-10",
      riskLevel: "Medium",
      description: "AAA-rated Corporate Bonds",
      status: "Active",
      actualReturns: 200000,
      investmentManager: "Investment Bank Ltd",
      notes: "Semi-annual coupon payments",
      performanceRatio: 1.12
    },
    {
      id: 3,
      investmentType: "Fixed Deposits",
      investmentDate: "2024-06-01",
      amountAllocated: 8000000,
      expectedReturnRate: 6.5,
      expectedReturnAmount: 520000,
      maturityDate: "2025-06-01",
      riskLevel: "Low",
      description: "12-month Fixed Deposit",
      status: "Active",
      actualReturns: 260000,
      investmentManager: "Commercial Bank",
      notes: "Monthly interest payments",
      performanceRatio: 0.98
    }
  ]);

  // Sample commission data
  const commissionData = [
    { 
      id: 1, 
      broker: "AON Tanzania", 
      treatyName: "Motor Treaty 2024", 
      commissionRate: 25.0, 
      premiumAmount: 25500000, 
      commissionDue: 6375000, 
      paidAmount: 6375000, 
      status: "Paid", 
      dueDate: "2024-01-31" 
    },
    { 
      id: 2, 
      broker: "Marsh Tanzania", 
      treatyName: "Property XOL 2024", 
      commissionRate: 20.0, 
      premiumAmount: 18750000, 
      commissionDue: 3750000, 
      paidAmount: 0, 
      status: "Outstanding", 
      dueDate: "2024-12-31" 
    },
    { 
      id: 3, 
      broker: "Willis Towers Watson", 
      treatyName: "Marine Treaty 2024", 
      commissionRate: 22.5, 
      premiumAmount: 12200000, 
      commissionDue: 2745000, 
      paidAmount: 1372500, 
      status: "Partial Payment", 
      dueDate: "2024-06-30" 
    }
  ];

  // Get approved claims for payment processing
  const getApprovedClaims = () => {
    return claims.filter(claim => claim.status === 'Outstanding' || claim.status === 'Approved');
  };

  // Claims validation function
  const validateClaimAgainstTreaty = (claim) => {
    const treaty = treaties.find(t => t.id === claim.treatyId);
    if (!treaty || !treaty.layers) {
      setClaimValidationAlert({
        type: "error",
        title: "Treaty Validation Error",
        message: "Unable to validate claim - treaty information not found or incomplete."
      });
      return false;
    }

    // Calculate total treaty capacity
    const totalCapacity = treaty.layers.reduce((sum, layer) => sum + layer.limit, 0);
    
    // Calculate current utilization (sum of all claims for this treaty)
    const treatyClaims = claims.filter(c => c.treatyId === claim.treatyId);
    const currentUtilization = treatyClaims.reduce((sum, c) => sum + c.claimAmount, 0);
    
    // Calculate remaining capacity
    const remainingCapacity = totalCapacity - currentUtilization;
    
    // Check if new claim exceeds remaining capacity
    if (claim.claimAmount > remainingCapacity) {
      const excessAmount = claim.claimAmount - remainingCapacity;
      const utilizationPercentage = ((currentUtilization / totalCapacity) * 100).toFixed(1);
      
      setClaimValidationAlert({
        type: "warning",
        title: "Treaty Capacity Exceeded",
        message: `This claim exceeds the remaining treaty capacity.`,
        details: {
          treatyName: treaty.treatyName,
          totalCapacity: totalCapacity,
          currentUtilization: currentUtilization,
          utilizationPercentage: utilizationPercentage,
          remainingCapacity: remainingCapacity,
          claimAmount: claim.claimAmount,
          excessAmount: excessAmount,
          currency: claim.currency
        }
      });
      return false;
    }

    return true;
  };

  const handlePaymentProcessing = (claim) => {
    // Validate claim against treaty capacity first
    if (!validateClaimAgainstTreaty(claim)) {
      return; // Stop processing if validation fails
    }

    setSelectedClaim(claim);
    setPaymentAmount(claim.claimAmount.toString());
    setPaymentStatus("Full Payment");
    setIsPaymentDialogOpen(true);
  };

  const processPayment = () => {
    if (!selectedClaim || !paymentAmount || !approverName || !paymentReference) {
      toast.error("Please fill in all required fields including approver name and payment reference");
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

    // Update claim status
    updateClaim(selectedClaim.id, {
      status: newStatus,
      paidAmount: amount,
      paymentDate: paymentDate,
      approver: approverName,
      paymentReference: paymentReference
    });

    toast.success(`Payment of ${selectedClaim.currency} ${amount.toLocaleString()} processed successfully`);
    
    setIsPaymentDialogOpen(false);
    setSelectedClaim(null);
    setPaymentAmount("");
    setApproverName("");
    setPaymentReference("");
    setClaimValidationAlert(null); // Clear any validation alerts
  };

  // Premium payment processing
  const handlePremiumPaymentProcessing = (booking) => {
    setSelectedPremiumBooking(booking);
    setPremiumPaymentAmount(booking.outstandingAmount.toString());
    setPremiumPaymentStatus(booking.outstandingAmount > 0 ? "Partial Payment" : "Full Payment");
    setIsPremiumPaymentDialogOpen(true);
  };

  const processPremiumPayment = () => {
    if (!selectedPremiumBooking || !premiumPaymentAmount || !premiumApproverName || !premiumPaymentReference) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(premiumPaymentAmount);
    toast.success(`Premium payment of ${selectedPremiumBooking.currency} ${amount.toLocaleString()} processed successfully`);
    
    setIsPremiumPaymentDialogOpen(false);
    setSelectedPremiumBooking(null);
    setPremiumPaymentAmount("");
    setPremiumApproverName("");
    setPremiumPaymentReference("");
  };

  // Investment management functions
  const handleViewInvestment = (investment) => {
    setSelectedInvestment(investment);
    setIsEditingInvestment(false);
    setIsInvestmentDialogOpen(true);
  };

  const handleEditInvestment = (investment) => {
    setSelectedInvestment(investment);
    setInvestmentFormData({
      investmentType: investment.investmentType,
      investmentDate: investment.investmentDate,
      amountAllocated: investment.amountAllocated,
      expectedReturnRate: investment.expectedReturnRate,
      maturityDate: investment.maturityDate,
      riskLevel: investment.riskLevel,
      description: investment.description,
      status: investment.status,
      actualReturns: investment.actualReturns,
      investmentManager: investment.investmentManager,
      notes: investment.notes
    });
    setIsEditingInvestment(true);
    setIsInvestmentDialogOpen(true);
  };

  const handleNewInvestment = () => {
    setSelectedInvestment(null);
    setInvestmentFormData({
      investmentType: "",
      investmentDate: new Date().toISOString().split('T')[0],
      amountAllocated: "",
      expectedReturnRate: "",
      maturityDate: "",
      riskLevel: "Low",
      description: "",
      status: "Active",
      actualReturns: 0,
      investmentManager: "",
      notes: ""
    });
    setIsEditingInvestment(true);
    setIsNewInvestment(true);
    setIsInvestmentDialogOpen(true);
  };

  const saveInvestment = () => {
    // Validation
    if (!investmentFormData.investmentType || !investmentFormData.amountAllocated || !investmentFormData.expectedReturnRate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(investmentFormData.amountAllocated);
    const rate = parseFloat(investmentFormData.expectedReturnRate);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid investment amount");
      return;
    }

    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Please enter a valid return rate (0-100%)");
      return;
    }

    const expectedReturnAmount = (amount * rate) / 100;

    if (isNewInvestment) {
      // Add new investment
      const newInvestment = {
        id: Date.now(),
        ...investmentFormData,
        amountAllocated: amount,
        expectedReturnRate: rate,
        expectedReturnAmount: expectedReturnAmount,
        performanceRatio: 1.0
      };
      setInvestments([...investments, newInvestment]);
      toast.success("New investment added successfully");
    } else {
      // Update existing investment
      setInvestments(investments.map(inv => 
        inv.id === selectedInvestment.id 
          ? { 
              ...inv, 
              ...investmentFormData, 
              amountAllocated: amount,
              expectedReturnRate: rate,
              expectedReturnAmount: expectedReturnAmount
            }
          : inv
      ));
      toast.success("Investment updated successfully");
    }

    setIsInvestmentDialogOpen(false);
    setIsEditingInvestment(false);
    setIsNewInvestment(false);
    setSelectedInvestment(null);
    setInvestmentFormData({});
  };

  const calculateInvestmentMetrics = () => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amountAllocated, 0);
    const totalExpectedReturns = investments.reduce((sum, inv) => sum + inv.expectedReturnAmount, 0);
    const totalActualReturns = investments.reduce((sum, inv) => sum + inv.actualReturns, 0);
    const averageReturnRate = investments.length > 0 ? 
      investments.reduce((sum, inv) => sum + inv.expectedReturnRate, 0) / investments.length : 0;
    const performanceRatio = totalExpectedReturns > 0 ? totalActualReturns / totalExpectedReturns : 0;

    return {
      totalInvested,
      totalExpectedReturns,
      totalActualReturns,
      averageReturnRate,
      performanceRatio
    };
  };

  const investmentMetrics = calculateInvestmentMetrics();

  const downloadDocument = (type, claimNumber) => {
    // Simulate document download
    toast.success(`${type} for claim ${claimNumber} downloaded successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrated Accounting System</h2>
          <p className="text-gray-600">Complete financial management with IFRS 17 compliance and enhanced investment tracking</p>
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

      {/* Claims Validation Alert */}
      {claimValidationAlert && (
        <Alert className={claimValidationAlert.type === "error" ? "border-red-500 bg-red-50" : "border-yellow-500 bg-yellow-50"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">{claimValidationAlert.title}</p>
              <p>{claimValidationAlert.message}</p>
              {claimValidationAlert.details && (
                <div className="bg-white p-3 rounded border mt-2">
                  <p className="font-medium">Treaty: {claimValidationAlert.details.treatyName}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <p>Total Capacity: {claimValidationAlert.details.currency} {claimValidationAlert.details.totalCapacity.toLocaleString()}</p>
                    <p>Current Utilization: {claimValidationAlert.details.utilizationPercentage}%</p>
                    <p>Remaining Capacity: {claimValidationAlert.details.currency} {claimValidationAlert.details.remainingCapacity.toLocaleString()}</p>
                    <p className="text-red-600 font-medium">Excess Amount: {claimValidationAlert.details.currency} {claimValidationAlert.details.excessAmount.toLocaleString()}</p>
                  </div>
                </div>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setClaimValidationAlert(null)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Financial Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="payables">Payables</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
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
                <CardDescription>Latest financial transactions including investment income</CardDescription>
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
                <Button variant="outline" className="w-full mt-4">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Transactions
                </Button>
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
                <Button variant="outline" className="w-full mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Entry
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Management</CardTitle>
              <CardDescription>Create and manage financial transactions including automated claim payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Transaction
                    </Button>
                    <Button variant="outline">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Bulk Upload
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Input placeholder="Search transactions..." className="w-64" />
                    <Button variant="outline">Filter</Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell className="font-mono">{transaction.reference}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className={transaction.amount.startsWith('-') ? 'text-red-600' : 'text-green-600'}>
                          {transaction.amount.startsWith('-') ? '-' : '+'}USD {parseInt(transaction.amount.replace('-', '')).toLocaleString()}
                        </TableCell>
                        <TableCell>{transaction.currency}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'Completed' ? 'secondary' : 'outline'}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          <Tabs defaultValue="premium-receivables" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="premium-receivables">Premium Receivables</TabsTrigger>
              <TabsTrigger value="other-receivables">Other Receivables</TabsTrigger>
            </TabsList>

            <TabsContent value="premium-receivables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Premium Receivables Management</CardTitle>
                  <CardDescription>Track and manage premium payments from treaties with approval workflow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total Premium Receivables</p>
                        <p className="text-2xl font-bold text-blue-900">
                          USD {premiumReceivables.reduce((sum, pr) => sum + pr.premiumAmount, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Total Paid</p>
                        <p className="text-2xl font-bold text-green-900">
                          USD {premiumReceivables.reduce((sum, pr) => sum + pr.paidAmount, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">Outstanding</p>
                        <p className="text-2xl font-bold text-orange-900">
                          USD {premiumReceivables.reduce((sum, pr) => sum + pr.outstandingAmount, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Collection Rate</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {((premiumReceivables.reduce((sum, pr) => sum + pr.paidAmount, 0) / 
                             premiumReceivables.reduce((sum, pr) => sum + pr.premiumAmount, 0)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Treaty Name</TableHead>
                          <TableHead>Premium Amount</TableHead>
                          <TableHead>Paid Amount</TableHead>
                          <TableHead>Outstanding</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Payment</TableHead>
                          <TableHead>Approver</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {premiumReceivables.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">{booking.treatyName}</TableCell>
                            <TableCell>{booking.currency} {booking.premiumAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-green-600">{booking.currency} {booking.paidAmount.toLocaleString()}</TableCell>
                            <TableCell className={booking.outstandingAmount > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                              {booking.currency} {booking.outstandingAmount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                booking.status === 'Full Payment' ? 'secondary' : 
                                booking.status === 'Partial Payment' ? 'default' : 'destructive'
                              }>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{booking.lastPaymentDate}</TableCell>
                            <TableCell>{booking.approver}</TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button size="sm" variant="outline">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                {booking.outstandingAmount > 0 && (
                                  <Button size="sm" onClick={() => handlePremiumPaymentProcessing(booking)}>
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Process Payment
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="other-receivables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Other Receivables</CardTitle>
                  <CardDescription>Manage reinsurance and other receivables</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total Receivables</p>
                        <p className="text-2xl font-bold text-blue-900">USD 20.95M</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Current (0-30 days)</p>
                        <p className="text-2xl font-bold text-green-900">USD 15.2M</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-600 font-medium">Overdue (31-90 days)</p>
                        <p className="text-2xl font-bold text-yellow-900">USD 4.1M</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-600 font-medium">Past Due (90+ days)</p>
                        <p className="text-2xl font-bold text-red-900">USD 1.65M</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Aging Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>• Reinsurance receivables aging shows healthy collection pattern</p>
                          <p>• 72.5% of receivables are current (within 30 days)</p>
                          <p>• Retrocession receivables total USD 12.2M</p>
                        </div>
                        <div>
                          <p>• Average collection period: 35 days</p>
                          <p>• Bad debt provision: 2.1% of total receivables</p>
                          <p>• Foreign exchange exposure: USD 8.5M</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <Tabs defaultValue="claims-payables" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="claims-payables">Claims Payables</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
            </TabsList>

            <TabsContent value="claims-payables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Claims Payment Processing</CardTitle>
                  <CardDescription>Process payments for approved claims with treaty capacity validation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Total Outstanding Claims</p>
                        <p className="text-2xl font-bold text-blue-900">{getApprovedClaims().length}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Total Amount Due</p>
                        <p className="text-2xl font-bold text-green-900">
                          USD {getApprovedClaims().reduce((sum, claim) => sum + claim.claimAmount, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-600 font-medium">Expected Retro Recovery</p>
                        <p className="text-2xl font-bold text-yellow-900">
                          USD {getApprovedClaims().reduce((sum, claim) => sum + (claim.retroRecovery || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-600 font-medium">Net Exposure</p>
                        <p className="text-2xl font-bold text-red-900">
                          USD {getApprovedClaims().reduce((sum, claim) => sum + (claim.claimAmount - (claim.retroRecovery || 0)), 0).toLocaleString()}
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
                        {getApprovedClaims().map((claim) => {
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
                                <Badge variant={claim.status === 'Outstanding' ? 'destructive' : 'default'}>
                                  {claim.status}
                                </Badge>
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
                                  onClick={() => handlePaymentProcessing(claim)}
                                  disabled={claim.status === 'Full Payment'}
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {claim.status === 'Full Payment' ? 'Paid' : 'Process Payment'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {getApprovedClaims().length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No approved claims awaiting payment</p>
                        <p className="text-sm">Claims will appear here once approved in the Claims module</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Commission Management</CardTitle>
                  <CardDescription>Manage broker commissions and payment schedules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Total Commission Due</p>
                        <p className="text-2xl font-bold text-purple-900">
                          USD {commissionData.reduce((sum, comm) => sum + comm.commissionDue, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Total Paid</p>
                        <p className="text-2xl font-bold text-green-900">
                          USD {commissionData.reduce((sum, comm) => sum + comm.paidAmount, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">Outstanding</p>
                        <p className="text-2xl font-bold text-orange-900">
                          USD {commissionData.reduce((sum, comm) => sum + (comm.commissionDue - comm.paidAmount), 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Active Brokers</p>
                        <p className="text-2xl font-bold text-blue-900">{commissionData.length}</p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Broker</TableHead>
                          <TableHead>Treaty</TableHead>
                          <TableHead>Commission Rate</TableHead>
                          <TableHead>Premium Amount</TableHead>
                          <TableHead>Commission Due</TableHead>
                          <TableHead>Paid Amount</TableHead>
                          <TableHead>Outstanding</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissionData.map((commission) => {
                          const outstanding = commission.commissionDue - commission.paidAmount;
                          return (
                            <TableRow key={commission.id}>
                              <TableCell className="font-medium">{commission.broker}</TableCell>
                              <TableCell>{commission.treatyName}</TableCell>
                              <TableCell>{commission.commissionRate}%</TableCell>
                              <TableCell>USD {commission.premiumAmount.toLocaleString()}</TableCell>
                              <TableCell>USD {commission.commissionDue.toLocaleString()}</TableCell>
                              <TableCell className="text-green-600">USD {commission.paidAmount.toLocaleString()}</TableCell>
                              <TableCell className={outstanding > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                                USD {outstanding.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  commission.status === 'Paid' ? 'secondary' : 
                                  commission.status === 'Partial Payment' ? 'default' : 'destructive'
                                }>
                                  {commission.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  {outstanding > 0 && (
                                    <Button size="sm">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      Pay
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Management</CardTitle>
              <CardDescription>Comprehensive investment tracking and portfolio management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Investment Overview */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Invested</p>
                    <p className="text-2xl font-bold text-blue-900">
                      USD {investmentMetrics.totalInvested.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Expected Returns</p>
                    <p className="text-2xl font-bold text-green-900">
                      USD {investmentMetrics.totalExpectedReturns.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Actual Returns</p>
                    <p className="text-2xl font-bold text-purple-900">
                      USD {investmentMetrics.totalActualReturns.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">Avg Return Rate</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {investmentMetrics.averageReturnRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-cyan-50 p-4 rounded-lg">
                    <p className="text-sm text-cyan-600 font-medium">Performance Ratio</p>
                    <p className="text-2xl font-bold text-cyan-900">
                      {investmentMetrics.performanceRatio.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Investment Portfolio</h3>
                  <Button onClick={handleNewInvestment}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Investment
                  </Button>
                </div>

                {/* Investments Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investment Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Actual Returns</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Maturity Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments.map((investment) => (
                      <TableRow key={investment.id}>
                        <TableCell className="font-medium">{investment.investmentType}</TableCell>
                        <TableCell>USD {investment.amountAllocated.toLocaleString()}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">USD {investment.expectedReturnAmount.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{investment.expectedReturnRate}%</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600">
                          USD {investment.actualReturns.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              investment.performanceRatio >= 1 ? 'bg-green-500' : 
                              investment.performanceRatio >= 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className={`text-sm font-medium ${
                              investment.performanceRatio >= 1 ? 'text-green-600' : 
                              investment.performanceRatio >= 0.8 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {(investment.performanceRatio * 100).toFixed(0)}%
                            </span>
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
                          <Badge variant={investment.status === 'Active' ? 'secondary' : 'outline'}>
                            {investment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{investment.maturityDate}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewInvestment(investment)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleEditInvestment(investment)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Update
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Portfolio Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Risk Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {['Low', 'Medium', 'High'].map(risk => {
                          const count = investments.filter(inv => inv.riskLevel === risk).length;
                          const percentage = investments.length > 0 ? (count / investments.length) * 100 : 0;
                          return (
                            <div key={risk} className="flex items-center justify-between">
                              <span className="text-sm">{risk} Risk</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      risk === 'Low' ? 'bg-green-500' : 
                                      risk === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{percentage.toFixed(0)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Investment Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[...new Set(investments.map(inv => inv.investmentType))].map(type => {
                          const typeInvestments = investments.filter(inv => inv.investmentType === type);
                          const totalAmount = typeInvestments.reduce((sum, inv) => sum + inv.amountAllocated, 0);
                          const percentage = investmentMetrics.totalInvested > 0 ? 
                            (totalAmount / investmentMetrics.totalInvested) * 100 : 0;
                          
                          return (
                            <div key={type} className="flex items-center justify-between">
                              <span className="text-sm">{type}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">USD {totalAmount.toLocaleString()}</span>
                                <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
                    <span>Trial Balance</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <TrendingUp className="h-8 w-8 mb-2" />
                    <span>P&L Statement</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <DollarSign className="h-8 w-8 mb-2" />
                    <span>Balance Sheet</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <FileText className="h-8 w-8 mb-2" />
                    <span>Cash Flow</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <TrendingUp className="h-8 w-8 mb-2" />
                    <span>Investment Report</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <DollarSign className="h-8 w-8 mb-2" />
                    <span>Regulatory Returns</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Claims Payment Processing Dialog */}
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
              {/* Claim Summary */}
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

              {/* Payment Details */}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="approverName">Approver Name *</Label>
                    <Input
                      id="approverName"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      placeholder="Enter approver name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentReference">Payment Reference *</Label>
                    <Input
                      id="paymentReference"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Enter payment reference"
                      required
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

                {/* Payment Validation */}
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
                <Button onClick={processPayment}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Process Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Premium Payment Processing Dialog */}
      <Dialog open={isPremiumPaymentDialogOpen} onOpenChange={setIsPremiumPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Premium Payment</DialogTitle>
            <DialogDescription>
              Process payment for {selectedPremiumBooking?.treatyName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPremiumBooking && (
            <div className="space-y-6">
              {/* Premium Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Premium Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Treaty:</strong> {selectedPremiumBooking.treatyName}</p>
                    <p><strong>Total Premium:</strong> {selectedPremiumBooking.currency} {selectedPremiumBooking.premiumAmount.toLocaleString()}</p>
                    <p><strong>Paid Amount:</strong> {selectedPremiumBooking.currency} {selectedPremiumBooking.paidAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p><strong>Outstanding:</strong> {selectedPremiumBooking.currency} {selectedPremiumBooking.outstandingAmount.toLocaleString()}</p>
                    <p><strong>Current Status:</strong> {selectedPremiumBooking.status}</p>
                    <p><strong>Last Payment:</strong> {selectedPremiumBooking.lastPaymentDate}</p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="premiumPaymentAmount">Payment Amount</Label>
                    <Input
                      id="premiumPaymentAmount"
                      type="number"
                      value={premiumPaymentAmount}
                      onChange={(e) => setPremiumPaymentAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="premiumPaymentDate">Payment Date</Label>
                    <Input
                      id="premiumPaymentDate"
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="premiumApproverName">Approver Name *</Label>
                    <Input
                      id="premiumApproverName"
                      value={premiumApproverName}
                      onChange={(e) => setPremiumApproverName(e.target.value)}
                      placeholder="Enter approver name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="premiumPaymentReference">Payment Reference *</Label>
                    <Input
                      id="premiumPaymentReference"
                      value={premiumPaymentReference}
                      onChange={(e) => setPremiumPaymentReference(e.target.value)}
                      placeholder="Enter payment reference"
                      required
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditingInvestment ? (isNewInvestment ? 'New Investment' : 'Update Investment') : 'Investment Details'}
            </DialogTitle>
            <DialogDescription>
              {isEditingInvestment ? 'Enter investment information' : 'View investment details and performance'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvestment || isNewInvestment ? (
            <div className="space-y-6">
              {!isEditingInvestment ? (
                // View Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Investment Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p><strong>Type:</strong> {selectedInvestment.investmentType}</p>
                        <p><strong>Date:</strong> {selectedInvestment.investmentDate}</p>
                        <p><strong>Amount:</strong> USD {selectedInvestment.amountAllocated.toLocaleString()}</p>
                        <p><strong>Manager:</strong> {selectedInvestment.investmentManager}</p>
                        <p><strong>Status:</strong> <Badge variant="secondary">{selectedInvestment.status}</Badge></p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Financial Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p><strong>Expected Return:</strong> {selectedInvestment.expectedReturnRate}%</p>
                        <p><strong>Expected Amount:</strong> USD {selectedInvestment.expectedReturnAmount.toLocaleString()}</p>
                        <p><strong>Actual Returns:</strong> USD {selectedInvestment.actualReturns.toLocaleString()}</p>
                        <p><strong>Performance:</strong> {(selectedInvestment.performanceRatio * 100).toFixed(0)}%</p>
                        <p><strong>Risk Level:</strong> <Badge variant="outline">{selectedInvestment.riskLevel}</Badge></p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Investment Timeline</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p><strong>Investment Date:</strong> {selectedInvestment.investmentDate}</p>
                        <p><strong>Maturity Date:</strong> {selectedInvestment.maturityDate}</p>
                        <p><strong>Duration:</strong> {Math.ceil((new Date(selectedInvestment.maturityDate) - new Date(selectedInvestment.investmentDate)) / (1000 * 60 * 60 * 24 * 365))} years</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Description & Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{selectedInvestment.description}</p>
                      {selectedInvestment.notes && (
                        <div>
                          <p className="text-sm font-medium mb-2">Notes:</p>
                          <p className="text-sm text-gray-600">{selectedInvestment.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsInvestmentDialogOpen(false)}>
                      Close
                    </Button>
                    <Button onClick={() => setIsEditingInvestment(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Investment
                    </Button>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="investmentType">Investment Type *</Label>
                      <Select 
                        value={investmentFormData.investmentType || ''} 
                        onValueChange={(value) => setInvestmentFormData(prev => ({ ...prev, investmentType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select investment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Government Bonds">Government Bonds</SelectItem>
                          <SelectItem value="Corporate Bonds">Corporate Bonds</SelectItem>
                          <SelectItem value="Treasury Bills">Treasury Bills</SelectItem>
                          <SelectItem value="Fixed Deposits">Fixed Deposits</SelectItem>
                          <SelectItem value="Stocks">Stocks</SelectItem>
                          <SelectItem value="Real Estate">Real Estate</SelectItem>
                          <SelectItem value="Mutual Funds">Mutual Funds</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="investmentDate">Investment Date *</Label>
                      <Input
                        id="investmentDate"
                        type="date"
                        value={investmentFormData.investmentDate || ''}
                        onChange={(e) => setInvestmentFormData(prev => ({ ...prev, investmentDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amountAllocated">Amount Allocated *</Label>
                      <Input
                        id="amountAllocated"
                        type="number"
                        value={investmentFormData.amountAllocated || ''}
                        onChange={(e) => setInvestmentFormData(prev => ({ ...prev, amountAllocated: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expectedReturnRate">Expected Return Rate (%) *</Label>
                      <Input
                        id="expectedReturnRate"
                        type="number"
                        step="0.01"
                        value={investmentFormData.expectedReturnRate || ''}
                        onChange={(e) => setInvestmentFormData(prev => ({ ...prev, expectedReturnRate: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maturityDate">Maturity Date</Label>
                      <Input
                        id="maturityDate"
                        type="date"
                        value={investmentFormData.maturityDate || ''}
                        onChange={(e) => setInvestmentFormData(prev => ({ ...prev, maturityDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="riskLevel">Risk Level</Label>
                      <Select 
                        value={investmentFormData.riskLevel || 'Low'} 
                        onValueChange={(value) => setInvestmentFormData(prev => ({ ...prev, riskLevel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Investment Status</Label>
                      <Select 
                        value={investmentFormData.status || 'Active'} 
                        onValueChange={(value) => setInvestmentFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Matured">Matured</SelectItem>
                          <SelectItem value="Terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actualReturns">Actual Returns (USD)</Label>
                      <Input
                        id="actualReturns"
                        type="number"
                        value={investmentFormData.actualReturns || ''}
                        onChange={(e) => setInvestmentFormData(prev => ({ ...prev, actualReturns: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investmentManager">Investment Manager/Advisor</Label>
                    <Input
                      id="investmentManager"
                      value={investmentFormData.investmentManager || ''}
                      onChange={(e) => setInvestmentFormData(prev => ({ ...prev, investmentManager: e.target.value }))}
                      placeholder="Enter investment manager name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Investment Description</Label>
                    <Textarea
                      id="description"
                      value={investmentFormData.description || ''}
                      onChange={(e) => setInvestmentFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter investment description..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes/Comments</Label>
                    <Textarea
                      id="notes"
                      value={investmentFormData.notes || ''}
                      onChange={(e) => setInvestmentFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Enter any additional notes..."
                      rows={3}
                    />
                  </div>

                  {/* Expected Return Calculation */}
                  {investmentFormData.amountAllocated && investmentFormData.expectedReturnRate && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Expected Return Amount: USD {((parseFloat(investmentFormData.amountAllocated) * parseFloat(investmentFormData.expectedReturnRate)) / 100).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      setIsEditingInvestment(false);
                      if (isNewInvestment) {
                        setIsInvestmentDialogOpen(false);
                        setIsNewInvestment(false);
                      }
                    }}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={saveInvestment}>
                      <Save className="h-4 w-4 mr-2" />
                      {isNewInvestment ? 'Create Investment' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingModule;