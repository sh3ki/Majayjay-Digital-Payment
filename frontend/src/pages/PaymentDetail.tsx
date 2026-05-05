import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, Divider,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { ArrowBack, Print, Download, QrCode2 } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { paymentsService } from '../services/payments.service';
import { Payment } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import api from '../services/api';

const PaymentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    paymentsService.getPaymentById(parseInt(id)).then((r) => {
      if (r.data) setPayment(r.data);
    }).catch(() => setError('Failed to load payment')).finally(() => setLoading(false));
  }, [id]);

  const handleGenerateQR = async () => {
    if (!payment) return;
    setQrLoading(true);
    try {
      const res = await paymentsService.generatePaymentQR(payment.id);
      setPaymentQrUrl(res.data?.qrImageDataUrl || null);
      setQrOpen(true);
    } catch {
      setError('Failed to generate QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!payment) return;
    const receipt = payment.receipt as { receiptId?: string; orNumber?: string } | null;
    const receiptRef = receipt?.receiptId || receipt?.orNumber;
    if (!receiptRef) return;
    setDownloading(true);
    try {
      const response = await api.get(`/payments/receipt/${receiptRef}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `OR-${receipt?.orNumber || receiptRef}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={8}><CircularProgress sx={{ color: '#1565C0' }} /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!payment) return null;

  const payer = payment.payer as { firstName?: string; lastName?: string; email?: string };
  const method = payment.method as { methodName?: string };
  const bill = payment.bill as { billNumber?: string };
  const receipt = payment.receipt as { orNumber?: string; issuedAt?: string; orData?: unknown; receiptId?: string } | null;

  return (
    <Box>
      <Box className="page-header">
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>Back</Button>
        <Box display="flex" gap={1}>
          <Button startIcon={<QrCode2 />} onClick={handleGenerateQR} disabled={qrLoading} variant="outlined">
            {qrLoading ? 'Generating...' : 'QR Code'}
          </Button>
          {receipt && (
            <Button startIcon={<Download />} onClick={handleDownloadPDF} disabled={downloading} variant="contained" sx={{ bgcolor: '#1565C0' }}>
              {downloading ? 'Downloading...' : 'Download PDF'}
            </Button>
          )}
          <Button startIcon={<Print />} onClick={() => window.print()} variant="outlined">Print Receipt</Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="h6" fontWeight={700} color="#0D47A1">Payment Details</Typography>
                <StatusBadge status={payment.status} />
              </Box>

              <Box mb={2}>
                <Typography variant="caption" color="text.secondary">Transaction ID</Typography>
                <Typography fontFamily="monospace" fontWeight={600} fontSize={13}>{payment.transactionId}</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Payer</Typography>
                  <Typography fontWeight={600}>{payer?.firstName} {payer?.lastName}</Typography>
                  <Typography variant="body2" color="text.secondary">{payer?.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Bill Number</Typography>
                  <Typography fontFamily="monospace" fontWeight={600}>{bill?.billNumber || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                  <Typography fontWeight={600}>{method?.methodName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Payment Date</Typography>
                  <Typography>{formatDateTime(payment.paymentDate)}</Typography>
                </Grid>
                {payment.referenceNumber && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Reference Number</Typography>
                    <Typography fontFamily="monospace">{payment.referenceNumber}</Typography>
                  </Grid>
                )}
                {payment.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                    <Typography>{payment.notes}</Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={700}>Amount Paid</Typography>
                <Typography variant="h4" fontWeight={700} color="#1565C0">
                  {formatCurrency(parseFloat(String(payment.amount)))}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          {receipt && (
            <Card sx={{ background: '#E3F2FD' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="#0D47A1" mb={2}>Official Receipt</Typography>
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">OR Number</Typography>
                  <Typography fontWeight={700} fontSize={20} fontFamily="monospace" color="#0D47A1">
                    {receipt.orNumber}
                  </Typography>
                </Box>
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">Issued At</Typography>
                  <Typography>{receipt.issuedAt ? formatDateTime(receipt.issuedAt) : 'N/A'}</Typography>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary">
                  This official receipt is valid proof of payment.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Payment QR Code</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Scan to view this payment: <strong>{payment?.transactionId}</strong>
          </Typography>
          {paymentQrUrl ? (
            <img src={paymentQrUrl} alt="Payment QR Code" style={{ maxWidth: 240, width: '100%' }} />
          ) : (
            <QRCodeSVG value={`${window.location.origin}/payments/${payment?.id}`} size={220} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentDetail;
