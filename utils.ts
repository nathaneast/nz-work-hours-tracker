// Function to get the start of the week (Monday) based on a given date, using UTC.
export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  // Get day of week (0=Sunday, 1=Monday, ...). We want Monday to be start of week.
  const dayOfWeek = d.getUTCDay();
  // Calculate the date for the previous Monday.
  const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
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
    jobs: Array<{ id: string; payRate: number }>,
    isHoliday: boolean,
    holidayPayMultiplier: number = 1.5,
    accLevyRate: number = 0.0160
): number => {
    let grossPay = 0;
    
    for (const entry of dayLog) {
        const job = jobs.find(j => j.id === entry.jobId);
        if (job) {
            const rateMultiplier = isHoliday ? holidayPayMultiplier : 1;
            grossPay += entry.hours * job.payRate * rateMultiplier;
        }
    }
    
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
