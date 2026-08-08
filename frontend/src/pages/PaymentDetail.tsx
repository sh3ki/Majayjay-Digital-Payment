import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Button,
  CircularProgress, Alert,
} from '@mui/material';
import { ArrowBack, Print, Download } from '@mui/icons-material';
import { paymentsService } from '../services/payments.service';
import { Payment } from '../types';
import { formatCurrency, formatDateTime, formatDate, formatTime } from '../utils/formatters';
import api from '../services/api';

const PaymentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    paymentsService.getPaymentById(parseInt(id)).then((r) => {
      if (r.data) setPayment(r.data);
    }).catch(() => setError('Failed to load payment')).finally(() => setLoading(false));
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!payment) return;
    const receipt = payment.receipt as { receiptId?: string; orNumber?: string } | null;
    const receiptRef = receipt?.receiptId || receipt?.orNumber;
    if (!receiptRef) return;
    setDownloading(true);
    try {
      // Try to generate PDF client-side from the receipt DOM so it matches the on-screen layout exactly.
      // Uses dynamic imports so this will fall back to server PDF if the libs are not installed.
      const el = document.getElementById('receipt-wrapper');
      if (!el) throw new Error('Receipt element not found');

      try {
        // Indirect dynamic import using new Function to avoid Vite's static import analysis
        const dynamicImport = (p: string) => new Function(`return import('${p}')`)() as Promise<any>;
        const html2canvasModule = await dynamicImport('html2canvas');
        const html2canvas = html2canvasModule.default || html2canvasModule;
        const jspdfModule = await dynamicImport('jspdf');
        const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;

        // Clone receipt and render at A4 width to match print layout exactly
        const mmToPx = (mm: number) => mm * (96 / 25.4);
        const a4WidthMm = 210;
        const a4HeightMm = 297;
        const a4WidthPx = Math.round(mmToPx(a4WidthMm));

        const clone = el.cloneNode(true) as HTMLElement;
        // apply styles to match A4 print layout
        clone.style.boxShadow = 'none';
        clone.style.background = 'white';
        clone.style.width = `${a4WidthPx}px`;
        clone.style.maxWidth = 'none';
        // create offscreen container
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = `${a4WidthPx}px`;
        container.appendChild(clone);
        document.body.appendChild(container);

        try {
          // Ensure fonts and images are ready, and inline computed styles to match on-screen rendering
          await (document as any).fonts?.ready;

          const inlineStyles = (root: HTMLElement) => {
            const nodes = Array.from(root.querySelectorAll('*')) as HTMLElement[];
            nodes.unshift(root);
            nodes.forEach((node) => {
              try {
                const cs = window.getComputedStyle(node);
                let cssText = '';
                for (let i = 0; i < cs.length; i++) {
                  const prop = cs[i];
                  const val = cs.getPropertyValue(prop);
                  cssText += `${prop}:${val};`;
                }
                node.style.cssText = cssText;
              } catch (e) {
                // ignore
              }
            });
          };

          const waitForImages = (root: HTMLElement) => {
            const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
            return Promise.all(imgs.map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise<void>((res) => { img.onload = img.onerror = () => res(); });
            }));
          };

          inlineStyles(clone);
          await waitForImages(clone);

          const scale = 3; // higher DPI for better fidelity
          const canvas = await html2canvas(clone, { scale, backgroundColor: '#ffffff', useCORS: true });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = a4WidthMm; // mm

          // calculate dimensions
          const pxPerMm = canvas.width / pdfWidth;
          const totalPdfHeightMm = canvas.height / pxPerMm;

          if (totalPdfHeightMm <= a4HeightMm) {
            // single page
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, totalPdfHeightMm);
          } else {
            // multi-page handling: slice canvas
            const pageHeightPx = Math.floor(pxPerMm * a4HeightMm);
            let remainingHeightPx = canvas.height;
            let position = 0;
            while (remainingHeightPx > 0) {
              const tmpCanvas = document.createElement('canvas');
              tmpCanvas.width = canvas.width;
              const sliceHeight = Math.min(pageHeightPx, remainingHeightPx);
              tmpCanvas.height = sliceHeight;
              const ctx = tmpCanvas.getContext('2d') as CanvasRenderingContext2D;
              ctx.drawImage(canvas, 0, position, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
              const sliceData = tmpCanvas.toDataURL('image/png');
              const sliceHeightMm = sliceHeight / pxPerMm;
              pdf.addImage(sliceData, 'PNG', 0, 0, pdfWidth, sliceHeightMm);
              remainingHeightPx -= sliceHeight;
              position += sliceHeight;
              if (remainingHeightPx > 0) pdf.addPage();
            }
          }

          const fileName = `${payment.transactionId || receipt?.orNumber || receiptRef}`;
          pdf.save(`${fileName}.pdf`);
          setDownloading(false);
          return;
        } finally {
          // cleanup
          document.body.removeChild(container);
        }
      } catch (err) {
        // If client-side libs are missing or generation failed, fall back to server-provided PDF
        console.warn('Client-side PDF generation failed, falling back to server PDF', err);
      }

      // Fallback: download server-generated PDF
      const response = await api.get(`/payments/receipt/${receiptRef}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const fallbackFileName = `${payment.transactionId || receipt?.orNumber || receiptRef}.pdf`;
      link.download = fallbackFileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (ex) {
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
  const receipt = payment.receipt as { orNumber?: string; issuedAt?: string; orData?: any; receiptId?: string; createdAt?: string } | null;

  // build items list: prefer bill items (to get feeName/description/category), fallback to OR data items
  const items: Array<any> = [];
  if ((payment.bill as any)?.items && (payment.bill as any).items.length) {
    (payment.bill as any).items.forEach((it: any) => {
      items.push({
        feeName: it.feeName || (it.fee && it.fee.feeName) || '',
        description: (it.fee && it.fee.description) || it.description || '',
        category: (it.fee && it.fee.category && it.fee.category.categoryName) || it.categoryName || '',
        amount: it.amount,
      });
    });
  } else if (receipt?.orData?.items && receipt.orData.items.length) {
    receipt.orData.items.forEach((it: any) => items.push({ feeName: it.feeName || it.description || '', description: it.description || '', category: it.category || '', amount: it.amount }));
  } else {
    items.push({ description: payment.notes || 'Payment', amount: payment.amount });
  }

  // include penalties if present in OR data or bill
  const penaltiesAmount = receipt?.orData?.penalties ? Number(receipt.orData.penalties) : ( (payment.bill as any)?.currentPenaltyTotal ?? (payment.bill as any)?.penaltyAmount ?? 0 );
  if (penaltiesAmount && Number(penaltiesAmount) > 0) {
    items.push({ feeName: 'Penalties', description: '', category: '', amount: Number(penaltiesAmount) });
  }

  return (
    <Box>
      <Box className="page-header no-print" display="flex" justifyContent="space-between" alignItems="center">
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>Back</Button>
        <Box display="flex" gap={1}>
          {receipt && (
            <Button startIcon={<Download />} onClick={handleDownloadPDF} disabled={downloading} variant="contained" sx={{ bgcolor: '#1565C0' }}>
              {downloading ? 'Downloading...' : 'Download PDF'}
            </Button>
          )}
          <Button startIcon={<Print />} onClick={() => window.print()} variant="outlined">Print Receipt</Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
          <Box id="receipt-wrapper" sx={{ maxWidth: 720, mx: 'auto', border: '1px solid #000', p: 2, bgcolor: '#fff' }}>
            <Box sx={{ borderBottom: '1px solid #000', pb: 1, mb: 1 }}>
              <Typography align="center" fontWeight={800} fontSize={24}>OFFICIAL RECEIPT</Typography>
              <Typography align="center" fontWeight={700} fontSize={12}>REPUBLIC OF THE PHILIPPINES</Typography>
              <Typography align="center" fontWeight={700} fontSize={12}>OFFICE OF THE TREASURER</Typography>
              <Typography align="center" fontWeight={700} fontSize={12}>PROVINCE OF LAGUNA</Typography>
            </Box>

            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={8}>
                <Box sx={{ border: '1px solid #000', p: 1 }}>
                  <Typography variant="caption">DATE ISSUED:</Typography>
                  <Typography fontFamily="monospace">{receipt?.orData?.date || (receipt?.createdAt ? formatDate(receipt.createdAt) : formatDate(payment.createdAt))}</Typography>
                  <Box mt={0.5}>
                    <Typography variant="caption">DATE:</Typography>
                    <Typography fontFamily="monospace">
                      {receipt?.orData?.date || (receipt?.createdAt ? formatDate(receipt.createdAt) : formatDate(payment.createdAt))}
                      {(receipt?.orData?.time || payment.paymentDate) && (
                        <span className="receipt-time"> - {receipt?.orData?.time || formatTime(payment.paymentDate)}</span>
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ border: '1px solid #000', p: 1, height: '100%' }}>
                  <Typography variant="caption">O.R. No.</Typography>
                  <Typography fontFamily="monospace" fontWeight={700} fontSize={16}>{receipt?.orNumber}</Typography>
                  <Box mt={0.5}>
                    <Typography variant="caption">Transaction No.</Typography>
                    <Typography fontFamily="monospace">{payment.transactionId}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={8}>
                <Box sx={{ border: '1px solid #000', p: 1 }}>
                  <Typography variant="caption">BILL NO.:</Typography>
                  <Typography fontFamily="monospace">{(payment.bill as any)?.billNumber || '-'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ border: '1px solid #000', p: 1 }}>
                  <Typography variant="caption">FUND</Typography>
                  <Typography>-</Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ border: '1px solid #000', p: 1, mb: 1 }}>
              <Typography variant="caption">PAYOR:</Typography>
              <Typography fontFamily="monospace">{receipt?.orData?.payerName || `${payer?.firstName || ''} ${payer?.lastName || ''}`}</Typography>
              <Typography variant="caption">{payer?.email || receipt?.orData?.payerReference || ''}</Typography>
            </Box>

            <Box sx={{ border: '1px solid #000', mb: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #000', padding: 6, width: 40, textAlign: 'center' }}>NO</th>
                    <th style={{ border: '1px solid #000', padding: 6, textAlign: 'left' }}>FEE NAME</th>
                    <th style={{ border: '1px solid #000', padding: 6, width: 140, textAlign: 'right' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000', padding: 8 }}>{it.feeName || it.description || ''}</td>
                      <td style={{ border: '1px solid #000', padding: 8, textAlign: 'right' }}>{formatCurrency(it.amount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={8}>
                <Box sx={{ border: '1px solid #000', p: 1 }}>
                  <Typography variant="caption">PAYMENT METHOD</Typography>
                  <Typography>{receipt?.orData?.paymentMethod || method?.methodName || ''}</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ border: '1px solid #000', p: 1, height: '100%' }}>
                  <Typography variant="caption">TOTAL</Typography>
                  <Typography fontWeight={700} fontSize={18} textAlign="right">{formatCurrency(payment.amount)}</Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ border: '1px solid #000', p: 1, mt: 1 }}>
              <Typography>RECEIVED THE AMOUNT STATED ABOVE BY:</Typography>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Box textAlign="center">
                  <Typography variant="body2" sx={{ mb: 0.25 }}>{receipt?.orData?.cashier || (payment.cashier ? `${payment.cashier.firstName} ${payment.cashier.lastName}` : '')}</Typography>
                  <Box sx={{ borderBottom: '1px solid #000', width: 220, height: 0, mt: 0.5 }} />
                  <Typography variant="caption" display="block" mt={0.25}>CASHIER</Typography>
                </Box>
              </Box>
            </Box>

            <Box mt={1}>
              <Typography variant="caption" align="center">NOTE: This official receipt is valid for proof of payment</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      
    </Box>
  );
};

export default PaymentDetail;
