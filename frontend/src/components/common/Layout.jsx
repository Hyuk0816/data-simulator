import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Container, 
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { 
  Brightness4, 
  Brightness7,
  AccountCircle,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const Layout = ({ children, darkMode, setDarkMode, title = 'Dynamic API Simulator' }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    handleClose();
    navigate('/profile');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleCreateClick = () => {
    navigate('/create-simulator');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={handleDashboardClick}
          >
            {title}
          </Typography>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
            <IconButton
              color="inherit"
              onClick={handleDashboardClick}
              sx={{ 
                display: { xs: 'none', sm: 'flex' },
                flexDirection: 'column',
                gap: 0.5
              }}
            >
              <DashboardIcon />
              <Typography variant="caption">대시보드</Typography>
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={handleCreateClick}
              sx={{ 
                display: { xs: 'none', sm: 'flex' },
                flexDirection: 'column',
                gap: 0.5
              }}
            >
              <AddIcon />
              <Typography variant="caption">생성</Typography>
            </IconButton>
          </Box>

          {/* Dark Mode Toggle */}
          {setDarkMode && (
            <IconButton 
              sx={{ ml: 1 }} 
              onClick={() => setDarkMode(!darkMode)} 
              color="inherit"
            >
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          )}

          {/* User Menu */}
          <Box sx={{ ml: 2 }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  @{user.user_id}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleProfileClick}>
                <AccountCircle sx={{ mr: 2 }} />
                프로필 관리
              </MenuItem>
              {setDarkMode && (
                <MenuItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={darkMode}
                        onChange={(e) => setDarkMode(e.target.checked)}
                        size="small"
                      />
                    }
                    label="다크 모드"
                    sx={{ ml: 0 }}
                  />
                </MenuItem>
              )}
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 2 }} />
                로그아웃
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {children}
        </Container>
      </Box>

      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2025 Dynamic API Simulator. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;