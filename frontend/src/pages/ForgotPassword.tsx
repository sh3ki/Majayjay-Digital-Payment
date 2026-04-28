import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, Alert, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { authService } from '../services/auth.service';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center"
      sx={{ background: 'linear-gradient(135deg, #004D2E 0%, #00873E 100%)' }}>
      <Card sx={{ width: '100%', maxWidth: 420, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} color="#004D2E" mb={1}>Reset Password</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Enter your email and we'll send a reset link.
          </Typography>

          {sent ? (
            <Alert severity="success">
              If that email exists in our system, a reset link has been sent.
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <TextField
                fullWidth label="Email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained" fullWidth disabled={loading} size="large">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </Box>
          )}

          <Box mt={3} textAlign="center">
            <Link component={RouterLink} to="/login" color="#00873E">Back to Login</Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
