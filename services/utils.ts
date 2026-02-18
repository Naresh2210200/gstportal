export function generateFinancialYears(count: number = 5): string[] {
  const years: string[] = [];
  const today = new Date();
  // FY starts April 1. If current month < April, current FY started last year.
  const currentFYStart = today.getMonth() < 3
    ? today.getFullYear() - 1
    : today.getFullYear();

  for (let i = 0; i < count; i++) {
    const start = currentFYStart - i;
    const end = (start + 1).toString().slice(-2);
    years.push(`${start}-${end}`);
  }
  return years;
}