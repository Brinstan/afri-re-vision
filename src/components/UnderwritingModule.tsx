
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
import { Plus, FileText, Save, Eye, Users, Building } from "lucide-react";

const UnderwritingModule = () => {
  const [contractType, setContractType] = useState("quota");
  const [selectedLines, setSelectedLines] = useState([]);
  const [brokers, setBrokers] = useState([{ id: 1, name: "", reference: "", commission: "" }]);
  const [cedants, setCedants] = useState([{ id: 1, name: "", reference: "", country: "" }]);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Underwriting Module</h2>
          <p className="text-gray-600">Comprehensive treaty and policy underwriting</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview Contract
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save & Submit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="contract" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="contract">Contract Details</TabsTrigger>
          <TabsTrigger value="parties">Parties & Brokers</TabsTrigger>
          <TabsTrigger value="coverage">Coverage Terms</TabsTrigger>
          <TabsTrigger value="financial">Financial Terms</TabsTrigger>
          <TabsTrigger value="clauses">Clauses & Conditions</TabsTrigger>
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
                  <Input id="contractNumber" placeholder="Auto-generated" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="underwritingYear">Underwriting Year</Label>
                  <Input id="underwritingYear" type="number" defaultValue="2024" />
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
                <div className="space-y-2">
                  <Label htmlFor="portfolioType">Portfolio Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select portfolio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="treaty">Treaty</SelectItem>
                      <SelectItem value="facultative">Facultative</SelectItem>
                      <SelectItem value="binding">Binding Authority</SelectItem>
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
                  <Input id="inceptionDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input id="expiryDate" type="date" />
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
                <CardTitle className="text-lg">Processing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label htmlFor="newBusinessInd">New Business Indicator</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select indicator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Business</SelectItem>
                      <SelectItem value="renewal">Renewal</SelectItem>
                      <SelectItem value="amendment">Amendment</SelectItem>
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

          {contractType === 'surplus' && (
            <Card>
              <CardHeader>
                <CardTitle>Surplus Lines Terms</CardTitle>
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
                    <Label htmlFor="surplusCommission">Commission Rate %</Label>
                    <Input id="surplusCommission" type="number" step="0.01" placeholder="25.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLine">Maximum Line</Label>
                    <Input id="maxLine" type="number" placeholder="10000000" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {contractType === 'xol' && (
            <Card>
              <CardHeader>
                <CardTitle>Excess of Loss Structure</CardTitle>
                <CardDescription>Multi-line XOL coverage combining selected lines of business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="xolLimit">Layer Limit</Label>
                    <Input id="xolLimit" type="number" placeholder="5000000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="xolRetention">Retention/Priority</Label>
                    <Input id="xolRetention" type="number" placeholder="500000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="xolRate">Rate on Line %</Label>
                    <Input id="xolRate" type="number" step="0.01" placeholder="8.50" />
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium text-blue-900">Coverage Structure:</p>
                  <p className="text-sm text-blue-800">
                    USD 5,000,000 excess of USD 500,000 for combined lines: Motor, Accident & Liability
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

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
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="TZS">TZS</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
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
      </Tabs>
    </div>
  );
};

export default UnderwritingModule;
