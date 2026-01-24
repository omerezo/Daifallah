'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  payments as initialPayments,
  participants as initialParticipants,
  expenses as initialExpenses,
  recentActivities as initialRecentActivities,
  users as initialUsers,
  wallets as initialWallets,
  walletTransactions as initialWalletTransactions,
} from '@/lib/placeholder-data';
import type {
  Payment,
  Participant,
  Expense,
  RecentActivity,
  User,
  Wallet,
  WalletTransaction,
} from '@/lib/types';

interface DataContextType {
  payments: Payment[];
  participants: Participant[];
  expenses: Expense[];
  recentActivities: RecentActivity[];
  users: User[];
  wallets: Wallet[];
  walletTransactions: WalletTransaction[];
  addPayment: (payment: Payment) => void;
  updatePayment: (payment: Payment) => void;
  deletePayment: (paymentId: string) => void;
  addRecentActivity: (activity: RecentActivity) => void;
  addParticipant: (participant: Participant) => void;
  updateParticipant: (participant: Participant) => void;
  deleteParticipant: (participantId: string) => void;
  addExpense: (expense: Expense) => void;
  addWallet: (wallet: Wallet) => void;
  addWalletTransaction: (transaction: Omit<WalletTransaction, 'id' | 'date'>) => void;
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
  const [users, setUsers] = useState<User[]>(() =>
    getInitialState('users', initialUsers)
  );
  const [wallets, setWallets] = useState<Wallet[]>(() =>
    getInitialState('wallets', initialWallets)
  );
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() =>
    getInitialState('walletTransactions', initialWalletTransactions)
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
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(
      'recentActivities',
      JSON.stringify(recentActivities)
    );
  }, [recentActivities]);
  
  useEffect(() => {
    localStorage.setItem('wallets', JSON.stringify(wallets));
  }, [wallets]);
  
  useEffect(() => {
    localStorage.setItem('walletTransactions', JSON.stringify(walletTransactions));
  }, [walletTransactions]);


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
    setRecentActivities((prev) => [activity, ...prev].slice(0, 20));
  }, []);

  const addParticipant = useCallback((participant: Participant) => {
    setParticipants((prev) => [participant, ...prev]);
  }, []);

  const updateParticipant = useCallback((updatedParticipant: Participant) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === updatedParticipant.id ? updatedParticipant : p))
    );
  }, []);

  const deleteParticipant = useCallback(
    (participantId: string) => {
      setParticipants((prevParticipants) => {
        const participantToDelete = prevParticipants.find(
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
        return prevParticipants.filter((p) => p.id !== participantId);
      });
    },
    [] // `setPayments` is stable and doesn't need to be a dependency
  );
  
  const addExpense = useCallback((expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
  }, []);

  const addWallet = useCallback((wallet: Wallet) => {
    setWallets((prev) => [wallet, ...prev]);
  }, []);
  
  const addWalletTransaction = useCallback((transaction: Omit<WalletTransaction, 'id' | 'date'>) => {
      const newTransaction: WalletTransaction = {
          ...transaction,
          id: `WLTX-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
      };
      setWalletTransactions(prev => [newTransaction, ...prev]);
      setWallets(prev => prev.map(w => {
          if (w.id === transaction.walletId) {
              const newBalance = transaction.type === 'add'
                  ? w.balance + transaction.amount
                  : w.balance - transaction.amount;
              return { ...w, balance: newBalance };
          }
          return w;
      }));
  }, []);

  const value = useMemo(
    () => ({
      payments,
      participants,
      expenses,
      recentActivities,
      users,
      wallets,
      walletTransactions,
      addPayment,
      updatePayment,
      deletePayment,
      addRecentActivity,
      addParticipant,
      updateParticipant,
      deleteParticipant,
      addExpense,
      addWallet,
      addWalletTransaction,
    }),
    [
      payments,
      participants,
      expenses,
      recentActivities,
      users,
      wallets,
      walletTransactions,
      addPayment,
      updatePayment,
      deletePayment,
      addRecentActivity,
      addParticipant,
      updateParticipant,
      deleteParticipant,
      addExpense,
      addWallet,
      addWalletTransaction,
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
