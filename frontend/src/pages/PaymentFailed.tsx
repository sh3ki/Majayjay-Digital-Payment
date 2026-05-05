import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Cancel } from '@mui/icons-material';

const PaymentFailed: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const billId = params.get('billId');

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Card sx={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <CardContent sx={{ py: 6 }}>
          <Cancel sx={{ fontSize: 72, color: '#F44336', mb: 2 }} />
          <Typography variant="h4" fontWeight={700} color="#F44336" mb={1}>
            Payment Failed
          </Typography>
          <Typography color="text.secondary" mb={4}>
            Your payment was not completed. This may be due to insufficient balance, session timeout, or a cancelled transaction. Please try again.
          </Typography>
          <Box display="flex" gap={2} justifyContent="center">
            {billId && (
              <Button variant="contained" sx={{ bgcolor: '#0D47A1' }} onClick={() => navigate(`/bills/${billId}`)}>
                Try Again
              </Button>
            )}
            <Button variant="outlined" onClick={() => navigate('/bills')}>
              Back to Bills
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentFailed;
