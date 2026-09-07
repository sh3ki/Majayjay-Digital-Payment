import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  Alert, Autocomplete, FormControl, InputLabel, Select, MenuItem,
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
  contactNumber?: string;
  address?: string;
  barangay?: string;
  userReference: string;
}

const CreateBill: React.FC = () => {
  const navigate = useNavigate();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payers, setPayers] = useState<PayerOption[]>([]);
  const [selectedPayer, setSelectedPayer] = useState<PayerOption | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [billingPeriodStart, setBillingPeriodStart] = useState('');
  const [billingPeriodEnd, setBillingPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<BillItem[]>([]);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payerSearch, setPayerSearch] = useState('');
  const [feeInputValue, setFeeInputValue] = useState('');
  const [debouncedFeeSearch, setDebouncedFeeSearch] = useState('');

  useEffect(() => {
    adminService.getFees({ limit: 1000 }).then((r) => {
      if (r.data) setFees((r.data as Fee[]).filter((f) => f.active));
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFeeSearch(feeInputValue), 250);
    return () => clearTimeout(timer);
  }, [feeInputValue]);

  const fuzzyFilterFees = (options: Fee[]) => {
    const query = debouncedFeeSearch.toLowerCase().trim();
    if (!query) return options;
    const words = query.split(/\s+/);
    return options.filter((f) => {
      const target = `${f.feeName} ${f.feeType}`.toLowerCase();
      return words.every((w) => target.includes(w));
    });
  };

  const categories = Array.from(
    new Map(
      fees
        .filter((fee) => fee.category)
        .map((fee) => [fee.categoryId, fee.category!])
    ).values()
  ).sort((a, b) => a.categoryName.localeCompare(b.categoryName));

  const selectableFees = fees.filter((fee) =>
    !items.find((item) => item.feeId === fee.id) &&
    (!categoryFilter || String(fee.categoryId) === categoryFilter)
  );

  useEffect(() => {
    if (payerSearch.length < 2) { setPayers([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await billsService.searchPayers(payerSearch);
        if (res.data) {
          setPayers(res.data.map((u) => ({
            id: u.id,
            label: `${u.lastName}, ${u.firstName}`,
            email: u.email,
            contactNumber: u.contactNumber,
            address: u.address,
            barangay: u.barangay,
            userReference: `${u.role?.roleName || 'resident'}-${String(u.id).padStart(3, '0')}`,
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
          <Typography variant="h4" fontWeight={700} color="#0D47A1">Create Bill</Typography>
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
                <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Payer Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={payers}
                      value={selectedPayer}
                      onChange={(_, v) => setSelectedPayer(v)}
                      onInputChange={(_, v) => setPayerSearch(v)}
                      getOptionLabel={(o) => o.label}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{ display: 'block !important', py: 1.25 }}>
                          <Typography variant="body2" fontWeight={600}>{option.label} ({option.userReference})</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.email}{option.contactNumber ? `  ${option.contactNumber}` : ''}
                          </Typography>
                          {(option.address || option.barangay) && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {[option.address, option.barangay].filter(Boolean).join(', ')}
                            </Typography>
                          )}
                        </Box>
                      )}
                      renderInput={(params) => <TextField {...params} label="Search Payer by Name" required />}
                      noOptionsText="Type to search payers..."
                    />
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
                <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Fee Items</Typography>
                <FormControl size="small" sx={{ minWidth: 220, mb: 1.5 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => {
                      const value = e.target.value;
                      setCategoryFilter(value);
                      if (selectedFee && value && String(selectedFee.categoryId) !== value) setSelectedFee(null);
                    }}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={String(category.id)}>{category.categoryName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box display="flex" gap={1} mb={2}>
                  <Autocomplete
                    sx={{ flex: 1 }}
                    options={selectableFees}
                    value={selectedFee}
                    onChange={(_, v) => setSelectedFee(v)}
                    inputValue={feeInputValue}
                    onInputChange={(_, v) => setFeeInputValue(v)}
                    getOptionLabel={(f) => `${f.feeName} (${f.feeType})`}
                    filterOptions={fuzzyFilterFees}
                    renderInput={(params) => <TextField {...params} label="Search and Select Fee" size="small" />}
                  />
                  <Button variant="contained" startIcon={<Add />} onClick={addItem} disabled={!selectedFee}>Add</Button>
                </Box>

                {items.length > 0 && (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fee</TableCell>
                        <TableCell>Applies To</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Override (₱)</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.feeId}>
                          <TableCell>{item.fee.feeName}</TableCell>
                          <TableCell>{item.fee.applicableTo}</TableCell>
                          <TableCell>{item.fee.feeType}</TableCell>
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
                <Typography variant="h6" fontWeight={600} color="#0D47A1" mb={2}>Summary</Typography>
                {items.map((item) => (
                  <Box key={item.feeId} display="flex" justifyContent="space-between" py={0.5}>
                    <Typography variant="body2">{item.fee.feeName}</Typography>
                    <Typography variant="body2">{formatCurrency(calcItemAmount(item))}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1.5 }} />
                <Box display="flex" justifyContent="space-between" mb={3}>
                  <Typography fontWeight={700} variant="h6">Total</Typography>
                  <Typography fontWeight={700} variant="h6" color="#1565C0">{formatCurrency(total)}</Typography>
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
