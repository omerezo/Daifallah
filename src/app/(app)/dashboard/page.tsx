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
  Plus,
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
  recentActivities,
  payments,
  expenses as allExpenses,
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
import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const currencies = ['USD', 'SAR', 'EGP', 'SDG'] as const;

export default function DashboardPage() {
  const { t } = useTranslation();

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
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
        {t('dashboard')}
      </h1>

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
      <Dialog>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg md:bottom-8 md:right-8"
            aria-label={t('record_payment')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('record_payment')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t('participant')}
              </Label>
              <Input id="name" value="Ahmed Ali" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                {t('amount')}
              </Label>
              <Input id="amount" type="number" className="col-span-2" />
              <Select defaultValue="usd">
                <SelectTrigger className="col-span-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="sar">SAR</SelectItem>
                  <SelectItem value="egp">EGP</SelectItem>
                  <SelectItem value="sdg">SDG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{t('save_payment')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
