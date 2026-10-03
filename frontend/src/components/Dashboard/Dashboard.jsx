import React, { useEffect, useState } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalSuppliers: 0,
        lowStock: 0,
        productData: [],
    });

    useEffect(() => {
        let active = true;
        const fetchStats = async () => {
            try {
                const [productsResponse, suppliersResponse] = await Promise.all([
                    api.get('/products'),
                    api.get('/suppliers'),
                ]);
                const products = productsResponse.data;
                const suppliers = suppliersResponse.data;
                const lowStock = products.filter(item => item.quantity <= item.min_quantity).length;
                const productData = [...products]
                    .sort((first, second) => second.quantity - first.quantity)
                    .slice(0, 5)
                    .map(item => ({
                        name: item.name.length > 15 ? `${item.name.substring(0, 15)}…` : item.name,
                        quantity: item.quantity,
                    }));

                if (active) {
                    setStats({
                        totalProducts: products.length,
                        totalSuppliers: suppliers.length,
                        lowStock,
                        productData,
                    });
                }
            } catch (error) {
                if (active && error.response?.status !== 401) {
                    console.error('Could not load dashboard data.');
                }
            }
        };

        fetchStats();
        return () => { active = false; };
    }, []);

    const summaries = [
        ['Total Products', stats.totalProducts],
        ['Total Suppliers', stats.totalSuppliers],
        ['Low Stock Items', stats.lowStock],
    ];

    return (
        <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 3 }}>
                {summaries.map(([label, value]) => (
                    <Paper key={label} sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>{label}</Typography>
                        <Typography variant="h3" color={label === 'Low Stock Items' ? 'error.main' : 'text.primary'}>
                            {value}
                        </Typography>
                    </Paper>
                ))}
            </Box>
            <Paper sx={{ p: 3, mt: 3, height: 400, maxWidth: 700 }}>
                <Typography variant="h6" gutterBottom>Top 5 Products by Quantity</Typography>
                <Box sx={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                        <BarChart data={stats.productData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="quantity" fill="#FF8C00" />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>
        </>
    );
};

export default Dashboard;
