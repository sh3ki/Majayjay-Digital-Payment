import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { CheckCircle, AccessTime, Warning, Cancel, HourglassEmpty, PendingActions } from '@mui/icons-material';
import { BillStatus, PaymentStatus } from '../../types';

type Status = BillStatus | PaymentStatus | string;

const STATUS_CONFIG: Record<string, { label: string; color: ChipProps['color']; icon: React.ReactElement }> = {
  PAID: { label: 'Paid', color: 'success', icon: <CheckCircle fontSize="small" /> },
  UNPAID: { label: 'Unpaid', color: 'warning', icon: <AccessTime fontSize="small" /> },
  OVERDUE: { label: 'Overdue', color: 'error', icon: <Warning fontSize="small" /> },
  DRAFT: { label: 'Draft', color: 'default', icon: <PendingActions fontSize="small" /> },
  ISSUED: { label: 'Issued', color: 'info', icon: <HourglassEmpty fontSize="small" /> },
  PARTIALLY_PAID: { label: 'Partial', color: 'warning', icon: <AccessTime fontSize="small" /> },
  CANCELLED: { label: 'Cancelled', color: 'default', icon: <Cancel fontSize="small" /> },
  PENDING: { label: 'Pending', color: 'warning', icon: <HourglassEmpty fontSize="small" /> },
  FAILED: { label: 'Failed', color: 'error', icon: <Cancel fontSize="small" /> },
  REFUNDED: { label: 'Refunded', color: 'default', icon: <CheckCircle fontSize="small" /> },
};

interface Props {
  status: Status;
  size?: 'small' | 'medium';
}

const StatusBadge: React.FC<Props> = ({ status, size = 'small' }) => {
  const config = STATUS_CONFIG[status] || { label: status, color: 'default' as ChipProps['color'], icon: <></> };
  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size={size}
      variant="outlined"
      sx={{ fontWeight: 600, borderRadius: '20px' }}
    />
  );
};

export default StatusBadge;
