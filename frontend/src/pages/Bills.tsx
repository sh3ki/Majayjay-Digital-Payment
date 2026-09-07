import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, TextField, InputAdornment,
  IconButton, Select, MenuItem, FormControl, InputLabel, Pagination, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, TableSortLabel,
} from '@mui/material';
import { Search, Add, Refresh } from '@mui/icons-material';
import { billsService } from '../services/bills.service';
import { Bill } from '../types';
import { formatCurrency, formatShortDate, isOverdue } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../hooks/useAuth';





const STATUS_OPTIONS_ALL = ['', 'ISSUED', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OVERDUE'];
const STATUS_OPTIONS_CASHIER_RESIDENT = ['', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OVERDUE'];

const Bills: React.FC = () => {
  const { isAdmin, isCashier, isCollector, isResident } = useAuth();
  const navigate = useNavigate();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [issuedBills, setIssuedBills] = useState<Bill[]>([]);
  const [issuedLoading, setIssuedLoading] = useState(false);
  const [issuedError, setIssuedError] = useState('');
  const [confirmLoadingMap, setConfirmLoadingMap] = useState<Record<number, boolean>>({});
  const [cancelLoadingMap, setCancelLoadingMap] = useState<Record<number, boolean>>({});
  const [bills, setBills] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [item, setItem] = useState('');
  const [itemOptions, setItemOptions] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'billDate', direction: 'desc' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine which status options to show
  const statusOptions = isResident ? STATUS_OPTIONS_ALL : isCashier ? STATUS_OPTIONS_CASHIER_RESIDENT : STATUS_OPTIONS_ALL;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Residents always see their complete bill list on entry. Search and
      // filters are optional refinements; staff search behavior is unchanged.
      if (!isResident && (!hasSearched || !debouncedSearch)) { setBills([]); setTotal(0); setLoading(false); return; }
      const params: Record<string, string | number> = { page, limit: 20 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;
      if (item) params.item = item;
      const res = await billsService.getBills(params);
      if (res.data) {
        // Filter out ISSUED bills for cashiers and residents
        const filtered = isCashier
          ? res.data.filter((bill) => bill.status !== 'ISSUED')
          : res.data;
        setBills(filtered);
        setTotal(res.meta?.total || 0);
      }
    } catch {
      setError('Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, item, hasSearched, isCashier, isResident]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const value = search.trim();
      setDebouncedSearch(value);
      setHasSearched(Boolean(value));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    billsService.getBillSummary({ search: search.trim(), item })
      .then((res) => { if (res.data) { setCounts(res.data.counts); setItemOptions(res.data.items); } })
      .catch(() => { /* bill list reports the actionable error */ });
  }, [search, item, isCashier, isResident]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };
  const resetFilters = () => {
    setSearch('');
    setItem('');
    setStatus('');
    setPage(1);
    setHasSearched(false);
    setError('');
  };
  const sortBills = (key: string) => {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
  };
  const sortedBills = [...bills].sort((a, b) => {
    const keyForSort = sort.key;
    const value = (bill: Bill): string | number => keyForSort === 'items' ? (bill.items || []).map((i) => i.feeName).join(', ').toLowerCase() : keyForSort === 'total' ? Number(bill.totalAmount) : keyForSort === 'balance' ? Number(bill.balanceAmount) : keyForSort === 'status' ? bill.status : new Date((bill as unknown as Record<string, string>)[keyForSort]).getTime();
    const av = value(a), bv = value(b);
    const result = av < bv ? -1 : av > bv ? 1 : 0;
    return sort.direction === 'asc' ? result : -result;
  });

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">{isResident ? 'My Bills' : 'Bills'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isResident ? 'View and pay your outstanding bills' : 'Manage and track all payment bills'}
          </Typography>
        </Box>
        <Box>
          {(isAdmin || isCollector) && (
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/bills/create')} sx={{ mr: isCollector ? 1 : 0 }}>
              Create Bill
            </Button>
          )}
          {isCollector && (
            <Button variant="outlined" onClick={async () => {
              setConfirmModalOpen(true);
              // fetch issued bills
              setIssuedLoading(true);
              setIssuedError('');
              try {
                const res = await billsService.getBills({ page: 1, limit: 100, status: 'ISSUED' });
                setIssuedBills(res.data || []);
              } catch (err) {
                setIssuedError('Failed to load issued bills');
              } finally {
                setIssuedLoading(false);
              }
            }}>
              Confirm Bills
            </Button>
          )}
        </Box>
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
              sx={{ flex: '1 1 420px', minWidth: { xs: '100%', sm: 320 }, width: { xs: '100%', sm: 'auto' } }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
              }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 }, width: { xs: '100%', sm: 'auto' } }}>
              <InputLabel>Item</InputLabel>
              <Select value={item} label="Item" onChange={(e) => { setItem(e.target.value); setHasSearched(true); setPage(1); }}>
                <MenuItem value="">All Items</MenuItem>
                {itemOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 }, width: { xs: '100%', sm: 'auto' } }}>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setHasSearched(true); setPage(1); }}>
                {statusOptions.map((s) => (
                  <MenuItem key={s} value={s}>{s || 'All Statuses'}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<Refresh />} onClick={resetFilters} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Reset Filters
            </Button>
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
            <Chip label={`Paid: ${counts.PAID || 0}`} color="success" variant={status === 'PAID' ? 'filled' : 'outlined'} onClick={() => { setStatus('PAID'); setHasSearched(true); }} />
            <Chip label={`Unpaid: ${counts.UNPAID || 0}`} color="warning" variant={status === 'UNPAID' ? 'filled' : 'outlined'} onClick={() => { setStatus('UNPAID'); setHasSearched(true); }} />
            <Chip label={`Partially paid: ${counts.PARTIALLY_PAID || 0}`} color="info" variant={status === 'PARTIALLY_PAID' ? 'filled' : 'outlined'} onClick={() => { setStatus('PARTIALLY_PAID'); setHasSearched(true); }} />
            <Chip label={`Overdue: ${counts.OVERDUE || 0}`} color="error" variant={status === 'OVERDUE' ? 'filled' : 'outlined'} onClick={() => { setStatus('OVERDUE'); setHasSearched(true); }} />
            <Chip label={`Issued: ${counts.ISSUED || 0}`} variant={status === 'ISSUED' ? 'filled' : 'outlined'} onClick={() => { setStatus('ISSUED'); setHasSearched(true); }} />
            <Chip label={`Cancelled: ${counts.CANCELLED || 0}`} variant={status === 'CANCELLED' ? 'filled' : 'outlined'} onClick={() => { setStatus('CANCELLED'); setHasSearched(true); }} />
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress sx={{ color: '#1565C0' }} />
            </Box>
          ) : !isResident && (!hasSearched || !search.trim()) ? (
            <Box py={6} textAlign="center"><Typography color="text.secondary">Search for a bill to view results.</Typography></Box>
          ) : (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Bill No.</TableCell>
                      {!isResident && <TableCell>Payer</TableCell>}
                      {(['items', 'billDate', 'dueDate', 'total', 'balance', 'status'] as const).map((key) => (
                        <TableCell key={key} align={key === 'total' || key === 'balance' ? 'right' : key === 'status' ? 'center' : 'left'}>
                          <TableSortLabel active={sort.key === key} direction={sort.key === key ? sort.direction : 'asc'} onClick={() => sortBills(key)}>
                            {key === 'billDate' ? 'Bill Date' : key === 'dueDate' ? 'Due Date' : key === 'total' ? 'Total' : key === 'balance' ? 'Balance' : key[0].toUpperCase() + key.slice(1)}
                          </TableSortLabel>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isResident ? 7 : 8} align="center" sx={{ py: 4, color: '#757575' }}>
                          No bills found
                        </TableCell>
                      </TableRow>
                    ) : sortedBills.map((bill) => (
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
                        <TableCell sx={{ minWidth: 220 }}>
                          {bill.items && bill.items.length > 0 ? (
                            bill.items.map((it) => (
                              <Box key={it.id} display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                <Typography variant="body2">{it.feeName}</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatCurrency(it.amount)}</Typography>
                              </Box>
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">No items</Typography>
                          )}
                        </TableCell>
                        <TableCell>{formatShortDate(bill.billDate)}</TableCell>
                        <TableCell>
                          {formatShortDate(bill.dueDate)}
                          {isOverdue(bill.dueDate) && bill.status !== 'PAID' && (
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
      {/* Confirm Bills Modal for Collector */}
      <Dialog open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Confirm Issued Bills</DialogTitle>
        <DialogContent>
          {issuedError && <Alert severity="error" sx={{ mb: 2 }}>{issuedError}</Alert>}
          {issuedLoading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Bill No.</TableCell>
                    <TableCell>Payer</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Bill Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {issuedBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#757575' }}>
                        No issued bills found
                      </TableCell>
                    </TableRow>
                  ) : issuedBills.map((b) => (
                    <TableRow key={b.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontSize={12}>{b.billNumber}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{b.payer?.firstName} {b.payer?.lastName}</Typography>
                        <Typography variant="caption" color="text.secondary">{b.payer?.email}</Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        {b.items && b.items.length > 0 ? (
                          b.items.map((it) => (
                            <Box key={it.id} display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
                              <Typography variant="body2">{it.feeName}</Typography>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatCurrency(it.amount)}</Typography>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="caption" color="text.secondary">No items</Typography>
                        )}
                      </TableCell>
                      <TableCell>{formatShortDate(b.billDate)}</TableCell>
                      <TableCell>{formatShortDate(b.dueDate)}</TableCell>
                      <TableCell align="right">{formatCurrency(b.totalAmount)}</TableCell>
                      <TableCell align="right">{formatCurrency(b.balanceAmount)}</TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Tooltip title="Confirm this bill (ISSUED → UNPAID)">
                            <span>
                              <Button variant="contained" color="success" size="small" disabled={!!confirmLoadingMap[b.id]}
                                onClick={async (e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  setConfirmLoadingMap((m) => ({ ...m, [b.id]: true }));
                                  try {
                                    await billsService.confirmBill(b.id);
                                    // remove from list
                                    setIssuedBills((prev) => prev.filter((x) => x.id !== b.id));
                                    // refresh main list
                                    load();
                                  } catch (err) {
                                    // set a local error on issuedError
                                    setIssuedError('Failed to confirm bill');
                                  } finally {
                                    setConfirmLoadingMap((m) => ({ ...m, [b.id]: false }));
                                  }
                                }}
                              >
                                {confirmLoadingMap[b.id] ? <CircularProgress size={18} color="inherit" /> : 'Confirm'}
                              </Button>
                            </span>
                          </Tooltip>

                          <Tooltip title="Cancel this bill (mark as CANCELLED)">
                            <span>
                              <Button variant="outlined" color="error" size="small" disabled={!!cancelLoadingMap[b.id]}
                                onClick={async (e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  setCancelLoadingMap((m) => ({ ...m, [b.id]: true }));
                                  try {
                                    await billsService.updateBillStatus(b.id, 'CANCELLED');
                                    // remove from list
                                    setIssuedBills((prev) => prev.filter((x) => x.id !== b.id));
                                    // refresh main list
                                    load();
                                  } catch (err) {
                                    setIssuedError('Failed to cancel bill');
                                  } finally {
                                    setCancelLoadingMap((m) => ({ ...m, [b.id]: false }));
                                  }
                                }}
                              >
                                {cancelLoadingMap[b.id] ? <CircularProgress size={18} color="inherit" /> : 'Cancel'}
                              </Button>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Bills;
