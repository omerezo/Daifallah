'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { File } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const data = [
  {
    name: 'Jan',
    income: Math.floor(Math.random() * 5000) + 1000,
    expenses: Math.floor(Math.random() * 3000) + 500,
  },
  {
    name: 'Feb',
    income: Math.floor(Math.random() * 5000) + 1000,
    expenses: Math.floor(Math.random() * 3000) + 500,
  },
  {
    name: 'Mar',
    income: Math.floor(Math.random() * 5000) + 1000,
    expenses: Math.floor(Math.random() * 3000) + 500,
  },
  {
    name: 'Apr',
    income: Math.floor(Math.random() * 5000) + 1000,
    expenses: Math.floor(Math.random() * 3000) + 500,
  },
  {
    name: 'May',
    income: Math.floor(Math.random() * 5000) + 1000,
    expenses: Math.floor(Math.random() * 3000) + 500,
  },
  {
    name: 'Jun',
    income: Math.floor(Math.random() * 5000) + 1000,
    expenses: Math.floor(Math.random() * 3000) + 500,
  },
  {
    name: 'Jul',
    income: Math.floor(Math.random() * 5000) + 1000,
    expenses: Math.floor(Math.random() * 3000) + 500,
  },
];

export default function MonthlyReportsPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
            {t('monthly_reports')}
          </h1>
          <p className="text-muted-foreground">
            {t('income_vs_expenses_overview')}
          </p>
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
          <CardTitle>{t('monthly_overview')}</CardTitle>
          <CardDescription>
            {t('visual_breakdown_income_expenses')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Bar
                dataKey="income"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                fill="hsl(var(--accent))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
