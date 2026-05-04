import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Pagination, Table,
  TableHead, TableBody, TableRow, TableCell, CircularProgress, Alert,
  IconButton,
} from '@mui/material';
import { Search, Visibility, Refresh } from '@mui/icons-material';
import { paymentsService } from '../services/payments.service';
import { Payment } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';

const Payments: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (status) params.status = status;
      const res = await paymentsService.getPayments(params);
      if (res.data) {
        setPayments(res.data);
        setTotal(res.meta?.total || 0);
      }
    } catch {
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">Payments</Typography>
          <Typography variant="body2" color="text.secondary">View all payment transactions</Typography>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={load}><Refresh /></IconButton>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#1565C0' }} /></Box>
          ) : (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Transaction ID</TableCell>
                      <TableCell>Payer</TableCell>
                      <TableCell>Bill No.</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">OR #</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#757575' }}>
                          No payments found
                        </TableCell>
                      </TableRow>
                    ) : payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{p.transactionId}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {(p.payer as { firstName?: string; lastName?: string })?.firstName} {(p.payer as { firstName?: string; lastName?: string })?.lastName}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{(p.bill as { billNumber?: string })?.billNumber || 'N/A'}</TableCell>
                        <TableCell>{(p.method as { methodName?: string })?.methodName}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#1565C0' }}>
                          {formatCurrency(parseFloat(String(p.amount)))}
                        </TableCell>
                        <TableCell align="center"><StatusBadge status={p.status} /></TableCell>
                        <TableCell sx={{ fontSize: 12, color: '#757575' }}>{formatDateTime(p.paymentDate)}</TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {(p.receipt as { orNumber?: string })?.orNumber || '-'}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => navigate(`/payments/${p.id}`)} title="View">
                            <Visibility fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              {total > 20 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination count={Math.ceil(total / 20)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Payments;
