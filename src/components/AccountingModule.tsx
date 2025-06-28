import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileText, CreditCard, TrendingUp, Download, Plus, Eye, CheckCircle, Edit } from "lucide-react";
import { useAuth } from './AuthContext';

const AccountingModule = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("2024-12");

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
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial transactions</CardDescription>
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
                <CardDescription>Pending receivables and payables</CardDescription>
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
              <CardDescription>Create and manage financial transactions</CardDescription>
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

        <TabsContent value="receivables">
          <Card>
            <CardHeader>
              <CardTitle>Accounts Receivable</CardTitle>
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

          {/* Claims Management Section - Moved from Claims Module */}
          {user?.userType === 'Finance' && (
            <Tabs defaultValue="manage-claims" className="space-y-4">
              <TabsList>
                <TabsTrigger value="manage-claims">Manage Claims</TabsTrigger>
                <TabsTrigger value="commissions">Commissions</TabsTrigger>
                <TabsTrigger value="receivables-detail">Receivables Detail</TabsTrigger>
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

              <TabsContent value="receivables-detail" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Receivables Management</CardTitle>
                    <CardDescription>Track and manage outstanding receivables</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-purple-600 font-medium">Premium Receivables</p>
                          <p className="text-2xl font-bold text-purple-900">USD 8.75M</p>
                        </div>
                        <div className="bg-teal-50 p-4 rounded-lg">
                          <p className="text-sm text-teal-600 font-medium">Retro Receivables</p>
                          <p className="text-2xl font-bold text-teal-900">USD 12.2M</p>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <p className="text-sm text-amber-600 font-medium">Other Receivables</p>
                          <p className="text-2xl font-bold text-amber-900">USD 2.1M</p>
                        </div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Debtor</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Age (Days)</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Century Insurance Ltd</TableCell>
                            <TableCell>USD 2.5M</TableCell>
                            <TableCell>15</TableCell>
                            <TableCell><Badge variant="secondary">Premium</Badge></TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">Follow Up</Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Swiss Re</TableCell>
                            <TableCell>USD 1.8M</TableCell>
                            <TableCell>45</TableCell>
                            <TableCell><Badge variant="outline">Retro Recovery</Badge></TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">Follow Up</Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
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
                    <span>Technical Account</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                    <DollarSign className="h-8 w-8 mb-2" />
                    <span>Regulatory Returns</span>
                  </Button>
                </div>

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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingModule;