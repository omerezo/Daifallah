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
import { logoBase64, amiriFont } from '@/components/logo';
import type { Payment, Participant } from '@/lib/types';
import { useState, useCallback, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const currencies = ['USD', 'SAR', 'EGP', 'SDG'] as const;
const allYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 3 - i);
const allMonths = [
  'january', 'february', 'march', 'april', 'may', 'june', 
  'july', 'august', 'september', 'october', 'november', 'december'
];

function stripDataUrl(data: string) {
  // removes "data:...;base64," if present
  const idx = data.indexOf("base64,");
  return idx >= 0 ? data.slice(idx + "base64,".length) : data;
}


function detectImageFormat(dataUrl: string): "PNG" | "JPEG" {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "JPEG";
  return "PNG"; // default
}

export default function PaymentsPage() {
  const { t, dir } = useTranslation();
  const { toast } = useToast();
  const { payments, participants, users, addPayment, updatePayment, deletePayment, addRecentActivity } = useData();

  // Dialog states
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

  // Filter states
  const [view, setView] = useState<'payments' | 'unpaid'>('payments');
  const [filterParticipant, setFilterParticipant] = useState<string>('all');
  const [filterCollector, setFilterCollector] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(String(new Date().getMonth()));
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));

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

  const handleExportPDF = () => {
    try {
      if (filteredData.type === 'message') {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: t('no_data_to_export'),
        });
        return;
      }
  
      const doc = new jsPDF('p', 'mm', 'a4');
  
      // 1) LOAD ARABIC FONT (safe) + fallback
      try {
        const fontBase64 = stripDataUrl(amiriFont); // from earlier helper
      
        doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
        doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
      
        // IMPORTANT: switch font only after registering
        doc.setFont("Amiri", "normal");
      } catch (err) {
        console.warn("Arabic font failed, fallback to Helvetica:", err);
        doc.setFont("helvetica", "normal"); // fallback so PDF still works
      }
  
      // 2. PROFESSIONAL HEADER (SAFE LOGO)
      try {
        if (logoBase64?.startsWith("data:image/")) {
          const format = detectImageFormat(logoBase64);
          const imgProps = doc.getImageProperties(logoBase64);


          const logoWidth = 20;
          const logoHeight = (imgProps.height * logoWidth) / imgProps.width;


          doc.addImage(logoBase64, format, 14, 10, logoWidth, logoHeight);
        }
      } catch (err) {
        console.warn("Logo skipped (addImage failed):", err);
      }
  
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text(t('payments_report'), 195, 18, { align: 'right' });
  
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`${t('date')}: ${new Date().toLocaleDateString()}`, 195, 24, {
        align: 'right',
      });
  
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 30, 196, 30);
  
      // 3. GENERATE TABLE
      if (filteredData.type === 'payments') {
        const rows = (filteredData.data as Payment[]).map((p) => [
          p.date,
          p.participantName,
          p.paymentFor,
          p.recordedBy,
          String(p.amount),
          p.currency,
          t(p.type.toLowerCase()),
          p.remarks || '-',
        ]);
  
        autoTable(doc, {
          startY: 35,
          head: [
            [
              t('date'),
              t('participant_name'),
              t('payment_for'),
              t('recorded_by'),
              t('amount'),
              t('currency'),
              t('type'),
              t('remarks'),
            ],
          ],
          body: rows,
          styles: {
            font: doc.getFont().fontName,
            fontSize: 10,
            cellPadding: 3,
            halign: dir === 'rtl' ? 'right' : 'left',
          },
          headStyles: {
            fillColor: [36, 36, 36],
            textColor: [255, 255, 255],
            font: doc.getFont().fontName,
            fontStyle: 'bold',
            halign: dir === 'rtl' ? 'right' : 'left',
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
        });
  
        doc.save(`payments_${new Date().toISOString().slice(0, 10)}.pdf`);
      }
  
      if (filteredData.type === 'unpaid') {
        const rows = (filteredData.data as Participant[]).map((p) => [
          p.name,
          p.phone,
          String(p.monthlyShare),
          p.status,
        ]);
  
        autoTable(doc, {
          startY: 35,
          head: [[t('name'), t('phone'), t('monthly_share'), t('status')]],
          body: rows,
          styles: {
            font: doc.getFont().fontName,
            fontSize: 10,
            cellPadding: 3,
            halign: dir === 'rtl' ? 'right' : 'left',
          },
          headStyles: {
            fillColor: [36, 36, 36],
            textColor: [255, 255, 255],
            font: doc.getFont().fontName,
            fontStyle: 'bold',
            halign: dir === 'rtl' ? 'right' : 'left',
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
        });
  
        doc.save(`unpaid_${filterMonth}_${filterYear}.pdf`);
      }
  
      toast({
        title: t('export_successful'),
        description: t('pdf_download_description'),
      });
    } catch (e: any) {
      console.error("PDF export failed:", e);
      toast({
        variant: "destructive",
        title: t("error"),
        description: e?.message ? `PDF export failed: ${e.message}` : "PDF export failed.",
      });
    }
  };

  const handleExportCSV = () => {
    if (filteredData.data.length === 0 && filteredData.type !== 'message') {
        toast({ variant: 'destructive', title: t('error'), description: t('no_data_to_export') });
        return;
    }

    let headers: string[];
    let data: (string|number)[][];
    let filename: string;

    if (filteredData.type === 'payments') {
        const paymentData = filteredData.data as Payment[];
        headers = ['ID', t('date'), t('participant_name'), t('payment_for'), t('recorded_by'), t('amount'), t('currency'), t('type'), t('remarks')];
        data = paymentData.map(p => [p.id, p.date, p.participantName, p.paymentFor, p.recordedBy, p.amount, p.currency, p.type, p.remarks || '']);
        filename = 'payments.csv';
    } else if (filteredData.type === 'unpaid') {
        const participantData = filteredData.data as Participant[];
        headers = [t('name'), t('phone'), t('monthly_share'), t('status')];
        data = participantData.map(p => [p.name, p.phone, p.monthlyShare, p.status]);
        const monthName = t(allMonths[parseInt(filterMonth)]);
        const year = filterYear;
        filename = `unpaid_${monthName}_${year}.csv`;
    } else {
        toast({ variant: 'destructive', title: t('error'), description: t('no_data_to_export') });
        return;
    }

    const csvContent = [
        headers.join(','),
        ...data.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: t('export_successful'), description: t('csv_download_description') });
  };

  const generateReceipt = (payment: Payment) => {
    const paidStampBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgMjQwIDk2Ij48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0LCA0KSI+PHJlY3Qgd2lkdGg9IjIzMiIgaGVpZ2h0PSI4OCIgc3R5bGU9ImZpbGw6bm9uZTsgc3Ryb2tlLXdpZHRoOjQ7c3Ryb2tlOiNkNDAwMDA7IiByeD0iOCIgcnk9IjgiLz48dGV4dCB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMTYsIDYwKSIgc3R5bGU9ImZvbnQtZmFtaWx5OkFyaWFsLCBIZWx2ZXRpY2E7Zm9udC1zaXplOjQ4cHg7ZmlsbDojZDQwMDAwO2ZvbnQtd2VpZ2h0OmJvbGQ7dGV4dC1hbmNob3I6bWlkZGxlIj5QQUlEPC90ZXh0PjwvZz48L3N2Zz4=";

    const receiptContent = `
      <html>
        <head>
          <title>${t('payment_receipt')}</title>
          <style>
            body { font-family: sans-serif; direction: ${dir}; margin: 0; padding: 2rem; background-color: #f9fafb; color: #111827; }
            .container { position: relative; max-width: 600px; margin: auto; padding: 2rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; background-color: white; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); overflow: hidden; }
            .content-wrapper { position: relative; z-index: 10; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); opacity: 0.08; font-size: 10rem; font-weight: bold; color: #777; pointer-events: none; z-index: 1; text-transform: uppercase; }
            .stamp { position: absolute; bottom: 1.5rem; ${dir === 'rtl' ? 'left' : 'right'}: 1.5rem; width: 140px; height: auto; z-index: 20; opacity: 0.85; }
            .header { text-align: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; }
            .header img { width: 80px; height: 80px; }
            .header h1 { font-size: 1.5rem; margin: 0.5rem 0 0; }
            .details-grid { display: grid; grid-template-columns: auto 1fr; gap: 1rem 2rem; }
            .details-grid dt { font-weight: 500; color: #6b7280; }
            .details-grid dd { margin: 0; font-weight: 600; }
            .amount-total { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; text-align: ${dir === 'rtl' ? 'left' : 'right'}; }
            .amount-total p { margin: 0; font-size: 1.25rem; font-weight: bold; }
            .footer { margin-top: 2rem; text-align: center; font-size: 0.875rem; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="watermark">${t('paid_stamp')}</div>
            <div class="content-wrapper">
              <div class="header">
                <img src="${logoBase64}" alt="Logo">
                <h1>${t('payment_receipt')}</h1>
              </div>
              <div class="details-grid">
                <dt>${t('receipt_id')}:</dt>
                <dd>${payment.id}</dd>
                <dt>${t('date')}:</dt>
                <dd>${new Date(payment.date).toLocaleDateString()}</dd>
                <dt>${t('participant_name')}:</dt>
                <dd>${payment.participantName}</dd>
                <dt>${t('payment_for')}:</dt>
                <dd>${payment.paymentFor}</dd>
              </div>
              <div class="amount-total">
                <p>${t('amount')}: ${payment.amount.toLocaleString()} ${payment.currency}</p>
              </div>
              <div class="footer">
                <p>${t('thank_you_contribution')}</p>
              </div>
            </div>
            <img src="${paidStampBase64}" class="stamp" alt="${t('paid_stamp')}">
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      toast({
        title: t('receipt_generated'),
        description: t('receipt_generated_description', { name: payment.participantName }),
      });
    } else {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('popup_blocked_error'),
      });
    }
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
      const monthIndex = allMonths.findIndex(m => t(m).toLowerCase() === monthName?.toLowerCase() || m === monthName?.toLowerCase());
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

  const filteredData = useMemo(() => {
    if (view === 'unpaid') {
      const month = parseInt(filterMonth, 10);
      const year = parseInt(filterYear, 10);

      if (isNaN(month) || isNaN(year)) {
        return { type: 'message', data: t('select_month_year_unpaid') };
      }
      
      const paymentPeriod = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      
      const paidParticipantNames = new Set(
        payments
            .filter(p => p.paymentFor === paymentPeriod)
            .map(p => p.participantName)
      );

      const unpaid = participants.filter(
        p => p.status === 'Active' && !paidParticipantNames.has(p.name)
      );
      return { type: 'unpaid', data: unpaid };
    } else { // view === 'payments'
        const filtered = payments.filter(payment => {
            const paymentForDate = new Date(payment.paymentFor);
            const paymentMonthNum = paymentForDate.getMonth();
            const paymentYearNum = paymentForDate.getFullYear();
            
            const participantMatch = filterParticipant === 'all' || payment.participantName === (participants.find(p => p.id === filterParticipant)?.name);
            const collectorMatch = filterCollector === 'all' || payment.recordedBy === filterCollector;
            const monthMatch = filterMonth === 'all' || paymentMonthNum === parseInt(filterMonth, 10);
            const yearMatch = filterYear === 'all' || paymentYearNum === parseInt(filterYear, 10);
            
            return participantMatch && collectorMatch && monthMatch && yearMatch;
        });
        return { type: 'payments', data: filtered };
    }
  }, [view, payments, participants, filterParticipant, filterCollector, filterMonth, filterYear, t]);


  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {t('payments_management')}
          </h1>
          <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-2">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                  <File className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t('export')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={handleExportCSV}>{t('export_csv')}</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleExportPDF}>
                  {t('export_pdf')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <CardTitle>{t('filters')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <Select value={view} onValueChange={(v) => setView(v as 'payments' | 'unpaid')}>
                <SelectTrigger>
                  <SelectValue placeholder={t('view')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payments">{t('all_payments')}</SelectItem>
                  <SelectItem value="unpaid">{t('unpaid_participants')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterParticipant} onValueChange={setFilterParticipant} disabled={view === 'unpaid'}>
                <SelectTrigger>
                  <SelectValue placeholder={t('participant')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_participants')}</SelectItem>
                  {participants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterCollector} onValueChange={setFilterCollector} disabled={view === 'unpaid'}>
                <SelectTrigger>
                  <SelectValue placeholder={t('collector')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_collectors')}</SelectItem>
                  {users.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('month')} />
                  </SelectTrigger>
                <SelectContent position="item-aligned">
                  {view === 'payments' && <SelectItem value="all">{t('all_months')}</SelectItem>}
                  {allMonths.map((m, i) => <SelectItem key={i} value={String(i)}>{t(m)}</SelectItem>)}
                </SelectContent>
              </Select>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('year')} />
                  </SelectTrigger>
                <SelectContent position="item-aligned">
                    {view === 'payments' && <SelectItem value="all">{t('all_years')}</SelectItem>}
                  {allYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
              <CardTitle>{view === 'payments' ? t('all_payments') : t('unpaid_for_month', { month: t(allMonths[parseInt(filterMonth)]), year: filterYear })}</CardTitle>
              <CardDescription>
                {t('manage_your_committee_payments')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredData.type === 'message' && <p className="text-muted-foreground text-center">{filteredData.data}</p>}
              {filteredData.type === 'payments' && (
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
                    {(filteredData.data as Payment[]).map((payment) => (
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
                          <DropdownMenu modal={false}>
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
                              <DropdownMenuItem
                                onClick={() => generateReceipt(payment)}
                              >
                                {t('generate_receipt')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
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
                                onSelect={() => {
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
              )}
              {filteredData.type === 'unpaid' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name')}</TableHead>
                      <TableHead>{t('phone')}</TableHead>
                      <TableHead>{t('monthly_share')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredData.data as Participant[]).map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-medium">{participant.name}</TableCell>
                        <TableCell className="text-muted-foreground">{participant.phone}</TableCell>
                        <TableCell>{participant.monthlyShare}</TableCell>
                        <TableCell>
                          <Badge variant={participant.status === 'Active' ? 'default' : 'destructive'}>
                            {t(participant.status.toLowerCase())}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {filteredData.data.length === 0 && filteredData.type !== 'message' && (
                <p className="text-muted-foreground text-center py-8">{t('no_data_found')}</p>
              )}
            </CardContent>
          </Card>
      </div>

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
                    {allMonths.map((month, index) => (
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
                    {allYears.map((year) => (
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
