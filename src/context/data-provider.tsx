'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
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
  deleteParticipant: (participantId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to safely get data from localStorage
function getInitialState<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') {
    return fallback;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    // If no item or item is invalid, set the fallback and return it
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return fallback;
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [payments, setPayments] = useState<Payment[]>(() =>
    getInitialState('payments', initialPayments)
  );
  const [participants, setParticipants] = useState<Participant[]>(() =>
    getInitialState('participants', initialParticipants)
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    getInitialState('expenses', initialExpenses)
  );
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    () => getInitialState('recentActivities', initialRecentActivities)
  );

  useEffect(() => {
    localStorage.setItem('payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(
      'recentActivities',
      JSON.stringify(recentActivities)
    );
  }, [recentActivities]);

  const addPayment = (payment: Payment) => {
    setPayments((prev) => [payment, ...prev]);
  };

  const updatePayment = (updatedPayment: Payment) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
    );
  };

  const deletePayment = (paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  const addRecentActivity = (activity: RecentActivity) => {
    setRecentActivities((prev) => [activity, ...prev].slice(0, 20));
  };

  const addParticipant = (participant: Participant) => {
    setParticipants((prev) => [participant, ...prev]);
  };

  const updateParticipant = (updatedParticipant: Participant) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === updatedParticipant.id ? updatedParticipant : p))
    );
  };

  const deleteParticipant = (participantId: string) => {
    const participantToDelete = participants.find(
      (p) => p.id === participantId
    );
    if (participantToDelete) {
      // Also delete payments associated with this participant
      setPayments((prevPayments) =>
        prevPayments.filter(
          (p) => p.participantName !== participantToDelete.name
        )
      );
    }
    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
  };

  const value = {
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
    deleteParticipant,
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
