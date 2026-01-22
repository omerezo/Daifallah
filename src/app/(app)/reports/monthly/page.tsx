'use client';

import { useMemo, useState, useRef } from 'react';
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
import { useReactToPrint } from 'react-to-print';

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
const months = [
  'january', 'february', 'march', 'april', 'may', 'june', 
  'july', 'august', 'september', 'october', 'november', 'december'
];
const currencies = ['USD', 'SAR', 'EGP', 'SDG'] as const;

export default function MonthlyReportsPage() {
  const { t, dir } = useTranslation();
  const { payments, expenses } = useData();
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedCurrency, setSelectedCurrency] = useState<(typeof currencies)[number]>('USD'); 

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${t('monthly_reports')} - ${t(months[selectedMonth])} ${selectedYear} (${selectedCurrency})`
  });

  const monthlyData = useMemo(() => {
    const filteredPayments = payments.filter((p) => {
      const paymentDate = new Date(p.date);
      return (
        paymentDate.getFullYear() === selectedYear &&
        paymentDate.getMonth() === selectedMonth &&
        p.currency === selectedCurrency
      );
    });

    const filteredExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return (
        expenseDate.getFullYear() === selectedYear &&
        expenseDate.getMonth() === selectedMonth &&
        e.currency === selectedCurrency
      );
    });

    const totalIncome = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalIncome - totalExpenses;

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const chartData = Array.from({ length: daysInMonth }, (_, i) => ({
      name: `${i + 1}`,
      income: 0,
      expenses: 0,
    }));

    filteredPayments.forEach((p) => {
      const day = new Date(p.date).getDate() - 1;
      if (chartData[day]) {
        chartData[day].income += p.amount;
      }
    });

    filteredExpenses.forEach((e) => {
      const day = new Date(e.date).getDate() - 1;
       if (chartData[day]) {
        chartData[day].expenses += e.amount;
      }
    });

    const allTransactions = [
      ...filteredPayments.map(p => ({ ...p, id: `p-${p.id}`, transactionType: 'Income' as const })),
      ...filteredExpenses.map(e => ({ ...e, id: `e-${e.id}`, transactionType: 'Expense' as const, participantName: e.description }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return { totalIncome, totalExpenses, netBalance, chartData, allTransactions };
  }, [payments, expenses, selectedYear, selectedMonth, selectedCurrency]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4 no-print">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
            {t('monthly_reports')}
          </h1>
          <p className="text-muted-foreground">
            {t('income_vs_expenses_overview')}
          </p>
        </div>
        <div className="flex items-center gap-2 ltr:md:ml-auto rtl:md:mr-auto">
           <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[140px]">
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
      
      <div ref={printRef} className="printable-area space-y-8">
        <div className="text-center print-only-title">
            <h1 className="font-headline text-3xl font-bold">{t('app_name')}</h1>
            <h2 className="text-xl font-semibold">{t('monthly_reports')} - {t(months[selectedMonth])} {selectedYear}</h2>
            <p className="text-muted-foreground">{selectedCurrency}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('total_collected_month')}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{monthlyData.totalIncome.toLocaleString()} <span className="text-xs text-muted-foreground">{selectedCurrency}</span></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('total_expenses')}</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{monthlyData.totalExpenses.toLocaleString()} <span className="text-xs text-muted-foreground">{selectedCurrency}</span></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('net_balance')}</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${monthlyData.netBalance < 0 ? 'text-destructive' : ''}`}>{monthlyData.netBalance.toLocaleString()} <span className="text-xs text-muted-foreground">{selectedCurrency}</span></div>
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('monthly_overview')}</CardTitle>
            <CardDescription>
              {t('visual_breakdown_income_expenses')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData.chartData}>
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: t('day_of_month'), position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                      background: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                  }}
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
                <CardDescription>{t('detailed_list_transactions_month')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('date')}</TableHead>
                            <TableHead>{t('description')}</TableHead>
                            <TableHead>{t('type')}</TableHead>
                            <TableHead className="text-right">{t('amount')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {monthlyData.allTransactions.length > 0 ? monthlyData.allTransactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>{new Date(tx.date).toLocaleDateString(dir === 'rtl' ? 'ar-EG' : 'en-US')}</TableCell>
                                <TableCell className="font-medium">{tx.participantName}</TableCell>
                                <TableCell>
                                    <Badge variant={tx.transactionType === 'Income' ? 'secondary' : 'destructive'}>{t(tx.transactionType.toLowerCase())}</Badge>
                                </TableCell>
                                <TableCell className={`text-right font-mono ${tx.transactionType === 'Expense' ? 'text-destructive' : ''}`}>
                                    {tx.transactionType === 'Expense' ? '-' : ''}{tx.amount.toLocaleString()} {tx.currency}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">{t('no_transactions_month')}</TableCell>
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

    