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
import AddProductForm from './AddProductForm';
import EditProductForm from './EditProductForm';
import ExportImport from '../common/ExportImport';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/products');
            // console.log('API Response:', response); // for debugging purposes
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

    const handleEdit = (product) => {
        console.log('Editing product:', product);
        setEditingProduct(product);
    };

    const handleProductUpdated = (updatedProduct) => {
        setProducts(products.map(p => 
            p.id === updatedProduct.id ? updatedProduct : p
        ));
    };

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box position="static" height="800px">
            <Typography variant="h5" gutterBottom>
                Products List
            </Typography>
            <ExportImport
                type="products"
                onImportSuccess={fetchProducts}
            />
            <AddProductForm onProductsAdded={(newProduct) => {
                setProducts([...products, newProduct]);
            }} />
            {(!products || products.length === 0) ? (
                <Alert severity="info">No products found</Alert>
            ) : (
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
                                        <IconButton onClick={() => handleEdit(product)}>
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
            )}
            {editingProduct && (
                <EditProductForm
                    product={editingProduct}
                    open={Boolean(editingProduct)}
                    onProductUpdated={handleProductUpdated}
                    onClose={() => setEditingProduct(null)}
                />
            )}
        </Box>
    );
};

export default ProductList;