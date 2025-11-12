/**
 * @jest-environment jsdom
 */
import { calculateWeeklyPay } from './payCalculator';
import { Job, WorkLog, Holiday } from '../types';
import { NZ_MINIMUM_WAGE, NZ_NATIONAL_HOLIDAYS, NZ_PROVINCIAL_HOLIDAYS } from '../constants';

// Note: This file is structured like a Jest test file. 
// You would typically run this with a test runner like Jest or Vitest.

// FIX: Moved Jest polyfills to the top to avoid 'used before declaration' error.
// A simple polyfill for Jest's globals to allow this file to run without a test runner.
// In a real project, you'd use a test runner like Jest.
const describe = (description: string, fn: () => void) => {
  console.log(`-- ${description} --`);
  fn();
};

const it = (description: string, fn: () => void) => {
  try {
      fn();
      console.log(`  ✓ ${description}`);
  } catch (error: any) {
      console.error(`  ✗ ${description}`);
      console.error(error);
  }
};

const expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) {
      throw new Error(`Assertion failed: Expected ${actual} to be ${expected}`);
    }
  },
  toBeCloseTo: (expected: number, precision: number = 2) => {
    const pass = Math.abs(expected - actual) < (Math.pow(10, -precision) / 2);
    if (!pass) {
      throw new Error(`Assertion failed: Expected ${actual} to be close to ${expected}`);
    }
  },
  toBeLessThan: (expected: any) => {
    if (!(actual < expected)) {
      throw new Error(`Assertion failed: Expected ${actual} to be less than ${expected}`);
    }
  },
  toBeDefined: () => {
    if (actual === undefined || actual === null) {
      throw new Error(`Assertion failed: Expected value to be defined, but it was ${actual}`);
    }
  }
});

describe('payCalculator', () => {

  // Mock Jobs Data
  const mockJobs: Job[] = [
    { id: 'job_1', name: 'Cafe Barista', payRate: NZ_MINIMUM_WAGE, color: 'bg-blue-500' }, // 23.15
    { id: 'job_2', name: 'Farm Hand', payRate: 25.00, color: 'bg-green-500' },
  ];

  // Helper to create a week array starting from a specific date
  const createWeek = (startDate: string): Date[] => {
    const start = new Date(startDate);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setUTCDate(start.getUTCDate() + i);
      return day;
    });
  };

  it('Scenario 1: Calculates pay for a basic week with a single job', () => {
    const week = createWeek('2024-07-01'); // A week with no public holidays
    const workLog: WorkLog = {
      '2024-07-01': [{ jobId: 'job_1', hours: 8 }], // Monday
      '2024-07-02': [{ jobId: 'job_1', hours: 8 }], // Tuesday
      '2024-07-03': [{ jobId: 'job_1', hours: 8 }], // Wednesday
      '2024-07-04': [{ jobId: 'job_1', hours: 8 }], // Thursday
      '2024-07-05': [{ jobId: 'job_1', hours: 8 }], // Friday
    };
    
    const result = calculateWeeklyPay(workLog, [mockJobs[0]], week, NZ_NATIONAL_HOLIDAYS);

    // --- Manual Calculation for Verification ---
    // Total Hours: 8 * 5 = 40 hours
    // Gross Pay: 40 * 23.15 = $926.00
    // Annualized Pay: 926 * 52 = $48152
    // Annual Tax: (14000 * 0.105) + (34000 * 0.175) + (152 * 0.30) = 1470 + 5950 + 45.6 = $7465.6
    // Weekly Tax: 7465.6 / 52 = $143.57
    // ACC Levy: 926 * 0.0160 = $14.82
    // Net Pay: 926 - 143.57 - 14.82 = $767.61
    
    expect(result.totalHours).toBe(40);
    expect(result.holidayHours).toBe(0);
    expect(result.grossPay).toBeCloseTo(926.00);
    expect(result.tax).toBeCloseTo(143.57, 2);
    expect(result.accLevy).toBeCloseTo(14.82, 2);
    expect(result.netPay).toBeCloseTo(767.61, 2);
    
    // Check job breakdown
    expect(result.jobBreakdown.length).toBe(1);
    expect(result.jobBreakdown[0].jobId).toBe('job_1');
    expect(result.jobBreakdown[0].grossPay).toBeCloseTo(926.00);
    expect(result.jobBreakdown[0].totalHours).toBe(40);
  });

  it('Scenario 2: Calculates pay correctly for multiple jobs in one week', () => {
    const week = createWeek('2024-07-01'); // No holidays
    const workLog: WorkLog = {
      '2024-07-01': [{ jobId: 'job_1', hours: 8 }], // Mon: Job 1
      '2024-07-02': [{ jobId: 'job_1', hours: 8 }], // Tue: Job 1
      '2024-07-03': [{ jobId: 'job_2', hours: 7 }], // Wed: Job 2
      '2024-07-04': [{ jobId: 'job_2', hours: 7 }], // Thu: Job 2
    };

    const result = calculateWeeklyPay(workLog, mockJobs, week, NZ_NATIONAL_HOLIDAYS);
    
    // --- Manual Calculation ---
    // Job 1 hours: 16, Job 2 hours: 14. Total: 30 hours.
    // Job 1 Gross: 16 * 23.15 = 370.40
    // Job 2 Gross: 14 * 25.00 = 350.00
    // Total Gross Pay: 370.40 + 350.00 = $720.40

    expect(result.totalHours).toBe(30);
    expect(result.grossPay).toBeCloseTo(720.40);
    expect(result.netPay).toBeLessThan(720.40); // Basic check that tax was deducted

    // Check job breakdown
    expect(result.jobBreakdown.length).toBe(2);
    const job1Breakdown = result.jobBreakdown.find(j => j.jobId === 'job_1');
    const job2Breakdown = result.jobBreakdown.find(j => j.jobId === 'job_2');
    
    expect(job1Breakdown).toBeDefined();
    expect(job1Breakdown!.grossPay).toBeCloseTo(370.40);
    expect(job1Breakdown!.totalHours).toBe(16);

    expect(job2Breakdown).toBeDefined();
    expect(job2Breakdown!.grossPay).toBeCloseTo(350.00);
    expect(job2Breakdown!.totalHours).toBe(14);
  });

  it('Scenario 3: Applies holiday pay multiplier for work on a national public holiday', () => {
    // Matariki is on Friday, 28th June 2024
    const week = createWeek('2024-06-24');
    const workLog: WorkLog = {
      '2024-06-27': [{ jobId: 'job_2', hours: 8 }], // Thursday (normal)
      '2024-06-28': [{ jobId: 'job_2', hours: 8 }], // Friday (Matariki - Public Holiday)
    };

    const result = calculateWeeklyPay(workLog, [mockJobs[1]], week, NZ_NATIONAL_HOLIDAYS);

    // --- Manual Calculation ---
    // Normal Pay: 8 hours * $25/hr = $200
    // Holiday Pay: 8 hours * $25/hr * 1.5 = $300
    // Gross Pay: 200 + 300 = $500
    
    expect(result.totalHours).toBe(16);
    expect(result.holidayHours).toBe(8);
    expect(result.grossPay).toBeCloseTo(500.00);
    
    // Check job breakdown
    expect(result.jobBreakdown.length).toBe(1);
    expect(result.jobBreakdown[0].holidayHours).toBe(8);
    expect(result.jobBreakdown[0].grossPay).toBeCloseTo(500.00);
  });
  
  it('Scenario 4: Correctly calculates a complex week with multiple jobs and a national public holiday', () => {
    // King's Birthday is on Monday, 3rd June 2024
    const week = createWeek('2024-06-03');
    const workLog: WorkLog = {
      // Job 1 (Barista) works on the holiday
      '2024-06-03': [{ jobId: 'job_1', hours: 8 }], // Monday (King's Birthday)
      // Job 1 also works a normal day
      '2024-06-04': [{ jobId: 'job_1', hours: 8 }], // Tuesday
      // Job 2 (Farm) works a normal day
      '2024-06-05': [{ jobId: 'job_2', hours: 9 }], // Wednesday
    };
    
    const result = calculateWeeklyPay(workLog, mockJobs, week, NZ_NATIONAL_HOLIDAYS);
    
    // --- Manual Calculation ---
    // Job 1 Holiday Pay: 8 hrs * 23.15 * 1.5 = $277.80
    // Job 1 Normal Pay: 8 hrs * 23.15 = $185.20
    // Job 1 Gross: 277.80 + 185.20 = 463.00
    // Job 2 Normal Pay: 9 hrs * 25.00 = $225.00
    // Total Gross Pay: 463.00 + 225.00 = $688.00
    // Total Hours: 8 + 8 + 9 = 25
    // Holiday Hours: 8
    // Annualized Pay: 688 * 52 = $35776
    // Annual Tax: (14000 * 0.105) + (21776 * 0.175) = 1470 + 3810.8 = $5280.8
    // Weekly Tax: 5280.8 / 52 = $101.55
    // ACC Levy: 688 * 0.0160 = $11.01
    // Net Pay: 688 - 101.55 - 11.01 = $575.44

    expect(result.totalHours).toBe(25);
    expect(result.holidayHours).toBe(8);
    expect(result.grossPay).toBeCloseTo(688.00);
    expect(result.tax).toBeCloseTo(101.55, 2);
    expect(result.accLevy).toBeCloseTo(11.01, 2);
    expect(result.netPay).toBeCloseTo(575.44, 2);
    
    // Check job breakdown
    expect(result.jobBreakdown.length).toBe(2);
    const job1Breakdown = result.jobBreakdown.find(j => j.jobId === 'job_1');
    const job2Breakdown = result.jobBreakdown.find(j => j.jobId === 'job_2');

    expect(job1Breakdown).toBeDefined();
    expect(job1Breakdown!.totalHours).toBe(16);
    expect(job1Breakdown!.holidayHours).toBe(8);
    expect(job1Breakdown!.grossPay).toBeCloseTo(463.00);

    expect(job2Breakdown).toBeDefined();
    expect(job2Breakdown!.totalHours).toBe(9);
    expect(job2Breakdown!.holidayHours).toBe(0);
    expect(job2Breakdown!.grossPay).toBeCloseTo(225.00);
  });

  it('Scenario 5: Applies holiday pay multiplier for work on a Provincial Anniversary Day', () => {
    // Wellington Anniversary is Monday, 22nd Jan 2024
    const week = createWeek('2024-01-22');
    const workLog: WorkLog = {
      '2024-01-22': [{ jobId: 'job_1', hours: 7 }], // Monday (Wellington Anniversary)
      '2024-01-23': [{ jobId: 'job_1', hours: 7 }], // Tuesday (normal)
    };
    
    const wellingtonHolidays: Holiday[] = [
        ...NZ_NATIONAL_HOLIDAYS, 
        ...NZ_PROVINCIAL_HOLIDAYS.filter(h => h.region === 'Wellington')
    ];

    const result = calculateWeeklyPay(workLog, [mockJobs[0]], week, wellingtonHolidays);

    // --- Manual Calculation ---
    // Holiday Pay: 7 * 23.15 * 1.5 = 243.075
    // Normal Pay: 7 * 23.15 = 162.05
    // Gross Pay: 243.075 + 162.05 = 405.125
    
    expect(result.totalHours).toBe(14);
    expect(result.holidayHours).toBe(7);
    expect(result.grossPay).toBeCloseTo(405.13);

    // Check job breakdown
    expect(result.jobBreakdown.length).toBe(1);
    expect(result.jobBreakdown[0].jobId).toBe('job_1');
    expect(result.jobBreakdown[0].holidayHours).toBe(7);
    expect(result.jobBreakdown[0].grossPay).toBeCloseTo(405.13);
  });
});