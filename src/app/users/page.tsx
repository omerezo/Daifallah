
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldAlert, MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useData } from '@/context/data-provider';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { UserRole, UserProfile } from '@/lib/types';
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const roles: UserRole[] = ['Admin', 'Manager', 'Collector', 'Viewer'];

export default function UsersPage() {
  const { t } = useTranslation();
  const { currentUser, users, addUser, updateUser, deleteUser } = useData();
  const { toast } = useToast();
  const auth = useAuth();

  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Viewer');

  // Edit User State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Viewer');

  // Delete User State
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (editingUser) {
      setEditName(editingUser.name);
      setEditEmail(editingUser.email);
      setEditRole(editingUser.role);
    } else {
      setEditName('');
      setEditEmail('');
      setEditRole('Viewer');
    }
  }, [editingUser]);

  const handleAddUser = async () => {
    if (!name || !email || !password) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fill_all_fields'),
      });
      return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUserId = userCredential.user.uid;

        addUser({ id: newUserId, name, email, role });

        toast({
          title: t('user_added'),
          description: t('user_added_description', { name }),
        });

        setName('');
        setEmail('');
        setPassword('');
        setRole('Viewer');
        setIsAddUserOpen(false);
    } catch (error: any) {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: error.message,
        });
    }
  };
  
  const handleOpenEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser || !editName || !editEmail) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fill_all_fields'),
      });
      return;
    }
    
    // Don't allow an admin to demote the last remaining admin
    const adminCount = users.filter(u => u.role === 'Admin').length;
    if (currentUser?.id === editingUser.id && editingUser.role === 'Admin' && editRole !== 'Admin' && adminCount <= 1) {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: "You cannot demote the last admin account.",
        });
        return;
    }

    updateUser({
      ...editingUser,
      name: editName,
      email: editEmail,
      role: editRole,
    });
    
    toast({
        title: t('user_updated'),
        description: t('user_updated_description', {name: editName})
    });
    
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };


  const handleConfirmDelete = () => {
    if (userToDelete) {
      if (userToDelete.id === currentUser?.id) {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: 'You cannot delete your own account.',
        });
        setUserToDelete(null);
        return;
      }

      deleteUser(userToDelete.id);
      toast({
        title: t('user_deleted'),
        description: t('user_deleted_description', {
          name: userToDelete.name,
        }),
      });
      setUserToDelete(null);
    }
  };

  if (!currentUser) {
    return null; // Or a loading spinner
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {t('user_management')}
          </h1>
          <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-2">
            {currentUser?.role === 'Admin' && (
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      {t('add_user')}
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('add_user')}</DialogTitle>
                    <DialogDescription>
                      {t('add_user_description')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right" htmlFor="name">
                        {t('name')}
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right" htmlFor="email">
                        {t('email')}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right" htmlFor="password">
                        {t('password')}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right" htmlFor="role">
                        {t('user_role')}
                      </Label>
                      <Select
                        value={role}
                        onValueChange={(v) => setRole(v as UserRole)}
                      >
                        <SelectTrigger id="role" className="col-span-3">
                          <SelectValue placeholder={t('select_role')} />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {t(r.toLowerCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddUser}>{t('save_user')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('all_users')}</CardTitle>
            <CardDescription>{t('manage_users_and_roles')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('email')}
                  </TableHead>
                  <TableHead>{t('role')}</TableHead>
                  {currentUser?.role === 'Admin' && (
                    <TableHead>
                      <span className="sr-only">{t('actions')}</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t(user.role.toLowerCase())}
                      </Badge>
                    </TableCell>
                    {currentUser?.role === 'Admin' && (
                      <TableCell>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">
                                {t('toggle_menu')}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => handleOpenEditDialog(user)}>
                              {t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => setUserToDelete(user)}
                              disabled={user.id === currentUser?.id}
                            >
                              {t('delete_user')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {currentUser?.role === 'Admin' && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" />
                {t('danger_zone')}
              </CardTitle>
              <CardDescription>{t('irreversible_actions')}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    {t('clear_all_system_data')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('clear_data_warning')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('confirm_password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t('enter_your_password')}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => alert('Data cleared... (in a real app)')}
                    >
                      {t('confirm_and_delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) setEditingUser(null);
      }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('edit_user')}</DialogTitle>
                <DialogDescription>{t('edit_user_description')}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor="edit-name">{t('name')}</Label>
                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor="edit-email">{t('email')}</Label>
                <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor="edit-role">{t('user_role')}</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as UserRole)}>
                    <SelectTrigger id="edit-role" className="col-span-3">
                        <SelectValue placeholder={t('select_role')} />
                    </SelectTrigger>
                    <SelectContent>
                        {roles.map((r) => (
                        <SelectItem key={r} value={r} disabled={r === 'Admin' && currentUser?.id !== editingUser?.id && currentUser?.role !== 'Admin'}>
                            {t(r.toLowerCase())}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            </div>
            <DialogFooter>
                <Button onClick={handleUpdateUser}>{t('save_changes')}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_user_confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_user_confirm_description', {
                name: userToDelete?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
