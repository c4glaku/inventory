import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Alert, Paper, TextField, Button, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import api from '../../api/axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();

    const handleSubmit = async event => {
        event.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const { data } = await api.post('/auth/login', { username, password });
            login(data.user);
            navigate('/', { replace: true });
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to sign in. Check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '70vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: theme.palette.background.default,
            }}
        >
            <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', mx: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
                    Sign In
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField
                        fullWidth
                        label="Username"
                        value={username}
                        onChange={event => setUsername(event.target.value)}
                        margin="normal"
                        required
                        autoFocus
                        autoComplete="username"
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        margin="normal"
                        required
                        autoComplete="current-password"
                    />
                    <Button type="submit" fullWidth variant="contained" disabled={submitting} sx={{ mt: 3 }}>
                        {submitting ? 'Signing in…' : 'Sign In'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default Login;
