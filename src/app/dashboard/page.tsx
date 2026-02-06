'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Upload,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-provider';
import type { Payment } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const currencies = ['USD', 'SAR', 'EGP', 'SDG'] as const;

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 3 - i);
const months = [
  'january', 'february', 'march', 'april', 'may', 'june', 
  'july', 'august', 'september', 'october', 'november', 'december'
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function DashboardPage() {
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const {
    payments,
    addPayment,
    recentActivities,
    addRecentActivity,
    participants,
    expenses: allExpenses,
    currentUser,
  } = useData();

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  // Single payment state
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | undefined
  >();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] =
    useState<(typeof currencies)[number]>('USD');
  const [paymentMonth, setPaymentMonth] = useState(new Date().getMonth());
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [bankTransferFile, setBankTransferFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');

  // Multiple payment state
  const [multiPaymentMode, setMultiPaymentMode] = useState<'single' | 'bulk'>('single');
  const [selectedMonths, setSelectedMonths] = useState<Record<number, boolean>>({});
  const [multiPaymentAmount, setMultiPaymentAmount] = useState('');
  const [multiPaymentYear, setMultiPaymentYear] = useState(new Date().getFullYear());

  const numSelectedMonths = useMemo(() => Object.values(selectedMonths).filter(Boolean).length, [selectedMonths]);
  const distributedAmount = useMemo(() => {
    if (multiPaymentMode !== 'bulk' || !multiPaymentAmount || numSelectedMonths === 0) {
      return 0;
    }
    return parseFloat(multiPaymentAmount) / numSelectedMonths;
  }, [multiPaymentAmount, numSelectedMonths, multiPaymentMode]);

  const currencySummaries = useMemo(() => {
    const summaries = {} as Record<
      (typeof currencies)[number],
      { collected: number; expenses: number; net: number }
    >;

    for (const currency of currencies) {
      const collected = payments
        .filter((p) => p.currency === currency)
        .reduce((sum, p) => sum + p.amount, 0);

      const expenses = allExpenses
        .filter((e) => e.currency === currency)
        .reduce((sum, e) => sum + e.amount, 0);

      summaries[currency] = {
        collected,
        expenses,
        net: collected - expenses,
      };
    }
    return summaries;
  }, [payments, allExpenses]);

  const activeMembersCount = useMemo(() => {
    return participants.filter((p) => p.status === 'Active').length;
  }, [participants]);
  
  const resetSinglePaymentForm = () => {
    setSelectedParticipantId(undefined);
    setPaymentAmount('');
    setPaymentCurrency('USD');
    setPaymentMonth(new Date().getMonth());
    setPaymentYear(new Date().getFullYear());
    setBankTransferFile(null);
    setRemarks('');
  };

  const resetMultiPaymentForm = () => {
    // Keep participant ID if user just wants to switch modes
    // setSelectedParticipantId(undefined); 
    setMultiPaymentMode('single');
    setSelectedMonths({});
    setMultiPaymentAmount('');
    setMultiPaymentYear(new Date().getFullYear());
    setBankTransferFile(null); // Also reset file for multi-payment
    setRemarks(''); // And remarks
  }


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
    if (!participant || !currentUser) return;

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
    }
    
    const newPayment: Omit<Payment, 'id' | 'date'> = {
      participantId: participant.id,
      participantName: participant.name,
      amount: parseFloat(paymentAmount),
      currency: paymentCurrency,
      type: 'Monthly Share' as const,
      paymentFor: `${paymentYear}-${String(paymentMonth + 1).padStart(2, '0')}`,
      recordedBy: currentUser.id,
      remarks,
    };
    
    if (bankTransferProof) {
        (newPayment as Payment).bankTransferProof = bankTransferProof;
    }

    const newActivity = {
      id: `${Date.now()}`,
      name: participant.name,
      email: `${participant.name.toLowerCase().replace(' ', '.')}@example.com`,
      type: 'Payment' as const,
      status: 'Paid' as const,
      date: new Date().toLocaleDateString('en-CA'),
      amount: `${paymentAmount} ${paymentCurrency}`,
    };

    addPayment(newPayment);
    addRecentActivity(newActivity);

    toast({
      title: t('payment_saved'),
      description: t('payment_saved_description'),
    });
    
    resetSinglePaymentForm();
    setIsRecordPaymentOpen(false);
  };
  
  const handleSaveMultiplePayments = async () => {
    if (!selectedParticipantId || !multiPaymentAmount || numSelectedMonths === 0) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fill_all_fields'),
      });
      return;
    }

    const participant = participants.find((p) => p.id === selectedParticipantId);
    if (!participant || !currentUser) return;

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
    }

    const amountPerMonth = multiPaymentMode === 'bulk' ? distributedAmount : parseFloat(multiPaymentAmount);
    
    const monthIndices = Object.entries(selectedMonths)
      .filter(([, isSelected]) => isSelected)
      .map(([index]) => parseInt(index, 10));

    for (const monthIndex of monthIndices) {
      const paymentData: Omit<Payment, 'id'|'date'> = {
        participantId: participant.id,
        participantName: participant.name,
        amount: amountPerMonth,
        currency: paymentCurrency,
        type: 'Monthly Share',
        paymentFor: `${multiPaymentYear}-${String(monthIndex + 1).padStart(2, '0')}`,
        recordedBy: currentUser.id,
        remarks,
        ...(bankTransferProof && { bankTransferProof }),
      };
      
      addPayment(paymentData);
      
      const activity = {
        id: `${Date.now()}-${monthIndex}`,
        name: participant.name,
        email: `${participant.name.toLowerCase().replace(' ', '.')}@example.com`,
        type: 'Payment' as const,
        status: 'Paid' as const,
        date: new Date().toLocaleDateString('en-CA'),
        amount: `${amountPerMonth.toFixed(2)} ${paymentCurrency}`,
      };
      addRecentActivity(activity);
    }
    
    toast({
      title: 'Payments Saved',
      description: `Successfully recorded ${monthIndices.length} payments for ${participant.name}.`,
    });
    
    resetMultiPaymentForm();
    setIsRecordPaymentOpen(false);
  };

  
  if (!currentUser) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          {t('dashboard')}
        </h1>
        <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-2">
          {currentUser.role !== 'Viewer' && (
            <Dialog
              open={isRecordPaymentOpen}
              onOpenChange={setIsRecordPaymentOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t('record_payment')}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>{t('record_payment')}</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="single" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">Single Payment</TabsTrigger>
                    <TabsTrigger value="multiple">Multiple Payments</TabsTrigger>
                  </TabsList>
                  
                  {/* Single Payment Tab */}
                  <TabsContent value="single">
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
                        <Label htmlFor="bank-transfer-single" className="text-right">
                          {t('bank_transfer')}
                        </Label>
                        <div className="col-span-3">
                          <Input
                            id="bank-transfer-single"
                            type="file"
                            className="sr-only"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    if (file.size > MAX_FILE_SIZE) {
                                        toast({
                                            variant: 'destructive',
                                            title: t('error'),
                                            description: t('file_too_large'),
                                        });
                                        setBankTransferFile(null);
                                        e.target.value = '';
                                    } else {
                                        setBankTransferFile(file);
                                    }
                                }
                            }}
                          />
                          <Label
                            htmlFor="bank-transfer-single"
                            className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground ring-offset-background hover:bg-accent hover:text-accent-foreground"
                          >
                            <Upload className="h-4 w-4" />
                            <span>
                              {bankTransferFile
                                ? bankTransferFile.name
                                : t('upload_file')}
                            </span>
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">{t('max_image_file_size_info')}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="remarks-single" className="text-right pt-2">
                          {t('remarks')}
                        </Label>
                        <Textarea
                          id="remarks-single"
                          className="col-span-3"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder={t('add_remarks_placeholder')}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" onClick={handleSavePayment}>
                        {t('save_payment')}
                      </Button>
                    </DialogFooter>
                  </TabsContent>

                  {/* Multiple Payments Tab */}
                  <TabsContent value="multiple">
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="participant-multi" className="text-right">
                              {t('participant')}
                            </Label>
                            <Select
                              value={selectedParticipantId}
                              onValueChange={setSelectedParticipantId}
                            >
                              <SelectTrigger id="participant-multi" className="col-span-3">
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
                            <Label className="text-right">Mode</Label>
                             <RadioGroup value={multiPaymentMode} onValueChange={(v) => setMultiPaymentMode(v as 'single'|'bulk')} className="col-span-3 flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="single" id="r1" />
                                    <Label htmlFor="r1">Single amount per month</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="bulk" id="r2" />
                                    <Label htmlFor="r2">Distribute bulk amount</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                           <Label htmlFor="amount-multi" className="text-right">
                              {multiPaymentMode === 'single' ? "Amount per Month" : "Total Bulk Amount"}
                            </Label>
                            <Input
                              id="amount-multi"
                              type="number"
                              className="col-span-2"
                              value={multiPaymentAmount}
                              onChange={(e) => setMultiPaymentAmount(e.target.value)}
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
                            <Label htmlFor="year-multi" className="text-right">
                              {t('year')}
                            </Label>
                             <Select
                                value={String(multiPaymentYear)}
                                onValueChange={(v) => setMultiPaymentYear(Number(v))}
                              >
                                <SelectTrigger id="year-multi" className="col-span-1">
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
                         <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Months</Label>
                            <div className="col-span-3">
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                {months.map((month, index) => (
                                    <div key={month} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`month-${index}`}
                                            checked={!!selectedMonths[index]}
                                            onCheckedChange={(checked) => {
                                                setSelectedMonths(prev => ({...prev, [index]: !!checked}))
                                            }}
                                        />
                                        <Label htmlFor={`month-${index}`} className="font-normal">{t(month)}</Label>
                                    </div>
                                ))}
                                </div>
                                <div className="flex items-center space-x-2 mt-4 border-t pt-4">
                                    <Checkbox
                                        id="select-all-months"
                                        checked={numSelectedMonths === 12}
                                        onCheckedChange={(checked) => {
                                            const newSelectedMonths: Record<number, boolean> = {};
                                            if (checked) {
                                                for(let i=0; i<12; i++) {
                                                    newSelectedMonths[i] = true;
                                                }
                                            }
                                            setSelectedMonths(newSelectedMonths);
                                        }}
                                    />
                                    <Label htmlFor="select-all-months" className="font-semibold">Select All</Label>
                                </div>
                            </div>
                         </div>
                        {multiPaymentMode === 'bulk' && distributedAmount > 0 && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Amount/Month</Label>
                                <div className="col-span-3 text-sm text-muted-foreground">
                                    {distributedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {paymentCurrency} will be recorded for each of the {numSelectedMonths} selected months.
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label htmlFor="remarks-multi" className="text-right pt-2">
                            {t('remarks')}
                          </Label>
                          <Textarea
                            id="remarks-multi"
                            className="col-span-3"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder={`${t('add_remarks_placeholder')} (will be applied to all records)`}
                          />
                        </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" onClick={handleSaveMultiplePayments}>
                        Save {numSelectedMonths} Payments
                      </Button>
                    </DialogFooter>
                  </TabsContent>

                </Tabs>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('active_members')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembersCount}</div>
            <p className="text-xs text-muted-foreground">
              {t('from_total_members', { total: participants.length })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={currencies[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {currencies.map((currency) => (
            <TabsTrigger key={currency} value={currency}>
              {currency}
            </TabsTrigger>
          ))}
        </TabsList>
        {currencies.map((currency) => (
          <TabsContent key={currency} value={currency}>
            <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('total_collected_month')}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currencySummaries[currency].collected.toLocaleString()}
                    <span className="text-xs text-muted-foreground ltr:ml-1 rtl:mr-1">
                      {currency}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('total_expenses')}
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currencySummaries[currency].expenses.toLocaleString()}
                    <span className="text-xs text-muted-foreground ltr:ml-1 rtl:mr-1">
                      {currency}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +15.2% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('net_balance')}
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currencySummaries[currency].net.toLocaleString()}
                    <span className="text-xs text-muted-foreground ltr:ml-1 rtl:mr-1">
                      {currency}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +180.1% from last month
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="grid grid-cols-1 gap-4 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('recent_activity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('participant')}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('type')}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('status')}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t('date')}
                  </TableHead>
                  <TableHead className="text-right">{t('amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.slice(0, 5).map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="font-medium">{activity.name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {activity.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {t(activity.type.toLowerCase())}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        className="text-xs"
                        variant={
                          activity.status === 'Paid' ? 'secondary' : 'outline'
                        }
                      >
                        {t(activity.status.toLowerCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {activity.date}
                    </TableCell>
                    <TableCell className="text-right">
                      {activity.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
