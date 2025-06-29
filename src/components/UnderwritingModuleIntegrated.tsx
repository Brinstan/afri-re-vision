import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/sonner";
import { Plus, FileText, Save, Eye, Users, Building, CheckCircle, ArrowRight, Trash2, AlertTriangle } from "lucide-react";
import { useDataStore } from './DataStore';

const UnderwritingModuleIntegrated = () => {
  const [contractType, setContractType] = useState("quota");
  const [selectedLines, setSelectedLines] = useState([]);
  const [brokers, setBrokers] = useState([{ id: 1, name: "", reference: "", commission: "" }]);
  const [cedants, setCedants] = useState([{ id: 1, name: "", reference: "", country: "" }]);
  const [contractNumber, setContractNumber] = useState("");
  const [treatyName, setTreatyName] = useState("");
  const [underwritingYear, setUnderwritingYear] = useState("2024");
  const [premium, setPremium] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [inceptionDate, setInceptionDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  
  // XOL Layers state
  const [xolLayers, setXolLayers] = useState([
    { id: 1, name: "Layer 1", limit: "", retention: "", rate: "", participation: "100.00" }
  ]);

  // Signed Share states for different contract types
  const [stopLossSignedShare, setStopLossSignedShare] = useState("100.00");
  const [surplusSignedShare, setSurplusSignedShare] = useState("100.00");
  const [facultativeSignedShare, setFacultativeSignedShare] = useState("100.00");

  // Validation error states
  const [stopLossError, setStopLossError] = useState("");
  const [surplusError, setSurplusError] = useState("");
  const [facultativeError, setFacultativeError] = useState("");

  const { addUnderwritingContract, convertUnderwritingToTreaty, underwritingContracts } = useDataStore();

  const linesOfBusiness = [
    { id: "motor", name: "Motor Insurance", code: "MOT" },
    { id: "accident", name: "Accident & Health", code: "ACC" },
    { id: "liability", name: "General Liability", code: "LIA" },
    { id: "property", name: "Property Insurance", code: "PROP" },
    { id: "marine", name: "Marine Insurance", code: "MAR" },
    { id: "aviation", name: "Aviation Insurance", code: "AVI" },
    { id: "engineering", name: "Engineering Insurance", code: "ENG" },
    { id: "agriculture", name: "Agriculture Insurance", code: "AGR" }
  ];

  // Percentage validation function
  const validatePercentage = (value, setError) => {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      setError("Please enter a valid number");
      return false;
    }
    
    if (numValue < 0) {
      setError("Percentage cannot be negative");
      return false;
    }
    
    if (numValue > 100) {
      setError("Percentage cannot exceed 100%");
      return false;
    }
    
    // Check decimal places
    const decimalPlaces = (value.split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      setError("Maximum 2 decimal places allowed");
      return false;
    }
    
    setError("");
    return true;
  };

  // Handle percentage input changes
  const handlePercentageChange = (value, setter, errorSetter) => {
    setter(value);
    validatePercentage(value, errorSetter);
  };

  // XOL Layer management functions
  const addXolLayer = () => {
    const newLayer = {
      id: Date.now(),
      name: `Layer ${xolLayers.length + 1}`,
      limit: "",
      retention: "",
      rate: "",
      participation: "100.00"
    };
    setXolLayers([...xolLayers, newLayer]);
  };

  const deleteXolLayer = (layerId) => {
    if (xolLayers.length > 1) {
      setXolLayers(xolLayers.filter(layer => layer.id !== layerId));
    }
  };

  const updateXolLayer = (layerId, field, value) => {
    setXolLayers(xolLayers.map(layer => 
      layer.id === layerId ? { ...layer, [field]: value } : layer
    ));
  };

  const getTotalParticipation = () => {
    return xolLayers.reduce((total, layer) => {
      const participation = parseFloat(layer.participation) || 0;
      return total + participation;
    }, 0);
  };

  const isParticipationValid = () => {
    const total = getTotalParticipation();
    return total <= 100;
  };

  const addBroker = () => {
    setBrokers([...brokers, { id: Date.now(), name: "", reference: "", commission: "" }]);
  };

  const addCedant = () => {
    setCedants([...cedants, { id: Date.now(), name: "", reference: "", country: "" }]);
  };

  const updateBroker = (id, field, value) => {
    setBrokers(brokers.map(broker => broker.id === id ? { ...broker, [field]: value } : broker));
  };

  const updateCedant = (id, field, value) => {
    setCedants(cedants.map(cedant => cedant.id === id ? { ...cedant, [field]: value } : cedant));
  };

  const handleLineSelection = (lineId, checked) => {
    if (checked) {
      setSelectedLines([...selectedLines, lineId]);
    } else {
      setSelectedLines(selectedLines.filter(id => id !== lineId));
    }
  };

  const validateSignedShares = () => {
    let isValid = true;
    
    if (contractType === "stoploss") {
      if (!validatePercentage(stopLossSignedShare, setStopLossError)) {
        isValid = false;
      }
    } else if (contractType === "surplus") {
      if (!validatePercentage(surplusSignedShare, setSurplusError)) {
        isValid = false;
      }
    } else if (contractType === "facultative") {
      if (!validatePercentage(facultativeSignedShare, setFacultativeError)) {
        isValid = false;
      }
    }
    
    return isValid;
  };

  const handleSaveContract = () => {
    // Validation
    if (!contractNumber || !treatyName || !premium || !inceptionDate || !expiryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (cedants.some(c => !c.name) || brokers.some(b => !b.name)) {
      toast.error("Please complete all cedant and broker information");
      return;
    }

    // Validate signed shares for applicable contract types
    if (!validateSignedShares()) {
      toast.error("Please correct the signed share percentage errors");
      return;
    }

    // XOL specific validation
    if (contractType === "xol" && !isParticipationValid()) {
      toast.error("Total participation percentage cannot exceed 100%");
      return;
    }

    const newContract = {
      id: Date.now().toString(),
      contractNumber,
      underwritingYear,
      contractType,
      treatyName,
      cedants: cedants.filter(c => c.name),
      brokers: brokers.filter(b => b.name).map(b => ({ ...b, commission: parseFloat(b.commission) || 0 })),
      linesOfBusiness: selectedLines,
      premium: parseFloat(premium),
      currency,
      status: 'Draft' as const,
      inceptionDate,
      expiryDate,
      // Add signed share data
      signedShare: contractType === "stoploss" ? parseFloat(stopLossSignedShare) :
                   contractType === "surplus" ? parseFloat(surplusSignedShare) :
                   contractType === "facultative" ? parseFloat(facultativeSignedShare) : null,
      xolLayers: contractType === "xol" ? xolLayers : null
    };

    addUnderwritingContract(newContract);
    toast.success("Underwriting contract saved successfully");

    // Reset form
    setContractNumber("");
    setTreatyName("");
    setPremium("");
    setSelectedLines([]);
    setBrokers([{ id: 1, name: "", reference: "", commission: "" }]);
    setCedants([{ id: 1, name: "", reference: "", country: "" }]);
    setStopLossSignedShare("100.00");
    setSurplusSignedShare("100.00");
    setFacultativeSignedShare("100.00");
    setXolLayers([{ id: 1, name: "Layer 1", limit: "", retention: "", rate: "", participation: "100.00" }]);
  };

  const handleConvertToTreaty = (contractId: string) => {
    convertUnderwritingToTreaty(contractId);
    toast.success("Contract converted to active treaty and moved to Treaty Management");
  };

  const generateContractNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 99999);
    return `${year}${String(random).padStart(5, '0')}`;
  };

  // Percentage input component with validation
  const PercentageInput = ({ value, onChange, error, label, id }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center">
        {label}
        <span className="text-red-500 ml-1">*</span>
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="100.00"
          className={`pr-8 ${error ? 'border-red-500' : ''}`}
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
      </div>
      {error && (
        <div className="flex items-center text-red-500 text-sm">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {error}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrated Underwriting Module</h2>
          <p className="text-gray-600">Comprehensive treaty and policy underwriting with automatic treaty conversion</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview Contract
          </Button>
          <Button onClick={handleSaveContract}>
            <Save className="h-4 w-4 mr-2" />
            Save Contract
          </Button>
        </div>
      </div>

      <Tabs defaultValue="contract" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="contract">Contract Details</TabsTrigger>
          <TabsTrigger value="parties">Parties & Brokers</TabsTrigger>
          <TabsTrigger value="coverage">Coverage Terms</TabsTrigger>
          <TabsTrigger value="financial">Financial Terms</TabsTrigger>
          <TabsTrigger value="clauses">Clauses & Conditions</TabsTrigger>
          <TabsTrigger value="contracts">Saved Contracts</TabsTrigger>
        </TabsList>

        <TabsContent value="contract" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contractNumber">Contract Number</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="contractNumber" 
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      placeholder="Enter contract number" 
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setContractNumber(generateContractNumber())}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="treatyName">Treaty Name</Label>
                  <Input 
                    id="treatyName" 
                    value={treatyName}
                    onChange={(e) => setTreatyName(e.target.value)}
                    placeholder="e.g., Motor Treaty 2024" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="underwritingYear">Underwriting Year</Label>
                  <Input 
                    id="underwritingYear" 
                    type="number" 
                    value={underwritingYear}
                    onChange={(e) => setUnderwritingYear(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractType">Contract Type</Label>
                  <Select value={contractType} onValueChange={setContractType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quota">Quota Share</SelectItem>
                      <SelectItem value="surplus">Surplus Lines</SelectItem>
                      <SelectItem value="xol">Excess of Loss</SelectItem>
                      <SelectItem value="stoploss">Stop Loss</SelectItem>
                      <SelectItem value="facultative">Facultative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inceptionDate">Inception Date</Label>
                  <Input 
                    id="inceptionDate" 
                    type="date" 
                    value={inceptionDate}
                    onChange={(e) => setInceptionDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input 
                    id="expiryDate" 
                    type="date" 
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateAccepted">Date Accepted</Label>
                  <Input id="dateAccepted" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateConfirmed">Date Confirmed</Label>
                  <Input id="dateConfirmed" type="date" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="premium">Premium Amount</Label>
                  <Input 
                    id="premium" 
                    type="number" 
                    value={premium}
                    onChange={(e) => setPremium(e.target.value)}
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
                <div className="space-y-2">
                  <Label htmlFor="processingType">Processing Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="installment">Installment</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractStatus">Contract Status</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending Approval</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lines of Business Coverage</CardTitle>
              <CardDescription>
                {contractType === 'xol' ? 'Select multiple lines for combined XOL coverage' : 'Select applicable lines of business'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {linesOfBusiness.map((line) => (
                  <div key={line.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={line.id}
                      checked={selectedLines.includes(line.id)}
                      onCheckedChange={(checked) => handleLineSelection(line.id, checked)}
                    />
                    <Label htmlFor={line.id} className="text-sm">
                      {line.name}
                      <Badge variant="outline" className="ml-1">{line.code}</Badge>
                    </Label>
                  </div>
                ))}
              </div>
              {selectedLines.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Selected Lines:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedLines.map(lineId => {
                      const line = linesOfBusiness.find(l => l.id === lineId);
                      return (
                        <Badge key={lineId} variant="secondary">
                          {line?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parties" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Cedants</CardTitle>
                  <CardDescription>Insurance companies ceding business</CardDescription>
                </div>
                <Button size="sm" onClick={addCedant}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cedant
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {cedants.map((cedant, index) => (
                  <div key={cedant.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Cedant {index + 1}</h4>
                      <Badge variant="outline">
                        <Building className="h-3 w-3 mr-1" />
                        Primary: {index === 0 ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Cedant Name</Label>
                        <Input
                          placeholder="e.g., Century Insurance Company Ltd"
                          value={cedant.name}
                          onChange={(e) => updateCedant(cedant.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reference Code</Label>
                        <Input
                          placeholder="e.g., R12019"
                          value={cedant.reference}
                          onChange={(e) => updateCedant(cedant.id, 'reference', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select onValueChange={(value) => updateCedant(cedant.id, 'country', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TZ">Tanzania</SelectItem>
                          <SelectItem value="KE">Kenya</SelectItem>
                          <SelectItem value="UG">Uganda</SelectItem>
                          <SelectItem value="RW">Rwanda</SelectItem>
                          <SelectItem value="ZA">South Africa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Brokers</CardTitle>
                  <CardDescription>Intermediaries and their commission rates</CardDescription>
                </div>
                <Button size="sm" onClick={addBroker}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Broker
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {brokers.map((broker, index) => (
                  <div key={broker.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Broker {index + 1}</h4>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        Lead: {index === 0 ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Broker Name</Label>
                        <Input
                          placeholder="e.g., AON Group"
                          value={broker.name}
                          onChange={(e) => updateBroker(broker.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reference Code</Label>
                        <Input
                          placeholder="e.g., A71AON"
                          value={broker.reference}
                          onChange={(e) => updateBroker(broker.id, 'reference', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Commission %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={broker.commission}
                          onChange={(e) => updateBroker(broker.id, 'commission', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4">
          {contractType === 'quota' && (
            <Card>
              <CardHeader>
                <CardTitle>Quota Share Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cessionPercentage">Cession Percentage</Label>
                    <Input id="cessionPercentage" type="number" step="0.01" placeholder="50.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">Commission Rate %</Label>
                    <Input id="commissionRate" type="number" step="0.01" placeholder="25.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profitCommission">Profit Commission %</Label>
                    <Input id="profitCommission" type="number" step="0.01" placeholder="20.00" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {contractType === 'xol' && (
            <Card>
              <CardHeader>
                <CardTitle>Excess of Loss Structure</CardTitle>
                <CardDescription>Multi-layer XOL coverage with individual participation percentages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Layer Configuration</h4>
                  <Button size="sm" onClick={addXolLayer}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Layer
                  </Button>
                </div>

                <div className="space-y-4">
                  {xolLayers.map((layer, index) => (
                    <div key={layer.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium">{layer.name}</h5>
                        {xolLayers.length > 1 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteXolLayer(layer.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div className="space-y-2">
                          <Label>Layer Name</Label>
                          <Input
                            value={layer.name}
                            onChange={(e) => updateXolLayer(layer.id, 'name', e.target.value)}
                            placeholder="Layer name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Limit</Label>
                          <Input
                            type="number"
                            value={layer.limit}
                            onChange={(e) => updateXolLayer(layer.id, 'limit', e.target.value)}
                            placeholder="5000000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Retention</Label>
                          <Input
                            type="number"
                            value={layer.retention}
                            onChange={(e) => updateXolLayer(layer.id, 'retention', e.target.value)}
                            placeholder="500000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rate %</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={layer.rate}
                            onChange={(e) => updateXolLayer(layer.id, 'rate', e.target.value)}
                            placeholder="8.50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Participation %</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={layer.participation}
                              onChange={(e) => updateXolLayer(layer.id, 'participation', e.target.value)}
                              placeholder="100.00"
                              className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`p-4 rounded-lg ${isParticipationValid() ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Participation:</span>
                    <span className={`text-lg font-bold ${isParticipationValid() ? 'text-green-700' : 'text-red-700'}`}>
                      {getTotalParticipation().toFixed(2)}%
                    </span>
                  </div>
                  {!isParticipationValid() && (
                    <div className="flex items-center mt-2 text-red-600 text-sm">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Total participation cannot exceed 100%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {contractType === 'stoploss' && (
            <Card>
              <CardHeader>
                <CardTitle>Stop Loss Terms</CardTitle>
                <CardDescription>Stop loss coverage configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coverageLimit">Coverage Limit %</Label>
                    <Input id="coverageLimit" type="number" step="0.01" placeholder="90.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attachmentPoint">Attachment Point %</Label>
                    <Input id="attachmentPoint" type="number" step="0.01" placeholder="80.00" />
                  </div>
                  <PercentageInput
                    value={stopLossSignedShare}
                    onChange={(value) => handlePercentageChange(value, setStopLossSignedShare, setStopLossError)}
                    error={stopLossError}
                    label="Signed Share"
                    id="stopLossSignedShare"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coveragePeriod">Coverage Period</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="occurrence">Per Occurrence</SelectItem>
                        <SelectItem value="aggregate">Aggregate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicableRisks">Applicable Risks</Label>
                    <Textarea
                      id="applicableRisks"
                      placeholder="Describe applicable risks..."
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {contractType === 'surplus' && (
            <Card>
              <CardHeader>
                <CardTitle>Surplus Lines Terms</CardTitle>
                <CardDescription>Surplus lines coverage configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numberOfLines">Number of Lines</Label>
                    <Input id="numberOfLines" type="number" placeholder="9" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retentionAmount">Retention Amount</Label>
                    <Input id="retentionAmount" type="number" placeholder="1000000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLine">Maximum Line</Label>
                    <Input id="maxLine" type="number" placeholder="10000000" />
                  </div>
                  <PercentageInput
                    value={surplusSignedShare}
                    onChange={(value) => handlePercentageChange(value, setSurplusSignedShare, setSurplusError)}
                    error={surplusError}
                    label="Signed Share"
                    id="surplusSignedShare"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coveragePeriodSurplus">Coverage Period</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="occurrence">Per Occurrence</SelectItem>
                        <SelectItem value="aggregate">Aggregate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicableRisksSurplus">Applicable Risks</Label>
                    <Textarea
                      id="applicableRisksSurplus"
                      placeholder="Describe applicable risks..."
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {contractType === 'facultative' && (
            <Card>
              <CardHeader>
                <CardTitle>Facultative Terms</CardTitle>
                <CardDescription>Facultative coverage configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coverageLimitFac">Coverage Limit</Label>
                    <Input id="coverageLimitFac" type="number" placeholder="5000000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retentionLevelFac">Retention Level</Label>
                    <Input id="retentionLevelFac" type="number" placeholder="500000" />
                  </div>
                  <PercentageInput
                    value={facultativeSignedShare}
                    onChange={(value) => handlePercentageChange(value, setFacultativeSignedShare, setFacultativeError)}
                    error={facultativeError}
                    label="Signed Share"
                    id="facultativeSignedShare"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coveragePeriodFac">Coverage Period</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="occurrence">Per Occurrence</SelectItem>
                        <SelectItem value="aggregate">Aggregate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="riskAssessment">Risk Assessment Notes</Label>
                    <Textarea
                      id="riskAssessment"
                      placeholder="Enter risk assessment notes..."
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          {contractType === 'stoploss' && (
            <Card>
              <CardHeader>
                <CardTitle>Stop Loss Financial Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="premiumRate">Premium Rate %</Label>
                    <Input id="premiumRate" type="number" step="0.01" placeholder="5.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumPremiumSL">Minimum Premium</Label>
                    <Input id="minimumPremiumSL" type="number" placeholder="100000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maximumPremiumSL">Maximum Premium</Label>
                    <Input id="maximumPremiumSL" type="number" placeholder="1000000" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commissionStructureSL">Commission Structure</Label>
                    <Input id="commissionStructureSL" type="number" step="0.01" placeholder="15.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lossParticipationSL">Loss Participation %</Label>
                    <Input id="lossParticipationSL" type="number" step="0.01" placeholder="10.00" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {contractType === 'surplus' && (
            <Card>
              <CardHeader>
                <CardTitle>Surplus Financial Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commissionRateSurplus">Commission Rate %</Label>
                    <Input id="commissionRateSurplus" type="number" step="0.01" placeholder="25.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profitCommissionSurplus">Profit Commission %</Label>
                    <Input id="profitCommissionSurplus" type="number" step="0.01" placeholder="20.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slidingScale">Sliding Scale</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="premiumCalculationSurplus">Premium Calculation Method</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proportional">Proportional</SelectItem>
                        <SelectItem value="fixed">Fixed Rate</SelectItem>
                        <SelectItem value="sliding">Sliding Scale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTermsSurplus">Payment Terms</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {contractType === 'facultative' && (
            <Card>
              <CardHeader>
                <CardTitle>Facultative Financial Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="premiumRateFac">Premium Rate %</Label>
                    <Input id="premiumRateFac" type="number" step="0.01" placeholder="8.50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commissionFac">Commission %</Label>
                    <Input id="commissionFac" type="number" step="0.01" placeholder="25.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brokerageFac">Brokerage %</Label>
                    <Input id="brokerageFac" type="number" step="0.01" placeholder="5.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxesFac">Taxes %</Label>
                    <Input id="taxesFac" type="number" step="0.01" placeholder="2.00" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTermsFac">Payment Terms</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30-days">30 Days</SelectItem>
                        <SelectItem value="60-days">60 Days</SelectItem>
                        <SelectItem value="90-days">90 Days</SelectItem>
                        <SelectItem value="immediate">Immediate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currencySpecFac">Currency Specifications</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="local">Local Currency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(contractType === 'quota' || contractType === 'xol') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Premium Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedPremium">Estimated Annual Premium</Label>
                    <Input id="estimatedPremium" type="number" placeholder="2500000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumPremium">Minimum Premium</Label>
                    <Input id="minimumPremium" type="number" placeholder="1000000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depositPremium">Deposit Premium</Label>
                    <Input id="depositPremium" type="number" placeholder="750000" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="as-due">As & When Due</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settlementTerms">Settlement Terms</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select settlement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30-days">30 Days</SelectItem>
                        <SelectItem value="60-days">60 Days</SelectItem>
                        <SelectItem value="90-days">90 Days</SelectItem>
                        <SelectItem value="immediate">Immediate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interestRate">Interest Rate % (Late Payment)</Label>
                    <Input id="interestRate" type="number" step="0.01" placeholder="1.50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="clauses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Standard Clauses & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specialConditions">Special Conditions</Label>
                <Textarea
                  id="specialConditions"
                  placeholder="Enter any special conditions or clauses..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exclusions">Exclusions</Label>
                <Textarea
                  id="exclusions"
                  placeholder="Specify any exclusions..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jurisdiction">Jurisdiction</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tanzania">Tanzania</SelectItem>
                      <SelectItem value="london">London</SelectItem>
                      <SelectItem value="singapore">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arbitration">Arbitration</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select arbitration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ica">Insurance Council of Australia</SelectItem>
                      <SelectItem value="lmaa">London Maritime Arbitrators</SelectItem>
                      <SelectItem value="local">Local Arbitration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Underwriting Contracts</CardTitle>
              <CardDescription>Manage and convert underwriting contracts to active treaties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {underwritingContracts.map((contract) => (
                  <div key={contract.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{contract.treatyName}</h4>
                          <Badge variant={contract.status === 'Active' ? 'secondary' : 'outline'}>
                            {contract.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Contract Number:</strong> {contract.contractNumber}</p>
                            <p><strong>Type:</strong> {contract.contractType}</p>
                            <p><strong>Year:</strong> {contract.underwritingYear}</p>
                          </div>
                          <div>
                            <p><strong>Cedant:</strong> {contract.cedants[0]?.name}</p>
                            <p><strong>Broker:</strong> {contract.brokers[0]?.name}</p>
                            <p><strong>Premium:</strong> {contract.currency} {contract.premium.toLocaleString()}</p>
                          </div>
                          <div>
                            <p><strong>Period:</strong> {contract.inceptionDate} to {contract.expiryDate}</p>
                            <p><strong>Lines:</strong> {contract.linesOfBusiness.length} selected</p>
                            <p><strong>Commission:</strong> {contract.brokers[0]?.commission || 0}%</p>
                            {contract.signedShare && (
                              <p><strong>Signed Share:</strong> {contract.signedShare}%</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {contract.status === 'Draft' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleConvertToTreaty(contract.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Convert to Treaty
                          </Button>
                        )}
                        {contract.status === 'Active' && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Converted to Treaty
                          </Badge>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {underwritingContracts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No underwriting contracts saved yet.</p>
                    <p className="text-sm">Create a new contract using the form above.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnderwritingModuleIntegrated;