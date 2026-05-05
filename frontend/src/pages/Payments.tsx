import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Pagination, Table,
  TableHead, TableBody, TableRow, TableCell, CircularProgress, Alert,
  IconButton, Tooltip, Chip,
} from '@mui/material';
import { Search, Refresh, FilterList } from '@mui/icons-material';
import { paymentsService } from '../services/payments.service';
import { Payment } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../hooks/useAuth';

const PAGE_SIZE = 20;

const Payments: React.FC = () => {
  const navigate = useNavigate();
  const { isResident } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (status) params.status = status;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await paymentsService.getPayments(params);
      if (res.data) {
        setPayments(res.data);
        setTotal(res.meta?.total || res.data.length);
      }
    } catch {
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page, status, search, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const handleFilter = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
    setter(e.target.value as string);
    setPage(1);
  };

  const clearFilters = () => { setSearch(''); setStatus(''); setStartDate(''); setEndDate(''); setPage(1); };
  const hasFilters = search || status || startDate || endDate;

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">{isResident ? 'My Payments' : 'Payments'}</Typography>
          <Typography variant="body2" color="text.secondary">{isResident ? `Your payment history · ${total} total` : `View all payment transactions · ${total} total`}</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <CardContent>
          {/* Filters */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
            <TextField
              size="small"
              placeholder={isResident ? 'Search by transaction ID or OR number…' : 'Search by payer name or transaction ID…'} value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              sx={{ flex: 1, minWidth: 240 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value as string); setPage(1); }}>
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" label="From" type="date" value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }} InputLabelProps={{ shrink: true }} sx={{ width: 155 }} />
            <TextField size="small" label="To" type="date" value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }} InputLabelProps={{ shrink: true }} sx={{ width: 155 }} />
            {hasFilters && (
              <Chip label="Clear filters" size="small" onDelete={clearFilters} color="default" />
            )}
            <Tooltip title="Refresh"><IconButton onClick={load} size="small"><Refresh /></IconButton></Tooltip>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#1565C0' }} /></Box>
          ) : (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F5F7FA' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Transaction ID</TableCell>
                      {!isResident && <TableCell sx={{ fontWeight: 700 }}>Payer</TableCell>}
                      <TableCell sx={{ fontWeight: 700 }}>Bill No.</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>OR #</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isResident ? 8 : 9} align="center" sx={{ py: 5, color: '#9E9E9E' }}>
                          No payments found{hasFilters ? ' matching your filters' : ''}
                        </TableCell>
                      </TableRow>
                    ) : payments.map((p) => (
                      <TableRow
                        key={p.id}
                        hover
                        onClick={() => navigate(`/payments/${p.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{p.transactionId}</TableCell>
                        {!isResident && (
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {(p.payer as { firstName?: string; lastName?: string })?.firstName} {(p.payer as { firstName?: string; lastName?: string })?.lastName}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{(p.bill as { billNumber?: string })?.billNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip label={(p.method as { methodName?: string })?.methodName || '—'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#1565C0' }}>
                          {formatCurrency(parseFloat(String(p.amount)))}
                        </TableCell>
                        <TableCell align="center"><StatusBadge status={p.status} /></TableCell>
                        <TableCell sx={{ fontSize: 12, color: '#757575', whiteSpace: 'nowrap' }}>{formatDateTime(p.paymentDate)}</TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {(p.receipt as { orNumber?: string })?.orNumber || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              {total > PAGE_SIZE && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                  </Typography>
                  <Pagination count={Math.ceil(total / PAGE_SIZE)} page={page} onChange={(_, p) => setPage(p)} color="primary" size="small" />
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
