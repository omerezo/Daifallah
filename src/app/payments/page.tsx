
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const currencies = ['USD', 'SAR', 'EGP', 'SDG'] as const;
const allYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 3 - i);
const allMonths = [
  'january', 'february', 'march', 'april', 'may', 'june', 
  'july', 'august', 'september', 'october', 'november', 'december'
];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function PaymentsPage() {
  const { t, dir, lang } = useTranslation();
  const { toast } = useToast();
  const { payments, participants, users, addPayment, updatePayment, deletePayment, addRecentActivity, logo, currentUser } = useData();

  // Dialog states
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  // Single payment form state
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | undefined>();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState<(typeof currencies)[number]>('USD');
  const [paymentMonth, setPaymentMonth] = useState(new Date().getMonth());
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [bankTransferFile, setBankTransferFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');

  // Multiple payment state
  const [multiPaymentMode, setMultiPaymentMode] = useState<'single' | 'bulk'>('single');
  const [selectedMonths, setSelectedMonths] = useState<Record<number, boolean>>({});
  const [multiPaymentAmount, setMultiPaymentAmount] = useState('');
  const [multiPaymentYear, setMultiPaymentYear] = useState(new Date().getFullYear());

  // Filter states
  const [view, setView] = useState<'payments' | 'unpaid'>('payments');
  const [filterParticipant, setFilterParticipant] = useState<string>('all');
  const [filterCollector, setFilterCollector] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(String(new Date().getMonth()));
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));

  const numSelectedMonths = useMemo(() => Object.values(selectedMonths).filter(Boolean).length, [selectedMonths]);
  const distributedAmount = useMemo(() => {
    if (multiPaymentMode !== 'bulk' || !multiPaymentAmount || numSelectedMonths === 0) {
      return 0;
    }
    return parseFloat(multiPaymentAmount) / numSelectedMonths;
  }, [multiPaymentAmount, numSelectedMonths, multiPaymentMode]);

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

  const resetMultiPaymentForm = useCallback(() => {
    setMultiPaymentMode('single');
    setSelectedMonths({});
    setMultiPaymentAmount('');
    setMultiPaymentYear(new Date().getFullYear());
  }, []);

  const handleDialogOpenChange = (isOpen: boolean) => {
    setIsPaymentDialogOpen(isOpen);
    if (!isOpen) {
      resetForm();
      resetMultiPaymentForm();
    }
  };

  const handleExportPDF = async () => {
    try {
      if (filteredData.type === "message") {
        toast({ variant: "destructive", title: t("error"), description: t("no_data_to_export") });
        return;
      }
  
      toast({ title: t("export"), description: t("preparing_pdf") ?? "Preparing PDF..." });
      
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
  
      const doc = new jsPDF("p", "mm", "a4");
  
      const fontResponse = await fetch("/fonts/Amiri-Regular.ttf");
      if (!fontResponse.ok) throw new Error("Failed to load Arabic font");
      
      const fontBlob = await fontResponse.blob();
      const reader = new FileReader();
  
      reader.readAsDataURL(fontBlob);
      reader.onloadend = () => {
        const base64Font = (reader.result as string).split(",")[1];
  
        doc.addFileToVFS("Amiri-Regular.ttf", base64Font);
        doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
        doc.setFont("Amiri");
  
        try {
            doc.setFontSize(22);
            doc.text(t('app_name'), 105, 15, { align: 'center' });

            if (logo && !logo.startsWith("data:image/svg")) {
                const imgProps = doc.getImageProperties(logo);
                const logoWidth = 25;
                const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
                const format = logo.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
                doc.addImage(logo, format, 14, 10, logoWidth, logoHeight);
            }
        } catch (e) {
            console.warn("Could not add logo to PDF, skipping.", e);
        }
  
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text(t("payments_report"), 195, 28, { align: "right" });
  
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`${t('date')}: ${new Date().toLocaleDateString()}`, 195, 34, { align: "right" });
        doc.text(`${t('generated_by')}: ${currentUser?.name || 'N/A'}`, 195, 39, { align: "right" });
  
        doc.setDrawColor(220, 220, 220);
        doc.line(14, 45, 196, 45);
  
        let head: any[] = [];
        let body: any[] = [];
  
        if (filteredData.type === "payments") {
          head = [[
            t("remarks"),
            t("type"),
            t("currency"),
            t("amount"),
            t("recorded_by"),
            t("payment_for"),
            t("participant_name"),
            t("date"),
          ]];
  
          body = (filteredData.data as Payment[]).map(p => {
              let paymentForDisplay = p.paymentFor;
              if (p.paymentFor.includes('-')) {
                const [year, month] = p.paymentFor.split('-').map(Number);
                const date = new Date(Date.UTC(year, month - 1, 1));
                paymentForDisplay = date.toLocaleString(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' });
              }
              return [
                p.remarks || "-",
                t(p.type.toLowerCase()),
                p.currency,
                String(p.amount),
                users.find(u => u.id === p.recordedBy)?.name || p.recordedBy,
                paymentForDisplay,
                p.participantName,
                p.date,
            ]
          });
        } else if (filteredData.type === "unpaid") {
          head = [[t("status"), t("monthly_share"), t("phone"), t("name")]];
          body = (filteredData.data as Participant[]).map(p => ([
            p.status,
            String(p.monthlyShare),
            p.phone,
            p.name,
          ]));
        }
  
        autoTable(doc, {
          startY: 50,
          head: head,
          body: body,
          theme: 'grid',
          styles: { 
            font: "Amiri", 
            fontSize: 10, 
            textColor: [0, 0, 0],
            cellPadding: 3, 
            halign: "right",
            valign: "middle"
          },
          headStyles: { 
            fillColor: [100, 116, 139], 
            textColor: [255, 255, 255], 
            fontStyle: 'bold',
            halign: "center" 
          },
          alternateRowStyles: { 
            fillColor: [245, 245, 245] 
          },
        });
  
        const fileName = filteredData.type === "payments" 
          ? `payments_${new Date().toISOString().slice(0, 10)}.pdf`
          : `unpaid_${filterMonth}_${filterYear}.pdf`;
          
        doc.save(fileName);
        
        toast({ title: t("export_successful"), description: t("pdf_download_description") });
      };
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: t("error"), description: `PDF export failed: ${e?.message ?? 'unknown error'}` });
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
        data = paymentData.map(p => {
          let paymentForDisplay = p.paymentFor;
          if (p.paymentFor.includes('-')) {
            const [year, month] = p.paymentFor.split('-').map(Number);
            const date = new Date(Date.UTC(year, month - 1, 1));
            paymentForDisplay = date.toLocaleString(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' });
          }
          return [p.id, p.date, p.participantName, paymentForDisplay, users.find(u => u.id === p.recordedBy)?.name || p.recordedBy, p.amount, p.currency, p.type, p.remarks || ''];
        });
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
    let paymentForDisplay = payment.paymentFor;
    if (payment.paymentFor.includes('-')) {
        const [year, month] = payment.paymentFor.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, 1));
        paymentForDisplay = date.toLocaleString(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' });
    }

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
            .header img { width: 80px; height: 80px; object-fit: contain; }
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
                <img src="${logo}" alt="Logo">
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
                <dd>${paymentForDisplay}</dd>
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
    resetMultiPaymentForm();
    setEditingPayment(payment);
  
    const participant = participants.find(p => p.name === payment.participantName);
    setSelectedParticipantId(participant?.id);
    setPaymentAmount(String(payment.amount));
    setPaymentCurrency(payment.currency);

    if (payment.paymentFor.includes('-')) {
        const [year, month] = payment.paymentFor.split('-').map(Number);
        setPaymentYear(year);
        setPaymentMonth(month - 1);
    } else {
        const [monthName, yearStr] = payment.paymentFor.split(' ');
        const year = parseInt(yearStr, 10);
        const monthIndex = allMonths.findIndex(m => t(m).toLowerCase() === monthName?.toLowerCase());
        if (monthIndex !== -1) setPaymentMonth(monthIndex);
        if (year) setPaymentYear(year);
    }
    
    setRemarks(payment.remarks || '');
    setBankTransferFile(null);
  
    setIsPaymentDialogOpen(true);
  };
  
  const handleOpenAddDialog = () => {
    resetForm();
    resetMultiPaymentForm();
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
    } else if (editingPayment?.bankTransferProof) {
        bankTransferProof = editingPayment.bankTransferProof
    }
    
    const paymentData: Omit<Payment, 'id' | 'date'> = {
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
      (paymentData as Payment).bankTransferProof = bankTransferProof;
    }

    if (editingPayment) {
      updatePayment({ ...paymentData, id: editingPayment.id, date: editingPayment.date });
      toast({
        title: t('payment_updated'),
        description: t('payment_updated_description'),
      });
    } else {
      addPayment(paymentData);
      
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
    
    handleDialogOpenChange(false);
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
    
    handleDialogOpenChange(false);
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
      
      const paymentPeriod = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      const paidParticipantNames = new Set(
        payments
            .filter(p => {
              if (!p.paymentFor) return false;
              if (p.paymentFor.includes('-')) {
                return p.paymentFor === paymentPeriod;
              }
              // Fallback for old data
              const paymentDate = new Date(p.paymentFor);
              return paymentDate.getFullYear() === year && paymentDate.getMonth() === month;
            })
            .map(p => p.participantName)
      );

      const unpaid = participants.filter(
        p => p.status === 'Active' && !paidParticipantNames.has(p.name)
      );
      return { type: 'unpaid', data: unpaid };
    } else { // view === 'payments'
        const filtered = payments.filter(payment => {
            let paymentMonthNum = -1;
            let paymentYearNum = -1;

            if (payment.paymentFor.includes('-')) {
                const [year, month] = payment.paymentFor.split('-').map(Number);
                paymentYearNum = year;
                paymentMonthNum = month - 1;
            } else {
                // Fallback for old data
                const paymentForDate = new Date(payment.paymentFor);
                paymentMonthNum = paymentForDate.getMonth();
                paymentYearNum = paymentForDate.getFullYear();
            }

            const participantMatch = filterParticipant === 'all' || payment.participantId === filterParticipant;
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
                <DropdownMenuItem onClick={handleExportPDF}>
                  {t('export_pdf')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {currentUser && currentUser.role !== 'Viewer' && (
              <Button size="sm" className="h-8 gap-1" onClick={handleOpenAddDialog}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  {t('add_payment')}
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
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
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
                        <TableCell>
                          {(() => {
                              if (!payment.paymentFor) return '';
                              if (payment.paymentFor.includes('-')) {
                                  const [year, month] = payment.paymentFor.split('-').map(Number);
                                  const date = new Date(Date.UTC(year, month - 1, 1));
                                  return date.toLocaleString(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' });
                              }
                              return payment.paymentFor; // Fallback for old data
                          })()}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{users.find(u => u.id === payment.recordedBy)?.name || payment.recordedBy}</TableCell>
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
                              {currentUser && currentUser.role !== 'Viewer' && (
                                <>
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
                                </>
                              )}
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? t('edit_payment') : t('record_payment')}
            </DialogTitle>
          </DialogHeader>
          {editingPayment ? (
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
                              e.target.value = ''; // Reset file input
                          } else {
                              setBankTransferFile(file);
                          }
                      }
                    }}
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
                  <p className="text-xs text-muted-foreground mt-1">{t('max_image_file_size_info')}</p>
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
          ) : (
             <Tabs defaultValue="single" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">Single Payment</TabsTrigger>
                    <TabsTrigger value="multiple">Multiple Payments</TabsTrigger>
                </TabsList>
                
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
                                {allYears.map((year) => (
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
                                {allMonths.map((month, index) => (
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
          )}
           <DialogFooter>
            {editingPayment && (
              <Button type="button" onClick={handleSavePayment}>
                {t('save_changes')}
              </Button>
            )}
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

    