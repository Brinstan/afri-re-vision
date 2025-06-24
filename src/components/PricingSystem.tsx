
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, Brain, Target, Zap, FileText, Download } from "lucide-react";

const PricingSystem = () => {
  const [treatyType, setTreatyType] = useState("quota");
  const [lineOfBusiness, setLineOfBusiness] = useState("motor");
  const [pricingInProgress, setPricingInProgress] = useState(false);
  const [aiConfidence, setAiConfidence] = useState([85]);

  const handleGeneratePricing = () => {
    setPricingInProgress(true);
    setTimeout(() => {
      setPricingInProgress(false);
    }, 4000);
  };

  const pricingMetrics = [
    { label: "Technical Rate", value: "12.5%", benchmark: "Market: 14.2%", status: "competitive" },
    { label: "Commercial Rate", value: "15.8%", benchmark: "Target: 15.0%", status: "optimal" },
    { label: "Expected Loss Ratio", value: "68.5%", benchmark: "Budget: 70.0%", status: "favorable" },
    { label: "Risk Loading", value: "4.2%", benchmark: "Min: 3.0%", status: "adequate" }
  ];

  const layerStructure = [
    { layer: "Working Layer", limit: "5,000,000", retention: "0", rate: "8.5%", premium: "425,000" },
    { layer: "1st Excess", limit: "10,000,000", retention: "5,000,000", rate: "4.2%", premium: "420,000" },
    { layer: "2nd Excess", limit: "15,000,000", retention: "15,000,000", rate: "2.8%", premium: "420,000" },
    { layer: "Cat Cover", limit: "50,000,000", retention: "30,000,000", rate: "1.5%", premium: "750,000" }
  ];

  const riskFactors = [
    { factor: "Geographic Concentration", weight: 0.15, score: 7.2, impact: "Medium" },
    { factor: "Line of Business Mix", weight: 0.20, score: 8.5, impact: "Low" },
    { factor: "Claims Experience", weight: 0.25, score: 6.8, impact: "High" },
    { factor: "Market Conditions", weight: 0.20, score: 7.9, impact: "Medium" },
    { factor: "Regulatory Environment", weight: 0.10, score: 8.2, impact: "Low" },
    { factor: "Currency Risk", weight: 0.10, score: 6.5, impact: "Medium" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI-Powered Pricing System</h2>
          <p className="text-gray-600">Automated treaty and facultative pricing with machine learning</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Pricing History
          </Button>
          <Button onClick={handleGeneratePricing} disabled={pricingInProgress}>
            <Brain className="h-4 w-4 mr-2" />
            {pricingInProgress ? 'Generating...' : 'Generate AI Pricing'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup">Pricing Setup</TabsTrigger>
          <TabsTrigger value="layers">Layer Structure</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="results">Pricing Results</TabsTrigger>
          <TabsTrigger value="comparison">Market Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Treaty Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={treatyType} onValueChange={setTreatyType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quota">Quota Share</SelectItem>
                    <SelectItem value="surplus">Surplus</SelectItem>
                    <SelectItem value="xol">Excess of Loss</SelectItem>
                    <SelectItem value="stoploss">Stop Loss</SelectItem>
                    <SelectItem value="facultative">Facultative</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Line of Business</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={lineOfBusiness} onValueChange={setLineOfBusiness}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motor">Motor</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="marine">Marine</SelectItem>
                    <SelectItem value="aviation">Aviation</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Currency</CardTitle>
              </CardHeader>
              <CardContent>
                <Select defaultValue="usd">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="tzs">TZS</SelectItem>
                    <SelectItem value="kes">KES</SelectItem>
                    <SelectItem value="ugx">UGX</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Inception Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Input type="date" defaultValue="2025-01-01" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Treaty Parameters</CardTitle>
                <CardDescription>Configure treaty structure and limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="retention">Retention (USD)</Label>
                    <Input id="retention" type="number" defaultValue="500000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="limit">Limit (USD)</Label>
                    <Input id="limit" type="number" defaultValue="5000000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cession">Cession %</Label>
                    <Input id="cession" type="number" defaultValue="50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission">Commission %</Label>
                    <Input id="commission" type="number" defaultValue="25" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>Machine learning pricing parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>AI Confidence Level: {aiConfidence[0]}%</Label>
                  <Slider
                    value={aiConfidence}
                    onValueChange={setAiConfidence}
                    max={100}
                    min={50}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="years">Experience Years</Label>
                    <Select defaultValue="5">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Years</SelectItem>
                        <SelectItem value="5">5 Years</SelectItem>
                        <SelectItem value="10">10 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trend">Trend Factor %</Label>
                    <Input id="trend" type="number" step="0.1" defaultValue="2.5" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">
                    <Zap className="h-3 w-3 mr-1" />
                    AI Model Active
                  </Badge>
                  <Badge variant="outline">Last Updated: 2 hours ago</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="layers">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Layer Structure</CardTitle>
              <CardDescription>Configure multiple treaty layers with automatic pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Layer Configuration</h4>
                  <Button size="sm" variant="outline">Add Layer</Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Layer</th>
                        <th className="text-left p-2">Limit</th>
                        <th className="text-left p-2">Retention</th>
                        <th className="text-left p-2">Rate %</th>
                        <th className="text-left p-2">Premium</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {layerStructure.map((layer, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">
                            <Badge variant="outline">{layer.layer}</Badge>
                          </td>
                          <td className="p-2">{layer.limit}</td>
                          <td className="p-2">{layer.retention}</td>
                          <td className="p-2">
                            <Input 
                              type="number" 
                              step="0.1" 
                              defaultValue={layer.rate.replace('%', '')} 
                              className="w-20"
                            />
                          </td>
                          <td className="p-2 font-medium">{layer.premium}</td>
                          <td className="p-2">
                            <Button size="sm" variant="ghost">Edit</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-blue-600">Total Premium</p>
                      <p className="text-xl font-bold text-blue-900">USD 2.015M</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Weighted Rate</p>
                      <p className="text-xl font-bold text-blue-900">4.03%</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Total Capacity</p>
                      <p className="text-xl font-bold text-blue-900">USD 80M</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">ROE Target</p>
                      <p className="text-xl font-bold text-blue-900">15.2%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>AI Risk Assessment</CardTitle>
              <CardDescription>Machine learning risk factor analysis and scoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Overall Risk Score</p>
                    <p className="text-3xl font-bold text-red-900">7.2</p>
                    <p className="text-xs text-red-600">Medium Risk Profile</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600 font-medium">Volatility Index</p>
                    <p className="text-3xl font-bold text-yellow-900">6.8</p>
                    <p className="text-xs text-yellow-600">Above Average</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Stability Score</p>
                    <p className="text-3xl font-bold text-green-900">8.1</p>
                    <p className="text-xs text-green-600">Good Stability</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Risk Factor Breakdown</h4>
                  {riskFactors.map((factor, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{factor.factor}</span>
                        <Badge variant={factor.impact === 'High' ? 'destructive' : factor.impact === 'Medium' ? 'default' : 'secondary'}>
                          {factor.impact} Impact
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${factor.score * 10}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium w-12">{factor.score}/10</span>
                        <span className="text-sm text-gray-500 w-16">{(factor.weight * 100).toFixed(0)}% weight</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Results</CardTitle>
              <CardDescription>AI-generated pricing recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {pricingMetrics.map((metric, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">{metric.label}</span>
                        <Badge 
                          variant={metric.status === 'optimal' ? 'default' : metric.status === 'favorable' ? 'secondary' : 'outline'}
                        >
                          {metric.status}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <p className="text-xs text-gray-500">{metric.benchmark}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">AI Recommendation Summary</h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium text-green-600">✓ Recommended:</span> The AI model suggests proceeding with this pricing structure based on {aiConfidence[0]}% confidence level.
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-blue-600">→ Key Factors:</span> Strong claims experience, stable market conditions, and appropriate risk loading support this pricing.
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-orange-600">⚠ Watch:</span> Monitor geographic concentration and currency fluctuations for potential adjustments.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button className="flex-1">
                    <Target className="h-4 w-4 mr-2" />
                    Accept AI Pricing
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Modify Parameters
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Market Comparison</CardTitle>
              <CardDescription>Benchmark against market rates and competitor pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Our Pricing</h4>
                    <p className="text-2xl font-bold text-blue-600">15.8%</p>
                    <p className="text-sm text-gray-500">Commercial Rate</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Market Average</h4>
                    <p className="text-2xl font-bold text-gray-600">16.2%</p>
                    <p className="text-sm text-gray-500">Industry Benchmark</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Competitive Edge</h4>
                    <p className="text-2xl font-bold text-green-600">-0.4%</p>
                    <p className="text-sm text-gray-500">Below Market</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Market Intelligence</h4>
                  <div className="space-y-2 text-sm">
                    <p>• Motor rates in East Africa have stabilized at 15-17% range</p>
                    <p>• Swiss Re's latest pricing for similar portfolios: 16.5%</p>
                    <p>• Local reinsurers are pricing at 15.5-16.8% range</p>
                    <p>• Recent large losses have pushed market rates up by 0.5%</p>
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

export default PricingSystem;
