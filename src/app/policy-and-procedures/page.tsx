
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Download, MoreHorizontal, Upload, Calendar as CalendarIcon, FileText } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-provider';
import type { PolicyDocument, Letter } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ar as arSA, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export default function PolicyAndProceduresPage() {
  const { t, lang, dir } = useTranslation();
  const {
    policyDocuments,
    addPolicyDocument,
    deletePolicyDocument,
    letters,
    addLetter,
    updateLetter,
    deleteLetter,
    currentUser,
    logo,
    users
  } = useData();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('documents');

  // Policy Document State
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docDetails, setDocDetails] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docToDelete, setDocToDelete] = useState<PolicyDocument | null>(null);

  // Letter State
  const [isLetterDialogOpen, setIsLetterDialogOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const [letterToDelete, setLetterToDelete] = useState<Letter | null>(null);
  const [letterDate, setLetterDate] = useState<Date | undefined>(new Date());
  const [letterHeader, setLetterHeader] = useState('');
  const [letterBody, setLetterBody] = useState('');

  useEffect(() => {
    if (editingLetter) {
        setLetterDate(new Date(editingLetter.date));
        setLetterHeader(editingLetter.header);
        setLetterBody(editingLetter.body);
    }
  }, [editingLetter]);


  const resetDocForm = () => {
    setDocName('');
    setDocDetails('');
    setDocFile(null);
  };
  
  const resetLetterForm = () => {
    setEditingLetter(null);
    setLetterDate(new Date());
    setLetterHeader('');
    setLetterBody('');
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: t('file_too_large'),
        });
        setDocFile(null);
        e.target.value = ''; // Reset file input
        return;
      }
      setDocFile(file);
    }
  };

  const handleAddDocument = () => {
    if (!docName || !docFile) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fill_all_fields'),
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileUrl = e.target?.result as string;

      const newDocument = {
        name: docName,
        details: docDetails,
        file: {
          name: docFile.name,
          url: fileUrl,
          size: docFile.size,
          type: docFile.type,
        },
      };

      addPolicyDocument(newDocument);

      toast({
        title: t('document_added'),
        description: t('document_added_description', { name: docName }),
      });

      resetDocForm();
      setIsDocDialogOpen(false);
    };
    reader.readAsDataURL(docFile);
  };
  
  const handleSaveLetter = () => {
    if (!letterDate || !letterHeader || !letterBody || !currentUser) {
       toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fill_all_fields'),
      });
      return;
    }

    const letterData = {
        date: letterDate.toISOString(),
        header: letterHeader,
        body: letterBody,
        createdBy: currentUser.id
    };

    if (editingLetter) {
        updateLetter({ ...letterData, id: editingLetter.id, createdAt: editingLetter.createdAt });
        toast({ title: t('letter_updated'), description: t('letter_updated_description', { header: letterHeader }) });
    } else {
        addLetter(letterData);
        toast({ title: t('letter_saved'), description: t('letter_saved_description', { header: letterHeader }) });
    }
    
    setIsLetterDialogOpen(false);
    resetLetterForm();
  };

  const handleOpenEditLetterDialog = (letter: Letter) => {
    setEditingLetter(letter);
    setIsLetterDialogOpen(true);
  }

  const handleConfirmDeleteDoc = () => {
    if (docToDelete) {
      deletePolicyDocument(docToDelete.id);
      toast({
        title: t('document_deleted'),
        description: t('document_deleted_description', { name: docToDelete.name }),
      });
      setDocToDelete(null);
    }
  };
  
  const handleConfirmDeleteLetter = () => {
    if (letterToDelete) {
        deleteLetter(letterToDelete.id);
        toast({ title: t('letter_deleted'), description: t('letter_deleted_description')});
        setLetterToDelete(null);
    }
  }

  const handleDownloadDoc = (doc: PolicyDocument) => {
    const link = document.createElement('a');
    link.href = doc.file.url;
    link.download = doc.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleGeneratePDF = async (letter: Letter) => {
    toast({ title: t('exporting_letter'), description: t('preparing_pdf') });
    const { default: jsPDF } = await import('jspdf');
    const { amiriFont } = await import('@/components/logo');
    
    try {
        const doc = new jsPDF('p', 'mm', 'a4');

        doc.addFileToVFS('Amiri-Regular.ttf', amiriFont);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.setFont('Amiri');

        // Header
        if (logo && !logo.startsWith('data:image/svg')) {
          const imgProps = doc.getImageProperties(logo);
          const logoWidth = 30;
          const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
          doc.addImage(logo, 'PNG', dir === 'rtl' ? 170 : 10, 10, logoWidth, logoHeight);
        }
        doc.setFontSize(16);
        doc.text(t('app_name'), 105, 20, { align: 'center'});
        doc.setDrawColor(200, 200, 200);
        doc.line(10, 35, 200, 35);

        // Letter content
        doc.setFontSize(12);
        doc.text(format(new Date(letter.date), 'PPP', { locale: lang === 'ar' ? arSA : enUS }), dir === 'rtl' ? 198 : 12, 45, { align: dir === 'rtl' ? 'right' : 'left' });
        doc.setFontSize(14);
        doc.setFont('Amiri', 'bold');
        doc.text(letter.header, 105, 55, { align: 'center' });
        
        doc.setFont('Amiri', 'normal');
        doc.setFontSize(12);
        const bodyLines = doc.splitTextToSize(letter.body, 180);
        doc.text(bodyLines, dir === 'rtl' ? 198 : 12, 70, { align: dir === 'rtl' ? 'right' : 'left' });
        
        // Footer
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.line(10, pageHeight - 20, 200, pageHeight - 20);
        doc.setFontSize(10);
        doc.text(t('app_name'), 105, pageHeight - 12, { align: 'center' });


        doc.save(`letter-${letter.header}.pdf`);
    } catch(e: any) {
        console.error("PDF generation failed:", e);
        toast({ variant: 'destructive', title: t('error'), description: e.message || "PDF generation failed." });
    }
  };

  const handleGenerateWord = (letter: Letter) => {
    toast({ title: t('exporting_letter') });
    
    const letterHtml = `
      <div style="font-family: 'Times New Roman', serif; direction: ${dir};">
        <p style="text-align: ${dir === 'rtl' ? 'left' : 'right'};">${format(new Date(letter.date), 'PPP', { locale: lang === 'ar' ? arSA : enUS })}</p>
        <h2 style="text-align: center;">${letter.header}</h2>
        <div style="white-space: pre-wrap;">${letter.body}</div>
      </div>
    `;

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="${lang}">
        <head>
          <meta charset="utf-8">
          <title>${letter.header}</title>
          <style>
            @page {
              size: A4;
              margin: 1in;
            }
            body { font-family: 'Times New Roman', serif; }
            .header, .footer {
                width: 100%;
                text-align: center;
                position: fixed;
                font-size: 10pt;
            }
            .header {
                top: 0px;
            }
            .footer {
                bottom: 0px;
            }
          </style>
        </head>
        <body>
            <div class="header">
                ${logo && !logo.startsWith('data:image/svg') ? `<img src="${logo}" alt="logo" style="width: 100px; height: auto;">` : ''}
                <p>${t('app_name')}</p>
                <hr>
            </div>
            ${letterHtml}
            <div class="footer">
                <hr>
                <p>${t('app_name')}</p>
            </div>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', fullHtml], {
        type: 'application/msword'
    });
    
    const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(fullHtml);
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    downloadLink.href = url;
    downloadLink.download = `${letter.header}.doc`;
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {t('policy_and_procedures')}
          </h1>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="documents">{t('policy_documents')}</TabsTrigger>
                <TabsTrigger value="letters">{t('letters')}</TabsTrigger>
            </TabsList>
            <TabsContent value="documents">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle>{t('all_documents')}</CardTitle>
                            <CardDescription>{t('manage_committee_policies')}</CardDescription>
                        </div>
                        {currentUser?.role !== 'Viewer' && (
                            <Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
                                <DialogTrigger asChild>
                                <Button size="sm" className="h-8 gap-1">
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    {t('add_document')}
                                    </span>
                                </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>{t('add_document')}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    {/* Form for adding document */}
                                    <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="doc-name" className="text-right">{t('document_name')}</Label>
                                    <Input id="doc-name" value={docName} onChange={(e) => setDocName(e.target.value)} className="col-span-3"/>
                                    </div>
                                    <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="doc-details" className="text-right pt-2">{t('details')}</Label>
                                    <Textarea id="doc-details" value={docDetails} onChange={(e) => setDocDetails(e.target.value)} className="col-span-3"/>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="doc-file" className="text-right">{t('document_file')}</Label>
                                    <div className="col-span-3">
                                        <Input id="doc-file" type="file" className="sr-only" onChange={handleFileChange} />
                                        <Label htmlFor="doc-file" className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground ring-offset-background hover:bg-accent hover:text-accent-foreground">
                                        <Upload className="h-4 w-4" />
                                        <span>{docFile ? docFile.name : t('upload_file')}</span>
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-1">{t('max_file_size_info')}</p>
                                    </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddDocument}>{t('save_document')}</Button>
                                </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>{t('document_name')}</TableHead>
                                <TableHead>{t('details')}</TableHead>
                                <TableHead className="hidden md:table-cell">{t('uploaded_at')}</TableHead>
                                <TableHead><span className="sr-only">{t('actions')}</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {policyDocuments.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">{doc.name}</TableCell>
                                    <TableCell>{doc.details}</TableCell>
                                    <TableCell className="hidden md:table-cell">{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">{t('toggle_menu')}</span></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleDownloadDoc(doc)}><Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />{t('download')}</DropdownMenuItem>
                                        {currentUser?.role !== 'Viewer' && (
                                            <><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onSelect={() => {setTimeout(() => setDocToDelete(doc), 100);}}>{t('delete')}</DropdownMenuItem></>
                                        )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                ))}
                                {policyDocuments.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t('no_data_found')}</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="letters">
                 <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle>{t('official_letters')}</CardTitle>
                            <CardDescription>{t('manage_letters')}</CardDescription>
                        </div>
                        {currentUser?.role !== 'Viewer' && (
                           <Button size="sm" className="h-8 gap-1" onClick={() => { resetLetterForm(); setIsLetterDialogOpen(true); }}>
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">{t('new_letter')}</span>
                           </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('date')}</TableHead>
                                    <TableHead>{t('letter_header')}</TableHead>
                                    <TableHead className="hidden md:table-cell">{t('created_by')}</TableHead>
                                    <TableHead className="hidden md:table-cell">{t('created_at')}</TableHead>
                                    <TableHead><span className="sr-only">{t('actions')}</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {letters.map((letter) => (
                                    <TableRow key={letter.id}>
                                        <TableCell>{new Date(letter.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium">{letter.header}</TableCell>
                                        <TableCell className="hidden md:table-cell">{users.find(u => u.id === letter.createdBy)?.name || letter.createdBy}</TableCell>
                                        <TableCell className="hidden md:table-cell">{new Date(letter.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">{t('toggle_menu')}</span></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleGeneratePDF(letter)}><FileText className="ltr:mr-2 rtl:ml-2 h-4 w-4" />{t('export_pdf')}</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleGenerateWord(letter)}><FileText className="ltr:mr-2 rtl:ml-2 h-4 w-4" />{t('export_word')}</DropdownMenuItem>
                                                    {currentUser?.role !== 'Viewer' && (
                                                        <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => handleOpenEditLetterDialog(letter)}>{t('edit')}</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onSelect={() => setLetterToDelete(letter)}>{t('delete')}</DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {letters.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t('no_data_found')}</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
            </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialog for adding/editing a letter */}
       <Dialog open={isLetterDialogOpen} onOpenChange={(isOpen) => { setIsLetterDialogOpen(isOpen); if (!isOpen) resetLetterForm(); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editingLetter ? t('edit_letter') : t('new_letter')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="letter-date" className="text-right">{t('letter_date')}</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !letterDate && "text-muted-foreground")}>
                            <CalendarIcon className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                            {letterDate ? format(letterDate, 'PPP', { locale: lang === 'ar' ? arSA : enUS }) : <span>{t('pick_a_date')}</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={letterDate} onSelect={setLetterDate} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="letter-header" className="text-right">{t('letter_header')}</Label>
              <Input id="letter-header" value={letterHeader} onChange={(e) => setLetterHeader(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="letter-body" className="text-right pt-2">{t('letter_body')}</Label>
              <Textarea id="letter-body" value={letterBody} onChange={(e) => setLetterBody(e.target.value)} className="col-span-3 min-h-[200px]" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveLetter}>{editingLetter ? t('save_changes') : t('save_letter')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!docToDelete} onOpenChange={(isOpen) => !isOpen && setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle><AlertDialogDescription>{t('delete_document_confirm')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDeleteDoc}>{t('delete')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!letterToDelete} onOpenChange={(isOpen) => !isOpen && setLetterToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle><AlertDialogDescription>{t('delete_letter_confirm')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDeleteLetter}>{t('delete')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
