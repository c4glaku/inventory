import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Paper,
    IconButton,
    CircularProgress,
    Alert,
    Box
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import api from '../../api/axios';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/products');
            console.log('API Response:', response); // for debugging purposes
            if (response.data) {
                setProducts(response.data);
            } else {
                setError('No data received from server');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(error.message || 'Error fetching products');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async(id) => {
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            setError(error.message || 'Error deleting product');
        }
    };

    /* const handlePost = async(id) => {
        try {
            await api.post(`/products/${id}`);
            fetchProducts();
        } catch (error) {
            console.error('Error updating product');
            setError(error.message || 'Error updating product');
        }
    } */

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!products || products.length === 0) {
        return <Alert severity="info">No products found</Alert>;
    }

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Products List
            </Typography>
                <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>SKU</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Unit Price</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {products.map((product) => {
                            return (
                                <TableRow key={product.id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.sku}</TableCell>
                                <TableCell>{product.quantity}</TableCell>
                                <TableCell>{product.unit_price}</TableCell>
                                <TableCell>
                                    <IconButton>
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(product.id)}>
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                            ) 
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ProductList;