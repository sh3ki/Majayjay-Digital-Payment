import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableHead, TableBody,
  TableRow, TableCell, CircularProgress, Alert, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Pagination, InputAdornment, Tooltip, Switch,
} from '@mui/material';
import { Add, Edit, Search, Refresh, Delete } from '@mui/icons-material';
import { adminService } from '../../services/admin.service';
import { Department } from '../../types';

const PAGE_SIZE = 15;

const Departments: React.FC = () => {
  const [allDepts, setAllDepts] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deleteDeptTarget, setDeleteDeptTarget] = useState<Department | null>(null);
  const [form, setForm] = useState({ departmentName: '', contactEmail: '', contactPhone: '', officeLocation: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getDepartments();
      if (res.data) { setAllDepts(res.data as Department[]); setTotal((res.data as Department[]).length); }
    } catch { setError('Failed to load departments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Client-side search + pagination (departments list is small, ~15 items)
  const filtered = allDepts.filter((d) =>
    !search || d.departmentName.toLowerCase().includes(search.toLowerCase()) ||
    (d.contactEmail || '').toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleOpen = (dept?: Department) => {
    if (dept) {
      setEditDept(dept);
      setForm({ departmentName: dept.departmentName, contactEmail: dept.contactEmail || '', contactPhone: dept.contactPhone || '', officeLocation: dept.officeLocation || '' });
    } else {
      setEditDept(null);
      setForm({ departmentName: '', contactEmail: '', contactPhone: '', officeLocation: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editDept?.id) await adminService.updateDepartment(editDept.id, form);
      else await adminService.createDepartment(form);
      setDialogOpen(false);
      load();
    } catch { setError('Failed to save department'); }
  };

  const handleDelete = async () => {
    if (!deleteDeptTarget) return;
    try { await adminService.deleteDepartment(deleteDeptTarget.id); setDeleteDeptTarget(null); load(); }
    catch { setError('Failed to delete department'); }
  };

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">Departments</Typography>
          <Typography variant="body2" color="text.secondary">Manage municipal departments · {total} total</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Add Department</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <CardContent>
          <Box display="flex" gap={2} mb={3} alignItems="center">
            <TextField
              size="small" placeholder="Search departments…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} sx={{ flex: 1, maxWidth: 360 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
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
                      <TableCell sx={{ fontWeight: 700 }}>Department Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Contact Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Office Location</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paged.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: '#9E9E9E' }}>
                        {search ? 'No departments match your search' : 'No departments found'}
                      </TableCell></TableRow>
                    ) : paged.map((dept) => (
                      <TableRow key={dept.id} hover onClick={() => handleOpen(dept)} sx={{ cursor: 'pointer' }}>
                        <TableCell><Typography fontWeight={600} variant="body2">{dept.departmentName}</Typography></TableCell>
                        <TableCell>{dept.contactEmail || '—'}</TableCell>
                        <TableCell>{dept.contactPhone || '—'}</TableCell>
                        <TableCell>{dept.officeLocation || '—'}</TableCell>
                        <TableCell align="center">
                          <Chip label={dept.active ? 'Active' : 'Inactive'} size="small" color={dept.active ? 'success' : 'default'} />
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(dept)}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteDeptTarget(dept)}><Delete fontSize="small" /></IconButton></Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              {filtered.length > PAGE_SIZE && (
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Pagination count={Math.ceil(filtered.length / PAGE_SIZE)} page={page} onChange={(_, p) => setPage(p)} color="primary" size="small" />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Department Name" value={form.departmentName}
                onChange={(e) => setForm({ ...form, departmentName: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Contact Email" type="email" value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Contact Phone" value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Office Location" value={form.officeLocation}
                onChange={(e) => setForm({ ...form, officeLocation: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.departmentName}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteDeptTarget)} onClose={() => setDeleteDeptTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Department</DialogTitle>
        <DialogContent>
          <Typography>Permanently delete <strong>{deleteDeptTarget?.departmentName}</strong>? Users and fees linked to this department may be affected.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDeptTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Departments;
