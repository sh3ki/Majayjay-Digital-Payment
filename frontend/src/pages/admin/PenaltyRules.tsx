import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableHead, TableBody,
  TableRow, TableCell, CircularProgress, Alert, Chip, IconButton, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Grid,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { adminService } from '../../services/admin.service';
import { PenaltyRule, Fee } from '../../types';

const PenaltyRules: React.FC = () => {
  const [rules, setRules] = useState<PenaltyRule[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<PenaltyRule | null>(null);
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

  const getFee = (feeId: number) => fees.find((f) => f.id === feeId);

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">Penalty Rules</Typography>
          <Typography variant="body2" color="text.secondary">Configure late payment penalties and surcharges</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Add Rule</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          {loading ? <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#1565C0' }} /></Box> : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fee</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Amount/Rate</TableCell>
                    <TableCell>Grace Period</TableCell>
                    <TableCell>Max Amount</TableCell>
                    <TableCell align="center">Monthly</TableCell>
                    <TableCell align="center">Active</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{getFee(rule.feeId)?.feeName || `Fee #${rule.feeId}`}</Typography></TableCell>
                      <TableCell><Chip label={rule.penaltyType} size="small" color="warning" /></TableCell>
                      <TableCell><Chip label={rule.calculationMethod} size="small" /></TableCell>
                      <TableCell>
                        {rule.calculationMethod === 'FIXED' ? `₱${rule.amountOrRate}` : `${rule.amountOrRate}%`}
                      </TableCell>
                      <TableCell>{rule.gracePeriodDays} days</TableCell>
                      <TableCell>{rule.maxPenaltyAmount ? `₱${rule.maxPenaltyAmount}` : '—'}</TableCell>
                      <TableCell align="center">
                        <Chip label={rule.applyMonthly ? 'Yes' : 'No'} size="small" color={rule.applyMonthly ? 'primary' : 'default'} />
                      </TableCell>
                      <TableCell align="center">
                        <Switch checked={rule.active} onChange={() => handleToggle(rule.id)} color="primary" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleOpen(rule)}><Edit fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#757575' }}>No penalty rules configured</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
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
    </Box>
  );
};

export default PenaltyRules;
