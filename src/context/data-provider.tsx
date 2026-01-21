'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import {
  payments as initialPayments,
  participants as initialParticipants,
  expenses as initialExpenses,
  recentActivities as initialRecentActivities,
} from '@/lib/placeholder-data';
import type { Payment, Participant, Expense, RecentActivity } from '@/lib/types';

interface DataContextType {
  payments: Payment[];
  participants: Participant[];
  expenses: Expense[];
  recentActivities: RecentActivity[];
  addPayment: (payment: Payment) => void;
  addRecentActivity: (activity: RecentActivity) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(initialRecentActivities);

  const addPayment = (payment: Payment) => {
    setPayments((prev) => [payment, ...prev]);
  };

  const addRecentActivity = (activity: RecentActivity) => {
    setRecentActivities((prev) => [activity, ...prev]);
  };

  const value = {
    payments,
    participants,
    expenses,
    recentActivities,
    addPayment,
    addRecentActivity,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
