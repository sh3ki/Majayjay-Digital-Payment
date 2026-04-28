import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box minHeight="100vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2}>
      <Typography variant="h1" fontWeight={700} color="#00873E">404</Typography>
      <Typography variant="h5" color="text.secondary">Page not found</Typography>
      <Button variant="contained" onClick={() => navigate('/')}>Go Home</Button>
    </Box>
  );
};

export default NotFound;
