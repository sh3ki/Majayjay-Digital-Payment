import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { AppDispatch } from '../store';
import { fetchMeAsync, setTokens } from '../store/slices/authSlice';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens from URL parameters
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const userStatus = searchParams.get('status');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(errorParam);
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        // If user is pending, show pending message
        if (userStatus === 'PENDING') {
          setStatus('pending');
          return;
        }

        if (!token || !refreshToken) {
          setError('Authentication failed: Missing tokens');
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        // Store tokens and hydrate auth state
        localStorage.setItem('token', token);
        dispatch(setTokens({ accessToken: token, refreshToken }));

        const meResult = await dispatch(fetchMeAsync());
        if (fetchMeAsync.rejected.match(meResult)) {
          throw new Error(typeof meResult.payload === 'string' ? meResult.payload : 'Failed to load profile');
        }

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Error handling auth callback:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setError('An error occurred during authentication');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, dispatch]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessToken');
    navigate('/login', { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #004D2E 0%, #00873E 100%)',
        p: 2,
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
        {status === 'pending' ? (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography color="white" variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Thank You for Registering!
              </Typography>
              <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
                <Typography variant="body2">
                  Your account has been successfully created and is currently under review by our administration team. 
                  This typically takes 24-48 hours. We'll notify you via email once your account has been approved.
                </Typography>
              </Alert>
              <Typography color="rgba(255,255,255,0.8)" variant="body1" sx={{ mb: 3 }}>
                We appreciate your patience!
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="inherit"
              onClick={handleLogout}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              Log Out
            </Button>
          </>
        ) : error ? (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Typography color="white" variant="body1">
              Redirecting to login...
            </Typography>
          </>
        ) : (
          <>
            <CircularProgress sx={{ color: 'white', mb: 2 }} />
            <Typography color="white" variant="h6">
              Completing authentication...
            </Typography>
            <Typography color="rgba(255,255,255,0.7)" variant="body2" sx={{ mt: 1 }}>
              Please wait while we sign you in
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

export default AuthCallback;
