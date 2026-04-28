import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  InputAdornment, CircularProgress, Alert, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip,
} from '@mui/material';
import { Search, Payment, QrCode2, CheckCircle } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { billsService } from '../services/bills.service';
import { paymentsService } from '../services/payments.service';
import { Bill } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';

const Cashier: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [cashPaymentLoading, setCashPaymentLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    setSelectedBill(null);
    try {
      const res = await billsService.searchBills(searchQuery);
      setSearchResults(res.data || []);
      if (!res.data?.length) setSearchError('No bills found for this query');
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBill = async (bill: Bill) => {
    setSelectedBill(null);
    try {
      const res = await billsService.getBillById(bill.id);
      if (res.data) {
        setSelectedBill(res.data);
        setPaymentAmount(String(res.data.balanceAmount));
      }
    } catch {
      setErrorMsg('Failed to load bill details');
    }
  };

  const handleCashPayment = async () => {
    if (!selectedBill) return;
    setCashPaymentLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await paymentsService.recordCashPayment({
        billId: selectedBill.id,
        payerId: selectedBill.payerId,
        amount: parseFloat(paymentAmount),
      });
      setSuccessMsg(`Cash payment of ${formatCurrency(parseFloat(paymentAmount))} recorded successfully!`);
      setSelectedBill(null);
      setSearchResults([]);
      setSearchQuery('');
      setPaymentAmount('');
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

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} color="#004D2E" mb={1}>Cashier Terminal</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Search for payer bills and record cash payments
      </Typography>

      {successMsg && <Alert severity="success" onClose={() => setSuccessMsg('')} sx={{ mb: 2 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" onClose={() => setErrorMsg('')} sx={{ mb: 2 }}>{errorMsg}</Alert>}

      <Grid container spacing={3}>
        {/* Search Panel */}
        <Grid item xs={12} md={selectedBill ? 5 : 12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="#004D2E" mb={2}>Search Payer / Bill</Typography>
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  placeholder="Name, bill number, email, contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                  }}
                />
                <Button variant="contained" onClick={handleSearch} disabled={searching} sx={{ minWidth: 100 }}>
                  {searching ? <CircularProgress size={20} color="inherit" /> : 'Search'}
                </Button>
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
                        '&:hover': { background: '#E8F5E9', borderColor: '#00873E' },
                        background: selectedBill?.id === bill.id ? '#E8F5E9' : 'white',
                        borderColor: selectedBill?.id === bill.id ? '#00873E' : '#BDBDBD',
                      }}
                      onClick={() => handleSelectBill(bill)}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {bill.payer?.firstName} {bill.payer?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            {bill.billNumber}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body2" fontWeight={700} color="#F44336">
                            {formatCurrency(bill.balanceAmount)}
                          </Typography>
                          <StatusBadge status={bill.status} size="small" />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Bill & Payment Panel */}
        {selectedBill && (
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} color="#004D2E" mb={2}>Payment Processing</Typography>

                <Box sx={{ background: '#E8F5E9', borderRadius: 1, p: 2, mb: 2 }}>
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
                  <Typography fontWeight={600}>{formatCurrency(selectedBill.totalAmount)}</Typography>
                </Box>
                {selectedBill.penaltyAmount > 0 && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography color="error.main">Penalties</Typography>
                    <Typography color="error.main" fontWeight={600}>{formatCurrency(selectedBill.penaltyAmount)}</Typography>
                  </Box>
                )}
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" fontWeight={700}>Balance Due</Typography>
                  <Typography variant="h6" fontWeight={700} color="#F44336">{formatCurrency(selectedBill.balanceAmount)}</Typography>
                </Box>

                <TextField
                  label="Payment Amount (PHP)"
                  type="number"
                  fullWidth
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  inputProps={{ min: 0, step: 0.01, max: selectedBill.balanceAmount }}
                  sx={{ mb: 2 }}
                />

                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={cashPaymentLoading ? <CircularProgress size={18} color="inherit" /> : <Payment />}
                    onClick={handleCashPayment}
                    disabled={cashPaymentLoading || !paymentAmount}
                    size="large"
                  >
                    Record Cash Payment
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={qrLoading ? <CircularProgress size={18} /> : <QrCode2 />}
                    onClick={handleGenerateQR}
                    disabled={qrLoading}
                    size="large"
                  >
                    Generate QR
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
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
    </Box>
  );
};

export default Cashier;
