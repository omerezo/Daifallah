
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
import { useToast } from '@/hooks/use-toast';

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 3 - i);
const months = [
  'january', 'february', 'march', 'april', 'may', 'june', 
  'july', 'august', 'september', 'october', 'november', 'december'
];
const currencies = ['USD', 'SAR', 'EGP', 'SDG'] as const;

export default function YearlyReportsPage() {
  const { t, lang, dir } = useTranslation();
  const { payments, expenses, logo, currentUser } = useData();
  const { toast } = useToast();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCurrency, setSelectedCurrency] = useState<(typeof currencies)[number]>('USD'); 

  const yearlyData = useMemo(() => {
    const filteredPayments = payments.filter((p) => {
        if (!p.paymentFor) return false;
        if (p.paymentFor.includes('-')) {
            const year = Number(p.paymentFor.split('-')[0]);
            return year === selectedYear && p.currency === selectedCurrency;
        }
        // Fallback for old "Month Year" format
        const paymentForDate = new Date(p.paymentFor);
        return paymentForDate.getFullYear() === selectedYear && p.currency === selectedCurrency;
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
            .filter(p => {
                if (!p.paymentFor) return false;
                if (p.paymentFor.includes('-')) {
                    const monthFromData = Number(p.paymentFor.split('-')[1]);
                    return (monthFromData - 1) === index;
                }
                // Fallback for old data
                return new Date(p.paymentFor).getMonth() === index;
            })
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
      ...filteredPayments.map(p => {
        let paymentForDisplay = p.paymentFor;
        if (p.paymentFor.includes('-')) {
            const [year, month] = p.paymentFor.split('-').map(Number);
            const date = new Date(Date.UTC(year, month - 1, 1));
            paymentForDisplay = date.toLocaleString(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' });
        }
        return { ...p, id: `p-${p.id}`, transactionType: 'Income' as const, description: `${t('payment_for')} ${paymentForDisplay}` };
      }),
      ...filteredExpenses.map(e => ({ ...e, id: `e-${e.id}`, transactionType: 'Expense' as const, participantName: e.description }))
    ].sort((a, b) => new Date(a.date + 'T00:00:00').getTime() - new Date(b.date + 'T00:00:00').getTime());


    return { totalIncome, totalExpenses, netBalance, chartData, allTransactions };
  }, [payments, expenses, selectedYear, selectedCurrency, t, lang]);

  const handleExportPDF = async () => {
    try {
      if (yearlyData.allTransactions.length === 0) {
        toast({ variant: 'destructive', title: t('error'), description: t('no_data_to_export') });
        return;
      }
  
      toast({ title: t('export'), description: t('preparing_pdf') });
  
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF('p', 'mm', 'a4');
  
      const fontResponse = await fetch('/fonts/Amiri-Regular.ttf');
      if (!fontResponse.ok) throw new Error('Failed to load Arabic font');
      
      const fontBlob = await fontResponse.blob();
      const reader = new FileReader();
  
      reader.readAsDataURL(fontBlob);
      reader.onloadend = () => {
        const base64Font = (reader.result as string).split(',')[1];
  
        doc.addFileToVFS('Amiri-Regular.ttf', base64Font);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.setFont('Amiri');
  
        try {
            doc.setFontSize(22);
            doc.text(t('app_name'), 105, 15, { align: 'center' });
            
            if (logo && !logo.startsWith('data:image/svg')) {
                const imgProps = doc.getImageProperties(logo);
                const logoWidth = 25;
                const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
                const format = logo.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
                doc.addImage(logo, format, 14, 10, logoWidth, logoHeight);
            }
        } catch (e) {
            console.warn('Could not add logo to PDF, skipping.', e);
        }
  
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text(`${t('yearly_reports')} - ${selectedYear}`, 195, 28, { align: 'right' });
  
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`${t('date')}: ${new Date().toLocaleDateString()}`, 195, 34, { align: 'right' });
        doc.text(`${t('currency')}: ${selectedCurrency}`, 195, 39, { align: 'right' });
        doc.text(`${t('generated_by')}: ${currentUser?.name || 'N/A'}`, 195, 44, { align: 'right' });
  
        doc.setDrawColor(220, 220, 220);
        doc.line(14, 50, 196, 50);

        // Summary Cards
        const cardWidth = 58;
        const cardHeight = 25;
        const startX = 14;
        const startY = 55;
        const gap = 5;

        // Card 1: Total Income
        doc.setDrawColor(224, 224, 224);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(startX, startY, cardWidth, cardHeight, 3, 3, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(t('total_collected_month').replace(t('month'), t('year')), startX + cardWidth - 5, startY + 8, { align: 'right' });
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont('Amiri', 'normal');
        doc.text(`${yearlyData.totalIncome.toLocaleString()} ${selectedCurrency}`, startX + cardWidth - 5, startY + 18, { align: 'right' });

        // Card 2: Total Expenses
        const card2X = startX + cardWidth + gap;
        doc.setDrawColor(224, 224, 224);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(card2X, startY, cardWidth, cardHeight, 3, 3, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(t('total_expenses'), card2X + cardWidth - 5, startY + 8, { align: 'right' });
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont('Amiri', 'normal');
        doc.text(`${yearlyData.totalExpenses.toLocaleString()} ${selectedCurrency}`, card2X + cardWidth - 5, startY + 18, { align: 'right' });

        // Card 3: Net Balance
        const card3X = card2X + cardWidth + gap;
        doc.setDrawColor(224, 224, 224);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(card3X, startY, cardWidth, cardHeight, 3, 3, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(t('net_balance'), card3X + cardWidth - 5, startY + 8, { align: 'right' });
        doc.setFontSize(14);
        doc.setFont('Amiri', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`${yearlyData.netBalance.toLocaleString()} ${selectedCurrency}`, card3X + cardWidth - 5, startY + 18, { align: 'right' });
  
        const head = [[t('amount'), t('type'), t('description'), t('participant_name'), t('date')]];
        const body = yearlyData.allTransactions.map(tx => {
            let description = tx.description;
            if(tx.transactionType === 'Income') {
                let paymentForDisplay = tx.paymentFor;
                if (tx.paymentFor.includes('-')) {
                    const [year, month] = tx.paymentFor.split('-').map(Number);
                    const date = new Date(Date.UTC(year, month - 1, 1));
                    paymentForDisplay = date.toLocaleString(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' });
                }
                description = `${t('payment_for')} ${paymentForDisplay}`;
            }
            return [
                `${tx.amount.toLocaleString()} ${tx.currency}`,
                t(tx.transactionType.toLowerCase()),
                description,
                tx.participantName,
                new Date(tx.date).toLocaleDateString()
            ];
        });
  
        autoTable(doc, {
          startY: startY + cardHeight + 10,
          head: head,
          body: body,
          theme: 'grid',
          styles: { 
            font: 'Amiri', 
            fontSize: 10, 
            cellPadding: 3, 
            halign: 'right',
            valign: 'middle'
          },
          headStyles: { 
            fillColor: [100, 116, 139],
            textColor: [255, 255, 255], 
            fontStyle: 'normal',
            halign: 'center' 
          },
          alternateRowStyles: { 
            fillColor: [245, 245, 245] 
          },
           didParseCell: function (data) {
            if (data.section === 'body') {
              data.cell.styles.textColor = [0, 0, 0];
            }
          }
        });
  
        const fileName = `yearly-report_${selectedYear}.pdf`;
        doc.save(fileName);
        
        toast({ title: t('export_successful'), description: t('pdf_download_description') });
      };
    } catch (e: any) {
      console.error('PDF Export failed:', e);
      toast({ variant: 'destructive', title: t('error'), description: e.message || 'PDF export failed. Check console logs.' });
    }
  };

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
          <Button size="sm" variant="outline" className="h-10 gap-1" onClick={handleExportPDF}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              {t('export_pdf')}
            </span>
          </Button>
        </div>
      </div>
      
      <div className="space-y-8">
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
                                <TableCell>{new Date(tx.date + 'T00:00:00').toLocaleDateString()}</TableCell>
                                <TableCell className="font-medium">{tx.participantName}</TableCell>
                                <TableCell>{tx.description}</TableCell>
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
