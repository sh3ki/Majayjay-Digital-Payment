import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  Alert, FormControl, InputLabel, Select, MenuItem, Autocomplete,
  Table, TableHead, TableBody, TableRow, TableCell, IconButton, Divider,
  CircularProgress,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { adminService } from '../services/admin.service';
import { billsService } from '../services/bills.service';
import { Fee } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BillItem {
  feeId: number;
  fee: Fee;
  quantity: number;
  overrideAmount?: number;
}

interface PayerOption {
  id: number;
  label: string;
  email: string;
}

const CreateBill: React.FC = () => {
  const navigate = useNavigate();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payers, setPayers] = useState<PayerOption[]>([]);
  const [selectedPayer, setSelectedPayer] = useState<PayerOption | null>(null);
  const [billType, setBillType] = useState('INDIVIDUAL');
  const [dueDate, setDueDate] = useState('');
  const [billingPeriodStart, setBillingPeriodStart] = useState('');
  const [billingPeriodEnd, setBillingPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<BillItem[]>([]);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payerSearch, setPayerSearch] = useState('');

  useEffect(() => {
    adminService.getFees().then((r) => {
      if (r.data) setFees((r.data as Fee[]).filter((f) => f.active));
    });
  }, []);

  useEffect(() => {
    if (payerSearch.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const res = await adminService.getUsers({ search: payerSearch, limit: 20 });
        if (res.data) {
          setPayers((res.data as Array<{ id: number; firstName: string; lastName: string; email: string }>).map((u) => ({
            id: u.id,
            label: `${u.firstName} ${u.lastName}`,
            email: u.email,
          })));
        }
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [payerSearch]);

  const addItem = () => {
    if (!selectedFee) return;
    if (items.find((i) => i.feeId === selectedFee.id)) return;
    setItems([...items, { feeId: selectedFee.id, fee: selectedFee, quantity: 1 }]);
    setSelectedFee(null);
  };

  const removeItem = (feeId: number) => setItems(items.filter((i) => i.feeId !== feeId));

  const updateItem = (feeId: number, field: 'quantity' | 'overrideAmount', value: number) => {
    setItems(items.map((i) => i.feeId === feeId ? { ...i, [field]: value } : i));
  };

  const calcItemAmount = (item: BillItem): number => {
    if (item.overrideAmount) return item.overrideAmount;
    const fee = item.fee;
    if (fee.feeType === 'FIXED') return parseFloat(String(fee.baseAmount || 0));
    if (fee.feeType === 'VARIABLE') return parseFloat(String(fee.baseAmount || 0)) + item.quantity * parseFloat(String(fee.unitRate || 0));
    if (fee.feeType === 'PERCENTAGE') return 0;
    return 0;
  };

  const total = items.reduce((s, i) => s + calcItemAmount(i), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayer) { setError('Please select a payer'); return; }
    if (items.length === 0) { setError('Add at least one fee item'); return; }
    setLoading(true);
    setError('');
    try {
      await billsService.createBill({
        payerId: selectedPayer.id,
        billType: billType as 'INDIVIDUAL' | 'BUSINESS',
        dueDate,
        billingPeriodStart: billingPeriodStart || undefined,
        billingPeriodEnd: billingPeriodEnd || undefined,
        notes: notes || undefined,
        items: items.map((i) => ({
          feeId: i.feeId,
          unitCount: i.quantity,
          overrideAmount: i.overrideAmount,
        })),
      });
      navigate('/bills');
    } catch {
      setError('Failed to create bill. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#004D2E">Create Bill</Typography>
          <Typography variant="body2" color="text.secondary">Generate a new bill for a payer</Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/bills')}>Cancel</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} color="#004D2E" mb={2}>Payer Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={payers}
                      value={selectedPayer}
                      onChange={(_, v) => setSelectedPayer(v)}
                      onInputChange={(_, v) => setPayerSearch(v)}
                      getOptionLabel={(o) => `${o.label} (${o.email})`}
                      renderInput={(params) => <TextField {...params} label="Search Payer" required />}
                      noOptionsText="Type to search payers..."
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Bill Type</InputLabel>
                      <Select value={billType} label="Bill Type" onChange={(e) => setBillType(e.target.value)}>
                        <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                        <MenuItem value="BUSINESS">Business</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Due Date" type="date" value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)} InputLabelProps={{ shrink: true }} required />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Billing Period Start" type="date" value={billingPeriodStart}
                      onChange={(e) => setBillingPeriodStart(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Billing Period End" type="date" value={billingPeriodEnd}
                      onChange={(e) => setBillingPeriodEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Notes (Optional)" multiline rows={2} value={notes}
                      onChange={(e) => setNotes(e.target.value)} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} color="#004D2E" mb={2}>Fee Items</Typography>
                <Box display="flex" gap={1} mb={2}>
                  <Autocomplete
                    sx={{ flex: 1 }}
                    options={fees.filter((f) => !items.find((i) => i.feeId === f.id))}
                    value={selectedFee}
                    onChange={(_, v) => setSelectedFee(v)}
                    getOptionLabel={(f) => `${f.feeName} (${f.feeType})`}
                    renderInput={(params) => <TextField {...params} label="Select Fee" size="small" />}
                  />
                  <Button variant="contained" startIcon={<Add />} onClick={addItem} disabled={!selectedFee}>Add</Button>
                </Box>

                {items.length > 0 && (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fee</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Qty/Units</TableCell>
                        <TableCell>Override (₱)</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.feeId}>
                          <TableCell>{item.fee.feeName}</TableCell>
                          <TableCell>{item.fee.feeType}</TableCell>
                          <TableCell>
                            {item.fee.feeType === 'VARIABLE' ? (
                              <TextField size="small" type="number" value={item.quantity} sx={{ width: 70 }}
                                onChange={(e) => updateItem(item.feeId, 'quantity', parseFloat(e.target.value) || 1)}
                                inputProps={{ min: 0, step: 0.01 }} />
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <TextField size="small" type="number" value={item.overrideAmount || ''}
                              sx={{ width: 90 }} placeholder="Auto"
                              onChange={(e) => updateItem(item.feeId, 'overrideAmount', parseFloat(e.target.value))}
                              inputProps={{ min: 0, step: 0.01 }} />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatCurrency(calcItemAmount(item))}
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => removeItem(item.feeId)} color="error">
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {items.length === 0 && (
                  <Typography color="text.secondary" textAlign="center" py={3}>No fee items added yet</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ position: 'sticky', top: 16 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} color="#004D2E" mb={2}>Summary</Typography>
                {items.map((item) => (
                  <Box key={item.feeId} display="flex" justifyContent="space-between" py={0.5}>
                    <Typography variant="body2">{item.fee.feeName}</Typography>
                    <Typography variant="body2">{formatCurrency(calcItemAmount(item))}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1.5 }} />
                <Box display="flex" justifyContent="space-between" mb={3}>
                  <Typography fontWeight={700} variant="h6">Total</Typography>
                  <Typography fontWeight={700} variant="h6" color="#00873E">{formatCurrency(total)}</Typography>
                </Box>
                <Button
                  type="submit" variant="contained" fullWidth size="large"
                  disabled={loading || items.length === 0 || !selectedPayer || !dueDate}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {loading ? 'Creating...' : 'Create Bill'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default CreateBill;
