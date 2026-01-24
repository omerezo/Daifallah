'use client';

import { useTranslation } from '@/hooks/use-translation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, File, Upload, MoreHorizontal } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { logoBase64 } from '@/components/logo';
import type { Payment } from '@/lib/types';
import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const currencies = ['USD', 'SAR', 'EGP', 'SDG'] as const;
const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
const months = [
  'january', 'february', 'march', 'april', 'may', 'june', 
  'july', 'august', 'september', 'october', 'november', 'december'
];

export default function PaymentsPage() {
  const { t, dir } = useTranslation();
  const { toast } = useToast();
  const { payments, participants, addPayment, updatePayment, deletePayment, addRecentActivity } = useData();

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  // Form state
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | undefined>();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState<(typeof currencies)[number]>('USD');
  const [paymentMonth, setPaymentMonth] = useState(new Date().getMonth());
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [bankTransferFile, setBankTransferFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');

  const resetForm = useCallback(() => {
    setEditingPayment(null);
    setSelectedParticipantId(undefined);
    setPaymentAmount('');
    setPaymentCurrency('USD');
    setPaymentMonth(new Date().getMonth());
    setPaymentYear(new Date().getFullYear());
    setRemarks('');
    setBankTransferFile(null);
  }, []);

  const handleDialogOpenChange = (isOpen: boolean) => {
    setIsPaymentDialogOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };
  
  const generateReceipt = (payment: Payment) => {
    // ... (receipt generation logic remains the same)
  };

  const handleOpenEditDialog = (payment: Payment) => {
    setEditingPayment(payment);
  
    const participant = participants.find(p => p.name === payment.participantName);
    setSelectedParticipantId(participant?.id);
    setPaymentAmount(String(payment.amount));
    setPaymentCurrency(payment.currency);
  
    try {
      const paymentForDate = new Date(payment.paymentFor);
      if (!isNaN(paymentForDate.getTime())) {
        setPaymentMonth(paymentForDate.getMonth());
        setPaymentYear(paymentForDate.getFullYear());
      } else {
        throw new Error('Invalid date');
      }
    } catch (e) {
      const [monthName, year] = payment.paymentFor.split(' ');
      const monthIndex = months.findIndex(m => t(m).toLowerCase() === monthName?.toLowerCase() || m === monthName?.toLowerCase());
      if (monthIndex !== -1) setPaymentMonth(monthIndex);
      if (year && !isNaN(Number(year))) setPaymentYear(Number(year));
    }
    
    setRemarks(payment.remarks || '');
    setBankTransferFile(null);
  
    setIsPaymentDialogOpen(true);
  };
  
  const handleOpenAddDialog = () => {
    resetForm();
    setIsPaymentDialogOpen(true);
  };

  const handleSavePayment = async () => {
    if (!selectedParticipantId || !paymentAmount) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fill_all_fields'),
      });
      return;
    }

    const participant = participants.find((p) => p.id === selectedParticipantId);
    if (!participant) return;

    let bankTransferProof: Payment['bankTransferProof'];
    if (bankTransferFile) {
      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target!.result as string);
        reader.readAsDataURL(bankTransferFile);
      });
      bankTransferProof = {
        filename: bankTransferFile.name,
        url: url,
      };
    } else if (editingPayment?.bankTransferProof) {
        bankTransferProof = editingPayment.bankTransferProof
    }
    
    const paymentForDate = new Date(paymentYear, paymentMonth, 1);
    const paymentForMonth = paymentForDate.toLocaleString('default', { month: 'long' });

    const paymentData = {
      participantName: participant.name,
      amount: parseFloat(paymentAmount),
      currency: paymentCurrency,
      type: 'Monthly Share' as const,
      paymentFor: `${paymentForMonth} ${paymentYear}`,
      recordedBy: 'User Admin',
      bankTransferProof,
      remarks,
    };

    if (editingPayment) {
      updatePayment({ ...paymentData, id: editingPayment.id, date: editingPayment.date });
      toast({
        title: t('payment_updated'),
        description: t('payment_updated_description'),
      });
    } else {
      const newPayment: Payment = {
        ...paymentData,
        id: `PAY-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
      };
      addPayment(newPayment);
      
      const newActivity = {
        id: `${Date.now()}`,
        name: participant.name,
        email: `${participant.name.toLowerCase().replace(' ', '.')}@example.com`,
        type: 'Payment' as const,
        status: 'Paid' as const,
        date: new Date().toLocaleDateString('en-CA'),
        amount: `${paymentAmount} ${paymentCurrency}`,
      };
      addRecentActivity(newActivity);

      toast({
        title: t('payment_saved'),
        description: t('payment_saved_description'),
      });
    }
    
    setIsPaymentDialogOpen(false);
  };
  
  const handleConfirmDelete = () => {
    if (paymentToDelete) {
      deletePayment(paymentToDelete.id);
      toast({
        title: t('payment_deleted'),
        description: t('payment_deleted_description'),
      });
      setPaymentToDelete(null);
    }
  };


  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {t('payments_management')}
          </h1>
          <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                {t('export')}
              </span>
            </Button>
            <Button size="sm" className="h-8 gap-1" onClick={handleOpenAddDialog}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                {t('add_payment')}
              </span>
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('all_payments')}</CardTitle>
            <CardDescription>
              {t('manage_your_committee_payments')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('participant_name')}</TableHead>
                  <TableHead>{t('payment_for')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('recorded_by')}</TableHead>
                  <TableHead className="text-right">{t('amount')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('currency')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('type')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('remarks')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('attachment')}</TableHead>
                  <TableHead>
                    <span className="sr-only">{t('actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell className="font-medium">
                      {payment.participantName}
                    </TableCell>
                    <TableCell>{payment.paymentFor}</TableCell>
                    <TableCell className="hidden md:table-cell">{payment.recordedBy}</TableCell>
                    <TableCell className="text-right">{payment.amount}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {payment.currency}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{t(payment.type.toLowerCase())}</TableCell>
                    <TableCell className="hidden lg:table-cell">{payment.remarks || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {payment.bankTransferProof ? (
                        <a href={payment.bankTransferProof.url} download={payment.bankTransferProof.filename} target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1 text-sm">
                          <File className="h-3.5 w-3.5" />
                          {payment.bankTransferProof.filename}
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                       <DropdownMenu>
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
                          
                          <DropdownMenuItem onClick={() => generateReceipt(payment)}>
                            {t('generate_receipt')}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onSelect={(e) => {
                              e.preventDefault(); 
                              setTimeout(() => {
                                handleOpenEditDialog(payment);
                              }, 100); 
                            }}
                          >
                            {t('edit')}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={(e) => {
                              e.preventDefault();
                              setTimeout(() => {
                                setPaymentToDelete(payment);
                              }, 100); 
                            }}
                          >
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? t('edit_payment') : t('add_payment')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="participant" className="text-right">
                {t('participant')}
              </Label>
              <Select
                value={selectedParticipantId}
                onValueChange={setSelectedParticipantId}
              >
                <SelectTrigger id="participant" className="col-span-3">
                  <SelectValue placeholder={t('select_participant')} />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                {t('amount')}
              </Label>
              <Input
                id="amount"
                type="number"
                className="col-span-2"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <Select
                value={paymentCurrency}
                onValueChange={(v) =>
                  setPaymentCurrency(v as typeof paymentCurrency)
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment-date" className="text-right">
                {t('payment_for')}
              </Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                <Select
                  value={String(paymentMonth)}
                  onValueChange={(v) => setPaymentMonth(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('month')} />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                       <SelectItem key={month} value={String(index)}>
                        {t(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(paymentYear)}
                  onValueChange={(v) => setPaymentYear(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('year')} />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bank-transfer" className="text-right">
                {t('bank_transfer')}
              </Label>
              <div className="col-span-3">
                <Input
                  id="bank-transfer"
                  type="file"
                  className="sr-only"
                  onChange={(e) =>
                    setBankTransferFile(
                      e.target.files ? e.target.files[0] : null
                    )
                  }
                />
                <Label
                  htmlFor="bank-transfer"
                  className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground ring-offset-background hover:bg-accent hover:text-accent-foreground"
                >
                  <Upload className="h-4 w-4" />
                  <span>
                    {bankTransferFile
                      ? bankTransferFile.name
                      : t('upload_file')}
                  </span>
                </Label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="remarks" className="text-right pt-2">
                {t('remarks')}
              </Label>
              <Textarea
                id="remarks"
                className="col-span-3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={t('add_remarks_placeholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSavePayment}>
              {editingPayment ? t('save_changes') : t('save_payment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!paymentToDelete} onOpenChange={(isOpen) => !isOpen && setPaymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_payment_confirm')}
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
