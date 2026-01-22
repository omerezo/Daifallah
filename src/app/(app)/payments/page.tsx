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
import { useData } from '@/context/data-provider';
import { useToast } from '@/hooks/use-toast';
import { logoBase64 } from '@/components/logo';
import type { Payment } from '@/lib/types';

export default function PaymentsPage() {
  const { t, dir } = useTranslation();
  const { toast } = useToast();
  const { payments } = useData();

  const generateReceipt = (payment: Payment) => {
    const receiptHtml = `
      <html>
        <head>
          <title>${t('payment_receipt')} - ${payment.id}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet" />
          <style>
            body { 
              font-family: 'Amiri', serif; 
              direction: ${dir};
              margin: 2rem;
            }
            .receipt-container {
              border: 1px solid #ccc;
              padding: 2rem;
              width: 100%;
              max-width: 800px;
              margin: auto;
            }
            .header {
              text-align: center;
              margin-bottom: 2rem;
            }
            .header img {
              width: 100px;
              height: 100px;
              margin-bottom: 1rem;
            }
            .header h1 {
              font-size: 1.5rem;
              margin: 0;
            }
            .details-grid {
              display: grid;
              grid-template-columns: auto 1fr;
              gap: 1rem;
            }
            .details-grid dt {
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 3rem;
              font-size: 0.9rem;
              color: #555;
            }
             @media print {
              body {
                margin: 0;
              }
              .receipt-container {
                border: none;
                box-shadow: none;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <img src="${logoBase64}" alt="Logo" />
              <h1>${t('app_name')}</h1>
              <h2>${t('payment_receipt')}</h2>
            </div>
            <dl class="details-grid">
              <dt>${t('receipt_id')}:</dt>
              <dd>${payment.id}</dd>
              <dt>${t('date')}:</dt>
              <dd>${new Date(payment.date).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US')}</dd>
              <dt>${t('participant_name')}:</dt>
              <dd>${payment.participantName}</dd>
              <dt>${t('amount')}:</dt>
              <dd>${payment.amount} ${payment.currency}</dd>
              <dt>${t('type')}:</dt>
              <dd>${t(payment.type.toLowerCase())}</dd>
            </dl>
            <div class="footer">
              <p>${t('thank_you_contribution')}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const receiptWindow = window.open('', '_blank');
    if (receiptWindow) {
      receiptWindow.document.write(receiptHtml);
      receiptWindow.document.close();
      receiptWindow.onload = () => {
        receiptWindow.focus();
        receiptWindow.print();
        toast({
          title: t('receipt_generated'),
          description: t('receipt_generated_description', {name: payment.participantName}),
        });
      }
    } else {
       toast({
          variant: 'destructive',
          title: t('error'),
          description: t('popup_blocked_error'),
        });
    }
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
                <TableHead className="hidden lg:table-cell">{t('remarks')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('attachment')}</TableHead>
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
