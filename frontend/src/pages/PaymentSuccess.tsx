import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, CircularProgress } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import api from '../services/api';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const billId = params.get('billId');
  const [confirming, setConfirming] = useState(true);
  const [orNumber, setOrNumber] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);

  useEffect(() => {
    if (!billId) { setConfirming(false); return; }
    api.post('/paymongo/confirm', { billId: parseInt(billId) })
      .then((res) => {
        const d = res.data?.data;
        setOrNumber(d?.receipt?.orNumber || d?.orNumber || null);
        setPaymentId(d?.payment?.id || d?.id || null);
      })
      .catch(() => {/* payment may have already been processed by webhook */})
      .finally(() => setConfirming(false));
  }, [billId]);

  if (confirming) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" flexDirection="column" gap={2}>
        <CircularProgress sx={{ color: '#1565C0' }} />
        <Typography color="text.secondary">Confirming your payment...</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Card sx={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <CardContent sx={{ py: 6 }}>
          <CheckCircle sx={{ fontSize: 72, color: '#4CAF50', mb: 2 }} />
          <Typography variant="h4" fontWeight={700} color="#4CAF50" mb={1}>
            Payment Successful!
          </Typography>
          {orNumber && (
            <Typography fontWeight={600} mb={1} color="#1565C0">
              Official Receipt: {orNumber}
            </Typography>
          )}
          <Typography color="text.secondary" mb={4}>
            Your payment has been processed. You will receive a confirmation email with your official receipt shortly.
          </Typography>
          <Box display="flex" gap={2} justifyContent="center">
            {paymentId && (
              <Button variant="outlined" onClick={() => navigate(`/payments/${paymentId}`)}>
                View Receipt
              </Button>
            )}
            {billId && !paymentId && (
              <Button variant="outlined" onClick={() => navigate(`/bills/${billId}`)}>
                View Bill
              </Button>
            )}
            <Button variant="contained" sx={{ bgcolor: '#0D47A1' }} onClick={() => navigate('/payments')}>
              My Payments
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentSuccess;
