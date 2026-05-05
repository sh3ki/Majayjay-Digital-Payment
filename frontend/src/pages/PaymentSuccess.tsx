import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const billId = params.get('billId');

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Card sx={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <CardContent sx={{ py: 6 }}>
          <CheckCircle sx={{ fontSize: 72, color: '#4CAF50', mb: 2 }} />
          <Typography variant="h4" fontWeight={700} color="#4CAF50" mb={1}>
            Payment Successful!
          </Typography>
          <Typography color="text.secondary" mb={4}>
            Your payment has been processed. You will receive a confirmation email with your official receipt shortly.
          </Typography>
          <Box display="flex" gap={2} justifyContent="center">
            {billId && (
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
