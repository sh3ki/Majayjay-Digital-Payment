import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableHead, TableBody,
  TableRow, TableCell, CircularProgress, Alert, Chip, Pagination,
  TextField, Select, MenuItem, FormControl, InputLabel, InputAdornment,
  IconButton, Tooltip,
} from '@mui/material';
import { Search, Refresh } from '@mui/icons-material';
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
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 25 };
      if (action) params.action = action;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await adminService.getAuditLogs(params);
      if (res.data) { setLogs(res.data as AuditLog[]); setTotal(res.meta?.total || 0); }
    } catch { setError('Failed to load audit logs'); }
    finally { setLoading(false); }
  }, [page, action, search, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">Audit Logs</Typography>
          <Typography variant="body2" color="text.secondary">System activity trail and security events · {total} records</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <CardContent>
          <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
            <TextField
              size="small" placeholder="Search by user name or email…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} sx={{ flex: 1, minWidth: 220 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Action</InputLabel>
              <Select value={action} label="Action" onChange={(e) => { setAction(e.target.value as string); setPage(1); }}>
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
            <TextField size="small" label="From" type="date" value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }} InputLabelProps={{ shrink: true }} sx={{ width: 155 }} />
            <TextField size="small" label="To" type="date" value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }} InputLabelProps={{ shrink: true }} sx={{ width: 155 }} />
            <Tooltip title="Refresh"><IconButton onClick={load} size="small"><Refresh /></IconButton></Tooltip>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#1565C0' }} /></Box>
          ) : (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F5F7FA' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Entity</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Entity ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 5, color: '#9E9E9E' }}>No audit logs found</TableCell>
                      </TableRow>
                    ) : logs.map((log) => (
                      <TableRow key={log.id} hover>
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
                  </TableBody>
                </Table>
              </Box>
              {total > 25 && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
                  </Typography>
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
