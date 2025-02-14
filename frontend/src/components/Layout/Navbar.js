import React from 'react';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Button, 
    Box,
    IconButton,
    Stack
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';


const Navbar = ({ darkMode, toggleDarkMode }) => {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" sx={{ height: '70px' }}>
                <Toolbar>
                    <Inventory2Icon sx={{ fontSize: 40, mr: 2 }} />
                    <Typography 
                        variant="h4"
                        component="div"
                        sx={{ 
                            flexGrow: 1,
                            fontFamily: "'Montserrat', sans-serif",
                            fontWeight: 600,
                            letterSpacing: 1
                        }}
                    >
                        Inventory Dashboard
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button color="inherit" component={RouterLink} to="/">
                            Dashboard
                        </Button>
                        <Button color="inherit" component={RouterLink} to="/products">
                            Products
                        </Button>
                        <Button color="inherit" component={RouterLink} to="/suppliers">
                            Suppliers
                        </Button>
                        <IconButton 
                            color="inherit"
                            onClick={toggleDarkMode}
                            sx={{ ml: 2 }}
                        >
                            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Stack>
                </Toolbar>
            </AppBar>
            <Box sx={{
                height: '30px',
                bgcolor: 'secondary.main',
                transition: 'background-color 0.3s ease'
            }} />
        </Box>
    );
};

export default Navbar;