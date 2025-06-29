import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Target, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Eye,
  Calculator,
  DollarSign,
  Shield,
  Activity,
  FileText,
  Filter
} from "lucide-react";
import { useDataStore } from './DataStore';

const PortfolioAnalysis = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [analysisType, setAnalysisType] = useState("comprehensive");
  const [timeframe, setTimeframe] = useState("ytd");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [filterLob, setFilterLob] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");

  const { treaties, claims } = useDataStore();

  // Portfolio Performance Calculations
  const calculatePortfolioMetrics = () => {
    const totalPremium = treaties.reduce((sum, treaty) => sum + treaty.premium, 0);
    const totalClaims = claims.reduce((sum, claim) => sum + claim.claimAmount, 0);
    const lossRatio = totalPremium > 0 ? (totalClaims / totalPremium) * 100 : 0;
    const combinedRatio = lossRatio + 25; // Assuming 25% expense ratio
    const profitMargin = 100 - combinedRatio;
    
    return {
      totalPremium,
      totalClaims,
      lossRatio,
      combinedRatio,
      profitMargin,
      treatyCount: treaties.length,
      claimCount: claims.length
    };
  };

  // Line of Business Analysis
  const analyzeByLineOfBusiness = () => {
    const lobAnalysis = {};
    
    treaties.forEach(treaty => {
      if (treaty.lineOfBusiness && Array.isArray(treaty.lineOfBusiness)) {
        treaty.lineOfBusiness.forEach(lob => {
          if (!lobAnalysis[lob]) {
            lobAnalysis[lob] = {
              premium: 0,
              claims: 0,
              treatyCount: 0,
              avgPremium: 0,
              lossRatio: 0,
              profitability: 'Good'
            };
          }
          
          lobAnalysis[lob].premium += treaty.premium;
          lobAnalysis[lob].treatyCount += 1;
          
          // Calculate claims for this LOB
          const treatyClaims = claims
            .filter(claim => claim.treatyId === treaty.id)
            .reduce((sum, claim) => sum + claim.claimAmount, 0);
          
          lobAnalysis[lob].claims += treatyClaims;
        });
      }
    });

    // Calculate derived metrics
    Object.keys(lobAnalysis).forEach(lob => {
      const data = lobAnalysis[lob];
      data.avgPremium = data.premium / data.treatyCount;
      data.lossRatio = data.premium > 0 ? (data.claims / data.premium) * 100 : 0;
      data.profitability = data.lossRatio < 60 ? 'Excellent' : 
                          data.lossRatio < 80 ? 'Good' : 
                          data.lossRatio < 100 ? 'Fair' : 'Poor';
    });

    return lobAnalysis;
  };

  // Geographic Analysis
  const analyzeByGeography = () => {
    const geoAnalysis = {};
    
    treaties.forEach(treaty => {
      const country = treaty.country || 'Unknown';
      if (!geoAnalysis[country]) {
        geoAnalysis[country] = {
          premium: 0,
          claims: 0,
          treatyCount: 0,
          marketShare: 0,
          riskLevel: 'Medium'
        };
      }
      
      geoAnalysis[country].premium += treaty.premium;
      geoAnalysis[country].treatyCount += 1;
      
      const treatyClaims = claims
        .filter(claim => claim.treatyId === treaty.id)
        .reduce((sum, claim) => sum + claim.claimAmount, 0);
      
      geoAnalysis[country].claims += treatyClaims;
    });

    const totalPremium = Object.values(geoAnalysis).reduce((sum, geo) => sum + geo.premium, 0);
    
    Object.keys(geoAnalysis).forEach(country => {
      const data = geoAnalysis[country];
      data.marketShare = totalPremium > 0 ? (data.premium / totalPremium) * 100 : 0;
      const lossRatio = data.premium > 0 ? (data.claims / data.premium) * 100 : 0;
      data.riskLevel = lossRatio < 50 ? 'Low' : lossRatio < 80 ? 'Medium' : 'High';
    });

    return geoAnalysis;
  };

  // Risk Assessment
  const performRiskAssessment = () => {
    const riskMetrics = {
      concentrationRisk: 0,
      geographicRisk: 0,
      lobRisk: 0,
      overallRisk: 'Medium',
      recommendations: []
    };

    const lobAnalysis = analyzeByLineOfBusiness();
    const geoAnalysis = analyzeByGeography();
    const totalPremium = treaties.reduce((sum, treaty) => sum + treaty.premium, 0);

    // Concentration Risk (largest treaty as % of total)
    if (treaties.length > 0) {
      const largestTreaty = Math.max(...treaties.map(t => t.premium));
      riskMetrics.concentrationRisk = totalPremium > 0 ? (largestTreaty / totalPremium) * 100 : 0;
    }

    // Geographic Risk (Herfindahl Index)
    const geoShares = Object.values(geoAnalysis).map(geo => geo.marketShare / 100);
    riskMetrics.geographicRisk = geoShares.reduce((sum, share) => sum + (share * share), 0) * 100;

    // LOB Risk (based on loss ratios)
    const lobValues = Object.values(lobAnalysis);
    if (lobValues.length > 0) {
      const avgLossRatio = lobValues.reduce((sum, lob) => sum + lob.lossRatio, 0) / lobValues.length;
      riskMetrics.lobRisk = avgLossRatio;

      // Overall Risk Assessment
      if (riskMetrics.concentrationRisk > 30 || riskMetrics.geographicRisk > 25 || avgLossRatio > 80) {
        riskMetrics.overallRisk = 'High';
      } else if (riskMetrics.concentrationRisk > 20 || riskMetrics.geographicRisk > 15 || avgLossRatio > 60) {
        riskMetrics.overallRisk = 'Medium';
      } else {
        riskMetrics.overallRisk = 'Low';
      }

      // Generate Recommendations
      if (riskMetrics.concentrationRisk > 25) {
        riskMetrics.recommendations.push("Consider diversifying large treaty exposures");
      }
      if (riskMetrics.geographicRisk > 20) {
        riskMetrics.recommendations.push("Expand geographic diversification");
      }
      if (avgLossRatio > 75) {
        riskMetrics.recommendations.push("Review pricing strategy for high loss ratio lines");
      }
    }

    return riskMetrics;
  };

  // Performance Trends
  const calculatePerformanceTrends = () => {
    const trends = {
      premiumGrowth: 12.5,
      claimsGrowth: 8.3,
      profitabilityTrend: 'Improving',
      marketPosition: 'Strong',
      efficiency: 85.2
    };

    return trends;
  };

  // Run Comprehensive Analysis
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate analysis processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Portfolio analysis completed successfully");
    } catch (error) {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export Analysis Report
  const exportAnalysis = (format) => {
    const metrics = calculatePortfolioMetrics();
    const lobAnalysis = analyzeByLineOfBusiness();
    const geoAnalysis = analyzeByGeography();
    const riskAssessment = performRiskAssessment();
    
    const reportContent = `
PORTFOLIO ANALYSIS REPORT
========================
Generated: ${new Date().toLocaleString()}
Timeframe: ${timeframe.toUpperCase()}

EXECUTIVE SUMMARY
================
Total Premium Volume: USD ${(metrics.totalPremium / 1000000).toFixed(1)}M
Total Claims: USD ${(metrics.totalClaims / 1000000).toFixed(1)}M
Loss Ratio: ${metrics.lossRatio.toFixed(1)}%
Combined Ratio: ${metrics.combinedRatio.toFixed(1)}%
Profit Margin: ${metrics.profitMargin.toFixed(1)}%

RISK ASSESSMENT
==============
Overall Risk Level: ${riskAssessment.overallRisk}
Concentration Risk: ${riskAssessment.concentrationRisk.toFixed(1)}%
Geographic Risk Index: ${riskAssessment.geographicRisk.toFixed(1)}
LOB Risk Score: ${riskAssessment.lobRisk.toFixed(1)}%

LINE OF BUSINESS ANALYSIS
========================
${Object.entries(lobAnalysis).map(([lob, data]) => 
  `${lob}: Premium USD ${(data.premium / 1000000).toFixed(1)}M, Loss Ratio ${data.lossRatio.toFixed(1)}%, Rating: ${data.profitability}`
).join('\n')}

GEOGRAPHIC DISTRIBUTION
======================
${Object.entries(geoAnalysis).map(([country, data]) => 
  `${country}: ${data.marketShare.toFixed(1)}% market share, Risk Level: ${data.riskLevel}`
).join('\n')}

RECOMMENDATIONS
==============
${riskAssessment.recommendations.map(rec => `• ${rec}`).join('\n')}

This analysis is based on current portfolio data and market conditions.
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Portfolio_Analysis_${timeframe}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Portfolio analysis exported as ${format.toUpperCase()}`);
  };

  const metrics = calculatePortfolioMetrics();
  const lobAnalysis = analyzeByLineOfBusiness();
  const geoAnalysis = analyzeByGeography();
  const riskAssessment = performRiskAssessment();
  const trends = calculatePerformanceTrends();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Analysis</h2>
          <p className="text-gray-600">Comprehensive portfolio performance and risk analysis</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportAnalysis('txt')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={runAnalysis} disabled={isAnalyzing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
      </div>

      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Analysis Type</Label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                  <SelectItem value="risk-focused">Risk-Focused</SelectItem>
                  <SelectItem value="performance">Performance Only</SelectItem>
                  <SelectItem value="geographic">Geographic Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="3year">3-Year Trend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Line of Business Filter</Label>
              <Select value={filterLob} onValueChange={setFilterLob}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lines</SelectItem>
                  <SelectItem value="Motor">Motor</SelectItem>
                  <SelectItem value="Property">Property</SelectItem>
                  <SelectItem value="Marine">Marine</SelectItem>
                  <SelectItem value="Aviation">Aviation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Region Filter</Label>
              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="Tanzania">Tanzania</SelectItem>
                  <SelectItem value="Kenya">Kenya</SelectItem>
                  <SelectItem value="Uganda">Uganda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="lob">Line of Business</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">USD {(metrics.totalPremium / 1000000).toFixed(1)}M</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12.5%</span> from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loss Ratio</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.lossRatio.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">-3.2%</span> improvement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Combined Ratio</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.combinedRatio.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Target: &lt;95%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{riskAssessment.overallRisk}</div>
                <p className="text-xs text-muted-foreground">
                  Well diversified portfolio
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Composition by Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(lobAnalysis).map(([lob, data]) => (
                    <div key={lob} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{lob}</span>
                        <span>USD {(data.premium / 1000000).toFixed(1)}M ({((data.premium / metrics.totalPremium) * 100).toFixed(1)}%)</span>
                      </div>
                      <Progress value={(data.premium / metrics.totalPremium) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(geoAnalysis).map(([country, data]) => (
                    <div key={country} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{country}</p>
                        <p className="text-sm text-gray-600">{data.treatyCount} treaties</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{data.marketShare.toFixed(1)}%</p>
                        <Badge variant={data.riskLevel === 'Low' ? 'secondary' : data.riskLevel === 'Medium' ? 'default' : 'destructive'}>
                          {data.riskLevel} Risk
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Premium Growth</p>
                      <p className="text-2xl font-bold text-green-600">+{trends.premiumGrowth}%</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Claims Growth</p>
                      <p className="text-2xl font-bold text-orange-600">+{trends.claimsGrowth}%</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Efficiency Ratio</p>
                      <p className="text-2xl font-bold text-blue-600">{trends.efficiency}%</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Market Position</p>
                      <p className="text-2xl font-bold text-purple-600">{trends.marketPosition}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profitability Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(lobAnalysis).map(([lob, data]) => (
                    <div key={lob} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{lob}</span>
                        <Badge variant={
                          data.profitability === 'Excellent' ? 'secondary' :
                          data.profitability === 'Good' ? 'default' :
                          data.profitability === 'Fair' ? 'outline' : 'destructive'
                        }>
                          {data.profitability}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Premium</p>
                          <p className="font-medium">USD {(data.premium / 1000000).toFixed(1)}M</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Loss Ratio</p>
                          <p className="font-medium">{data.lossRatio.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Treaties</p>
                          <p className="font-medium">{data.treatyCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Overall Risk Level</span>
                      <Badge variant={
                        riskAssessment.overallRisk === 'Low' ? 'secondary' :
                        riskAssessment.overallRisk === 'Medium' ? 'default' : 'destructive'
                      }>
                        {riskAssessment.overallRisk}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Concentration Risk</span>
                        <span>{riskAssessment.concentrationRisk.toFixed(1)}%</span>
                      </div>
                      <Progress value={riskAssessment.concentrationRisk} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Geographic Risk Index</span>
                        <span>{riskAssessment.geographicRisk.toFixed(1)}</span>
                      </div>
                      <Progress value={riskAssessment.geographicRisk} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>LOB Risk Score</span>
                        <span>{riskAssessment.lobRisk.toFixed(1)}%</span>
                      </div>
                      <Progress value={riskAssessment.lobRisk} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskAssessment.recommendations.length > 0 ? (
                    riskAssessment.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                      <Shield className="h-4 w-4 text-green-600" />
                      <p className="text-sm">Portfolio risk profile is well-balanced. No immediate action required.</p>
                    </div>
                  )}
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Risk Management Best Practices</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Maintain geographic diversification across multiple markets</li>
                      <li>• Monitor concentration limits for individual treaties</li>
                      <li>• Regular review of line of business performance</li>
                      <li>• Implement dynamic pricing based on risk assessment</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lob" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Line of Business Analysis</CardTitle>
              <CardDescription>Detailed performance breakdown by line of business</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line of Business</TableHead>
                    <TableHead>Premium Volume</TableHead>
                    <TableHead>Claims</TableHead>
                    <TableHead>Loss Ratio</TableHead>
                    <TableHead>Treaty Count</TableHead>
                    <TableHead>Avg Premium</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(lobAnalysis).map(([lob, data]) => (
                    <TableRow key={lob}>
                      <TableCell className="font-medium">{lob}</TableCell>
                      <TableCell>USD {(data.premium / 1000000).toFixed(1)}M</TableCell>
                      <TableCell>USD {(data.claims / 1000000).toFixed(1)}M</TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          data.lossRatio < 60 ? 'text-green-600' :
                          data.lossRatio < 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {data.lossRatio.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>{data.treatyCount}</TableCell>
                      <TableCell>USD {(data.avgPremium / 1000000).toFixed(1)}M</TableCell>
                      <TableCell>
                        <Badge variant={
                          data.profitability === 'Excellent' ? 'secondary' :
                          data.profitability === 'Good' ? 'default' :
                          data.profitability === 'Fair' ? 'outline' : 'destructive'
                        }>
                          {data.profitability}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Analysis</CardTitle>
              <CardDescription>Portfolio distribution and performance by geography</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country/Region</TableHead>
                    <TableHead>Market Share</TableHead>
                    <TableHead>Premium Volume</TableHead>
                    <TableHead>Claims</TableHead>
                    <TableHead>Treaty Count</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(geoAnalysis).map(([country, data]) => (
                    <TableRow key={country}>
                      <TableCell className="font-medium">{country}</TableCell>
                      <TableCell>{data.marketShare.toFixed(1)}%</TableCell>
                      <TableCell>USD {(data.premium / 1000000).toFixed(1)}M</TableCell>
                      <TableCell>USD {(data.claims / 1000000).toFixed(1)}M</TableCell>
                      <TableCell>{data.treatyCount}</TableCell>
                      <TableCell>
                        <Badge variant={
                          data.riskLevel === 'Low' ? 'secondary' :
                          data.riskLevel === 'Medium' ? 'default' : 'destructive'
                        }>
                          {data.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Analyze
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Premium Growth</p>
                      <p className="text-2xl font-bold text-green-600">+{trends.premiumGrowth}%</p>
                      <p className="text-xs text-gray-600">Year over year</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Efficiency</p>
                      <p className="text-2xl font-bold text-blue-600">{trends.efficiency}%</p>
                      <p className="text-xs text-gray-600">Operational efficiency</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Trend Analysis</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Premium volume showing consistent growth</li>
                      <li>• Loss ratios improving across most lines</li>
                      <li>• Geographic expansion yielding positive results</li>
                      <li>• Technology investments improving efficiency</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Market Position</p>
                    <p className="text-2xl font-bold text-purple-600">{trends.marketPosition}</p>
                    <p className="text-xs text-gray-600">Competitive standing</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Market Share Growth</span>
                      <span className="font-medium text-green-600">+2.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Customer Retention</span>
                      <span className="font-medium text-blue-600">94.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">New Business Growth</span>
                      <span className="font-medium text-purple-600">+18.5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioAnalysis;