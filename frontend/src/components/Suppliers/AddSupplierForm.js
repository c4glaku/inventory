import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box
} from '@mui/material';
import api from '../../api/axios';
import { Add as AddIcon } from '@mui/icons-material';

const AddSupplierForm = ({ onSuppliersAdded }) => {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/suppliers', formData);
            onSuppliersAdded(response.data);
            setOpen(false);
            setFormData({ name: '', contact_name: '', email: '', phone: '', address: '' });
        } catch (error) {
            console.error('Error adding supplier:', error);
        }
    };

    return (
        <>
            <Button
                startIcon={<AddIcon />}
                color="primary"
                onClick={() => setOpen(true)}
                sx={{ mb: 2 }}
            >
                Add Supplier
            </Button>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Add New Supplier</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                                fullWidth
                                label="Name"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                margin="normal"
                                required
                        />
                        <TextField
                                fullWidth
                                label="Contact Name"
                                value={formData.contact_name}
                                onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                                margin="normal"
                                required
                        />
                        <TextField
                                fullWidth
                                label="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                margin="normal"
                                required
                        />
                        <TextField
                                fullWidth
                                label="Phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                margin="normal"
                                required
                        />
                        <TextField
                                fullWidth
                                label="Address"
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                margin="normal"
                                required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AddSupplierForm;