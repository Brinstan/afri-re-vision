import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { UserPlus, KeyRound, ShieldCheck, ShieldOff, Users, Grid3x3 } from 'lucide-react';
import { useUserStore } from './UserStore';
import { useAuth } from './AuthContext';
import { MODULES, ROLES, ROLE_TEMPLATES, UserAccount } from '../access/permissions';

const AdminModule = () => {
  const { users, addUser, updateUser, setPassword, removeUser } = useUserStore();
  const { user: me, refreshSession } = useAuth();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserAccount | null>(null);
  const [pwUser, setPwUser] = useState<UserAccount | null>(null);

  // Create form
  const [cUsername, setCUsername] = useState('');
  const [cDisplay, setCDisplay] = useState('');
  const [cRole, setCRole] = useState('Underwriter');
  const [cModules, setCModules] = useState<string[]>(ROLE_TEMPLATES['Underwriter']);
  const [cPassword, setCPassword] = useState('');
  const [cError, setCError] = useState('');

  // Edit form
  const [eRole, setERole] = useState('');
  const [eModules, setEModules] = useState<string[]>([]);

  // Password form
  const [newPw, setNewPw] = useState('');

  const applyTemplate = (role: string, setModules: (m: string[]) => void) => {
    setModules(ROLE_TEMPLATES[role] ?? ['dashboard']);
  };

  const toggleModule = (list: string[], setList: (m: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter(m => m !== id) : [...list, id]);
  };

  const adminCount = users.filter(u => u.active && u.modules.includes('admin')).length;

  const handleCreate = async () => {
    setCError('');
    const res = await addUser({
      username: cUsername, displayName: cDisplay, role: cRole, modules: cModules, password: cPassword,
    });
    if (!res.ok) { setCError(res.error || 'Could not create user'); return; }
    toast.success(`User ${cUsername.trim()} created with ${cModules.length} module(s)`);
    setCreateOpen(false);
    setCUsername(''); setCDisplay(''); setCPassword('');
    setCRole('Underwriter'); setCModules(ROLE_TEMPLATES['Underwriter']);
  };

  const openEdit = (u: UserAccount) => {
    setEditUser(u);
    setERole(u.role);
    setEModules(u.modules);
  };

  const handleSaveEdit = () => {
    if (!editUser) return;
    if (editUser.id === me?.id && !eModules.includes('admin')) {
      toast.error('You cannot remove your own Administration access');
      return;
    }
    if (!eModules.length) {
      toast.error('Grant at least one module');
      return;
    }
    updateUser(editUser.id, { role: eRole, modules: eModules });
    refreshSession();
    toast.success(`Access updated for ${editUser.username}`);
    setEditUser(null);
  };

  const handleToggleActive = (u: UserAccount) => {
    if (u.id === me?.id) { toast.error('You cannot deactivate your own account'); return; }
    if (u.active && u.modules.includes('admin') && adminCount <= 1) {
      toast.error('At least one active administrator is required');
      return;
    }
    updateUser(u.id, { active: !u.active });
    toast.success(`${u.username} ${u.active ? 'deactivated' : 'reactivated'}`);
  };

  const handleSetPassword = async () => {
    if (!pwUser) return;
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    await setPassword(pwUser.id, newPw);
    if (pwUser.id === me?.id) refreshSession();
    toast.success(`Password updated for ${pwUser.username}`);
    setPwUser(null); setNewPw('');
  };

  const handleRemove = (u: UserAccount) => {
    if (u.id === me?.id) { toast.error('You cannot delete your own account'); return; }
    if (u.modules.includes('admin') && adminCount <= 1) {
      toast.error('At least one administrator is required');
      return;
    }
    removeUser(u.id);
    toast.success(`User ${u.username} deleted`);
  };

  const moduleChecklist = (list: string[], setList: (m: string[]) => void) => (
    <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
      {MODULES.map(m => (
        <label key={m.id} className="flex items-start space-x-2 text-sm cursor-pointer">
          <Checkbox
            checked={list.includes(m.id)}
            onCheckedChange={() => toggleModule(list, setList, m.id)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">{m.label}</span>
            <span className="block text-xs text-muted-foreground">{m.description}</span>
          </span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Administration</h2>
          <p className="text-muted-foreground">
            User accounts and feature-based module access, granted by the System Administrator
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> New User
        </Button>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Users</TabsTrigger>
          <TabsTrigger value="matrix"><Grid3x3 className="mr-2 h-4 w-4" />Access Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Accounts</CardTitle>
              <CardDescription>{users.length} account(s) · {adminCount} active administrator(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="font-medium">{u.displayName}</p>
                        <p className="text-xs text-muted-foreground">{u.username}{u.id === me?.id && ' (you)'}</p>
                      </TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.modules.map(m => (
                            <Badge key={m} variant="secondary" className="text-xs">
                              {MODULES.find(x => x.id === m)?.label ?? m}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.active
                          ? <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300">Active</Badge>
                          : <Badge variant="destructive">Inactive</Badge>}
                        {u.passwordHash === '' && (
                          <Badge variant="outline" className="ml-1 text-xs">Default password</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button variant="outline" size="sm" onClick={() => openEdit(u)}>Access</Button>
                        <Button variant="outline" size="sm" onClick={() => { setPwUser(u); setNewPw(''); }}>
                          <KeyRound className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleToggleActive(u)}>
                          {u.active ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRemove(u)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Access Matrix</CardTitle>
              <CardDescription>Which user can reach which module</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    {MODULES.map(m => (
                      <TableHead key={m.id} className="text-center text-xs">{m.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id} className={u.active ? '' : 'opacity-50'}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      {MODULES.map(m => (
                        <TableCell key={m.id} className="text-center">
                          {u.modules.includes(m.id)
                            ? <span className="text-green-600 dark:text-green-400">✓</span>
                            : <span className="text-muted-foreground/70">—</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create user */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Pick a role template, then tailor the module access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Username</Label>
                <Input value={cUsername} onChange={e => setCUsername(e.target.value)} placeholder="jdoe" />
              </div>
              <div className="space-y-1">
                <Label>Display Name</Label>
                <Input value={cDisplay} onChange={e => setCDisplay(e.target.value)} placeholder="Jane Doe" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Role Template</Label>
                <Select value={cRole} onValueChange={r => { setCRole(r); applyTemplate(r, setCModules); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" value={cPassword} onChange={e => setCPassword(e.target.value)} placeholder="min 6 characters" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Module Access ({cModules.length} granted)</Label>
              {moduleChecklist(cModules, setCModules)}
            </div>
            {cError && <p className="text-sm text-red-600 dark:text-red-400">{cError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit access */}
      <Dialog open={!!editUser} onOpenChange={o => !o && setEditUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Module Access — {editUser?.displayName}</DialogTitle>
            <DialogDescription>Grant or revoke the modules this user can open.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Role Template</Label>
              <Select value={eRole} onValueChange={r => { setERole(r); applyTemplate(r, setEModules); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Module Access ({eModules.length} granted)</Label>
              {moduleChecklist(eModules, setEModules)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Access</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set password */}
      <Dialog open={!!pwUser} onOpenChange={o => !o && setPwUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Password — {pwUser?.username}</DialogTitle>
            <DialogDescription>The user will sign in with this password from now on.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label>New Password</Label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="min 6 characters" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwUser(null)}>Cancel</Button>
            <Button onClick={handleSetPassword}>Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModule;
