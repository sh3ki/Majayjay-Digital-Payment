import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  Alert, Divider, Avatar, Tab, Tabs,
} from '@mui/material';
import { Person, Security } from '@mui/icons-material';
import useAuth from '../hooks/useAuth';
import { authService } from '../services/auth.service';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { fetchMeAsync } from '../store/slices/authSlice';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [tab, setTab] = useState(0);

  // Profile edit state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [middleName, setMiddleName] = useState(user?.middleName || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [barangay, setBarangay] = useState(user?.barangay || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      await authService.updateProfile({ firstName, lastName, middleName, contactNumber, address, barangay });
      setProfileSuccess('Profile updated successfully');
      dispatch(fetchMeAsync());
    } catch {
      setProfileError('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    setPwLoading(true);
    setPwSuccess('');
    setPwError('');
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPwSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPwError('Failed to change password. Check your current password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} color="#0D47A1" mb={1}>My Profile</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Manage your account information and security settings</Typography>

      <Grid container spacing={3}>
        {/* Profile card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" py={2}>
                <Avatar sx={{ width: 88, height: 88, bgcolor: '#1565C0', fontSize: 34, mb: 2, fontWeight: 700 }}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
                <Typography variant="h6" fontWeight={700}>{user?.firstName} {user?.middleName ? user.middleName + ' ' : ''}{user?.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                {user?.contactNumber && <Typography variant="caption" color="text.secondary" mt={0.5}>{user.contactNumber}</Typography>}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Role</Typography>
                  <Typography fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                    {(user?.role as { roleName?: string })?.roleName?.replace(/_/g, ' ') || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Account Status</Typography>
                  <Typography fontWeight={600} color="#1565C0">{user?.status || 'Active'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabs */}
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
                <Tab icon={<Person fontSize="small" />} iconPosition="start" label="Edit Profile" />
                <Tab icon={<Security fontSize="small" />} iconPosition="start" label="Change Password" />
              </Tabs>
            </Box>
            <CardContent>
              {tab === 0 && (
                <Box component="form" onSubmit={handleUpdateProfile}>
                  {profileSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setProfileSuccess('')}>{profileSuccess}</Alert>}
                  {profileError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setProfileError('')}>{profileError}</Alert>}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="First Name" value={firstName}
                        onChange={(e) => setFirstName(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Last Name" value={lastName}
                        onChange={(e) => setLastName(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Middle Name" value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)} placeholder="Optional" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Contact Number" value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)} placeholder="+63 9XX XXX XXXX" />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Email" value={user?.email || ''} disabled
                        helperText="Email cannot be changed" />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField fullWidth label="Address" value={address}
                        onChange={(e) => setAddress(e.target.value)} placeholder="House/Unit No., Street" />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth label="Barangay" value={barangay}
                        onChange={(e) => setBarangay(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <Button type="submit" variant="contained" disabled={profileLoading} size="large">
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {tab === 1 && (
                <Box component="form" onSubmit={handleChangePassword}>
                  {pwSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPwSuccess('')}>{pwSuccess}</Alert>}
                  {pwError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPwError('')}>{pwError}</Alert>}
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Current Password" type="password"
                        value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="New Password" type="password"
                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        required inputProps={{ minLength: 8 }} helperText="Minimum 8 characters" />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Confirm New Password" type="password"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                      <Button type="submit" variant="contained" color="warning" disabled={pwLoading} size="large">
                        {pwLoading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
