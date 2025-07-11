import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, DollarSign, FileText, Users, AlertTriangle, BarChart3, Settings, Shield, Building, BookOpen, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "../components/AuthContext";
import ActuarialEngine from "../components/ActuarialEngine";
import PricingSystem from "../components/PricingSystem";
import AccountingModule from "../components/AccountingModule";
import ClaimsModuleLinked from "../components/ClaimsModuleLinked";
import TreatyManagementIntegrated from "../components/TreatyManagementIntegrated";
import UnderwritingModuleIntegrated from "../components/UnderwritingModuleIntegrated";
import IfrsReporting from "../components/IfrsReporting";
import RetrocessionModule from "../components/RetrocessionModule";

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState("dashboard");
  const { user, logout } = useAuth();

  const kpis = [
    { title: "Total Premium Volume", value: "USD 2.8B", change: "+12.5%", icon: <DollarSign className="h-4 w-4" /> },
    { title: "Outstanding Claims", value: "USD 145M", change: "-8.2%", icon: <AlertTriangle className="h-4 w-4" /> },
    { title: "IBNR Reserves", value: "USD 89M", change: "+3.1%", icon: <Calculator className="h-4 w-4" /> },
    { title: "Solvency Ratio", value: "234%", change: "+5.3%", icon: <TrendingUp className="h-4 w-4" /> }
  ];

  const recentAlerts = [
    { type: "warning", message: "Large claim reported: USD 2.5M - Motor Treaty", time: "2 hours ago" },
    { type: "info", message: "Monthly reserves calculation completed", time: "4 hours ago" },
    { type: "error", message: "Payment overdue: Retro Commission USD 150K", time: "1 day ago" }
  ];

  const renderMainContent = () => {
    switch(activeModule) {
      case "actuarial":
        return <ActuarialEngine />;
      case "pricing":
        return <PricingSystem />;
      case "accounting":
        return <AccountingModule />;
      case "claims":
        return <ClaimsModuleLinked />;
      case "treaties":
        return <TreatyManagementIntegrated />;
      case "underwriting":
        return <UnderwritingModuleIntegrated />;
      case "ifrs":
        return <IfrsReporting />;
      case "retrocession":
        return <RetrocessionModule />;
      default:
        return (
          <div className="space-y-6">
            {/* Integration Status Banner */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">System Integration Active</h3>
                    <p className="text-blue-700">All modules are now fully integrated with real-time data synchronization</p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className="bg-green-100 text-green-800">Underwriting ↔ Treaties</Badge>
                    <Badge className="bg-green-100 text-green-800">Claims ↔ Treaties</Badge>
                    <Badge className="bg-green-100 text-green-800">Accounting ↔ All</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.map((kpi, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    {kpi.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={kpi.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                        {kpi.change}
                      </span>
                      {" "}from last month
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions and Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Integrated Quick Actions</CardTitle>
                  <CardDescription>Cross-module operations with automatic data linking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={() => setActiveModule("underwriting")} className="w-full justify-start">
                    <Building className="mr-2 h-4 w-4" />
                    New Underwriting Contract → Auto-Convert to Treaty
                  </Button>
                  <Button onClick={() => setActiveModule("claims")} variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Process Claim → Auto-Link to Treaty & Book Reinstatement
                  </Button>
                  <Button onClick={() => setActiveModule("treaties")} variant="outline" className="w-full justify-start">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Book Premium → Update Accounting & Payment Status
                  </Button>
                  <Button onClick={() => setActiveModule("actuarial")} variant="outline" className="w-full justify-start">
                    <Calculator className="mr-2 h-4 w-4" />
                    Run Actuarial Calculations
                  </Button>
                  <Button onClick={() => setActiveModule("ifrs")} variant="outline" className="w-full justify-start">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Generate IFRS 17 Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Alerts & Integration Status</CardTitle>
                  <CardDescription>Real-time notifications and data synchronization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        alert.type === 'error' ? 'bg-red-500' : 
                        alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3">
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>All modules synchronized - Real-time data flow active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Portfolio Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Integrated Portfolio Overview</CardTitle>
                <CardDescription>Real-time portfolio status with cross-module data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Active Treaties</p>
                    <p className="text-2xl font-bold">127</p>
                    <Badge variant="secondary">Auto-linked to Claims & Accounting</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Outstanding Claims</p>
                    <p className="text-2xl font-bold">23</p>
                    <Badge variant="secondary">With Auto-Retro Recovery</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Premium Bookings</p>
                    <p className="text-2xl font-bold">89</p>
                    <Badge variant="secondary">Real-time Payment Status</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Retrocession Covers</p>
                    <p className="text-2xl font-bold">34</p>
                    <Badge variant="secondary">Auto-allocation Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 rounded-lg p-2">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AfriReVision Platform</h1>
                <p className="text-sm text-gray-600">Fully Integrated Reinsurance Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.userType}</p>
                </div>
              )}
              <Badge className="bg-green-100 text-green-800">Online</Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
              { id: 'underwriting', label: 'Underwriting', icon: <Building className="h-4 w-4" /> },
              { id: 'actuarial', label: 'Actuarial Engine', icon: <Calculator className="h-4 w-4" /> },
              { id: 'pricing', label: 'AI Pricing', icon: <TrendingUp className="h-4 w-4" /> },
              { id: 'accounting', label: 'Accounting', icon: <DollarSign className="h-4 w-4" /> },
              { id: 'claims', label: 'Claims', icon: <FileText className="h-4 w-4" /> },
              { id: 'treaties', label: 'Treaties', icon: <Users className="h-4 w-4" /> },
              { id: 'retrocession', label: 'Retrocession', icon: <Shield className="h-4 w-4" /> },
              { id: 'ifrs', label: 'IFRS 17', icon: <BookOpen className="h-4 w-4" /> }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeModule === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {renderMainContent()}
      </main>
    </div>
  );
};

export default Dashboard;