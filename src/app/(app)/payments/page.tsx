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
import { PlusCircle, File } from 'lucide-react';
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
import { MoreHorizontal } from 'lucide-react';
import { payments } from '@/lib/placeholder-data';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

export default function PaymentsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const generateReceipt = (payment: (typeof payments)[0]) => {
    const doc = new jsPDF();
    
    // In a real app, you would use the logo here
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('UmmaTech Aid', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Receipt', 105, 30, { align: 'center' });

    doc.line(20, 35, 190, 35);

    doc.setFontSize(12);
    doc.text(`Receipt ID: ${payment.id}`, 20, 45);
    doc.text(`Date: ${payment.date}`, 20, 55);
    doc.text(`Participant: ${payment.participantName}`, 20, 65);
    doc.text(`Amount: ${payment.amount} ${payment.currency}`, 20, 75);
    doc.text(`Type: ${payment.type}`, 20, 85);
    
    doc.line(20, 100, 190, 100);

    doc.setFontSize(10);
    doc.text('Thank you for your contribution!', 105, 110, { align: 'center' });
    
    doc.save(`receipt-${payment.id}.pdf`);

    toast({
      title: t('receipt_generated'),
      description: `Receipt for ${payment.participantName} has been downloaded.`,
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
          {t('payments_management')}
        </h1>
        <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              {t('export')}
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              {t('add_payment')}
            </span>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('all_payments')}</CardTitle>
          <CardDescription>
            {t('manage_your_committee_payments')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('participant_name')}</TableHead>
                <TableHead className="text-right">{t('amount')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('currency')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('type')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell className="font-medium">
                    {payment.participantName}
                  </TableCell>
                  <TableCell className="text-right">{payment.amount}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {payment.currency}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{t(payment.type.toLowerCase())}</TableCell>
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
                        <DropdownMenuItem onClick={() => generateReceipt(payment)}>
                          {t('generate_receipt')}
                        </DropdownMenuItem>
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
