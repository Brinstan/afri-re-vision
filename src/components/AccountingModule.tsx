import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, FileText, CreditCard, TrendingUp, Download, Plus, Eye, CheckCircle, Edit, Calculator, Receipt, AlertCircle } from "lucide-react";
import { useAuth } from './AuthContext';

const AccountingModule = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("2024-12");
  const [selectedPremium, setSelectedPremium] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [partialAmount, setPartialAmount] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");
  const [documentType, setDocumentType] = useState("");

  // Sample financial summary data
  const financialSummary = [
    { metric: "Gross Premium Written", amount: "125,500,000", change: "+8.5%", status: "positive" },
    { metric: "Net Premium Earned", amount: "89,250,000", change: "+5.2%", status: "positive" },
    { metric: "Claims Incurred", amount: "62,175,000", change: "-2.1%", status: "positive" },
    { metric: "Commission Expense", amount: "22,312,500", change: "+3.8%", status: "neutral" },
    { metric: "Underwriting Result", amount: "4,762,500", change: "+15.2%", status: "positive" },
    { metric: "Technical Reserves", amount: "198,500,000", change: "+4.7%", status: "neutral" }
  ];

  // Sample premium bookings from Underwriting and Claims
  const premiumBookings = [
    {
      id: "PB-2024-001",
      contractNumber: "12345",
      treatyName: "Motor Treaty 2024",
      cedant: "Century Insurance Ltd",
      broker: "AON Tanzania",
      premiumType: "MDP",
      premiumAmount: 2500000,
      currency: "USD",
      bookingDate: "2024-12-15",
      dueDate: "2024-12-30",
      paymentStatus: "Unpaid",
      amountReceived: 0,
      department: "Underwriting",
      brokerageRate: 25.0,
      vatAmount: 450000,
      netAmount: 2950000
    },
    {
      id: "PB-2024-002",
      contractNumber: "12346",
      treatyName: "Property XOL 2024",
      cedant: "National Insurance Corp",
      broker: "Marsh Tanzania",
      premiumType: "Adjustment",
      premiumAmount: 1800000,
      currency: "USD",
      bookingDate: "2024-12-10",
      dueDate: "2024-12-25",
      paymentStatus: "Partially Paid",
      amountReceived: 900000,
      department: "Claims",
      brokerageRate: 20.0,
      vatAmount: 324000,
      netAmount: 2124000
    },
    {
      id: "PB-2024-003",
      contractNumber: "12347",
      treatyName: "Marine Treaty 2024",
      cedant: "Jubilee Insurance",
      broker: "Willis Towers Watson",
      premiumType: "Reinstatement",
      premiumAmount: 750000,
      currency: "USD",
      bookingDate: "2024-12-08",
      dueDate: "2024-12-20",
      paymentStatus: "Fully Paid",
      amountReceived: 750000,
      department: "Claims",
      brokerageRate: 22.5,
      vatAmount: 135000,
      netAmount: 885000
    }
  ];

  // Sample retrocession commissions
  const retroCommissions = [
    {
      id: "RC-2024-001",
      retroCover: "Cat XOL Retro",
      reinsurer: "Swiss Re",
      expectedAmount: 1250000,
      receivedAmount: 1250000,
      currency: "USD",
      dueDate: "2024-12-31",
      status: "Received",
      commissionRate: 15.0
    },
    {
      id: "RC-2024-002",
      retroCover: "Quota Share Retro",
      reinsurer: "Munich Re",
      expectedAmount: 2875000,
      receivedAmount: 0,
      currency: "USD",
      dueDate: "2024-12-28",
      status: "Pending",
      commissionRate: 20.0
    },
    {
      id: "RC-2024-003",
      retroCover: "Working XOL Retro",
      reinsurer: "Lloyd's Syndicate",
      expectedAmount: 650000,
      receivedAmount: 325000,
      currency: "USD",
      dueDate: "2024-12-25",
      status: "Partial",
      commissionRate: 12.5
    }
  ];

  // Sample approved claims data for payables
  const approvedClaims = [
    {
      claimNumber: "TAN/MV/TTY/2024/0001",
      contractNumber: "12345",
      insuredName: "ABC Transport Ltd",
      claimAmount: 2500000,
      currency: "USD",
      status: "No Payment Made",
      dateApproved: "2024-12-15",
      claimAdvice: null,
      paymentVoucher: null
    },
    {
      claimNumber: "TAN/F/FAC/2024/0002", 
      contractNumber: "12346",
      insuredName: "XYZ Manufacturing",
      claimAmount: 1800000,
      currency: "USD",
      status: "Partial Payment",
      dateApproved: "2024-12-10",
      claimAdvice: "claim_advice_002.pdf",
      paymentVoucher: "payment_voucher_002.pdf"
    }
  ];

  const handlePaymentStatusUpdate = (premiumId, newStatus, amount = 0) => {
    // Update payment status and sync with Treaties module
    const premium = premiumBookings.find(p => p.id === premiumId);
    if (premium) {
      premium.paymentStatus = newStatus;
      if (newStatus === "Partially Paid" && amount > 0) {
        premium.amountReceived = amount;
      } else if (newStatus === "Fully Paid") {
        premium.amountReceived = premium.netAmount;
      }
      
      // Simulate real-time sync to Treaties module
      alert(`Payment status updated to "${newStatus}" and synchronized with Treaties module.`);
    }
  };

  const generateDocument = (type, premiumId) => {
    const premium = premiumBookings.find(p => p.id === premiumId);
    if (!premium) return;

    const docNumber = `${type.toUpperCase()}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    
    // Simulate document generation
    alert(`${type === 'debit' ? 'Debit Note' : 'Credit Note'} ${docNumber} generated for ${premium.treatyName} - Amount: ${premium.currency} ${premium.premiumAmount.toLocaleString()}`);
  };

  const calculateCommissionDue = (premium) => {
    return (premium.premiumAmount * premium.brokerageRate) / 100;
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "Fully Paid": return "bg-green-100 text-green-800";
      case "Partially Paid": return "bg-yellow-100 text-yellow-800";
      case "Unpaid": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrated Accounting System</h2>
          <p className="text-gray-600">Complete financial management with IFRS 17 compliance</p>
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
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="payables">Payables</TabsTrigger>
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
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Premium Receivables</p>
              <p className="text-2xl font-bold text-blue-900">USD 8.75M</p>
              <p className="text-xs text-blue-600">Outstanding from cedants</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Retro Commissions Due</p>
              <p className="text-2xl font-bold text-green-900">USD 4.78M</p>
              <p className="text-xs text-green-600">Expected from reinsurers</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Overdue Payments</p>
              <p className="text-2xl font-bold text-yellow-900">USD 1.2M</p>
              <p className="text-xs text-yellow-600">Require follow-up</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Collection Rate</p>
              <p className="text-2xl font-bold text-purple-900">87.5%</p>
              <p className="text-xs text-purple-600">This month</p>
            </div>
          </div>

          <Tabs defaultValue="premium-tracking" className="space-y-4">
            <TabsList>
              <TabsTrigger value="premium-tracking">Premium Tracking</TabsTrigger>
              <TabsTrigger value="retro-commissions">Retro Commissions</TabsTrigger>
              <TabsTrigger value="document-generation">Document Generation</TabsTrigger>
            </TabsList>

            <TabsContent value="premium-tracking" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Premium Allocation & Tracking</CardTitle>
                  <CardDescription>
                    Manage all premiums booked by Underwriting and Claims departments with real-time status updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-4">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Manual Premium Entry
                        </Button>
                        <Button variant="outline">
                          <Calculator className="h-4 w-4 mr-2" />
                          Bulk Update
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Input placeholder="Search by contract or cedant..." className="w-64" />
                        <Button variant="outline">Filter</Button>
                      </div>
                    </div>

                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Contract</TableHead>
                            <TableHead>Treaty/Cedant</TableHead>
                            <TableHead>Premium Details</TableHead>
                            <TableHead>Payment Status</TableHead>
                            <TableHead>Amount Received</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {premiumBookings.map((premium) => (
                            <TableRow key={premium.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{premium.contractNumber}</p>
                                  <p className="text-xs text-gray-500">{premium.department}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{premium.treatyName}</p>
                                  <p className="text-sm text-gray-600">{premium.cedant}</p>
                                  <p className="text-xs text-gray-500">Broker: {premium.broker}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{premium.currency} {premium.premiumAmount.toLocaleString()}</p>
                                  <p className="text-xs text-gray-500">{premium.premiumType}</p>
                                  <p className="text-xs text-gray-500">VAT: {premium.currency} {premium.vatAmount.toLocaleString()}</p>
                                  <p className="text-xs font-medium">Net: {premium.currency} {premium.netAmount.toLocaleString()}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select 
                                  value={premium.paymentStatus} 
                                  onValueChange={(value) => handlePaymentStatusUpdate(premium.id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                                    <SelectItem value="Fully Paid">Fully Paid</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{premium.currency} {premium.amountReceived.toLocaleString()}</p>
                                  {premium.paymentStatus === "Partially Paid" && (
                                    <div className="mt-1">
                                      <Input
                                        type="number"
                                        placeholder="Update amount"
                                        className="w-24 h-6 text-xs"
                                        value={partialAmount}
                                        onChange={(e) => setPartialAmount(e.target.value)}
                                      />
                                    </div>
                                  )}
                                  <Progress 
                                    value={(premium.amountReceived / premium.netAmount) * 100} 
                                    className="w-20 h-1 mt-1"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm">{premium.dueDate}</p>
                                  {new Date(premium.dueDate) < new Date() && premium.paymentStatus !== "Fully Paid" && (
                                    <Badge variant="destructive" className="text-xs">Overdue</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-3 w-3 mr-1" />
                                    Update
                                  </Button>
                                  <Button size="sm">
                                    <Receipt className="h-3 w-3 mr-1" />
                                    Receipt
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Real-Time Synchronization</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                        <div>
                          <p>• Payment status updates automatically sync to Treaties module</p>
                          <p>• Premium booking changes reflect in Premium Booked section</p>
                          <p>• Commission calculations update broker payment schedules</p>
                        </div>
                        <div>
                          <p>• Overdue alerts trigger automatic follow-up workflows</p>
                          <p>• Collection metrics update dashboard in real-time</p>
                          <p>• IFRS 17 revenue recognition adjusts automatically</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="retro-commissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Retrocession Commission Management</CardTitle>
                  <CardDescription>Track and manage retrocession commissions from reinsurers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Total Expected</p>
                        <p className="text-2xl font-bold text-green-900">USD 4.78M</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Received</p>
                        <p className="text-2xl font-bold text-blue-900">USD 1.58M</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">Outstanding</p>
                        <p className="text-2xl font-bold text-orange-900">USD 3.2M</p>
                      </div>
                    </div>

                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Retro Cover</TableHead>
                            <TableHead>Reinsurer</TableHead>
                            <TableHead>Expected Amount</TableHead>
                            <TableHead>Received Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {retroCommissions.map((commission) => (
                            <TableRow key={commission.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{commission.retroCover}</p>
                                  <p className="text-xs text-gray-500">Rate: {commission.commissionRate}%</p>
                                </div>
                              </TableCell>
                              <TableCell>{commission.reinsurer}</TableCell>
                              <TableCell>{commission.currency} {commission.expectedAmount.toLocaleString()}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{commission.currency} {commission.receivedAmount.toLocaleString()}</p>
                                  <Progress 
                                    value={(commission.receivedAmount / commission.expectedAmount) * 100} 
                                    className="w-20 h-1 mt-1"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>{commission.dueDate}</TableCell>
                              <TableCell>
                                <Badge className={getPaymentStatusColor(commission.status)}>
                                  {commission.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button size="sm" variant="outline">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Record
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Follow Up
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-gray-50">
                        <CardHeader>
                          <CardTitle className="text-lg">Record Commission Receipt</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <Label>Commission ID</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select commission" />
                              </SelectTrigger>
                              <SelectContent>
                                {retroCommissions.map((comm) => (
                                  <SelectItem key={comm.id} value={comm.id}>
                                    {comm.retroCover} - {comm.reinsurer}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Amount Received</Label>
                            <Input
                              type="number"
                              value={commissionAmount}
                              onChange={(e) => setCommissionAmount(e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Receipt Date</Label>
                            <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                          </div>
                          <Button className="w-full">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Record Receipt
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-50">
                        <CardHeader>
                          <CardTitle className="text-lg">Commission Analytics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Collection Rate</span>
                              <span className="font-medium">33.1%</span>
                            </div>
                            <Progress value={33.1} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Average Days to Collect</span>
                              <span className="font-medium">45 days</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Overdue Amount</span>
                              <span className="font-medium text-red-600">USD 2.9M</span>
                            </div>
                          </div>
                          <Button variant="outline" className="w-full">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Detailed Analytics
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="document-generation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Automated Document Generation</CardTitle>
                  <CardDescription>Generate standardized debit notes and credit notes with all transaction details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-blue-50">
                        <CardHeader>
                          <CardTitle className="text-lg text-blue-900">Generate New Document</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Document Type</Label>
                            <Select value={documentType} onValueChange={setDocumentType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="debit">Debit Note</SelectItem>
                                <SelectItem value="credit">Credit Note</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Premium/Transaction</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select premium" />
                              </SelectTrigger>
                              <SelectContent>
                                {premiumBookings.map((premium) => (
                                  <SelectItem key={premium.id} value={premium.id}>
                                    {premium.contractNumber} - {premium.treatyName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Reason/Description</Label>
                            <Textarea
                              placeholder="Enter reason for document generation..."
                              rows={3}
                            />
                          </div>
                          <Button className="w-full">
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Document
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-green-50">
                        <CardHeader>
                          <CardTitle className="text-lg text-green-900">Document Templates</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="border border-green-200 rounded p-3 bg-white">
                              <h4 className="font-medium">Standard Debit Note</h4>
                              <p className="text-sm text-gray-600">For premium adjustments and additional charges</p>
                              <div className="mt-2 text-xs text-green-700">
                                ✓ Company letterhead<br/>
                                ✓ Treaty details<br/>
                                ✓ Amount breakdown<br/>
                                ✓ Payment terms
                              </div>
                            </div>
                            <div className="border border-green-200 rounded p-3 bg-white">
                              <h4 className="font-medium">Standard Credit Note</h4>
                              <p className="text-sm text-gray-600">For premium refunds and corrections</p>
                              <div className="mt-2 text-xs text-green-700">
                                ✓ Reference to original invoice<br/>
                                ✓ Reason for credit<br/>
                                ✓ Adjusted amounts<br/>
                                ✓ New balance due
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview Templates
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Premium ID</TableHead>
                            <TableHead>Contract/Treaty</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Document Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {premiumBookings.map((premium) => (
                            <TableRow key={premium.id}>
                              <TableCell className="font-mono">{premium.id}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{premium.contractNumber}</p>
                                  <p className="text-sm text-gray-600">{premium.treatyName}</p>
                                </div>
                              </TableCell>
                              <TableCell>{premium.currency} {premium.netAmount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge className={getPaymentStatusColor(premium.paymentStatus)}>
                                  {premium.paymentStatus}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => generateDocument('debit', premium.id)}
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    Debit Note
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => generateDocument('credit', premium.id)}
                                  >
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Credit Note
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accounts Payable</CardTitle>
              <CardDescription>Manage claims, commissions, and other payables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Total Payables</p>
                    <p className="text-2xl font-bold text-purple-900">USD 18.3M</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">Claims Payable</p>
                    <p className="text-2xl font-bold text-orange-900">USD 12.8M</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-indigo-600 font-medium">Commissions</p>
                    <p className="text-2xl font-bold text-indigo-900">USD 3.2M</p>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <p className="text-sm text-pink-600 font-medium">Other Payables</p>
                    <p className="text-2xl font-bold text-pink-900">USD 2.3M</p>
                  </div>
                </div>

                {/* Claims Management Section - Moved from Claims Module */}
                {user?.userType === 'Finance' && (
                  <Tabs defaultValue="manage-claims" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="manage-claims">Manage Claims</TabsTrigger>
                      <TabsTrigger value="commissions">Commissions</TabsTrigger>
                      <TabsTrigger value="other-payables">Other Payables</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manage-claims" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Claims Management - Finance View</CardTitle>
                          <CardDescription>Finance team access to approved claims for payment processing</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="border rounded-lg">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Claim Reference</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Documents</TableHead>
                                  <TableHead>Payment Status</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {approvedClaims.map((claim) => (
                                  <TableRow key={claim.claimNumber}>
                                    <TableCell className="font-mono text-sm">{claim.claimNumber}</TableCell>
                                    <TableCell>{claim.currency} {claim.claimAmount.toLocaleString()}</TableCell>
                                    <TableCell>
                                      <div className="flex space-x-1">
                                        <Button size="sm" variant="outline">
                                          <Download className="h-3 w-3 mr-1" />
                                          Claim Advice
                                        </Button>
                                        <Button size="sm" variant="outline">
                                          <Download className="h-3 w-3 mr-1" />
                                          Payment Voucher
                                        </Button>
                                        <Button size="sm" variant="outline">
                                          <Download className="h-3 w-3 mr-1" />
                                          Debit Note
                                        </Button>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Select defaultValue={claim.status}>
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="No Payment Made">No Payment</SelectItem>
                                          <SelectItem value="Partial Payment">Partial</SelectItem>
                                          <SelectItem value="Full Payment">Full Payment</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex space-x-1">
                                        <Button size="sm">
                                          <DollarSign className="h-3 w-3 mr-1" />
                                          Record Payment
                                        </Button>
                                        <Button size="sm" variant="outline">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Update Status
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

                    <TabsContent value="commissions" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Commission Management</CardTitle>
                          <CardDescription>Manage broker commissions and payments</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-600 font-medium">Total Commissions Due</p>
                                <p className="text-2xl font-bold text-blue-900">USD 3.2M</p>
                              </div>
                              <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-600 font-medium">Paid This Month</p>
                                <p className="text-2xl font-bold text-green-900">USD 1.8M</p>
                              </div>
                              <div className="bg-orange-50 p-4 rounded-lg">
                                <p className="text-sm text-orange-600 font-medium">Pending Payment</p>
                                <p className="text-2xl font-bold text-orange-900">USD 1.4M</p>
                              </div>
                            </div>
                            
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Broker</TableHead>
                                  <TableHead>Commission Due</TableHead>
                                  <TableHead>Due Date</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell>AON Tanzania</TableCell>
                                  <TableCell>USD 450,000</TableCell>
                                  <TableCell>2024-12-30</TableCell>
                                  <TableCell><Badge variant="outline">Pending</Badge></TableCell>
                                  <TableCell>
                                    <Button size="sm">Pay Commission</Button>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Marsh Tanzania</TableCell>
                                  <TableCell>USD 325,000</TableCell>
                                  <TableCell>2024-12-25</TableCell>
                                  <TableCell><Badge variant="destructive">Overdue</Badge></TableCell>
                                  <TableCell>
                                    <Button size="sm">Pay Commission</Button>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="other-payables" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Other Payables</CardTitle>
                          <CardDescription>Manage other outstanding payables</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-purple-600 font-medium">Retro Premiums</p>
                                <p className="text-2xl font-bold text-purple-900">USD 1.5M</p>
                              </div>
                              <div className="bg-teal-50 p-4 rounded-lg">
                                <p className="text-sm text-teal-600 font-medium">Operating Expenses</p>
                                <p className="text-2xl font-bold text-teal-900">USD 0.5M</p>
                              </div>
                              <div className="bg-amber-50 p-4 rounded-lg">
                                <p className="text-sm text-amber-600 font-medium">Other Liabilities</p>
                                <p className="text-2xl font-bold text-amber-900">USD 0.3M</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
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
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ifrs17" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IFRS 17 Compliance</CardTitle>
              <CardDescription>Insurance contracts accounting and reporting</CardDescription>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingModule;