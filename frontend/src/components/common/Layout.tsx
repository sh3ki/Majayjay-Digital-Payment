import React, { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar, { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from './Sidebar';

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = isMobile ? 0 : (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F5F7FA' }}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content — offset by sidebar width on desktop */}
      <Box
        sx={{
          flex: 1,
          ml: { md: `${sidebarWidth}px` },
          transition: 'margin-left 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
        }}
      >
        <Navbar
          onMenuToggle={() => setMobileOpen((o) => !o)}
          sidebarWidth={sidebarWidth}
        />

        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 1.5, sm: 3 },
            mt: '64px', // Navbar height
            minWidth: 0,
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
