import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  Avatar, Chip, Divider, Stack, useMediaQuery, useTheme,
} from '@mui/material';
import {
  QrCode2, BarChart, Receipt, Security, Speed, People,
  CheckCircle, ArrowForward, PaymentOutlined, AccountBalanceOutlined,
  TrendingUp, NotificationsActive, CloudSync, Verified,
  MenuOutlined, Close,
} from '@mui/icons-material';
import useAuth from '../hooks/useAuth';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PRIMARY   = '#1565C0';
const DARK      = '#0D47A1';
const LIGHT     = '#E3F2FD';
const ACCENT    = '#42A5F5';
const GRADIENT  = 'linear-gradient(135deg, #0D47A1 0%, #1565C0 60%, #1976D2 100%)';
const GRADIENT2 = 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)';

// ─── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <QrCode2 sx={{ fontSize: 36, color: PRIMARY }} />,
    title: 'QR-Enabled Payments',
    desc: 'Pay government fees instantly with QR codes via GCash, Maya, or online portals — no queuing required.',
  },
  {
    icon: <BarChart sx={{ fontSize: 36, color: PRIMARY }} />,
    title: 'Analytics Dashboard',
    desc: 'Real-time revenue tracking, collection trends, and department-level analytics for informed decision-making.',
  },
  {
    icon: <Receipt sx={{ fontSize: 36, color: PRIMARY }} />,
    title: 'Digital Receipts',
    desc: 'Instantly generate official digital receipts with QR verification codes upon every successful transaction.',
  },
  {
    icon: <Security sx={{ fontSize: 36, color: PRIMARY }} />,
    title: 'Audit-Ready Logs',
    desc: 'Tamper-proof transaction history with full audit trails — COA-compliant and always accessible.',
  },
  {
    icon: <Speed sx={{ fontSize: 36, color: PRIMARY }} />,
    title: 'Cashier Terminal',
    desc: 'Dedicated cashier interface for rapid over-the-counter processing with auto-calculated amounts.',
  },
  {
    icon: <People sx={{ fontSize: 36, color: PRIMARY }} />,
    title: 'Multi-Role Access',
    desc: 'Separate portals for administrators, cashiers, department viewers, and residents with role-based controls.',
  },
];

const STATS = [
  { value: '100%', label: 'Digital Records', sub: 'No manual ledgers' },
  { value: '<3s',  label: 'Processing Time', sub: 'Per transaction' },
  { value: '24/7', label: 'Online Access',   sub: 'Anytime, anywhere' },
  { value: '0',    label: 'Paper Receipts',  sub: 'Fully paperless' },
];

const STEPS = [
  {
    number: '01',
    title: 'Login to Your Portal',
    desc: 'Residents log in to view outstanding bills, check payment history, and download official receipts.',
    icon: <AccountBalanceOutlined sx={{ fontSize: 28, color: 'white' }} />,
  },
  {
    number: '02',
    title: 'Select & Pay Your Fee',
    desc: 'Choose from municipal fees, scan the QR code or pay directly via GCash, Maya, or cashier terminal.',
    icon: <PaymentOutlined sx={{ fontSize: 28, color: 'white' }} />,
  },
  {
    number: '03',
    title: 'Receive Instant Receipt',
    desc: 'Get your official digital receipt immediately via email or download it anytime from your account.',
    icon: <Receipt sx={{ fontSize: 28, color: 'white' }} />,
  },
];

const RESIDENT_BENEFITS = [
  'View all outstanding bills in one place',
  'Pay anytime using QR, online portal, or cashier',
  'Download official digital receipts instantly',
  'Track full payment history',
  'No more long queues at the municipal hall',
];

const STAFF_BENEFITS = [
  'Centralized cashier terminal for fast processing',
  'Real-time revenue analytics and reporting',
  'Automated penalty calculations',
  'Department-level collection monitoring',
  'Full audit logs for compliance and COA',
];

// ─── Subcomponents ─────────────────────────────────────────────────────────────
const StatCard: React.FC<{ value: string; label: string; sub: string }> = ({ value, label, sub }) => (
  <Box textAlign="center" px={2}>
    <Typography
      variant="h3"
      fontWeight={800}
      sx={{ color: 'white', lineHeight: 1, mb: 0.5, fontSize: { xs: '2rem', md: '2.8rem' } }}
    >
      {value}
    </Typography>
    <Typography fontWeight={700} color="rgba(255,255,255,0.95)" fontSize={15}>{label}</Typography>
    <Typography fontSize={12} color="rgba(255,255,255,0.65)">{sub}</Typography>
  </Box>
);

const FeatureCard: React.FC<typeof FEATURES[0]> = ({ icon, title, desc }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      border: '1.5px solid #E3F2FD',
      borderRadius: 3,
      transition: 'all 0.25s ease',
      '&:hover': {
        borderColor: ACCENT,
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 32px rgba(21,101,192,0.12)',
      },
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box
        sx={{
          width: 64, height: 64, borderRadius: 2,
          background: LIGHT, display: 'flex', alignItems: 'center',
          justifyContent: 'center', mb: 2,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={700} color={DARK} mb={1}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{desc}</Typography>
    </CardContent>
  </Card>
);

const StepCard: React.FC<typeof STEPS[0]> = ({ number, title, desc, icon }) => (
  <Box sx={{ position: 'relative', textAlign: 'center', px: 2 }}>
    <Box
      sx={{
        width: 72, height: 72, borderRadius: '50%',
        background: GRADIENT, display: 'flex', alignItems: 'center',
        justifyContent: 'center', mx: 'auto', mb: 2,
        boxShadow: '0 8px 24px rgba(21,101,192,0.3)',
      }}
    >
      {icon}
    </Box>
    <Chip
      label={number}
      size="small"
      sx={{
        background: LIGHT, color: PRIMARY, fontWeight: 800,
        fontSize: 11, mb: 1.5, letterSpacing: 1,
      }}
    />
    <Typography variant="h6" fontWeight={700} color={DARK} mb={1}>{title}</Typography>
    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{desc}</Typography>
  </Box>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howRef      = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    setMenuOpen(false);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navLinks = [
    { label: 'Features',   ref: featuresRef },
    { label: 'How It Works', ref: howRef },
    { label: 'Benefits',   ref: benefitsRef },
  ];

  return (
    <Box sx={{ overflowX: 'hidden', background: '#FAFCFF' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <Box
        component="header"
        sx={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1200,
          background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.3s ease',
          py: scrolled ? 1 : 2, px: { xs: 2, md: 6 },
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 38, height: 38, borderRadius: 2,
              background: scrolled ? GRADIENT : 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: scrolled ? 'none' : '1.5px solid rgba(255,255,255,0.4)',
            }}
          >
            <AccountBalanceOutlined sx={{ color: scrolled ? 'white' : 'white', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              fontWeight={800} fontSize={15} lineHeight={1.1}
              color={scrolled ? DARK : 'white'}
              sx={{ letterSpacing: '-0.3px' }}
            >
              Majayjay Digital
            </Typography>
            <Typography fontSize={10} color={scrolled ? 'text.secondary' : 'rgba(255,255,255,0.75)'}>
              Payment System
            </Typography>
          </Box>
        </Box>

        {/* Desktop Nav */}
        {!isMobile && (
          <Box display="flex" alignItems="center" gap={3}>
            {navLinks.map(link => (
              <Typography
                key={link.label}
                component="span"
                onClick={() => scrollTo(link.ref)}
                sx={{
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  color: scrolled ? '#424242' : 'rgba(255,255,255,0.9)',
                  '&:hover': { color: scrolled ? PRIMARY : 'white' },
                  transition: 'color 0.2s',
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Box>
        )}

        {/* CTA Buttons */}
        <Box display="flex" alignItems="center" gap={1.5}>
          {!isMobile && (
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/login')}
              sx={{
                color: scrolled ? PRIMARY : 'white',
                fontWeight: 600, fontSize: 14,
                '&:hover': { background: scrolled ? LIGHT : 'rgba(255,255,255,0.1)' },
              }}
            >
              Sign In
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            sx={{
              background: scrolled ? GRADIENT : 'rgba(255,255,255,0.2)',
              border: scrolled ? 'none' : '1.5px solid rgba(255,255,255,0.5)',
              backdropFilter: 'blur(4px)',
              fontWeight: 700, fontSize: 13,
              boxShadow: scrolled ? '0 4px 12px rgba(21,101,192,0.3)' : 'none',
              '&:hover': {
                background: scrolled ? DARK : 'rgba(255,255,255,0.3)',
              },
            }}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
          </Button>
          {isMobile && (
            <Box
              onClick={() => setMenuOpen(!menuOpen)}
              sx={{ cursor: 'pointer', color: scrolled ? DARK : 'white', display: 'flex' }}
            >
              {menuOpen ? <Close /> : <MenuOutlined />}
            </Box>
          )}
        </Box>
      </Box>

      {/* Mobile Menu Drawer */}
      {menuOpen && isMobile && (
        <Box
          sx={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(13,71,161,0.97)', zIndex: 1100,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          {navLinks.map(link => (
            <Typography
              key={link.label}
              onClick={() => scrollTo(link.ref)}
              sx={{ color: 'white', fontSize: 24, fontWeight: 700, cursor: 'pointer' }}
            >
              {link.label}
            </Typography>
          ))}
          <Button
            variant="outlined"
            size="large"
            onClick={() => { setMenuOpen(false); navigate('/login'); }}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', mt: 2, width: 200 }}
          >
            Sign In
          </Button>
        </Box>
      )}

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          minHeight: '100vh',
          background: GRADIENT,
          display: 'flex', alignItems: 'center',
          position: 'relative', overflow: 'hidden',
          pt: { xs: 12, md: 8 }, pb: { xs: 10, md: 12 },
        }}
      >
        {/* Background decorations */}
        <Box sx={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: { xs: 300, md: 520 }, height: { xs: 300, md: 520 },
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', bottom: '-15%', left: '-8%',
          width: { xs: 250, md: 400 }, height: { xs: 250, md: 400 },
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', top: '30%', right: '15%',
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(66,165,245,0.15)', pointerEvents: 'none',
        }} />

        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            {/* Left content */}
            <Grid item xs={12} md={7}>
              <Chip
                label="🏛️ Municipal Government of Majayjay, Laguna"
                sx={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white', fontWeight: 600, mb: 3,
                  border: '1px solid rgba(255,255,255,0.25)',
                  fontSize: 12, backdropFilter: 'blur(4px)',
                }}
              />
              <Typography
                variant="h1"
                fontWeight={800}
                color="white"
                sx={{
                  fontSize: { xs: '2.4rem', md: '3.5rem', lg: '4rem' },
                  lineHeight: 1.1, mb: 3, letterSpacing: '-1px',
                }}
              >
                The Modern Way to
                <Box
                  component="span"
                  sx={{
                    display: 'block',
                    background: 'linear-gradient(90deg, #90CAF9, #E3F2FD)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Pay Government Fees
                </Box>
              </Typography>
              <Typography
                variant="h6"
                color="rgba(255,255,255,0.8)"
                mb={5}
                lineHeight={1.7}
                sx={{ fontSize: { xs: '1rem', md: '1.15rem' }, maxWidth: 540 }}
              >
                QR-enabled digital payment system for all municipal fees and services.
                Fast, secure, paperless — accessible from anywhere, anytime.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={6}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                  sx={{
                    background: 'white', color: PRIMARY,
                    fontWeight: 700, fontSize: 16, py: 1.8, px: 4,
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    '&:hover': { background: '#F5F5F5', transform: 'translateY(-2px)' },
                    transition: 'all 0.2s',
                  }}
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => scrollTo(howRef)}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.5)', color: 'white',
                    fontWeight: 600, fontSize: 16, py: 1.8, px: 4,
                    borderRadius: 2,
                    '&:hover': { borderColor: 'white', background: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  See How It Works
                </Button>
              </Stack>

              {/* Trust indicators */}
              <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                {[
                  { icon: <Verified sx={{ fontSize: 16 }} />, text: 'COA Compliant' },
                  { icon: <Security sx={{ fontSize: 16 }} />, text: 'Secure & Encrypted' },
                  { icon: <CloudSync sx={{ fontSize: 16 }} />, text: 'Real-Time Sync' },
                ].map(({ icon, text }) => (
                  <Box key={text} display="flex" alignItems="center" gap={0.6}>
                    <Box sx={{ color: '#90CAF9' }}>{icon}</Box>
                    <Typography fontSize={13} color="rgba(255,255,255,0.75)" fontWeight={500}>
                      {text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* Right: floating card mockup */}
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ position: 'relative', pl: 4 }}>
                {/* Main card */}
                <Card
                  sx={{
                    borderRadius: 4, p: 3,
                    background: 'rgba(255,255,255,0.97)',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                    <Box
                      sx={{
                        width: 40, height: 40, borderRadius: 2,
                        background: GRADIENT, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <AccountBalanceOutlined sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography fontWeight={700} color={DARK} fontSize={14}>Payment Summary</Typography>
                      <Typography fontSize={11} color="text.secondary">Municipal Fee Collection</Typography>
                    </Box>
                    <Chip label="Live" size="small" sx={{ ml: 'auto', background: '#E8F5E9', color: '#2E7D32', fontWeight: 700, fontSize: 10 }} />
                  </Box>

                  {/* Mini stat row */}
                  <Grid container spacing={1.5} mb={3}>
                    {[
                      { label: 'Collected Today', value: '₱ 24,850', color: PRIMARY },
                      { label: 'Transactions',    value: '47',       color: '#2E7D32' },
                    ].map(s => (
                      <Grid item xs={6} key={s.label}>
                        <Box sx={{ background: LIGHT, borderRadius: 2, p: 1.5 }}>
                          <Typography fontSize={10} color="text.secondary" mb={0.3}>{s.label}</Typography>
                          <Typography fontWeight={800} color={s.color} fontSize={18}>{s.value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Recent transactions */}
                  <Typography fontSize={12} fontWeight={700} color={DARK} mb={1.5}>Recent Transactions</Typography>
                  {[
                    { name: 'Juan D.', fee: 'Business Permit',  amount: '₱ 1,200', status: 'Paid' },
                    { name: 'Maria S.', fee: 'Real Property Tax', amount: '₱ 3,450', status: 'Paid' },
                    { name: 'Pedro R.', fee: 'Sanitary Fee',      amount: '₱  350', status: 'Pending' },
                  ].map((tx, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        py: 1, borderBottom: i < 2 ? '1px solid #F0F0F0' : 'none',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.2}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: LIGHT, color: PRIMARY, fontWeight: 700 }}>
                          {tx.name[0]}
                        </Avatar>
                        <Box>
                          <Typography fontSize={12} fontWeight={600} color="#212121">{tx.name}</Typography>
                          <Typography fontSize={10} color="text.secondary">{tx.fee}</Typography>
                        </Box>
                      </Box>
                      <Box textAlign="right">
                        <Typography fontSize={12} fontWeight={700} color={DARK}>{tx.amount}</Typography>
                        <Chip
                          label={tx.status}
                          size="small"
                          sx={{
                            fontSize: 9, height: 16, fontWeight: 700,
                            background: tx.status === 'Paid' ? '#E8F5E9' : '#FFF8E1',
                            color: tx.status === 'Paid' ? '#2E7D32' : '#F57F17',
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Card>

                {/* Floating QR badge */}
                <Card
                  sx={{
                    position: 'absolute', bottom: -30, left: -20,
                    borderRadius: 3, p: 2,
                    background: 'white',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    width: 200,
                  }}
                >
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode2 sx={{ color: 'white', fontSize: 26 }} />
                  </Box>
                  <Box>
                    <Typography fontSize={12} fontWeight={700} color={DARK}>QR Payment</Typography>
                    <Typography fontSize={10} color="text.secondary">GCash · Maya · Online</Typography>
                  </Box>
                </Card>

                {/* Floating notification */}
                <Card
                  sx={{
                    position: 'absolute', top: -20, right: -30,
                    borderRadius: 3, p: 1.5,
                    background: 'white',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
                    display: 'flex', alignItems: 'center', gap: 1.2,
                    width: 210,
                  }}
                >
                  <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <NotificationsActive sx={{ color: '#2E7D32', fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography fontSize={11} fontWeight={700} color="#212121">Payment Confirmed!</Typography>
                    <Typography fontSize={10} color="text.secondary">Receipt generated · Just now</Typography>
                  </Box>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <Box sx={{ background: GRADIENT, py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center', justifyContent: 'space-around',
              gap: { xs: 4, sm: 2 },
            }}
          >
            {STATS.map((s, i) => (
              <React.Fragment key={s.label}>
                <StatCard {...s} />
                {i < STATS.length - 1 && (
                  <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.15)', display: { xs: 'none', sm: 'block' } }} />
                )}
              </React.Fragment>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <Box ref={featuresRef} sx={{ py: { xs: 8, md: 12 }, background: 'white' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7}>
            <Chip label="Core Features" sx={{ background: LIGHT, color: PRIMARY, fontWeight: 700, mb: 2 }} />
            <Typography variant="h3" fontWeight={800} color={DARK} mb={2} sx={{ fontSize: { xs: '1.9rem', md: '2.5rem' } }}>
              Everything You Need
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 540, mx: 'auto', lineHeight: 1.8 }}>
              A complete digital payment platform built specifically for local government units — 
              from collection to compliance.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {FEATURES.map(f => (
              <Grid item xs={12} sm={6} md={4} key={f.title}>
                <FeatureCard {...f} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <Box ref={howRef} sx={{ py: { xs: 8, md: 12 }, background: GRADIENT2 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7}>
            <Chip label="Simple Process" sx={{ background: LIGHT, color: PRIMARY, fontWeight: 700, mb: 2 }} />
            <Typography variant="h3" fontWeight={800} color={DARK} mb={2} sx={{ fontSize: { xs: '1.9rem', md: '2.5rem' } }}>
              How It Works
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto', lineHeight: 1.8 }}>
              Three simple steps to pay your government fees — no paperwork, no queues.
            </Typography>
          </Box>

          <Grid container spacing={4} alignItems="flex-start">
            {STEPS.map((step, i) => (
              <React.Fragment key={step.number}>
                <Grid item xs={12} md={4}>
                  <StepCard {...step} />
                </Grid>
                {i < STEPS.length - 1 && (
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center', mt: 3,
                    }}
                  >
                    <ArrowForward sx={{ color: ACCENT, fontSize: 28, mx: -1 }} />
                  </Box>
                )}
              </React.Fragment>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── BENEFITS ─────────────────────────────────────────────────────────── */}
      <Box ref={benefitsRef} sx={{ py: { xs: 8, md: 12 }, background: 'white' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7}>
            <Chip label="Who Benefits" sx={{ background: LIGHT, color: PRIMARY, fontWeight: 700, mb: 2 }} />
            <Typography variant="h3" fontWeight={800} color={DARK} mb={2} sx={{ fontSize: { xs: '1.9rem', md: '2.5rem' } }}>
              Built for Everyone
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Residents */}
            <Grid item xs={12} md={6}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4, height: '100%',
                  border: `1.5px solid ${LIGHT}`,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ background: GRADIENT, p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <People sx={{ color: 'white', fontSize: 26 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="white">For Residents</Typography>
                    <Typography fontSize={12} color="rgba(255,255,255,0.75)">Taxpayers & citizens</Typography>
                  </Box>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={1.5}>
                    {RESIDENT_BENEFITS.map(b => (
                      <Box key={b} display="flex" alignItems="flex-start" gap={1.2}>
                        <CheckCircle sx={{ color: PRIMARY, fontSize: 18, mt: 0.15, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" lineHeight={1.6}>{b}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/register')}
                    sx={{ mt: 3, py: 1.5, fontWeight: 700, borderRadius: 2 }}
                  >
                    Create Account
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Staff */}
            <Grid item xs={12} md={6}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4, height: '100%',
                  border: `1.5px solid ${LIGHT}`,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ background: 'linear-gradient(135deg, #37474F, #546E7A)', p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AccountBalanceOutlined sx={{ color: 'white', fontSize: 26 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="white">For LGU Staff</Typography>
                    <Typography fontSize={12} color="rgba(255,255,255,0.75)">Admins, cashiers & department heads</Typography>
                  </Box>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={1.5}>
                    {STAFF_BENEFITS.map(b => (
                      <Box key={b} display="flex" alignItems="flex-start" gap={1.2}>
                        <CheckCircle sx={{ color: '#546E7A', fontSize: 18, mt: 0.15, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" lineHeight={1.6}>{b}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/login')}
                    sx={{ mt: 3, py: 1.5, fontWeight: 700, borderRadius: 2, borderColor: '#546E7A', color: '#546E7A', '&:hover': { borderColor: '#37474F', background: '#ECEFF1' } }}
                  >
                    Staff Sign In
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── PAYMENT METHODS ──────────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 6, md: 8 }, background: LIGHT }}>
        <Container maxWidth="md">
          <Box textAlign="center" mb={4}>
            <Typography variant="h5" fontWeight={700} color={DARK} mb={1}>
              Accepted Payment Channels
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pay using your preferred method — all channels accepted.
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex', flexWrap: 'wrap',
              justifyContent: 'center', gap: 2,
            }}
          >
            {[
              { label: '💙 GCash',         sub: 'QR / Mobile' },
              { label: '💜 Maya',           sub: 'QR / Mobile' },
              { label: '🏦 Over the Counter', sub: 'Cash at Cashier' },
              { label: '🌐 Online Portal',  sub: 'Web Payment' },
              { label: '📱 QR Code',        sub: 'Scan & Pay' },
            ].map(m => (
              <Card
                key={m.label}
                elevation={0}
                sx={{
                  borderRadius: 3, px: 3, py: 2,
                  border: '1.5px solid #BBDEFB',
                  background: 'white', textAlign: 'center',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: PRIMARY, transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(21,101,192,0.1)' },
                }}
              >
                <Typography fontWeight={700} fontSize={14} color={DARK}>{m.label}</Typography>
                <Typography fontSize={11} color="text.secondary">{m.sub}</Typography>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── CTA BANNER ───────────────────────────────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 8, md: 11 },
          background: GRADIENT,
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <Container maxWidth="sm" sx={{ position: 'relative' }}>
          <TrendingUp sx={{ fontSize: 48, color: 'rgba(255,255,255,0.6)', mb: 2 }} />
          <Typography variant="h3" fontWeight={800} color="white" mb={2} sx={{ fontSize: { xs: '1.9rem', md: '2.5rem' } }}>
            Ready to Go Digital?
          </Typography>
          <Typography variant="body1" color="rgba(255,255,255,0.8)" mb={4} lineHeight={1.8}>
            Join Majayjay's digital transformation. Faster payments, real-time tracking, 
            and zero paperwork — starting today.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/register')}
              sx={{
                background: 'white', color: PRIMARY, fontWeight: 700,
                fontSize: 16, py: 1.8, px: 5, borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                '&:hover': { background: '#F5F5F5' },
              }}
            >
              Create Free Account
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)', color: 'white',
                fontWeight: 600, fontSize: 16, py: 1.8, px: 5, borderRadius: 2,
                '&:hover': { borderColor: 'white', background: 'rgba(255,255,255,0.08)' },
              }}
            >
              Sign In
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <Box sx={{ background: '#0A1929', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} mb={4}>
            {/* Brand */}
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AccountBalanceOutlined sx={{ color: 'white', fontSize: 18 }} />
                </Box>
                <Typography fontWeight={800} color="white" fontSize={16}>
                  Majayjay Digital Payment
                </Typography>
              </Box>
              <Typography fontSize={13} color="rgba(255,255,255,0.5)" lineHeight={1.8} maxWidth={280}>
                A QR-enabled integrated payment system for the Municipal Government of Majayjay, Laguna.
              </Typography>
            </Grid>

            {/* Quick Links */}
            <Grid item xs={6} md={2}>
              <Typography fontWeight={700} color="white" fontSize={13} mb={2} letterSpacing={0.5} textTransform="uppercase">
                System
              </Typography>
              {[
                { label: 'Sign In',    to: '/login' },
                { label: 'Register',   to: '/register' },
                { label: 'Dashboard',  to: '/dashboard' },
              ].map(l => (
                <Box key={l.label} mb={1}>
                  <Link to={l.to} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none' }}>
                    {l.label}
                  </Link>
                </Box>
              ))}
            </Grid>

            {/* Features */}
            <Grid item xs={6} md={3}>
              <Typography fontWeight={700} color="white" fontSize={13} mb={2} letterSpacing={0.5} textTransform="uppercase">
                Features
              </Typography>
              {['QR Payments', 'Analytics', 'Digital Receipts', 'Audit Logs', 'Cashier Terminal'].map(f => (
                <Typography key={f} fontSize={13} color="rgba(255,255,255,0.55)" mb={1}>{f}</Typography>
              ))}
            </Grid>

            {/* Contact */}
            <Grid item xs={12} md={3}>
              <Typography fontWeight={700} color="white" fontSize={13} mb={2} letterSpacing={0.5} textTransform="uppercase">
                Contact
              </Typography>
              <Typography fontSize={13} color="rgba(255,255,255,0.55)" mb={1}>Municipal Hall, Majayjay</Typography>
              <Typography fontSize={13} color="rgba(255,255,255,0.55)" mb={1}>Laguna, Philippines 4025</Typography>
              <Chip
                label="LGU System"
                size="small"
                sx={{ background: 'rgba(21,101,192,0.4)', color: '#90CAF9', fontSize: 11, mt: 1 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 3 }} />
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" gap={1}>
            <Typography fontSize={12} color="rgba(255,255,255,0.35)">
              © {new Date().getFullYear()} Municipal Government of Majayjay, Laguna. All rights reserved.
            </Typography>
            <Typography fontSize={12} color="rgba(255,255,255,0.35)">
              Authorized personnel only. All access is monitored and logged.
            </Typography>
          </Box>
        </Container>
      </Box>

    </Box>
  );
};

export default LandingPage;
