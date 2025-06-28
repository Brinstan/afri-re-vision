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
import { Search, FileText, Plus, Calculator, RotateCcw, Download, Eye } from "lucide-react";

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
    "12345": {
      treatyName: "Motor Treaty 2024",
      brokerageCommission: 25.00,
      cedant: "Century Insurance Ltd",
      inceptionDate: "2024-01-01",
      expiryDate: "2024-12-31",
      participationShare: 50,
      retroPercentage: 25,
      broker: "AON Tanzania",
      country: "Tanzania",
      insuredName: "ABC Transport Ltd",
      claimsPaid: 2500000,
      totalClaims: 3
    },
    "12346": {
      treatyName: "Property XOL 2024",
      brokerageCommission: 20.00,
      cedant: "National Insurance Corp",
      inceptionDate: "2024-01-01",
      expiryDate: "2024-12-31",
      participationShare: 75,
      retroPercentage: 30,
      broker: "Marsh Tanzania",
      country: "Tanzania",
      insuredName: "XYZ Manufacturing",
      claimsPaid: 1800000,
      totalClaims: 2
    },
    "12347": {
      treatyName: "Marine Treaty 2024",
      brokerageCommission: 22.50,
      cedant: "Jubilee Insurance",
      inceptionDate: "2024-06-01",
      expiryDate: "2025-05-31",
      participationShare: 60,
      retroPercentage: 20,
      broker: "Willis Towers Watson",
      country: "Kenya",
      insuredName: "East Africa Shipping",
      claimsPaid: 3200000,
      totalClaims: 5
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
          <h2 className="text-2xl font-bold text-gray-900">Treaty Management</h2>
          <p className="text-gray-600">Premium booking, monthly returns, and inward treaty management</p>
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
                    placeholder="e.g., 12345"
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

        <TabsContent value="inward-display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inward Treaty Display (Formerly Treaty Search)</CardTitle>
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
                      <TableHead>Country</TableHead>
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
                        <TableCell>{treaty.country}</TableCell>
                        <TableCell>{treaty.retroPercentage}%</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">USD {treaty.claimsPaid.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{treaty.totalClaims} claims total</p>
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

              {/* Detailed Treaty Information Display */}
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-900">Treaty Details</CardTitle>
                  <CardDescription className="text-blue-700">
                    Comprehensive information for selected treaty
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Underwriting Details</h4>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p><strong>Participation Share:</strong> 50%</p>
                        <p><strong>Commission Rate:</strong> 25%</p>
                        <p><strong>Period:</strong> 01/01/2024 - 31/12/2024</p>
                        <p><strong>Premium:</strong> USD 25.5M</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Retro Allocation</h4>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p><strong>Retro Percentage:</strong> 25%</p>
                        <p><strong>Net Retention:</strong> 75%</p>
                        <p><strong>Retro Premium:</strong> USD 6.375M</p>
                        <p><strong>Net Premium:</strong> USD 19.125M</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Claims Information</h4>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p><strong>Total Claims:</strong> 3</p>
                        <p><strong>Claims Paid:</strong> USD 2.5M</p>
                        <p><strong>Outstanding:</strong> USD 0</p>
                        <p><strong>Loss Ratio:</strong> 9.8%</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-blue-200 pt-4">
                    <h4 className="font-medium text-blue-900 mb-2">Individual Claims Details</h4>
                    <div className="space-y-2">
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">Claim #TAN/MV/TTY/2024/0001</p>
                            <p className="text-xs text-gray-600">Date of Loss: 2024-11-15</p>
                            <p className="text-xs text-gray-600">Insured: ABC Transport Ltd</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">USD 850,000</p>
                            <Badge variant="secondary" className="text-xs">Settled</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">Claim #TAN/MV/TTY/2024/0002</p>
                            <p className="text-xs text-gray-600">Date of Loss: 2024-10-08</p>
                            <p className="text-xs text-gray-600">Insured: ABC Transport Ltd</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">USD 1,650,000</p>
                            <Badge variant="secondary" className="text-xs">Settled</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TreatyManagementNew;