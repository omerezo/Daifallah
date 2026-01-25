'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Download, MoreHorizontal, Upload } from 'lucide-react';
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
import type { PolicyDocument } from '@/lib/types';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function PolicyAndProceduresPage() {
  const { t } = useTranslation();
  const { policyDocuments, addPolicyDocument, deletePolicyDocument, currentUser } = useData();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docDetails, setDocDetails] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  const [docToDelete, setDocToDelete] = useState<PolicyDocument | null>(null);

  const resetForm = () => {
    setDocName('');
    setDocDetails('');
    setDocFile(null);
  };

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

      const newDocument: PolicyDocument = {
        id: `DOC-${Date.now()}`,
        name: docName,
        details: docDetails,
        file: {
          name: docFile.name,
          url: fileUrl,
          size: docFile.size,
          type: docFile.type,
        },
        uploadedAt: new Date().toISOString(),
      };

      try {
        // A pre-check to see if adding this doc would exceed quota
        // This is a rough estimation
        const currentStorage = JSON.stringify(localStorage);
        if (currentStorage.length + fileUrl.length > 4.5 * 1024 * 1024) { // Leave some buffer
             toast({
                variant: 'destructive',
                title: t('error'),
                description: t('logo_too_large_description'), // Reusing this translation for storage full
            });
            return;
        }

        addPolicyDocument(newDocument);

        toast({
          title: t('document_added'),
          description: t('document_added_description', { name: docName }),
        });

        resetForm();
        setIsAddDialogOpen(false);
      } catch (error) {
           if (error instanceof DOMException && error.name === 'QuotaExceededError') {
             toast({
                variant: 'destructive',
                title: t('error'),
                description: t('logo_too_large_description'), // Reusing this translation
            });
           } else {
             toast({
                variant: 'destructive',
                title: t('error'),
                description: "An unexpected error occurred.",
             });
           }
      }
    };
    reader.readAsDataURL(docFile);
  };

  const handleConfirmDelete = () => {
    if (docToDelete) {
      deletePolicyDocument(docToDelete.id);
      toast({
        title: t('document_deleted'),
        description: t('document_deleted_description', { name: docToDelete.name }),
      });
      setDocToDelete(null);
    }
  };

  const handleDownload = (doc: PolicyDocument) => {
    const link = document.createElement('a');
    link.href = doc.file.url;
    link.download = doc.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {t('policy_and_procedures')}
          </h1>
          {currentUser?.role !== 'Viewer' && (
            <div className="ltr:ml-auto rtl:mr-auto flex items-center gap-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="doc-name" className="text-right">
                        {t('document_name')}
                      </Label>
                      <Input
                        id="doc-name"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="doc-details" className="text-right pt-2">
                        {t('details')}
                      </Label>
                      <Textarea
                        id="doc-details"
                        value={docDetails}
                        onChange={(e) => setDocDetails(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                       <Label htmlFor="doc-file" className="text-right">
                        {t('document_file')}
                      </Label>
                       <div className="col-span-3">
                         <Input
                          id="doc-file"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                        <Label
                          htmlFor="doc-file"
                          className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground ring-offset-background hover:bg-accent hover:text-accent-foreground"
                        >
                          <Upload className="h-4 w-4" />
                          <span>
                            {docFile
                              ? docFile.name
                              : t('upload_file')}
                          </span>
                        </Label>
                         <p className="text-xs text-muted-foreground mt-1">{t('max_file_size_info')}</p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddDocument}>
                      {t('save_document')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('all_documents')}</CardTitle>
            <CardDescription>
              {t('manage_committee_policies')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('document_name')}</TableHead>
                  <TableHead>{t('details')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('uploaded_at')}</TableHead>
                  <TableHead>
                    <span className="sr-only">{t('actions')}</span>
                  </TableHead>
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
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('toggle_menu')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                            {t('download')}
                          </DropdownMenuItem>
                          {currentUser?.role !== 'Viewer' && (
                            <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => {
                                setTimeout(() => setDocToDelete(doc), 100);
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
                {policyDocuments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">{t('no_data_found')}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!docToDelete} onOpenChange={(isOpen) => !isOpen && setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_document_confirm')}
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
