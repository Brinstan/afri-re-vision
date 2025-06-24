
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, Eye, Calculator, TrendingUp, AlertCircle } from "lucide-react";

const IfrsReporting = () => {
  const [reportingPeriod, setReportingPeriod] = useState("2024-Q4");
  const [reportType, setReportType] = useState("full");
  const [generationProgress, setGenerationProgress] = useState(0);

  const paaContracts = [
    { id: "MT-2024-001", type: "Motor Treaty", model: "PAA", premium: "25,500,000", status: "Active" },
    { id: "PT-2024-002", type: "Property XOL", model: "PAA", premium: "18,750,000", status: "Active" },
    { id: "MAR-2024-003", type: "Marine Treaty", model: "PAA", premium: "12,200,000", status: "Active" }
  ];

  const gmmContracts = [
    { id: "LT-2024-001", type: "Life Treaty", model: "GMM", premium: "45,000,000", status: "Active" },
    { id: "INV-2024-002", type: "Investment Contract", model: "GMM", premium: "35,000,000", status: "Active" }
  ];

  const retrocessionProgram = [
    { id: "RC-2024-001", type: "Cat XOL", coverage: "250M xs 50M", premium: "12,500,000", reinsurer: "Swiss Re" },
    { id: "RC-2024-002", type: "Quota Share", coverage: "25% of Portfolio", premium: "28,750,000", reinsurer: "Munich Re" },
    { id: "RC-2024-003", type: "Stop Loss", coverage: "90% xs 80%", premium: "8,200,000", reinsurer: "Lloyd's" }
  ];

  const generateReport = () => {
    setGenerationProgress(0);
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">IFRS 17 Reporting</h2>
          <p className="text-gray-600">Comprehensive IFRS 17 compliance reporting and analysis</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview Report
          </Button>
          <Button onClick={generateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate IFRS 17 Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PAA Contracts</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paaContracts.length}</div>
            <p className="text-xs text-muted-foreground">Premium Allocation Approach</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GMM Contracts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gmmContracts.length}</div>
            <p className="text-xs text-muted-foreground">General Measurement Model</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retro Coverage</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retrocessionProgram.length}</div>
            <p className="text-xs text-muted-foreground">Active retrocession covers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total CSM</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45.2M</div>
            <p className="text-xs text-muted-foreground">Contractual Service Margin</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">Report Configuration</TabsTrigger>
          <TabsTrigger value="paa">PAA Analysis</TabsTrigger>
          <TabsTrigger value="gmm">GMM Analysis</TabsTrigger>
          <TabsTrigger value="retrocession">Retrocession Impact</TabsTrigger>
          <TabsTrigger value="generation">Report Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reporting Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reporting Period</label>
                  <Select value={reportingPeriod} onValueChange={setReportingPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-Q1">2024 Q1</SelectItem>
                      <SelectItem value="2024-Q2">2024 Q2</SelectItem>
                      <SelectItem value="2024-Q3">2024 Q3</SelectItem>
                      <SelectItem value="2024-Q4">2024 Q4</SelectItem>
                      <SelectItem value="2024-FY">2024 Full Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full IFRS 17 Report</SelectItem>
                      <SelectItem value="summary">Executive Summary</SelectItem>
                      <SelectItem value="technical">Technical Analysis</SelectItem>
                      <SelectItem value="regulatory">Regulatory Submission</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Output Format</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="word">Microsoft Word</SelectItem>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="excel">Excel Workbook</SelectItem>
                      <SelectItem value="xml">XML (Regulatory)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Underwriting Data</span>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Claims Data</span>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accounting Data</span>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Retrocession Data</span>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Market Data</span>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Validation Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Completeness</span>
                    <Badge className="bg-green-100 text-green-800">98.5%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cohort Classification</span>
                    <Badge className="bg-green-100 text-green-800">Valid</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CSM Calculation</span>
                    <Badge className="bg-green-100 text-green-800">Valid</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Risk Adjustment</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="paa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Premium Allocation Approach (PAA) Contracts</CardTitle>
              <CardDescription>Short-duration contracts eligible for simplified measurement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Contract ID</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-left p-3">Premium</th>
                        <th className="text-left p-3">Coverage Period</th>
                        <th className="text-left p-3">Liability Adequacy</th>
                        <th className="text-left p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paaContracts.map((contract) => (
                        <tr key={contract.id} className="border-b">
                          <td className="p-3 font-medium">{contract.id}</td>
                          <td className="p-3">{contract.type}</td>
                          <td className="p-3">USD {parseInt(contract.premium).toLocaleString()}</td>
                          <td className="p-3">≤ 1 Year</td>
                          <td className="p-3">
                            <Badge className="bg-green-100 text-green-800">Adequate</Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary">{contract.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Total PAA Premium</p>
                    <p className="text-2xl font-bold text-blue-900">USD 56.45M</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Unearned Premium</p>
                    <p className="text-2xl font-bold text-green-900">USD 23.18M</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-orange-900">Loss Component</p>
                    <p className="text-2xl font-bold text-orange-900">USD 0.00</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gmm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Measurement Model (GMM) Contracts</CardTitle>
              <CardDescription>Long-duration contracts requiring full IFRS 17 measurement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Contract ID</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-left p-3">Premium</th>
                        <th className="text-left p-3">CSM</th>
                        <th className="text-left p-3">Risk Adjustment</th>
                        <th className="text-left p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gmmContracts.map((contract) => (
                        <tr key={contract.id} className="border-b">
                          <td className="p-3 font-medium">{contract.id}</td>
                          <td className="p-3">{contract.type}</td>
                          <td className="p-3">USD {parseInt(contract.premium).toLocaleString()}</td>
                          <td className="p-3">USD 18.5M</td>
                          <td className="p-3">USD 4.2M</td>
                          <td className="p-3">
                            <Badge variant="secondary">{contract.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">Total CSM</p>
                    <p className="text-2xl font-bold text-purple-900">USD 45.2M</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-red-900">Risk Adjustment</p>
                    <p className="text-2xl font-bold text-red-900">USD 12.8M</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-indigo-900">Fulfillment CF</p>
                    <p className="text-2xl font-bold text-indigo-900">USD 58.0M</p>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-teal-900">BEL</p>
                    <p className="text-2xl font-bold text-teal-900">USD 102.6M</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retrocession" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retrocession Program Impact</CardTitle>
              <CardDescription>Automatic allocation of retrocession based on company's retro program</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Retro Cover ID</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-left p-3">Coverage</th>
                        <th className="text-left p-3">Premium</th>
                        <th className="text-left p-3">Reinsurer</th>
                        <th className="text-left p-3">Auto Allocation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retrocessionProgram.map((retro) => (
                        <tr key={retro.id} className="border-b">
                          <td className="p-3 font-medium">{retro.id}</td>
                          <td className="p-3">{retro.type}</td>
                          <td className="p-3">{retro.coverage}</td>
                          <td className="p-3">USD {parseInt(retro.premium).toLocaleString()}</td>
                          <td className="p-3">{retro.reinsurer}</td>
                          <td className="p-3">
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Automatic Retrocession Allocation</h4>
                  <div className="space-y-2 text-sm">
                    <p>• All treaty business automatically allocated to retrocession covers based on program structure</p>
                    <p>• Claims automatically trigger retrocession recoveries per treaty terms</p>
                    <p>• Net retention calculated in real-time considering all retro layers</p>
                    <p>• IFRS 17 measurement adjusted for retrocession impact on CSM and risk adjustment</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IFRS 17 Report Generation</CardTitle>
              <CardDescription>Generate comprehensive Word document with all IFRS 17 requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {generationProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Report Generation Progress</span>
                    <span className="text-sm">{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} className="w-full" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Report Sections</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Executive Summary</span>
                      <Badge variant="outline">Included</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>PAA Analysis</span>
                      <Badge variant="outline">Included</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>GMM Calculations</span>
                      <Badge variant="outline">Included</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>CSM Movements</span>
                      <Badge variant="outline">Included</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Risk Adjustment</span>
                      <Badge variant="outline">Included</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Retrocession Impact</span>
                      <Badge variant="outline">Included</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Compliance Checklist</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Contract Identification</span>
                      <Badge className="bg-green-100 text-green-800">✓ Complete</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Measurement Model Selection</span>
                      <Badge className="bg-green-100 text-green-800">✓ Complete</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Discount Rate Determination</span>
                      <Badge className="bg-green-100 text-green-800">✓ Complete</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Risk Adjustment Calculation</span>
                      <Badge className="bg-green-100 text-green-800">✓ Complete</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Transition Requirements</span>
                      <Badge className="bg-green-100 text-green-800">✓ Complete</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button className="flex-1" onClick={generateReport}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Full Report
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IfrsReporting;
