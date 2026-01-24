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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Expense } from '@/lib/types';
import { useState } from 'react';

const currencies = ['USD', 'SAR', 'EGP', 'SDG'] as const;
const categories: Expense['category'][] = [
  'Family Support',
  'Medical',
  'Education',
  'Operational',
];

export default function ExpensesPage() {
  const { t } = useTranslation();
  const { expenses, addExpense } = useData();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Expense['category']>(
    'Family Support'
  );
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<(typeof currencies)[number]>('USD');

  const handleAddExpense = () => {
    if (!description || !amount) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fill_all_fields'),
      });
      return;
    }

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description,
      category,
      amount: parseFloat(amount),
      currency,
    };

    addExpense(newExpense);

    toast({
      title: t('expense_added'),
      description: t('expense_added_description', { description }),
    });

    setDescription('');
    setCategory('Family Support');
    setAmount('');
    setCurrency('USD');
    setIsAddDialogOpen(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          {t('expenses_management')}
        </h1>
        <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              {t('export')}
            </span>
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  {t('add_expense')}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('add_expense')}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    {t('description')}
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="col-span-3"
                    placeholder={t('expense_description_placeholder')}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    {t('category')}
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(v) =>
                      setCategory(v as Expense['category'])
                    }
                  >
                    <SelectTrigger id="category" className="col-span-3">
                      <SelectValue placeholder={t('select_category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {t(c.toLowerCase().replace(' ', '_'))}
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
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="col-span-2"
                  />
                  <Select
                    value={currency}
                    onValueChange={(v) =>
                      setCurrency(v as (typeof currencies)[number])
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
                <Button onClick={handleAddExpense}>{t('save_expense')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('all_expenses')}</CardTitle>
          <CardDescription>
            {t('manage_your_committee_expenses')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('description')}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t('category')}
                </TableHead>
                <TableHead className="text-right">{t('amount')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell className="font-medium">
                    {expense.description}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">
                      {t(expense.category.toLowerCase().replace(' ', '_'))}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {expense.amount.toLocaleString()} {expense.currency}
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
                        <DropdownMenuItem>{t('edit')}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
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
  );
}
