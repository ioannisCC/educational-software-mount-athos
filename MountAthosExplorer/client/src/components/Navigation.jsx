import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  Badge,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ExpandMore,
  ExpandLess,
  History as HistoryIcon,
  Church as ChurchIcon,
  Landscape as LandscapeIcon,
  Dashboard as DashboardIcon,
  AccountCircle,
  Login as LoginIcon,
  Logout as LogoutIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const { progress } = useProgress();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moduleExpanded, setModuleExpanded] = useState(false);
  
  // Reset module expanded state when drawer closes
  useEffect(() => {
    if (!drawerOpen) {
      setModuleExpanded(false);
    }
  }, [drawerOpen]);
  
  // Calculate overall progress percentage
  const overallProgress = progress ? Math.round(
    (progress.module1 + progress.module2 + progress.module3) / 3
  ) : 0;
  
  // Handle user menu open/close
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  // Toggle drawer
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };
  
  // Toggle module expansion
  const toggleModuleExpand = () => {
    setModuleExpanded(!moduleExpanded);
  };
  
  // Handle logout
  const handleLogout = async () => {
    handleCloseUserMenu();
    await logout();
  };
  
  // Check if a route is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Main navigation items
  const mainNavItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Module 1: History & Religion', icon: <HistoryIcon />, path: '/module1' },
    { text: 'Module 2: Monasteries', icon: <ChurchIcon />, path: '/module2' },
    { text: 'Module 3: Environment', icon: <LandscapeIcon />, path: '/module3' },
  ];
  
  // Module subitems for the drawer
  const moduleSubitems = [
    { 
      module: 'module1',
      title: 'History & Religion', 
      items: [
        { text: 'Origins and Early History', path: '/module1/origins' },
        { text: 'Monastic Republic', path: '/module1/monastic-republic' },
        { text: 'Through the Ages', path: '/module1/through-ages' },
        { text: 'Religious Life', path: '/module1/religious-life' },
      ]
    },
    {
      module: 'module2',
      title: 'Monasteries & Architecture',
      items: [
        { text: 'Overview of Monasteries', path: '/module2/overview' },
        { text: 'Architectural Styles', path: '/module2/architecture' },
        { text: 'Sacred Treasures', path: '/module2/treasures' },
        { text: 'Preservation Efforts', path: '/module2/preservation' },
      ]
    },
    {
      module: 'module3',
      title: 'Natural Environment',
      items: [
        { text: 'Geography', path: '/module3/geography' },
        { text: 'Flora and Fauna', path: '/module3/flora-fauna' },
        { text: 'Mountain Paths', path: '/module3/paths' },
        { text: 'Conservation', path: '/module3/conservation' },
      ]
    }
  ];
  
  // Drawer content
  const drawerContent = (
    <Box
      sx={{ width: 280 }}
      role="presentation"
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar
          src="/images/icons/mount-athos-logo.png"
          alt="Mount Athos Explorer"
          sx={{ width: 80, height: 80, mb: 2 }}
        />
        <Typography variant="h6" component="div" sx={{ fontWeight: 300 }}>
          Mount Athos Explorer
        </Typography>
        {currentUser && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Welcome, {currentUser.displayName || currentUser.email}
          </Typography>
        )}
      </Box>
      
      <Divider />
      
      <List>
        {mainNavItems.map((item, index) => (
          <React.Fragment key={item.text}>
            {index === 1 ? (
              <>
                <ListItem 
                  button 
                  onClick={toggleModuleExpand}
                  sx={{ 
                    bgcolor: moduleExpanded ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                  }}
                >
                  <ListItemIcon>
                    <HistoryIcon color={isActive('/module1') ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Learning Modules"
                    primaryTypographyProps={{
                      color: moduleExpanded ? 'primary' : 'inherit',
                    }}
                  />
                  {moduleExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                
                <Collapse in={moduleExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {moduleSubitems.map((moduleItem) => (
                      <React.Fragment key={moduleItem.module}>
                        <ListItem 
                          sx={{ pl: 4, py: 0.5 }}
                          component={RouterLink}
                          to={`/${moduleItem.module}`}
                          onClick={toggleDrawer(false)}
                        >
                          <ListItemText 
                            primary={moduleItem.title} 
                            primaryTypographyProps={{
                              variant: 'subtitle2',
                              color: isActive(`/${moduleItem.module}`) ? 'primary' : 'inherit',
                            }}
                          />
                          {progress && progress[moduleItem.module] > 0 && (
                            <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                {progress[moduleItem.module]}%
                              </Typography>
                            </Box>
                          )}
                        </ListItem>
                        
                        {moduleItem.items.map((subItem) => (
                          <ListItem 
                            button 
                            key={subItem.text}
                            sx={{ pl: 6, py: 0.5 }}
                            component={RouterLink}
                            to={subItem.path}
                            onClick={toggleDrawer(false)}
                            selected={isActive(subItem.path)}
                          >
                            <ListItemText 
                              primary={subItem.text} 
                              primaryTypographyProps={{
                                variant: 'body2',
                                color: isActive(subItem.path) ? 'primary' : 'text.secondary',
                              }}
                            />
                          </ListItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : index > 1 ? null : (
              <ListItem 
                button 
                component={RouterLink}
                to={item.path}
                onClick={toggleDrawer(false)}
                selected={isActive(item.path)}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            )}
          </React.Fragment>
        ))}
      </List>
      
      <Divider />
      
      <List>
        {!currentUser ? (
          <ListItem 
            button 
            component={RouterLink} 
            to="/login"
            onClick={toggleDrawer(false)}
          >
            <ListItemIcon>
              <LoginIcon />
            </ListItemIcon>
            <ListItemText primary="Login" />
          </ListItem>
        ) : (
          <>
            <ListItem 
              button 
              component={RouterLink} 
              to="/profile"
              onClick={toggleDrawer(false)}
            >
              <ListItemIcon>
                <AccountCircle />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );
  
  return (
    <>
      <AppBar position="sticky">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Mobile menu icon */}
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            {/* Logo & Title */}
            <Avatar 
              src="/images/icons/mount-athos-logo.png"
              alt="Mount Athos Explorer"
              sx={{ 
                display: { xs: 'none', md: 'flex' }, 
                mr: 1,
                width: 32,
                height: 32
              }}
            />
            <Typography
              variant="h6"
              noWrap
              component={RouterLink}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontWeight: 300,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              Mount Athos Explorer
            </Typography>
            
            {/* Mobile title */}
            <Typography
              variant="h6"
              noWrap
              component={RouterLink}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontWeight: 300,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              Mount Athos
            </Typography>
            
            {/* Desktop navigation buttons */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {!isMobile && mainNavItems.map((item, index) => (
                <React.Fragment key={item.text}>
                  {index > 0 && index < 4 ? (
                    <Box 
                      sx={{ 
                        position: 'relative',
                        mx: 0.5
                      }}
                    >
                      <Button
                        component={RouterLink}
                        to={item.path}
                        sx={{
                          color: isActive(item.path) ? 'primary.main' : 'inherit',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                        startIcon={item.icon}
                      >
                        {item.text}
                      </Button>
                      
                      {progress && progress[`module${index}`] > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 8,
                            right: 8,
                            height: 2,
                            bgcolor: 'primary.main',
                            borderRadius: 2,
                            transform: `scaleX(${progress[`module${index}`] / 100})`,
                            transformOrigin: 'left',
                            transition: 'transform 0.5s ease',
                          }}
                        />
                      )}
                    </Box>
                  ) : index === 0 ? (
                    <Button
                      component={RouterLink}
                      to={item.path}
                      sx={{
                        color: isActive(item.path) ? 'primary.main' : 'inherit',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                      startIcon={item.icon}
                    >
                      {item.text}
                    </Button>
                  ) : null}
                </React.Fragment>
              ))}
            </Box>
            
            {/* Progress badge (only for logged in users) */}
            {currentUser && (
              <Box sx={{ flexGrow: 0, mr: 2 }}>
                <Tooltip title="Your overall progress">
                  <Badge
                    badgeContent={`${overallProgress}%`}
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.7rem',
                        height: 22,
                        minWidth: 40,
                        borderRadius: 11,
                      },
                    }}
                  >
                    <Button
                      component={RouterLink}
                      to="/dashboard"
                      variant="outlined"
                      size="small"
                      sx={{ 
                        borderRadius: 4,
                        borderColor: 'rgba(0, 0, 0, 0.23)',
                        color: 'inherit',
                      }}
                    >
                      Progress
                    </Button>
                  </Badge>
                </Tooltip>
              </Box>
            )}
            
            {/* User menu */}
            <Box sx={{ flexGrow: 0 }}>
              {!currentUser ? (
                <Button
                  component={RouterLink}
                  to="/login"
                  sx={{ color: 'inherit' }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Login
                </Button>
              ) : (
                <>
                  <Tooltip title="Account settings">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                      <Avatar 
                        alt={currentUser.displayName || currentUser.email} 
                        src={currentUser.photoURL}
                        sx={{ bgcolor: 'primary.main' }}
                      >
                        {!currentUser.photoURL && (currentUser.displayName?.[0] || currentUser.email?.[0] || '').toUpperCase()}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    sx={{ mt: '45px' }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        bgcolor: 'background.paper',
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))',
                        mt: 1.5,
                      },
                    }}
                  >
                    <MenuItem
                      component={RouterLink}
                      to="/profile"
                      onClick={handleCloseUserMenu}
                    >
                      <AccountCircle sx={{ mr: 1 }} />
                      <Typography textAlign="center">Profile</Typography>
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 1 }} />
                      <Typography textAlign="center">Logout</Typography>
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      {/* Drawer for mobile navigation */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Navigation;