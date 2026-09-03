export function parseToUtcNoon(dString?: string | null): Date {
  let dateStr = '';
  
  if (!dString) {
    // Current date in Argentina timezone
    dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  } else if (dString.includes('T')) {
    // Has time component, extract just the YYYY-MM-DD part
    // Assuming the provided string is an ISO string or valid date string
    dateStr = new Date(dString).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  } else {
    // Plain YYYY-MM-DD string
    dateStr = dString;
  }

  return new Date(`${dateStr}T12:00:00.000Z`);
}
