import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, TrendingDown, RefreshCw, Plus, Eye, Search, FileText, Download } from "lucide-react";

const RetrocessionModule = () => {
  const [autoAllocation, setAutoAllocation] = useState(true);

  const retroProgram = [
    { id: "RC-CAT-001", type: "Catastrophe XOL", layer: "250M xs 50M", premium: "12,500,000", attachment: 85, coverage: ["Motor", "Property", "Marine"] },
    { id: "RC-QS-001", type: "Quota Share", layer: "25% of Portfolio", premium: "28,750,000", attachment: 0, coverage: ["All Lines"] },
    { id: "RC-SL-001", type: "Stop Loss", layer: "90% xs 80%", premium: "8,200,000", attachment: 80, coverage: ["All Lines"] },
    { id: "RC-WXL-001", type: "Working XOL", layer: "5M xs 2M", premium: "6,500,000", attachment: 75, coverage: ["Motor", "Liability"] }
  ];

  const treatyAllocations = [
    { treatyId: "MT-2024-001", treatyType: "Motor Treaty", gross: "25,500,000", retroCeded: "6,375,000", net: "19,125,000", allocation: 75 },
    { treatyId: "PT-2024-002", treatyType: "Property XOL", gross: "18,750,000", retroCeded: "4,687,500", net: "14,062,500", allocation: 75 },
    { treatyId: "MAR-2024-003", treatyType: "Marine Treaty", gross: "12,200,000", retroCeded: "3,050,000", net: "9,150,000", allocation: 75 }
  ];

  // Sample retro treaties data (moved from Claims)
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
    },
    {
      outwardPolicyNumber: "OUT-2024-003",
      underwritingYear: "2024", 
      treatyName: "Working XOL Retro",
      reinsurer: "Lloyd's Syndicate",
      coverage: "5M xs 2M",
      premium: 6500000,
      commission: 12.5
    }
  ];

  // Sample treaty data for inward display (moved from Claims)
  const treatyData = {
    "12345": {
      treatyName: "Motor Treaty 2024",
      cedant: "Century Insurance Ltd",
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
      cedant: "National Insurance Corp",
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
      cedant: "Jubilee Insurance",
      participationShare: 60,
      retroPercentage: 20,
      broker: "Willis Towers Watson",
      country: "Kenya",
      insuredName: "East Africa Shipping",
      claimsPaid: 3200000,
      totalClaims: 5
    }
  ];

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
          <h2 className="text-2xl font-bold text-gray-900">Retrocession Management</h2>
          <p className="text-gray-600">Comprehensive retrocession allocation and portfolio protection</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalculate Allocations
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Retro Cover
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Retro Premium</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$55.95M</div>
            <p className="text-xs text-muted-foreground">Annual retrocession cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Retention</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68.5%</div>
            <p className="text-xs text-muted-foreground">After retrocession</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Layers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retroProgram.length}</div>
            <p className="text-xs text-muted-foreground">Active retro covers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Allocation</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {autoAllocation ? "ON" : "OFF"}
            </div>
            <p className="text-xs text-muted-foreground">Real-time allocation</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="program-structure" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="program-structure">Program Structure</TabsTrigger>
          <TabsTrigger value="new-outward">New Outward</TabsTrigger>
          <TabsTrigger value="outward-display">Outward Display</TabsTrigger>
          <TabsTrigger value="inward-display">Inward Display</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="program-structure" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Retrocession Program Structure</CardTitle>
                <CardDescription>Company's retrocession protection layers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {retroProgram.map((cover) => (
                    <div key={cover.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{cover.type}</h4>
                          <p className="text-sm text-gray-600">{cover.layer}</p>
                        </div>
                        <Badge variant="secondary">
                          {cover.attachment > 0 ? `${cover.attachment}% Attachment` : 'Working Layer'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Annual Premium</p>
                          <p className="font-medium">USD {parseInt(cover.premium).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Coverage Lines</p>
                          <div className="flex flex-wrap gap-1">
                            {cover.coverage.map((line, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {line}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Utilization</span>
                          <span>{Math.round(Math.random() * 40 + 30)}%</span>
                        </div>
                        <Progress value={Math.round(Math.random() * 40 + 30)} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automatic Treaty Allocation</CardTitle>
                <CardDescription>Real-time allocation of cedant treaties to retrocession</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">Auto-Allocation Status</span>
                    <Badge className={autoAllocation ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {autoAllocation ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </div>

                  {treatyAllocations.map((treaty) => (
                    <div key={treaty.treatyId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{treaty.treatyId}</h4>
                          <p className="text-sm text-gray-600">{treaty.treatyType}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Gross Premium</p>
                          <p className="font-medium text-sm">USD {parseInt(treaty.gross).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Retro Ceded</p>
                          <p className="font-medium text-sm">USD {parseInt(treaty.retroCeded).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Net Retained</p>
                          <p className="font-medium text-sm">USD {parseInt(treaty.net).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Net Retention Ratio</span>
                          <span>{treaty.allocation}%</span>
                        </div>
                        <Progress value={treaty.allocation} className="h-2" />
                      </div>

                      <div className="mt-3 text-xs text-gray-600">
                        <p>✓ Automatically allocated to retrocession covers based on program structure</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="new-outward" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Outward Retrocession</CardTitle>
              <CardDescription>Create new outward retrocession arrangements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retroType">Retrocession Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quota-share">Quota Share</SelectItem>
                      <SelectItem value="surplus">Surplus</SelectItem>
                      <SelectItem value="xol">Excess of Loss</SelectItem>
                      <SelectItem value="cat-xol">Catastrophe XOL</SelectItem>
                      <SelectItem value="stop-loss">Stop Loss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reinsurer">Reinsurer</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reinsurer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="swiss-re">Swiss Re</SelectItem>
                      <SelectItem value="munich-re">Munich Re</SelectItem>
                      <SelectItem value="lloyds">Lloyd's of London</SelectItem>
                      <SelectItem value="hannover-re">Hannover Re</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="limit">Limit</Label>
                  <Input id="limit" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Retention</Label>
                  <Input id="retention" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="premium">Premium</Label>
                  <Input id="premium" type="number" placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission %</Label>
                  <Input id="commission" type="number" step="0.01" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inceptionDate">Inception Date</Label>
                  <Input id="inceptionDate" type="date" />
                </div>
              </div>

              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Outward Treaty
              </Button>
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
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              Export
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retrocession Configuration</CardTitle>
              <CardDescription>Configure automatic allocation rules and thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allocationMethod">Allocation Method</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proportional">Proportional</SelectItem>
                      <SelectItem value="priority">Priority Based</SelectItem>
                      <SelectItem value="risk-based">Risk Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autoThreshold">Auto Allocation Threshold</Label>
                  <Input id="autoThreshold" type="number" placeholder="1000000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxRetention">Maximum Net Retention %</Label>
                  <Input id="maxRetention" type="number" placeholder="75" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reinstatement">Reinstatement Handling</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="manual">Manual Review</SelectItem>
                      <SelectItem value="conditional">Conditional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Automatic Allocation Rules</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>• All new treaties automatically allocated to retrocession covers upon binding</p>
                  <p>• Claims automatically trigger retrocession recoveries based on treaty structure</p>
                  <p>• Real-time net retention monitoring with automated alerts for threshold breaches</p>
                  <p>• Proportional allocation across multiple retro covers based on coverage limits</p>
                  <p>• IFRS 17 impact automatically calculated and reflected in financial reporting</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RetrocessionModule;