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
import { Search, FileText, Plus, Download, AlertTriangle, DollarSign, Calendar } from "lucide-react";

const ClaimsModuleNew = () => {
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

  // Sample treaty data for auto-linking
  const treatyData = {
    "MT-2024-001": {
      treatyName: "Motor Treaty 2024",
      cedant: "Century Insurance Ltd",
      participationShare: 50,
      layers: [
        { name: "Working Layer", limit: 5000000, retention: 0, reinstatementRate: 100 },
        { name: "1st Excess", limit: 10000000, retention: 5000000, reinstatementRate: 100 }
      ],
      deductible: 100000
    }
  };

  // Sample claims data
  const claimsData = [
    {
      claimNumber: "CLM-2024-0001",
      contractNumber: "MT-2024-001",
      insuredName: "ABC Transport Ltd",
      dateOfLoss: "2024-11-15",
      dateReported: "2024-11-18",
      reserveAmount: 2500000,
      paidAmount: 0,
      status: "Outstanding",
      currency: "USD"
    },
    {
      claimNumber: "CLM-2024-0002",
      contractNumber: "PT-2024-002",
      insuredName: "XYZ Manufacturing",
      dateOfLoss: "2024-10-22",
      dateReported: "2024-10-25",
      reserveAmount: 1800000,
      paidAmount: 1800000,
      status: "Settled",
      currency: "USD"
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

    return {
      deductible,
      netClaim,
      reinstatements,
      totalPayable,
      totalReinstatement,
      participationShare: treaty.participationShare
    };
  };

  const calculations = calculateReinstatement();

  const generateClaimNumber = () => {
    return `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
  };

  const handleClaimSubmission = () => {
    const claimNumber = generateClaimNumber();
    alert(`Claim ${claimNumber} has been created and moved to Outstanding Claims.`);
    
    if (calculations && calculations.totalReinstatement > 0) {
      alert(`Reinstatement premium of USD ${calculations.totalReinstatement.toLocaleString()} has been automatically booked.`);
    }
  };

  const searchClaims = () => {
    return claimsData.filter(claim => 
      (!searchClaimNumber || claim.claimNumber.includes(searchClaimNumber)) &&
      (!searchDateOfLoss || claim.dateOfLoss === searchDateOfLoss)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Claims Management</h2>
          <p className="text-gray-600">Comprehensive claims processing and management</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="new-claim">New Claim</TabsTrigger>
          <TabsTrigger value="inward-claims">Inward Claims Display</TabsTrigger>
          <TabsTrigger value="outstanding-claims">Outstanding Claims</TabsTrigger>
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
                      <Label htmlFor="contractNumber">Contract Number</Label>
                      <Input
                        id="contractNumber"
                        value={contractNumber}
                        onChange={(e) => setContractNumber(e.target.value)}
                        placeholder="e.g., MT-2024-001"
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
                      <h4 className="font-medium text-blue-900">Treaty Information</h4>
                      <p className="text-sm text-blue-800">
                        Treaty: {treatyData[contractNumber].treatyName}<br/>
                        Cedant: {treatyData[contractNumber].cedant}<br/>
                        Participation: {treatyData[contractNumber].participationShare}%
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="insuredName">Insured Name</Label>
                      <Input
                        id="insuredName"
                        placeholder="Enter insured name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referenceNumber">Reference Number</Label>
                      <Input
                        id="referenceNumber"
                        value={generateClaimNumber()}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfLoss">Date of Loss</Label>
                      <Input
                        id="dateOfLoss"
                        type="date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateReported">Date Reported</Label>
                      <Input
                        id="dateReported"
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
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
                      <h4 className="font-medium text-gray-900">Claim Calculations</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>Deductible: <span className="font-bold">{currency} {calculations.deductible.toLocaleString()}</span></p>
                          <p>Net Claim: <span className="font-bold">{currency} {calculations.netClaim.toLocaleString()}</span></p>
                          <p>Participation Share: <span className="font-bold">{calculations.participationShare}%</span></p>
                        </div>
                        <div>
                          <p>Total Payable: <span className="font-bold text-green-600">{currency} {calculations.totalPayable.toLocaleString()}</span></p>
                          <p>Total Reinstatement: <span className="font-bold text-blue-600">{currency} {calculations.totalReinstatement.toLocaleString()}</span></p>
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
                    placeholder="e.g., CLM-2024-0001"
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
                      <TableHead>Claim Number</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Insured</TableHead>
                      <TableHead>Date of Loss</TableHead>
                      <TableHead>Reserve Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchClaims().map((claim) => (
                      <TableRow key={claim.claimNumber}>
                        <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                        <TableCell>{claim.contractNumber}</TableCell>
                        <TableCell>{claim.insuredName}</TableCell>
                        <TableCell>{claim.dateOfLoss}</TableCell>
                        <TableCell>{claim.currency} {claim.reserveAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={claim.status === 'Outstanding' ? 'destructive' : 'secondary'}>
                            {claim.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">View</Button>
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
              <CardDescription>Manage and process outstanding claims</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="outstandingSearch">Search by Claim Number</Label>
                <div className="flex space-x-2">
                  <Input
                    id="outstandingSearch"
                    placeholder="Enter claim number"
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
                      <TableHead>Claim Number</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Insured</TableHead>
                      <TableHead>Reserve Amount</TableHead>
                      <TableHead>Retro Recovery</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claimsData.filter(claim => claim.status === 'Outstanding').map((claim) => (
                      <TableRow key={claim.claimNumber}>
                        <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                        <TableCell>{claim.contractNumber}</TableCell>
                        <TableCell>{claim.insuredName}</TableCell>
                        <TableCell>{claim.currency} {claim.reserveAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">
                            USD {Math.round(claim.reserveAmount * 0.25).toLocaleString()}
                          </span>
                          <p className="text-xs text-gray-500">Expected from retro</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{claim.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">Edit</Button>
                            <Button size="sm">Pay</Button>
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
    </div>
  );
};

export default ClaimsModuleNew;