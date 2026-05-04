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
      main: '#1565C0',
      light: '#E3F2FD',
      dark: '#0D47A1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#42A5F5',
    },
    success: { main: '#4CAF50' },
    warning: { main: '#FFC107' },
    error: { main: '#F44336' },
    info: { main: '#2196F3' },
    background: { default: '#F5F5F5' },
  },
  typography: {
    fontFamily: 'Inter, Segoe UI, Roboto, sans-serif',
    h1: { fontWeight: 700, color: '#0D47A1' },
    h2: { fontWeight: 600, color: '#0D47A1' },
    h3: { fontWeight: 600, color: '#0D47A1' },
    h4: { fontWeight: 600, color: '#0D47A1' },
    body1: { color: '#424242' },
    body2: { color: '#424242' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        containedPrimary: {
          '&:hover': { backgroundColor: '#1255A8' },
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
        root: { backgroundColor: '#1565C0' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#0D47A1',
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
          '&:hover': { backgroundColor: '#E3F2FD' },
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
