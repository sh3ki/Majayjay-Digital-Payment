import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface Props {
  message?: string;
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<Props> = ({ message = 'Loading...', fullPage = false }) => {
  const content = (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2} p={4}>
      <CircularProgress sx={{ color: '#1565C0' }} />
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );

  if (fullPage) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{ background: '#F5F5F5' }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default LoadingSpinner;
