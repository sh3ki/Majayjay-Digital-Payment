import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, Grid, CircularProgress,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { RegisterDto } from '../types';

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
      <Box sx={{ width: '100%', maxWidth: 520 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" fontWeight={800} color="white">🏛️ Majayjay Digital Payment System</Typography>
          <Typography variant="body1" color="rgba(255,255,255,0.85)">
            Create Your Account
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <PersonAdd sx={{ color: '#1565C0' }} />
              <Typography variant="h5" fontWeight={700} color="#0D47A1">Register</Typography>
            </Box>

            {error && <Alert severity="error" onClose={clear} sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>Account created! Redirecting to login...</Alert>}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField {...register('firstName')} label="First Name" fullWidth
                    error={!!errors.firstName} helperText={errors.firstName?.message} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField {...register('lastName')} label="Last Name" fullWidth
                    error={!!errors.lastName} helperText={errors.lastName?.message} />
                </Grid>
                <Grid item xs={12}>
                  <TextField {...register('email')} label="Email Address" type="email" fullWidth
                    error={!!errors.email} helperText={errors.email?.message} />
                </Grid>
                <Grid item xs={12}>
                  <TextField {...register('contactNumber')} label="Contact Number" fullWidth
                    placeholder="09XXXXXXXXX" error={!!errors.contactNumber} helperText={errors.contactNumber?.message} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField {...register('password')} label="Password" type="password" fullWidth
                    error={!!errors.password} helperText={errors.password?.message} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField {...register('confirmPassword')} label="Confirm Password" type="password" fullWidth
                    error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
                </Grid>
              </Grid>

              <Button type="submit" variant="contained" fullWidth size="large" disabled={isLoading} sx={{ mt: 3, py: 1.5 }}>
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
              </Button>
            </form>

            <Box textAlign="center" mt={3}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#1565C0', fontWeight: 600, textDecoration: 'none' }}>
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Register;
