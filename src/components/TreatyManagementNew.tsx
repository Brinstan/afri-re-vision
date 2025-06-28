import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, FileText, Plus, Calculator, RotateCcw, Download } from "lucide-react";

const TreatyManagementNew = () => {
  const [activeTab, setActiveTab] = useState("premium-booking");
  const [contractNumber, setContractNumber] = useState("");
  const [underwritingYear, setUnderwritingYear] = useState("");
  const [showPremiumForm, setShowPremiumForm] = useState(false);
  const [premiumType, setPremiumType] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [bookedPremium, setBookedPremium] = useState("");
  const [brokeragePercentage, setBrokeragePercentage] = useState("25.00");
  const [taxPercentage, setTaxPercentage] = useState("0.00");
  const [totalAmount, setTotalAmount] = useState("");

  // Sample treaty data
  const treatyData = {
    "MT-2024-001": {
      treatyName: "Motor Treaty 2024",
      brokerageCommission: 25.00,
      cedant: "Century Insurance Ltd",
      inceptionDate: "2024-01-01",
      expiryDate: "2024-12-31"
    }
  };

  const handleContractQuery = () => {
    if (contractNumber && treatyData[contractNumber]) {
      const treaty = treatyData[contractNumber];
      setBrokeragePercentage(treaty.brokerageCommission.toString());
      setShowPremiumForm(true);
    } else {
      alert("Contract not found. Please check the contract number and underwriting year.");
    }
  };

  const calculateAmounts = () => {
    const premium = parseFloat(bookedPremium) || 0;
    const brokerageRate = parseFloat(brokeragePercentage) || 0;
    const taxRate = parseFloat(taxPercentage) || 0;

    const brokerageAmount = (premium * brokerageRate) / 100;
    const vatAmount = (premium * 18) / 100; // 18% VAT
    const taxAmount = (premium * taxRate) / 100;

    return {
      brokerageAmount: brokerageAmount.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2)
    };
  };

  const amounts = calculateAmounts();

  const handleReversal = () => {
    if (confirm("Are you sure you want to reverse this transaction?")) {
      // Reset form
      setPremiumType("");
      setBookedPremium("");
      setTotalAmount("");
      alert("Transaction reversed successfully.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Treaty Management</h2>
          <p className="text-gray-600">Premium booking and monthly returns management</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="premium-booking">Premium Booking</TabsTrigger>
          <TabsTrigger value="monthly-returns">Monthly Returns</TabsTrigger>
          <TabsTrigger value="treaty-search">Treaty Search</TabsTrigger>
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
                <div className="flex space-x-2">
                  <Button onClick={() => setShowPremiumForm(true)}>
                    OK
                  </Button>
                  <Button variant="outline" onClick={handleContractQuery}>
                    <Search className="h-4 w-4 mr-2" />
                    Query
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
                          <SelectItem value="mdp">MDP (Minimum Deposit Premium)</SelectItem>
                          <SelectItem value="reinstatement">Reinstatement Premium</SelectItem>
                          <SelectItem value="adjustment">Adjustment Premium</SelectItem>
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

                  {(premiumType === "mdp" || premiumType === "adjustment") && (
                    <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                      <h4 className="font-medium text-blue-900">Brokerage Calculation</h4>
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
                          <div className="p-2 bg-white rounded border">
                            {currency} {amounts.brokerageAmount}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-medium text-gray-900">Tax Calculations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>VAT on Premium (18%)</Label>
                        <div className="p-2 bg-white rounded border">
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
                        <div className="p-2 bg-white rounded border">
                          {currency} {amounts.taxAmount}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="totalAmount">Total Amount</Label>
                      <Input
                        id="totalAmount"
                        type="number"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        placeholder="Enter total amount"
                        className="font-bold text-lg"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button>
                      <FileText className="h-4 w-4 mr-2" />
                      Confirm Booking
                    </Button>
                    <Button variant="outline" onClick={handleReversal}>
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
                  <Select>
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
                    placeholder="e.g., MT-2024-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="returnType">Return Type</Label>
                  <Select>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="netPremium">Net Premium Earned</Label>
                  <Input
                    id="netPremium"
                    type="number"
                    placeholder="0.00"
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionEarned">Commission Earned</Label>
                  <Input
                    id="commissionEarned"
                    type="number"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="returnNotes">Notes/Comments</Label>
                <Textarea
                  id="returnNotes"
                  placeholder="Enter any additional notes for this return..."
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Calculated Results</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>Loss Ratio: <span className="font-bold">68.5%</span></p>
                    <p>Commission Ratio: <span className="font-bold">25.0%</span></p>
                  </div>
                  <div>
                    <p>Combined Ratio: <span className="font-bold">93.5%</span></p>
                    <p>Profit/Loss: <span className="font-bold text-green-600">+USD 125,000</span></p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Book Return
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treaty-search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Treaty Search & Information</CardTitle>
              <CardDescription>Search and view treaty details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="searchContract">Contract Number</Label>
                  <Input
                    id="searchContract"
                    placeholder="e.g., MT-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="searchYear">Underwriting Year</Label>
                  <Input
                    id="searchYear"
                    placeholder="e.g., 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="searchCedant">Cedant</Label>
                  <Input
                    id="searchCedant"
                    placeholder="e.g., Century Insurance"
                  />
                </div>
              </div>

              <Button>
                <Search className="h-4 w-4 mr-2" />
                Search Treaties
              </Button>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Search Results</h4>
                <div className="space-y-3">
                  <div className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">MT-2024-001 - Motor Treaty 2024</p>
                        <p className="text-sm text-gray-600">Century Insurance Ltd</p>
                        <p className="text-sm text-gray-600">Period: 01/01/2024 - 31/12/2024</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">Active</Badge>
                        <p className="text-sm mt-1">Premium: USD 25.5M</p>
                      </div>
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

export default TreatyManagementNew;