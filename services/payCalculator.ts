import { Job, WorkLog, PayDetails, Holiday, JobPayDetails } from '../types';
import { HOLIDAY_PAY_MULTIPLIER, TAX_BRACKETS, ACC_LEVY_RATE } from '../constants';
import { toYYYYMMDD } from '../utils';

function getAnnualizedPay(weeklyPay: number): number {
  return weeklyPay * 52;
}

function calculateAnnualTax(annualPay: number): number {
  let tax = 0;
  let remainingPay = annualPay;
  let lastBracketLimit = 0;

  for (const bracket of TAX_BRACKETS) {
    if (remainingPay > 0) {
      const taxableInBracket = Math.min(remainingPay, bracket.upTo - lastBracketLimit);
      tax += taxableInBracket * bracket.rate;
      remainingPay -= taxableInBracket;
      lastBracketLimit = bracket.upTo;
    } else {
      break;
    }
  }
  return tax;
}


export function calculateWeeklyPay(workLog: WorkLog, jobs: Job[], week: Date[], holidays: Holiday[]): PayDetails {
  let grossPay = 0;
  let totalHours = 0;
  let holidayHours = 0;
  
  const jobPayMap: { [key: string]: { totalHours: number; holidayHours: number; grossPay: number } } = {};

  jobs.forEach(job => {
    jobPayMap[job.id] = { totalHours: 0, holidayHours: 0, grossPay: 0 };
  });

  const weekDateStrings = week.map(d => toYYYYMMDD(d));
  const holidayDateStrings = holidays.map(h => h.date);

  for (const dateStr of weekDateStrings) {
    const dayLog = workLog[dateStr] || [];
    const isHoliday = holidayDateStrings.includes(dateStr);

    for (const entry of dayLog) {
      const job = jobs.find(j => j.id === entry.jobId);
      if (job) {
        const rateMultiplier = isHoliday ? HOLIDAY_PAY_MULTIPLIER : 1;
        const payForEntry = entry.hours * job.payRate * rateMultiplier;
        
        grossPay += payForEntry;
        totalHours += entry.hours;

        // Update job-specific breakdown
        jobPayMap[job.id].grossPay += payForEntry;
        jobPayMap[job.id].totalHours += entry.hours;

        if(isHoliday) {
            holidayHours += entry.hours;
            jobPayMap[job.id].holidayHours += entry.hours;
        }
      }
    }
  }
  
  const jobBreakdown: JobPayDetails[] = jobs
    .map(job => ({
        jobId: job.id,
        jobName: job.name,
        jobColor: job.color,
        totalHours: jobPayMap[job.id].totalHours,
        holidayHours: jobPayMap[job.id].holidayHours,
        grossPay: jobPayMap[job.id].grossPay,
    }))
    .filter(breakdown => breakdown.totalHours > 0); // Only include jobs that were worked this week


  const annualizedPay = getAnnualizedPay(grossPay);
  const annualTax = calculateAnnualTax(annualizedPay);
  const weeklyTax = annualTax / 52;
  const accLevy = grossPay * ACC_LEVY_RATE;
  const netPay = grossPay - weeklyTax - accLevy;

  return {
    grossPay,
    tax: weeklyTax,
    accLevy,
    netPay: Math.max(0, netPay),
    totalHours,
    holidayHours,
    jobBreakdown
  };
}