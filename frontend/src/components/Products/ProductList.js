import React, { useState, useEFfect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import api from '../../api/axios';

const ProductList = () => {
    const [products, setProducts] = useState();

    useEFfect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleDelete = async(id) => {
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    return (
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
                                <IconButton onclick={() => handleDelete(product.id)}>
                                    <Delete />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                        ) 
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ProductList;