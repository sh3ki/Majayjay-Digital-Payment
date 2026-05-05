import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableHead, TableBody,
  TableRow, TableCell, CircularProgress, Alert, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  Pagination, InputAdornment, Tooltip, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Add, Edit, Search, Refresh, Delete } from '@mui/icons-material';
import { adminService } from '../../services/admin.service';
import { Department } from '../../types';

interface FeeCategory {
  id: number;
  categoryName: string;
  description?: string;
  departmentId?: number;
  department?: { departmentName: string };
  active?: boolean;
  _count?: { fees: number };
}

const PAGE_SIZE = 15;

const FeeCategories: React.FC = () => {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<FeeCategory | null>(null);
  const [deleteCatTarget, setDeleteCatTarget] = useState<FeeCategory | null>(null);
  const [form, setForm] = useState({ categoryName: '', description: '', departmentId: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, deptRes] = await Promise.all([
        adminService.getFeeCategories(),
        adminService.getDepartments(),
      ]);
      if (catRes.data) setCategories(catRes.data as FeeCategory[]);
      if (deptRes.data) setDepartments(deptRes.data as Department[]);
    } catch { setError('Failed to load fee categories'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Client-side filter + pagination
  const filtered = categories.filter((c) => {
    const matchSearch = !search || c.categoryName.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || String(c.departmentId) === deptFilter;
    return matchSearch && matchDept;
  });
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleOpen = (cat?: FeeCategory) => {
    if (cat) {
      setEditCat(cat);
      setForm({ categoryName: cat.categoryName, description: cat.description || '', departmentId: String(cat.departmentId || '') });
    } else {
      setEditCat(null);
      setForm({ categoryName: '', description: '', departmentId: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        categoryName: form.categoryName,
        description: form.description || undefined,
        departmentId: form.departmentId ? parseInt(form.departmentId) : undefined,
      };
      if (editCat?.id) await adminService.updateFeeCategory(editCat.id, payload);
      else await adminService.createFeeCategory(payload);
      setDialogOpen(false);
      load();
    } catch { setError('Failed to save category'); }
  };

  const handleDelete = async () => {
    if (!deleteCatTarget) return;
    try { await adminService.deleteFeeCategory(deleteCatTarget.id); setDeleteCatTarget(null); load(); }
    catch { setError('Failed to delete category'); }
  };

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">Fee Categories</Typography>
          <Typography variant="body2" color="text.secondary">Manage fee category classifications · {categories.length} total</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Add Category</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <CardContent>
          <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
            <TextField
              size="small" placeholder="Search categories…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} sx={{ flex: 1, maxWidth: 320 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Department</InputLabel>
              <Select value={deptFilter} label="Department" onChange={(e) => { setDeptFilter(e.target.value as string); setPage(1); }}>
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((d) => <MenuItem key={d.id} value={String(d.id)}>{d.departmentName}</MenuItem>)}
              </Select>
            </FormControl>
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
                      <TableCell sx={{ fontWeight: 700 }}>Category Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Fee Count</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paged.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: '#9E9E9E' }}>
                        {search || deptFilter ? 'No categories match your filters' : 'No categories found'}
                      </TableCell></TableRow>
                    ) : paged.map((cat) => (
                      <TableRow key={cat.id} hover>
                        <TableCell>
                          <Typography fontWeight={600} variant="body2">{cat.categoryName}</Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#757575', fontSize: 13 }}>{cat.description || '—'}</TableCell>
                        <TableCell>
                          {cat.department?.departmentName ? (
                            <Chip label={cat.department.departmentName} size="small" variant="outlined" color="primary" />
                          ) : '—'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={cat._count?.fees ?? '—'} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpen(cat)}><Edit fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteCatTarget(cat)}><Delete fontSize="small" /></IconButton>
                          </Tooltip>
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
        <DialogTitle>{editCat ? 'Edit Category' : 'Add Fee Category'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Category Name" value={form.categoryName}
                onChange={(e) => setForm({ ...form, categoryName: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={form.description} multiline rows={2}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Department (optional)</InputLabel>
                <Select value={form.departmentId} label="Department (optional)"
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value as string })}>
                  <MenuItem value="">No specific department</MenuItem>
                  {departments.map((d) => <MenuItem key={d.id} value={String(d.id)}>{d.departmentName}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.categoryName}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteCatTarget)} onClose={() => setDeleteCatTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Fee Category</DialogTitle>
        <DialogContent>
          <Typography>Permanently delete <strong>{deleteCatTarget?.categoryName}</strong>? All fees in this category may be affected.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCatTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeeCategories;
