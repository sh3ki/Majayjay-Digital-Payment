import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, InputAdornment,
  Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, Alert,
  IconButton, Pagination, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Select, MenuItem, FormControl, InputLabel, Grid,
} from '@mui/material';
import { Search, Add, Block, Delete } from '@mui/icons-material';
import { adminService } from '../../services/admin.service';
import { User } from '../../types';
import { formatDateTime } from '../../utils/formatters';

const STATUS_COLORS: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  ACTIVE: 'success', INACTIVE: 'default', SUSPENDED: 'error', PENDING: 'warning',
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState<Array<{ id: number; roleName: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; departmentName: string }>>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', contactNumber: '', roleId: '', departmentId: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await adminService.getUsers(params);
      if (res.data) { setUsers(res.data); setTotal(res.meta?.total || 0); }
    } catch { setError('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [rolesRes, deptRes] = await Promise.all([
          adminService.getRoles(),
          adminService.getDepartments(),
        ]);
        setRoles(rolesRes.data || []);
        setDepartments(deptRes.data || []);
      } catch {}
    };
    loadMeta();
  }, []);

  const handleCreate = async () => {
    try {
      await adminService.createUser({ ...form, roleId: parseInt(form.roleId), departmentId: form.departmentId ? parseInt(form.departmentId) : undefined } as Parameters<typeof adminService.createUser>[0]);
      setCreateOpen(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', contactNumber: '', roleId: '', departmentId: '' });
      load();
    } catch { setError('Failed to create user'); }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminService.updateUserStatus(user.id, newStatus);
      load();
    } catch { setError('Failed to update status'); }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      await adminService.deleteUser(deleteUser.id);
      setDeleteUser(null);
      load();
    } catch { setError('Failed to delete user'); }
  };

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">User Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage system users and roles</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          Add User
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <TextField
              placeholder="Search users..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              size="small" sx={{ minWidth: 260 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select value={statusFilter} label="Filter by Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="SUSPENDED">Suspended</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#1565C0' }} /></Box>
          ) : (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Joined</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{user.contactNumber}</Typography>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip label={(user.role as { roleName?: string })?.roleName?.replace('_', ' ')} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip label={user.status} size="small" color={STATUS_COLORS[user.status] || 'default'} />
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{formatDateTime(user.createdAt)}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleToggleStatus(user)} title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                            <Block fontSize="small" color={user.status === 'ACTIVE' ? 'error' : 'success'} />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteUser(user)} title="Delete user">
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              {total > 20 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination count={Math.ceil(total / 20)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleteUser)} onClose={() => setDeleteUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to permanently delete <strong>{deleteUser?.firstName} {deleteUser?.lastName}</strong>? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUser(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Contact Number" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select value={form.roleId} label="Role" onChange={(e) => setForm({ ...form, roleId: String(e.target.value) })}>
                  <MenuItem value="1">Admin</MenuItem>
                  <MenuItem value="2">Cashier</MenuItem>
                  <MenuItem value="3">Department Viewer</MenuItem>
                  <MenuItem value="4">Resident</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Department (Optional)</InputLabel>
                <Select value={form.departmentId} label="Department (Optional)" onChange={(e) => setForm({ ...form, departmentId: String(e.target.value) })}>
                  <MenuItem value="">None</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={String(d.id)}>{d.departmentName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create User</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
