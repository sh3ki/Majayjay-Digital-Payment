import React, { useState } from 'react';
import logo from '../../public/majayjay logo.jpg';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Menu, MenuItem,
  Divider, Avatar,
} from '@mui/material';
import { Menu as MenuIcon, AccountCircle, Logout, Settings } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from './NotificationBell';

interface Props {
  onMenuToggle: () => void;
  sidebarWidth?: number;
}

const Navbar: React.FC<Props> = ({ onMenuToggle, sidebarWidth = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        ml: { md: `${sidebarWidth}px` },
        width: { md: `calc(100% - ${sidebarWidth}px)` },
        transition: 'width 0.2s ease, margin-left 0.2s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
      }}
    >
      <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
        <IconButton color="inherit" edge="start" onClick={onMenuToggle} sx={{ mr: { xs: 1, sm: 2 }, display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, minWidth: 0 }}>
          <Box component="img" src={logo} alt="Majayjay logo" sx={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          <Typography variant="h6" fontWeight={700} fontSize={{ xs: 14, sm: 16 }} noWrap sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Majayjay Digital Payment System
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationBell />

          <IconButton onClick={handleMenu} size="small">
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#0D47A1', fontSize: 13 }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
            <AccountCircle fontSize="small" sx={{ mr: 1 }} /> My Profile
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); navigate('/profile?tab=security'); }}>
            <Settings fontSize="small" sx={{ mr: 1 }} /> Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <Logout fontSize="small" sx={{ mr: 1 }} /> Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
