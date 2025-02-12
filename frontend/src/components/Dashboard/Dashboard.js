import React, { useState, useEffect } from 'react';
import { Grid2 as Grid, Paper, Typography } from '@mui/material';
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
                const [products, suppliers] = await Promise.all([
                    api.get('/products'),
                    api.get('/suppliers'),
                ]);

                const lowStockItems = products.data.filter(
                    (product) => product.quantity <= product.min_quantity
                );

                const productData = products.Data
                    .sort((a,b) => b.quantity - a.quantity)
                    .slice(0,5)
                    .map(product => ({
                        name: product.name,
                        quantity: product.quantity
                    }));

                setStats({
                    totalProducts: products.data.length,
                    totalSuppliers: suppliers.data.length,
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
                <Paper sx={{ p:2 }}>
                    <Typography vaiant="h6">Total Products</Typography>
                    <Typography variant="h3">{stats.totalProducts}</Typography>
                </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
                <Paper sx={{ p:2 }}>
                    <Typography variant="h6">Total Suppliers</Typography>
                    <Typography variant="h3">{stats.totalSuppliers}</Typography>
                </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
                <Paper sx={{ p:2 }}>
                    <Typography variant="h6">Low Stock Items</Typography>
                    <Typography variant="h6" color="error">
                        {stats.lowStockItems}
                    </Typography>
                </Paper>
            </Grid>

            <Grid item xs={12}>
                <Paper sx={{ p:2, height: 300 }}>
                    <Typography variant="h6" gutterBottom>
                        Top 5 Products by Quantity
                    </Typography>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.productData}>
                            <CartesianGrid strokeDasharray='3 3' />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="quantity" fill="#1976d2" />
                        </BarChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>

        </Grid>
    );
};

export default Dashboard;