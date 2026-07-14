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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { Search, FileText, Plus, Calculator, RotateCcw, Download, Eye, DollarSign, CheckCircle, AlertTriangle } from "lucide-react";
import { useDataStore } from './DataStore';

const TreatyManagementIntegrated = () => {
  const [activeTab, setActiveTab] = useState("premium-booking");
  const [contractNumber, setContractNumber] = useState("");
  const [underwritingYear, setUnderwritingYear] = useState("");
  const [showPremiumForm, setShowPremiumForm] = useState(false);
  const [premiumType, setPremiumType] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [bookedPremium, setBookedPremium] = useState("");
  const [brokeragePercentage, setBrokeragePercentage] = useState("25.00");
  const [taxPercentage, setTaxPercentage] = useState("0.00");
  const [bookingDescription, setBookingDescription] = useState("");
  const [selectedTreatyId, setSelectedTreatyId] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [reversalConfirmOpen, setReversalConfirmOpen] = useState(false);

  // Monthly returns form state
  const [returnMonth, setReturnMonth] = useState("");
  const [returnContract, setReturnContract] = useState("");
  const [returnType, setReturnType] = useState("");
  const [grossPremium, setGrossPremium] = useState("");
  const [netPremium, setNetPremium] = useState("");
  const [claimsIncurred, setClaimsIncurred] = useState("");
  const [commissionEarned, setCommissionEarned] = useState("");
  const [returnNotes, setReturnNotes] = useState("");

  // Inward display search state
  const [inwardContract, setInwardContract] = useState("");
  const [inwardYear, setInwardYear] = useState("");

  const {
    treaties,
    getTreatyByContractNumber,
    getClaimsByTreaty,
    addPremiumBooking,
    updatePremiumPaymentStatus
  } = useDataStore();

  // Derive the selected treaty from the store so the dialog reflects live updates
  const selectedTreaty = treaties.find(t => t.id === selectedTreatyId) ?? null;

  const handleContractQuery = () => {
    if (!contractNumber) {
      toast.error("Enter a contract number first");
      return;
    }
    const treaty = getTreatyByContractNumber(contractNumber);
    if (treaty) {
      setBrokeragePercentage(treaty.commission.toString());
      setCurrency(treaty.currency);
      setShowPremiumForm(true);
      toast.success(`Treaty found: ${treaty.treatyName}`);
    } else {
      toast.error("Contract not found. Please check the contract number and underwriting year.");
    }
  };

  const calculateAmounts = () => {
    const premium = parseFloat(bookedPremium) || 0;
    const brokerageRate = parseFloat(brokeragePercentage) || 0;
    const taxRate = parseFloat(taxPercentage) || 0;

    const brokerageAmount = (premium * brokerageRate) / 100;
    const vatAmount = (premium * 18) / 100; // 18% VAT
    const taxAmount = (premium * taxRate) / 100;
    const totalAmount = premium + vatAmount + taxAmount;

    return {
      brokerageAmount: brokerageAmount.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    };
  };

  const amounts = calculateAmounts();

  const handlePremiumBooking = () => {
    const treaty = getTreatyByContractNumber(contractNumber);
    if (!treaty) {
      toast.error("Treaty not found");
      return;
    }

    if (!premiumType) {
      toast.error("Select a premium type");
      return;
    }

    const amount = parseFloat(bookedPremium);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid premium amount greater than zero");
      return;
    }

    const newBooking = {
      id: Date.now().toString(),
      amount,
      type: premiumType,
      date: new Date().toISOString().split('T')[0],
      status: 'Unpaid' as const,
      paidAmount: 0
    };

    addPremiumBooking(treaty.id, newBooking);
    toast.success(`${premiumType} premium of ${currency} ${amount.toLocaleString()} booked against ${treaty.treatyName}`);

    // Reset form
    setShowPremiumForm(false);
    setBookedPremium("");
    setPremiumType("");
    setBookingDescription("");
  };

  const handleReversal = () => {
    setPremiumType("");
    setBookedPremium("");
    setBookingDescription("");
    setReversalConfirmOpen(false);
    toast.success("Transaction reversed — form entries cleared");
  };

  const handleViewTreaty = (treatyId: string) => {
    setSelectedTreatyId(treatyId);
    setIsViewDialogOpen(true);
  };

  const handleMarkBookingPaid = (bookingId: string, amount: number) => {
    if (!selectedTreaty) return;
    updatePremiumPaymentStatus(selectedTreaty.id, bookingId, 'Paid', amount);
    toast.success("Booking marked as fully paid");
  };

  // Monthly returns: live calculated ratios
  const returnCalcs = (() => {
    const gross = parseFloat(grossPremium) || 0;
    const net = parseFloat(netPremium) || 0;
    const incurred = parseFloat(claimsIncurred) || 0;
    const commission = parseFloat(commissionEarned) || 0;
    const lossRatio = net > 0 ? (incurred / net) * 100 : 0;
    const commissionRatio = gross > 0 ? (commission / gross) * 100 : 0;
    const combinedRatio = lossRatio + commissionRatio;
    const profitLoss = net - incurred - commission;
    return { lossRatio, commissionRatio, combinedRatio, profitLoss };
  })();

  const handleBookReturn = () => {
    if (!returnMonth || !returnContract || !returnType) {
      toast.error("Select the return month, contract number, and return type");
      return;
    }
    const treaty = getTreatyByContractNumber(returnContract);
    if (!treaty) {
      toast.error(`No treaty found for contract ${returnContract}`);
      return;
    }
    const net = parseFloat(netPremium);
    if (isNaN(net) || net <= 0) {
      toast.error("Enter a valid net premium earned amount");
      return;
    }

    addPremiumBooking(treaty.id, {
      id: Date.now().toString(),
      amount: net,
      type: `Monthly Return (${returnMonth})`,
      date: new Date().toISOString().split('T')[0],
      status: 'Unpaid' as const,
      paidAmount: 0
    });
    toast.success(`Monthly return for ${returnMonth} booked against ${treaty.treatyName}`);
    setReturnMonth("");
    setReturnContract("");
    setReturnType("");
    setGrossPremium("");
    setNetPremium("");
    setClaimsIncurred("");
    setCommissionEarned("");
    setReturnNotes("");
  };

  const handleGenerateReturnReport = () => {
    const rows = [
      ['Field', 'Value'],
      ['Return Month', returnMonth || '-'],
      ['Contract Number', returnContract || '-'],
      ['Return Type', returnType || '-'],
      ['Gross Premium Written', grossPremium || '0'],
      ['Net Premium Earned', netPremium || '0'],
      ['Claims Incurred', claimsIncurred || '0'],
      ['Commission Earned', commissionEarned || '0'],
      ['Loss Ratio %', returnCalcs.lossRatio.toFixed(1)],
      ['Commission Ratio %', returnCalcs.commissionRatio.toFixed(1)],
      ['Combined Ratio %', returnCalcs.combinedRatio.toFixed(1)],
      ['Profit/Loss', returnCalcs.profitLoss.toFixed(2)],
      ['Notes', returnNotes || '-']
    ];
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monthly-return-${returnMonth || 'draft'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Monthly return report downloaded");
  };

  const filteredInwardTreaties = treaties.filter(treaty =>
    (!inwardContract || treaty.contractNumber.toLowerCase().includes(inwardContract.toLowerCase()) ||
      treaty.treatyName.toLowerCase().includes(inwardContract.toLowerCase())) &&
    (!inwardYear || treaty.inceptionDate.startsWith(inwardYear))
  );

  const getTreatyClaimsInfo = (treatyId: string) => {
    const treatyClaims = getClaimsByTreaty(treatyId);
    const totalClaimsPaid = treatyClaims.reduce((sum, claim) => sum + claim.claimAmount, 0);
    return {
      totalClaims: treatyClaims.length,
      totalClaimsPaid,
      claims: treatyClaims
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integrated Treaty Management</h2>
          <p className="text-muted-foreground">Premium booking, monthly returns, and comprehensive inward treaty management</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="premium-booking">Premium Booking</TabsTrigger>
          <TabsTrigger value="monthly-returns">Monthly Returns</TabsTrigger>
          <TabsTrigger value="inward-display">Inward Treaty Display</TabsTrigger>
        </TabsList>

        <TabsContent value="premium-booking" className="space-y-4">
          {!showPremiumForm ? (
            <Card>
              <CardHeader>
                <CardTitle>Contract Selection</CardTitle>
                <CardDescription>Enter contract details to proceed with premium booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractNumber">Contract Number</Label>
                    <Input
                      id="contractNumber"
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      placeholder="e.g., 12345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="underwritingYear">Underwriting Year</Label>
                    <Input
                      id="underwritingYear"
                      value={underwritingYear}
                      onChange={(e) => setUnderwritingYear(e.target.value)}
                      placeholder="e.g., 2024"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleContractQuery}>
                    <Search className="h-4 w-4 mr-2" />
                    Query Treaty Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Premium Booking Form</CardTitle>
                  <CardDescription>
                    Contract: {contractNumber} | Year: {underwritingYear}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="premiumType">Premium Type</Label>
                      <Select value={premiumType} onValueChange={setPremiumType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select premium type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MDP">MDP (Minimum Deposit Premium)</SelectItem>
                          <SelectItem value="Reinstatement">Reinstatement Premium</SelectItem>
                          <SelectItem value="Adjustment">Adjustment Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="TZS">TZS</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter premium description..."
                      rows={3}
                      value={bookingDescription}
                      onChange={(e) => setBookingDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bookedPremium">Booked Premium Amount</Label>
                    <Input
                      id="bookedPremium"
                      type="number"
                      value={bookedPremium}
                      onChange={(e) => setBookedPremium(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  {(premiumType === "MDP" || premiumType === "Adjustment") && (
                    <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-lg space-y-3">
                      <h4 className="font-medium text-blue-900 dark:text-blue-200">Brokerage Calculation</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="brokeragePercentage">Brokerage Percentage (%)</Label>
                          <Input
                            id="brokeragePercentage"
                            type="number"
                            step="0.01"
                            value={brokeragePercentage}
                            onChange={(e) => setBrokeragePercentage(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Brokerage Amount</Label>
                          <div className="p-2 bg-card rounded border">
                            {currency} {amounts.brokerageAmount}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <h4 className="font-medium text-foreground">Tax Calculations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>VAT on Premium (18%)</Label>
                        <div className="p-2 bg-card rounded border">
                          {currency} {amounts.vatAmount}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxPercentage">Other Tax (%)</Label>
                        <Input
                          id="taxPercentage"
                          type="number"
                          step="0.01"
                          value={taxPercentage}
                          onChange={(e) => setTaxPercentage(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tax Amount</Label>
                        <div className="p-2 bg-card rounded border">
                          {currency} {amounts.taxAmount}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950/40 p-4 rounded-lg">
                    <div className="space-y-2">
                      <Label>Total Amount (Premium + VAT + Tax)</Label>
                      <div className="p-2 bg-card rounded border font-bold text-lg">
                        {currency} {parseFloat(amounts.totalAmount).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handlePremiumBooking}>
                      <FileText className="h-4 w-4 mr-2" />
                      Confirm Booking
                    </Button>
                    <Button variant="outline" onClick={() => setReversalConfirmOpen(true)}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reverse Transaction
                    </Button>
                    <Button variant="outline" onClick={() => setShowPremiumForm(false)}>
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="monthly-returns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Returns Booking</CardTitle>
              <CardDescription>Book monthly premium returns and adjustments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="returnMonth">Return Month</Label>
                  <Select value={returnMonth} onValueChange={setReturnMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-01">January 2024</SelectItem>
                      <SelectItem value="2024-02">February 2024</SelectItem>
                      <SelectItem value="2024-03">March 2024</SelectItem>
                      <SelectItem value="2024-04">April 2024</SelectItem>
                      <SelectItem value="2024-05">May 2024</SelectItem>
                      <SelectItem value="2024-06">June 2024</SelectItem>
                      <SelectItem value="2024-07">July 2024</SelectItem>
                      <SelectItem value="2024-08">August 2024</SelectItem>
                      <SelectItem value="2024-09">September 2024</SelectItem>
                      <SelectItem value="2024-10">October 2024</SelectItem>
                      <SelectItem value="2024-11">November 2024</SelectItem>
                      <SelectItem value="2024-12">December 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="returnContract">Contract Number</Label>
                  <Input
                    id="returnContract"
                    placeholder="e.g., 12345"
                    value={returnContract}
                    onChange={(e) => setReturnContract(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="returnType">Return Type</Label>
                  <Select value={returnType} onValueChange={setReturnType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium-return">Premium Return</SelectItem>
                      <SelectItem value="commission-return">Commission Return</SelectItem>
                      <SelectItem value="profit-commission">Profit Commission</SelectItem>
                      <SelectItem value="loss-adjustment">Loss Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grossPremium">Gross Premium Written</Label>
                  <Input
                    id="grossPremium"
                    type="number"
                    placeholder="0.00"
                    value={grossPremium}
                    onChange={(e) => setGrossPremium(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="netPremium">Net Premium Earned</Label>
                  <Input
                    id="netPremium"
                    type="number"
                    placeholder="0.00"
                    value={netPremium}
                    onChange={(e) => setNetPremium(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="claimsIncurred">Claims Incurred</Label>
                  <Input
                    id="claimsIncurred"
                    type="number"
                    placeholder="0.00"
                    value={claimsIncurred}
                    onChange={(e) => setClaimsIncurred(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionEarned">Commission Earned</Label>
                  <Input
                    id="commissionEarned"
                    type="number"
                    placeholder="0.00"
                    value={commissionEarned}
                    onChange={(e) => setCommissionEarned(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="returnNotes">Notes/Comments</Label>
                <Textarea
                  id="returnNotes"
                  placeholder="Enter any additional notes for this return..."
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Calculated Results</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>Loss Ratio: <span className="font-bold">{returnCalcs.lossRatio.toFixed(1)}%</span></p>
                    <p>Commission Ratio: <span className="font-bold">{returnCalcs.commissionRatio.toFixed(1)}%</span></p>
                  </div>
                  <div>
                    <p>Combined Ratio: <span className="font-bold">{returnCalcs.combinedRatio.toFixed(1)}%</span></p>
                    <p>Profit/Loss: <span className={`font-bold ${returnCalcs.profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {returnCalcs.profitLoss >= 0 ? '+' : '-'}USD {Math.abs(returnCalcs.profitLoss).toLocaleString()}
                    </span></p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleBookReturn}>
                  <Plus className="h-4 w-4 mr-2" />
                  Book Return
                </Button>
                <Button variant="outline" onClick={handleGenerateReturnReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inward-display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inward Treaty Display</CardTitle>
              <CardDescription>Search and view inward treaties with comprehensive details and linked claims</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inwardContract">Contract Number</Label>
                  <Input
                    id="inwardContract"
                    placeholder="Contract number or treaty name"
                    value={inwardContract}
                    onChange={(e) => setInwardContract(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inwardYear">Underwriting Year (Optional)</Label>
                  <Input
                    id="inwardYear"
                    placeholder="e.g., 2024"
                    value={inwardYear}
                    onChange={(e) => setInwardYear(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex space-x-2 items-center">
                <Button variant="outline" onClick={() => { setInwardContract(""); setInwardYear(""); }}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredInwardTreaties.length} of {treaties.length} treaties — results filter as you type
                </p>
              </div>

              {/* Search Results */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead>Treaty Name</TableHead>
                      <TableHead>Cedant</TableHead>
                      <TableHead>Broker</TableHead>
                      <TableHead>Premium Status</TableHead>
                      <TableHead>Claims</TableHead>
                      <TableHead>Retro %</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInwardTreaties.map((treaty) => {
                      const claimsInfo = getTreatyClaimsInfo(treaty.id);
                      const premiumStatus = treaty.premiumBookings?.some(b => b.status === 'Unpaid') ? 'Outstanding' : 'Current';
                      
                      return (
                        <TableRow key={treaty.id}>
                          <TableCell className="font-medium">{treaty.contractNumber}</TableCell>
                          <TableCell>{treaty.treatyName}</TableCell>
                          <TableCell>{treaty.cedant}</TableCell>
                          <TableCell>{treaty.broker}</TableCell>
                          <TableCell>
                            <Badge variant={premiumStatus === 'Outstanding' ? 'destructive' : 'secondary'}>
                              {premiumStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{claimsInfo.totalClaims} claims</p>
                              <p className="text-xs text-muted-foreground">
                                USD {claimsInfo.totalClaimsPaid.toLocaleString()} paid
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{treaty.retroPercentage}%</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline" onClick={() => handleViewTreaty(treaty.id)}>
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                if (claimsInfo.totalClaims === 0) {
                                  toast.info(`No claims recorded for ${treaty.treatyName}`);
                                } else {
                                  handleViewTreaty(treaty.id);
                                }
                              }}>
                                <FileText className="h-3 w-3 mr-1" />
                                Claims
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {filteredInwardTreaties.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No treaties match your search.</p>
                    <p className="text-sm">Adjust the filters or clear them to see all treaties.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reversal Confirmation */}
      <AlertDialog open={reversalConfirmOpen} onOpenChange={setReversalConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverse this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the premium type, amount, and description you have entered. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReversal}>Reverse Transaction</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Treaty Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Treaty Details - {selectedTreaty?.treatyName}</DialogTitle>
            <DialogDescription>
              Comprehensive treaty information with linked claims and premium bookings
            </DialogDescription>
          </DialogHeader>
          
          {selectedTreaty && (
            <div className="space-y-6">
              {/* Basic Treaty Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Treaty Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Contract Number:</strong> {selectedTreaty.contractNumber}</p>
                    <p><strong>Cedant:</strong> {selectedTreaty.cedant}</p>
                    <p><strong>Broker:</strong> {selectedTreaty.broker}</p>
                    <p><strong>Country:</strong> {selectedTreaty.country}</p>
                    <p><strong>Period:</strong> {selectedTreaty.inceptionDate} to {selectedTreaty.expiryDate}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Financial Terms</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Premium:</strong> {selectedTreaty.currency} {selectedTreaty.premium.toLocaleString()}</p>
                    <p><strong>Participation:</strong> {selectedTreaty.participationShare}%</p>
                    <p><strong>Commission:</strong> {selectedTreaty.commission}%</p>
                    <p><strong>Retro Coverage:</strong> {selectedTreaty.retroPercentage}%</p>
                    <p><strong>Status:</strong> <Badge variant="secondary">{selectedTreaty.status}</Badge></p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Claims Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {(() => {
                      const claimsInfo = getTreatyClaimsInfo(selectedTreaty.id);
                      const outstandingAmount = claimsInfo.claims
                        .filter(c => c.status === 'Outstanding')
                        .reduce((sum, c) => sum + c.claimAmount, 0);
                      return (
                        <>
                          <p><strong>Total Claims:</strong> {claimsInfo.totalClaims}</p>
                          <p><strong>Claims Incurred:</strong> USD {claimsInfo.totalClaimsPaid.toLocaleString()}</p>
                          <p><strong>Loss Ratio:</strong> {selectedTreaty.premium > 0 ? ((claimsInfo.totalClaimsPaid / selectedTreaty.premium) * 100).toFixed(1) : 0}%</p>
                          <p><strong>Outstanding:</strong> USD {outstandingAmount.toLocaleString()}</p>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Premium Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Premium Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTreaty.premiumBookings?.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>{booking.date}</TableCell>
                          <TableCell>{booking.type}</TableCell>
                          <TableCell>{selectedTreaty.currency} {booking.amount.toLocaleString()}</TableCell>
                          <TableCell>{selectedTreaty.currency} {(booking.paidAmount || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              booking.status === 'Paid' ? 'secondary' : 
                              booking.status === 'Partially Paid' ? 'default' : 'destructive'
                            }>
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {booking.status !== 'Paid' ? (
                              <Button size="sm" variant="outline" onClick={() => handleMarkBookingPaid(booking.id, booking.amount)}>
                                <DollarSign className="h-3 w-3 mr-1" />
                                Mark as Paid
                              </Button>
                            ) : (
                              <Badge variant="secondary">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Settled
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Individual Claims */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Individual Claims</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const treatyClaims = getClaimsByTreaty(selectedTreaty.id);
                    return treatyClaims.length > 0 ? (
                      <div className="space-y-3">
                        {treatyClaims.map((claim) => (
                          <div key={claim.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{claim.claimNumber}</p>
                                <p className="text-sm text-muted-foreground">Date of Loss: {claim.dateOfLoss}</p>
                                <p className="text-sm text-muted-foreground">Insured: {claim.insuredName}</p>
                                <p className="text-sm text-muted-foreground">{claim.claimDescription}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{claim.currency} {claim.claimAmount.toLocaleString()}</p>
                                <Badge variant={claim.status === 'Outstanding' ? 'destructive' : 'secondary'}>
                                  {claim.status}
                                </Badge>
                                {claim.retroRecovery && (
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    Retro Recovery: USD {claim.retroRecovery.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No claims recorded for this treaty</p>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Layer Structure (if available) */}
              {selectedTreaty.layers && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Layer Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedTreaty.layers.map((layer, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">{layer.name}</h4>
                            <Badge variant="outline">
                              {((layer.limit - layer.remainingCapacity) / layer.limit * 100).toFixed(1)}% Utilized
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Limit</p>
                              <p className="font-medium">USD {layer.limit.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Retention</p>
                              <p className="font-medium">USD {layer.retention.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Remaining</p>
                              <p className="font-medium">USD {layer.remainingCapacity.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Reinstatement</p>
                              <p className="font-medium">{layer.reinstatementRate}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreatyManagementIntegrated;