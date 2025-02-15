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
import AddSupplierForm from './AddSupplierForm';
import EditSupplierForm from './EditSupplierForm';
import ExportImport from '../common/ExportImport';

const SupplierList = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingSupplier, setEditingSupplier] = useState(null);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/suppliers');
            // console.log('API Response:', response);
            if (response.data) {
                setSuppliers(response.data);
            } else {
                setError('No data received from server');
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            setError(error.message || 'Error fetching suppliers');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async(id) => {
        try {
            await api.delete(`/suppliers/${id}`);
            fetchSuppliers();
        } catch (error) {
            console.error('Error deleting supplier:', error);
            setError(error.message || 'Error deleting supplier');
        }
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
    };

    const handleSupplierUpdated = (updatedSupplier) => {
        setSuppliers(suppliers.map(s =>
            s.id === updatedSupplier.id ? updatedSupplier : s
        ));
    };

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!suppliers || suppliers.length === 0) {
        return <Alert severity="info">No suppliers found</Alert>;
    }

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Suppliers List
            </Typography>
            <ExportImport
                type="suppliers"
                onImportSuccess={fetchSuppliers}
            />
            <AddSupplierForm onSuppliersAdded={(newSupplier) => {
                setSuppliers([...suppliers, newSupplier]);
            }} />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {suppliers.map((supplier) => {
                            return (<TableRow key={supplier.id}>
                                <TableCell>{supplier.name}</TableCell>
                                <TableCell>{supplier.email}</TableCell>
                                <TableCell>{supplier.phone}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEdit(supplier)}>
                                        <Edit />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(supplier.id)}>
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>);
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            {editingSupplier && (
                <EditSupplierForm
                    supplier={editingSupplier}
                    onSupplierUpdated={handleSupplierUpdated}
                    onClose={() => setEditingSupplier(null)}
                />
            )}
        </Box>
    );
};

export default SupplierList;