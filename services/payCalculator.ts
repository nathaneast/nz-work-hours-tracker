import { Job, WorkLog, PayDetails, Holiday, JobPayDetails } from '../types';
import { TAX_BRACKETS, ACC_LEVY_RATE } from "../constants";
import { toYYYYMMDD } from '../utils';

const HOLIDAY_PAY_RATE = 0.08; // 8% of gross earnings

function getAnnualizedPay(weeklyPay: number): number {
  return weeklyPay * 52;
}

function calculateAnnualTax(annualPay: number): number {
  let tax = 0;
  let remainingPay = annualPay;
  let lastBracketLimit = 0;

  for (const bracket of TAX_BRACKETS) {
    if (remainingPay > 0) {
      const taxableInBracket = Math.min(
        remainingPay,
        bracket.upTo - lastBracketLimit
      );
      tax += taxableInBracket * bracket.rate;
      remainingPay -= taxableInBracket;
      lastBracketLimit = bracket.upTo;
    } else {
      break;
    }
  }
  return tax;
}

export function calculateWeeklyPay(
  workLog: WorkLog,
  jobs: Job[],
  week: Date[],
  holidays: Holiday[]
): PayDetails {
  let ordinaryPay = 0; // Basic pay (hourly rate × hours)
  let totalHours = 0;
  let holidayHours = 0;

  const jobPayMap: {
    [key: string]: {
      totalHours: number;
      holidayHours: number;
      ordinaryPay: number;
    };
  } = {};

  jobs.forEach((job) => {
    jobPayMap[job.id] = { totalHours: 0, holidayHours: 0, ordinaryPay: 0 };
  });

  const weekDateStrings = week.map((d) => toYYYYMMDD(d));
  const holidayDateStrings = holidays.map((h) => h.date);

  // Calculate ordinary pay (basic hourly rate × hours)
  for (const dateStr of weekDateStrings) {
    const dayLog = workLog[dateStr] || [];
    const isHoliday = holidayDateStrings.includes(dateStr);

    for (const entry of dayLog) {
      const job = jobs.find((j) => j.id === entry.jobId);
      if (job) {
        // Ordinary pay is always basic rate × hours (no multiplier)
        const payForEntry = entry.hours * job.payRate;

        ordinaryPay += payForEntry;
        totalHours += entry.hours;

        // Update job-specific breakdown
        jobPayMap[job.id].ordinaryPay += payForEntry;
        jobPayMap[job.id].totalHours += entry.hours;

        if (isHoliday) {
          holidayHours += entry.hours;
          jobPayMap[job.id].holidayHours += entry.hours;
        }
      }
    }
  }

  // Calculate holiday pay (8% of ordinary pay) for jobs with includeHolidayPay enabled
  let totalHolidayPay = 0;
  const jobBreakdown: JobPayDetails[] = jobs
    .map((job) => {
      const jobOrdinaryPay = jobPayMap[job.id].ordinaryPay;
      const jobHolidayPay = job.includeHolidayPay
        ? jobOrdinaryPay * HOLIDAY_PAY_RATE
        : 0;
      const jobGrossPay = jobOrdinaryPay + jobHolidayPay;
      totalHolidayPay += jobHolidayPay;

      return {
        jobId: job.id,
        jobName: job.name,
        jobColor: job.color,
        totalHours: jobPayMap[job.id].totalHours,
        holidayHours: jobPayMap[job.id].holidayHours,
        ordinaryPay: jobOrdinaryPay,
        holidayPay: jobHolidayPay,
        grossPay: jobGrossPay,
        includeHolidayPay: job.includeHolidayPay,
      };
    })
    .filter((breakdown) => breakdown.totalHours > 0); // Only include jobs that were worked this week

  const grossPay = ordinaryPay + totalHolidayPay;

  const annualizedPay = getAnnualizedPay(grossPay);
  const annualTax = calculateAnnualTax(annualizedPay);
  const weeklyTax = annualTax / 52;
  const accLevy = grossPay * ACC_LEVY_RATE;
  const netPay = grossPay - weeklyTax - accLevy;

  return {
    grossPay,
    ordinaryPay,
    holidayPay: totalHolidayPay,
    tax: weeklyTax,
    accLevy,
    netPay: Math.max(0, netPay),
    totalHours,
    holidayHours,
    jobBreakdown,
  };
}