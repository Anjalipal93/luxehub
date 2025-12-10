import React, { createContext, useState, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    // Set the data-theme attribute on the document element
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#10A37F' : '#007ACC', // ChatGPT green (dark) / Blue (light)
        light: darkMode ? '#34D399' : '#3B82F6',
        dark: darkMode ? '#059669' : '#1D4ED8',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: darkMode ? '#2A2A2A' : '#E5E5E5', // Dark border (dark) / Light grey (light)
        light: darkMode ? '#3A3A3A' : '#F5F5F5',
        dark: darkMode ? '#1A1A1A' : '#CCCCCC',
        contrastText: darkMode ? '#FFFFFF' : '#1A1A1A',
      },
      background: {
        default: darkMode ? '#0D0D0D' : '#FFFFFF', // ChatGPT dark / Pure white
        paper: darkMode ? '#1E1E1E' : '#F5F5F5', // ChatGPT secondary / Light grey
      },
      success: {
        main: '#22C55E',
        light: '#4ADE80',
        dark: '#16A34A',
      },
      warning: {
        main: '#F59E0B',
        light: '#FBBF24',
        dark: '#D97706',
      },
      error: {
        main: '#F43F5E',
        light: '#FB7185',
        dark: '#E11D48',
      },
      info: {
        main: darkMode ? '#10A37F' : '#007ACC',
        light: darkMode ? '#34D399' : '#3B82F6',
        dark: darkMode ? '#059669' : '#1D4ED8',
      },
      text: {
        primary: darkMode ? '#FFFFFF' : '#1A1A1A', // White (dark) / Dark grey (light)
        secondary: darkMode ? '#C8C8C8' : '#666666', // Light grey (dark) / Medium grey (light)
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 600,
            padding: '8px 20px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: darkMode
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

