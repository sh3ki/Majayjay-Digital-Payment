import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  InputAdornment, CircularProgress, Alert, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip, Skeleton,
} from '@mui/material';
import { Search, Payment, QrCode2, CheckCircle, AccountBalanceWallet } from '@mui/icons-material';
import { billsService } from '../services/bills.service';
import { paymentsService } from '../services/payments.service';
import { Bill } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';

const Cashier: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  // ref to track latest detail fetch to avoid race conditions when switching bills fast
  const detailFetchIdRef = useRef(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [cashPaymentLoading, setCashPaymentLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [modalPaymentAmount, setModalPaymentAmount] = useState('');

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError('');
    // keep selected bill visible; do not clear selection to allow quick workflows
    try {
      const res = await billsService.searchBills(q);
      // Filter out ISSUED and PAID bills for cashier view
      const filtered = res.data?.filter((bill) => bill.status !== 'ISSUED' && bill.status !== 'PAID') || [];
      // fetch full details for each result so preview and payment panel use same computed balance
      const detailed = await Promise.all(filtered.map(async (b) => {
        try {
          const d = await billsService.getBillById(b.id);
          return d.data || b;
        } catch {
          return b;
        }
      }));
      setSearchResults(detailed as Bill[]);
      if (!detailed.length) setSearchError('No bills found for this query');
    } catch (err) {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Debounce: trigger search when typing paused and query has at least 3 chars
  useEffect(() => {
    const q = searchQuery.trim();
    const loadAllBills = async () => {
      setSearching(true);
        try {
        const res = await billsService.getBills({ page: 1, limit: 50 });
        const filtered = (res.data || []).filter((b) => b.status !== 'ISSUED' && b.status !== 'PAID');
        const detailed = await Promise.all(filtered.map(async (b: any) => {
          try {
            const d = await billsService.getBillById(b.id);
            return d.data || b;
          } catch {
            return b;
          }
        }));
        setSearchResults(detailed as Bill[]);
      } catch {
        setSearchError('Failed to load bills');
      } finally {
        setSearching(false);
      }
    };

    if (q.length === 0) {
      loadAllBills();
      return;
    }
    if (q.length < 3) return;
    const timer = setTimeout(() => handleSearch(), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectBill = async (bill: Bill) => {
    // If this bill already has full details (items + payments), reuse it for instant UI
    if (bill.items && bill.payments) {
      setSelectedBill(bill);
      const sub = bill.items?.reduce((s, i) => s + (Number((i as any).amount) || 0), 0) || (bill.totalAmount || 0);
      const pen = (bill as any)?.currentPenaltyTotal ?? bill.penaltyAmount ?? 0;
      const payments = bill.payments?.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) || 0;
      setModalPaymentAmount(String(Math.max(0, sub + pen - payments)));
      return;
    }

    // Optimistic: show basic result immediately and fetch full details
    setSelectedBill(bill);
    const fetchId = ++detailFetchIdRef.current;
    try {
      const res = await billsService.getBillById(bill.id);
      // ignore if a newer fetch was started
      if (fetchId !== detailFetchIdRef.current) return;
      if (res.data) {
        setSelectedBill(res.data);
        const sub = res.data.items?.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0) || (res.data.totalAmount || 0);
        const pen = (res.data as any)?.currentPenaltyTotal ?? res.data.penaltyAmount ?? 0;
        const payments = res.data.payments?.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) || 0;
        setModalPaymentAmount(String(Math.max(0, sub + pen - payments)));
      }
    } catch {
      // keep optimistic selectedBill; surface error
      setErrorMsg('Failed to load bill details');
    }
  };

  const recordCashPayment = async (amountStr: string) => {
    if (!selectedBill) return;
    const amt = parseFloat(amountStr || '0');
    if (Number.isNaN(amt) || amt < 0) {
      setErrorMsg('Invalid payment amount');
      return;
    }
    if (selectedBill && amt > (balanceDue || 0)) {
      setErrorMsg('Amount cannot exceed balance due');
      return;
    }

    setCashPaymentLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await paymentsService.recordCashPayment({
        billId: selectedBill.id,
        payerId: selectedBill.payerId,
        amount: amt,
      });
      setSuccessMsg(`Cash payment of ${formatCurrency(amt)} recorded successfully!`);
      setPaymentModalOpen(false);
      setSelectedBill(null);
      setSearchResults([]);
      setSearchQuery('');
      setModalPaymentAmount('');
    } catch {
      setErrorMsg('Failed to record payment. Please try again.');
    } finally {
      setCashPaymentLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!selectedBill) return;
    setQrLoading(true);
    try {
      const res = await paymentsService.generateQR(selectedBill.id);
      if (res.data) {
        setQrData(res.data.qrImageDataUrl);
        setQrOpen(true);
      }
    } catch {
      setErrorMsg('Failed to generate QR code');
    } finally {
      setQrLoading(false);
    }
  };

  // compute subtotal from items (exclude penalties) and prefer runtime-calculated penalties when available
  const subtotal = selectedBill?.items?.reduce((s, i) => s + (Number((i as any).amount) || 0), 0) ?? (selectedBill?.totalAmount ?? 0);
  const penalties = (selectedBill as any)?.currentPenaltyTotal ?? selectedBill?.penaltyAmount ?? 0;
  const paymentsTotal = selectedBill?.payments?.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) ?? 0;
  const balanceDue = Math.max(0, subtotal + penalties - paymentsTotal);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} color="#0D47A1" mb={1}>Cashier Terminal</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Search for payer bills and record cash payments
      </Typography>

      {successMsg && <Alert severity="success" onClose={() => setSuccessMsg('')} sx={{ mb: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" onClose={() => setErrorMsg('')} sx={{ mb: 2 }}>{errorMsg}</Alert>}

      <Grid container spacing={3}>
        {/* Search Panel */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Search Payer / Bill</Typography>
              <Box>
                <TextField
                  fullWidth
                  placeholder="Search name, email, bill no, fee, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                    endAdornment: searching ? <InputAdornment position="end"><CircularProgress size={18} /></InputAdornment> : undefined,
                  }}
                />
              </Box>

              {searchError && <Alert severity="info" sx={{ mt: 2 }}>{searchError}</Alert>}

              {searchResults.length > 0 && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {searchResults.length} result(s) found
                  </Typography>

                  {searchResults.map((bill) => (
                    <Box
                      key={bill.id}
                      p={2} mb={1}
                      sx={{
                        border: '1px solid #BDBDBD',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { background: '#E3F2FD', borderColor: '#1565C0' },
                        background: selectedBill?.id === bill.id ? '#E3F2FD' : 'white',
                        borderColor: selectedBill?.id === bill.id ? '#1565C0' : '#BDBDBD',
                      }}
                      onClick={() => handleSelectBill(bill)}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1, pr: 2 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {bill.payer?.firstName} {bill.payer?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            {bill.billNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {bill.billDate ? formatDate(bill.billDate) : ''} · Due {bill.dueDate ? formatDate(bill.dueDate) : ''}
                          </Typography>

                          {/* fee preview */}
                          {bill.items && bill.items.length > 0 && (
                            <Box mt={1}>
                              {bill.items.slice(0, 3).map((item) => (
                                <Box key={item.id} sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 1, alignItems: 'center' }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.feeName}</Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap', fontWeight: 500 }}>{formatCurrency(item.amount)}</Typography>
                                </Box>
                              ))}
                              {bill.items.length > 3 && (
                                <Typography variant="caption" color="text.secondary">+{bill.items.length - 3} more</Typography>
                              )}
                            </Box>
                          )}
                        </Box>

                        <Box textAlign="right" sx={{ minWidth: 110 }}>
                          {(() => {
                            const sub = bill.items?.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0) || (bill.totalAmount || 0);
                            const pen = (bill as any)?.currentPenaltyTotal ?? bill.penaltyAmount ?? 0;
                            const payments = bill.payments?.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) ?? 0;
                            const bal = Math.max(0, sub + pen - payments);
                            return (
                              <>
                                <Typography variant="body2" fontWeight={700} color="#F44336">
                                  {formatCurrency(bal)}
                                </Typography>
                                <StatusBadge status={bill.status} size="small" />
                              </>
                            );
                          })()}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Panel */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600} color="#0D47A1">Payment Processing</Typography>
              </Box>

              {selectedBill ? (
                <>
                  <Box sx={{ background: '#E3F2FD', borderRadius: 1, p: 2, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Payer</Typography>
                    <Typography fontWeight={700} fontSize={18}>
                      {selectedBill.payer?.firstName} {selectedBill.payer?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{selectedBill.payer?.email}</Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">Bill Number</Typography>
                    <Typography fontFamily="monospace" fontWeight={600}>{selectedBill.billNumber}</Typography>
                  </Box>

                  <Box display="flex" gap={2} mb={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Bill Date</Typography>
                      <Typography fontWeight={600}>{selectedBill.billDate ? formatDate(selectedBill.billDate) : '-'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Due Date</Typography>
                      <Typography fontWeight={600}>{selectedBill.dueDate ? formatDate(selectedBill.dueDate) : '-'}</Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>Fee Breakdown</Typography>
                    {selectedBill.items?.map((item) => (
                      <Box key={item.id} display="flex" justifyContent="space-between" py={0.5}>
                        <Typography variant="body2">{item.feeName}</Typography>
                        <Typography variant="body2" fontWeight={500}>{formatCurrency(item.amount)}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Subtotal</Typography>
                    <Typography fontWeight={600}>{formatCurrency(subtotal)}</Typography>
                  </Box>

                  {paymentsTotal > 0 && (
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Payments</Typography>
                      <Typography fontWeight={600}>{formatCurrency(paymentsTotal)}</Typography>
                    </Box>
                  )}

                  {penalties > 0 && (
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography color="error.main">Penalties</Typography>
                      <Typography color="error.main" fontWeight={600}>{formatCurrency(penalties)}</Typography>
                    </Box>
                  )}
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" fontWeight={700}>Balance Due</Typography>
                    <Typography variant="h6" fontWeight={700} color="#F44336">{formatCurrency(balanceDue)}</Typography>
                  </Box>

                  <Box display="flex" gap={2}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={cashPaymentLoading ? <CircularProgress size={18} color="inherit" /> : <Payment />}
                      onClick={() => {
                        setModalPaymentAmount(String(balanceDue || 0));
                        setPaymentModalOpen(true);
                      }}
                      disabled={cashPaymentLoading || !selectedBill}
                      size="large"
                    >
                      CASH
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={qrLoading ? <CircularProgress size={18} /> : <AccountBalanceWallet />}
                      size="large"
                      onClick={() => handleGenerateQR()}
                      disabled={qrLoading || !selectedBill}
                    >
                      GCASH
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={qrLoading ? <CircularProgress size={18} /> : <QrCode2 />}
                      size="large"
                      onClick={() => handleGenerateQR()}
                      disabled={qrLoading || !selectedBill}
                    >
                      PAYMAYA
                    </Button>
                  </Box>
                </>
              ) : (
                <Box>
                  <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 1 }} />
                  <Skeleton width="60%" sx={{ mb: 1 }} />
                  <Skeleton width="40%" sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 1 }} />
                  <Skeleton width="30%" />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* QR Dialog */}
      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Payment QR Code</DialogTitle>
        <DialogContent>
          <Box textAlign="center" p={2}>
            {qrData && <img src={qrData} alt="QR Code" style={{ maxWidth: 280, width: '100%' }} />}
            <Typography variant="body2" color="text.secondary" mt={2}>
              Show this QR code to the payer to scan with GCash or Maya
            </Typography>
            <Chip label="Valid for 24 hours" color="warning" size="small" sx={{ mt: 1 }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.print()}>Print QR</Button>
          <Button variant="contained" onClick={() => setQrOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>

      {/* Cash Payment Modal */}
      <Dialog open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Cash Payment</DialogTitle>
        <DialogContent>
          <Box mt={1}>
              <TextField
              label="Payment Amount (PHP)"
              type="number"
              fullWidth
              value={modalPaymentAmount}
              onChange={(e) => setModalPaymentAmount(e.target.value)}
              inputProps={{ min: 0, step: 0.01, max: selectedBill ? balanceDue : undefined }}
              helperText={selectedBill ? `Max ${formatCurrency(balanceDue)}` : ''}
            />
            {errorMsg && <Alert severity="error" sx={{ mt: 1 }}>{errorMsg}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => recordCashPayment(modalPaymentAmount)} disabled={cashPaymentLoading}>
            {cashPaymentLoading ? <CircularProgress size={18} color="inherit" /> : 'Record Cash Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Cashier;
