import React, { useState, useEffect } from 'react';
import { Grid2 as Grid, Paper, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalSuppliers: 0,
        lowStock: 0,
        productData: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [productsRes, suppliersRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/suppliers')
                ]);

                const products = productsRes.data;
                const suppliers = suppliersRes.data;

                const lowStockItems = products.filter(
                    product => product.quantity <= product.min_quantity
                );
                
                const productData = [...products]
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 5)
                    .map(product => ({
                        name: product.name.length > 15 
                            ? product.name.substring(0, 15) + '...' 
                            : product.name,
                        quantity: product.quantity
                    }));

                setStats({
                    totalProducts: products.length,
                    totalSuppliers: suppliers.length,
                    lowStock: lowStockItems.length,
                    productData
                });
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            }
        };

        fetchStats();
    }, []);

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h6" gutterBottom>Total Products</Typography>
                    <Typography variant="h3">{stats.totalProducts}</Typography>
                </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h6" gutterBottom>Total Suppliers</Typography>
                    <Typography variant="h3">{stats.totalSuppliers}</Typography>
                </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h6" gutterBottom>Low Stock Items</Typography>
                    <Typography variant="h3" color="error.main">{stats.lowStock}</Typography>
                </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 3, height: 400, width: 470 }}>
                    <Typography variant="h6" gutterBottom>
                        Top 5 Products by Quantity
                    </Typography>
                    <Box sx={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={stats.productData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    
                                    height={100}
                                />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="quantity" fill="#FF8C00" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default Dashboard;