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

export const fullName = (firstName: string, lastName: string): string => `${firstName} ${lastName}`;

export const getDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const now = new Date();
  if (now <= due) return 0;
  return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
};

export const isOverdue = (dueDate: string): boolean => new Date() > new Date(dueDate);
