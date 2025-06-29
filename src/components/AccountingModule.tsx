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
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, FileText, CreditCard, TrendingUp, Download, Plus, Eye, CheckCircle, AlertTriangle, Users, Calculator, Building, Search, Filter, Calendar, PieChart, BarChart3, FileSpreadsheet, Printer } from "lucide-react";
import { useDataStore } from './DataStore';

const AccountingModule = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("2024-12");
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Investment states
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false);
  const [isViewInvestmentDialogOpen, setIsViewInvestmentDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [investmentFormData, setInvestmentFormData] = useState({
    investmentEntity: '',
    entityType: '',
    investmentType: '',
    amount: '',
    expectedReturn: '',
    duration: '',
    riskLevel: '',
    description: '',
    investmentDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    status: 'Active'
  });

  // Report generation states
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    reportType: 'all'
  });

  const { claims, updateClaim } = useDataStore();

  // Sample investment data with entity information
  const [investments, setInvestments] = useState([
    {
      id: 1,
      investmentEntity: "Tanzania Government Bonds",
      entityType: "Government",
      investmentType: "Bonds",
      amount: 50000000,
      expectedReturn: 8.5,
      actualReturn: 8.2,
      duration: "5 years",
      riskLevel: "Low",
      status: "Active",
      investmentDate: "2024-01-15",
      maturityDate: "2029-01-15",
      description: "Government treasury bonds for stable returns"
    },
    {
      id: 2,
      investmentEntity: "Vodacom Tanzania (VODA)",
      entityType: "Corporation",
      investmentType: "Stocks",
      amount: 25000000,
      expectedReturn: 12.0,
      actualReturn: 14.5,
      duration: "Long-term",
      riskLevel: "Medium",
      status: "Active",
      investmentDate: "2024-03-10",
      maturityDate: "N/A",
      description: "Blue-chip telecommunications stock investment"
    },
    {
      id: 3,
      investmentEntity: "CRDB Bank Fixed Deposit",
      entityType: "Financial Institution",
      investmentType: "Fixed Deposits",
      amount: 15000000,
      expectedReturn: 6.5,
      actualReturn: 6.5,
      duration: "2 years",
      riskLevel: "Low",
      status: "Active",
      investmentDate: "2024-06-01",
      maturityDate: "2026-06-01",
      description: "Secure fixed deposit with guaranteed returns"
    }
  ]);

  // Entity suggestions for autocomplete
  const entitySuggestions = [
    { name: "Tanzania Government Bonds", type: "Government" },
    { name: "Vodacom Tanzania (VODA)", type: "Corporation" },
    { name: "CRDB Bank", type: "Financial Institution" },
    { name: "NMB Bank", type: "Financial Institution" },
    { name: "Dangote Cement (DCEM)", type: "Corporation" },
    { name: "Tanzania Breweries (TBL)", type: "Corporation" },
    { name: "Bank of Tanzania Bills", type: "Government" },
    { name: "Precision Air (PAL)", type: "Corporation" }
  ];

  // Sample financial data
  const financialSummary = [
    { metric: "Gross Premium Written", amount: "125,500,000", change: "+8.5%", status: "positive" },
    { metric: "Net Premium Earned", amount: "89,250,000", change: "+5.2%", status: "positive" },
    { metric: "Claims Incurred", amount: "62,175,000", change: "-2.1%", status: "positive" },
    { metric: "Commission Expense", amount: "22,312,500", change: "+3.8%", status: "neutral" },
    { metric: "Underwriting Result", amount: "4,762,500", change: "+15.2%", status: "positive" },
    { metric: "Technical Reserves", amount: "198,500,000", change: "+4.7%", status: "neutral" }
  ];

  const recentTransactions = [
    { date: "2024-12-20", type: "Premium Receipt", reference: "PR-2024-1205", amount: "2,500,000", currency: "USD", status: "Completed" },
    { date: "2024-12-19", type: "Claim Payment", reference: "CP-2024-0892", amount: "-1,850,000", currency: "USD", status: "Completed" },
    { date: "2024-12-18", type: "Commission Payment", reference: "COM-2024-0445", amount: "-325,000", currency: "USD", status: "Pending" },
    { date: "2024-12-17", type: "Retro Receipt", reference: "RR-2024-0167", amount: "750,000", currency: "USD", status: "Completed" },
    { date: "2024-12-16", type: "Premium Receipt", reference: "PR-2024-1204", amount: "1,200,000", currency: "USD", status: "Completed" }
  ];

  const outstandingItems = [
    { type: "Premium Due", party: "ABC Insurance Ltd", amount: "850,000", dueDate: "2024-12-25", overdue: false },
    { type: "Commission Payable", party: "XYZ Brokers", amount: "125,000", dueDate: "2024-12-22", overdue: true },
    { type: "Claim Settlement", party: "DEF Insurance", amount: "2,200,000", dueDate: "2024-12-28", overdue: false },
    { type: "Retro Commission", party: "Global Re", amount: "450,000", dueDate: "2024-12-30", overdue: false }
  ];

  const trialBalance = [
    { account: "Cash and Bank", debit: "15,500,000", credit: "0", balance: "15,500,000" },
    { account: "Premium Receivables", debit: "8,750,000", credit: "0", balance: "8,750,000" },
    { account: "Reinsurance Receivables", debit: "12,200,000", credit: "0", balance: "12,200,000" },
    { account: "Technical Reserves", debit: "0", credit: "198,500,000", balance: "-198,500,000" },
    { account: "Premium Income", debit: "0", credit: "125,500,000", balance: "-125,500,000" },
    { account: "Claims Expense", debit: "62,175,000", credit: "0", balance: "62,175,000" },
    { account: "Commission Expense", debit: "22,312,500", credit: "0", balance: "22,312,500" },
    { account: "Reinsurance Premium", debit: "36,250,000", credit: "0", balance: "36,250,000" }
  ];

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

  const handlePaymentProcessing = (claim) => {
    setSelectedClaim(claim);
    setPaymentAmount(claim.claimAmount.toString());
    setPaymentStatus("Full Payment");
    setIsPaymentDialogOpen(true);
  };

  const processPayment = () => {
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

    // Update claim status
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

  // Investment management functions
  const handleNewInvestment = () => {
    setInvestmentFormData({
      investmentEntity: '',
      entityType: '',
      investmentType: '',
      amount: '',
      expectedReturn: '',
      duration: '',
      riskLevel: '',
      description: '',
      investmentDate: new Date().toISOString().split('T')[0],
      maturityDate: '',
      status: 'Active'
    });
    setIsInvestmentDialogOpen(true);
  };

  const handleSaveInvestment = () => {
    // Validation
    if (!investmentFormData.investmentEntity || !investmentFormData.entityType || !investmentFormData.investmentType || !investmentFormData.amount) {
      toast.error("Please fill in all required fields including Investment Entity");
      return;
    }

    // Check for duplicate entity
    const existingInvestment = investments.find(inv => 
      inv.investmentEntity.toLowerCase() === investmentFormData.investmentEntity.toLowerCase() &&
      inv.investmentType === investmentFormData.investmentType
    );

    if (existingInvestment) {
      toast.error("Investment with this entity and type already exists");
      return;
    }

    const newInvestment = {
      id: Date.now(),
      ...investmentFormData,
      amount: parseFloat(investmentFormData.amount),
      expectedReturn: parseFloat(investmentFormData.expectedReturn),
      actualReturn: 0
    };

    setInvestments([...investments, newInvestment]);
    toast.success("Investment created successfully");
    setIsInvestmentDialogOpen(false);
  };

  const handleViewInvestment = (investment) => {
    setSelectedInvestment(investment);
    setIsViewInvestmentDialogOpen(true);
  };

  const handleUpdateInvestment = (investment) => {
    setSelectedInvestment(investment);
    setInvestmentFormData({
      investmentEntity: investment.investmentEntity,
      entityType: investment.entityType,
      investmentType: investment.investmentType,
      amount: investment.amount.toString(),
      expectedReturn: investment.expectedReturn.toString(),
      duration: investment.duration,
      riskLevel: investment.riskLevel,
      description: investment.description,
      investmentDate: investment.investmentDate,
      maturityDate: investment.maturityDate,
      status: investment.status
    });
    setIsInvestmentDialogOpen(true);
  };

  // Report generation functions
  const generateReport = async (reportType) => {
    setIsGeneratingReport(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportData = {
        'trial-balance': {
          title: 'Trial Balance Report',
          data: trialBalance,
          period: selectedPeriod
        },
        'profit-loss': {
          title: 'Profit & Loss Statement',
          data: financialSummary,
          period: selectedPeriod
        },
        'balance-sheet': {
          title: 'Balance Sheet',
          data: [...trialBalance, ...financialSummary],
          period: selectedPeriod
        },
        'cash-flow': {
          title: 'Cash Flow Statement',
          data: recentTransactions,
          period: selectedPeriod
        },
        'technical-account': {
          title: 'Technical Account',
          data: [...financialSummary, ...commissionData],
          period: selectedPeriod
        },
        'regulatory-returns': {
          title: 'Regulatory Returns',
          data: [...financialSummary, ...trialBalance],
          period: selectedPeriod
        }
      };

      const report = reportData[reportType];
      
      // Create downloadable content
      const reportContent = `
${report.title}
Period: ${report.period}
Generated: ${new Date().toLocaleString()}

${JSON.stringify(report.data, null, 2)}
      `;

      // Create and download file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/\s+/g, '_')}_${selectedPeriod}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${report.title} generated and downloaded successfully`);
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const downloadDocument = (type, claimNumber) => {
    // Simulate document download
    toast.success(`${type} for claim ${claimNumber} downloaded successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrated Accounting System</h2>
          <p className="text-gray-600">Complete financial management with IFRS 17 compliance and claims payment processing</p>
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
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="payables">Payables</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
          <TabsTrigger value="ifrs17">IFRS 17</TabsTrigger>
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
                <CardDescription>Latest financial transactions including claim payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.type.includes('Receipt') ? 'bg-green-500' : 'bg-red-500'
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
                <CardDescription>Pending receivables and payables including claims</CardDescription>
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
          <Tabs defaultValue="commissions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="premium-receivables">Premium Receivables</TabsTrigger>
            </TabsList>

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

            <TabsContent value="premium-receivables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Premium Receivables</CardTitle>
                  <CardDescription>Manage premium and reinsurance receivables</CardDescription>
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
                          <p>• Premium receivables aging shows healthy collection pattern</p>
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
          <Tabs defaultValue="claims-management" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="claims-management">Claims Management</TabsTrigger>
              <TabsTrigger value="other-payables">Other Payables</TabsTrigger>
            </TabsList>

            <TabsContent value="claims-management" className="space-y-4">
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
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => downloadDocument("Debit Note", claim.claimNumber)}
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Debit Note
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

            <TabsContent value="other-payables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Other Accounts Payable</CardTitle>
                  <CardDescription>Manage commissions and other payables</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Total Payables</p>
                        <p className="text-2xl font-bold text-purple-900">USD 18.3M</p>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <p className="text-sm text-indigo-600 font-medium">Commissions</p>
                        <p className="text-2xl font-bold text-indigo-900">USD 3.2M</p>
                      </div>
                      <div className="bg-pink-50 p-4 rounded-lg">
                        <p className="text-sm text-pink-600 font-medium">Other Payables</p>
                        <p className="text-2xl font-bold text-pink-900">USD 2.3M</p>
                      </div>
                      <div className="bg-cyan-50 p-4 rounded-lg">
                        <p className="text-sm text-cyan-600 font-medium">Overdue Items</p>
                        <p className="text-2xl font-bold text-cyan-900">USD 0.8M</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Payment Schedule</h4>
                      <div className="space-y-2 text-sm">
                        <p>• Next 7 days: USD 2.5M in scheduled payments</p>
                        <p>• Next 30 days: USD 8.9M total payment obligations</p>
                        <p>• Average payment terms: 45 days</p>
                        <p>• Early payment discounts available: USD 150K potential savings</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Portfolio Management</CardTitle>
              <CardDescription>Manage investment allocations with entity identification and performance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button onClick={handleNewInvestment}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Investment
                    </Button>
                    <Button variant="outline">
                      <PieChart className="h-4 w-4 mr-2" />
                      Portfolio Analysis
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Input placeholder="Search investments..." className="w-64" />
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Total Investments</p>
                    <p className="text-2xl font-bold text-green-900">
                      USD {investments.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Expected Returns</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {(investments.reduce((sum, inv) => sum + (inv.amount * inv.expectedReturn / 100), 0) / investments.reduce((sum, inv) => sum + inv.amount, 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Active Investments</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {investments.filter(inv => inv.status === 'Active').length}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">Investment Entities</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {new Set(investments.map(inv => inv.investmentEntity)).size}
                    </p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investment Entity</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Investment Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Actual Return</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments.map((investment) => (
                      <TableRow key={investment.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{investment.investmentEntity}</p>
                            <p className="text-xs text-gray-500">{investment.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{investment.entityType}</Badge>
                        </TableCell>
                        <TableCell>{investment.investmentType}</TableCell>
                        <TableCell>USD {investment.amount.toLocaleString()}</TableCell>
                        <TableCell>{investment.expectedReturn}%</TableCell>
                        <TableCell className={investment.actualReturn >= investment.expectedReturn ? 'text-green-600' : 'text-red-600'}>
                          {investment.actualReturn}%
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
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline" onClick={() => handleViewInvestment(investment)}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" onClick={() => handleUpdateInvestment(investment)}>
                              <Calculator className="h-3 w-3 mr-1" />
                              Update
                            </Button>
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

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Generate comprehensive financial statements and reports with filtering options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Report Filters */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Report Filters</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input 
                        type="date" 
                        value={reportFilters.startDate}
                        onChange={(e) => setReportFilters({...reportFilters, startDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input 
                        type="date" 
                        value={reportFilters.endDate}
                        onChange={(e) => setReportFilters({...reportFilters, endDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Report Type</Label>
                      <Select value={reportFilters.reportType} onValueChange={(value) => setReportFilters({...reportFilters, reportType: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Reports</SelectItem>
                          <SelectItem value="financial">Financial Only</SelectItem>
                          <SelectItem value="regulatory">Regulatory Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => generateReport('trial-balance')}
                    disabled={isGeneratingReport}
                  >
                    <FileSpreadsheet className="h-8 w-8 mb-2" />
                    <span>Trial Balance</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => generateReport('profit-loss')}
                    disabled={isGeneratingReport}
                  >
                    <TrendingUp className="h-8 w-8 mb-2" />
                    <span>P&L Statement</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => generateReport('balance-sheet')}
                    disabled={isGeneratingReport}
                  >
                    <BarChart3 className="h-8 w-8 mb-2" />
                    <span>Balance Sheet</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => generateReport('cash-flow')}
                    disabled={isGeneratingReport}
                  >
                    <DollarSign className="h-8 w-8 mb-2" />
                    <span>Cash Flow</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => generateReport('technical-account')}
                    disabled={isGeneratingReport}
                  >
                    <Calculator className="h-8 w-8 mb-2" />
                    <span>Technical Account</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => generateReport('regulatory-returns')}
                    disabled={isGeneratingReport}
                  >
                    <FileText className="h-8 w-8 mb-2" />
                    <span>Regulatory Returns</span>
                  </Button>
                </div>

                {isGeneratingReport && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="text-blue-800">Generating report... Please wait.</p>
                    </div>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Trial Balance Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trialBalance.map((account, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{account.account}</TableCell>
                            <TableCell className="text-right">{account.debit !== "0" ? parseInt(account.debit).toLocaleString() : "-"}</TableCell>
                            <TableCell className="text-right">{account.credit !== "0" ? parseInt(account.credit).toLocaleString() : "-"}</TableCell>
                            <TableCell className="text-right font-medium">{parseInt(account.balance.replace('-', '')).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ifrs17">
          <Card>
            <CardHeader>
              <CardTitle>IFRS 17 Compliance</CardTitle>
              <CardDescription>Insurance contracts accounting and reporting with full system integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <p className="text-sm text-emerald-600 font-medium">CSM Balance</p>
                    <p className="text-2xl font-bold text-emerald-900">USD 45.2M</p>
                    <p className="text-xs text-emerald-600">Contractual Service Margin</p>
                  </div>
                  <div className="bg-cyan-50 p-4 rounded-lg">
                    <p className="text-sm text-cyan-600 font-medium">Risk Adjustment</p>
                    <p className="text-2xl font-bold text-cyan-900">USD 8.7M</p>
                    <p className="text-xs text-cyan-600">Non-financial Risk</p>
                  </div>
                  <div className="bg-violet-50 p-4 rounded-lg">
                    <p className="text-sm text-violet-600 font-medium">LIC</p>
                    <p className="text-2xl font-bold text-violet-900">USD 152.6M</p>
                    <p className="text-xs text-violet-600">Liability for Incurred Claims</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <p className="text-sm text-amber-600 font-medium">LRC</p>
                    <p className="text-2xl font-bold text-amber-900">USD 89.4M</p>
                    <p className="text-xs text-amber-600">Liability for Remaining Coverage</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-4">IFRS 17 Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-2">Measurement Approach:</p>
                      <p>• Premium Allocation Approach (PAA) for short-duration contracts</p>
                      <p>• General Measurement Model (GMM) for complex contracts</p>
                      <p>• Variable Fee Approach (VFA) for participating contracts</p>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Key Metrics:</p>
                      <p>• Insurance Revenue: USD 89.3M (current period)</p>
                      <p>• Insurance Service Expenses: USD 84.5M</p>
                      <p>• Net Insurance Financial Result: USD 4.8M</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">PAA Contracts</CardTitle>
                      <CardDescription>Premium Allocation Approach contracts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Total PAA Contracts</span>
                          <Badge variant="secondary">127</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total Premium</span>
                          <span className="font-medium">USD 56.45M</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Unearned Premium</span>
                          <span className="font-medium">USD 23.18M</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Loss Component</span>
                          <span className="font-medium">USD 0.00</span>
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          onClick={() => generateReport('paa-analysis')}
                          disabled={isGeneratingReport}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Generate PAA Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">GMM Contracts</CardTitle>
                      <CardDescription>General Measurement Model contracts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Total GMM Contracts</span>
                          <Badge variant="secondary">45</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total CSM</span>
                          <span className="font-medium">USD 45.2M</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Risk Adjustment</span>
                          <span className="font-medium">USD 12.8M</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Fulfillment CF</span>
                          <span className="font-medium">USD 58.0M</span>
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          onClick={() => generateReport('gmm-analysis')}
                          disabled={isGeneratingReport}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Generate GMM Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    className="flex-1" 
                    onClick={() => generateReport('ifrs17-full')}
                    disabled={isGeneratingReport}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Full IFRS 17 Report
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => generateReport('ifrs17-disclosure')}
                    disabled={isGeneratingReport}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Disclosure Notes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => generateReport('ifrs17-reconciliation')}
                    disabled={isGeneratingReport}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Reconciliation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Processing Dialog */}
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

      {/* Investment Dialog */}
      <Dialog open={isInvestmentDialogOpen} onOpenChange={setIsInvestmentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Investment Management</DialogTitle>
            <DialogDescription>
              Create or update investment with entity identification
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="investmentEntity">Investment Entity *</Label>
                <div className="relative">
                  <Input
                    id="investmentEntity"
                    value={investmentFormData.investmentEntity}
                    onChange={(e) => setInvestmentFormData({...investmentFormData, investmentEntity: e.target.value})}
                    placeholder="e.g., Tanzania Government Bonds, Vodacom (VODA), CRDB Bank"
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500">
                  Enter company name, government body, stock ticker, or financial institution
                </div>
                {/* Entity Suggestions */}
                {investmentFormData.investmentEntity && (
                  <div className="border rounded-lg p-2 bg-gray-50 max-h-32 overflow-y-auto">
                    <p className="text-xs font-medium text-gray-600 mb-1">Suggestions:</p>
                    {entitySuggestions
                      .filter(entity => 
                        entity.name.toLowerCase().includes(investmentFormData.investmentEntity.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((entity, index) => (
                        <div 
                          key={index}
                          className="text-xs p-1 hover:bg-white rounded cursor-pointer"
                          onClick={() => setInvestmentFormData({
                            ...investmentFormData, 
                            investmentEntity: entity.name,
                            entityType: entity.type
                          })}
                        >
                          <span className="font-medium">{entity.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">{entity.type}</Badge>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="entityType">Entity Type *</Label>
                <Select value={investmentFormData.entityType} onValueChange={(value) => setInvestmentFormData({...investmentFormData, entityType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Government">Government</SelectItem>
                    <SelectItem value="Corporation">Corporation</SelectItem>
                    <SelectItem value="Financial Institution">Financial Institution</SelectItem>
                    <SelectItem value="Mutual Fund">Mutual Fund</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="investmentType">Investment Type *</Label>
                <Select value={investmentFormData.investmentType} onValueChange={(value) => setInvestmentFormData({...investmentFormData, investmentType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select investment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bonds">Bonds</SelectItem>
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
                <Label htmlFor="amount">Investment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={investmentFormData.amount}
                  onChange={(e) => setInvestmentFormData({...investmentFormData, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedReturn">Expected Return Rate (%)</Label>
                <Input
                  id="expectedReturn"
                  type="number"
                  step="0.01"
                  value={investmentFormData.expectedReturn}
                  onChange={(e) => setInvestmentFormData({...investmentFormData, expectedReturn: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Investment Duration</Label>
                <Input
                  id="duration"
                  value={investmentFormData.duration}
                  onChange={(e) => setInvestmentFormData({...investmentFormData, duration: e.target.value})}
                  placeholder="e.g., 2 years, Long-term"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="riskLevel">Risk Level</Label>
                <Select value={investmentFormData.riskLevel} onValueChange={(value) => setInvestmentFormData({...investmentFormData, riskLevel: value})}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="investmentDate">Investment Date</Label>
                <Input
                  id="investmentDate"
                  type="date"
                  value={investmentFormData.investmentDate}
                  onChange={(e) => setInvestmentFormData({...investmentFormData, investmentDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maturityDate">Maturity Date (if applicable)</Label>
                <Input
                  id="maturityDate"
                  type="date"
                  value={investmentFormData.maturityDate}
                  onChange={(e) => setInvestmentFormData({...investmentFormData, maturityDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Investment Description</Label>
              <Textarea
                id="description"
                value={investmentFormData.description}
                onChange={(e) => setInvestmentFormData({...investmentFormData, description: e.target.value})}
                placeholder="Describe the investment purpose and strategy..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsInvestmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveInvestment}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Investment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Investment Dialog */}
      <Dialog open={isViewInvestmentDialogOpen} onOpenChange={setIsViewInvestmentDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Investment Details</DialogTitle>
            <DialogDescription>
              Comprehensive view of investment information
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvestment && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Investment Entity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Entity Name:</strong> {selectedInvestment.investmentEntity}</p>
                    <p><strong>Entity Type:</strong> {selectedInvestment.entityType}</p>
                    <p><strong>Investment Type:</strong> {selectedInvestment.investmentType}</p>
                    <p><strong>Description:</strong> {selectedInvestment.description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Financial Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Investment Amount:</strong> USD {selectedInvestment.amount.toLocaleString()}</p>
                    <p><strong>Expected Return:</strong> {selectedInvestment.expectedReturn}%</p>
                    <p><strong>Actual Return:</strong> {selectedInvestment.actualReturn}%</p>
                    <p><strong>Risk Level:</strong> {selectedInvestment.riskLevel}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Timeline & Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p><strong>Investment Date:</strong> {selectedInvestment.investmentDate}</p>
                    </div>
                    <div>
                      <p><strong>Maturity Date:</strong> {selectedInvestment.maturityDate || 'N/A'}</p>
                    </div>
                    <div>
                      <p><strong>Duration:</strong> {selectedInvestment.duration}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p><strong>Status:</strong> <Badge variant="secondary">{selectedInvestment.status}</Badge></p>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Performance Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>Expected Annual Return: USD {(selectedInvestment.amount * selectedInvestment.expectedReturn / 100).toLocaleString()}</p>
                    <p>Actual Annual Return: USD {(selectedInvestment.amount * selectedInvestment.actualReturn / 100).toLocaleString()}</p>
                  </div>
                  <div>
                    <p>Performance vs Expected: {((selectedInvestment.actualReturn - selectedInvestment.expectedReturn) / selectedInvestment.expectedReturn * 100).toFixed(1)}%</p>
                    <p className={selectedInvestment.actualReturn >= selectedInvestment.expectedReturn ? 'text-green-600' : 'text-red-600'}>
                      {selectedInvestment.actualReturn >= selectedInvestment.expectedReturn ? '✓ Outperforming' : '⚠ Underperforming'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingModule;