import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 256;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar onMenuToggle={() => setMobileOpen(!mobileOpen)} />

      <Box sx={{ display: { xs: 'none', md: 'block' }, width: { md: DRAWER_WIDTH }, flexShrink: 0 }}>
        <Sidebar open={true} onClose={() => {}} variant="permanent" />
      </Box>

      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} variant="temporary" />
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          minHeight: '100vh',
          minWidth: 0,
          overflowX: 'hidden',
          background: '#F5F5F5',
        }}
      >
        <Toolbar />
        <Box sx={{ width: '100%', maxWidth: '100%', mx: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
