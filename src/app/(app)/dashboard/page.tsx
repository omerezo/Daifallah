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
  recentActivities as initialRecentActivities,
  payments as initialPayments,
  expenses as allExpenses,
  participants,
} from '@/lib/placeholder-data';
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

const currencies = ['USD', 'SAR', 'EGP', 'SDG'] as const;

export default function DashboardPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  const [payments, setPayments] = useState(initialPayments);
  const [recentActivities, setRecentActivities] = useState(
    initialRecentActivities
  );

  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | undefined
  >();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] =
    useState<(typeof currencies)[number]>('USD');

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
  }, [payments]);

  const handleSavePayment = () => {
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

    const newPayment = {
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      participantName: participant.name,
      amount: parseFloat(paymentAmount),
      currency: paymentCurrency,
      type: 'Monthly Share' as const,
    };

    const newActivity = {
      id: `${Date.now()}`,
      name: participant.name,
      email: `${participant.name.toLowerCase().replace(' ', '.')}@example.com`,
      type: 'Payment' as const,
      status: 'Paid' as const,
      date: new Date().toLocaleDateString('en-CA'),
      amount: `${paymentAmount} ${paymentCurrency}`,
    };

    setPayments((prevPayments) => [newPayment, ...prevPayments]);
    setRecentActivities((prevActivities) => [newActivity, ...prevActivities]);

    toast({
      title: t('payment_saved'),
      description: t('payment_saved_description'),
    });
    
    // Reset form and close dialog
    setSelectedParticipantId(undefined);
    setPaymentAmount('');
    setPaymentCurrency('USD');
    setIsRecordPaymentOpen(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
          {t('dashboard')}
        </h1>
        <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-2">
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
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('record_payment')}</DialogTitle>
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
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleSavePayment}>
                  {t('save_payment')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('active_members')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73</div>
            <p className="text-xs text-muted-foreground">
              +2 since last month
            </p>
          </CardContent>
        </Card>
      </div>

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
                {recentActivities.map((activity) => (
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
