import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CircularProgress, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import { lightTheme, darkTheme } from './theme/theme';

const Login = React.lazy(() => import('./components/Auth/Login'));
const Dashboard = React.lazy(() => import('./components/Dashboard/Dashboard'));
const ProductList = React.lazy(() => import('./components/Products/ProductList'));
const SupplierList = React.lazy(() => import('./components/Suppliers/SupplierList'));

function App() {
    const [darkMode, setDarkMode] = React.useState(() => {
        try {
            return JSON.parse(localStorage.getItem('darkMode')) === true;
        } catch {
            return false;
        }
    });

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    };

    return (
        <AuthProvider>
            <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
                <CssBaseline />
                <Router>
                    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                        <React.Suspense fallback={(
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                                <CircularProgress />
                            </Box>
                        )}>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                                <Route path="/products" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
                                <Route path="/suppliers" element={<ProtectedRoute><SupplierList /></ProtectedRoute>} />
                            </Routes>
                        </React.Suspense>
                    </Layout>
                </Router>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
