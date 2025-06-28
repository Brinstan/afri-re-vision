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
import { Search, FileText, Plus, Download, AlertTriangle, DollarSign, Calendar, Upload, Eye, Edit, CheckCircle } from "lucide-react";
import { useAuth } from './AuthContext';

const ClaimsModuleComprehensive = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("new-claim");
  const [claimType, setClaimType] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [underwritingYear, setUnderwritingYear] = useState("");
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [reserveAmount, setReserveAmount] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [searchClaimNumber, setSearchClaimNumber] = useState("");
  const [searchDateOfLoss, setSearchDateOfLoss] = useState("");

  // Generate standardized claim reference number
  const generateClaimReference = (type: string, businessClass: string) => {
    const typeMap = {
      "Motor": "MV",
      "Fire": "F", 
      "Engineering": "ENG",
      "Accident": "A",
      "Marine": "M"
    };
    
    const businessMap = {
      "XOL": "TTY",
      "Facultative": "FAC",
      "Large Risk": "POL"
    };

    const year = new Date().getFullYear();
    const sequential = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    
    return `TAN/${typeMap[type] || 'MV'}/${businessMap[businessClass] || 'TTY'}/${year}/${sequential}`;
  };

  // Sample approved claims data
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

  // Sample treaty data for auto-linking
  const treatyData = {
    "12345": {
      treatyName: "Motor Treaty 2024",
      cedant: "Century Insurance Ltd",
      participationShare: 50,
      layers: [
        { name: "Working Layer", limit: 5000000, retention: 0, reinstatementRate: 100 },
        { name: "1st Excess", limit: 10000000, retention: 5000000, reinstatementRate: 100 }
      ],
      deductible: 100000,
      retroPercentage: 25,
      broker: "AON Tanzania",
      country: "Tanzania",
      insuredName: "ABC Transport Ltd"
    },
    "12346": {
      treatyName: "Property XOL 2024",
      cedant: "National Insurance Corp",
      participationShare: 75,
      layers: [
        { name: "Working Layer", limit: 10000000, retention: 0, reinstatementRate: 100 }
      ],
      deductible: 250000,
      retroPercentage: 30,
      broker: "Marsh Tanzania",
      country: "Tanzania",
      insuredName: "XYZ Manufacturing"
    }
  };

  // Sample retro treaties data
  const retroTreaties = [
    {
      outwardPolicyNumber: "OUT-2024-001",
      underwritingYear: "2024",
      treatyName: "Cat XOL Retro Cover",
      reinsurer: "Swiss Re",
      coverage: "250M xs 50M",
      premium: 12500000,
      commission: 15.0
    },
    {
      outwardPolicyNumber: "OUT-2024-002", 
      underwritingYear: "2024",
      treatyName: "Quota Share Retro",
      reinsurer: "Munich Re",
      coverage: "25% of Portfolio",
      premium: 28750000,
      commission: 20.0
    }
  ];

  const handleClaimTypeSelection = (type: string) => {
    setClaimType(type);
    setShowClaimForm(true);
  };

  const calculateReinstatement = () => {
    if (!contractNumber || !treatyData[contractNumber] || !claimAmount) return null;

    const treaty = treatyData[contractNumber];
    const claim = parseFloat(claimAmount);
    const deductible = treaty.deductible;
    const netClaim = Math.max(0, claim - deductible);
    
    let reinstatements = [];
    let remainingClaim = netClaim;

    treaty.layers.forEach(layer => {
      if (remainingClaim > 0) {
        const layerClaim = Math.min(remainingClaim, layer.limit);
        const reinstatementAmount = (layerClaim * layer.reinstatementRate) / 100;
        
        reinstatements.push({
          layer: layer.name,
          claimAmount: layerClaim,
          reinstatementAmount: reinstatementAmount
        });
        
        remainingClaim -= layerClaim;
      }
    });

    const totalPayable = (netClaim * treaty.participationShare) / 100;
    const totalReinstatement = reinstatements.reduce((sum, r) => sum + r.reinstatementAmount, 0);
    const retroRecovery = (totalPayable * treaty.retroPercentage) / 100;

    return {
      deductible,
      netClaim,
      reinstatements,
      totalPayable,
      totalReinstatement,
      participationShare: treaty.participationShare,
      retroRecovery,
      retroPercentage: treaty.retroPercentage
    };
  };

  const calculations = calculateReinstatement();

  const handleClaimSubmission = () => {
    const claimNumber = generateClaimReference("Motor", claimType);
    alert(`Claim ${claimNumber} has been created and moved to Outstanding Claims.`);
    
    if (calculations && calculations.totalReinstatement > 0) {
      alert(`Reinstatement premium of USD ${calculations.totalReinstatement.toLocaleString()} has been automatically booked.`);
    }
  };

  const searchClaims = () => {
    return approvedClaims.filter(claim => 
      (!searchClaimNumber || claim.claimNumber.includes(searchClaimNumber)) &&
      (!searchDateOfLoss || claim.dateApproved === searchDateOfLoss)
    );
  };

  const searchRetroTreaties = (policyNumber: string, year: string) => {
    return retroTreaties.filter(treaty =>
      (!policyNumber || treaty.outwardPolicyNumber.includes(policyNumber)) &&
      (!year || treaty.underwritingYear === year)
    );
  };

  const searchInwardTreaties = (contractNum: string, year: string) => {
    return Object.entries(treatyData).filter(([key, treaty]) =>
      (!contractNum || key.includes(contractNum)) &&
      (!year || key.includes(year))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comprehensive Claims Management</h2>
          <p className="text-gray-600">Advanced claims processing with standardized numbering and accounting integration</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="new-claim">New Claim</TabsTrigger>
          <TabsTrigger value="approved-claims">Approved Claims</TabsTrigger>
          <TabsTrigger value="accounting">Accounting</TabsTrigger>
          <TabsTrigger value="inward-claims">Inward Claims</TabsTrigger>
          <TabsTrigger value="outstanding-claims">Outstanding Claims</TabsTrigger>
          <TabsTrigger value="retro-section">Retro Section</TabsTrigger>
        </TabsList>

        <TabsContent value="new-claim" className="space-y-4">
          {!showClaimForm ? (
            <Card>
              <CardHeader>
                <CardTitle>Select Claim Type</CardTitle>
                <CardDescription>Choose the type of claim to process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => handleClaimTypeSelection("XOL")}
                  >
                    <AlertTriangle className="h-8 w-8 mb-2" />
                    <span>XOL Claims</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => handleClaimTypeSelection("Facultative")}
                  >
                    <FileText className="h-8 w-8 mb-2" />
                    <span>Facultative</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center"
                    onClick={() => handleClaimTypeSelection("Large Risk")}
                  >
                    <DollarSign className="h-8 w-8 mb-2" />
                    <span>Large Risk</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{claimType} Claim Form</CardTitle>
                  <CardDescription>Enter claim details for processing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contractNumber">Contract Number (Numeric Only)</Label>
                      <Input
                        id="contractNumber"
                        value={contractNumber}
                        onChange={(e) => setContractNumber(e.target.value.replace(/\D/g, ''))}
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

                  {contractNumber && treatyData[contractNumber] && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900">Auto-Linked Treaty Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 mt-2">
                        <div>
                          <p><strong>Treaty:</strong> {treatyData[contractNumber].treatyName}</p>
                          <p><strong>Cedant:</strong> {treatyData[contractNumber].cedant}</p>
                          <p><strong>Participation:</strong> {treatyData[contractNumber].participationShare}%</p>
                        </div>
                        <div>
                          <p><strong>Broker:</strong> {treatyData[contractNumber].broker}</p>
                          <p><strong>Country:</strong> {treatyData[contractNumber].country}</p>
                          <p><strong>Retro Coverage:</strong> {treatyData[contractNumber].retroPercentage}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="insuredName">Insured Name</Label>
                      <Input
                        id="insuredName"
                        value={contractNumber && treatyData[contractNumber] ? treatyData[contractNumber].insuredName : ""}
                        placeholder="Auto-populated from treaty"
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referenceNumber">Claim Reference Number</Label>
                      <Input
                        id="referenceNumber"
                        value={generateClaimReference("Motor", claimType)}
                        disabled
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfLoss">Date of Loss</Label>
                      <Input
                        id="dateOfLoss"
                        type="date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="policyPeriodFrom">Policy Period From</Label>
                      <Input
                        id="policyPeriodFrom"
                        type="date"
                        value="2024-01-01"
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="policyPeriodTo">Policy Period To</Label>
                      <Input
                        id="policyPeriodTo"
                        type="date"
                        value="2024-12-31"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateReported">Date Reported</Label>
                      <Input
                        id="dateReported"
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="treatyName">Treaty Name</Label>
                      <Input
                        id="treatyName"
                        value={contractNumber && treatyData[contractNumber] ? treatyData[contractNumber].treatyName : ""}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reserveAmount">Reserve Amount</Label>
                      <Input
                        id="reserveAmount"
                        type="number"
                        value={reserveAmount}
                        onChange={(e) => setReserveAmount(e.target.value)}
                        placeholder="0.00"
                      />
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
                    <Label htmlFor="claimAmount">Claim Amount (for payment)</Label>
                    <Input
                      id="claimAmount"
                      type="number"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  {claimType === "XOL" && calculations && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <h4 className="font-medium text-gray-900">Automatic Claim Calculations</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p>Deductible: <span className="font-bold">{currency} {calculations.deductible.toLocaleString()}</span></p>
                          <p>Net Claim: <span className="font-bold">{currency} {calculations.netClaim.toLocaleString()}</span></p>
                          <p>Participation Share: <span className="font-bold">{calculations.participationShare}%</span></p>
                        </div>
                        <div>
                          <p>Total Payable: <span className="font-bold text-green-600">{currency} {calculations.totalPayable.toLocaleString()}</span></p>
                          <p>Total Reinstatement: <span className="font-bold text-blue-600">{currency} {calculations.totalReinstatement.toLocaleString()}</span></p>
                        </div>
                        <div>
                          <p>Retro Recovery: <span className="font-bold text-purple-600">{currency} {calculations.retroRecovery.toLocaleString()}</span></p>
                          <p>Retro Percentage: <span className="font-bold">{calculations.retroPercentage}%</span></p>
                        </div>
                      </div>

                      {calculations.reinstatements.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Reinstatement by Layer:</h5>
                          {calculations.reinstatements.map((r, index) => (
                            <p key={index} className="text-sm">
                              {r.layer}: {currency} {r.reinstatementAmount.toLocaleString()}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="claimDescription">Claim Description</Label>
                    <Textarea
                      id="claimDescription"
                      placeholder="Enter claim details..."
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleClaimSubmission}>
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Claim
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Claim Advice
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Payment Voucher
                    </Button>
                    <Button variant="outline" onClick={() => setShowClaimForm(false)}>
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved-claims" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Claims Awaiting Payment</CardTitle>
              <CardDescription>Claims approved for payment with document management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim Reference</TableHead>
                      <TableHead>Contract Number</TableHead>
                      <TableHead>Insured Name</TableHead>
                      <TableHead>Claim Amount</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedClaims.map((claim) => (
                      <TableRow key={claim.claimNumber}>
                        <TableCell className="font-mono text-sm">{claim.claimNumber}</TableCell>
                        <TableCell>{claim.contractNumber}</TableCell>
                        <TableCell>{claim.insuredName}</TableCell>
                        <TableCell>{claim.currency} {claim.claimAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={claim.status === 'No Payment Made' ? 'destructive' : 'default'}>
                            {claim.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              <Upload className="h-3 w-3 mr-1" />
                              Upload
                            </Button>
                            {claim.claimAdvice && (
                              <Button size="sm" variant="outline">
                                <Download className="h-3 w-3 mr-1" />
                                Advice
                              </Button>
                            )}
                            {claim.paymentVoucher && (
                              <Button size="sm" variant="outline">
                                <Download className="h-3 w-3 mr-1" />
                                Voucher
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Process
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

        <TabsContent value="accounting" className="space-y-4">
          {user?.userType === 'Finance' ? (
            <Tabs defaultValue="manage-claims" className="space-y-4">
              <TabsList>
                <TabsTrigger value="manage-claims">Manage Claims</TabsTrigger>
                <TabsTrigger value="commissions">Commissions</TabsTrigger>
                <TabsTrigger value="receivables">Receivables</TabsTrigger>
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
                    <p className="text-gray-600">Commission management interface for finance team...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="receivables" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Receivables Management</CardTitle>
                    <CardDescription>Track and manage outstanding receivables</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Receivables tracking interface for finance team...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Access Restricted</CardTitle>
                <CardDescription>This section is only available to Finance users</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Please contact your system administrator for access to accounting features.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inward-claims" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inward Claims Display</CardTitle>
              <CardDescription>Search and view existing claims</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="searchClaimNumber">Claim Number</Label>
                  <Input
                    id="searchClaimNumber"
                    value={searchClaimNumber}
                    onChange={(e) => setSearchClaimNumber(e.target.value)}
                    placeholder="e.g., TAN/MV/TTY/2024/0001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="searchDateOfLoss">Date of Loss</Label>
                  <Input
                    id="searchDateOfLoss"
                    type="date"
                    value={searchDateOfLoss}
                    onChange={(e) => setSearchDateOfLoss(e.target.value)}
                  />
                </div>
              </div>

              <Button>
                <Search className="h-4 w-4 mr-2" />
                Search Claims
              </Button>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim Reference</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Insured</TableHead>
                      <TableHead>Date Approved</TableHead>
                      <TableHead>Claim Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchClaims().map((claim) => (
                      <TableRow key={claim.claimNumber}>
                        <TableCell className="font-mono text-sm">{claim.claimNumber}</TableCell>
                        <TableCell>{claim.contractNumber}</TableCell>
                        <TableCell>{claim.insuredName}</TableCell>
                        <TableCell>{claim.dateApproved}</TableCell>
                        <TableCell>{claim.currency} {claim.claimAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={claim.status === 'No Payment Made' ? 'destructive' : 'secondary'}>
                            {claim.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding-claims" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Claims</CardTitle>
              <CardDescription>Manage and process outstanding claims with retro recovery information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="outstandingSearch">Search by Claim Number</Label>
                <div className="flex space-x-2">
                  <Input
                    id="outstandingSearch"
                    placeholder="Enter claim reference number"
                  />
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim Reference</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Insured</TableHead>
                      <TableHead>Reserve Amount</TableHead>
                      <TableHead>Expected Retro Recovery</TableHead>
                      <TableHead>Net Exposure</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedClaims.filter(claim => claim.status !== 'Full Payment').map((claim) => {
                      const retroRecovery = Math.round(claim.claimAmount * 0.25);
                      const netExposure = claim.claimAmount - retroRecovery;
                      
                      return (
                        <TableRow key={claim.claimNumber}>
                          <TableCell className="font-mono text-sm">{claim.claimNumber}</TableCell>
                          <TableCell>{claim.contractNumber}</TableCell>
                          <TableCell>{claim.insuredName}</TableCell>
                          <TableCell>{claim.currency} {claim.claimAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className="text-green-600 font-medium">
                              {claim.currency} {retroRecovery.toLocaleString()}
                            </span>
                            <p className="text-xs text-gray-500">25% retro coverage</p>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {claim.currency} {netExposure.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">Outstanding</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm">
                                <DollarSign className="h-3 w-3 mr-1" />
                                Pay
                              </Button>
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

        <TabsContent value="retro-section" className="space-y-4">
          <Tabs defaultValue="new-outward" className="space-y-4">
            <TabsList>
              <TabsTrigger value="new-outward">New Outward</TabsTrigger>
              <TabsTrigger value="outward-display">Outward Policy Display</TabsTrigger>
              <TabsTrigger value="inward-display">Inward Treaty Display</TabsTrigger>
            </TabsList>

            <TabsContent value="new-outward" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>New Outward Retrocession</CardTitle>
                  <CardDescription>Create new outward retrocession arrangements</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Existing outward retrocession functionality...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outward-display" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Outward Policy Display</CardTitle>
                  <CardDescription>Search and view all retrocession cession treaties</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="outwardPolicyNumber">Outward Policy Number</Label>
                      <Input
                        id="outwardPolicyNumber"
                        placeholder="e.g., OUT-2024-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="outwardYear">Underwriting Year</Label>
                      <Input
                        id="outwardYear"
                        placeholder="e.g., 2024"
                      />
                    </div>
                  </div>

                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Search Retro Treaties
                  </Button>

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Policy Number</TableHead>
                          <TableHead>Treaty Name</TableHead>
                          <TableHead>Reinsurer</TableHead>
                          <TableHead>Coverage</TableHead>
                          <TableHead>Premium</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {retroTreaties.map((treaty) => (
                          <TableRow key={treaty.outwardPolicyNumber}>
                            <TableCell className="font-medium">{treaty.outwardPolicyNumber}</TableCell>
                            <TableCell>{treaty.treatyName}</TableCell>
                            <TableCell>{treaty.reinsurer}</TableCell>
                            <TableCell>{treaty.coverage}</TableCell>
                            <TableCell>USD {treaty.premium.toLocaleString()}</TableCell>
                            <TableCell>{treaty.commission}%</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inward-display" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Inward Treaty Display (Treaty Search)</CardTitle>
                  <CardDescription>Search inward treaties with comprehensive details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inwardContract">Contract Number</Label>
                      <Input
                        id="inwardContract"
                        placeholder="e.g., 12345"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inwardYear">Underwriting Year (Optional)</Label>
                      <Input
                        id="inwardYear"
                        placeholder="e.g., 2024"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    <Button variant="outline">
                      <Search className="h-4 w-4 mr-2" />
                      Advanced Query
                    </Button>
                  </div>

                  {/* Advanced Query Fields */}
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Advanced Search Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="brokerName">Broker Name</Label>
                          <Input
                            id="brokerName"
                            placeholder="e.g., AON Tanzania"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cedantName">Cedant Name</Label>
                          <Input
                            id="cedantName"
                            placeholder="e.g., Century Insurance"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Tanzania">Tanzania</SelectItem>
                              <SelectItem value="Kenya">Kenya</SelectItem>
                              <SelectItem value="Uganda">Uganda</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="insuredNameSearch">Insured Name</Label>
                          <Input
                            id="insuredNameSearch"
                            placeholder="e.g., ABC Transport"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Search Results */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contract</TableHead>
                          <TableHead>Treaty Name</TableHead>
                          <TableHead>Cedant</TableHead>
                          <TableHead>Broker</TableHead>
                          <TableHead>Retro %</TableHead>
                          <TableHead>Claims Paid</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(treatyData).map(([contractNum, treaty]) => (
                          <TableRow key={contractNum}>
                            <TableCell className="font-medium">{contractNum}</TableCell>
                            <TableCell>{treaty.treatyName}</TableCell>
                            <TableCell>{treaty.cedant}</TableCell>
                            <TableCell>{treaty.broker}</TableCell>
                            <TableCell>{treaty.retroPercentage}%</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">USD 2.5M</p>
                                <p className="text-xs text-gray-500">3 claims total</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button size="sm" variant="outline">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Details
                                </Button>
                                <Button size="sm" variant="outline">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Claims
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
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClaimsModuleComprehensive;