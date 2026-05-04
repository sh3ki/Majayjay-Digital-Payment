import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  CircularProgress, Alert, Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { reportsService } from '../services/reports.service';
import { CollectionReport, PaymentMethodBreakdown } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const COLORS = ['#1565C0', '#42A5F5', '#2196F3', '#FFC107'];

const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<CollectionReport | null>(null);
  const [methodBreakdown, setMethodBreakdown] = useState<PaymentMethodBreakdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [reportRes, methodRes] = await Promise.all([
        reportsService.getCollectionReport({ startDate, endDate }),
        reportsService.getPaymentMethodBreakdown({ startDate, endDate }),
      ]);
      if (reportRes.data) setReport(reportRes.data);
      if (methodRes.data) setMethodBreakdown(methodRes.data);
    } catch {
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} color="#0D47A1" mb={1}>Reports & Analytics</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Collection reports and revenue analysis</Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="Start Date" type="date" value={startDate} size="small"
              onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date" type="date" value={endDate} size="small"
              onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" onClick={load} disabled={loading}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Generate Report'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {report && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ background: '#E3F2FD' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Total Collected</Typography>
                  <Typography variant="h4" fontWeight={700} color="#0D47A1">
                    {formatCurrency(report.summary.total)}
                  </Typography>
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
            {/* By Method Bar */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Revenue by Payment Method</Typography>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={report.summary.byMethod}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="method" />
                      <YAxis tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="total" fill="#1565C0" radius={[4, 4, 0, 0]} name="Total Collected" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Pie */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Distribution</Typography>
                  {methodBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={methodBreakdown} dataKey="total" nameKey="methodName" cx="50%" cy="50%" outerRadius={80} label={({ percentage }) => `${percentage}%`}>
                          {methodBreakdown.map((_e, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
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

          {/* Transactions Table */}
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600} color="#0D47A1">
                  Transaction Details ({report.payments.length} records)
                </Typography>
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
        </>
      )}
    </Box>
  );
};

export default Reports;
