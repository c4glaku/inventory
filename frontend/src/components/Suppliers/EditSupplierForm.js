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

const EditSupplierForm = ({ supplier, open, onClose, onSupplierUpdated }) => {
    const [formData, setFormData] = useState({
        name: supplier.name,
        contact_name: supplier.contact_name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`/suppliers/${supplier.id}`, formData);
            onSupplierUpdated(response.data);
            onClose();
        } catch (error) {
            console.error('Error updating supplier:', error);
            alert(error.response?.data?.error || error.message || 'Error updating supplier');
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Edit Supplier</DialogTitle>
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
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained">Update</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditSupplierForm;