import { Holiday, Region } from './types';

export const NZ_MINIMUM_WAGE = 23.15;
export const HOLIDAY_PAY_MULTIPLIER = 1.5;
export const ACC_LEVY_RATE = 0.0160; // 1.60% for 2024-2025

// PAYE tax brackets for 2024-2025 (Annual)
export const TAX_BRACKETS = [
  { upTo: 14000, rate: 0.105 },
  { upTo: 48000, rate: 0.175 },
  { upTo: 70000, rate: 0.30 },
  { upTo: 180000, rate: 0.33 },
  { upTo: Infinity, rate: 0.39 },
];

export const NZ_REGIONS: Region[] = [
  'None',
  'Auckland', // Includes Northland
  'Wellington',
  'Canterbury', // Includes South Canterbury
  'Otago',
  'Southland',
  'Nelson',
  'Taranaki',
  "Hawke's Bay",
  'Marlborough',
  'Westland', // Includes Chatham Islands
];

// New Zealand National Public Holidays
export const NZ_NATIONAL_HOLIDAYS: Holiday[] = [
    // 2024
    { date: '2024-01-01', name: "New Year's Day" },
    { date: '2024-01-02', name: "Day after New Year's Day" },
    { date: '2024-02-06', name: 'Waitangi Day' },
    { date: '2024-03-29', name: 'Good Friday' },
    { date: '2024-04-01', name: 'Easter Monday' },
    { date: '2024-04-25', name: 'Anzac Day' },
    { date: '2024-06-03', name: "King's Birthday" },
    { date: '2024-06-28', name: 'Matariki' },
    { date: '2024-10-28', name: 'Labour Day' },
    { date: '2024-12-25', name: 'Christmas Day' },
    { date: '2024-12-26', name: 'Boxing Day' },

    // 2025
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-01-02', name: "Day after New Year's Day" },
    { date: '2025-02-06', name: 'Waitangi Day' },
    { date: '2025-04-18', name: 'Good Friday' },
    { date: '2025-04-21', name: 'Easter Monday' },
    { date: '2025-04-25', name: 'Anzac Day' },
    { date: '2025-06-02', name: "King's Birthday" },
    { date: '2025-06-20', name: 'Matariki' },
    { date: '2025-10-27', name: 'Labour Day' },
    { date: '2025-12-25', name: 'Christmas Day' },
    { date: '2025-12-26', name: 'Boxing Day' },

    // 2026
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-01-02', name: "Day after New Year's Day" },
    { date: '2026-02-06', name: 'Waitangi Day' },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-04-06', name: 'Easter Monday' },
    { date: '2026-04-27', name: 'Anzac Day (observed)' },
    { date: '2026-06-01', name: "King's Birthday" },
    { date: '2026-07-10', name: 'Matariki' },
    { date: '2026-10-26', name: 'Labour Day' },
    { date: '2026-12-25', name: 'Christmas Day' },
    { date: '2026-12-28', name: 'Boxing Day (observed)' },
];

// New Zealand Provincial Anniversary Days
export const NZ_PROVINCIAL_HOLIDAYS: Holiday[] = [
  // 2024
  { date: '2024-01-22', name: 'Wellington Anniversary', region: 'Wellington' },
  { date: '2024-01-29', name: 'Auckland Anniversary', region: 'Auckland' },
  { date: '2024-02-05', name: 'Nelson Anniversary', region: 'Nelson' },
  { date: '2024-03-11', name: 'Taranaki Anniversary', region: 'Taranaki' },
  { date: '2024-03-25', name: 'Otago Anniversary', region: 'Otago' },
  { date: '2024-04-02', name: 'Southland Anniversary', region: 'Southland' },
  { date: '2024-10-25', name: "Hawke's Bay Anniversary", region: "Hawke's Bay" },
  { date: '2024-11-04', name: 'Marlborough Anniversary', region: 'Marlborough' },
  { date: '2024-11-15', name: 'Canterbury Anniversary', region: 'Canterbury' },
  { date: '2024-12-02', name: 'Westland Anniversary', region: 'Westland' },

  // 2025
  { date: '2025-01-20', name: 'Wellington Anniversary', region: 'Wellington' },
  { date: '2025-01-27', name: 'Auckland Anniversary', region: 'Auckland' },
  { date: '2025-02-03', name: 'Nelson Anniversary', region: 'Nelson' },
  { date: '2025-03-10', name: 'Taranaki Anniversary', region: 'Taranaki' },
  { date: '2025-03-24', name: 'Otago Anniversary', region: 'Otago' },
  { date: '2025-04-22', name: 'Southland Anniversary', region: 'Southland' },
  { date: '2025-10-24', name: "Hawke's Bay Anniversary", region: "Hawke's Bay" },
  { date: '2025-11-03', name: 'Marlborough Anniversary', region: 'Marlborough' },
  { date: '2025-11-14', name: 'Canterbury Anniversary', region: 'Canterbury' },
  { date: '2025-12-01', name: 'Westland Anniversary', region: 'Westland' },

  // 2026
  { date: '2026-01-19', name: 'Wellington Anniversary', region: 'Wellington' },
  { date: '2026-01-26', name: 'Auckland Anniversary', region: 'Auckland' },
  { date: '2026-02-02', name: 'Nelson Anniversary', region: 'Nelson' },
  { date: '2026-03-09', name: 'Taranaki Anniversary', region: 'Taranaki' },
  { date: '2026-03-23', name: 'Otago Anniversary', region: 'Otago' },
  { date: '2026-04-07', name: 'Southland Anniversary', region: 'Southland' },
  { date: '2026-10-23', name: "Hawke's Bay Anniversary", region: "Hawke's Bay" },
  { date: '2026-11-02', name: 'Marlborough Anniversary', region: 'Marlborough' },
  { date: '2026-11-13', name: 'Canterbury Anniversary', region: 'Canterbury' },
  { date: '2026-11-30', name: 'Westland Anniversary', region: 'Westland' },
];

export const JOB_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500'
];