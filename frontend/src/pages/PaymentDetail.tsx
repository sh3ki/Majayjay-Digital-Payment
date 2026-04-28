import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, Divider,
  CircularProgress, Alert,
} from '@mui/material';
import { ArrowBack, Print } from '@mui/icons-material';
import { paymentsService } from '../services/payments.service';
import { Payment } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';

const PaymentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    paymentsService.getPaymentById(parseInt(id)).then((r) => {
      if (r.data) setPayment(r.data);
    }).catch(() => setError('Failed to load payment')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box display="flex" justifyContent="center" p={8}><CircularProgress sx={{ color: '#00873E' }} /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!payment) return null;

  const payer = payment.payer as { firstName?: string; lastName?: string; email?: string };
  const method = payment.method as { methodName?: string };
  const bill = payment.bill as { billNumber?: string };
  const receipt = payment.receipt as { orNumber?: string; issuedAt?: string; orData?: unknown } | null;

  return (
    <Box>
      <Box className="page-header">
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>Back</Button>
        <Button startIcon={<Print />} onClick={() => window.print()} variant="outlined">Print Receipt</Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="h6" fontWeight={700} color="#004D2E">Payment Details</Typography>
                <StatusBadge status={payment.status} />
              </Box>

              <Box mb={2}>
                <Typography variant="caption" color="text.secondary">Transaction ID</Typography>
                <Typography fontFamily="monospace" fontWeight={600} fontSize={13}>{payment.transactionId}</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Payer</Typography>
                  <Typography fontWeight={600}>{payer?.firstName} {payer?.lastName}</Typography>
                  <Typography variant="body2" color="text.secondary">{payer?.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Bill Number</Typography>
                  <Typography fontFamily="monospace" fontWeight={600}>{bill?.billNumber || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                  <Typography fontWeight={600}>{method?.methodName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Payment Date</Typography>
                  <Typography>{formatDateTime(payment.paymentDate)}</Typography>
                </Grid>
                {payment.referenceNumber && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Reference Number</Typography>
                    <Typography fontFamily="monospace">{payment.referenceNumber}</Typography>
                  </Grid>
                )}
                {payment.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                    <Typography>{payment.notes}</Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={700}>Amount Paid</Typography>
                <Typography variant="h4" fontWeight={700} color="#00873E">
                  {formatCurrency(parseFloat(String(payment.amount)))}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          {receipt && (
            <Card sx={{ background: '#E8F5E9' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="#004D2E" mb={2}>Official Receipt</Typography>
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">OR Number</Typography>
                  <Typography fontWeight={700} fontSize={20} fontFamily="monospace" color="#004D2E">
                    {receipt.orNumber}
                  </Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">Issued At</Typography>
                  <Typography>{receipt.issuedAt ? formatDateTime(receipt.issuedAt) : 'N/A'}</Typography>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary">
                  This official receipt is valid proof of payment.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentDetail;
