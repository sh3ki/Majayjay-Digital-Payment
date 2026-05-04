import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, CircularProgress, Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { LoginDto } from '../types';
import api from '../services/api';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login: React.FC = () => {
  const { login, isAuthenticated, isLoading, error, clear } = useAuth();
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" fontWeight={800} color="white" mb={0.5}>
            🏛️ Majayjay Digital Payment System
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.7)">
            Municipal Government of Majayjay, Laguna
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <LockOutlined sx={{ color: '#1565C0' }} />
              <Typography variant="h5" fontWeight={700} color="#0D47A1">
                Sign In
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" onClose={clear} sx={{ mb: 2 }}>
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
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box textAlign="right" mt={1} mb={2}>
                <Link to="/forgot-password" style={{ color: '#42A5F5', fontSize: 14, textDecoration: 'none' }}>
                  Forgot Password?
                </Link>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
                sx={{ py: 1.5, fontSize: 16 }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </form>

            <Box display="flex" alignItems="center" gap={2} my={3}>
              <Divider sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary">OR</Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>

            <Button
              onClick={handleGoogleLogin}
              variant="outlined"
              fullWidth
              size="large"
              disabled={googleLoading}
              sx={{ 
                py: 1.5, 
                fontSize: 16,
                borderColor: '#DB4437',
                color: '#DB4437',
                '&:hover': { borderColor: '#DB4437', backgroundColor: 'rgba(219, 68, 55, 0.04)' }
              }}
            >
              {googleLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign in with Google'}
            </Button>

            <Box textAlign="center" mt={3}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#1565C0', fontWeight: 600, textDecoration: 'none' }}>
                  Register here
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="caption" color="rgba(255,255,255,0.6)" textAlign="center" display="block" mt={2}>
          For authorized personnel only. All access is monitored and logged.
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
