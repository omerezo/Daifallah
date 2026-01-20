'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { File, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function YearlyReportsPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
            {t('yearly_reports')}
          </h1>
          <p className="text-muted-foreground">{t('yoy_growth_overview')}</p>
        </div>
        <div className="flex items-center gap-2 ltr:md:ml-auto rtl:md:mr-auto">
          <Select defaultValue="2024">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t('year')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-10 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              {t('export_pdf')}
            </span>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('yearly_comparison')}</CardTitle>
          <CardDescription>
            {t('yoy_financial_performance')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
            <Calendar className="h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {t('yearly_chart_placeholder')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
