import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, TrendingUp, Plus, Eye } from "lucide-react";

const TreatyManagement = () => {
  const activeTreaties = [
    { id: "MT-2024-001", type: "Motor Treaty", inception: "2024-01-01", expiry: "2024-12-31", premium: "25,500,000", status: "Active" },
    { id: "PT-2024-002", type: "Property XOL", inception: "2024-01-01", expiry: "2024-12-31", premium: "18,750,000", status: "Active" },
    { id: "MAR-2024-003", type: "Marine Treaty", inception: "2024-06-01", expiry: "2025-05-31", premium: "12,200,000", status: "Active" },
    { id: "AV-2024-004", type: "Aviation Cover", inception: "2024-03-01", expiry: "2025-02-28", premium: "8,500,000", status: "Renewal Due" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Treaty Management</h2>
          <p className="text-gray-600">Manage reinsurance treaties and agreements</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Treaty
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Treaties</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">Across all lines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.8B</div>
            <p className="text-xs text-muted-foreground">Annual premium volume</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewal Due</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Next 90 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reinsurers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">Active partners</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Treaties</CardTitle>
          <CardDescription>Current reinsurance treaty portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeTreaties.map((treaty, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    treaty.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium">{treaty.id}</p>
                    <p className="text-sm text-gray-600">{treaty.type}</p>
                    <p className="text-xs text-gray-500">{treaty.inception} - {treaty.expiry}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">USD {parseInt(treaty.premium).toLocaleString()}</p>
                  <Badge variant={treaty.status === 'Active' ? 'secondary' : 'default'}>
                    {treaty.status}
                  </Badge>
                  <div className="mt-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TreatyManagement;