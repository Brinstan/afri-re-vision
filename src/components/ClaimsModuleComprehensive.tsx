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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { Search, FileText, Plus, Download, AlertTriangle, DollarSign, Calendar, Upload, Eye, Edit, Save, X, CheckCircle } from "lucide-react";

const ClaimsModuleComprehensive = () => {
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
  
  // Edit claim states
  const [editingClaim, setEditingClaim] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  // Sample approved claims data with editable fields
  const [approvedClaims, setApprovedClaims] = useState([
    {
      id: 1,
      claimNumber: "TAN/MV/TTY/2024/0001",
      contractNumber: "12345",
      insuredName: "ABC Transport Ltd",
      claimAmount: 2500000,
      currency: "USD",
      status: "No Payment Made",
      dateApproved: "2024-12-15",
      dateOfLoss: "2024-11-15",
      claimDescription: "Vehicle collision resulting in total loss",
      reserveAmount: 2500000,
      claimAdvice: null,
      paymentVoucher: null
    },
    {
      id: 2,
      claimNumber: "TAN/F/FAC/2024/0002", 
      contractNumber: "12346",
      insuredName: "XYZ Manufacturing",
      claimAmount: 1800000,
      currency: "USD",
      status: "Partial Payment",
      dateApproved: "2024-12-10",
      dateOfLoss: "2024-10-08",
      claimDescription: "Fire damage to manufacturing equipment",
      reserveAmount: 1800000,
      claimAdvice: "claim_advice_002.pdf",
      paymentVoucher: "payment_voucher_002.pdf"
    }
  ]);

  // Enhanced treaty data with detailed layer structure for XOL calculations
  const treatyData = {
    "12345": {
      treatyName: "Motor Treaty 2024",
      cedant: "Century Insurance Ltd",
      participationShare: 50,
      layers: [
        { 
          name: "Working Layer", 
          limit: 5000000, 
          retention: 0, 
          reinstatementRate: 100,
          deductible: 100000,
          remainingCapacity: 5000000
        },
        { 
          name: "1st Excess", 
          limit: 10000000, 
          retention: 5000000, 
          reinstatementRate: 100,
          deductible: 0,
          remainingCapacity: 10000000
        },
        { 
          name: "2nd Excess", 
          limit: 15000000, 
          retention: 15000000, 
          reinstatementRate: 75,
          deductible: 0,
          remainingCapacity: 15000000
        }
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
        { 
          name: "Working Layer", 
          limit: 10000000, 
          retention: 0, 
          reinstatementRate: 100,
          deductible: 250000,
          remainingCapacity: 10000000
        },
        { 
          name: "Cat Layer", 
          limit: 25000000, 
          retention: 10000000, 
          reinstatementRate: 50,
          deductible: 0,
          remainingCapacity: 25000000
        }
      ],
      deductible: 250000,
      retroPercentage: 30,
      broker: "Marsh Tanzania",
      country: "Tanzania",
      insuredName: "XYZ Manufacturing"
    }
  };

  const handleClaimTypeSelection = (type: string) => {
    setClaimType(type);
    setShowClaimForm(true);
  };

  // Enhanced XOL calculation with detailed layer breakdown
  const calculateXOLLayerDistribution = () => {
    if (!contractNumber || !treatyData[contractNumber] || !claimAmount) return null;

    const treaty = treatyData[contractNumber];
    const totalClaim = parseFloat(claimAmount);
    const overallDeductible = treaty.deductible;
    const netClaimAfterDeductible = Math.max(0, totalClaim - overallDeductible);
    
    let layerDistribution = [];
    let remainingClaim = netClaimAfterDeductible;
    let totalReinstatement = 0;
    let totalPayable = 0;

    // Process each layer
    treaty.layers.forEach((layer, index) => {
      if (remainingClaim > 0) {
        // Calculate claim amount hitting this layer
        const layerClaimGross = Math.min(remainingClaim, layer.limit);
        const layerDeductible = layer.deductible || 0;
        const layerClaimNet = Math.max(0, layerClaimGross - layerDeductible);
        
        // Calculate reinstatement premium for this layer
        const layerReinstatement = (layerClaimNet * layer.reinstatementRate) / 100;
        
        // Calculate payable amount for this layer
        const layerPayable = (layerClaimNet * treaty.participationShare) / 100;
        
        // Calculate remaining capacity after this claim
        const newRemainingCapacity = Math.max(0, layer.remainingCapacity - layerClaimNet);
        
        layerDistribution.push({
          layerName: layer.name,
          layerLimit: layer.limit,
          layerRetention: layer.retention,
          layerDeductible: layerDeductible,
          claimAmountGross: layerClaimGross,
          claimAmountNet: layerClaimNet,
          reinstatementRate: layer.reinstatementRate,
          reinstatementPremium: layerReinstatement,
          payableAmount: layerPayable,
          remainingCapacityBefore: layer.remainingCapacity,
          remainingCapacityAfter: newRemainingCapacity,
          utilizationPercentage: layer.remainingCapacity > 0 ? (layerClaimNet / layer.remainingCapacity) * 100 : 0
        });
        
        totalReinstatement += layerReinstatement;
        totalPayable += layerPayable;
        remainingClaim -= layerClaimGross;
      }
    });

    const retroRecovery = (totalPayable * treaty.retroPercentage) / 100;
    const netExposure = totalPayable - retroRecovery;

    return {
      totalClaim,
      overallDeductible,
      netClaimAfterDeductible,
      layerDistribution,
      totalReinstatement,
      totalPayable,
      retroRecovery,
      netExposure,
      participationShare: treaty.participationShare,
      retroPercentage: treaty.retroPercentage,
      treatyName: treaty.treatyName
    };
  };

  const calculations = calculateXOLLayerDistribution();

  const handleClaimSubmission = () => {
    const claimNumber = generateClaimReference("Motor", claimType);
    
    // Add to approved claims
    const newClaim = {
      id: Date.now(),
      claimNumber,
      contractNumber,
      insuredName: treatyData[contractNumber]?.insuredName || "Unknown",
      claimAmount: parseFloat(claimAmount),
      currency,
      status: "No Payment Made",
      dateApproved: new Date().toISOString().split('T')[0],
      dateOfLoss: new Date().toISOString().split('T')[0],
      claimDescription: "New claim submission",
      reserveAmount: parseFloat(reserveAmount),
      claimAdvice: null,
      paymentVoucher: null
    };

    setApprovedClaims(prev => [...prev, newClaim]);
    
    toast.success(`Claim ${claimNumber} has been created and moved to Outstanding Claims.`);
    
    if (calculations && calculations.totalReinstatement > 0) {
      toast.info(`Reinstatement premium of USD ${calculations.totalReinstatement.toLocaleString()} has been automatically booked.`);
    }

    // Reset form
    setShowClaimForm(false);
    setClaimAmount("");
    setReserveAmount("");
    setContractNumber("");
  };

  // Edit claim functionality
  const handleEditClaim = (claim) => {
    setEditingClaim(claim);
    setEditFormData({
      claimAmount: claim.claimAmount,
      reserveAmount: claim.reserveAmount,
      status: claim.status,
      claimDescription: claim.claimDescription,
      dateOfLoss: claim.dateOfLoss,
      insuredName: claim.insuredName
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingClaim) return;

    // Validation
    if (!editFormData.claimAmount || !editFormData.reserveAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Update the claim
    setApprovedClaims(prev => 
      prev.map(claim => 
        claim.id === editingClaim.id 
          ? { ...claim, ...editFormData, claimAmount: parseFloat(editFormData.claimAmount), reserveAmount: parseFloat(editFormData.reserveAmount) }
          : claim
      )
    );

    toast.success("Claim updated successfully");
    setIsEditDialogOpen(false);
    setEditingClaim(null);
    setEditFormData({});
  };

  const searchClaims = () => {
    return approvedClaims.filter(claim => 
      (!searchClaimNumber || claim.claimNumber.includes(searchClaimNumber)) &&
      (!searchDateOfLoss || claim.dateOfLoss === searchDateOfLoss)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comprehensive Claims Management</h2>
          <p className="text-gray-600">Advanced claims processing with layer-wise XOL calculations</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="new-claim">New Claim</TabsTrigger>
          <TabsTrigger value="approved-claims">Approved Claims</TabsTrigger>
          <TabsTrigger value="inward-claims">Inward Claims</TabsTrigger>
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
                    <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                      <h4 className="font-medium text-gray-900 text-lg">Detailed XOL Claim Calculations</h4>
                      
                      {/* Summary Section */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded border">
                        <div>
                          <p className="text-sm text-gray-600">Total Claim</p>
                          <p className="font-bold text-lg">{currency} {calculations.totalClaim.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Overall Deductible</p>
                          <p className="font-bold text-lg text-red-600">{currency} {calculations.overallDeductible.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Net After Deductible</p>
                          <p className="font-bold text-lg">{currency} {calculations.netClaimAfterDeductible.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Payable</p>
                          <p className="font-bold text-lg text-green-600">{currency} {calculations.totalPayable.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Layer-wise Breakdown */}
                      <div>
                        <h5 className="font-medium mb-3">Layer-wise Claim Distribution</h5>
                        <div className="space-y-3">
                          {calculations.layerDistribution.map((layer, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-white">
                              <div className="flex justify-between items-center mb-3">
                                <h6 className="font-medium text-blue-900">{layer.layerName}</h6>
                                <Badge variant="outline">
                                  {layer.utilizationPercentage.toFixed(1)}% Utilized
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <p className="text-gray-600">Layer Limit</p>
                                  <p className="font-medium">{currency} {layer.layerLimit.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Claim Amount</p>
                                  <p className="font-medium">{currency} {layer.claimAmountNet.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Reinstatement ({layer.reinstatementRate}%)</p>
                                  <p className="font-medium text-blue-600">{currency} {layer.reinstatementPremium.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Payable Amount</p>
                                  <p className="font-medium text-green-600">{currency} {layer.payableAmount.toLocaleString()}</p>
                                </div>
                              </div>

                              <div className="mt-3 pt-3 border-t">
                                <div className="flex justify-between text-sm">
                                  <span>Remaining Capacity:</span>
                                  <span className="font-medium">
                                    {currency} {layer.remainingCapacityAfter.toLocaleString()} 
                                    <span className="text-gray-500 ml-1">
                                      (was {layer.remainingCapacityBefore.toLocaleString()})
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded">
                        <div>
                          <p className="text-sm text-blue-600">Total Reinstatement Premium</p>
                          <p className="font-bold text-xl text-blue-900">{currency} {calculations.totalReinstatement.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-purple-600">Expected Retro Recovery ({calculations.retroPercentage}%)</p>
                          <p className="font-bold text-xl text-purple-900">{currency} {calculations.retroRecovery.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-orange-600">Net Exposure</p>
                          <p className="font-bold text-xl text-orange-900">{currency} {calculations.netExposure.toLocaleString()}</p>
                        </div>
                      </div>
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
                      <TableRow key={claim.id}>
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
                            <Button size="sm" onClick={() => handleEditClaim(claim)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
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
                      <TableRow key={claim.id}>
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
              <CardDescription>Manage and process outstanding claims with edit functionality</CardDescription>
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
                        <TableRow key={claim.id}>
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
                              <Button size="sm" variant="outline" onClick={() => handleEditClaim(claim)}>
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
      </Tabs>

      {/* Edit Claim Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Claim Details</DialogTitle>
            <DialogDescription>
              Modify claim information for {editingClaim?.claimNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editClaimAmount">Claim Amount *</Label>
                <Input
                  id="editClaimAmount"
                  type="number"
                  value={editFormData.claimAmount || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, claimAmount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editReserveAmount">Reserve Amount *</Label>
                <Input
                  id="editReserveAmount"
                  type="number"
                  value={editFormData.reserveAmount || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, reserveAmount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStatus">Payment Status</Label>
                <Select 
                  value={editFormData.status || ''} 
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No Payment Made">No Payment Made</SelectItem>
                    <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                    <SelectItem value="Full Payment">Full Payment</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDateOfLoss">Date of Loss</Label>
                <Input
                  id="editDateOfLoss"
                  type="date"
                  value={editFormData.dateOfLoss || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, dateOfLoss: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editInsuredName">Insured Name</Label>
              <Input
                id="editInsuredName"
                value={editFormData.insuredName || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, insuredName: e.target.value }))}
                placeholder="Enter insured name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDescription">Claim Description</Label>
              <Textarea
                id="editDescription"
                value={editFormData.claimDescription || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, claimDescription: e.target.value }))}
                placeholder="Enter claim description..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
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

export default ClaimsModuleComprehensive;