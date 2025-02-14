import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#FF8C00',
        },
        secondary: {
            main: '#1a237e',
        },
        background: {
            default: '#f5f5f5',
            paper: '#ffffff',
        },
    },
});

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#FF8C00',
        },
        secondary: {
            main: '#9c27b0',
        },
        background: {
            default: '#1a2035',
            paper: '#232c43',
        },
    },
});