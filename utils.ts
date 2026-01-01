// Function to get the start of the week based on a given date and start day, using UTC.
// weekStartDay: 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday
export const getStartOfWeek = (date: Date, weekStartDay: number = 1): Date => {
  const d = new Date(date);
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate days to subtract to get to the start of the week
  let diff = dayOfWeek - weekStartDay;
  if (diff < 0) {
    diff += 7; // If negative, go back to previous week's start day
  }
  
  const startDate = new Date(d);
  startDate.setUTCDate(d.getUTCDate() - diff);
  return new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
};

export const toYYYYMMDD = (date: Date): string => {
    // Using UTC methods to avoid timezone issues.
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Convert decimal hours (e.g., 7.5) to hours and minutes (e.g., { hours: 7, minutes: 30 })
export const decimalHoursToHoursMinutes = (decimalHours: number): { hours: number; minutes: number } => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return { hours, minutes };
};

// Calculate daily net pay (simplified estimation)
export const calculateDailyNetPay = (
    dayLog: Array<{ jobId: string; hours: number }>,
    jobs: Array<{ id: string; payRate: number; includeHolidayPay: boolean }>,
    isHoliday: boolean,
    accLevyRate: number = 0.0160
): number => {
    const HOLIDAY_PAY_RATE = 0.08; // 8% of gross earnings
    let ordinaryPay = 0;
    let holidayPay = 0;
    
    for (const entry of dayLog) {
        const job = jobs.find(j => j.id === entry.jobId);
        if (job) {
            const entryOrdinaryPay = entry.hours * job.payRate;
            ordinaryPay += entryOrdinaryPay;
            
            // Add 8% holiday pay if job has includeHolidayPay enabled
            if (job.includeHolidayPay) {
                holidayPay += entryOrdinaryPay * HOLIDAY_PAY_RATE;
            }
        }
    }
    
    const grossPay = ordinaryPay + holidayPay;
    if (grossPay === 0) return 0;
    
    // Estimate tax based on weekly pay (simplified)
    // Assume this day's pay represents 1/5 of weekly pay (5 working days)
    const estimatedWeeklyPay = grossPay * 5;
    const estimatedAnnualPay = estimatedWeeklyPay * 52;
    
    // Calculate tax using simplified brackets
    let annualTax = 0;
    let remainingPay = estimatedAnnualPay;
    let lastBracketLimit = 0;
    
    const TAX_BRACKETS = [
        { upTo: 14000, rate: 0.105 },
        { upTo: 48000, rate: 0.175 },
        { upTo: 70000, rate: 0.30 },
        { upTo: 180000, rate: 0.33 },
        { upTo: Infinity, rate: 0.39 },
    ];
    
    for (const bracket of TAX_BRACKETS) {
        if (remainingPay > 0) {
            const taxableInBracket = Math.min(remainingPay, bracket.upTo - lastBracketLimit);
            annualTax += taxableInBracket * bracket.rate;
            remainingPay -= taxableInBracket;
            lastBracketLimit = bracket.upTo;
        } else {
            break;
        }
    }
    
    const weeklyTax = annualTax / 52;
    const dailyTax = weeklyTax / 5;
    const accLevy = grossPay * accLevyRate;
    const netPay = grossPay - dailyTax - accLevy;
    
    return Math.max(0, netPay);
};

// Convert hours and minutes to decimal hours (e.g., { hours: 7, minutes: 30 } -> 7.5)
export const hoursMinutesToDecimal = (hours: number, minutes: number): number => {
    return hours + minutes / 60;
};
