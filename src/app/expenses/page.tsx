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
import { PlusCircle, File, MoreHorizontal } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Expense } from '@/lib/types';
import { useState, useMemo, useCallback } from 'react';

const currencies = ['USD', 'SAR', 'EGP', 'SDG'] as const;
const categories: Expense['category'][] = [
  'Family Support',
  'Medical',
  'Education',
  'Operational',
];
const allYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 3 - i);
const allMonths = [
  'january', 'february', 'march', 'april', 'may', 'june', 
  'july', 'august', 'september', 'october', 'november', 'december'
];


export default function ExpensesPage() {
  const { t } = useTranslation();
  const { expenses, users, addExpense, updateExpense, deleteExpense, currentUser, logo } = useData();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  
  // Form State
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Family Support');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<(typeof currencies)[number]>('USD');

  // Filter State
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  const resetForm = useCallback(() => {
    setDescription('');
    setCategory('Family Support');
    setAmount('');
    setCurrency('USD');
  }, []);

  const handleOpenAddDialog = () => {
    setEditingExpense(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setCategory(expense.category);
    setAmount(String(expense.amount));
    setCurrency(expense.currency);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingExpense(null);
      resetForm();
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const categoryMatch = filterCategory === 'all' || expense.category === filterCategory;
        const userMatch = filterUser === 'all' || expense.recordedBy === filterUser;
        const monthMatch = filterMonth === 'all' || expenseDate.getMonth() === parseInt(filterMonth, 10);
        const yearMatch = filterYear === 'all' || expenseDate.getFullYear() === parseInt(filterYear, 10);
        return categoryMatch && userMatch && monthMatch && yearMatch;
    });
  }, [expenses, filterCategory, filterUser, filterMonth, filterYear]);

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      toast({ variant: 'destructive', title: t('error'), description: t('no_data_to_export') });
      return;
    }
    const headers = [t('date'), t('description'), t('category'), t('amount'), t('currency'), t('recorded_by')];
    const data = filteredExpenses.map((e) => [e.date, e.description, t(e.category.toLowerCase().replace(' ', '_')), e.amount, e.currency, e.recordedBy]);
    const csvContent = [headers.join(','), ...data.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'expenses.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: t('export_successful'), description: t('csv_download_description') });
  };

  const handleExportPDF = async () => {
    if (filteredExpenses.length === 0) {
      toast({ variant: 'destructive', title: t('error'), description: t('no_data_to_export') });
      return;
    }
    toast({ title: t('export'), description: t('preparing_pdf') });
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF('p', 'mm', 'a4');
    try {
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
        doc.text(t('expenses_report'), 195, 28, { align: 'right' });
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`${t('date')}: ${new Date().toLocaleDateString()}`, 195, 34, { align: 'right' });
        doc.setDrawColor(220, 220, 220);
        doc.line(14, 40, 196, 40);
        const head = [[t('recorded_by'), t('currency'), t('amount'), t('category'), t('description'), t('date')]];
        const body = filteredExpenses.map((e) => [e.recordedBy, e.currency, e.amount.toLocaleString(), t(e.category.toLowerCase().replace(' ', '_')), e.description, e.date]);
        autoTable(doc, { startY: 45, head, body, theme: 'grid', styles: { font: 'Amiri', fontSize: 10, textColor: [0, 0, 0], cellPadding: 3, halign: 'right', valign: 'middle' }, headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' }, alternateRowStyles: { fillColor: [245, 245, 245] } });
        doc.save('expenses.pdf');
        toast({ title: t('export_successful'), description: t('pdf_download_description') });
      };
    } catch (e: any) {
      console.error('PDF Export failed:', e);
      toast({ variant: 'destructive', title: t('error'), description: e.message || 'PDF export failed.' });
    }
  };

  const handleSaveExpense = () => {
    if (!description || !amount) {
      toast({ variant: 'destructive', title: t('error'), description: t('fill_all_fields') });
      return;
    }
    const expenseData = { description, category, amount: parseFloat(amount), currency, recordedBy: currentUser!.name };
    if (editingExpense) {
        updateExpense({ ...expenseData, id: editingExpense.id, date: editingExpense.date });
        toast({ title: t('expense_updated'), description: t('expense_updated_description', { description }) });
    } else {
        const newExpense: Expense = { ...expenseData, id: `EXP-${Date.now()}`, date: new Date().toISOString().split('T')[0] };
        addExpense(newExpense);
        toast({ title: t('expense_added'), description: t('expense_added_description', { description }) });
    }
    handleDialogChange(false);
  };
  
  const handleConfirmDelete = () => {
    if (expenseToDelete) {
        deleteExpense(expenseToDelete.id);
        toast({ title: t('expense_deleted'), description: t('expense_deleted_description', { description: expenseToDelete.description }) });
        setExpenseToDelete(null);
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {t('expenses_management')}
          </h1>
          <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                  <File className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t('export')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>{t('export_csv')}</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>{t('export_pdf')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {currentUser && currentUser.role !== 'Viewer' && (
                <Button size="sm" className="h-8 gap-1" onClick={handleOpenAddDialog}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t('add_expense')}
                    </span>
                </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('filters')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
               <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t('category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_categories')}</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{t(c.toLowerCase().replace(' ', '_'))}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger>
                  <SelectValue placeholder={t('recorded_by')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_users')}</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('month')} />
                  </SelectTrigger>
                <SelectContent position="item-aligned">
                  <SelectItem value="all">{t('all_months')}</SelectItem>
                  {allMonths.map((m, i) => <SelectItem key={i} value={String(i)}>{t(m)}</SelectItem>)}
                </SelectContent>
              </Select>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('year')} />
                  </SelectTrigger>
                <SelectContent position="item-aligned">
                    <SelectItem value="all">{t('all_years')}</SelectItem>
                  {allYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('all_expenses')}</CardTitle>
            <CardDescription>{t('manage_your_committee_expenses')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('category')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('recorded_by')}</TableHead>
                  <TableHead className="text-right">{t('amount')}</TableHead>
                  {currentUser && currentUser.role !== 'Viewer' && (
                    <TableHead><span className="sr-only">{t('actions')}</span></TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{t(expense.category.toLowerCase().replace(' ', '_'))}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{expense.recordedBy}</TableCell>
                    <TableCell className="text-right">{expense.amount.toLocaleString()} {expense.currency}</TableCell>
                    {currentUser && currentUser.role !== 'Viewer' && (
                      <TableCell>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t('toggle_menu')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => handleOpenEditDialog(expense)}>{t('edit')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onSelect={() => setExpenseToDelete(expense)}>
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingExpense ? t('edit_expense') : t('add_expense')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">{t('description')}</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder={t('expense_description_placeholder')} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">{t('category')}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Expense['category'])}>
                <SelectTrigger id="category" className="col-span-3">
                  <SelectValue placeholder={t('select_category')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{t(c.toLowerCase().replace(' ', '_'))}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">{t('amount')}</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-2" />
              <Select value={currency} onValueChange={(v) => setCurrency(v as (typeof currencies)[number])}>
                <SelectTrigger className="col-span-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveExpense}>{editingExpense ? t('save_changes') : t('save_expense')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!expenseToDelete} onOpenChange={(isOpen) => !isOpen && setExpenseToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                <AlertDialogDescription>{t('delete_expense_confirm')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete}>{t('delete')}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
