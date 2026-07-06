
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, Brain, Target, Zap, FileText, Download, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";

const PricingSystem = () => {
  const [treatyType, setTreatyType] = useState("quota");
  const [lineOfBusiness, setLineOfBusiness] = useState("motor");
  const [pricingInProgress, setPricingInProgress] = useState(false);
  const [aiConfidence, setAiConfidence] = useState([85]);
  const [activeTab, setActiveTab] = useState("setup");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pricingHistory, setPricingHistory] = useState<Array<{ date: string; treatyType: string; lineOfBusiness: string; confidence: number; outcome: string }>>([]);

  const handleGeneratePricing = () => {
    setPricingInProgress(true);
    setTimeout(() => {
      setPricingInProgress(false);
      setPricingHistory(prev => [...prev, {
        date: new Date().toLocaleString(),
        treatyType,
        lineOfBusiness,
        confidence: aiConfidence[0],
        outcome: 'Generated'
      }]);
      setActiveTab("results");
      toast.success("AI pricing generated — review the results tab");
    }, 4000);
  };

  const handleAcceptPricing = () => {
    setPricingHistory(prev => [...prev, {
      date: new Date().toLocaleString(),
      treatyType,
      lineOfBusiness,
      confidence: aiConfidence[0],
      outcome: 'Accepted'
    }]);
    toast.success("AI pricing accepted and recorded in pricing history");
  };

  const handleExportPricingReport = () => {
    const lines = [
      'AI PRICING REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      `Treaty Type: ${treatyType}`,
      `Line of Business: ${lineOfBusiness}`,
      `AI Confidence: ${aiConfidence[0]}%`,
      '',
      'PRICING METRICS',
      ...pricingMetrics.map(m => `${m.label}: ${m.value} (${m.benchmark})`),
      '',
      'LAYER STRUCTURE',
      ...layers.map(l => `${l.layer}: limit ${l.limit}, retention ${l.retention}, rate ${l.rate}%, premium USD ${layerPremium(l).toLocaleString()}`)
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-pricing-report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Pricing report exported");
  };

  const pricingMetrics = [
    { label: "Technical Rate", value: "12.5%", benchmark: "Market: 14.2%", status: "competitive" },
    { label: "Commercial Rate", value: "15.8%", benchmark: "Target: 15.0%", status: "optimal" },
    { label: "Expected Loss Ratio", value: "68.5%", benchmark: "Budget: 70.0%", status: "favorable" },
    { label: "Risk Loading", value: "4.2%", benchmark: "Min: 3.0%", status: "adequate" }
  ];

  const [layers, setLayers] = useState([
    { id: 1, layer: "Working Layer", limit: 5000000, retention: 0, rate: 8.5 },
    { id: 2, layer: "1st Excess", limit: 10000000, retention: 5000000, rate: 4.2 },
    { id: 3, layer: "2nd Excess", limit: 15000000, retention: 15000000, rate: 2.8 },
    { id: 4, layer: "Cat Cover", limit: 50000000, retention: 30000000, rate: 1.5 }
  ]);

  const layerPremium = (layer: { limit: number; rate: number }) => Math.round(layer.limit * layer.rate / 100);
  const totalLayerPremium = layers.reduce((sum, l) => sum + layerPremium(l), 0);

  const handleAddLayer = () => {
    const last = layers[layers.length - 1];
    setLayers([...layers, {
      id: Date.now(),
      layer: `Layer ${layers.length + 1}`,
      limit: 10000000,
      retention: last ? last.retention + last.limit : 0,
      rate: 1.0
    }]);
    toast.success("Layer added — adjust its limit and rate");
  };

  const handleRemoveLayer = (id: number) => {
    if (layers.length <= 1) {
      toast.error("At least one layer is required");
      return;
    }
    setLayers(layers.filter(l => l.id !== id));
  };

  const updateLayerRate = (id: number, rate: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, rate: parseFloat(rate) || 0 } : l));
  };

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
          <Button variant="outline" onClick={() => setHistoryOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Pricing History
          </Button>
          <Button onClick={handleGeneratePricing} disabled={pricingInProgress}>
            <Brain className="h-4 w-4 mr-2" />
            {pricingInProgress ? 'Generating...' : 'Generate AI Pricing'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                  <Button size="sm" variant="outline" onClick={handleAddLayer}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Layer
                  </Button>
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
                      {layers.map((layer) => (
                        <tr key={layer.id} className="border-b">
                          <td className="p-2">
                            <Badge variant="outline">{layer.layer}</Badge>
                          </td>
                          <td className="p-2">{layer.limit.toLocaleString()}</td>
                          <td className="p-2">{layer.retention.toLocaleString()}</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="0.1"
                              value={layer.rate}
                              onChange={(e) => updateLayerRate(layer.id, e.target.value)}
                              className="w-20"
                            />
                          </td>
                          <td className="p-2 font-medium">{layerPremium(layer).toLocaleString()}</td>
                          <td className="p-2">
                            <Button size="sm" variant="ghost" onClick={() => handleRemoveLayer(layer.id)}>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
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
                      <p className="text-xl font-bold text-blue-900">USD {(totalLayerPremium / 1000000).toFixed(3)}M</p>
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
                  <Button className="flex-1" onClick={handleAcceptPricing}>
                    <Target className="h-4 w-4 mr-2" />
                    Accept AI Pricing
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setActiveTab("setup")}>
                    Modify Parameters
                  </Button>
                  <Button variant="outline" onClick={handleExportPricingReport}>
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

      {/* Pricing History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pricing History</DialogTitle>
            <DialogDescription>AI pricing runs recorded during this session</DialogDescription>
          </DialogHeader>
          {pricingHistory.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pricingHistory.slice().reverse().map((entry, index) => (
                <div key={index} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                  <div>
                    <p className="font-medium capitalize">{entry.treatyType} — {entry.lineOfBusiness}</p>
                    <p className="text-muted-foreground text-xs">{entry.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{entry.confidence}% confidence</Badge>
                    <Badge variant={entry.outcome === 'Accepted' ? 'secondary' : 'outline'}>{entry.outcome}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No pricing runs recorded yet.</p>
              <p className="text-sm">Use "Generate AI Pricing" to create your first pricing run.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingSystem;
