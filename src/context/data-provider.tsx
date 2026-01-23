'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import {
  payments as initialPayments,
  participants as initialParticipants,
  expenses as initialExpenses,
  recentActivities as initialRecentActivities,
} from '@/lib/placeholder-data';
import type {
  Payment,
  Participant,
  Expense,
  RecentActivity,
} from '@/lib/types';

interface DataContextType {
  payments: Payment[];
  participants: Participant[];
  expenses: Expense[];
  recentActivities: RecentActivity[];
  addPayment: (payment: Payment) => void;
  updatePayment: (payment: Payment) => void;
  deletePayment: (paymentId: string) => void;
  addRecentActivity: (activity: RecentActivity) => void;
  addParticipant: (participant: Participant) => void;
  updateParticipant: (participant: Participant) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [participants, setParticipants] = useState<Participant[]>(
    initialParticipants
  );
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    initialRecentActivities
  );

  const addPayment = useCallback((payment: Payment) => {
    setPayments((prev) => [payment, ...prev]);
  }, []);

  const updatePayment = useCallback((updatedPayment: Payment) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
    );
  }, []);

  const deletePayment = useCallback((paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
  }, []);

  const addRecentActivity = useCallback((activity: RecentActivity) => {
    setRecentActivities((prev) => [activity, ...prev]);
  }, []);

  const addParticipant = useCallback((participant: Participant) => {
    setParticipants((prev) => [participant, ...prev]);
  }, []);

  const updateParticipant = useCallback((updatedParticipant: Participant) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === updatedParticipant.id ? updatedParticipant : p))
    );
  }, []);

  const value = useMemo(
    () => ({
      payments,
      participants,
      expenses,
      recentActivities,
      addPayment,
      updatePayment,
      deletePayment,
      addRecentActivity,
      addParticipant,
      updateParticipant,
    }),
    [
      payments,
      participants,
      expenses,
      recentActivities,
      addPayment,
      updatePayment,
      deletePayment,
      addRecentActivity,
      addParticipant,
      updateParticipant,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
