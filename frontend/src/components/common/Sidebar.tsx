import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Box, Typography, Avatar,
} from '@mui/material';
import {
  Dashboard, Receipt, Payment, BarChart, People, Settings,
  AccountBalance, ListAlt, Security, Business, MonetizationOn,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const DRAWER_WIDTH = 256;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <Dashboard />, roles: ['admin', 'cashier', 'department_viewer', 'resident'] },
  { label: 'My Bills', path: '/bills', icon: <Receipt />, roles: ['resident', 'admin', 'cashier', 'department_viewer'] },
  { label: 'Payments', path: '/payments', icon: <Payment />, roles: ['admin', 'cashier', 'department_viewer', 'resident'] },
  { label: 'Cashier Terminal', path: '/cashier', icon: <AccountBalance />, roles: ['cashier', 'admin'] },
  { label: 'Reports', path: '/reports', icon: <BarChart />, roles: ['admin', 'cashier', 'department_viewer'] },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: <Security />, roles: ['admin'] },
  { label: 'User Management', path: '/admin/users', icon: <People />, roles: ['admin'] },
  { label: 'Fee Management', path: '/admin/fees', icon: <MonetizationOn />, roles: ['admin'] },
  { label: 'Penalty Rules', path: '/admin/penalty-rules', icon: <Settings />, roles: ['admin'] },
  { label: 'Departments', path: '/admin/departments', icon: <Business />, roles: ['admin'] },
  { label: 'Transaction Ledger', path: '/admin/ledger', icon: <ListAlt />, roles: ['admin'] },
];

interface Props {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
}

const Sidebar: React.FC<Props> = ({ open, onClose, variant = 'permanent' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rawRole = typeof user?.role === 'string' ? user.role : user?.role?.roleName || '';
  const userRole = rawRole.toLowerCase();
  const isPermanent = variant === 'permanent';

  const filteredItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const handleNav = (path: string) => {
    navigate(path);
    if (variant === 'temporary') onClose();
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 3, background: '#0D47A1', color: 'white', textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700} fontSize={14}>
          Majayjay Digital
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, fontSize: 11, mt: 0.5 }}>
          Payment System
        </Typography>
      </Box>

      {/* User info */}
      {user && (
        <Box sx={{ p: 2, background: '#E3F2FD', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#1565C0', width: 36, height: 36, fontSize: 14 }}>
            {user.firstName[0]}{user.lastName[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} color="#0D47A1" fontSize={13}>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {userRole.replace('_', ' ')}
            </Typography>
          </Box>
        </Box>
      )}

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, py: 1 }}>
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNav(item.path)}
                sx={{
                  mx: 1, borderRadius: 1, mb: 0.5,
                  backgroundColor: isActive ? '#E3F2FD' : 'transparent',
                  borderLeft: isActive ? '4px solid #1565C0' : '4px solid transparent',
                  '&:hover': { backgroundColor: '#E3F2FD' },
                  color: isActive ? '#0D47A1' : '#424242',
                }}
              >
                <ListItemIcon sx={{ color: isActive ? '#1565C0' : '#757575', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: '2px 0 4px rgba(0,0,0,0.08)',
          position: isPermanent ? 'relative' : 'fixed',
        },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar;
