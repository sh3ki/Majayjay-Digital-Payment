import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableHead, TableBody,
  TableRow, TableCell, CircularProgress, Alert, Chip, Pagination,
  TextField, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { adminService } from '../../services/admin.service';
import { AuditLog } from '../../types';
import { formatDateTime } from '../../utils/formatters';

const ACTION_COLORS: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  CREATE: 'success', UPDATE: 'info', DELETE: 'error', LOGIN: 'default', LOGOUT: 'default',
  PAYMENT: 'success', VIEW: 'default', EXPORT: 'warning',
};

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 25 };
      if (action) params.action = action;
      const res = await adminService.getAuditLogs(params);
      if (res.data) { setLogs(res.data as AuditLog[]); setTotal(res.meta?.total || 0); }
    } catch { setError('Failed to load audit logs'); }
    finally { setLoading(false); }
  }, [page, action]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#004D2E">Audit Logs</Typography>
          <Typography variant="body2" color="text.secondary">System activity trail and security events</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Action</InputLabel>
              <Select value={action} label="Action" onChange={(e) => { setAction(e.target.value); setPage(1); }}>
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="CREATE">Create</MenuItem>
                <MenuItem value="UPDATE">Update</MenuItem>
                <MenuItem value="DELETE">Delete</MenuItem>
                <MenuItem value="LOGIN">Login</MenuItem>
                <MenuItem value="LOGOUT">Logout</MenuItem>
                <MenuItem value="PAYMENT">Payment</MenuItem>
                <MenuItem value="VIEW">View</MenuItem>
                <MenuItem value="EXPORT">Export</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#00873E' }} /></Box>
          ) : (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Entity</TableCell>
                      <TableCell>Entity ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell sx={{ fontSize: 11, whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {(log.user as { firstName?: string; lastName?: string })?.firstName} {(log.user as { firstName?: string; lastName?: string })?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(log.user as { email?: string })?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={log.action} size="small" color={ACTION_COLORS[log.action] || 'default'} />
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{log.entityType || '—'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{log.entityId || '—'}</TableCell>
                        <TableCell>
                          <Chip label={log.status} size="small" color={log.status === 'SUCCESS' ? 'success' : 'error'} />
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{log.ipAddress || '—'}</TableCell>
                        <TableCell sx={{ maxWidth: 200, fontSize: 11, color: '#757575' }}>
                          {log.details ? JSON.stringify(log.details).slice(0, 80) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#757575' }}>No audit logs found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
              {total > 25 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination count={Math.ceil(total / 25)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuditLogs;
