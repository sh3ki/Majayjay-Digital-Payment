import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress, Alert, Button,
  Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, AttachMoney, PendingActions,
  CheckCircle, Error as ErrorIcon, Receipt, Payment as PaymentIcon,
  CalendarToday, AccountBalance,
} from '@mui/icons-material';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { reportsService } from '../services/reports.service';
import { billsService } from '../services/bills.service';
import { paymentsService } from '../services/payments.service';
import { DashboardKPIs, MonthlyRevenue, PaymentMethodBreakdown, Bill, Payment } from '../types';
import { formatCurrency, formatDateTime, formatDate, isOverdue } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../hooks/useAuth';

const COLORS = ['#1565C0', '#42A5F5', '#2196F3', '#FFC107'];

const KPICard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, subtitle, trend, icon, color = '#1565C0' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
          <Typography variant="h4" fontWeight={700} color={color}>{value}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          {trend !== undefined && (
            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
              {trend >= 0 ? <TrendingUp fontSize="small" color="success" /> : <TrendingDown fontSize="small" color="error" />}
              <Typography variant="caption" color={trend >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
                {Math.abs(trend).toFixed(1)}% from last month
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}15`, color }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

// ── Resident Dashboard ────────────────────────────────────────────────────────
const ResidentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [billsRes, paymentsRes] = await Promise.all([
          billsService.getBills({ limit: 50 }),
          paymentsService.getPayments({ limit: 5 }),
        ]);
        if (billsRes.data) setBills(billsRes.data);
        if (paymentsRes.data) setPayments(paymentsRes.data);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#1565C0' }} /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const unpaidBills = bills.filter((b) => ['UNPAID', 'OVERDUE', 'PARTIALLY_PAID'].includes(b.status));
  const totalOutstanding = unpaidBills.reduce((s, b) => s + parseFloat(String(b.balanceAmount)), 0);
  const totalPaid = payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
  const parseDueUtc = (d: string) => {
    const dateOnly = (d || '').split('T')[0];
    const [y, m, day] = dateOnly.split('-').map(Number);
    return Date.UTC(y, (m || 1) - 1, day || 1);
  };
  const nextDue = unpaidBills.sort((a, b) => parseDueUtc(a.dueDate) - parseDueUtc(b.dueDate))[0];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} color="#0D47A1" mb={1}>My Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Overview of your bills and payments</Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Outstanding Balance" value={formatCurrency(totalOutstanding)}
            subtitle={`${unpaidBills.length} unpaid bill${unpaidBills.length !== 1 ? 's' : ''}`}
            icon={<PendingActions />} color="#F44336" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Recent Payments" value={formatCurrency(totalPaid)}
            subtitle="From recent history" icon={<AttachMoney />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Next Due Date" value={nextDue ? formatDate(nextDue.dueDate) : 'None'}
            subtitle={nextDue ? nextDue.billNumber : 'All bills paid!'}
            icon={<CalendarToday />} color={nextDue ? '#FF9800' : '#4CAF50'} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Total Bills" value={String(bills.length)}
            subtitle={`${bills.filter(b => b.status === 'PAID').length} paid`}
            icon={<Receipt />} color="#1565C0" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Unpaid Bills */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600} color="#0D47A1">My Unpaid Bills</Typography>
                <Button size="small" onClick={() => navigate('/bills')}>View All</Button>
              </Box>
              {unpaidBills.length === 0 ? (
                <Box py={4} textAlign="center">
                  <CheckCircle sx={{ fontSize: 48, color: '#4CAF50', mb: 1 }} />
                  <Typography color="text.secondary">All bills are paid!</Typography>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto', width: '100%' }}>
                <Table size="small" sx={{ minWidth: { xs: 560, md: 'auto' } }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F5F7FA' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Bill No.</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Balance</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {unpaidBills.slice(0, 5).map((b) => (
                      <TableRow key={b.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{b.billNumber}</TableCell>
                        <TableCell sx={{ fontSize: 12, color: isOverdue(b.dueDate) ? '#F44336' : 'inherit' }}>
                          {formatDate(b.dueDate)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#F44336' }}>
                          {formatCurrency(parseFloat(String(b.balanceAmount)))}
                        </TableCell>
                        <TableCell align="center"><StatusBadge status={b.status} /></TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="contained" sx={{ fontSize: 11 }}
                            onClick={() => navigate(`/bills/${b.id}`)}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Payments */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600} color="#0D47A1">Recent Payments</Typography>
                <Button size="small" onClick={() => navigate('/payments')}>View All</Button>
              </Box>
              {payments.length === 0 ? (
                <Box py={4} textAlign="center">
                  <PaymentIcon sx={{ fontSize: 48, color: '#9E9E9E', mb: 1 }} />
                  <Typography color="text.secondary">No payments yet</Typography>
                </Box>
              ) : (
                payments.map((p) => (
                  <Box key={p.id} display="flex" justifyContent="space-between" alignItems="center"
                    py={1} borderBottom="1px solid #F0F0F0" sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F5F7FA' } }}
                    onClick={() => navigate(`/payments/${p.id}`)}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{(p.receipt as { orNumber?: string })?.orNumber || p.transactionId}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDateTime(p.paymentDate)}</Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="body2" fontWeight={700} color="#1565C0">
                        {formatCurrency(parseFloat(String(p.amount)))}
                      </Typography>
                      <StatusBadge status={p.status} />
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// ── Staff Dashboard ───────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { isResident, isCashier, isCollector, isAdmin } = useAuth();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([]);
  const [methodBreakdown, setMethodBreakdown] = useState<PaymentMethodBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [billSummary, setBillSummary] = useState<{ counts: Record<string, number> } | null>(null);

  useEffect(() => {
    if (isResident) { setLoading(false); return; }
    const load = async () => {
      try {
        const [kpiRes, revRes, methodRes, billRes] = await Promise.all([
          reportsService.getDashboardAnalytics(),
          reportsService.getRevenueSummary(),
          reportsService.getPaymentMethodBreakdown(),
          billsService.getBillSummary(),
        ]);
        if (kpiRes.data) setKpis(kpiRes.data);
        if (revRes.data) setRevenue(revRes.data);
        if (methodRes.data) setMethodBreakdown(methodRes.data);
        if (billRes.data) setBillSummary(billRes.data);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isResident]);

  if (isResident) return <ResidentDashboard />;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress sx={{ color: '#1565C0' }} />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} color="#0D47A1" mb={1}>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Real-time overview of payment collections and revenue
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="This Month's Collection"
            value={formatCurrency(kpis?.thisMonthCollection || 0)}
            trend={kpis?.monthOverMonth}
            icon={<AttachMoney />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Outstanding"
            value={formatCurrency(kpis?.totalOutstanding || 0)}
            subtitle={`${kpis?.outstandingCount || 0} unpaid bills`}
            icon={<PendingActions />}
            color="#FFC107"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Payment Success Rate"
            value={`${kpis?.successRate || 0}%`}
            subtitle="Overall success rate"
            icon={<CheckCircle />}
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Pending Payments"
            value={String(kpis?.pendingPayments || 0)}
            subtitle="Awaiting confirmation"
            icon={<ErrorIcon />}
            color="#F44336"
          />
        </Grid>
      </Grid>

      {(isAdmin || isCollector || isCashier) && <>
        <Grid container spacing={3} mb={3}>
          {[
            ['Bills Paid', 'PAID', '#4CAF50', <CheckCircle />],
            ['Bills Unpaid', 'UNPAID', '#FF9800', <PendingActions />],
            ['Partially Paid', 'PARTIALLY_PAID', '#1565C0', <Receipt />],
            ['Overdue', 'OVERDUE', '#F44336', <ErrorIcon />],
          ].map(([title, key, color, icon]) => <Grid item xs={12} sm={6} md={3} key={key as string}>
            <KPICard title={title as string} value={String(billSummary?.counts[key as string] || 0)} icon={icon as React.ReactNode} color={color as string} />
          </Grid>)}
        </Grid>
      </>}

      {/* Charts Row */}
      <Grid container spacing={3} mb={3}>
        {/* Revenue Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>
                Annual Revenue Trend ({new Date().getFullYear()})
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="monthName" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(0, 3)} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="total" stroke="#1565C0" strokeWidth={2.5} dot={{ fill: '#1565C0', r: 4 }} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Method Pie */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>
                Payment Methods
              </Typography>
              {methodBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={methodBreakdown} dataKey="total" nameKey="methodName" cx="50%" cy="50%" outerRadius={90} label={({ name, percentage }) => `${name} ${percentage}%`}>
                      {methodBreakdown.map((_entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height={200}>
                  <Typography color="text.secondary">No data for current period</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Monthly bar chart */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>
                Monthly Collection Count
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="monthName" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(0, 3)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#42A5F5" radius={[4, 4, 0, 0]} name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Transactions */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>
            Recent Transactions
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#0D47A1', color: 'white' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Transaction ID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Payer</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Method</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {(kpis?.recentTransactions || []).map((txn, i) => (
                  <tr key={txn.id} style={{ background: i % 2 === 0 ? '#fff' : '#F5F5F5' }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12 }}>{txn.transactionId}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {(txn.payer as { firstName?: string; lastName?: string })?.firstName} {(txn.payer as { firstName?: string; lastName?: string })?.lastName}
                    </td>
                    <td style={{ padding: '10px 16px' }}>{(txn.method as { methodName?: string })?.methodName}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#1565C0' }}>
                      {formatCurrency(parseFloat(String(txn.amount)))}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <StatusBadge status={txn.status} />
                    </td>
                    <td style={{ padding: '10px 16px', color: '#757575', fontSize: 12 }}>
                      {formatDateTime(txn.paymentDate)}
                    </td>
                  </tr>
                ))}
                {(!kpis?.recentTransactions?.length) && (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#757575' }}>
                      No transactions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
