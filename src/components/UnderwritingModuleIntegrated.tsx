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
    { id: 1, name: "Working Layer", limit: "", retention: "", participationPercentage: "", rate: "" }
  ]);

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

  // XOL Layer Management Functions
  const addXolLayer = () => {
    const newLayer = {
      id: Date.now(),
      name: `Layer ${xolLayers.length + 1}`,
      limit: "",
      retention: "",
      participationPercentage: "",
      rate: ""
    };
    setXolLayers([...xolLayers, newLayer]);
  };

  const deleteXolLayer = (layerId) => {
    if (xolLayers.length > 1) {
      setXolLayers(xolLayers.filter(layer => layer.id !== layerId));
    } else {
      toast.error("At least one layer is required");
    }
  };

  const updateXolLayer = (layerId, field, value) => {
    setXolLayers(xolLayers.map(layer => 
      layer.id === layerId ? { ...layer, [field]: value } : layer
    ));
  };

  // Validation for participation percentage
  const validateParticipationPercentage = (value) => {
    const percentage = parseFloat(value);
    if (percentage < 0 || percentage > 100) {
      toast.error("Participation percentage must be between 0 and 100");
      return false;
    }
    return true;
  };

  const getTotalParticipation = () => {
    return xolLayers.reduce((total, layer) => {
      const participation = parseFloat(layer.participationPercentage) || 0;
      return total + participation;
    }, 0);
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

    // XOL specific validation
    if (contractType === "xol") {
      const totalParticipation = getTotalParticipation();
      if (totalParticipation > 100) {
        toast.error(`Total participation percentage (${totalParticipation.toFixed(1)}%) cannot exceed 100%`);
        return;
      }
      
      if (xolLayers.some(layer => !layer.limit || !layer.retention)) {
        toast.error("Please complete all layer information for XOL contract");
        return;
      }
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
      xolLayers: contractType === "xol" ? xolLayers : undefined
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
    setXolLayers([{ id: 1, name: "Working Layer", limit: "", retention: "", participationPercentage: "", rate: "" }]);
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

  // Get tab configuration based on contract type
  const getTabConfiguration = () => {
    const baseTabs = ["contract", "parties"];
    
    switch (contractType) {
      case "xol":
        return [...baseTabs, "coverage", "financial", "clauses", "contracts"];
      case "stoploss":
      case "surplus":
      case "facultative":
        return [...baseTabs, "coverage-terms", "financial-terms", "clauses", "contracts"];
      default:
        return [...baseTabs, "coverage", "financial", "clauses", "contracts"];
    }
  };

  const tabs = getTabConfiguration();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dynamic Underwriting Module</h2>
          <p className="text-gray-600">Advanced contract management with multi-layer support and dynamic interfaces</p>
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
          <TabsTrigger value={contractType === "xol" ? "coverage" : "coverage-terms"}>
            {contractType === "xol" ? "Coverage" : "Coverage Terms"}
          </TabsTrigger>
          <TabsTrigger value={contractType === "xol" ? "financial" : "financial-terms"}>
            {contractType === "xol" ? "Financial" : "Financial Terms"}
          </TabsTrigger>
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

        {/* XOL Coverage Tab */}
        {contractType === "xol" && (
          <TabsContent value="coverage" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Excess of Loss Layer Structure</CardTitle>
                  <CardDescription>Configure multiple coverage layers with participation percentages</CardDescription>
                </div>
                <Button onClick={addXolLayer}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Layer
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Participation Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-900">Total Participation:</span>
                    <span className={`font-bold text-lg ${getTotalParticipation() > 100 ? 'text-red-600' : 'text-blue-900'}`}>
                      {getTotalParticipation().toFixed(1)}%
                    </span>
                  </div>
                  {getTotalParticipation() > 100 && (
                    <div className="flex items-center mt-2 text-red-600">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Total participation exceeds 100%</span>
                    </div>
                  )}
                </div>

                {/* Layer Configuration */}
                <div className="space-y-4">
                  {xolLayers.map((layer, index) => (
                    <div key={layer.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Layer {index + 1}</h4>
                        <div className="flex space-x-2">
                          <Badge variant="outline">
                            {layer.participationPercentage ? `${layer.participationPercentage}%` : '0%'} Participation
                          </Badge>
                          {xolLayers.length > 1 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteXolLayer(layer.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-2">
                          <Label>Layer Name</Label>
                          <Input
                            value={layer.name}
                            onChange={(e) => updateXolLayer(layer.id, 'name', e.target.value)}
                            placeholder="e.g., Working Layer"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Limit (USD)</Label>
                          <Input
                            type="number"
                            value={layer.limit}
                            onChange={(e) => updateXolLayer(layer.id, 'limit', e.target.value)}
                            placeholder="5000000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Retention (USD)</Label>
                          <Input
                            type="number"
                            value={layer.retention}
                            onChange={(e) => updateXolLayer(layer.id, 'retention', e.target.value)}
                            placeholder="500000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Participation %</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={layer.participationPercentage}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (validateParticipationPercentage(value) || value === '') {
                                updateXolLayer(layer.id, 'participationPercentage', value);
                              }
                            }}
                            placeholder="50.00"
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
                      </div>

                      {layer.limit && layer.retention && (
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-700">
                            <strong>Coverage:</strong> {currency} {parseInt(layer.limit).toLocaleString()} 
                            excess of {currency} {parseInt(layer.retention).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedLines.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="font-medium text-green-900">Combined Coverage for:</p>
                    <p className="text-sm text-green-800">
                      {selectedLines.map(id => linesOfBusiness.find(l => l.id === id)?.name).join(', ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Coverage Terms for Stop Loss, Surplus, Facultative */}
        {(contractType === "stoploss" || contractType === "surplus" || contractType === "facultative") && (
          <TabsContent value="coverage-terms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{contractType.charAt(0).toUpperCase() + contractType.slice(1)} Coverage Terms</CardTitle>
                <CardDescription>Configure coverage limits, retention levels, and applicable risks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Coverage Limits */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Coverage Limits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coverageLimit">Coverage Limit</Label>
                      <Input
                        id="coverageLimit"
                        type="number"
                        placeholder={contractType === "stoploss" ? "90" : "10000000"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aggregateLimit">Aggregate Limit</Label>
                      <Input
                        id="aggregateLimit"
                        type="number"
                        placeholder="50000000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="perOccurrenceLimit">Per Occurrence Limit</Label>
                      <Input
                        id="perOccurrenceLimit"
                        type="number"
                        placeholder="5000000"
                      />
                    </div>
                  </div>
                </div>

                {/* Retention Levels */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Retention Levels</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="retentionAmount">
                        {contractType === "stoploss" ? "Retention Percentage (%)" : "Retention Amount"}
                      </Label>
                      <Input
                        id="retentionAmount"
                        type="number"
                        placeholder={contractType === "stoploss" ? "80" : "1000000"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attachmentPoint">Attachment Point</Label>
                      <Input
                        id="attachmentPoint"
                        type="number"
                        placeholder={contractType === "stoploss" ? "80" : "500000"}
                      />
                    </div>
                  </div>
                </div>

                {/* Applicable Risks */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Applicable Risks</h4>
                  <div className="space-y-2">
                    <Label htmlFor="riskDescription">Risk Description</Label>
                    <Textarea
                      id="riskDescription"
                      placeholder="Describe the risks covered under this contract..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="riskCategory">Risk Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="catastrophic">Catastrophic</SelectItem>
                          <SelectItem value="attritional">Attritional</SelectItem>
                          <SelectItem value="large-loss">Large Loss</SelectItem>
                          <SelectItem value="frequency">Frequency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="riskTerritory">Risk Territory</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select territory" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="east-africa">East Africa</SelectItem>
                          <SelectItem value="tanzania">Tanzania Only</SelectItem>
                          <SelectItem value="kenya">Kenya Only</SelectItem>
                          <SelectItem value="uganda">Uganda Only</SelectItem>
                          <SelectItem value="worldwide">Worldwide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Coverage Period */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Coverage Period</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coveragePeriod">Coverage Period</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12-months">12 Months</SelectItem>
                          <SelectItem value="24-months">24 Months</SelectItem>
                          <SelectItem value="36-months">36 Months</SelectItem>
                          <SelectItem value="run-off">Run-off</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discoveryPeriod">Discovery Period</Label>
                      <Input
                        id="discoveryPeriod"
                        placeholder="e.g., 12 months"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reportingPeriod">Reporting Period</Label>
                      <Input
                        id="reportingPeriod"
                        placeholder="e.g., 24 months"
                      />
                    </div>
                  </div>
                </div>

                {/* Special Conditions */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Special Conditions</h4>
                  <div className="space-y-2">
                    <Label htmlFor="specialConditions">Special Conditions & Clauses</Label>
                    <Textarea
                      id="specialConditions"
                      placeholder="Enter any special conditions, clauses, or requirements..."
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Financial Terms for Stop Loss, Surplus, Facultative */}
        {(contractType === "stoploss" || contractType === "surplus" || contractType === "facultative") && (
          <TabsContent value="financial-terms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{contractType.charAt(0).toUpperCase() + contractType.slice(1)} Financial Terms</CardTitle>
                <CardDescription>Configure premium calculations, commission structures, and payment terms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Premium Calculations */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Premium Calculations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="premiumRate">Premium Rate (%)</Label>
                      <Input
                        id="premiumRate"
                        type="number"
                        step="0.01"
                        placeholder="8.50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minimumPremium">Minimum Premium</Label>
                      <Input
                        id="minimumPremium"
                        type="number"
                        placeholder="500000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maximumPremium">Maximum Premium</Label>
                      <Input
                        id="maximumPremium"
                        type="number"
                        placeholder="5000000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="depositPremium">Deposit Premium</Label>
                      <Input
                        id="depositPremium"
                        type="number"
                        placeholder="1000000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adjustmentBasis">Adjustment Basis</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select basis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subject-premium">Subject Premium</SelectItem>
                          <SelectItem value="earned-premium">Earned Premium</SelectItem>
                          <SelectItem value="written-premium">Written Premium</SelectItem>
                          <SelectItem value="exposure">Exposure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Commission Structures */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Commission Structures</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brokerageCommission">Brokerage Commission (%)</Label>
                      <Input
                        id="brokerageCommission"
                        type="number"
                        step="0.01"
                        placeholder="25.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profitCommission">Profit Commission (%)</Label>
                      <Input
                        id="profitCommission"
                        type="number"
                        step="0.01"
                        placeholder="20.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="overrideCommission">Override Commission (%)</Label>
                      <Input
                        id="overrideCommission"
                        type="number"
                        step="0.01"
                        placeholder="5.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commissionBasis">Commission Calculation Basis</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select basis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gross-premium">Gross Premium</SelectItem>
                        <SelectItem value="net-premium">Net Premium</SelectItem>
                        <SelectItem value="earned-premium">Earned Premium</SelectItem>
                        <SelectItem value="profit-basis">Profit Basis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Payment Terms</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentFrequency">Payment Frequency</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="as-due">As & When Due</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                      <Input
                        id="paymentTerms"
                        type="number"
                        placeholder="30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interestRate">Late Payment Interest (%)</Label>
                      <Input
                        id="interestRate"
                        type="number"
                        step="0.01"
                        placeholder="1.50"
                      />
                    </div>
                  </div>
                </div>

                {/* Currency Specifications */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Currency Specifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="settlementCurrency">Settlement Currency</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="TZS">TZS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exchangeRateBasis">Exchange Rate Basis</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select basis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inception">Inception Date</SelectItem>
                          <SelectItem value="settlement">Settlement Date</SelectItem>
                          <SelectItem value="monthly-average">Monthly Average</SelectItem>
                          <SelectItem value="fixed-rate">Fixed Rate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Loss Participation Details */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Loss Participation Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lossParticipation">Loss Participation (%)</Label>
                      <Input
                        id="lossParticipation"
                        type="number"
                        step="0.01"
                        placeholder="100.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lossCarryForward">Loss Carry Forward</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="limited">Limited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lossAdjustmentExpenses">Loss Adjustment Expenses</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select treatment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="included">Included in Limit</SelectItem>
                          <SelectItem value="excluded">Excluded from Limit</SelectItem>
                          <SelectItem value="pro-rata">Pro Rata</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Standard Coverage and Financial tabs for other contract types */}
        {contractType === "quota" && (
          <TabsContent value="coverage" className="space-y-4">
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
          </TabsContent>
        )}

        {contractType === "quota" && (
          <TabsContent value="financial" className="space-y-4">
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
          </TabsContent>
        )}

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
                          {contract.contractType === 'xol' && contract.xolLayers && (
                            <Badge variant="outline">
                              {contract.xolLayers.length} Layers
                            </Badge>
                          )}
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
                          </div>
                        </div>
                        {contract.contractType === 'xol' && contract.xolLayers && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-blue-900">XOL Layers:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {contract.xolLayers.map((layer, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {layer.name}: {layer.participationPercentage}%
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
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