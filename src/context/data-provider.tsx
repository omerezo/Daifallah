
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
  UserRole,
} from '@/lib/types';
import { useRouter } from 'next/navigation';
import { logoBase64 as defaultLogoBase64 } from '@/components/logo';

interface DataContextType {
  payments: Payment[];
  participants: Participant[];
  expenses: Expense[];
  recentActivities: RecentActivity[];
  users: User[];
  wallets: Wallet[];
  walletTransactions: WalletTransaction[];
  currentUser: User | null;
  logo: string;
  setLogo: (logo: string) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (payment: Payment) => void;
  deletePayment: (paymentId: string) => void;
  addRecentActivity: (activity: RecentActivity) => void;
  addParticipant: (participant: Participant) => void;
  updateParticipant: (participant: Participant) => void;
  deleteParticipant: (participantId: string) => void;
  addExpense: (expense: Expense) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  deleteUser: (userId: string) => void;
  addWallet: (wallet: Wallet) => void;
  addWalletTransaction: (transaction: Omit<WalletTransaction, 'id' | 'date'>) => void;
  login: (email: string, password?: string) => User | null;
  logout: () => void;
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
  const router = useRouter();
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
  
  const [logo, setLogo] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return defaultLogoBase64;
    }
    return localStorage.getItem('appLogo') || defaultLogoBase64;
  });
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem('currentUserId') || null;
  });

  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return users.find((u) => u.id === currentUserId) || null;
  }, [users, currentUserId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentUserId) {
        window.localStorage.setItem('currentUserId', currentUserId);
      } else {
        window.localStorage.removeItem('currentUserId');
      }
    }
  }, [currentUserId]);


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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLogo', logo);
    }
  }, [logo]);


  const addPayment = useCallback((payment: Payment) => {
    setPayments((prev) => [payment, ...prev]);
  }, []);

  const login = useCallback(
    (email: string, password?: string): User | null => {
      // Special case for admin recovery
      if (email.toLowerCase() === 'admin' && password === 'admin@123') {
        const adminUser = users.find((u) => u.role === 'Admin');
        if (adminUser) {
          const updatedAdmin = {
            ...adminUser,
            password: 'admin@123',
            email: 'admin',
            name: 'admin',
          };
          // Update the user in the main users list
          setUsers((currentUsers) =>
            currentUsers.map((u) => (u.id === adminUser.id ? updatedAdmin : u))
          );
          setCurrentUserId(adminUser.id);
          return updatedAdmin;
        }
      }

      // Standard login flow
      const user = users.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.password === password
      );
      if (user) {
        setCurrentUserId(user.id);
        return user;
      }
      return null;
    },
    [users]
  );

  const logout = useCallback(() => {
    setCurrentUserId(null);
    router.push('/login');
  }, [router]);

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
    []
  );
  
  const addExpense = useCallback((expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
  }, []);

  const addUser = useCallback((user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: `U-${Date.now()}`};
    setUsers((prev) => [...prev, newUser]);
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
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
      currentUser,
      logo,
      setLogo,
      addPayment,
      updatePayment,
      deletePayment,
      addRecentActivity,
      addParticipant,
      updateParticipant,
      deleteParticipant,
      addExpense,
      addUser,
      deleteUser,
      addWallet,
      addWalletTransaction,
      login,
      logout,
    }),
    [
      payments,
      participants,
      expenses,
      recentActivities,
      users,
      wallets,
      walletTransactions,
      currentUser,
      logo,
      setLogo,
      addPayment,
      updatePayment,
      deletePayment,
      addRecentActivity,
      addParticipant,
      updateParticipant,
      deleteParticipant,
      addExpense,
      addUser,
      deleteUser,
      addWallet,
      addWalletTransaction,
      login,
      logout,
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
