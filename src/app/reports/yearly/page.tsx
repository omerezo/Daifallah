'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { File, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/context/data-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 3 - i);
const months = [
  'january', 'february', 'march', 'april', 'may', 'june', 
  'july', 'august', 'september', 'october', 'november', 'december'
];
const currencies = ['USD', 'SAR', 'EGP', 'SDG'] as const;

export default function YearlyReportsPage() {
  const { t, dir } = useTranslation();
  const { payments, expenses } = useData();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCurrency, setSelectedCurrency] = useState<(typeof currencies)[number]>('USD'); 

  const handlePrint = () => {
    window.print();
  };

  const yearlyData = useMemo(() => {
    const filteredPayments = payments.filter((p) => {
      const paymentForDate = new Date(p.paymentFor);
      return (
        paymentForDate.getFullYear() === selectedYear &&
        p.currency === selectedCurrency
      );
    });

    const filteredExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date + 'T00:00:00');
      return (
        expenseDate.getFullYear() === selectedYear &&
        e.currency === selectedCurrency
      );
    });

    const totalIncome = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalIncome - totalExpenses;

    const chartData = months.map((month, index) => {
        const monthIncome = filteredPayments
            .filter(p => new Date(p.paymentFor).getMonth() === index)
            .reduce((sum, p) => sum + p.amount, 0);
        const monthExpenses = filteredExpenses
            .filter(e => new Date(e.date + 'T00:00:00').getMonth() === index)
            .reduce((sum, e) => sum + e.amount, 0);
        
        return {
            name: t(month),
            income: monthIncome,
            expenses: monthExpenses,
        };
    });

    const allTransactions = [
      ...filteredPayments.map(p => ({ ...p, id: `p-${p.id}`, transactionType: 'Income' as const, description: `${t('payment_for')} ${p.paymentFor}` })),
      ...filteredExpenses.map(e => ({ ...e, id: `e-${e.id}`, transactionType: 'Expense' as const, participantName: e.description }))
    ].sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime());


    return { totalIncome, totalExpenses, netBalance, chartData, allTransactions };
  }, [payments, expenses, selectedYear, selectedCurrency, t]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {t('yearly_reports')}
          </h1>
          <p className="text-muted-foreground">
            {t('yoy_growth_overview')}
          </p>
        </div>
        <div className="flex items-center gap-2 ltr:md:ml-auto rtl:md:mr-auto">
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[120px]">
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
           <Select
            value={selectedCurrency}
            onValueChange={(v) => setSelectedCurrency(v as (typeof currencies)[number])}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder={t('currency')} />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-10 gap-1" onClick={handlePrint}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              {t('export_pdf')}
            </span>
          </Button>
        </div>
      </div>
      
      <div className="space-y-8">
        <div className="text-center print-only-title">
            <div className="mx-auto mb-4 h-16 w-16">
              <Logo />
            </div>
            <h1 className="font-display text-3xl font-bold">{t('app_name')}</h1>
            <h2 className="text-xl font-semibold">{t('yearly_reports')} - {selectedYear}</h2>
            <p className="text-muted-foreground">{selectedCurrency}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('total_collected_month').replace(t('month'), t('year'))}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{yearlyData.totalIncome.toLocaleString()} <span className="text-xs text-muted-foreground">{selectedCurrency}</span></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('total_expenses')}</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{yearlyData.totalExpenses.toLocaleString()} <span className="text-xs text-muted-foreground">{selectedCurrency}</span></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('net_balance')}</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${yearlyData.netBalance < 0 ? 'text-destructive' : ''}`}>{yearlyData.netBalance.toLocaleString()} <span className="text-xs text-muted-foreground">{selectedCurrency}</span></div>
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('yearly_comparison')}</CardTitle>
            <CardDescription>
              {t('yoy_financial_performance')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={yearlyData.chartData}>
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  angle={dir === 'rtl' ? 45 : -45}
                  textAnchor={dir === 'rtl' ? 'start' : 'end'}
                  height={60}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                  width={dir === 'rtl' ? 80 : undefined}
                />
                <Tooltip
                  contentStyle={{
                      background: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                  }}
                  labelStyle={{ direction: dir }}
                />
                <Legend />
                <Bar
                  dataKey="income"
                  name={t('income')}
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name={t('expenses')}
                  fill="hsl(var(--destructive))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>{t('transactions_detail')}</CardTitle>
                <CardDescription>{t('detailed_list_transactions_month').replace(t('month'), t('year'))}</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('date')}</TableHead>
                            <TableHead>{t('participant_name')}</TableHead>
                            <TableHead>{t('description')}</TableHead>
                            <TableHead>{t('type')}</TableHead>
                            <TableHead className="text-right">{t('amount')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {yearlyData.allTransactions.length > 0 ? yearlyData.allTransactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>{new Date(tx.date + 'T00:00:00').toLocaleDateString(dir === 'rtl' ? 'ar-EG' : 'en-US', { timeZone: 'UTC' })}</TableCell>
                                <TableCell className="font-medium">{tx.participantName}</TableCell>
                                <TableCell>{tx.transactionType === 'Income' ? `${t('payment_for')} ${new Date(tx.paymentFor).toLocaleDateString(dir === 'rtl' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}` : tx.description}</TableCell>
                                <TableCell>
                                    <Badge variant={tx.transactionType === 'Income' ? 'secondary' : 'destructive'}>{t(tx.transactionType.toLowerCase())}</Badge>
                                </TableCell>
                                <TableCell className={`text-right font-mono ${tx.transactionType === 'Expense' ? 'text-destructive' : ''}`}>
                                    {tx.transactionType === 'Expense' ? '-' : ''}{tx.amount.toLocaleString()} {tx.currency}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">{t('no_transactions_month').replace(t('month'), t('year'))}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
