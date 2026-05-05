import React, { useEffect, useRef, useState } from 'react';
import {
  IconButton, Badge, Menu, Box, Typography, MenuItem, Divider,
  CircularProgress, Button, Chip,
} from '@mui/material';
import { Notifications, NotificationsNone } from '@mui/icons-material';
import api from '../../services/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchUnread = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnread(res.data.data?.count ?? 0);
    } catch {
      // Silent — user may not have notifications yet
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data ?? []);
      setUnread(0);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => setAnchorEl(null);

  const handleMarkRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      // Silent
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Silent
    }
  };

  return (
    <>
      <IconButton color="inherit" size="small" onClick={handleOpen}>
        <Badge badgeContent={unread > 0 ? unread : undefined} color="error" max={99}>
          {unread > 0 ? <Notifications /> : <NotificationsNone />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { width: 360, maxHeight: 480 } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
          {notifications.some((n) => !n.isRead) && (
            <Button size="small" onClick={handleMarkAll} sx={{ fontSize: 11 }}>Mark all read</Button>
          )}
        </Box>
        <Divider />

        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box py={4} textAlign="center">
            <NotificationsNone sx={{ fontSize: 40, color: '#BDBDBD', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          notifications.map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => handleMarkRead(n.id)}
              sx={{
                whiteSpace: 'normal',
                alignItems: 'flex-start',
                bgcolor: n.isRead ? 'transparent' : 'rgba(21, 101, 192, 0.06)',
                borderLeft: n.isRead ? 'none' : '3px solid #1565C0',
                py: 1.5,
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" fontWeight={n.isRead ? 400 : 700} fontSize={13}>
                    {n.title}
                  </Typography>
                  {!n.isRead && <Chip label="New" size="small" color="primary" sx={{ height: 16, fontSize: 10 }} />}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                  {n.message}
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                  {new Date(n.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
