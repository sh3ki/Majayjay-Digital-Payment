import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableHead, TableBody,
  TableRow, TableCell, CircularProgress, Alert, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Grid, Switch, Pagination,
  InputAdornment, Tooltip,
} from '@mui/material';
import { Add, Edit, Search, Refresh, Delete } from '@mui/icons-material';
import { adminService } from '../../services/admin.service';
import { Fee } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const PAGE_SIZE = 20;

const Fees: React.FC = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [applicableFilter, setApplicableFilter] = useState('');
  const [categories, setCategories] = useState<Array<{ id: number; categoryName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editFee, setEditFee] = useState<Partial<Fee> | null>(null);
  const [deleteFeeTarget, setDeleteFeeTarget] = useState<Fee | null>(null);
  const [form, setForm] = useState({ feeName: '', description: '', categoryId: '', feeType: 'FIXED', baseAmount: '', unitName: '', unitRate: '', percentageRate: '', applicableTo: 'BOTH' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [feesRes, catRes] = await Promise.all([
        adminService.getFees({ page, limit: PAGE_SIZE, search: search || undefined, categoryId: categoryFilter || undefined, feeType: typeFilter || undefined, applicableTo: applicableFilter || undefined }),
        adminService.getFeeCategories(),
      ]);
      if (feesRes.data) { setFees(feesRes.data); setTotal(feesRes.meta?.total || feesRes.data.length); }
      if (catRes.data) setCategories(catRes.data);
    } catch { setError('Failed to load fees'); }
    finally { setLoading(false); }
  }, [page, search, categoryFilter, typeFilter, applicableFilter]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filters change
  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleCategoryFilter = (val: string) => { setCategoryFilter(val); setPage(1); };
  const handleTypeFilter = (val: string) => { setTypeFilter(val); setPage(1); };
  const handleApplicableFilter = (val: string) => { setApplicableFilter(val); setPage(1); };

  const handleOpen = (fee?: Fee) => {
    if (fee) {
      setEditFee(fee);
      setForm({
        feeName: fee.feeName, description: fee.description || '', categoryId: String(fee.categoryId),
        feeType: fee.feeType, baseAmount: String(fee.baseAmount || ''), unitName: fee.unitName || '',
        unitRate: String(fee.unitRate || ''), percentageRate: String(fee.percentageRate || ''),
        applicableTo: fee.applicableTo,
      });
    } else {
      setEditFee(null);
      setForm({ feeName: '', description: '', categoryId: '', feeType: 'FIXED', baseAmount: '', unitName: '', unitRate: '', percentageRate: '', applicableTo: 'BOTH' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload: Partial<Fee> & { categoryId: number } = {
        feeName: form.feeName, description: form.description,
        categoryId: parseInt(form.categoryId), feeType: form.feeType as Fee['feeType'],
        baseAmount: form.baseAmount ? parseFloat(form.baseAmount) : undefined,
        unitName: form.unitName || undefined, unitRate: form.unitRate ? parseFloat(form.unitRate) : undefined,
        percentageRate: form.percentageRate ? parseFloat(form.percentageRate) : undefined,
        applicableTo: form.applicableTo as Fee['applicableTo'],
      };
      if (editFee?.id) await adminService.updateFee(editFee.id, payload);
      else await adminService.createFee(payload);
      setDialogOpen(false);
      load();
    } catch { setError('Failed to save fee'); }
  };

  const handleToggle = async (id: number) => {
    try { await adminService.toggleFeeStatus(id); load(); }
    catch { setError('Failed to toggle fee status'); }
  };

  const handleDelete = async () => {
    if (!deleteFeeTarget) return;
    try { await adminService.deleteFee(deleteFeeTarget.id); setDeleteFeeTarget(null); load(); }
    catch { setError('Failed to delete fee'); }
  };

  const feeTypeColor: Record<string, 'default' | 'primary' | 'secondary' | 'info' | 'warning'> = {
    FIXED: 'primary', VARIABLE: 'secondary', PERCENTAGE: 'info', TIERED: 'warning',
  };

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">Fee Management</Typography>
          <Typography variant="body2" color="text.secondary">Configure fee types and rates · {total} total fees</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Add Fee</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <CardContent>
          {/* Filters row */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
            <TextField
              size="small" placeholder="Search fee name or description…" value={search}
              onChange={(e) => handleSearch(e.target.value)} sx={{ flex: 1, minWidth: 220 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Category</InputLabel>
              <Select value={categoryFilter} label="Category" onChange={(e) => handleCategoryFilter(e.target.value)}>
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.categoryName}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Type</InputLabel>
              <Select value={typeFilter} label="Type" onChange={(e) => handleTypeFilter(e.target.value)}>
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="FIXED">Fixed</MenuItem>
                <MenuItem value="VARIABLE">Variable</MenuItem>
                <MenuItem value="PERCENTAGE">Percentage</MenuItem>
                <MenuItem value="TIERED">Tiered</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Applies To</InputLabel>
              <Select value={applicableFilter} label="Applies To" onChange={(e) => handleApplicableFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                <MenuItem value="BUSINESS">Business</MenuItem>
                <MenuItem value="BOTH">Both</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Refresh"><IconButton onClick={() => load()} size="small"><Refresh /></IconButton></Tooltip>
          </Box>

          {loading ? <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#1565C0' }} /></Box> : (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F5F7FA' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Fee Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount / Rate</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Applies To</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Active</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fees.length === 0 ? (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: '#9E9E9E' }}>No fees found matching your filters</TableCell></TableRow>
                    ) : fees.map((fee) => (
                      <TableRow key={fee.id} hover onClick={() => handleOpen(fee)} sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{fee.feeName}</Typography>
                          {fee.description && <Typography variant="caption" color="text.secondary">{fee.description}</Typography>}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ bgcolor: '#E3F2FD', color: '#1565C0', px: 1, py: 0.25, borderRadius: 1, fontWeight: 600, fontSize: 11 }}>
                            {fee.category?.categoryName}
                          </Typography>
                        </TableCell>
                        <TableCell><Chip label={fee.feeType} size="small" color={feeTypeColor[fee.feeType] || 'default'} /></TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {fee.feeType === 'FIXED' && fee.baseAmount && formatCurrency(fee.baseAmount)}
                            {fee.feeType === 'PERCENTAGE' && fee.percentageRate && `${fee.percentageRate}%`}
                            {fee.feeType === 'VARIABLE' && fee.baseAmount && `${formatCurrency(fee.baseAmount)} + ${formatCurrency(fee.unitRate || 0)}/${fee.unitName}`}
                            {fee.feeType === 'TIERED' && 'Tiered'}
                          </Typography>
                        </TableCell>
                        <TableCell><Chip label={fee.applicableTo} size="small" variant="outlined" /></TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Switch checked={fee.active} onChange={() => handleToggle(fee.id)} color="primary" size="small" />
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(fee)}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteFeeTarget(fee as Fee)}><Delete fontSize="small" /></IconButton></Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              {total > PAGE_SIZE && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                  </Typography>
                  <Pagination count={Math.ceil(total / PAGE_SIZE)} page={page} onChange={(_, p) => setPage(p)} color="primary" size="small" />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editFee ? 'Edit Fee' : 'Add New Fee'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Fee Name" value={form.feeName} onChange={(e) => setForm({ ...form, feeName: e.target.value })} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select value={form.categoryId} label="Category" onChange={(e) => setForm({ ...form, categoryId: String(e.target.value) })}>
                  {categories.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.categoryName}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Fee Type</InputLabel>
                <Select value={form.feeType} label="Fee Type" onChange={(e) => setForm({ ...form, feeType: e.target.value })}>
                  <MenuItem value="FIXED">Fixed Amount</MenuItem>
                  <MenuItem value="VARIABLE">Variable (Unit-Based)</MenuItem>
                  <MenuItem value="PERCENTAGE">Percentage</MenuItem>
                  <MenuItem value="TIERED">Tiered</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {(form.feeType === 'FIXED' || form.feeType === 'VARIABLE') && (
              <Grid item xs={6}><TextField fullWidth label="Base Amount (₱)" type="number" value={form.baseAmount} onChange={(e) => setForm({ ...form, baseAmount: e.target.value })} inputProps={{ min: 0, step: 0.01 }} /></Grid>
            )}
            {form.feeType === 'VARIABLE' && (
              <>
                <Grid item xs={6}><TextField fullWidth label="Unit Name (e.g. Cubic Meter)" value={form.unitName} onChange={(e) => setForm({ ...form, unitName: e.target.value })} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Unit Rate (₱)" type="number" value={form.unitRate} onChange={(e) => setForm({ ...form, unitRate: e.target.value })} inputProps={{ min: 0, step: 0.01 }} /></Grid>
              </>
            )}
            {form.feeType === 'PERCENTAGE' && (
              <Grid item xs={6}><TextField fullWidth label="Percentage Rate (%)" type="number" value={form.percentageRate} onChange={(e) => setForm({ ...form, percentageRate: e.target.value })} inputProps={{ min: 0, max: 100, step: 0.01 }} /></Grid>
            )}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Applicable To</InputLabel>
                <Select value={form.applicableTo} label="Applicable To" onChange={(e) => setForm({ ...form, applicableTo: e.target.value })}>
                  <MenuItem value="BOTH">Both</MenuItem>
                  <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                  <MenuItem value="BUSINESS">Business</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.feeName || !form.categoryId}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteFeeTarget)} onClose={() => setDeleteFeeTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Fee</DialogTitle>
        <DialogContent>
          <Typography>Permanently delete <strong>{deleteFeeTarget?.feeName}</strong>? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFeeTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Fees;
