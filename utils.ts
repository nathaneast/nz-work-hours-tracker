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
