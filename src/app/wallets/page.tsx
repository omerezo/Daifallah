
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
import { PlusCircle, File, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Wallet, WalletTransaction } from '@/lib/types';
import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '@/components/logo';

const currencies = ['USD', 'SAR', 'EGP', 'SDG'] as const;

export default function WalletsPage() {
  const { t, dir } = useTranslation();
  const { wallets, walletTransactions, addWallet, addWalletTransaction } = useData();
  const { toast } = useToast();

  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletRemarks, setNewWalletRemarks] = useState('');
  const [newWalletCurrency, setNewWalletCurrency] = useState<(typeof currencies)[number]>('USD');

  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [transactionType, setTransactionType] = useState<'add' | 'consume'>('add');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  
  const [selectedWalletForHistory, setSelectedWalletForHistory] = useState<string | 'all'>('all');

  const handleAddWallet = () => {
    if (!newWalletName) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('wallet_name_required'),
      });
      return;
    }

    const newWallet: Wallet = {
      id: `WLT-${Date.now()}`,
      name: newWalletName,
      remarks: newWalletRemarks,
      balance: 0,
      currency: newWalletCurrency,
    };

    addWallet(newWallet);
    toast({
      title: t('wallet_created'),
      description: t('wallet_created_description', { name: newWalletName }),
    });

    setNewWalletName('');
    setNewWalletRemarks('');
    setNewWalletCurrency('USD');
    setIsAddWalletOpen(false);
  };

  const openTransactionDialog = (wallet: Wallet, type: 'add' | 'consume') => {
    setSelectedWallet(wallet);
    setTransactionType(type);
    setIsTransactionOpen(true);
  };

  const handleAddTransaction = () => {
    if (!selectedWallet || !transactionAmount || !transactionDescription) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fill_all_fields'),
      });
      return;
    }

    const newTransaction: Omit<WalletTransaction, 'id' | 'date'> = {
      walletId: selectedWallet.id,
      type: transactionType,
      amount: parseFloat(transactionAmount),
      description: transactionDescription,
    };

    addWalletTransaction(newTransaction);

    toast({
      title: t('transaction_successful'),
      description: t('transaction_successful_description'),
    });

    setTransactionAmount('');
    setTransactionDescription('');
    setIsTransactionOpen(false);
    setSelectedWallet(null);
  };

  const filteredTransactions = useMemo(() => {
    if (selectedWalletForHistory === 'all') {
      return walletTransactions;
    }
    return walletTransactions.filter(tx => tx.walletId === selectedWalletForHistory);
  }, [walletTransactions, selectedWalletForHistory]);

  const handleExport = (format: 'csv' | 'pdf') => {
    if (wallets.length === 0 && filteredTransactions.length === 0) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('no_data_to_export'),
      });
      return;
    }

    if (format === 'csv') {
      if (filteredTransactions.length === 0) {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: t('no_data_to_export'),
        });
        return;
      }
      handleExportCSV();
    } else {
      handleExportPDF();
    }
  };

  const handleExportCSV = () => {
    const headers = [
      t('date'),
      t('wallet_name'),
      t('type'),
      t('description'),
      t('amount'),
    ];
    const data = filteredTransactions.map((tx) => {
      const wallet = wallets.find(w => w.id === tx.walletId);
      return [
        tx.date,
        wallet?.name || tx.walletId,
        t(tx.type),
        tx.description,
        `${tx.type === 'consume' ? '-' : ''}${tx.amount} ${wallet?.currency}`
      ];
    });

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
    link.setAttribute('download', 'wallet-transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: t('export_successful'),
      description: t('csv_download_description'),
    });
  };

  const handleExportPDF = async () => {
    const walletsToPrint = selectedWalletForHistory === 'all' 
        ? wallets 
        : wallets.filter(w => w.id === selectedWalletForHistory);

    if (walletsToPrint.length === 0) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('no_data_to_export'),
      });
      return;
    }

    toast({ title: t('export'), description: t('preparing_pdf') });
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

        // Header
        try {
            doc.setFontSize(22);
            doc.text(t('app_name'), 105, 15, { align: 'center' });
            
          if (logoBase64 && !logoBase64.startsWith('data:image/svg')) {
            const imgProps = doc.getImageProperties(logoBase64);
            const logoWidth = 20;
            const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
            const format = logoBase64.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
            doc.addImage(logoBase64, format, 14, 10, logoWidth, logoHeight);
          }
        } catch (e) {
          console.warn('Could not add logo to PDF, skipping.', e);
        }

        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text(t('wallets_report'), 195, 28, { align: 'right' });
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`${t('date')}: ${new Date().toLocaleDateString()}`, 195, 34, { align: 'right' });
        doc.setDrawColor(220, 220, 220);
        doc.line(14, 40, 196, 40);

        // Summary Cards for Wallets
        let tableStartY = 45;
        if (walletsToPrint.length > 0) {
            const cardWidth = 58;
            const cardHeight = 25;
            const startX = 14;
            const initialY = 45;
            const gap = 5;
            const maxCardsPerRow = 3;

            walletsToPrint.forEach((wallet, index) => {
                const col = index % maxCardsPerRow;
                const row = Math.floor(index / maxCardsPerRow);
                
                const cardX = startX + col * (cardWidth + gap);
                const cardY = initialY + row * (cardHeight + gap);

                doc.setDrawColor(224, 224, 224);
                doc.setFillColor(250, 250, 250);
                doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 3, 3, 'FD');
                
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(wallet.name, cardX + cardWidth - 5, cardY + 8, { align: 'right' });
                
                doc.setFontSize(14);
                doc.setTextColor(40, 40, 40);
                doc.setFont('Amiri', 'normal');
                doc.text(`${wallet.balance.toLocaleString()} ${wallet.currency}`, cardX + cardWidth - 5, cardY + 18, { align: 'right' });
            });
            
            const numRows = Math.ceil(walletsToPrint.length / maxCardsPerRow);
            tableStartY = initialY + (numRows * cardHeight) + ((numRows > 1 ? numRows -1 : 0) * gap) + 10;
        }

        // Transaction Table
        if (filteredTransactions.length > 0) {
            const head = [[t('amount'), t('description'), t('type'), t('wallet_name'), t('date')]];
            const body = filteredTransactions.map((tx) => {
              const wallet = wallets.find((w) => w.id === tx.walletId);
              return [
                `${tx.type === 'consume' ? '-' : ''}${tx.amount.toLocaleString()} ${wallet?.currency}`,
                tx.description,
                t(tx.type),
                wallet?.name || tx.walletId,
                tx.date,
              ];
            });

            autoTable(doc, {
              startY: tableStartY,
              head: head,
              body: body,
              theme: 'grid',
              styles: {
                font: 'Amiri',
                fontSize: 10,
                textColor: [0, 0, 0],
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
              alternateRowStyles: { fillColor: [245, 245, 245] },
            });
        }

        doc.save('wallet-transactions.pdf');
        toast({ title: t('export_successful'), description: t('pdf_download_description') });
      };
    } catch (e: any) {
      console.error('PDF Export failed:', e);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: e.message || 'PDF export failed. Check console logs.',
      });
    }
  };


  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {t('wallets')}
          </h1>
          <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-2">
            <Dialog open={isAddWalletOpen} onOpenChange={setIsAddWalletOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t('add_wallet')}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('add_wallet')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="wallet-name" className="text-right">
                      {t('wallet_name')}
                    </Label>
                    <Input
                      id="wallet-name"
                      value={newWalletName}
                      onChange={(e) => setNewWalletName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="wallet-remarks" className="text-right pt-2">
                      {t('remarks')}
                    </Label>
                    <Textarea
                      id="wallet-remarks"
                      value={newWalletRemarks}
                      onChange={(e) => setNewWalletRemarks(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="wallet-currency" className="text-right">
                      {t('currency')}
                    </Label>
                     <select
                      id="wallet-currency"
                      value={newWalletCurrency}
                      onChange={(e) => setNewWalletCurrency(e.target.value as (typeof currencies)[number])}
                      className="col-span-3 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddWallet}>{t('save_wallet')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet) => (
            <Card key={wallet.id}>
              <CardHeader>
                <CardTitle>{wallet.name}</CardTitle>
                <CardDescription>{wallet.remarks}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('current_balance')}</p>
                  <p className="text-2xl font-bold">{wallet.balance.toLocaleString()} {wallet.currency}</p>
                </div>
                <div className="flex gap-2">
                   <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openTransactionDialog(wallet, 'add')}
                  >
                    <ArrowUpCircle />
                    {t('add_amount')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => openTransactionDialog(wallet, 'consume')}
                  >
                    <ArrowDownCircle />
                    {t('consume_amount')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>{t('transaction_history')}</CardTitle>
                <CardDescription>
                {t('view_all_wallet_transactions')}
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                 <select
                  value={selectedWalletForHistory}
                  onChange={(e) => setSelectedWalletForHistory(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                >
                  <option value="all">{t('all_wallets')}</option>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-9 gap-1" onClick={() => handleExport('pdf')}>
                        <File className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        {t('export')}
                        </span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                        {t('export_csv')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                        {t('export_pdf')}
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('wallet_name')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead className="text-right">{t('amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => {
                  const wallet = wallets.find(w => w.id === tx.walletId);
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell className="font-medium">{wallet?.name || tx.walletId}</TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'add' ? 'secondary' : 'destructive'}>
                          {t(tx.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell className={`text-right font-mono ${tx.type === 'consume' ? 'text-destructive' : ''}`}>
                          {tx.type === 'consume' ? '-' : ''}{tx.amount.toLocaleString()} {wallet?.currency}
                      </TableCell>
                    </TableRow>
                  )
                })}
                 {filteredTransactions.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">{t('no_transactions_found')}</TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t(transactionType === 'add' ? 'add_amount' : 'consume_amount')} - {selectedWallet?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tx-amount" className="text-right">
                {t('amount')}
              </Label>
              <Input
                id="tx-amount"
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="tx-description" className="text-right pt-2">
                {t('description')}
              </Label>
              <Textarea
                id="tx-description"
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTransaction}>{t('save_transaction')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
