import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Table, TableHead, TableBody,
  TableRow, TableCell, CircularProgress, Alert, Chip, Pagination,
  TextField, Select, MenuItem, FormControl, InputLabel, InputAdornment,
  IconButton, Tooltip, Grid,
} from '@mui/material';
import { Search, Refresh, Visibility } from '@mui/icons-material';
import { paymentsService } from '../../services/payments.service';
import { Payment } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';

const PAGE_SIZE = 25;

const Ledger: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (status) params.status = status;
      if (method) params.paymentMethod = method;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await paymentsService.getPayments(params);
      if (res.data) {
        setPayments(res.data);
        setTotal(res.meta?.total || res.data.length);
        // Calculate total revenue from current page (server should provide summary)
        const rev = res.data.reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);
        setTotalRevenue(rev);
      }
    } catch {
      setError('Failed to load ledger entries');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, method, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const clearFilters = () => { setSearch(''); setStatus(''); setMethod(''); setStartDate(''); setEndDate(''); setPage(1); };
  const hasFilters = search || status || method || startDate || endDate;

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">Transaction Ledger</Typography>
          <Typography variant="body2" color="text.secondary">Complete payment transaction history · {total} records</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Summary stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Total Records</Typography>
              <Typography variant="h5" fontWeight={700} color="#0D47A1">{total.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Page Revenue</Typography>
              <Typography variant="h5" fontWeight={700} color="#2E7D32">{formatCurrency(totalRevenue)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Showing Page</Typography>
              <Typography variant="h5" fontWeight={700}>{page} / {Math.ceil(total / PAGE_SIZE) || 1}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          {/* Filters */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
            <TextField
              size="small" placeholder="Search transaction ID, payer, bill no…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} sx={{ flex: 1, minWidth: 240 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value as string); setPage(1); }}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Method</InputLabel>
              <Select value={method} label="Method" onChange={(e) => { setMethod(e.target.value as string); setPage(1); }}>
                <MenuItem value="">All Methods</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="GCash">GCash</MenuItem>
                <MenuItem value="Maya">Maya</MenuItem>
                <MenuItem value="Online Banking">Online Banking</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" label="From" type="date" value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }} InputLabelProps={{ shrink: true }} sx={{ width: 155 }} />
            <TextField size="small" label="To" type="date" value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }} InputLabelProps={{ shrink: true }} sx={{ width: 155 }} />
            {hasFilters && (
              <Chip label="Clear" size="small" onDelete={clearFilters} />
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
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Transaction ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>OR Number</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Payer</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Bill No.</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Payment Method</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Cashier</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>View</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} align="center" sx={{ py: 5, color: '#9E9E9E' }}>
                          No transactions found{hasFilters ? ' matching filters' : ''}
                        </TableCell>
                      </TableRow>
                    ) : payments.map((p, idx) => (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ color: '#9E9E9E', fontSize: 11 }}>{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{p.transactionId}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {(p.receipt as { orNumber?: string })?.orNumber || '—'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {(p.payer as { firstName?: string; lastName?: string })?.firstName} {(p.payer as { firstName?: string; lastName?: string })?.lastName}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {(p.bill as { billNumber?: string })?.billNumber || '—'}
                        </TableCell>
                        <TableCell>
                          <Chip label={(p.method as { methodName?: string })?.methodName || '—'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#2E7D32', fontSize: 14 }}>
                          {formatCurrency(parseFloat(String(p.amount)))}
                        </TableCell>
                        <TableCell align="center"><StatusBadge status={p.status} /></TableCell>
                        <TableCell sx={{ fontSize: 11, color: '#757575', whiteSpace: 'nowrap' }}>
                          {formatDateTime(p.paymentDate)}
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>
                          {(p as { cashier?: { firstName?: string; lastName?: string } }).cashier
                            ? `${(p as { cashier?: { firstName?: string; lastName?: string } }).cashier?.firstName} ${(p as { cashier?: { firstName?: string; lastName?: string } }).cashier?.lastName}`
                            : '—'}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View payment">
                            <IconButton size="small" onClick={() => navigate(`/payments/${p.id}`)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

export default Ledger;
