
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Users, 
  FileText,
  Shield,
  Calendar,
  Bell,
  Settings,
  LogOut
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [selectedModule, setSelectedModule] = useState('overview');

  const kpis = [
    {
      title: "Premium Volume",
      value: "USD 847M",
      change: "+12.5%",
      trend: "up",
      icon: <DollarSign className="h-6 w-6 text-green-600" />
    },
    {
      title: "Loss Ratio",
      value: "68.2%",
      change: "-3.1%",
      trend: "down",
      icon: <BarChart3 className="h-6 w-6 text-blue-600" />
    },
    {
      title: "Active Treaties",
      value: "156",
      change: "+8",
      trend: "up",
      icon: <FileText className="h-6 w-6 text-purple-600" />
    },
    {
      title: "Claims Pending",
      value: "23",
      change: "-5",
      trend: "down",
      icon: <AlertTriangle className="h-6 w-6 text-orange-600" />
    }
  ];

  const modules = [
    { id: 'actuarial', name: 'Actuarial Engine', icon: <BarChart3 className="h-5 w-5" />, active: true },
    { id: 'underwriting', name: 'Underwriting', icon: <Shield className="h-5 w-5" />, active: true },
    { id: 'claims', name: 'Claims Management', icon: <FileText className="h-5 w-5" />, active: true },
    { id: 'accounting', name: 'Financial Accounting', icon: <DollarSign className="h-5 w-5" />, active: true },
    { id: 'analytics', name: 'AI Analytics', icon: <TrendingUp className="h-5 w-5" />, active: true },
    { id: 'hris', name: 'Human Resources', icon: <Users className="h-5 w-5" />, active: false }
  ];

  const recentActivities = [
    { type: 'treaty', message: 'New Quota Share treaty submitted for approval', time: '2 hours ago', status: 'pending' },
    { type: 'claim', message: 'Large property claim processed - USD 2.3M', time: '4 hours ago', status: 'completed' },
    { type: 'report', message: 'Monthly regulatory report submitted to TIRA', time: '1 day ago', status: 'completed' },
    { type: 'alert', message: 'Loss ratio threshold exceeded for Motor portfolio', time: '2 days ago', status: 'warning' }
  ];

  const alerts = [
    { type: 'urgent', message: 'CAT exposure limit approaching for Earthquake treaty', action: 'Review Now' },
    { type: 'info', message: 'IFRS 17 quarterly report due in 5 days', action: 'Prepare Report' },
    { type: 'success', message: 'All regulatory submissions completed for Q3', action: 'View Details' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-3">
                <div className="bg-blue-600 rounded-lg p-2">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">AfriReVision</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">JD</span>
                </div>
                <span className="text-sm text-gray-700">John Doe</span>
              </div>
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <LogOut className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, John</h1>
          <p className="text-gray-600">Here's your reinsurance operations overview for today</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {kpi.title}
                </CardTitle>
                {kpi.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</div>
                <div className={`text-sm flex items-center ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-4 w-4 mr-1 ${
                    kpi.trend === 'down' ? 'rotate-180' : ''
                  }`} />
                  {kpi.change} from last month
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Access frequently used functions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Button className="h-20 flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">New Treaty</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <AlertTriangle className="h-6 w-6" />
                    <span className="text-sm">Process Claim</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Run Analytics</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <DollarSign className="h-6 w-6" />
                    <span className="text-sm">Generate Report</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <Shield className="h-6 w-6" />
                    <span className="text-sm">Risk Assessment</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm">Schedule Audit</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Platform Modules */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Modules</CardTitle>
                <CardDescription>Access integrated reinsurance modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        module.active
                          ? 'border-blue-200 bg-blue-50 hover:border-blue-300'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                      onClick={() => module.active && setSelectedModule(module.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {module.icon}
                        <div>
                          <h3 className="font-medium text-gray-900">{module.name}</h3>
                          <Badge variant={module.active ? "default" : "secondary"} className="mt-1">
                            {module.active ? "Active" : "Coming Soon"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest platform activities and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'completed' ? 'bg-green-500' :
                        activity.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                      <Badge variant={
                        activity.status === 'completed' ? 'default' :
                        activity.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Alerts & Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Alerts & Notifications</CardTitle>
                <CardDescription>Important updates requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      alert.type === 'urgent' ? 'border-red-200 bg-red-50' :
                      alert.type === 'info' ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'
                    }`}>
                      <p className="text-sm font-medium text-gray-900 mb-2">{alert.message}</p>
                      <Button size="sm" variant={
                        alert.type === 'urgent' ? 'destructive' :
                        alert.type === 'info' ? 'default' : 'outline'
                      }>
                        {alert.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Platform health and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>System Performance</span>
                      <span>98%</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Data Sync Status</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>API Response Time</span>
                      <span>0.3s</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>All systems operational</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
                <CardDescription>Key metrics for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">New Claims</span>
                    <span className="font-medium">7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Treaties Renewed</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reports Generated</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="font-medium">47</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
