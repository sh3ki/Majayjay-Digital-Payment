import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, Grid, CircularProgress, Chip, InputAdornment, IconButton,
} from '@mui/material';
import {
  PersonAdd, AccountBalanceOutlined, ArrowBack, Security, Verified,
  Visibility, VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { RegisterDto } from '../types';

const GRADIENT = 'linear-gradient(135deg, #0D47A1 0%, #1565C0 60%, #1976D2 100%)';
const PRIMARY  = '#1565C0';
const DARK     = '#0D47A1';

const schema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Invalid email'),
  contactNumber: z.string().min(10, 'Enter valid contact number'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const Register: React.FC = () => {
  const { register: registerUser, isLoading, error, clear } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => () => { clear(); }, []);

  const onSubmit = async (data: FormData) => {
    const dto: RegisterDto = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      contactNumber: data.contactNumber,
    };
    const result = await registerUser(dto);
    if ((result as { type: string }).type === 'auth/register/fulfilled') {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: GRADIENT, position: 'relative', overflow: 'hidden' }}>

      {/* Background decorations — same as landing page */}
      <Box sx={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '-15%', left: '-8%', width: 380, height: 380, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', top: '35%', right: '8%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(66,165,245,0.15)', pointerEvents: 'none' }} />

      {/* Top nav — same style as landing page */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, py: 2, px: { xs: 2, md: 6 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AccountBalanceOutlined sx={{ color: 'white', fontSize: 19 }} />
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize={14} color="white" lineHeight={1.1}>Majayjay Digital</Typography>
            <Typography fontSize={10} color="rgba(255,255,255,0.7)">Payment System</Typography>
          </Box>
        </Link>
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
        <Box sx={{ width: '100%', maxWidth: 540 }}>

          {/* Hero text above card */}
          <Box textAlign="center" mb={4}>
            <Chip
              label="🏛️ Municipal Government of Majayjay, Laguna"
              sx={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, mb: 2, border: '1px solid rgba(255,255,255,0.25)', fontSize: 12, backdropFilter: 'blur(4px)' }}
            />
            <Typography variant="h4" fontWeight={800} color="white" mb={0.5} letterSpacing="-0.5px">
              Create Your Account
            </Typography>
            <Typography fontSize={14} color="rgba(255,255,255,0.75)">
              Join the digital payment system for Majayjay residents
            </Typography>
          </Box>

          {/* Card */}
          <Card sx={{ borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            {/* Card header strip */}
            <Box sx={{ background: GRADIENT, px: 4, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PersonAdd sx={{ color: 'white', fontSize: 19 }} />
              </Box>
              <Box>
                <Typography fontWeight={700} color="white" fontSize={16}>Register</Typography>
                <Typography fontSize={11} color="rgba(255,255,255,0.75)">Fill in your details to get started</Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {error && <Alert severity="error" onClose={clear} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Account created! Redirecting to login...</Alert>}

              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      {...register('firstName')}
                      label="First Name"
                      fullWidth
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      {...register('lastName')}
                      label="Last Name"
                      fullWidth
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      {...register('email')}
                      label="Email Address"
                      type="email"
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      {...register('contactNumber')}
                      label="Contact Number"
                      fullWidth
                      placeholder="09XXXXXXXXX"
                      error={!!errors.contactNumber}
                      helperText={errors.contactNumber?.message}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      {...register('password')}
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      error={!!errors.password}
                      helperText={errors.password?.message}
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
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      {...register('confirmPassword')}
                      label="Confirm Password"
                      type={showConfirm ? 'text' : 'password'}
                      fullWidth
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                              {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isLoading}
                  sx={{ mt: 3, py: 1.5, fontSize: 15, fontWeight: 700, borderRadius: 2, background: GRADIENT, boxShadow: '0 4px 16px rgba(21,101,192,0.4)', '&:hover': { background: DARK } }}
                >
                  {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
                </Button>
              </form>

              <Box textAlign="center" mt={3} pt={2} sx={{ borderTop: '1px solid #F0F0F0' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: PRIMARY, fontWeight: 700, textDecoration: 'none' }}>
                    Sign in here
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
            By registering, you agree to the terms of use of this government system.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;
