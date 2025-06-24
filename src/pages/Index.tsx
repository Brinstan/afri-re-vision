
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, TrendingUp, Globe, Zap, BarChart3, Users, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: "Advanced Actuarial Engine",
      description: "AI-powered reserving with Chain Ladder, Bornhuetter-Ferguson, and custom African models",
      capabilities: ["IBNR Calculations", "Loss Triangle Development", "Parametric Models", "UPR Automation"]
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: "Intelligent Pricing & Underwriting",
      description: "Automated treaty and facultative pricing with multi-layer management",
      capabilities: ["XOL Pricing", "Risk Scoring", "Approval Workflows", "Experience Rating"]
    },
    {
      icon: <Globe className="h-8 w-8 text-purple-600" />,
      title: "Comprehensive Claims Management",
      description: "Real-time processing with fraud detection and predictive analytics",
      capabilities: ["Claims Advice", "Discharge Vouchers", "Layer Cascade Logic", "Fraud Detection"]
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-orange-600" />,
      title: "Financial & Regulatory Compliance",
      description: "IFRS 17 compliant reporting with TRA and TIRA integration",
      capabilities: ["Multi-Currency", "Automated Receipts", "Regulatory Reports", "Audit Trails"]
    },
    {
      icon: <Zap className="h-8 w-8 text-red-600" />,
      title: "AI-Powered Analytics",
      description: "Predictive insights and automated report generation",
      capabilities: ["Trend Analysis", "Risk Prediction", "Executive Dashboards", "Custom Reports"]
    },
    {
      icon: <Users className="h-8 w-8 text-indigo-600" />,
      title: "Integrated HRIS & Workflow",
      description: "Complete HR management with role-based access control",
      capabilities: ["Payroll Management", "Performance KPIs", "Digital Signatures", "Leave Management"]
    }
  ];

  const metrics = [
    { value: "USD 5B+", label: "Transaction Volume Support" },
    { value: "50+", label: "Concurrent Users" },
    { value: "99.9%", label: "Uptime Guarantee" },
    { value: "<1s", label: "Response Time" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AfriReVision</h1>
                <p className="text-sm text-gray-600">East African Reinsurance Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Tanzania Data Residency
              </Badge>
              <Link to="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Launch Platform
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
            Revolutionary Reinsurance Technology
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform East African
            <span className="text-blue-600 block">Reinsurance Operations</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The world's most advanced reinsurance platform built specifically for East Africa. 
            Surpassing Swiss Re technology with AI-powered pricing, automated compliance, 
            and comprehensive financial management.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Explore Platform
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metric.value}</div>
              <div className="text-gray-600 mt-1">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Complete Reinsurance Ecosystem
          </h2>
          <p className="text-lg text-gray-600">
            Six integrated modules delivering unprecedented functionality
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  {feature.icon}
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {feature.capabilities.map((capability, capIndex) => (
                    <div key={capIndex} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{capability}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Beyond Global Standards
            </h2>
            <p className="text-lg text-gray-600">
              Surpassing RMS, ARIMA, and Swiss Re technology capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Africa-Specific Models</h3>
              <p className="text-gray-600 text-sm">Custom parametric models for East African risks and weather patterns</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">AI-First Design</h3>
              <p className="text-gray-600 text-sm">Machine learning integrated into every pricing and risk assessment</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Local Compliance</h3>
              <p className="text-gray-600 text-sm">Built-in TRA, TIRA, and IFRS 17 compliance with Tanzania data residency</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Settings className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">All-in-One Platform</h3>
              <p className="text-gray-600 text-sm">Integrated HRIS, accounting, and operations in a single platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Reinsurance Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the revolution in East African reinsurance technology
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/dashboard">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Start Free Trial
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-600 rounded-lg p-2">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">AfriReVision</span>
              </div>
              <p className="text-gray-400">
                Revolutionary reinsurance technology for East Africa
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Actuarial Engine</li>
                <li>Claims Management</li>
                <li>Financial Reporting</li>
                <li>AI Analytics</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Compliance</h3>
              <ul className="space-y-2 text-gray-400">
                <li>IFRS 17</li>
                <li>TRA Integration</li>
                <li>TIRA Compliance</li>
                <li>ISO 9001</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>Training</li>
                <li>24/7 Support</li>
                <li>API Reference</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AfriReVision. All rights reserved. Tanzania Data Residency Compliant.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
