import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Grid, Divider,
  CircularProgress, Alert, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField,
} from '@mui/material';
import { ArrowBack, QrCode2, Payment, Warning, Cancel, PhoneAndroid, AccountBalance } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { billsService } from '../services/bills.service';
import { paymentsService } from '../services/payments.service';
import { Bill } from '../types';
import { formatCurrency, formatDate, isOverdue } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const BillDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isCashier, isCollector, isResident } = useAuth();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [cashPaymentOpen, setCashPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [onlinePayLoading, setOnlinePayLoading] = useState(false);
  const [mayaAvailable, setMayaAvailable] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await billsService.getBillById(parseInt(id!));
        if (res.data) setBill(res.data);
      } catch {
        setError('Failed to load bill');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleGenerateQR = async () => {
    try {
      const res = await paymentsService.generateQR(parseInt(id!));
      if (res.data) {
        setQrData(res.data.qrImageDataUrl);
        setQrDialogOpen(true);
      }
    } catch {
      setError('Failed to generate QR code');
    }
  };

  const handleCashPayment = async () => {
    if (!bill) return;
    // validate amount: numeric, 0 <= amt <= balanceDue
    setPaymentError('');
    const amt = parseFloat(paymentAmount || '0');
    if (Number.isNaN(amt) || amt < 0) {
      setPaymentError('Invalid payment amount');
      return;
    }
    if (amt > (balanceDue || 0)) {
      setPaymentError('Amount cannot exceed amount due');
      return;
    }

    setPaymentLoading(true);
    try {
      await paymentsService.recordCashPayment({
        billId: bill.id,
        payerId: bill.payerId,
        amount: amt,
      });
      setSuccess('Cash payment recorded successfully');
      setCashPaymentOpen(false);
      const res = await billsService.getBillById(bill.id);
      if (res.data) setBill(res.data);
    } catch {
      setError('Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelBill = async () => {
    if (!bill) return;
    setCancelLoading(true);
    try {
      await billsService.updateBillStatus(bill.id, 'CANCELLED');
      setSuccess('Bill cancelled successfully');
      setCancelOpen(false);
      const res = await billsService.getBillById(bill.id);
      if (res.data) setBill(res.data);
    } catch {
      setError('Failed to cancel bill');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleConfirmBill = async () => {
    if (!bill) return;
    setConfirmLoading(true);
    try {
      await api.put(`/bills/${bill.id}/confirm`);
      setSuccess('Bill confirmed successfully');
      setConfirmOpen(false);
      const res = await billsService.getBillById(bill.id);
      if (res.data) setBill(res.data);
    } catch {
      setError('Failed to confirm bill');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handlePayOnline = async (method: 'gcash' | 'paymaya') => {
    if (!bill) return;
    setOnlinePayLoading(true);
    try {
      const res = await api.post('/paymongo/initiate', { billId: bill.id, method });
      const { checkoutUrl } = res.data.data;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setError('Failed to get checkout URL');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(msg || 'Failed to initiate online payment');
      // If backend reports PayMaya unsupported, disable the Maya button
      if (err?.response?.status === 422 || (msg && String(msg).toLowerCase().includes('paymaya is not supported'))) {
        setMayaAvailable(false);
      }
    } finally {
      setOnlinePayLoading(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#1565C0' }} /></Box>;
  if (error && !bill) return <Alert severity="error">{error}</Alert>;
  if (!bill) return <Alert severity="error">Bill not found</Alert>;

  const subtotal = bill.items?.reduce((s, i) => s + (Number((i as any).amount) || 0), 0) || 0;
  const penalties = bill.currentPenaltyTotal ?? bill.penaltyAmount ?? 0;
  const paymentsTotal = bill.paidAmount ?? (bill.payments?.reduce((s, p) => s + (Number((p as any).amount) || 0), 0) || 0);
  const balanceDue = Math.max(0, subtotal + penalties - paymentsTotal);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/bills')} variant="outlined" size="small">
          Back
        </Button>
        <Typography variant="h5" fontWeight={700} color="#0D47A1">
          Bill Details
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Bill Info */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="h6" fontWeight={700} fontFamily="monospace">{bill.billNumber}</Typography>
                  <StatusBadge status={bill.status} />
                </Box>
                {isCollector && bill.status === 'ISSUED' && (
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button variant="contained" color="success" size="small" onClick={() => setConfirmOpen(true)}>
                      Confirm Bill
                    </Button>
                    <Button variant="outlined" color="error" startIcon={<Cancel />} size="small" onClick={() => setCancelOpen(true)}>
                      Cancel Bill
                    </Button>
                  </Box>
                )}
                {(isAdmin || isCashier) && bill.status !== 'PAID' && bill.status !== 'CANCELLED' && bill.status !== 'ISSUED' && (
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          startIcon={<PhoneAndroid />}
                          size="small"
                          onClick={handleGenerateQR}
                          sx={{ bgcolor: '#00B0F0', '&:hover': { bgcolor: '#0090D0' } }}
                          disabled={onlinePayLoading}
                        >
                          GCASH
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<AccountBalance />}
                          size="small"
                          onClick={handleGenerateQR}
                          sx={{ bgcolor: '#50C878', '&:hover': { bgcolor: '#3CAB60' } }}
                          disabled={onlinePayLoading}
                        >
                          PAYMAYA
                        </Button>
                      </Box>
                      <Button variant="contained" startIcon={<Payment />} size="small" onClick={() => {
                        setPaymentAmount(String(balanceDue || 0));
                        setCashPaymentOpen(true);
                      }}>
                        Record Cash
                      </Button>
                      {/* Admin cancel button intentionally removed from this payment/action block
                       to avoid duplicate Cancel buttons. Admin cancel is rendered below in a
                       single place so it doesn't appear multiple times for the same status. */}
                    </Box>
                )}
                {isResident && bill.status !== 'PAID' && bill.status !== 'CANCELLED' && (
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button variant="contained" startIcon={<PhoneAndroid />} size="small" disabled={onlinePayLoading}
                      onClick={() => handlePayOnline('gcash')}
                      sx={{ bgcolor: '#00B0F0', '&:hover': { bgcolor: '#0090D0' } }}>
                      Pay via GCash
                    </Button>
                    <Button variant="contained" startIcon={<AccountBalance />} size="small" disabled={onlinePayLoading || !mayaAvailable}
                      onClick={() => handlePayOnline('gcash')}
                      sx={{ bgcolor: '#50C878', '&:hover': { bgcolor: '#3CAB60' } }}>
                      {mayaAvailable ? 'Pay via Maya' : 'Maya Unavailable'}
                    </Button>
                  </Box>
                )}
                {isAdmin && bill.status !== 'CANCELLED' && !(isCollector && bill.status === 'ISSUED') && (
                  <Box>
                    <Button variant="outlined" color="error" startIcon={<Cancel />} size="small" onClick={() => setCancelOpen(true)}>
                      Cancel Bill
                    </Button>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Payer */}
              <Typography variant="subtitle2" color="text.secondary" mb={1}>PAYER INFORMATION</Typography>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography fontWeight={500}>{bill.payer?.firstName} {bill.payer?.lastName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography fontWeight={500}>{bill.payer?.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Contact</Typography>
                  <Typography fontWeight={500}>{bill.payer?.contactNumber || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Dates */}
              <Typography variant="subtitle2" color="text.secondary" mb={1}>BILL DATES</Typography>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Bill Date</Typography>
                  <Typography fontWeight={500}>{formatDate(bill.billDate)}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Due Date</Typography>
                  <Typography fontWeight={500} color={isOverdue(bill.dueDate) && bill.status !== 'PAID' ? 'error' : 'inherit'}>
                    {formatDate(bill.dueDate)}
                  </Typography></Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Fee Items */}
              <Typography variant="subtitle2" color="text.secondary" mb={1}>BILL ITEMS</Typography>
              {bill.items?.map((item) => (
                <Box key={item.id} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">{item.feeName}</Typography>
                  <Typography variant="body2" fontWeight={500}>{formatCurrency(item.amount)}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Payment Summary</Typography>

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography fontWeight={500}>{formatCurrency(bill.totalAmount)}</Typography>
              </Box>

              {(bill.penaltyAmount > 0 || (bill.currentPenaltyTotal || 0) > 0) && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography color="error.main">
                    <Warning fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Penalties
                  </Typography>
                  <Typography color="error.main" fontWeight={500}>
                    {formatCurrency(Math.max(bill.penaltyAmount, bill.currentPenaltyTotal || 0))}
                  </Typography>
                </Box>
              )}

              {bill.discountAmount > 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography color="success.main">Discount</Typography>
                  <Typography color="success.main" fontWeight={500}>-{formatCurrency(bill.discountAmount)}</Typography>
                </Box>
              )}

              {bill.paidAmount > 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography color="text.secondary">Amount Paid</Typography>
                  <Typography color="success.main" fontWeight={500}>-{formatCurrency(bill.paidAmount)}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 1.5 }} />

              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6" fontWeight={700}>Balance Due</Typography>
                <Typography variant="h6" fontWeight={700} color={balanceDue > 0 ? 'error.main' : 'success.main'}>
                  {formatCurrency(balanceDue)}
                </Typography>
              </Box>

              {bill.currentPenaltyTotal > 0 && (
                <Alert severity="warning" sx={{ mt: 2, fontSize: 12 }}>
                  ₱{bill.currentPenaltyTotal.toFixed(2)} in penalties apply. Pay now to avoid more charges.
                </Alert>
              )}

              {bill.notes && (
                <Box mt={2} p={1.5} sx={{ background: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{bill.notes}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          {bill.payments && bill.payments.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Payment History</Typography>
                {bill.payments.map((payment) => (
                  <Box key={payment.id} display="flex" justifyContent="space-between" py={1} borderBottom="1px solid #f0f0f0">
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{formatCurrency(parseFloat(String(payment.amount)))}</Typography>
                      <Typography variant="caption" color="text.secondary">{(payment.method as { methodName?: string })?.methodName}</Typography>
                    </Box>
                    <Box textAlign="right" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StatusBadge status={payment.status} />
                      {(bill.status === 'PAID' || bill.status === 'PARTIALLY_PAID') && (
                        <Button size="small" variant="text" onClick={() => navigate(`/payments/${payment.id}`)}>
                          See payment
                        </Button>
                      )}
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* QR Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Payment QR Code</DialogTitle>
        <DialogContent>
          <Box textAlign="center" p={2}>
            {qrData && <img src={qrData} alt="QR Code" style={{ maxWidth: 300, width: '100%' }} />}
            <Typography variant="body2" color="text.secondary" mt={2}>
              Scan this QR code with GCash or Maya to pay
            </Typography>
            <Chip label="Expires in 24 hours" color="warning" size="small" sx={{ mt: 1 }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Cash Payment Dialog */}
      <Dialog open={cashPaymentOpen} onClose={() => setCashPaymentOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Cash Payment</DialogTitle>
        <DialogContent>
          <Box p={1}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Total amount due: <strong>{formatCurrency(balanceDue)}</strong>
            </Typography>
            <TextField
              label="Payment Amount (PHP)"
              type="number"
              fullWidth
              value={paymentAmount}
              onChange={(e) => { setPaymentAmount(e.target.value); setPaymentError(''); }}
              inputProps={{ min: 0, step: 0.01, max: balanceDue }}
              helperText={`Max ${formatCurrency(balanceDue)}`}
              error={!!paymentError}
            />
            {paymentError && <Alert severity="error" sx={{ mt: 1 }}>{paymentError}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCashPaymentOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCashPayment} disabled={paymentLoading || !paymentAmount}>
            {paymentLoading ? <CircularProgress size={20} /> : 'Record Cash Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Bill Confirmation Dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Bill</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel bill <strong>{bill.billNumber}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>No, Keep It</Button>
          <Button variant="contained" color="error" onClick={handleCancelBill} disabled={cancelLoading}>
            {cancelLoading ? <CircularProgress size={20} color="inherit" /> : 'Yes, Cancel Bill'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Bill Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Bill</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to confirm bill <strong>{bill.billNumber}</strong>? This will change the status from ISSUED to UNPAID and the bill will be sent to cashiers and residents.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleConfirmBill} disabled={confirmLoading}>
            {confirmLoading ? <CircularProgress size={20} color="inherit" /> : 'Yes, Confirm Bill'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillDetail;
