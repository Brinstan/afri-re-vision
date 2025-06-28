
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, Clock, CheckCircle, XCircle, Plus } from "lucide-react";

const ClaimsModule = () => {
  const [selectedClaim, setSelectedClaim] = useState(null);

  const recentClaims = [
    { id: "CLM-2024-0892", type: "Motor", amount: "1,850,000", status: "Under Review", date: "2024-12-19", treaty: "Motor Treaty 2024" },
    { id: "CLM-2024-0893", type: "Property", amount: "750,000", status: "Approved", date: "2024-12-18", treaty: "Property XOL" },
    { id: "CLM-2024-0894", type: "Marine", amount: "3,200,000", status: "Pending", date: "2024-12-17", treaty: "Marine Treaty" },
    { id: "CLM-2024-0895", type: "Aviation", amount: "5,500,000", status: "Investigation", date: "2024-12-16", treaty: "Aviation Cover" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Claims Management</h2>
          <p className="text-gray-600">Process and manage reinsurance claims</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Claim
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">+12 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Outstanding</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$145M</div>
            <p className="text-xs text-muted-foreground">Across all treaties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settled This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">189</div>
            <p className="text-xs text-muted-foreground">$28M paid out</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Claims</CardTitle>
          <CardDescription>Latest claim submissions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentClaims.map((claim, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    claim.status === 'Approved' ? 'bg-green-500' :
                    claim.status === 'Under Review' ? 'bg-yellow-500' :
                    claim.status === 'Pending' ? 'bg-blue-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium">{claim.id}</p>
                    <p className="text-sm text-gray-600">{claim.type} • {claim.treaty}</p>
                    <p className="text-xs text-gray-500">{claim.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">USD {parseInt(claim.amount).toLocaleString()}</p>
                  <Badge variant={
                    claim.status === 'Approved' ? 'secondary' :
                    claim.status === 'Under Review' ? 'default' :
                    claim.status === 'Pending' ? 'outline' : 'destructive'
                  }>
                    {claim.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClaimsModule;
