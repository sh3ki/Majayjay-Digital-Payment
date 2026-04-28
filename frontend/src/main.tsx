import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import App from './App';
import { store } from './store';
import './index.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#00873E',
      light: '#E8F5E9',
      dark: '#004D2E',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#26A69A',
    },
    success: { main: '#4CAF50' },
    warning: { main: '#FFC107' },
    error: { main: '#F44336' },
    info: { main: '#2196F3' },
    background: { default: '#F5F5F5' },
  },
  typography: {
    fontFamily: 'Inter, Segoe UI, Roboto, sans-serif',
    h1: { fontWeight: 700, color: '#004D2E' },
    h2: { fontWeight: 600, color: '#004D2E' },
    h3: { fontWeight: 600, color: '#004D2E' },
    h4: { fontWeight: 600, color: '#004D2E' },
    body1: { color: '#424242' },
    body2: { color: '#424242' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        containedPrimary: {
          '&:hover': { backgroundColor: '#006E33' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          '&:hover': { boxShadow: '0 4px 6px rgba(0,0,0,0.15)' },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: '#00873E' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#004D2E',
            color: '#ffffff',
            fontWeight: 600,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': { backgroundColor: '#F5F5F5' },
          '&:hover': { backgroundColor: '#E8F5E9' },
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <CssBaseline />
            <App />
          </LocalizationProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
