import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert, CircularProgress,
} from '@mui/material';
import api from '../services/api';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return setError('Password must be at least 8 characters');
    if (newPassword !== confirm) return setError('Passwords do not match');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid or expired reset link');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Alert severity="error">Invalid reset link. Please request a new password reset.</Alert>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" bgcolor="#F5F7FA">
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} color="#0D47A1" mb={1}>Reset Password</Typography>
          <Typography color="text.secondary" mb={3}>Enter your new password below.</Typography>

          {success ? (
            <Alert severity="success">
              Password reset successfully! Redirecting to login...
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <TextField
                label="New Password"
                type="password"
                fullWidth
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ mb: 2 }}
                inputProps={{ minLength: 8 }}
              />
              <TextField
                label="Confirm Password"
                type="password"
                fullWidth
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ bgcolor: '#0D47A1', py: 1.5 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Reset Password'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPassword;
