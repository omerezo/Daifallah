export type Payment = {
  id: string;
  date: string;
  participantName: string;
  amount: number;
  currency: 'USD' | 'SAR' | 'EGP' | 'SDG';
  type: 'Monthly Share' | 'Donation';
  bankTransferProof?: string;
};

export type Participant = {
  id: string;
  name: string;
  phone: string;
  monthlyShare: string;
  status: 'Active' | 'Inactive';
  lastPaymentDate: string;
};

export type Expense = {
  id: string;
  date: string;
  description: string;
  category: 'Family Support' | 'Medical' | 'Education' | 'Operational';
  amount: number;
  currency: 'USD' | 'SAR' | 'EGP' | 'SDG';
};

export type UserRole = 'Admin' | 'Manager' | 'Collector' | 'Viewer';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type RecentActivity = {
    id: string;
    name: string;
    email: string;
    type: 'Payment' | 'Donation' | 'Expense';
    status: 'Paid' | 'Processed' | 'Pending';
    date: string;
    amount: string;
}
