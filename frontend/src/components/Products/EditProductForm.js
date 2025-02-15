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

const EditProductForm = ({ product, open, onClose, onProductUpdated }) => {
    const [formData, setFormData] = useState({
        name: product.name,
        description: product.description,
        sku: product.sku,
        quantity: product.quantity,
        unit_price: product.unit_price,
        supplier_id: product.supplier_id,
        min_quantity: product.min_quantity,
        max_quantity: product.max_quantity,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formattedData = {
                name: formData.name,
                description: formData.description,
                sku: formData.sku,
                quantity: parseInt(formData.quantity),
                unit_price: parseFloat(formData.unit_price),
                supplier_id: parseInt(formData.supplier_id),
                min_quantity: parseInt(formData.min_quantity),
                max_quantity: parseInt(formData.max_quantity),
            };

            if (isNaN(formattedData.quantity) ||
                isNaN(formattedData.unit_price) ||
                isNaN(formattedData.supplier_id) || 
                isNaN(formattedData.min_quantity) || 
                isNaN(formattedData.max_quantity)) {
                throw new Error('Please enter valid numbers for numeric fields');
            }

            const response = await api.put(`/products/${product.id}`, formattedData);
            onProductUpdated(response.data);
            onClose();
        } catch (error) {
            console.error('Error updating product:', error);
            alert(error.response?.data?.error || error.message || 'Error updating product');
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="SKU"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Quantity"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        margin="normal"
                        required
                        type="number"
                        slotProps={{ min: 0}}
                    />
                    <TextField
                        fullWidth
                        label="Unit Price"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                        margin="normal"
                        required
                        type="number"
                        slotProps={{ min: 0, step: 0.01 }}
                    />
                    <TextField
                        fullWidth
                        label="Supplier ID"
                        value={formData.supplier_id}
                        onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                        margin="normal"
                        required
                        type="number"
                        slotProps={{ min: 1 }}
                    />
                    <TextField
                        fullWidth
                        label="Minimum Quantity"
                        value={formData.min_quantity}
                        onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                        margin="normal"
                        required
                        type="number"
                        slotProps={{ min: 0 }}
                    />
                    <TextField
                        fullWidth
                        label="Maximum Quantity"
                        value={formData.max_quantity}
                        onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                        margin="normal"
                        required
                        type="number"
                        slotProps={{ min: 0 }}
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

export default EditProductForm;