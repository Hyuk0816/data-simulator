import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
// import Dashboard from './pages/Dashboard.jsx';
import CreateSimulator from './pages/CreateSimulator.jsx';
import Profile from './pages/Profile.jsx';

// Components
import PrivateRoute from './components/common/PrivateRoute.jsx';

// Theme
import theme from './theme';
import darkTheme from './theme/darkTheme';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  
  const currentTheme = useMemo(() => {
    return darkMode ? darkTheme : theme;
  }, [darkMode]);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                {/*<Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />*/}
              </PrivateRoute>
            }
          />
          <Route
            path="/create-simulator"
            element={
              <PrivateRoute>
                <CreateSimulator />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App
