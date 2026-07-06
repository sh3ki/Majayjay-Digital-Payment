import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Avatar, Tooltip, Divider, Drawer,
  IconButton,
} from '@mui/material';
import {
  Dashboard, Receipt, Payment, BarChart, People, Settings,
  AccountBalance, ListAlt, Security, Business, MonetizationOn,
  Category, ChevronLeft, ChevronRight,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

export const SIDEBAR_EXPANDED = 256;
export const SIDEBAR_COLLAPSED = 64;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  roles: string[];
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  // General
  { label: 'Dashboard',          path: '/dashboard',              icon: <Dashboard />,      roles: ['admin','cashier','collector','department_viewer','resident'],  section: 'General' },
  { label: 'Bills',              path: '/bills',                  icon: <Receipt />,         roles: ['resident','admin','cashier','collector','department_viewer'], section: 'General' },
  { label: 'Payments',           path: '/payments',               icon: <Payment />,         roles: ['admin','cashier','collector','department_viewer','resident'],  section: 'General' },
  { label: 'Cashier Terminal',   path: '/cashier',                icon: <AccountBalance />,  roles: ['cashier','admin'],                                section: 'General' },
  { label: 'Reports',            path: '/reports',                icon: <BarChart />,        roles: ['admin','cashier','collector','department_viewer'],             section: 'General' },
  // Financial Management
  { label: 'Fee Management',     path: '/admin/fees',             icon: <MonetizationOn />,  roles: ['admin'], section: 'Financial Management' },
  { label: 'Fees',               path: '/collector/fees',         icon: <MonetizationOn />,  roles: ['collector'], section: 'Financial Management' },
  { label: 'Fee Categories',     path: '/admin/fee-categories',   icon: <Category />,        roles: ['admin'], section: 'Financial Management' },
  { label: 'Penalty Rules',      path: '/admin/penalty-rules',    icon: <Settings />,        roles: ['admin'], section: 'Financial Management' },
  { label: 'Departments',        path: '/admin/departments',      icon: <Business />,        roles: ['admin'], section: 'Financial Management' },
  { label: 'Transaction Ledger', path: '/admin/ledger',           icon: <ListAlt />,         roles: ['admin'], section: 'Financial Management' },
  // Administration
  { label: 'User Management',    path: '/admin/users',            icon: <People />,          roles: ['admin'], section: 'Administration' },
  { label: 'Audit Logs',         path: '/admin/audit-logs',       icon: <Security />,        roles: ['admin'], section: 'Administration' },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const SidebarContent: React.FC<{ collapsed: boolean; onToggle: () => void; onNav: (path: string) => void }> = ({
  collapsed, onToggle, onNav,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const rawRole = typeof user?.role === 'string' ? user.role : (user?.role as { roleName?: string })?.roleName || '';
  const userRole = rawRole.toLowerCase();

  const filtered = NAV_ITEMS
    .filter((i) => i.roles.includes(userRole))
    .map((i) => {
      if (i.path === '/bills') return { ...i, label: userRole === 'resident' ? 'My Bills' : 'Bills' };
      if (i.path === '/payments') return { ...i, label: userRole === 'resident' ? 'My Payments' : 'Payments' };
      return i;
    });
  const sections = [...new Set(filtered.map((i) => i.section))];

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0D47A1',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
        width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
      }}
    >
      {/* Logo + toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 0 : 2,
          py: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          minHeight: 56,
        }}
      >
        {!collapsed && (
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="white" fontSize={13} lineHeight={1.2}>
              Majayjay
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>
              Digital Payment System
            </Typography>
          </Box>
        )}
        <IconButton onClick={onToggle} size="small" sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
          {collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
        </IconButton>
      </Box>

      {/* User badge */}
      {user && (
        <Box
          sx={{
            px: collapsed ? 0 : 2, py: 1.5,
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Tooltip title={collapsed ? `${user.firstName} ${user.lastName}\n${userRole.replace('_', ' ')}` : ''} placement="right">
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', width: 34, height: 34, fontSize: 13, border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>
              {user.firstName[0]}{user.lastName[0]}
            </Avatar>
          </Tooltip>
          {!collapsed && (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" fontWeight={700} color="white" fontSize={12} noWrap>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', fontSize: 10 }}>
                {userRole.replace('_', ' ')}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 } }}>
        {sections.map((section) => {
          const items = filtered.filter((i) => i.section === section);
          return (
            <Box key={section}>
              {!collapsed && (
                <Typography
                  variant="caption"
                  sx={{ px: 2, py: 0.5, display: 'block', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  {section}
                </Typography>
              )}
              {collapsed && section !== sections[0] && <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 0.5 }} />}
              {items.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Tooltip key={item.path} title={collapsed ? item.label : ''} placement="right" arrow>
                    <Box
                      onClick={() => onNav(item.path)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        mx: 1,
                        my: 0.25,
                        px: collapsed ? 0 : 1.5,
                        py: 1,
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        bgcolor: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                        borderLeft: isActive && !collapsed ? '3px solid #90CAF9' : '3px solid transparent',
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                      }}
                    >
                      <Box sx={{ color: isActive ? '#90CAF9' : 'rgba(255,255,255,0.7)', display: 'flex', flexShrink: 0, '& svg': { fontSize: 20 } }}>
                        {item.icon}
                      </Box>
                      {!collapsed && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: isActive ? 'white' : 'rgba(255,255,255,0.75)',
                            fontWeight: isActive ? 700 : 400,
                            fontSize: 13,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.label}
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      {!collapsed && (
        <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>
            © 2026 LGU Majayjay, Laguna
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const Sidebar: React.FC<Props> = ({ collapsed, onToggle, mobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    navigate(path);
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 1200,
          flexShrink: 0,
          width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
          transition: 'width 0.2s ease',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} onNav={handleNav} />
      </Box>

      {/* Mobile: temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_EXPANDED, border: 'none' },
        }}
      >
        <SidebarContent collapsed={false} onToggle={onToggle} onNav={handleNav} />
      </Drawer>
    </>
  );
};

export default Sidebar;
