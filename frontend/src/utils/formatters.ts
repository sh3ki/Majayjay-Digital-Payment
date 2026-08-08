export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatShortDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Return ISO datetime string representing Manila start of day for a given date-only string (YYYY-MM-DD)
export const manilaStartOfDayISO = (dateOnly: string): string => {
  // Manila is UTC+8
  if (!dateOnly) return '';
  return `${dateOnly}T00:00:00+08:00`;
};

// Return ISO datetime string representing Manila end of day for a given date-only string (YYYY-MM-DD)
export const manilaEndOfDayISO = (dateOnly: string): string => {
  if (!dateOnly) return '';
  return `${dateOnly}T23:59:59.999+08:00`;
};

export const fullName = (firstName: string, lastName: string): string => `${firstName} ${lastName}`;

export const getDaysOverdue = (dueDate: string): number => {
  // Interpret `dueDate` as a Manila local date (midnight Asia/Manila).
  // Compute the UTC ms for that Manila midnight, then add 24h + 1min grace.
  const dateOnly = dueDate.split('T')[0];
  const [y, m, d] = dateOnly.split('-').map(Number);
  const dueMidnightManilaUtcMs = Date.UTC(y, m - 1, d) - 8 * 60 * 60 * 1000; // Manila midnight in UTC
  const overdueThresholdUtcMs = dueMidnightManilaUtcMs + 24 * 60 * 60 * 1000 + 60 * 1000; // +24h +1min
  const nowUtcMs = Date.now();
  const msAfterDue = nowUtcMs - overdueThresholdUtcMs;
  if (msAfterDue <= 0) return 0;
  return Math.floor(msAfterDue / (1000 * 60 * 60 * 24));
};

export const isOverdue = (dueDate: string): boolean => {
  if (!dueDate) return false;
  const dateOnly = dueDate.split('T')[0];
  const [y, m, d] = dateOnly.split('-').map(Number);
  const dueMidnightManilaUtcMs = Date.UTC(y, m - 1, d) - 8 * 60 * 60 * 1000; // Manila midnight in UTC
  const overdueThresholdUtcMs = dueMidnightManilaUtcMs + 24 * 60 * 60 * 1000 + 60 * 1000; // +24h +1min
  const nowUtcMs = Date.now();
  return nowUtcMs > overdueThresholdUtcMs;
};
