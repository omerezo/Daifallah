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
  addUser: (user: UserProfile) => void;
  updateUser: (user: UserProfile) => void;
  deleteUser: (userId: string) => void;

  wallets: Wallet[];
  addWallet: (wallet: Omit<Wallet, 'id'>) => void;

  walletTransactions: WalletTransaction[];
  addWalletTransaction: (transaction: Omit<WalletTransaction, 'id' | 'date'>) => void;
  updateWalletTransaction: (transaction: WalletTransaction) => void;
  deleteWalletTransaction: (transactionId: string) => void;
  
  policyDocuments: PolicyDocument[];
  addPolicyDocument: (doc: Omit<PolicyDocument, 'id' | 'uploadedAt'>) => void;
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

  const paymentsRef = useMemoFirebase(() => firestore ? collection(firestore, 'payments') : null, [firestore]);
  const { data: paymentsData, error: paymentsError } = useCollection<Payment>(paymentsRef);
  const payments = paymentsData || [];

  const participantsRef = useMemoFirebase(() => firestore ? collection(firestore, 'participants') : null, [firestore]);
  const { data: participantsData, error: participantsError } = useCollection<Participant>(participantsRef);
  const participants = participantsData || [];

  const expensesRef = useMemoFirebase(() => firestore ? collection(firestore, 'expenses') : null, [firestore]);
  const { data: expensesData, error: expensesError } = useCollection<Expense>(expensesRef);
  const expenses = expensesData || [];

  const usersRef = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: usersData, error: usersError } = useCollection<UserProfile>(usersRef);
  const users = usersData || [];

  const walletsRef = useMemoFirebase(() => firestore ? collection(firestore, 'wallets') : null, [firestore]);
  const { data: walletsData, error: walletsError } = useCollection<Wallet>(walletsRef);
  const wallets = walletsData || [];

  const walletTransactionsRef = useMemoFirebase(() => firestore ? collection(firestore, 'walletTransactions') : null, [firestore]);
  const { data: walletTransactionsData, error: walletTransactionsError } = useCollection<WalletTransaction>(walletTransactionsRef);
  const walletTransactions = walletTransactionsData || [];

  const policyDocumentsRef = useMemoFirebase(() => firestore ? collection(firestore, 'policyDocuments') : null, [firestore]);
  const { data: policyDocumentsData, error: policyDocumentsError } = useCollection<PolicyDocument>(policyDocumentsRef);
  const policyDocuments = policyDocumentsData || [];

  const logoRef = useMemoFirebase(() => firestore ? doc(firestore, 'appConfig', 'logo') : null, [firestore]);
  const { data: logoData, error: logoError } = useDoc<{url: string}>(logoRef);
  const logo = logoData?.url || '';

  const currentUser = useMemo(() => {
    return users.find(u => u.id === authUser?.uid) || null;
  }, [users, authUser]);

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const errors = [paymentsError, participantsError, expensesError, usersError, walletsError, walletTransactionsError, policyDocumentsError, logoError].filter(Boolean);
    if (errors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Error loading data',
        description: errors.map(e => e?.message).join(' '),
      });
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

  const deleteParticipant = useCallback((participantId: string) => {
      if (!firestore) return;
      
      const participantRef = doc(firestore, 'participants', participantId);
      const paymentsQuery = query(collection(firestore, 'payments'), where('participantId', '==', participantId));

      // First delete the participant doc
      deleteDocumentNonBlocking(participantRef);

      // Then find and delete associated payments
      getDocs(paymentsQuery).then(paymentsSnapshot => {
        const batch = writeBatch(firestore);
        paymentsSnapshot.forEach(paymentDoc => {
          batch.delete(doc(firestore, 'payments', paymentDoc.id));
        });
        batch.commit().catch(e => {
            console.error("Error batch deleting payments:", e);
            toast({ variant: 'destructive', title: "Error cleaning up payments", description: e.message });
        });
      }).catch(e => {
        console.error("Error finding payments to delete:", e);
        toast({ variant: 'destructive', title: "Error finding payments", description: e.message });
      });
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
  
  const addUser = useCallback((user: UserProfile) => {
     if (!firestore) return;
     const userRef = doc(firestore, 'users', user.id);
     setDocumentNonBlocking(userRef, user, { merge: true });
  }, [firestore]);
  
  const updateUser = useCallback((user: UserProfile) => {
     if (!firestore) return;
     const userRef = doc(firestore, 'users', user.id);
     setDocumentNonBlocking(userRef, user, { merge: true });
  }, [firestore]);
  
  const deleteUser = useCallback((userId: string) => {
     if (!firestore) return;
     // This only deletes the Firestore document.
     const userRef = doc(firestore, 'users', userId);
     deleteDocumentNonBlocking(userRef);
  }, [firestore]);
  
  const addWallet = useCallback((wallet: Omit<Wallet, 'id'>) => {
    if (!firestore) return;
    addDocumentNonBlocking(collection(firestore, 'wallets'), { ...wallet, balance: 0 });
  }, [firestore]);
  
  const addWalletTransaction = useCallback((transaction: Omit<WalletTransaction, 'id' | 'date'>) => {
    if (!firestore) return;
    runTransaction(firestore, async (t) => {
      const walletRef = doc(firestore, 'wallets', transaction.walletId);
      const walletDoc = await t.get(walletRef);
      if (!walletDoc.exists()) {
        throw "Wallet does not exist!";
      }
      const walletData = walletDoc.data() as Wallet;
      const newBalance = transaction.type === 'add'
        ? walletData.balance + transaction.amount
        : walletData.balance - transaction.amount;
      
      if (newBalance < 0) {
        throw "Insufficient funds.";
      }
      
      const newTransactionRef = doc(collection(firestore, 'walletTransactions'));
      t.set(newTransactionRef, { ...transaction, date: new Date().toISOString().split('T')[0] });
      t.update(walletRef, { balance: newBalance });
    }).catch(e => {
       toast({ variant: 'destructive', title: 'Transaction failed', description: e.toString() });
    });
  }, [firestore, toast]);

  const updateWalletTransaction = useCallback((transaction: WalletTransaction) => {
    if (!firestore) return;
    // This operation is complex to make atomic and non-blocking.
    // For simplicity, we will just update the transaction document.
    // A more robust solution would use a Cloud Function to ensure atomicity.
    const txRef = doc(firestore, 'walletTransactions', transaction.id);
    setDocumentNonBlocking(txRef, transaction, { merge: true });
    toast({ title: 'Transaction Updated', description: 'Balance may need manual adjustment.' });
  }, [firestore, toast]);

  const deleteWalletTransaction = useCallback((transactionId: string) => {
      if (!firestore) return;
      // Similar to update, a robust solution requires a Cloud Function to correctly adjust balance.
      // For now, we just delete the transaction record.
      const txRef = doc(firestore, 'walletTransactions', transactionId);
      deleteDocumentNonBlocking(txRef);
      toast({ title: 'Transaction Deleted', description: 'Wallet balance will need manual adjustment.' });
  }, [firestore, toast]);

  const addPolicyDocument = useCallback((document: Omit<PolicyDocument, 'id' | 'uploadedAt'>) => {
    if (!firestore) return;
    addDocumentNonBlocking(collection(firestore, 'policyDocuments'), { ...document, uploadedAt: new Date().toISOString() });
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
    // This is purely local state for now.
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
