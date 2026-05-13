import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, CircularProgress, Divider, Chip,
} from '@mui/material';
import {
  Visibility, VisibilityOff, LockOutlined,
  AccountBalanceOutlined, ArrowBack, Security, Verified,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { LoginDto } from '../types';
import api from '../services/api';

const GRADIENT  = 'linear-gradient(135deg, #0D47A1 0%, #1565C0 60%, #1976D2 100%)';
const PRIMARY   = '#1565C0';
const DARK      = '#0D47A1';
const LIGHT     = '#E3F2FD';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login: React.FC = () => {
  const { login, isAuthenticated, isLoading, error, clear, pendingVerificationUserId } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginDto>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
    return () => { clear(); };
  }, [isAuthenticated]);

  // Redirect to verify-email page when login returns requiresVerification
  useEffect(() => {
    if (pendingVerificationUserId) navigate('/verify-email', { replace: true });
  }, [pendingVerificationUserId]);

  const onSubmit = (data: LoginDto) => login(data);

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const response = await api.post('/oauth/google-auth-url');
      if (response.data?.data?.authUrl) {
        window.location.href = response.data.data.authUrl;
      }
    } catch (err) {
      console.error('Failed to initiate Google login:', err);
      alert('Failed to initiate Google login');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: GRADIENT, position: 'relative', overflow: 'hidden' }}>

      {/* Background decorations — same as landing page */}
      <Box sx={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '-15%', left: '-8%', width: 380, height: 380, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', top: '40%', right: '10%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(66,165,245,0.15)', pointerEvents: 'none' }} />

      {/* Top nav — same style as landing page */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, py: 2, px: { xs: 2, md: 6 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AccountBalanceOutlined sx={{ color: 'white', fontSize: 19 }} />
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize={14} color="white" lineHeight={1.1}>Majayjay Digital</Typography>
            <Typography fontSize={10} color="rgba(255,255,255,0.7)">Payment System</Typography>
          </Box>
        </Link>
        {/* Back to home */}
        <Button
          component={Link}
          to="/"
          startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
          sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500, '&:hover': { color: 'white', background: 'rgba(255,255,255,0.1)' } }}
        >
          Back to Home
        </Button>
      </Box>

      {/* Centered content */}
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', pt: 10, pb: 4, px: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 440 }}>

          {/* Hero text above card */}
          <Box textAlign="center" mb={4}>
            <Chip
              label="🏛️ Municipal Government of Majayjay, Laguna"
              sx={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, mb: 2, border: '1px solid rgba(255,255,255,0.25)', fontSize: 12, backdropFilter: 'blur(4px)' }}
            />
            <Typography variant="h4" fontWeight={800} color="white" mb={0.5} letterSpacing="-0.5px">
              Welcome Back
            </Typography>
            <Typography fontSize={14} color="rgba(255,255,255,0.75)">
              Sign in to access your payment portal
            </Typography>
          </Box>

          {/* Card */}
          <Card sx={{ borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            {/* Card header strip */}
            <Box sx={{ background: GRADIENT, px: 4, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LockOutlined sx={{ color: 'white', fontSize: 19 }} />
              </Box>
              <Box>
                <Typography fontWeight={700} color="white" fontSize={16}>Sign In</Typography>
                <Typography fontSize={11} color="rgba(255,255,255,0.75)">Enter your credentials below</Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {error && (
                <Alert severity="error" onClose={clear} sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <TextField
                  {...register('email')}
                  label="Email Address"
                  type="email"
                  fullWidth
                  margin="normal"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  autoComplete="email"
                  autoFocus
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  {...register('password')}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  margin="normal"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  autoComplete="current-password"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box textAlign="right" mt={1} mb={2.5}>
                  <Link to="/forgot-password" style={{ color: PRIMARY, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                    Forgot Password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isLoading}
                  sx={{ py: 1.5, fontSize: 15, fontWeight: 700, borderRadius: 2, background: GRADIENT, boxShadow: '0 4px 16px rgba(21,101,192,0.4)', '&:hover': { background: DARK } }}
                >
                  {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
                </Button>
              </form>

              <Box display="flex" alignItems="center" gap={2} my={3}>
                <Divider sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>OR</Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>

              <Button
                onClick={handleGoogleLogin}
                variant="outlined"
                fullWidth
                size="large"
                disabled={googleLoading}
                sx={{
                  py: 1.5, fontSize: 15, borderRadius: 2, fontWeight: 600,
                  borderColor: '#DB4437', color: '#DB4437',
                  '&:hover': { borderColor: '#C62828', backgroundColor: 'rgba(219,68,55,0.04)' },
                }}
              >
                {googleLoading
                  ? <CircularProgress size={22} color="inherit" />
                  : <Box display="flex" alignItems="center" gap={1}>
                      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Sign in with Google
                    </Box>
                }
              </Button>

              <Box textAlign="center" mt={3} pt={2} sx={{ borderTop: '1px solid #F0F0F0' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: PRIMARY, fontWeight: 700, textDecoration: 'none' }}>
                    Create one here
                  </Link>
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Trust indicators */}
          <Box display="flex" alignItems="center" justifyContent="center" gap={3} mt={3} flexWrap="wrap">
            {[
              { icon: <Security sx={{ fontSize: 14 }} />, text: 'Secure & Encrypted' },
              { icon: <Verified sx={{ fontSize: 14 }} />, text: 'COA Compliant' },
            ].map(({ icon, text }) => (
              <Box key={text} display="flex" alignItems="center" gap={0.6}>
                <Box sx={{ color: 'rgba(255,255,255,0.6)' }}>{icon}</Box>
                <Typography fontSize={12} color="rgba(255,255,255,0.6)">{text}</Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="rgba(255,255,255,0.45)" textAlign="center" display="block" mt={1.5}>
            For authorized personnel only. All access is monitored and logged.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
