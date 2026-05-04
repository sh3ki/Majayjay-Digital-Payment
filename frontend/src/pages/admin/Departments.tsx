import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableHead, TableBody,
  TableRow, TableCell, CircularProgress, Alert, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { adminService } from '../../services/admin.service';
import { Department } from '../../types';

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [form, setForm] = useState({ departmentName: '', contactEmail: '', contactPhone: '', officeLocation: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.getDepartments();
      if (res.data) setDepartments(res.data as Department[]);
    } catch { setError('Failed to load departments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = (dept?: Department) => {
    if (dept) {
      setEditDept(dept);
      setForm({
        departmentName: dept.departmentName,
        contactEmail: dept.contactEmail || '',
        contactPhone: dept.contactPhone || '',
        officeLocation: dept.officeLocation || '',
      });
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

  return (
    <Box>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={700} color="#0D47A1">Departments</Typography>
          <Typography variant="body2" color="text.secondary">Manage municipal departments</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Add Department</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          {loading ? <Box display="flex" justifyContent="center" p={4}><CircularProgress sx={{ color: '#1565C0' }} /></Box> : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Department Name</TableCell>
                    <TableCell>Contact Email</TableCell>
                    <TableCell>Contact Phone</TableCell>
                    <TableCell>Office Location</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell><Typography fontWeight={600}>{dept.departmentName}</Typography></TableCell>
                      <TableCell>{dept.contactEmail || '—'}</TableCell>
                      <TableCell>{dept.contactPhone || '—'}</TableCell>
                      <TableCell>{dept.officeLocation || '—'}</TableCell>
                      <TableCell align="center">
                        <Chip label={dept.active ? 'Active' : 'Inactive'} size="small" color={dept.active ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleOpen(dept)}><Edit fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {departments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#757575' }}>No departments found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
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
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Departments;
