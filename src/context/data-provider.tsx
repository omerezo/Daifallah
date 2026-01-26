'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
  useMemo,
} from 'react';
import type {
  Payment,
  Participant,
  Expense,
  RecentActivity,
  Wallet,
  WalletTransaction,
  PolicyDocument,
  UserProfile,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser, useCollection, useDoc, useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, query, where, getDocs, runTransaction } from 'firebase/firestore';

interface DataContextType {
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id' | 'date'>) => void;
  updatePayment: (payment: Payment) => void;
  deletePayment: (paymentId: string) => void;

  participants: Participant[];
  addParticipant: (participant: Omit<Participant, 'id'>) => void;
  updateParticipant: (participant: Participant) => void;
  deleteParticipant: (participantId: string) => void;

  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (expenseId: string) => void;
  
  users: UserProfile[];
  addUser: (user: Omit<UserProfile, 'id'>, uid: string) => void;
  updateUser: (user: UserProfile) => void;
  deleteUser: (userId: string) => void;

  wallets: Wallet[];
  addWallet: (wallet: Omit<Wallet, 'id' | 'balance'>) => void;

  walletTransactions: WalletTransaction[];
  addWalletTransaction: (transaction: Omit<WalletTransaction, 'id' | 'date'>) => void;
  updateWalletTransaction: (transaction: WalletTransaction) => Promise<void>;
  deleteWalletTransaction: (transactionId: string) => Promise<void>;
  
  policyDocuments: PolicyDocument[];
  addPolicyDocument: (doc: Omit<PolicyDocument, 'id' | 'uploadedAt' | 'file'> & { file: File }) => void;
  deletePolicyDocument: (docId: string) => void;

  recentActivities: RecentActivity[];
  addRecentActivity: (activity: RecentActivity) => void;

  currentUser: UserProfile | null;
  logo: string;
  setLogo: (logo: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const usersRef = useMemoFirebase(() => (firestore && authUser) ? collection(firestore, 'users') : null, [firestore, authUser]);
  const { data: usersData, error: usersError } = useCollection<UserProfile>(usersRef);
  const users = usersData || [];

  const currentUser = useMemo(() => {
    return users.find(u => u.id === authUser?.uid) || null;
  }, [users, authUser]);
  
  const paymentsRef = useMemoFirebase(() => (firestore && authUser) ? collection(firestore, 'payments') : null, [firestore, authUser]);
  const { data: paymentsData, error: paymentsError } = useCollection<Payment>(paymentsRef);
  const payments = paymentsData || [];

  const participantsRef = useMemoFirebase(() => (firestore && authUser) ? collection(firestore, 'participants') : null, [firestore, authUser]);
  const { data: participantsData, error: participantsError } = useCollection<Participant>(participantsRef);
  const participants = participantsData || [];

  const expensesRef = useMemoFirebase(() => (firestore && authUser) ? collection(firestore, 'expenses') : null, [firestore, authUser]);
  const { data: expensesData, error: expensesError } = useCollection<Expense>(expensesRef);
  const expenses = expensesData || [];

  const walletsRef = useMemoFirebase(() => (firestore && authUser) ? collection(firestore, 'wallets') : null, [firestore, authUser]);
  const { data: walletsData, error: walletsError } = useCollection<Wallet>(walletsRef);
  const wallets = walletsData || [];

  const walletTransactionsRef = useMemoFirebase(() => (firestore && authUser) ? collection(firestore, 'walletTransactions') : null, [firestore, authUser]);
  const { data: walletTransactionsData, error: walletTransactionsError } = useCollection<WalletTransaction>(walletTransactionsRef);
  const walletTransactions = walletTransactionsData || [];

  const policyDocumentsRef = useMemoFirebase(() => (firestore && authUser) ? collection(firestore, 'policyDocuments') : null, [firestore, authUser]);
  const { data: policyDocumentsData, error: policyDocumentsError } = useCollection<PolicyDocument>(policyDocumentsRef);
  const policyDocuments = policyDocumentsData || [];

  const logoRef = useMemoFirebase(() => (firestore && authUser) ? doc(firestore, 'appConfig', 'logo') : null, [firestore, authUser]);
  const { data: logoData, error: logoError } = useDoc<{url: string}>(logoRef);
  const logo = logoData?.url || '';

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const errors = [paymentsError, participantsError, expensesError, usersError, walletsError, walletTransactionsError, policyDocumentsError, logoError].filter(Boolean);
    if (errors.length > 0) {
      const nonPermissionErrors = errors.filter(e => e && !e.message.includes('permission-denied') && !e.message.includes('insufficient permissions'));
      if (nonPermissionErrors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Error loading data',
          description: nonPermissionErrors.map(e => e?.message).join(' '),
        });
      }
    }
  }, [paymentsError, participantsError, expensesError, usersError, walletsError, walletTransactionsError, policyDocumentsError, logoError, toast]);

  const addPayment = useCallback((payment: Omit<Payment, 'id' | 'date'>) => {
    if (!currentUser || !firestore) return;
    const newPayment = { ...payment, date: new Date().toISOString().split('T')[0], recordedBy: currentUser.id };
    addDocumentNonBlocking(collection(firestore, 'payments'), newPayment);
  }, [currentUser, firestore]);

  const updatePayment = useCallback((payment: Payment) => {
    if (!firestore) return;
    const paymentRef = doc(firestore, 'payments', payment.id);
    setDocumentNonBlocking(paymentRef, payment, { merge: true });
  }, [firestore]);

  const deletePayment = useCallback((paymentId: string) => {
    if (!firestore) return;
    const paymentRef = doc(firestore, 'payments', paymentId);
    deleteDocumentNonBlocking(paymentRef);
  }, [firestore]);
  
  const addParticipant = useCallback((participant: Omit<Participant, 'id'>) => {
    if (!firestore) return;
    addDocumentNonBlocking(collection(firestore, 'participants'), participant);
  }, [firestore]);

  const updateParticipant = useCallback((participant: Participant) => {
    if (!firestore) return;
    const participantRef = doc(firestore, 'participants', participant.id);
    setDocumentNonBlocking(participantRef, participant, { merge: true });
  }, [firestore]);

  const deleteParticipant = useCallback(async (participantId: string) => {
      if (!firestore) return;
      
      const participantRef = doc(firestore, 'participants', participantId);
      const paymentsQuery = query(collection(firestore, 'payments'), where('participantId', '==', participantId));

      try {
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const batch = writeBatch(firestore);
        
        paymentsSnapshot.forEach(paymentDoc => {
          batch.delete(paymentDoc.ref);
        });
        batch.delete(participantRef);
        
        await batch.commit();
      } catch (e: any) {
        console.error("Error batch deleting participant and payments:", e);
        toast({ variant: 'destructive', title: "Error cleaning up data", description: e.message });
      }
  }, [firestore, toast]);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'date'>) => {
    if (!currentUser || !firestore) return;
    const newExpense = { ...expense, date: new Date().toISOString().split('T')[0], recordedBy: currentUser.id };
    addDocumentNonBlocking(collection(firestore, 'expenses'), newExpense);
  }, [currentUser, firestore]);

  const updateExpense = useCallback((expense: Expense) => {
    if (!firestore) return;
    const expenseRef = doc(firestore, 'expenses', expense.id);
    setDocumentNonBlocking(expenseRef, expense, { merge: true });
  }, [firestore]);

  const deleteExpense = useCallback((expenseId: string) => {
    if (!firestore) return;
    const expenseRef = doc(firestore, 'expenses', expenseId);
    deleteDocumentNonBlocking(expenseRef);
  }, [firestore]);
  
  const addUser = useCallback((user: Omit<UserProfile, 'id'>, uid: string) => {
     if (!firestore) return;
     const userRef = doc(firestore, 'users', uid);
     setDocumentNonBlocking(userRef, { ...user, id: uid }, { merge: true });
  }, [firestore]);
  
  const updateUser = useCallback((user: UserProfile) => {
     if (!firestore) return;
     const userRef = doc(firestore, 'users', user.id);
     setDocumentNonBlocking(userRef, user, { merge: true });
  }, [firestore]);
  
  const deleteUser = useCallback((userId: string) => {
     if (!firestore) return;
     const userRef = doc(firestore, 'users', userId);
     deleteDocumentNonBlocking(userRef);
  }, [firestore]);
  
  const addWallet = useCallback((wallet: Omit<Wallet, 'id' | 'balance'>) => {
    if (!firestore) return;
    addDocumentNonBlocking(collection(firestore, 'wallets'), { ...wallet, balance: 0 });
  }, [firestore]);
  
  const addWalletTransaction = useCallback(async (transaction: Omit<WalletTransaction, 'id' | 'date'>) => {
    if (!firestore) return;
    try {
        await runTransaction(firestore, async (t) => {
        const walletRef = doc(firestore, 'wallets', transaction.walletId);
        const walletDoc = await t.get(walletRef);
        if (!walletDoc.exists()) {
            throw new Error("Wallet does not exist!");
        }
        const walletData = walletDoc.data() as Wallet;
        const newBalance = transaction.type === 'add'
            ? walletData.balance + transaction.amount
            : walletData.balance - transaction.amount;
        
        if (newBalance < 0) {
            throw new Error("Insufficient funds.");
        }
        
        const newTransactionRef = doc(collection(firestore, 'walletTransactions'));
        t.set(newTransactionRef, { ...transaction, date: new Date().toISOString().split('T')[0] });
        t.update(walletRef, { balance: newBalance });
        });
    } catch(e: any) {
       toast({ variant: 'destructive', title: 'Transaction failed', description: e.toString() });
    }
  }, [firestore, toast]);

  const updateWalletTransaction = useCallback(async (transaction: WalletTransaction) => {
    if (!firestore) return;
    
    try {
        await runTransaction(firestore, async (t) => {
            const txRef = doc(firestore, 'walletTransactions', transaction.id);
            const oldTxDoc = await t.get(txRef);
            if (!oldTxDoc.exists()) {
                throw new Error("Original transaction not found.");
            }
            const oldTx = oldTxDoc.data() as WalletTransaction;
            
            const walletRef = doc(firestore, 'wallets', transaction.walletId);
            const walletDoc = await t.get(walletRef);
            if (!walletDoc.exists()) {
                throw new Error("Wallet not found.");
            }
            const wallet = walletDoc.data() as Wallet;

            // Revert old transaction amount
            let balance = wallet.balance;
            if (oldTx.type === 'add') {
                balance -= oldTx.amount;
            } else {
                balance += oldTx.amount;
            }
            
            // Apply new transaction amount
            if (transaction.type === 'add') {
                balance += transaction.amount;
            } else {
                balance -= transaction.amount;
            }

            if (balance < 0) {
                throw new Error("Insufficient funds for this update.");
            }

            t.update(walletRef, { balance: balance });
            t.set(txRef, transaction);
        });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Update failed', description: e?.message || "Could not update transaction." });
    }
  }, [firestore, toast]);

  const deleteWalletTransaction = useCallback(async (transactionId: string) => {
      if (!firestore) return;
      try {
        await runTransaction(firestore, async (t) => {
            const txRef = doc(firestore, 'walletTransactions', transactionId);
            const txDoc = await t.get(txRef);
            if (!txDoc.exists()) {
                throw new Error("Transaction not found.");
            }
            const tx = txDoc.data() as WalletTransaction;

            const walletRef = doc(firestore, 'wallets', tx.walletId);
            const walletDoc = await t.get(walletRef);
            if (!walletDoc.exists()) {
                throw new Error("Wallet not found.");
            }
            const wallet = walletDoc.data() as Wallet;

            let balance = wallet.balance;
            if (tx.type === 'add') {
                balance -= tx.amount;
            } else {
                balance += tx.amount;
            }

            if (balance < 0) {
                console.warn("Wallet balance would be negative after deleting transaction. Setting to 0.");
                balance = 0;
            }
            
            t.update(walletRef, { balance: balance });
            t.delete(txRef);
        });
      } catch(e: any) {
        toast({ variant: 'destructive', title: 'Delete failed', description: e?.message || "Could not delete transaction." });
      }
  }, [firestore, toast]);

  const addPolicyDocument = useCallback((document: Omit<PolicyDocument, 'id' | 'uploadedAt' | 'file'> & { file: File }) => {
    if (!firestore) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const fileUrl = e.target?.result as string;
        const newDoc = {
            name: document.name,
            details: document.details,
            uploadedAt: new Date().toISOString(),
            file: {
                name: document.file.name,
                url: fileUrl,
                size: document.file.size,
                type: document.file.type
            }
        }
        addDocumentNonBlocking(collection(firestore, 'policyDocuments'), newDoc);
    };
    reader.readAsDataURL(document.file);
  }, [firestore]);

  const deletePolicyDocument = useCallback((docId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'policyDocuments', docId));
  }, [firestore]);

  const setLogo = useCallback((logoUrl: string) => {
      if (!firestore) return;
      setDocumentNonBlocking(doc(firestore, 'appConfig', 'logo'), { url: logoUrl }, { merge: true });
  }, [firestore]);
  
  const addRecentActivity = (activity: RecentActivity) => {
    setRecentActivities(prev => [activity, ...prev].slice(0, 10));
  }

  const value = {
    payments,
    addPayment,
    updatePayment,
    deletePayment,
    participants,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    users,
    addUser,
    updateUser,
    deleteUser,
    wallets,
    addWallet,
    walletTransactions,
    addWalletTransaction,
    updateWalletTransaction,
    deleteWalletTransaction,
    policyDocuments,
    addPolicyDocument,
    deletePolicyDocument,
    recentActivities,
    addRecentActivity,
    currentUser,
    logo,
    setLogo,
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
