import React, { useState } from 'react';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Button, 
    Box,
    IconButton,
    Stack,
    Menu,
    MenuItem,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


const Navbar = ({ darkMode, toggleDarkMode }) => {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [menuAnchor, setMenuAnchor] = useState(null);

    const closeMenu = () => setMenuAnchor(null);

    const handleLogout = async () => {
        closeMenu();
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch {
            window.alert('Sign out failed. Check your connection and try again.');
        }
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" sx={{ height: '70px' }}>
                <Toolbar>
                    <Inventory2Icon sx={{ fontSize: { xs: 32, sm: 40 }, mr: { xs: 1, sm: 2 }, flexShrink: 0 }} />
                    <Typography 
                        variant="h4"
                        component="div"
                        sx={{ 
                            flexGrow: 1,
                            fontFamily: "'Montserrat', sans-serif",
                            fontWeight: 600,
                            letterSpacing: 1,
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: { xs: '1.05rem', sm: '1.4rem', md: '1.7rem', lg: '2.125rem' },
                        }}
                    >
                        Inventory Dashboard
                    </Typography>
                    <Stack direction="row" spacing={{ lg: 0.5, xl: 1 }} sx={{ display: { xs: 'none', lg: 'flex' } }}>
                        {isAuthenticated ? (
                            <>
                                <Button color="inherit" component={RouterLink} to="/">Dashboard</Button>
                                <Button color="inherit" component={RouterLink} to="/products">Products</Button>
                                <Button color="inherit" component={RouterLink} to="/suppliers">Suppliers</Button>
                                <Button color="inherit" component={RouterLink} to="/statistics">Statistics</Button>
                                <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
                                    Sign out
                                </Button>
                            </>
                        ) : (
                            <Button color="inherit" component={RouterLink} to="/login">Sign in</Button>
                        )}
                    </Stack>
                    <IconButton
                        color="inherit"
                        aria-label="Open navigation menu"
                        aria-controls={menuAnchor ? 'app-navigation-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={menuAnchor ? 'true' : undefined}
                        onClick={event => setMenuAnchor(event.currentTarget)}
                        sx={{ display: { xs: 'inline-flex', lg: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Menu
                        id="app-navigation-menu"
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={closeMenu}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        {isAuthenticated ? (
                            <>
                                <MenuItem component={RouterLink} to="/" onClick={closeMenu}>Dashboard</MenuItem>
                                <MenuItem component={RouterLink} to="/products" onClick={closeMenu}>Products</MenuItem>
                                <MenuItem component={RouterLink} to="/suppliers" onClick={closeMenu}>Suppliers</MenuItem>
                                <MenuItem component={RouterLink} to="/statistics" onClick={closeMenu}>Statistics</MenuItem>
                                <MenuItem onClick={handleLogout}>Sign out</MenuItem>
                            </>
                        ) : (
                            <MenuItem component={RouterLink} to="/login" onClick={closeMenu}>Sign in</MenuItem>
                        )}
                    </Menu>
                    <IconButton
                        color="inherit"
                        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        onClick={toggleDarkMode}
                        sx={{ ml: { xs: 0, sm: 1 } }}
                    >
                        {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
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
