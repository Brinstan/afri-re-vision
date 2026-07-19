import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { Calculator, TrendingUp, DollarSign, FileText, Users, AlertTriangle, BarChart3, Settings, Shield, Building, BookOpen, RefreshCw, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "../components/AuthContext";
import { useTheme } from "../components/ThemeContext";
import { useDataStore } from "../components/DataStore";
import ActuarialEngine from "../components/ActuarialEngine";
import PricingSystem from "../components/PricingSystem";
import AccountingModule from "../components/AccountingModule";
import ClaimsModuleLinked from "../components/ClaimsModuleLinked";
import TreatyManagementIntegrated from "../components/TreatyManagementIntegrated";
import UnderwritingModuleIntegrated from "../components/UnderwritingModuleIntegrated";
import IfrsReporting from "../components/IfrsReporting";
import RetrocessionModule from "../components/RetrocessionModule";
import AdminModule from "../components/AdminModule";
import { UserCog, Download, Upload } from "lucide-react";
import { createBackup, validateBackup, applyBackup, backupFilename, BackupFile } from "../lib/backup";

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const { user, logout, hasModule } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { treaties, claims, resetData, approvals, decideApproval } = useDataStore();
  const pendingApprovals = approvals.filter(a => a.status === 'Pending');

  const handleDecide = (id: string, approve: boolean) => {
    const err = decideApproval(id, approve);
    if (err) toast.error(err);
    else toast.success(approve ? "Approved — the payment has been executed" : "Rejected");
  };

  const handleResetData = () => {
    resetData();
    setResetConfirmOpen(false);
    setSettingsOpen(false);
    toast.success("Application data has been reset to its initial state");
  };

  const handleBackup = () => {
    const backup = createBackup(user?.username ?? 'unknown');
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFilename();
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded — keep it somewhere safe");
  };

  const restoreInputRef = React.useRef<HTMLInputElement>(null);
  const [pendingRestore, setPendingRestore] = useState<{ backup: BackupFile; summary: string[] } | null>(null);

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const check = validateBackup(parsed);
      if (!check.ok) {
        toast.error(`Backup rejected: ${check.errors[0]}`);
        return;
      }
      setPendingRestore({ backup: parsed as BackupFile, summary: check.summary });
    } catch {
      toast.error("Could not read the file — is it a valid AfriReVision backup?");
    }
  };

  const handleConfirmRestore = () => {
    if (!pendingRestore) return;
    applyBackup(pendingRestore.backup);
    setPendingRestore(null);
    toast.success("Backup restored — reloading");
    setTimeout(() => window.location.reload(), 600);
  };

  const formatAmount = (amount: number) =>
    amount >= 1_000_000_000 ? `USD ${(amount / 1_000_000_000).toFixed(1)}B` :
    amount >= 1_000_000 ? `USD ${(amount / 1_000_000).toFixed(1)}M` :
    `USD ${amount.toLocaleString()}`;

  const totalPremium = treaties.reduce((sum, t) => sum + t.premium, 0);
  const outstandingClaims = claims.filter(c => c.status === 'Outstanding');
  const outstandingClaimsAmount = outstandingClaims.reduce((sum, c) => sum + c.claimAmount, 0);
  const totalReserves = claims.reduce((sum, c) => sum + c.reserveAmount, 0);
  const premiumBookingsCount = treaties.reduce((sum, t) => sum + (t.premiumBookings?.length || 0), 0);
  const retroCoveredTreaties = treaties.filter(t => t.retroPercentage > 0).length;

  const kpis = [
    { title: "Total Premium Volume", value: formatAmount(totalPremium), change: "+12.5%", icon: <DollarSign className="h-4 w-4" /> },
    { title: "Outstanding Claims", value: formatAmount(outstandingClaimsAmount), change: "-8.2%", icon: <AlertTriangle className="h-4 w-4" /> },
    { title: "Claim Reserves", value: formatAmount(totalReserves), change: "+3.1%", icon: <Calculator className="h-4 w-4" /> },
    { title: "Solvency Ratio", value: "234%", change: "+5.3%", icon: <TrendingUp className="h-4 w-4" /> }
  ];

  const recentAlerts = [
    { type: "warning", message: "Large claim reported: USD 2.5M - Motor Treaty", time: "2 hours ago" },
    { type: "info", message: "Monthly reserves calculation completed", time: "4 hours ago" },
    { type: "error", message: "Payment overdue: Retro Commission USD 150K", time: "1 day ago" }
  ];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'underwriting', label: 'Underwriting', icon: <Building className="h-4 w-4" /> },
    { id: 'actuarial', label: 'Actuarial Engine', icon: <Calculator className="h-4 w-4" /> },
    { id: 'pricing', label: 'Pricing', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'accounting', label: 'Accounting', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'claims', label: 'Claims', icon: <FileText className="h-4 w-4" /> },
    { id: 'treaties', label: 'Treaties', icon: <Users className="h-4 w-4" /> },
    { id: 'retrocession', label: 'Retrocession', icon: <Shield className="h-4 w-4" /> },
    { id: 'ifrs', label: 'IFRS 17', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'admin', label: 'Administration', icon: <UserCog className="h-4 w-4" /> }
  ].filter(item => hasModule(item.id));

  // If access to the open module is revoked mid-session, fall back to the first granted one.
  React.useEffect(() => {
    if (!hasModule(activeModule) && navItems.length > 0) {
      setActiveModule(navItems[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeModule]);

  const renderMainContent = () => {
    if (!hasModule(activeModule)) {
      return (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            You do not have access to this module. Contact your system administrator.
          </CardContent>
        </Card>
      );
    }
    switch(activeModule) {
      case "admin":
        return <AdminModule />;
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
            <Card className="bg-gradient-to-r from-blue-50 dark:from-blue-950/40 to-green-50 dark:to-green-950/40 border-blue-200 dark:border-blue-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200">System Integration Active</h3>
                    <p className="text-blue-700 dark:text-blue-300">All modules are now fully integrated with real-time data synchronization</p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300">Underwriting ↔ Treaties</Badge>
                    <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300">Claims ↔ Treaties</Badge>
                    <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300">Accounting ↔ All</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maker-checker approvals inbox */}
            {pendingApprovals.length > 0 && (
              <Card className="border-yellow-300 dark:border-yellow-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    Pending Approvals ({pendingApprovals.length})
                  </CardTitle>
                  <CardDescription>
                    Money-moving actions await a second pair of eyes — requesters cannot approve their own items
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingApprovals.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{a.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.type} · {a.currency} {a.amount.toLocaleString()} · requested by {a.requestedBy} · {new Date(a.requestedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleDecide(a.id, true)} disabled={a.requestedBy === user?.username}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDecide(a.id, false)} disabled={a.requestedBy === user?.username}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

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
                      <span className={kpi.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
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
                  {hasModule("underwriting") && (
                    <Button onClick={() => setActiveModule("underwriting")} className="w-full justify-start">
                      <Building className="mr-2 h-4 w-4" />
                      New Underwriting Contract → Auto-Convert to Treaty
                    </Button>
                  )}
                  {hasModule("claims") && (
                    <Button onClick={() => setActiveModule("claims")} variant="outline" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Process Claim → Auto-Link to Treaty & Book Reinstatement
                    </Button>
                  )}
                  {hasModule("treaties") && (
                    <Button onClick={() => setActiveModule("treaties")} variant="outline" className="w-full justify-start">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Book Premium → Update Accounting & Payment Status
                    </Button>
                  )}
                  {hasModule("actuarial") && (
                    <Button onClick={() => setActiveModule("actuarial")} variant="outline" className="w-full justify-start">
                      <Calculator className="mr-2 h-4 w-4" />
                      Run Actuarial Calculations
                    </Button>
                  )}
                  {hasModule("ifrs") && (
                    <Button onClick={() => setActiveModule("ifrs")} variant="outline" className="w-full justify-start">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Generate IFRS 17 Report
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Alerts & Integration Status</CardTitle>
                  <CardDescription>Real-time notifications and data synchronization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
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
                    <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
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
                    <p className="text-2xl font-bold">{treaties.filter(t => t.status === 'Active').length}</p>
                    <Badge variant="secondary">Auto-linked to Claims & Accounting</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Outstanding Claims</p>
                    <p className="text-2xl font-bold">{outstandingClaims.length}</p>
                    <Badge variant="secondary">With Auto-Retro Recovery</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Premium Bookings</p>
                    <p className="text-2xl font-bold">{premiumBookingsCount}</p>
                    <Badge variant="secondary">Real-time Payment Status</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Retrocession Covers</p>
                    <p className="text-2xl font-bold">{retroCoveredTreaties}</p>
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
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 rounded-lg p-2">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AfriReVision Platform</h1>
                <p className="text-sm text-muted-foreground">Fully Integrated Reinsurance Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium">{user.displayName || user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              )}
              <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300">Online</Badge>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
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
      <nav className="bg-card border-b">
        <div className="px-6">
          <div className="flex space-x-8 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeModule === item.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground/90 hover:border-border'
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

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Application preferences and data management</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {user && (
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{user.displayName || user.username}</p>
                <p className="text-muted-foreground">{user.role} · {user.modules.length} module(s) granted</p>
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Appearance</p>
                <p className="text-xs text-muted-foreground">Currently using {theme} mode</p>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                Switch to {theme === 'dark' ? 'light' : 'dark'} mode
              </Button>
            </div>
            <div className="rounded-lg border p-3 space-y-2">
              <div>
                <p className="text-sm font-medium">Backup &amp; Restore</p>
                <p className="text-xs text-muted-foreground">
                  Full snapshot: business data, user accounts, assumptions and settings
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBackup}>
                  <Download className="h-3 w-3 mr-2" /> Download Backup
                </Button>
                <Button variant="outline" size="sm" onClick={() => restoreInputRef.current?.click()}>
                  <Upload className="h-3 w-3 mr-2" /> Restore Backup
                </Button>
                <input ref={restoreInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleRestoreFile} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Application Data</p>
                <p className="text-xs text-muted-foreground">
                  {treaties.length} treaties, {claims.length} claims stored locally
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setResetConfirmOpen(true)}>
                Reset Data
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <AlertDialog open={!!pendingRestore} onOpenChange={o => !o && setPendingRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this backup?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>This replaces ALL current data — business records, user accounts and settings — with the backup contents:</p>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {pendingRestore?.summary.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
                <p className="mt-2">Consider downloading a backup of the current state first. This cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Data Confirmation */}
      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all application data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all treaties, claims, underwriting contracts, and premium bookings
              you have created, and restore the initial sample data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;