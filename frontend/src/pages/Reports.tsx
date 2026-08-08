import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  CircularProgress, Alert, Table, TableHead, TableBody, TableRow, TableCell,
  Tooltip, Tabs, Tab, Chip, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { Download, TrendingUp, People, AccountBalance, Receipt, Print } from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { reportsService } from '../services/reports.service';
import { CollectionReport, PaymentMethodBreakdown } from '../types';
import { formatCurrency, formatDateTime, manilaStartOfDayISO, manilaEndOfDayISO } from '../utils/formatters';

const COLORS = ['#1565C0', '#42A5F5', '#2196F3', '#FFC107', '#4CAF50', '#FF5722', '#9C27B0', '#00BCD4', '#FF9800', '#607D8B'];

const STATUS_COLORS: Record<string, string> = {
  PAID: '#4CAF50', UNPAID: '#FFC107', OVERDUE: '#F44336', PARTIALLY_PAID: '#FF9800',
  CANCELLED: '#9E9E9E', VOID: '#607D8B',
};

const datePresets = [
  { label: 'Today', days: 0 },
  { label: 'This Week', days: 7 },
  { label: 'This Month', days: 30 },
  { label: 'This Quarter', days: 90 },
  { label: 'This Year', days: 365 },
];

function setPreset(days: number): { start: string; end: string } {
  const end = new Date();
  const start = days === 0 ? new Date() : new Date(Date.now() - days * 86400000);
  if (days === 30) {
    const s = new Date(end.getFullYear(), end.getMonth(), 1);
    return { start: s.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}

type Analytics = {
  billsByStatus: { status: string; count: number; total: number }[];
  activeUsers: number;
  totalUsers: number;
  revenueByCategory: { categoryName: string; total: number; count: number }[];
  outstandingBalance: number;
  outstandingCount: number;
  totalRevenue: number;
  totalTransactions: number;
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Reports: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<CollectionReport | null>(null);
  const [methodBreakdown, setMethodBreakdown] = useState<PaymentMethodBreakdown[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [revenueByMonth, setRevenueByMonth] = useState<{ month: string; total: number }[]>([]);
  const [revYear, setRevYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState('');
  const [categorySummary, setCategorySummary] = useState<{ categoryName: string; total: number; count: number; payments: Array<any> }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      // Use Manila-based datetimes for filtering (payments use Manila DateTime)
      const manilaStart = manilaStartOfDayISO(startDate);
      const manilaEnd = manilaEndOfDayISO(endDate);
      const [reportRes, methodRes] = await Promise.all([
        reportsService.getCollectionReport({ startDate: manilaStart, endDate: manilaEnd }),
        reportsService.getPaymentMethodBreakdown({ startDate: manilaStart, endDate: manilaEnd }),
      ]);
      if (reportRes.data) setReport(reportRes.data);
      if (methodRes.data) setMethodBreakdown(methodRes.data);
    } catch {
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await reportsService.getFullAnalytics();
      if (res.data) setAnalytics(res.data as Analytics);
    } catch {
      setError('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadRevenue = async (year: number) => {
    try {
      const res = await reportsService.getRevenueSummary(year);
      if (res.data) {
        const monthly = Array.from({ length: 12 }, (_, i) => {
          const found = (res.data as { month: number; total: number; count: number }[]).find((r) => r.month === i + 1);
          return { month: MONTHS[i], total: found ? found.total : 0 };
        });
        setRevenueByMonth(monthly);
      }
    } catch { /* silent */ }
  };

  useEffect(() => { loadReport(); }, []);
  useEffect(() => { loadAnalytics(); loadRevenue(revYear); }, []);

  useEffect(() => {
    if (!report) {
      setCategorySummary([]);
      setSelectedCategory(null);
      return;
    }
    const map = new Map<string, { total: number; count: number; payments: Array<any> }>();
    report.payments.forEach((p) => {
      const items = (p.bill && (p.bill as any).items) || [];
      const itemsTotal = items.reduce((s: number, it: any) => s + (parseFloat(String(it.amount)) || 0), 0);
      if (itemsTotal <= 0) return;
      items.forEach((it: any) => {
        const cat = it.fee?.category?.categoryName || 'Uncategorized';
        const share = (parseFloat(String(it.amount)) / itemsTotal) * parseFloat(String(p.amount));
        const entry = map.get(cat) || { total: 0, count: 0, payments: [] };
        entry.total += share;
        entry.payments.push({ paymentId: p.id, transactionId: p.transactionId, paymentDate: p.paymentDate, payer: p.payer, amount: parseFloat(String(p.amount)), share, orNumber: p.receipt?.orNumber, method: p.method?.methodName });
        entry.count += 1;
        map.set(cat, entry);
      });
    });
    const arr = Array.from(map.entries()).map(([categoryName, v]) => ({ categoryName, total: v.total, count: v.count, payments: v.payments }));
    arr.sort((a, b) => b.total - a.total);
    setCategorySummary(arr);
    if (arr.length > 0 && !selectedCategory) setSelectedCategory(arr[0].categoryName);
  }, [report]);

  const exportCSV = () => {
    if (!report) return;
    const rows = [
      ['Date', 'Transaction ID', 'Payer', 'OR Number', 'Payment Method', 'Amount'],
      ...report.payments.map((p) => [
        formatDateTime(p.paymentDate),
        p.transactionId,
        `${(p.payer as { firstName?: string; lastName?: string })?.firstName} ${(p.payer as { firstName?: string; lastName?: string })?.lastName}`,
        (p.receipt as { orNumber?: string })?.orNumber || '',
        (p.method as { methodName?: string })?.methodName || '',
        String(p.amount),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printSection = () => {
    // Print only the currently visible tab section.
    setTimeout(() => {
      window.print();
    }, 120);
  };

  return (
    <Box className="reports-page-root">
      <style>{`
        .print-header { display: none; }

        @media print {
          @page { size: A4; margin: 12mm; }

          html, body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            overflow: visible !important;
          }

          .reports-no-print,
          .reports-print-controls {
            display: none !important;
          }

          .reports-print-section .MuiAlert-root,
          .reports-print-section button,
          .reports-print-section .MuiFormControl-root {
            display: none !important;
          }

          .reports-print-section .print-header {
            display: block !important;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #0D47A1;
          }

          /* hide the global app bar / navbar in print */
          .MuiAppBar-root { display: none !important; }

          /* hide scrollbars in print preview */
          * { scrollbar-width: none; -ms-overflow-style: none; }
          *::-webkit-scrollbar { display: none; }

          .reports-print-section .MuiCard-root {
            box-shadow: none !important;
            border: 1px solid #DCE3EA;
            break-inside: avoid-page;
            page-break-inside: avoid;
          }

          .reports-print-section .MuiGrid-item,
          .reports-print-section .MuiTable-root,
          .reports-print-section .recharts-wrapper {
            break-inside: avoid-page;
            page-break-inside: avoid;
          }

          .reports-print-section table {
            width: 100%;
            border-collapse: collapse;
          }

          .reports-print-section th,
          .reports-print-section td {
            border: 1px solid #E0E0E0;
            padding: 6px 8px;
          }

          .reports-print-section .recharts-responsive-container {
            width: 100% !important;
            min-height: 220px !important;
          }
        }
      `}</style>

      <Box className="reports-no-print">
        <Typography variant="h4" fontWeight={700} color="#0D47A1" mb={1}>Reports & Analytics</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Collection reports and revenue analysis</Typography>
      </Box>

      <Tabs className="reports-no-print" value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Collection Report" />
        <Tab label="Analytics Dashboard" />
        <Tab label="Collection Per Category" />
      </Tabs>

      {/* ── TAB 0: Collection Report ── */}
      {tab === 0 && (
        <div id="reports-print-tab-0" className="reports-print-section">
          <Box className="print-header">
            <Typography variant="h5" fontWeight={700} color="#0D47A1">Reports - Collection Report</Typography>
            <Typography variant="body2" color="text.secondary">Date Range: {startDate} to {endDate}</Typography>
          </Box>
          <Card className="reports-no-print" sx={{ mb: 3 }}>
            <CardContent>
              <Box className="reports-print-controls" display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
                <TextField
                  label="Start Date" type="date" value={startDate} size="small"
                  onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Date" type="date" value={endDate} size="small"
                  onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }}
                />
                <Button variant="contained" onClick={loadReport} disabled={loading}>
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Generate Report'}
                </Button>
                {report && (
                  <>
                    <Tooltip title="Export transactions to CSV">
                      <Button variant="outlined" startIcon={<Download />} onClick={exportCSV} size="small">Export CSV</Button>
                    </Tooltip>
                    <Tooltip>
                      <Button variant="contained" color="primary" size="small" startIcon={<Print />} onClick={printSection}>
                        Print
                      </Button>
                    </Tooltip>
                  </>
                )}
              </Box>
              <div className="reports-no-print">
              <Box display="flex" gap={1} flexWrap="wrap">
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', mr: 0.5 }}>Quick:</Typography>
                {datePresets.map((p) => (
                  <Button key={p.label} size="small" variant="outlined" color="inherit"
                    sx={{ fontSize: 11, py: 0.25, px: 1, borderColor: '#E0E0E0' }}
                    onClick={() => { const preset = setPreset(p.days); setStartDate(preset.start); setEndDate(preset.end); }}>
                    {p.label}
                  </Button>
                ))}
              </Box>
              </div>
            </CardContent>
          </Card>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

          {report && (
            <div>
              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ background: '#E3F2FD' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total Collected</Typography>
                      <Typography variant="h4" fontWeight={700} color="#0D47A1">{formatCurrency(report.summary.total)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Total Transactions</Typography>
                      <Typography variant="h4" fontWeight={700} color="#1565C0">{report.summary.count}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Avg. per Transaction</Typography>
                      <Typography variant="h4" fontWeight={700} color="#42A5F5">
                        {formatCurrency(report.summary.count > 0 ? report.summary.total / report.summary.count : 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Revenue by Payment Method</Typography>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={report.summary.byMethod}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="method" />
                          <YAxis tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                          <RTooltip formatter={(v: number) => formatCurrency(v)} />
                          <Bar dataKey="total" fill="#1565C0" radius={[4, 4, 0, 0]} name="Total Collected" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Distribution</Typography>
                      {methodBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={methodBreakdown} dataKey="total" nameKey="methodName" cx="50%" cy="50%" outerRadius={80}
                              label={({ percentage }) => `${percentage}%`}>
                              {methodBreakdown.map((_e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Legend />
                            <RTooltip formatter={(v: number) => formatCurrency(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height={180}>
                          <Typography color="text.secondary">No data</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600} color="#0D47A1">
                      Transaction Details ({report.payments.length} records)
                    </Typography>
                    <Button variant="outlined" size="small" startIcon={<Download />} onClick={exportCSV}>Export CSV</Button>
                  </Box>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Transaction ID</TableCell>
                          <TableCell>Payer</TableCell>
                          <TableCell>OR #</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {report.payments.slice(0, 100).map((p) => (
                          <TableRow key={p.id}>
                            <TableCell sx={{ fontSize: 12 }}>{formatDateTime(p.paymentDate)}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{p.transactionId}</TableCell>
                            <TableCell>{(p.payer as { firstName?: string; lastName?: string })?.firstName} {(p.payer as { firstName?: string; lastName?: string })?.lastName}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{(p.receipt as { orNumber?: string })?.orNumber || '-'}</TableCell>
                            <TableCell>{(p.method as { methodName?: string })?.methodName}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: '#1565C0' }}>
                              {formatCurrency(parseFloat(String(p.amount)))}
                            </TableCell>
                          </TableRow>
                        ))}
                        {report.payments.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#757575' }}>
                              No transactions in this period
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
      {/* ── TAB 2: Collection Per Category ── */}
      {tab === 2 && (
        <div id="reports-print-tab-2" className="reports-print-section">
          <Box className="print-header">
            <Typography variant="h5" fontWeight={700} color="#0D47A1">Reports - Collection Per Category</Typography>
            <Typography variant="body2" color="text.secondary">Date Range: {startDate} to {endDate}</Typography>
          </Box>
          <Card className="reports-no-print" sx={{ mb: 3 }}>
            <CardContent>
              <Box className="reports-print-controls" display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
                <TextField
                  label="Start Date" type="date" value={startDate} size="small"
                  onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Date" type="date" value={endDate} size="small"
                  onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }}
                />
                <Button variant="contained" onClick={loadReport} disabled={loading}>
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Generate'}
                </Button>
                <Tooltip>
                  <Button variant="contained" color="primary" size="small" startIcon={<Print />} onClick={printSection}>
                    Print
                  </Button>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

          <div>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ background: '#E3F2FD' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Total Collected (by Category)</Typography>
                  <Typography variant="h4" fontWeight={700} color="#0D47A1">{formatCurrency(categorySummary.reduce((s, c) => s + c.total, 0))}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Categories</Typography>
                  <Typography variant="h4" fontWeight={700} color="#1565C0">{categorySummary.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Top Category</Typography>
                  <Typography variant="h6" fontWeight={700} color="#42A5F5">{categorySummary[0]?.categoryName || '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">{categorySummary[0] ? formatCurrency(categorySummary[0].total) : '-'}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Collection by Category</Typography>
                  {categorySummary.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={categorySummary.map(c => ({ categoryName: c.categoryName, total: c.total }))} layout="vertical" margin={{ left: 20, right: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="categoryName" width={180} tick={{ fontSize: 12 }} />
                        <RTooltip formatter={(v: number) => formatCurrency(v)} />
                        <Bar dataKey="total" fill="#1565C0">
                          {categorySummary.map((_e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height={120}><Typography color="text.secondary">No data</Typography></Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Category Totals</Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="center">Transactions</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categorySummary.map((c) => (
                          <TableRow key={c.categoryName} hover onClick={() => setSelectedCategory(c.categoryName)} sx={{ cursor: 'pointer' }}>
                            <TableCell>{c.categoryName}</TableCell>
                            <TableCell align="center">{c.count}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(c.total)}</TableCell>
                          </TableRow>
                        ))}
                        {categorySummary.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 4, color: '#757575' }}>No category collections</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {categorySummary.length > 0 ? (
            categorySummary.map((c) => (
              <Card key={c.categoryName} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Payments for {c.categoryName}</Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Transaction ID</TableCell>
                          <TableCell>Payer</TableCell>
                          <TableCell>OR #</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell align="right">Amount (share)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {c.payments.map((p: any, idx: number) => (
                          <TableRow key={`${p.paymentId}-${idx}`}>
                            <TableCell sx={{ fontSize: 12 }}>{formatDateTime(p.paymentDate)}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{p.transactionId}</TableCell>
                            <TableCell>{p.payer?.firstName} {p.payer?.lastName}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{p.orNumber || '-'}</TableCell>
                            <TableCell>{p.method || '-'}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(p.share)}</TableCell>
                          </TableRow>
                        ))}
                        {c.payments.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#757575' }}>No payments</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent>
                <Typography color="text.secondary">No category collections</Typography>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      )}

      {/* ── TAB 1: Analytics Dashboard ── */}
      {tab === 1 && (
        <div id="reports-print-tab-1" className="reports-print-section">
          <Box className="print-header">
            <Typography variant="h5" fontWeight={700} color="#0D47A1">Reports - Analytics Dashboard</Typography>
            <Typography variant="body2" color="text.secondary">Date Range: {startDate} to {endDate}</Typography>
          </Box>
          {analyticsLoading ? (
            <Box display="flex" justifyContent="center" p={6}><CircularProgress sx={{ color: '#1565C0' }} /></Box>
          ) : analytics ? (
            <>
              <Box className="reports-print-controls" display="flex" justifyContent="flex-end" mb={2}>
                <Tooltip>
                  <Button variant="contained" color="primary" size="small" startIcon={<Print />} onClick={printSection}>
                    Print
                  </Button>
                </Tooltip>
              </Box>
              <div>
              {/* KPI Cards */}
              <Grid container spacing={3} mb={3}>
                {[
                  { label: 'Total Revenue', value: formatCurrency(analytics.totalRevenue), icon: <TrendingUp />, bg: '#E3F2FD', color: '#0D47A1' },
                  { label: 'Total Transactions', value: analytics.totalTransactions.toLocaleString(), icon: <Receipt />, bg: '#E8F5E9', color: '#2E7D32' },
                  { label: 'Active Users', value: `${analytics.activeUsers} / ${analytics.totalUsers}`, icon: <People />, bg: '#FFF3E0', color: '#E65100' },
                  { label: 'Outstanding Balance', value: formatCurrency(analytics.outstandingBalance), icon: <AccountBalance />, bg: '#FCE4EC', color: '#C62828' },
                ].map((kpi) => (
                  <Grid item xs={12} sm={6} md={3} key={kpi.label}>
                    <Card sx={{ background: kpi.bg }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="body2" color="text.secondary">{kpi.label}</Typography>
                            <Typography variant="h5" fontWeight={700} color={kpi.color} mt={0.5}>{kpi.value}</Typography>
                          </Box>
                          <Box sx={{ color: kpi.color, opacity: 0.7 }}>{kpi.icon}</Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Bills by Status + Revenue Monthly */}
              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={5}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Bills by Status</Typography>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={analytics.billsByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={90} label={({ status, count }) => `${status}: ${count}`}>
                            {analytics.billsByStatus.map((b, i) => (
                              <Cell key={i} fill={STATUS_COLORS[b.status] || COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <RTooltip formatter={(v: number, _name: string, props: { payload?: { status: string; total: number } }) => [`${v} bills — ${formatCurrency(props.payload?.total || 0)}`, props.payload?.status]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight={600} color="#0D47A1">Monthly Revenue</Typography>
                        <FormControl className="reports-no-print" size="small" sx={{ minWidth: 100 }}>
                          <InputLabel>Year</InputLabel>
                          <Select value={revYear} label="Year" onChange={(e) => { const y = Number(e.target.value); setRevYear(y); loadRevenue(y); }}>
                            {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((y) => (
                              <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={revenueByMonth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                          <RTooltip formatter={(v: number) => formatCurrency(v)} />
                          <Line type="monotone" dataKey="total" stroke="#1565C0" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Top Categories */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Top Fee Categories by Revenue</Typography>
                  {analytics.revenueByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={analytics.revenueByCategory} layout="vertical" margin={{ left: 20, right: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="categoryName" width={190} tick={{ fontSize: 12 }} />
                        <RTooltip formatter={(v: number) => formatCurrency(v)} />
                        <Bar dataKey="total" fill="#1565C0" radius={[0, 4, 4, 0]} name="Revenue">
                          {analytics.revenueByCategory.map((_e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height={120}>
                      <Typography color="text.secondary">No payment data yet</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Outstanding by status table */}
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Bills Overview</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F5F7FA' }}>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Count</TableCell>
                        <TableCell align="right">Total Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.billsByStatus.map((b) => (
                        <TableRow key={b.status}>
                          <TableCell>
                            <Chip label={b.status} size="small" sx={{ bgcolor: STATUS_COLORS[b.status] || '#90A4AE', color: '#fff', fontSize: 11 }} />
                          </TableCell>
                          <TableCell align="center">{b.count}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(b.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              </div>
            </>
          ) : (
            <Alert severity="info">No analytics data available. Load the page again after transactions exist.</Alert>
          )}
        </div>
      )}
    </Box>
  );
};

export default Reports;
