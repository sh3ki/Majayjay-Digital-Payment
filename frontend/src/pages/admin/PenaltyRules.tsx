import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableHead, TableBody,
  TableRow, TableCell, CircularProgress, Alert, Chip, IconButton, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Grid, Pagination,
  InputAdornment, Tooltip,
} from '@mui/material';
import { Add, Edit, Search, Refresh, Delete } from '@mui/icons-material';
import { adminService } from '../../services/admin.service';
import { PenaltyRule, Fee } from '../../types';

const PAGE_SIZE = 15;

const PenaltyRules: React.FC = () => {
  const [rules, setRules] = useState<PenaltyRule[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<PenaltyRule | null>(null);
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<PenaltyRule | null>(null);
  const [form, setForm] = useState({
    feeId: '', penaltyType: 'LATE', calculationMethod: 'FIXED',
    amountOrRate: '', gracePeriodDays: '0', maxPenaltyAmount: '', applyMonthly: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [rulesRes, feesRes] = await Promise.all([adminService.getPenaltyRules(), adminService.getFees()]);
      if (rulesRes.data) setRules(rulesRes.data as PenaltyRule[]);
      if (feesRes.data) setFees(feesRes.data as Fee[]);
    } catch { setError('Failed to load penalty rules'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = (rule?: PenaltyRule) => {
    if (rule) {
      setEditRule(rule);
      setForm({
        feeId: String(rule.feeId), penaltyType: rule.penaltyType,
        calculationMethod: rule.calculationMethod, amountOrRate: String(rule.amountOrRate),
        gracePeriodDays: String(rule.gracePeriodDays), maxPenaltyAmount: String(rule.maxPenaltyAmount || ''),
        applyMonthly: rule.applyMonthly,
      });
    } else {
      setEditRule(null);
      setForm({ feeId: '', penaltyType: 'LATE', calculationMethod: 'FIXED', amountOrRate: '', gracePeriodDays: '0', maxPenaltyAmount: '', applyMonthly: false });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        feeId: parseInt(form.feeId),
        penaltyType: form.penaltyType as PenaltyRule['penaltyType'],
        calculationMethod: form.calculationMethod as PenaltyRule['calculationMethod'],
        amountOrRate: parseFloat(form.amountOrRate),
        gracePeriodDays: parseInt(form.gracePeriodDays),
        maxPenaltyAmount: form.maxPenaltyAmount ? parseFloat(form.maxPenaltyAmount) : undefined,
        applyMonthly: form.applyMonthly,
      };
      if (editRule?.id) await adminService.updatePenaltyRule(editRule.id, payload);
      else await adminService.createPenaltyRule(payload);
      setDialogOpen(false);
      load();
    } catch { setError('Failed to save penalty rule'); }
  };

  const handleToggle = async (id: number) => {
    try { await adminService.togglePenaltyRuleStatus(id); load(); }
    catch { setError('Failed to toggle rule status'); }
  };

  const handleDelete = async () => {
    if (!deleteRuleTarget) return;
    try { await adminService.deletePenaltyRule(deleteRuleTarget.id); setDeleteRuleTarget(null); load(); }
    catch { setError('Failed to delete penalty rule'); }
  };

  const getFee = (feeId: number) => fees.find((f) => f.id === feeId);

  // Client-side filter + pagination
  const filtered = rules.filter((r) => {
    const feeName = getFee(r.feeId)?.feeName || '';
    const matchSearch = !search || feeName.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || r.penaltyType === typeFilter;
    return matchSearch && matchType;
  });
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">Penalty Rules</Typography>
          <Typography variant="body2" color="text.secondary">Configure late payment penalties and surcharges · {rules.length} rules</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Add Rule</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <CardContent>
          <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
            <TextField
              size="small" placeholder="Search by fee name…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} sx={{ flex: 1, maxWidth: 300 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Penalty Type</InputLabel>
              <Select value={typeFilter} label="Penalty Type" onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="LATE">Late Fee</MenuItem>
                <MenuItem value="INTEREST">Interest</MenuItem>
                <MenuItem value="SURCHARGE">Surcharge</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Refresh"><IconButton onClick={load} size="small"><Refresh /></IconButton></Tooltip>
          </Box>

          {loading ? <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#1565C0' }} /></Box> : (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F5F7FA' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Fee</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount/Rate</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Grace Period</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Max Amount</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Monthly</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Active</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paged.length === 0 ? (
                      <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: '#9E9E9E' }}>No penalty rules found</TableCell></TableRow>
                    ) : paged.map((rule) => (
                      <TableRow key={rule.id} hover onClick={() => handleOpen(rule)} sx={{ cursor: 'pointer' }}>
                        <TableCell><Typography variant="body2" fontWeight={500}>{getFee(rule.feeId)?.feeName || `Fee #${rule.feeId}`}</Typography></TableCell>
                        <TableCell><Chip label={rule.penaltyType} size="small" color="warning" /></TableCell>
                        <TableCell><Chip label={rule.calculationMethod} size="small" /></TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {rule.calculationMethod === 'FIXED' ? `₱${rule.amountOrRate}` : `${rule.amountOrRate}%`}
                        </TableCell>
                        <TableCell>{rule.gracePeriodDays} days</TableCell>
                        <TableCell>{rule.maxPenaltyAmount ? `₱${rule.maxPenaltyAmount}` : '—'}</TableCell>
                        <TableCell align="center">
                          <Chip label={rule.applyMonthly ? 'Yes' : 'No'} size="small" color={rule.applyMonthly ? 'primary' : 'default'} />
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Switch checked={rule.active} onChange={() => handleToggle(rule.id)} color="primary" size="small" />
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(rule)}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteRuleTarget(rule)}><Delete fontSize="small" /></IconButton></Tooltip>
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
        <DialogTitle>{editRule ? 'Edit Penalty Rule' : 'Add Penalty Rule'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Associated Fee</InputLabel>
                <Select value={form.feeId} label="Associated Fee" onChange={(e) => setForm({ ...form, feeId: String(e.target.value) })}>
                  {fees.map((f) => <MenuItem key={f.id} value={String(f.id)}>{f.feeName}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Penalty Type</InputLabel>
                <Select value={form.penaltyType} label="Penalty Type" onChange={(e) => setForm({ ...form, penaltyType: e.target.value })}>
                  <MenuItem value="LATE">Late Fee</MenuItem>
                  <MenuItem value="INTEREST">Interest</MenuItem>
                  <MenuItem value="SURCHARGE">Surcharge</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Calculation Method</InputLabel>
                <Select value={form.calculationMethod} label="Calculation Method" onChange={(e) => setForm({ ...form, calculationMethod: e.target.value })}>
                  <MenuItem value="FIXED">Fixed Amount</MenuItem>
                  <MenuItem value="PERCENTAGE">Percentage</MenuItem>
                  <MenuItem value="COMPOUND">Compound</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={form.calculationMethod === 'FIXED' ? 'Amount (₱)' : 'Rate (%)'}
                type="number" value={form.amountOrRate} onChange={(e) => setForm({ ...form, amountOrRate: e.target.value })} inputProps={{ min: 0, step: 0.01 }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Grace Period (days)" type="number" value={form.gracePeriodDays}
                onChange={(e) => setForm({ ...form, gracePeriodDays: e.target.value })} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Max Penalty Amount (₱, optional)" type="number" value={form.maxPenaltyAmount}
                onChange={(e) => setForm({ ...form, maxPenaltyAmount: e.target.value })} inputProps={{ min: 0, step: 0.01 }} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Apply Monthly</InputLabel>
                <Select value={form.applyMonthly ? 'yes' : 'no'} label="Apply Monthly"
                  onChange={(e) => setForm({ ...form, applyMonthly: e.target.value === 'yes' })}>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
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

      <Dialog open={Boolean(deleteRuleTarget)} onClose={() => setDeleteRuleTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Penalty Rule</DialogTitle>
        <DialogContent>
          <Typography>Permanently delete the penalty rule for <strong>{fees.find(f => f.id === deleteRuleTarget?.feeId)?.feeName || `Fee #${deleteRuleTarget?.feeId}`}</strong>? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRuleTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PenaltyRules;
