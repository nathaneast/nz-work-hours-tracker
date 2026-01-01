import { Job, WorkLog, PayDetails, Holiday, JobPayDetails } from '../types';
import {
  TAX_BRACKETS,
  ACC_LEVY_RATE,
  HOLIDAY_PAY_MULTIPLIER,
} from "../constants";
import { toYYYYMMDD } from '../utils';

const HOLIDAY_PAY_RATE = 0.08; // 8% of gross earnings
const PUBLIC_HOLIDAY_PREMIUM_RATE = HOLIDAY_PAY_MULTIPLIER - 1; // 0.5 (additional 50% for working on public holidays)

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
  let ordinaryPay = 0; // Basic pay (hourly rate × hours, regardless of holiday)
  let publicHolidayPremium = 0; // Additional 0.5× pay for working on public holidays
  let totalHours = 0;
  let holidayHours = 0;

  const jobPayMap: {
    [key: string]: {
      totalHours: number;
      holidayHours: number;
      ordinaryPay: number;
      publicHolidayPremium: number;
    };
  } = {};

  jobs.forEach((job) => {
    jobPayMap[job.id] = {
      totalHours: 0,
      holidayHours: 0,
      ordinaryPay: 0,
      publicHolidayPremium: 0,
    };
  });

  const weekDateStrings = week.map((d) => toYYYYMMDD(d));
  const holidayDateStrings = holidays.map((h) => h.date);

  // Calculate ordinary pay and public holiday premium
  for (const dateStr of weekDateStrings) {
    const dayLog = workLog[dateStr] || [];
    const isHoliday = holidayDateStrings.includes(dateStr);

    for (const entry of dayLog) {
      const job = jobs.find((j) => j.id === entry.jobId);
      if (job) {
        const basePay = entry.hours * job.payRate;

        if (isHoliday) {
          // On public holidays: pay 1.5× (base pay + 0.5× premium)
          const premium = basePay * PUBLIC_HOLIDAY_PREMIUM_RATE;
          ordinaryPay += basePay;
          publicHolidayPremium += premium;
          holidayHours += entry.hours;

          jobPayMap[job.id].ordinaryPay += basePay;
          jobPayMap[job.id].publicHolidayPremium += premium;
          jobPayMap[job.id].holidayHours += entry.hours;
        } else {
          // Regular day: base pay only
          ordinaryPay += basePay;
          jobPayMap[job.id].ordinaryPay += basePay;
        }

        totalHours += entry.hours;
        jobPayMap[job.id].totalHours += entry.hours;
      }
    }
  }

  // Calculate holiday pay (8% of ordinary pay) for jobs with includeHolidayPay enabled
  let totalHolidayPay = 0;
  const jobBreakdown: JobPayDetails[] = jobs
    .map((job) => {
      const jobOrdinaryPay = jobPayMap[job.id].ordinaryPay;
      const jobPublicHolidayPremium = jobPayMap[job.id].publicHolidayPremium;
      const jobHolidayPay = job.includeHolidayPay
        ? jobOrdinaryPay * HOLIDAY_PAY_RATE
        : 0;
      const jobGrossPay =
        jobOrdinaryPay + jobPublicHolidayPremium + jobHolidayPay;
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

  const grossPay = ordinaryPay + publicHolidayPremium + totalHolidayPay;

  const annualizedPay = getAnnualizedPay(grossPay);
  const annualTax = calculateAnnualTax(annualizedPay);
  const weeklyTax = annualTax / 52;
  const accLevy = grossPay * ACC_LEVY_RATE;
  const netPay = grossPay - weeklyTax - accLevy;

  return {
    grossPay,
    ordinaryPay,
    publicHolidayPremium,
    holidayPay: totalHolidayPay,
    tax: weeklyTax,
    accLevy,
    netPay: Math.max(0, netPay),
    totalHours,
    holidayHours,
    jobBreakdown,
  };
}