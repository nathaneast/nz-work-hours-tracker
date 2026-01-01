export type Region =
  | 'None'
  | 'Auckland'
  | 'Wellington'
  | 'Canterbury'
  | 'Otago'
  | 'Southland'
  | 'Nelson'
  | 'Taranaki'
  | "Hawke's Bay"
  | 'Marlborough'
  | 'Westland';

export interface Job {
  id: string;
  name: string;
  payRate: number;
  color: string;
  includeHolidayPay: boolean;
}

export interface WorkLogEntry {
  jobId: string;
  hours: number;
}

export interface WorkLog {
  [date: string]: WorkLogEntry[];
}

export interface JobPayDetails {
  jobId: string;
  jobName: string;
  jobColor: string;
  totalHours: number;
  holidayHours: number;
  ordinaryPay: number;
  holidayPay: number;
  grossPay: number;
  includeHolidayPay: boolean;
}

export interface PayDetails {
  grossPay: number;
  ordinaryPay: number;
  holidayPay: number;
  tax: number;
  accLevy: number;
  netPay: number;
  totalHours: number;
  holidayHours: number;
  jobBreakdown: JobPayDetails[];
}

export interface Holiday {
    date: string; // YYYY-MM-DD
    name: string;
    region?: Region;
}