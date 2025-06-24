
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, FileSpreadsheet, Download } from "lucide-react";

const ActuarialEngine = () => {
  const [method, setMethod] = useState("chainladder");
  const [lineOfBusiness, setLineOfBusiness] = useState("motor");
  const [calculating, setCalculating] = useState(false);

  // Sample loss triangle data
  const lossTriangleData = [
    { year: 2020, dev0: 1000000, dev1: 1150000, dev2: 1200000, dev3: 1220000, dev4: 1225000 },
    { year: 2021, dev0: 1100000, dev1: 1265000, dev2: 1320000, dev3: 1342000, dev4: null },
    { year: 2022, dev0: 1200000, dev1: 1380000, dev2: 1440000, dev3: null, dev4: null },
    { year: 2023, dev0: 1300000, dev1: 1495000, dev2: null, dev3: null, dev4: null },
    { year: 2024, dev0: 1400000, dev1: null, dev2: null, dev3: null, dev4: null }
  ];

  const developmentFactors = [
    { period: "0-1", factor: 1.15, selected: 1.15 },
    { period: "1-2", factor: 1.043, selected: 1.043 },
    { period: "2-3", factor: 1.017, selected: 1.017 },
    { period: "3-4", factor: 1.004, selected: 1.004 }
  ];

  const reserveResults = [
    { year: 2020, ultimate: 1225000, paid: 1225000, outstanding: 0, ibnr: 0 },
    { year: 2021, ultimate: 1357568, paid: 1342000, outstanding: 15568, ibnr: 0 },
    { year: 2022, ultimate: 1498752, paid: 1440000, outstanding: 58752, ibnr: 0 },
    { year: 2023, ultimate: 1556485, paid: 1495000, outstanding: 61485, ibnr: 0 },
    { year: 2024, ultimate: 1601000, paid: 1400000, outstanding: 201000, ibnr: 0 }
  ];

  const handleCalculate = () => {
    setCalculating(true);
    setTimeout(() => {
      setCalculating(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Actuarial Calculation Engine</h2>
          <p className="text-gray-600">Advanced reserving and loss development calculations</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
          <Button onClick={handleCalculate} disabled={calculating}>
            <Calculator className="h-4 w-4 mr-2" />
            {calculating ? 'Calculating...' : 'Run Calculation'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup">Calculation Setup</TabsTrigger>
          <TabsTrigger value="triangle">Loss Triangle</TabsTrigger>
          <TabsTrigger value="development">Development Factors</TabsTrigger>
          <TabsTrigger value="results">Reserve Results</TabsTrigger>
          <TabsTrigger value="ibnr">IBNR Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Reserving Method</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chainladder">Chain Ladder</SelectItem>
                    <SelectItem value="bornferg">Bornhuetter-Ferguson</SelectItem>
                    <SelectItem value="capecod">Cape Cod</SelectItem>
                    <SelectItem value="expectedloss">Expected Loss Ratio</SelectItem>
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
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Valuation Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Input type="date" defaultValue="2024-12-31" />
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Calculation Parameters</CardTitle>
              <CardDescription>Configure specific parameters for the selected method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expected-loss-ratio">Expected Loss Ratio (%)</Label>
                  <Input id="expected-loss-ratio" type="number" defaultValue="65" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tail-factor">Tail Factor</Label>
                  <Input id="tail-factor" type="number" step="0.001" defaultValue="1.000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confidence-level">Confidence Level (%)</Label>
                  <Input id="confidence-level" type="number" defaultValue="75" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triangle">
          <Card>
            <CardHeader>
              <CardTitle>Loss Development Triangle</CardTitle>
              <CardDescription>Cumulative paid losses by accident year and development period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Accident Year</TableHead>
                      <TableHead>Development 0</TableHead>
                      <TableHead>Development 1</TableHead>
                      <TableHead>Development 2</TableHead>
                      <TableHead>Development 3</TableHead>
                      <TableHead>Development 4</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lossTriangleData.map((row) => (
                      <TableRow key={row.year}>
                        <TableCell className="font-medium">{row.year}</TableCell>
                        <TableCell>{row.dev0?.toLocaleString()}</TableCell>
                        <TableCell>{row.dev1?.toLocaleString() || '-'}</TableCell>
                        <TableCell>{row.dev2?.toLocaleString() || '-'}</TableCell>
                        <TableCell>{row.dev3?.toLocaleString() || '-'}</TableCell>
                        <TableCell>{row.dev4?.toLocaleString() || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="development">
          <Card>
            <CardHeader>
              <CardTitle>Development Factors</CardTitle>
              <CardDescription>Age-to-age development factors and selected factors</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Development Period</TableHead>
                    <TableHead>Calculated Factor</TableHead>
                    <TableHead>Selected Factor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {developmentFactors.map((factor, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{factor.period}</TableCell>
                      <TableCell>{factor.factor.toFixed(3)}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          step="0.001" 
                          defaultValue={factor.selected} 
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Selected</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Reserve Calculation Results</CardTitle>
              <CardDescription>Ultimate losses and reserve requirements by accident year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Ultimate</p>
                    <p className="text-2xl font-bold text-blue-900">USD 7.24M</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Total Paid</p>
                    <p className="text-2xl font-bold text-green-900">USD 6.90M</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">Case Reserves</p>
                    <p className="text-2xl font-bold text-orange-900">USD 337K</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">IBNR</p>
                    <p className="text-2xl font-bold text-red-900">USD 0K</p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Accident Year</TableHead>
                      <TableHead>Ultimate Losses</TableHead>
                      <TableHead>Paid to Date</TableHead>
                      <TableHead>Case Outstanding</TableHead>
                      <TableHead>IBNR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reserveResults.map((result) => (
                      <TableRow key={result.year}>
                        <TableCell className="font-medium">{result.year}</TableCell>
                        <TableCell>{result.ultimate.toLocaleString()}</TableCell>
                        <TableCell>{result.paid.toLocaleString()}</TableCell>
                        <TableCell>{result.outstanding.toLocaleString()}</TableCell>
                        <TableCell>{result.ibnr.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ibnr">
          <Card>
            <CardHeader>
              <CardTitle>IBNR Analysis</CardTitle>
              <CardDescription>Incurred but not reported claims analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Total IBNR</p>
                    <p className="text-2xl font-bold text-purple-900">USD 0K</p>
                    <p className="text-xs text-purple-600">0.0% of ultimate</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-indigo-600 font-medium">Frequency IBNR</p>
                    <p className="text-2xl font-bold text-indigo-900">USD 0K</p>
                    <p className="text-xs text-indigo-600">No unreported claims</p>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <p className="text-sm text-pink-600 font-medium">Severity IBNR</p>
                    <p className="text-2xl font-bold text-pink-900">USD 0K</p>
                    <p className="text-xs text-pink-600">No development on reported</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Analysis Summary</h4>
                  <p className="text-sm text-gray-600">
                    The Chain Ladder method indicates that claims development is complete for this portfolio. 
                    All accident years show stable ultimate loss estimates with minimal IBNR requirements. 
                    This suggests either a mature book of business or comprehensive case reserving practices.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ActuarialEngine;
