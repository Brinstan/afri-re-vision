import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useAuth } from './AuthContext';
import { 
  Search, FileText, Plus, Download, AlertTriangle, DollarSign, Calendar, 
  Upload, Eye, Edit, Calculator, Bell, Shield, Lock, CheckCircle, 
  RotateCcw, Save, Users, Building
} from "lucide-react";

const ClaimsSystemComprehensive = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("claims-entry");
  const [sysNumber, setSysNumber] = useState("");
  const [claimType, setClaimType] = useState("");
  const [businessClass, setBusinessClass] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [underwritingYear, setUnderwritingYear] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [showXOLCalculator, setShowXOLCalculator] = useState(false);
  const [editingClaim, setEditingClaim] = useState(null);
  const [editReason, setEditReason] = useState("");

  // Auto-increment SYS Number system
  const generateSysNumber = () => {
    const lastSysNumber = localStorage.getItem('lastSysNumber') || '0000';
    const nextNumber = (parseInt(lastSysNumber) + 1).toString().padStart(4, '0');
    localStorage.setItem('lastSysNumber', nextNumber);
    return nextNumber;
  };

  // Generate standardized claim reference
  const generateClaimReference = (type, businessClass) => {
    const typeMap = {
      "Motor": "MV",
      "Fire": "F", 
      "Engineering": "ENG",
      "Accident": "A",
      "Marine": "M"
    };
    
    const businessMap = {
      "Treaty": "TTY",
      "Facultative": "FAC",
      "Policy": "POL"
    };

    const year = new Date().getFullYear();
    const sequential = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
    
    return `TAN/${typeMap[type] || 'MV'}/${businessMap[businessClass] || 'TTY'}/${year}/${sequential}`;
  };

  // Sample claims database with SYS Numbers
  const [claimsDatabase, setClaimsDatabase] = useState([
    {
      sysNumber: "0001",
      claimReference: "TAN/MV/TTY/2024/0001",
      contractNumber: "12345",
      policyNumber: "POL-2024-001",
      insuredName: "ABC Transport Ltd",
      claimAmount: 2500000,
      currency: "USD",
      status: "Outstanding",
      dateCreated: "2024-12-15",
      lastModified: "2024-12-15",
      modifiedBy: "system",
      version: 1,
      auditTrail: [
        { action: "Created", user: "system", timestamp: "2024-12-15 10:30:00", reason: "Initial claim entry" }
      ]
    },
    {
      sysNumber: "0002",
      claimReference: "TAN/F/FAC/2024/0002",
      contractNumber: "12346",
      policyNumber: "POL-2024-002",
      insuredName: "XYZ Manufacturing",
      claimAmount: 1800000,
      currency: "USD",
      status: "Approved",
      dateCreated: "2024-12-10",
      lastModified: "2024-12-12",
      modifiedBy: "john.doe",
      version: 2,
      auditTrail: [
        { action: "Created", user: "system", timestamp: "2024-12-10 14:20:00", reason: "Initial claim entry" },
        { action: "Approved", user: "john.doe", timestamp: "2024-12-12 09:15:00", reason: "Documentation verified" }
      ]
    }
  ]);

  // Premium tracking for Finance Team
  const [premiumTracking, setPremiumTracking] = useState([
    {
      id: "PREM-001",
      source: "Underwriting",
      amount: 5000000,
      currency: "USD",
      status: "Pending",
      lastModified: "2024-12-15 10:30:00",
      commission: 1250000
    },
    {
      id: "PREM-002", 
      source: "Claims",
      amount: 3200000,
      currency: "USD",
      status: "Part Paid",
      lastModified: "2024-12-14 16:45:00",
      commission: 800000
    }
  ]);

  // XOL Layer structure for calculations
  const xolLayers = [
    { name: "Working Layer", limit: 5000000, retention: 0, reinstatementRate: 100 },
    { name: "1st Excess", limit: 10000000, retention: 5000000, reinstatementRate: 100 },
    { name: "2nd Excess", limit: 15000000, retention: 15000000, reinstatementRate: 75 },
    { name: "Cat Cover", limit: 50000000, retention: 30000000, reinstatementRate: 50 }
  ];

  // XOL Claims Calculator
  const calculateXOLClaim = () => {
    if (!policyNumber || !underwritingYear || !claimAmount) return null;

    const claim = parseFloat(claimAmount);
    let calculations = [];
    let remainingClaim = claim;
    let totalReinstatement = 0;

    xolLayers.forEach(layer => {
      if (remainingClaim > layer.retention) {
        const layerClaim = Math.min(remainingClaim - layer.retention, layer.limit);
        const deductible = layer.retention;
        const reinstatementPremium = (layerClaim * layer.reinstatementRate) / 100;
        
        calculations.push({
          layer: layer.name,
          limit: layer.limit,
          retention: layer.retention,
          claimAmount: layerClaim,
          deductible: deductible,
          reinstatementPremium: reinstatementPremium,
          netPayable: layerClaim
        });

        totalReinstatement += reinstatementPremium;
        remainingClaim -= layerClaim;
      }
    });

    return {
      layers: calculations,
      totalClaim: claim,
      totalReinstatement: totalReinstatement,
      totalPayable: calculations.reduce((sum, layer) => sum + layer.netPayable, 0)
    };
  };

  const xolCalculations = calculateXOLClaim();

  // Handle claim submission with auto-booking
  const handleClaimSubmission = () => {
    const newSysNumber = generateSysNumber();
    const claimRef = generateClaimReference(claimType, businessClass);
    
    const newClaim = {
      sysNumber: newSysNumber,
      claimReference: claimRef,
      contractNumber,
      policyNumber,
      insuredName: "Auto-populated",
      claimAmount: parseFloat(claimAmount),
      currency,
      status: "Outstanding",
      dateCreated: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString(),
      modifiedBy: user?.username || "system",
      version: 1,
      auditTrail: [
        { 
          action: "Created", 
          user: user?.username || "system", 
          timestamp: new Date().toISOString(), 
          reason: "Initial claim entry" 
        }
      ]
    };

    setClaimsDatabase([...claimsDatabase, newClaim]);
    setSysNumber(newSysNumber);

    // Auto-book reinstatement premium if XOL claim
    if (showXOLCalculator && xolCalculations && xolCalculations.totalReinstatement > 0) {
      alert(`Claim ${claimRef} created with SYS Number ${newSysNumber}.\nReinstatement premium of ${currency} ${xolCalculations.totalReinstatement.toLocaleString()} has been automatically booked.\nNotifications sent to Underwriting and Finance teams.`);
    } else {
      alert(`Claim ${claimRef} created with SYS Number ${newSysNumber}.`);
    }

    // Reset form
    setContractNumber("");
    setPolicyNumber("");
    setClaimAmount("");
    setShowXOLCalculator(false);
  };

  // Handle claim editing with version control
  const handleClaimEdit = (claim) => {
    if (!editReason.trim()) {
      alert("Please provide a reason for editing this claim.");
      return;
    }

    const updatedClaim = {
      ...claim,
      lastModified: new Date().toISOString(),
      modifiedBy: user?.username || "system",
      version: claim.version + 1,
      auditTrail: [
        ...claim.auditTrail,
        {
          action: "Modified",
          user: user?.username || "system",
          timestamp: new Date().toISOString(),
          reason: editReason
        }
      ]
    };

    setClaimsDatabase(claimsDatabase.map(c => 
      c.sysNumber === claim.sysNumber ? updatedClaim : c
    ));

    setEditingClaim(null);
    setEditReason("");
    alert(`Claim ${claim.claimReference} has been updated. Version ${updatedClaim.version} saved.`);
  };

  // Generate documents
  const generateDocument = (type, claim) => {
    const docData = {
      type,
      claimReference: claim.claimReference,
      sysNumber: claim.sysNumber,
      amount: claim.claimAmount,
      currency: claim.currency,
      generatedBy: user?.username || "system",
      timestamp: new Date().toISOString()
    };

    // Simulate document generation
    alert(`${type} generated for Claim ${claim.claimReference} (SYS: ${claim.sysNumber})\nDocument ready for download in PDF and Excel formats.`);
  };

  useEffect(() => {
    if (!sysNumber) {
      setSysNumber(generateSysNumber());
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comprehensive Claims Management System</h2>
          <p className="text-gray-600">Advanced claims processing with automated SYS numbering and financial integration</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-100 text-blue-800">
            <Shield className="h-3 w-3 mr-1" />
            SYS: {sysNumber}
          </Badge>
          {user && (
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {user.userType}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="claims-entry">Claims Entry</TabsTrigger>
          <TabsTrigger value="outstanding-claims">Outstanding Claims</TabsTrigger>
          <TabsTrigger value="xol-calculator">XOL Calculator</TabsTrigger>
          {user?.userType === 'Finance' && <TabsTrigger value="finance-portal">Finance Portal</TabsTrigger>}
          <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="claims-entry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                New Claim Entry
                <Badge className="ml-2 bg-green-100 text-green-800">SYS: {sysNumber}</Badge>
              </CardTitle>
              <CardDescription>
                Enter new claim with automated SYS Number generation and standardized reference numbering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="claimType">Claim Type</Label>
                  <Select value={claimType} onValueChange={setClaimType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Motor">Motor (MV)</SelectItem>
                      <SelectItem value="Fire">Fire (F)</SelectItem>
                      <SelectItem value="Engineering">Engineering (ENG)</SelectItem>
                      <SelectItem value="Accident">Accident (A)</SelectItem>
                      <SelectItem value="Marine">Marine (M)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessClass">Business Class</Label>
                  <Select value={businessClass} onValueChange={setBusinessClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Treaty">Treaty (TTY)</SelectItem>
                      <SelectItem value="Facultative">Facultative (FAC)</SelectItem>
                      <SelectItem value="Policy">Policy Cession (POL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="claimReference">Claim Reference (Auto-Generated)</Label>
                  <Input
                    id="claimReference"
                    value={claimType && businessClass ? generateClaimReference(claimType, businessClass) : ""}
                    disabled
                    className="font-mono bg-gray-50"
                  />
                </div>
              </div>

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
                    placeholder="YYYY format"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number</Label>
                  <Input
                    id="policyNumber"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="Alphanumeric policy number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimAmount">Claim Amount</Label>
                  <Input
                    id="claimAmount"
                    type="number"
                    step="0.01"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Enable XOL Calculator</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showXOLCalculator}
                      onChange={(e) => setShowXOLCalculator(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Calculate layer-wise distribution</span>
                  </div>
                </div>
              </div>

              {showXOLCalculator && xolCalculations && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-blue-900 flex items-center">
                    <Calculator className="h-4 w-4 mr-2" />
                    XOL Claims Calculator Results
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p>Total Claim: <span className="font-bold">{currency} {xolCalculations.totalClaim.toLocaleString()}</span></p>
                      <p>Total Payable: <span className="font-bold text-green-600">{currency} {xolCalculations.totalPayable.toLocaleString()}</span></p>
                    </div>
                    <div>
                      <p>Total Reinstatement: <span className="font-bold text-blue-600">{currency} {xolCalculations.totalReinstatement.toLocaleString()}</span></p>
                      <p>Layers Affected: <span className="font-bold">{xolCalculations.layers.length}</span></p>
                    </div>
                    <div>
                      <p>Auto-booking: <span className="font-bold text-purple-600">Enabled</span></p>
                      <p>Notifications: <span className="font-bold">Underwriting + Finance</span></p>
                    </div>
                  </div>

                  <div className="border-t border-blue-200 pt-3">
                    <h5 className="font-medium text-blue-900 mb-2">Layer-wise Breakdown:</h5>
                    <div className="space-y-2">
                      {xolCalculations.layers.map((layer, index) => (
                        <div key={index} className="bg-white p-3 rounded border border-blue-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div>
                              <p className="font-medium">{layer.layer}</p>
                              <p>Limit: {currency} {layer.limit.toLocaleString()}</p>
                            </div>
                            <div>
                              <p>Retention: {currency} {layer.retention.toLocaleString()}</p>
                              <p>Claim: {currency} {layer.claimAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p>Deductible: {currency} {layer.deductible.toLocaleString()}</p>
                              <p>Net Payable: {currency} {layer.netPayable.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="font-medium text-blue-600">Reinstatement:</p>
                              <p className="font-bold text-blue-600">{currency} {layer.reinstatementPremium.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="claimDescription">Claim Description</Label>
                <Textarea
                  id="claimDescription"
                  placeholder="Enter detailed claim description..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleClaimSubmission} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Submit Claim
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding-claims" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Outstanding Claims Management
              </CardTitle>
              <CardDescription>
                Editable interface with version control and audit trail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input placeholder="Search by SYS Number or Claim Reference" className="flex-1" />
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SYS Number</TableHead>
                        <TableHead>Claim Reference</TableHead>
                        <TableHead>Contract</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claimsDatabase.filter(claim => claim.status === 'Outstanding').map((claim) => (
                        <TableRow key={claim.sysNumber}>
                          <TableCell className="font-mono font-bold">{claim.sysNumber}</TableCell>
                          <TableCell className="font-mono text-sm">{claim.claimReference}</TableCell>
                          <TableCell>{claim.contractNumber}</TableCell>
                          <TableCell>{claim.currency} {claim.claimAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{claim.status}</Badge>
                          </TableCell>
                          <TableCell>v{claim.version}</TableCell>
                          <TableCell className="text-xs">
                            {new Date(claim.lastModified).toLocaleString()}
                            <br />
                            <span className="text-gray-500">by {claim.modifiedBy}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingClaim(claim)}
                              >
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {editingClaim && (
                <Card className="mt-4 border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-orange-900 flex items-center">
                      <Lock className="h-4 w-4 mr-2" />
                      Edit Claim: {editingClaim.claimReference}
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      Editing requires authentication and reason. All changes are logged.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Current Amount</Label>
                        <Input 
                          value={editingClaim.claimAmount} 
                          type="number"
                          onChange={(e) => setEditingClaim({...editingClaim, claimAmount: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                          value={editingClaim.status} 
                          onValueChange={(value) => setEditingClaim({...editingClaim, status: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Outstanding">Outstanding</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Settled">Settled</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editReason">Reason for Change (Mandatory)</Label>
                      <Textarea
                        id="editReason"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="Enter detailed reason for this modification..."
                        rows={3}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button onClick={() => handleClaimEdit(editingClaim)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setEditingClaim(null)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="xol-calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                XOL Claims Calculator
              </CardTitle>
              <CardDescription>
                Standalone calculator for layer-wise loss distribution and reinstatement premiums
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calcPolicyNumber">Policy Number</Label>
                  <Input
                    id="calcPolicyNumber"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="Alphanumeric policy number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calcYear">Underwriting Year</Label>
                  <Input
                    id="calcYear"
                    value={underwritingYear}
                    onChange={(e) => setUnderwritingYear(e.target.value)}
                    placeholder="YYYY format"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calcAmount">Claim Amount</Label>
                  <Input
                    id="calcAmount"
                    type="number"
                    step="0.01"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <Button onClick={() => setShowXOLCalculator(true)}>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate XOL Distribution
              </Button>

              {showXOLCalculator && xolCalculations && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                    <h4 className="font-bold text-lg text-blue-900 mb-4">Calculation Results</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-600">Total Claim</p>
                        <p className="text-xl font-bold text-blue-900">{currency} {xolCalculations.totalClaim.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <p className="text-sm text-green-600">Total Payable</p>
                        <p className="text-xl font-bold text-green-900">{currency} {xolCalculations.totalPayable.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-600">Reinstatement Premium</p>
                        <p className="text-xl font-bold text-purple-900">{currency} {xolCalculations.totalReinstatement.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-600">Layers Affected</p>
                        <p className="text-xl font-bold text-orange-900">{xolCalculations.layers.length}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-medium text-blue-900">Layer-wise Distribution:</h5>
                      {xolCalculations.layers.map((layer, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="font-medium text-gray-900">{layer.layer}</h6>
                            <Badge variant="outline">Layer {index + 1}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Limit</p>
                              <p className="font-medium">{currency} {layer.limit.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Retention</p>
                              <p className="font-medium">{currency} {layer.retention.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Claim Amount</p>
                              <p className="font-medium text-blue-600">{currency} {layer.claimAmount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Net Payable</p>
                              <p className="font-medium text-green-600">{currency} {layer.netPayable.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Reinstatement</p>
                              <p className="font-medium text-purple-600">{currency} {layer.reinstatementPremium.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h6 className="font-medium text-yellow-900 mb-2">Business Rules Applied:</h6>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Reinstatement premiums will be auto-booked upon claim approval</li>
                        <li>• Entries linked to SYS Number: {sysNumber} and Contract: {contractNumber}</li>
                        <li>• Notifications triggered to Underwriting and Finance teams</li>
                        <li>• Real-time synchronization across all modules enabled</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      Save Calculation
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                    <Button variant="outline">
                      <Bell className="h-4 w-4 mr-2" />
                      Send Notifications
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {user?.userType === 'Finance' && (
          <TabsContent value="finance-portal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Finance Team Portal
                  <Badge className="ml-2 bg-green-100 text-green-800">Secure Access</Badge>
                </CardTitle>
                <CardDescription>
                  Real-time premium tracking and automated document generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Premium Tracked</p>
                    <p className="text-2xl font-bold text-blue-900">USD 8.2M</p>
                    <p className="text-xs text-blue-600">Across all departments</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Commission Calculated</p>
                    <p className="text-2xl font-bold text-green-900">USD 2.05M</p>
                    <p className="text-xs text-green-600">Automated calculations</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">Pending Payments</p>
                    <p className="text-2xl font-bold text-orange-900">USD 1.3M</p>
                    <p className="text-xs text-orange-600">Requires processing</p>
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Premium ID</TableHead>
                        <TableHead>Source Department</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {premiumTracking.map((premium) => (
                        <TableRow key={premium.id}>
                          <TableCell className="font-mono">{premium.id}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{premium.source}</Badge>
                          </TableCell>
                          <TableCell>{premium.currency} {premium.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={premium.status === 'Pending' ? 'destructive' : 'default'}>
                              {premium.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {premium.currency} {premium.commission.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs">{premium.lastModified}</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline">
                                <FileText className="h-3 w-3 mr-1" />
                                Debit Note
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="h-3 w-3 mr-1" />
                                Credit Note
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Automated Document Generation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-16 flex flex-col items-center justify-center"
                      onClick={() => generateDocument("Debit Note", claimsDatabase[0])}
                    >
                      <FileText className="h-6 w-6 mb-1" />
                      <span>Generate Debit Notes</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex flex-col items-center justify-center"
                      onClick={() => generateDocument("Credit Note", claimsDatabase[0])}
                    >
                      <Download className="h-6 w-6 mb-1" />
                      <span>Generate Credit Notes</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="audit-trail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Audit Trail & Version Control
              </CardTitle>
              <CardDescription>
                Complete transaction history with user authentication logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input placeholder="Search by SYS Number, User, or Action" className="flex-1" />
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="created">Created</SelectItem>
                      <SelectItem value="modified">Modified</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>

                <div className="space-y-4">
                  {claimsDatabase.map((claim) => (
                    <Card key={claim.sysNumber} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              SYS: {claim.sysNumber} - {claim.claimReference}
                            </CardTitle>
                            <CardDescription>
                              Contract: {claim.contractNumber} | Current Version: {claim.version}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            {claim.auditTrail.length} entries
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {claim.auditTrail.map((entry, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-sm">{entry.action}</p>
                                    <p className="text-xs text-gray-600">by {entry.user}</p>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {new Date(entry.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{entry.reason}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClaimsSystemComprehensive;