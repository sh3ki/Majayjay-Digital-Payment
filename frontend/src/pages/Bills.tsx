import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, TextField, InputAdornment,
  IconButton, Select, MenuItem, FormControl, InputLabel, Pagination, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, Alert,
} from '@mui/material';
import { Search, Add, Refresh } from '@mui/icons-material';
import { billsService } from '../services/bills.service';
import { Bill } from '../types';
import { formatCurrency, formatShortDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../hooks/useAuth';

const STATUS_OPTIONS = ['', 'DRAFT', 'ISSUED', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OVERDUE'];

const Bills: React.FC = () => {
  const { isAdmin, isCashier, isResident } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await billsService.getBills(params);
      if (res.data) {
        setBills(res.data);
        setTotal(res.meta?.total || 0);
      }
    } catch {
      setError('Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">{isResident ? 'My Bills' : 'Bills'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isResident ? 'View and pay your outstanding bills' : 'Manage and track all payment bills'}
          </Typography>
        </Box>
        {(isAdmin || isCashier) && (
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/bills/create')}>
            Create Bill
          </Button>
        )}
      </Box>

      <Card>
        <CardContent>
          {/* Filters */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <TextField
              placeholder="Search by payer, bill number..."
              value={search}
              onChange={handleSearch}
              size="small"
              sx={{ minWidth: 260 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>{s || 'All Statuses'}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton onClick={load} title="Refresh">
              <Refresh />
            </IconButton>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress sx={{ color: '#1565C0' }} />
            </Box>
          ) : (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Bill No.</TableCell>
                      {!isResident && <TableCell>Payer</TableCell>}
                      <TableCell>Bill Date</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isResident ? 6 : 7} align="center" sx={{ py: 4, color: '#757575' }}>
                          No bills found
                        </TableCell>
                      </TableRow>
                    ) : bills.map((bill) => (
                      <TableRow
                        key={bill.id}
                        hover
                        onClick={() => navigate(`/bills/${bill.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontSize={12}>
                            {bill.billNumber}
                          </Typography>
                        </TableCell>
                        {!isResident && (
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {bill.payer?.firstName} {bill.payer?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {bill.payer?.email}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>{formatShortDate(bill.billDate)}</TableCell>
                        <TableCell>
                          {formatShortDate(bill.dueDate)}
                          {new Date() > new Date(bill.dueDate) && bill.status !== 'PAID' && (
                            <Chip label="Overdue" size="small" color="error" sx={{ ml: 1, fontSize: 10 }} />
                          )}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(bill.totalAmount)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: bill.balanceAmount > 0 ? '#F44336' : '#4CAF50' }}>
                          {formatCurrency(bill.balanceAmount)}
                        </TableCell>
                        <TableCell align="center">
                          <StatusBadge status={bill.status} />
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

              <Typography variant="caption" color="text.secondary" mt={2} display="block">
                Showing {bills.length} of {total} bills
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Bills;
