export type Payment = {
  id: string;
  date: string;
  participantName: string;
  amount: number;
  currency: 'USD' | 'SAR' | 'EGP' | 'SDG';
  type: 'Monthly Share' | 'Donation';
  paymentFor: string;
  recordedBy: string;
  bankTransferProof?: {
    filename: string;
    url: string;
  };
  remarks?: string;
};

export type Participant = {
  id: string;
  name: string;
  phone: string;
  monthlyShare: string;
  status: 'Active' | 'Inactive';
  lastPaymentDate?: string;
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
  password?: string;
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

export type Wallet = {
  id: string;
  name: string;
  remarks: string;
  balance: number;
  currency: 'USD' | 'SAR' | 'EGP' | 'SDG';
}

export type WalletTransaction = {
  id: string;
  walletId: string;
  date: string;
  type: 'add' | 'consume';
  amount: number;
  description: string;
}

export type PolicyDocument = {
  id: string;
  name: string;
  details: string;
  file: {
    name: string;
    url: string;
    size: number;
    type: string;
  };
  uploadedAt: string;
};
