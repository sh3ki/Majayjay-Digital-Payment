import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableHead, TableBody,
  TableRow, TableCell, CircularProgress, Alert, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Grid, Switch,
} from '@mui/material';
import { Add, Edit, ToggleOn, ToggleOff } from '@mui/icons-material';
import { adminService } from '../../services/admin.service';
import { Fee } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const Fees: React.FC = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; categoryName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editFee, setEditFee] = useState<Partial<Fee> | null>(null);
  const [form, setForm] = useState({ feeName: '', description: '', categoryId: '', feeType: 'FIXED', baseAmount: '', unitName: '', unitRate: '', percentageRate: '', applicableTo: 'BOTH' });

  const load = async () => {
    setLoading(true);
    try {
      const [feesRes, catRes] = await Promise.all([adminService.getFees(), adminService.getFeeCategories()]);
      if (feesRes.data) setFees(feesRes.data);
      if (catRes.data) setCategories(catRes.data);
    } catch { setError('Failed to load fees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

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

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">Fee Management</Typography>
          <Typography variant="body2" color="text.secondary">Configure fee types and rates</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Add Fee</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          {loading ? <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#1565C0' }} /></Box> : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fee Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount/Rate</TableCell>
                    <TableCell>Applies To</TableCell>
                    <TableCell align="center">Active</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{fee.feeName}</Typography>
                        <Typography variant="caption" color="text.secondary">{fee.description}</Typography>
                      </TableCell>
                      <TableCell>{fee.category?.categoryName}</TableCell>
                      <TableCell><Chip label={fee.feeType} size="small" /></TableCell>
                      <TableCell>
                        {fee.feeType === 'FIXED' && fee.baseAmount && formatCurrency(fee.baseAmount)}
                        {fee.feeType === 'PERCENTAGE' && fee.percentageRate && `${fee.percentageRate}%`}
                        {fee.feeType === 'VARIABLE' && fee.baseAmount && `${formatCurrency(fee.baseAmount)} + ${formatCurrency(fee.unitRate || 0)}/${fee.unitName}`}
                      </TableCell>
                      <TableCell><Chip label={fee.applicableTo} size="small" variant="outlined" /></TableCell>
                      <TableCell align="center">
                        <Switch checked={fee.active} onChange={() => handleToggle(fee.id)} color="primary" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleOpen(fee)}><Edit fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editFee ? 'Edit Fee' : 'Add New Fee'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Fee Name" value={form.feeName} onChange={(e) => setForm({ ...form, feeName: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
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
              <Grid item xs={6}><TextField fullWidth label="Base Amount (₱)" type="number" value={form.baseAmount} onChange={(e) => setForm({ ...form, baseAmount: e.target.value })} /></Grid>
            )}
            {form.feeType === 'VARIABLE' && (
              <>
                <Grid item xs={6}><TextField fullWidth label="Unit Name (e.g. Cubic Meter)" value={form.unitName} onChange={(e) => setForm({ ...form, unitName: e.target.value })} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Unit Rate (₱)" type="number" value={form.unitRate} onChange={(e) => setForm({ ...form, unitRate: e.target.value })} /></Grid>
              </>
            )}
            {form.feeType === 'PERCENTAGE' && (
              <Grid item xs={6}><TextField fullWidth label="Percentage Rate (%)" type="number" value={form.percentageRate} onChange={(e) => setForm({ ...form, percentageRate: e.target.value })} /></Grid>
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
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Fees;
