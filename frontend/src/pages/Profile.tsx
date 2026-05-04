import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  Alert, Divider, Avatar,
} from '@mui/material';
import { Person } from '@mui/icons-material';
import useAuth from '../hooks/useAuth';
import { authService } from '../services/auth.service';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Failed to change password. Check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} color="#0D47A1" mb={1}>My Profile</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>View your account information and change password</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" py={2}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: '#1565C0', fontSize: 32, mb: 2 }}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
                <Typography variant="h6" fontWeight={700}>{user?.firstName} {user?.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                <Typography variant="caption" color="text.secondary" mt={0.5}>{user?.contactNumber}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">Role</Typography>
                <Typography fontWeight={600}>{(user?.role as { roleName?: string })?.roleName?.replace('_', ' ') || 'N/A'}</Typography>
              </Box>
              <Box mt={1.5}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Typography fontWeight={600} color="#1565C0">{user?.status}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Change Password</Typography>
              <Box component="form" onSubmit={handleChangePassword}>
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <TextField
                  fullWidth label="Current Password" type="password"
                  value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  required sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth label="New Password" type="password"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  required sx={{ mb: 2 }} inputProps={{ minLength: 8 }}
                />
                <TextField
                  fullWidth label="Confirm New Password" type="password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  required sx={{ mb: 3 }}
                />
                <Button type="submit" variant="contained" disabled={loading} size="large">
                  {loading ? 'Saving...' : 'Update Password'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
