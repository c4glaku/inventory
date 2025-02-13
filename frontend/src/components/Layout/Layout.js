import React from 'react';
import { Container, Box, Paper } from '@mui/material';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <Box sx={{ 
            display: 'flex',
            flexDirection: 'column', 
            minHeight: '100vh',
            bgcolor: '#f5f5f5'
        }}>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
                <Paper
                    elevation={3}
                    sx={{
                        p: 3,
                        borderRadius: 2,
                        minHeight: '80vh'
                }}>
                    {children}
                </Paper>
            </Container>
        </Box>
    );
};

export default Layout;