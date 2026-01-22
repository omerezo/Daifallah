import type { Payment, Participant, Expense, User, RecentActivity } from './types';

export const payments: Payment[] = [
  {
    id: 'PAY-001',
    date: '2024-05-01',
    participantName: 'Fatima Ahmed',
    amount: 100,
    currency: 'USD',
    type: 'Monthly Share',
    remarks: 'Paid on time',
  },
  {
    id: 'PAY-002',
    date: '2024-05-01',
    participantName: 'Yusuf Ibrahim',
    amount: 500,
    currency: 'SAR',
    type: 'Donation',
  },
  {
    id: 'PAY-003',
    date: '2024-05-02',
    participantName: 'Aisha Omar',
    amount: 100,
    currency: 'USD',
    type: 'Monthly Share',
  },
  {
    id: 'PAY-004',
    date: '2024-05-03',
    participantName: 'Ali Hassan',
    amount: 2000,
    currency: 'EGP',
    type: 'Monthly Share',
  },
  {
    id: 'PAY-005',
    date: '2024-05-04',
    participantName: 'Zainab Abdullah',
    amount: 100,
    currency: 'USD',
    type: 'Monthly Share',
  },
];

export const participants: Participant[] = [
  {
    id: 'P-001',
    name: 'Fatima Ahmed',
    phone: '+1-202-555-0182',
    monthlyShare: '100 USD',
    status: 'Active',
    lastPaymentDate: '2024-05-01',
  },
  {
    id: 'P-002',
    name: 'Yusuf Ibrahim',
    phone: '+966-50-555-0129',
    monthlyShare: '500 SAR',
    status: 'Active',
    lastPaymentDate: '2024-05-01',
  },
  {
    id: 'P-003',
    name: 'Mustafa Mohamed',
    phone: '+1-202-555-0134',
    monthlyShare: '100 USD',
    status: 'Inactive',
    lastPaymentDate: '2024-02-15',
  },
  {
    id: 'P-004',
    name: 'Khadija Said',
    phone: '+20-10-555-0165',
    monthlyShare: '1500 EGP',
    status: 'Active',
    lastPaymentDate: '2024-04-28',
  },
];

export const expenses: Expense[] = [
  {
    id: 'EXP-001',
    date: '2024-05-10',
    description: 'Support for a family in need',
    category: 'Family Support',
    amount: 500,
    currency: 'USD',
  },
  {
    id: 'EXP-002',
    date: '2024-05-12',
    description: 'Medical bills coverage',
    category: 'Medical',
    amount: 1500,
    currency: 'SAR',
  },
  {
    id: 'EXP-003',
    date: '2024-05-20',
    description: 'Educational materials for students',
    category: 'Education',
    amount: 300,
    currency: 'USD',
  },
];

export const users: User[] = [
  {
    id: 'U-001',
    name: 'Admin User',
    email: 'admin@umma.tech',
    role: 'Admin',
  },
  {
    id: 'U-002',
    name: 'Manager User',
    email: 'manager@umma.tech',
    role: 'Manager',
  },
  {
    id: 'U-003',
    name: 'Collector User',
    email: 'collector@umma.tech',
    role: 'Collector',
  },
  {
    id: 'U-004',
    name: 'Viewer User',
    email: 'viewer@umma.tech',
    role: 'Viewer',
  },
];

export const recentActivities: RecentActivity[] = [
    { id: "1", name: 'Ahmed Ali', email: 'ahmed.ali@example.com', type: 'Payment', status: 'Paid', date: '2023-05-01', amount: '$100.00' },
    { id: "2", name: 'Salma Ibrahim', email: 'salma.i@example.com', type: 'Donation', status: 'Paid', date: '2023-05-02', amount: '$50.00' },
    { id: "3", name: 'Khalid Mohamed', email: 'khalid.m@example.com', type: 'Expense', status: 'Processed', date: '2023-05-03', amount: '-$75.00' },
    { id: "4", name: 'Noura Hassan', email: 'noura.h@example.com', type: 'Payment', status: 'Paid', date: '2023-05-04', amount: '$100.00' },
];
