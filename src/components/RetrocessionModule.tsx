
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, TrendingDown, RefreshCw, Plus, Eye } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Retrocession Management</h2>
          <p className="text-gray-600">Automatic retrocession allocation and portfolio protection</p>
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
    </div>
  );
};

export default RetrocessionModule;
