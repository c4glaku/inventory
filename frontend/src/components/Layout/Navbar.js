import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navbar = () => {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Inventory Dashboard
                </Typography>
                <Box>
                    <Button color="inherit" component={RouterLink} to="/">
                        Dashboard
                    </Button>
                    <Button color="inherit" component={RouterLink} to="/products">
                        Products
                    </Button>
                    <Button color="inherit" component={RouterLink} to="/suppliers">
                        Suppliers
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;