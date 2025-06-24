
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to AfriReVision
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          East African Reinsurance Management Platform
        </p>
        <Link to="/dashboard">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Access Platform
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
