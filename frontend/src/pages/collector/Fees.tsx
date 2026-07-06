import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableHead, TableBody,
  TableRow, TableCell, CircularProgress, Alert, Chip, IconButton,
  FormControl, InputLabel, Select, MenuItem, Grid, TextField,
  InputAdornment, Tooltip, Pagination,
} from '@mui/material';
import { Search, Refresh } from '@mui/icons-material';
import { adminService } from '../../services/admin.service';
import { Fee } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const PAGE_SIZE = 20;

const CollectorFees: React.FC = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [applicableFilter, setApplicableFilter] = useState('');
  const [categories, setCategories] = useState<Array<{ id: number; categoryName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [feesRes, catRes] = await Promise.all([
        adminService.getFees({
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          categoryId: categoryFilter || undefined,
          feeType: typeFilter || undefined,
          applicableTo: applicableFilter || undefined,
        }),
        adminService.getFeeCategories(),
      ]);
      if (feesRes.data) {
        setFees(feesRes.data);
        setTotal(feesRes.meta?.total || feesRes.data.length);
      }
      if (catRes.data) setCategories(catRes.data);
    } catch {
      setError('Failed to load fees');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, typeFilter, applicableFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCategoryFilter = (val: string) => {
    setCategoryFilter(val);
    setPage(1);
  };

  const handleTypeFilter = (val: string) => {
    setTypeFilter(val);
    setPage(1);
  };

  const handleApplicableFilter = (val: string) => {
    setApplicableFilter(val);
    setPage(1);
  };

  const feeTypeColor: Record<string, 'default' | 'primary' | 'secondary' | 'info' | 'warning'> = {
    FIXED: 'primary',
    VARIABLE: 'secondary',
    PERCENTAGE: 'info',
    TIERED: 'warning',
  };

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">
            Fee Reference
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View all available fees · {total} total fees
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* Filters row */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
            <TextField
              size="small"
              placeholder="Search fee name or description…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{ flex: 1, minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => handleCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.categoryName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => handleTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="FIXED">Fixed</MenuItem>
                <MenuItem value="VARIABLE">Variable</MenuItem>
                <MenuItem value="PERCENTAGE">Percentage</MenuItem>
                <MenuItem value="TIERED">Tiered</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Applies To</InputLabel>
              <Select
                value={applicableFilter}
                label="Applies To"
                onChange={(e) => handleApplicableFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                <MenuItem value="BUSINESS">Business</MenuItem>
                <MenuItem value="BOTH">Both</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Refresh">
              <IconButton onClick={() => load()} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress sx={{ color: '#1565C0' }} />
            </Box>
          ) : (
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
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fees.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          align="center"
                          sx={{ py: 5, color: '#9E9E9E' }}
                        >
                          No fees found matching your filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      fees.map((fee) => (
                        <TableRow key={fee.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {fee.feeName}
                            </Typography>
                            {fee.description && (
                              <Typography variant="caption" color="text.secondary">
                                {fee.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              sx={{
                                bgcolor: '#E3F2FD',
                                color: '#1565C0',
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                fontWeight: 600,
                                fontSize: 11,
                              }}
                            >
                              {fee.category?.categoryName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={fee.feeType}
                              size="small"
                              color={feeTypeColor[fee.feeType] || 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {fee.feeType === 'FIXED' &&
                                fee.baseAmount &&
                                formatCurrency(fee.baseAmount)}
                              {fee.feeType === 'PERCENTAGE' &&
                                fee.percentageRate &&
                                `${fee.percentageRate}%`}
                              {fee.feeType === 'VARIABLE' &&
                                fee.baseAmount &&
                                `${formatCurrency(fee.baseAmount)} + ${formatCurrency(fee.unitRate || 0)}/${fee.unitName}`}
                              {fee.feeType === 'TIERED' && 'Tiered'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={fee.applicableTo} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={fee.active ? 'Active' : 'Inactive'}
                              size="small"
                              color={fee.active ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
              {total > PAGE_SIZE && (
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={2}
                >
                  <Typography variant="caption" color="text.secondary">
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, total)} of {total}
                  </Typography>
                  <Pagination
                    count={Math.ceil(total / PAGE_SIZE)}
                    page={page}
                    onChange={(_, p) => setPage(p)}
                    color="primary"
                    size="small"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CollectorFees;
