import React from 'react';
import { Container, Box } from '@mui/material';
import Navbar from './Navbar';

const Layout = ({ children, darkMode, toggleDarkMode }) => {
    return (
        <Box sx={{ 
            display: 'flex',
            flexDirection: 'column', 
            minHeight: '100vh',
            bgcolor: 'background.default',
            transition: 'background-color 0.3s ease'
        }}>
            <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
                <Box
                    sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        minHeihgt: '80vh',
                        boxShadow: 3,
                        transition: 'background-color 0.3s ease'
                    }}
                >
                    {children}
                </Box>
            </Container>
        </Box>
    );
};

export default Layout;