import { createTheme } from '@mui/material/styles';

const commonPalette = {
    primary: {
        main: '#FF8C00',
        light: '#FFB74D',
        dark: '#F57C00',
        contrastText: '#FFFFFF'
    }
};

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        ...commonPalette,
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
        ...commonPalette,
        secondary: {
            main: '#9c27b0',
        },
        background: {
            default: '#1a2035',
            paper: '#232c43',
        },
    },
});