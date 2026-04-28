import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress, Alert,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, AttachMoney, PendingActions,
  CheckCircle, Error as ErrorIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { reportsService } from '../services/reports.service';
import { DashboardKPIs, MonthlyRevenue, PaymentMethodBreakdown } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';

const COLORS = ['#00873E', '#26A69A', '#2196F3', '#FFC107'];

const KPICard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, subtitle, trend, icon, color = '#00873E' }) => (
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

const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([]);
  const [methodBreakdown, setMethodBreakdown] = useState<PaymentMethodBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [kpiRes, revRes, methodRes] = await Promise.all([
          reportsService.getDashboardAnalytics(),
          reportsService.getRevenueSummary(),
          reportsService.getPaymentMethodBreakdown(),
        ]);
        if (kpiRes.data) setKpis(kpiRes.data);
        if (revRes.data) setRevenue(revRes.data);
        if (methodRes.data) setMethodBreakdown(methodRes.data);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress sx={{ color: '#00873E' }} />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} color="#004D2E" mb={1}>Dashboard</Typography>
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

      {/* Charts Row */}
      <Grid container spacing={3} mb={3}>
        {/* Revenue Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="#004D2E" mb={2}>
                Annual Revenue Trend ({new Date().getFullYear()})
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="monthName" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(0, 3)} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="total" stroke="#00873E" strokeWidth={2.5} dot={{ fill: '#00873E', r: 4 }} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Method Pie */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="#004D2E" mb={2}>
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
              <Typography variant="h6" fontWeight={600} color="#004D2E" mb={2}>
                Monthly Collection Count
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="monthName" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(0, 3)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#26A69A" radius={[4, 4, 0, 0]} name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Transactions */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} color="#004D2E" mb={2}>
            Recent Transactions
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#004D2E', color: 'white' }}>
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
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#00873E' }}>
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
