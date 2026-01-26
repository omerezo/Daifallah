
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
import { PlusCircle, File } from 'lucide-react';
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
import { MoreHorizontal } from 'lucide-react';
import { useData } from '@/context/data-provider';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Participant } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const currencies = ['USD', 'SAR', 'EGP', 'SDG'] as const;

export default function ParticipantsPage() {
  const { t } = useTranslation();
  const { participants, addParticipant, updateParticipant, deleteParticipant, currentUser } = useData();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [shareAmount, setShareAmount] = useState('');
  const [shareCurrency, setShareCurrency] =
    useState<(typeof currencies)[number]>('USD');

  // Edit State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] =
    useState<Participant | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editShareAmount, setEditShareAmount] = useState('');
  const [editShareCurrency, setEditShareCurrency] =
    useState<(typeof currencies)[number]>('USD');
    
  // Delete State
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);

  useEffect(() => {
    if (editingParticipant) {
      setEditName(editingParticipant.name);
      setEditPhone(editingParticipant.phone);
      const [amount, currency] = editingParticipant.monthlyShare.split(' ');
      setEditShareAmount(amount);
      setEditShareCurrency(currency as (typeof currencies)[number]);
    }
  }, [editingParticipant]);

  const handleExportCSV = () => {
    if (participants.length === 0) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('no_data_to_export'),
      });
      return;
    }

    const headers = [
      t('name'),
      t('phone'),
      t('monthly_share'),
      t('status'),
      t('last_payment_date'),
    ];

    const data = participants.map((p) => [
      p.name,
      p.phone,
      p.monthlyShare,
      t(p.status.toLowerCase()),
      p.lastPaymentDate || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'participants.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: t('export_successful'),
      description: t('csv_download_description'),
    });
  };

  const handleAddParticipant = () => {
    if (!name || !phone || !shareAmount) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fill_all_fields'),
      });
      return;
    }

    addParticipant({
      name,
      phone,
      monthlyShare: `${shareAmount} ${shareCurrency}`,
      status: 'Active',
    });

    toast({
      title: t('participant_added'),
      description: t('participant_added_description', { name }),
    });

    setName('');
    setPhone('');
    setShareAmount('');
    setShareCurrency('USD');
    setIsAddDialogOpen(false);
  };

  const handleOpenEditDialog = (participant: Participant) => {
    setEditingParticipant(participant);
    setIsEditDialogOpen(true);
  };

  const handleUpdateParticipant = () => {
    if (!editingParticipant || !editName || !editPhone || !editShareAmount) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fill_all_fields'),
      });
      return;
    }

    const updatedParticipant: Participant = {
      ...editingParticipant,
      name: editName,
      phone: editPhone,
      monthlyShare: `${editShareAmount} ${editShareCurrency}`,
    };

    updateParticipant(updatedParticipant);

    toast({
      title: t('participant_updated'),
      description: t('participant_updated_description', { name: editName }),
    });

    setIsEditDialogOpen(false);
    setEditingParticipant(null);
  };

  const handleToggleStatus = (participant: Participant) => {
    const newStatus = participant.status === 'Active' ? 'Inactive' : 'Active';
    const updatedParticipant: Participant = { ...participant, status: newStatus };
    updateParticipant(updatedParticipant);
    toast({
      title: t('status_updated'),
      description: t('status_updated_description', {
        name: participant.name,
        status: t(newStatus.toLowerCase()),
      }),
    });
  };

  const handleConfirmDelete = () => {
    if (participantToDelete) {
      deleteParticipant(participantToDelete.id);
      toast({
        title: t('participant_deleted'),
        description: t('participant_deleted_description', { name: participantToDelete.name }),
      });
      setParticipantToDelete(null);
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
            {t('participants_management')}
          </h1>
          <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExportCSV}>
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                {t('export_csv')}
              </span>
            </Button>
            {currentUser.role !== 'Viewer' && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      {t('add_participant')}
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('add_participant')}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
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
                      <Label htmlFor="phone" className="text-right">
                        {t('phone')}
                      </Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="monthly-share" className="text-right">
                        {t('monthly_share')}
                      </Label>
                      <Input
                        id="monthly-share"
                        type="number"
                        value={shareAmount}
                        onChange={(e) => setShareAmount(e.target.value)}
                        className="col-span-2"
                      />
                      <Select
                        value={shareCurrency}
                        onValueChange={(v) =>
                          setShareCurrency(v as typeof shareCurrency)
                        }
                      >
                        <SelectTrigger className="col-span-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddParticipant}>
                      {t('save_participant')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('all_participants')}</CardTitle>
            <CardDescription>
              {t('manage_your_committee_members')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('phone')}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t('monthly_share')}
                  </TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t('last_payment_date')}
                  </TableHead>
                  {currentUser.role !== 'Viewer' && (
                    <TableHead>
                      <span className="sr-only">{t('actions')}</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium">
                      {participant.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {participant.phone}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {participant.monthlyShare}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          participant.status === 'Active'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {t(participant.status.toLowerCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {participant.lastPaymentDate || '-'}
                    </TableCell>
                    {currentUser.role !== 'Viewer' && (
                      <TableCell>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t('toggle_menu')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                            <DropdownMenuItem
                              onSelect={() => {
                                setTimeout(() => {
                                  handleOpenEditDialog(participant);
                                }, 100);
                              }}
                            >
                              {t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(participant)}
                            >
                              {participant.status === 'Active'
                                ? t('deactivate')
                                : t('activate')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onSelect={() => {
                                setTimeout(() => {
                                  setParticipantToDelete(participant);
                                }, 100);
                              }}
                            >
                              {t('delete')}
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

        {/* Edit Participant Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('edit_participant')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  {t('name')}
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  {t('phone')}
                </Label>
                <Input
                  id="edit-phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-monthly-share" className="text-right">
                  {t('monthly_share')}
                </Label>
                <Input
                  id="edit-monthly-share"
                  type="number"
                  value={editShareAmount}
                  onChange={(e) => setEditShareAmount(e.target.value)}
                  className="col-span-2"
                />
                <Select
                  value={editShareCurrency}
                  onValueChange={(v) =>
                    setEditShareCurrency(v as typeof editShareCurrency)
                  }
                >
                  <SelectTrigger className="col-span-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateParticipant}>{t('save_changes')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!participantToDelete} onOpenChange={(isOpen) => !isOpen && setParticipantToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_participant_confirm', { name: participantToDelete?.name })}
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
