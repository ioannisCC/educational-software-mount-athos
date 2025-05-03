import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  IconButton,
  Badge,
} from '@mui/material';
import {
  AccountCircleOutlined as AccountCircleOutlinedIcon,
  EditOutlined as EditOutlinedIcon,
  SaveOutlined as SaveOutlinedIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  SecurityOutlined as SecurityOutlinedIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import analyticsService from '../services/analytics';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Profile = () => {
  const { currentUser, updateProfile, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    learningStyle: 'balanced',
    difficulty: 'beginner',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Fetch user data on component mount
  useEffect(() => {
    if (currentUser) {
      // Set profile form data
      setProfileData({
        displayName: currentUser.displayName || '',
        firstName: currentUser.profile?.firstName || '',
        lastName: currentUser.profile?.lastName || '',
        bio: currentUser.profile?.bio || '',
        location: currentUser.profile?.location || '',
        learningStyle: currentUser.profile?.learningPreferences?.style || 'balanced',
        difficulty: currentUser.profile?.learningPreferences?.difficulty || 'beginner',
      });
      
      // Track analytics
      analyticsService.trackPageView();
      
      // Fetch achievements
      fetchAchievements();
    } else {
      // Redirect if not logged in
      navigate('/login');
    }
  }, [currentUser, navigate]);
  
  // Fetch user achievements
  const fetchAchievements = async () => {
    try {
      const response = await apiService.get('/user/achievements');
      setAchievements(response.data || []);
    } catch (err) {
      console.error('Error fetching achievements:', err);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle profile form input change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle password form input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      // Prepare update data
      const updateData = {
        displayName: profileData.displayName,
        profile: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          bio: profileData.bio,
          location: profileData.location,
          learningPreferences: {
            style: profileData.learningStyle,
            difficulty: profileData.difficulty,
          },
        },
      };
      
      await updateProfile(updateData);
      
      setSuccess('Profile updated successfully');
      setProfileEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validate password
    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      
      setSuccess('Password changed successfully');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to log out');
    }
  };
  
  if (!currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Grid container spacing={4}>
      {/* Profile sidebar */}
      <Grid item xs={12} md={4}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
          }}
        >
          <Box sx={{ position: 'relative', mb: 3 }}>
            <Avatar
              src={currentUser.photoURL}
              alt={currentUser.displayName}
              sx={{ width: 120, height: 120, mb: 2, bgcolor: 'primary.main' }}
            >
              {currentUser.displayName?.[0] || currentUser.email?.[0] || ''}
            </Avatar>
          </Box>
          
          <Typography variant="h5" gutterBottom>
            {currentUser.displayName}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {currentUser.email}
          </Typography>
          
          {achievements.length > 0 && (
            <Box sx={{ mt: 2, width: '100%' }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Achievements ({achievements.length})
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {achievements.slice(0, 5).map((achievement) => (
                  <Tooltip key={achievement.id} title={achievement.title}>
                    <Avatar
                      src={achievement.icon}
                      alt={achievement.title}
                      variant="rounded"
                      sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                    >
                      <StarIcon fontSize="small" />
                    </Avatar>
                  </Tooltip>
                ))}
                
                {achievements.length > 5 && (
                  <Badge badgeContent={achievements.length - 5} color="primary">
                    <Avatar
                      variant="rounded"
                      sx={{ width: 40, height: 40, bgcolor: 'rgba(0, 0, 0, 0.08)' }}
                    >
                      <MoreHorizIcon fontSize="small" />
                    </Avatar>
                  </Badge>
                )}
              </Box>
            </Box>
          )}
          
          <Divider sx={{ my: 2, width: '100%' }} />
          
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => navigate('/dashboard')}
            sx={{ mb: 2 }}
          >
            View Dashboard
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </Paper>
      </Grid>
      
      {/* Profile tabs */}
      <Grid item xs={12} md={8}>
        <Paper
          elevation={0}
          sx={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mx: 3, mt: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mx: 3, mt: 3 }}>
              {success}
            </Alert>
          )}
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="profile tabs"
              centered
            >
              <Tab 
                icon={<AccountCircleOutlinedIcon />} 
                label="Profile" 
                id="profile-tab-0"
                aria-controls="profile-tabpanel-0"
              />
              <Tab 
                icon={<SecurityOutlinedIcon />} 
                label="Security" 
                id="profile-tab-1"
                aria-controls="profile-tabpanel-1"
              />
              <Tab 
                icon={<SettingsOutlinedIcon />} 
                label="Preferences" 
                id="profile-tab-2"
                aria-controls="profile-tabpanel-2"
              />
            </Tabs>
          </Box>
          
          {/* Profile Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Personal Information</Typography>
              <IconButton 
                onClick={() => setProfileEditing(!profileEditing)}
                color={profileEditing ? "primary" : "default"}
              >
                {profileEditing ? <SaveOutlinedIcon /> : <EditOutlinedIcon />}
              </IconButton>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Display Name"
                  name="displayName"
                  value={profileData.displayName}
                  onChange={handleProfileChange}
                  disabled={!profileEditing || loading}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  disabled={!profileEditing || loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  disabled={!profileEditing || loading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={profileData.location}
                  onChange={handleProfileChange}
                  disabled={!profileEditing || loading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  disabled={!profileEditing || loading}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
            
            {profileEditing && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => setProfileEditing(false)}
                  sx={{ mr: 2 }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Box>
            )}
          </TabPanel>
          
          {/* Security Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            
            <Box component="form" onSubmit={handleChangePassword}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    required
                    helperText="At least 8 characters"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmNewPassword"
                    type="password"
                    value={passwordData.confirmNewPassword}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    required
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Change Password'}
                </Button>
              </Box>
            </Box>
          </TabPanel>
          
          {/* Preferences Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Learning Preferences
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="learning-style-label">Learning Style</InputLabel>
                  <Select
                    labelId="learning-style-label"
                    id="learningStyle"
                    name="learningStyle"
                    value={profileData.learningStyle}
                    label="Learning Style"
                    onChange={handleProfileChange}
                    disabled={!profileEditing || loading}
                  >
                    <MenuItem value="visual">Visual</MenuItem>
                    <MenuItem value="textual">Textual</MenuItem>
                    <MenuItem value="interactive">Interactive</MenuItem>
                    <MenuItem value="balanced">Balanced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="difficulty-label">Difficulty</InputLabel>
                  <Select
                    labelId="difficulty-label"
                    id="difficulty"
                    name="difficulty"
                    value={profileData.difficulty}
                    label="Difficulty"
                    onChange={handleProfileChange}
                    disabled={!profileEditing || loading}
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Description of Learning Styles
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Visual
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Emphasizes images, diagrams, and spatial understanding. Content 
                      includes more graphics, maps, and visual representations.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Textual
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Focuses on text-based learning with detailed explanations, 
                      historical context, and in-depth articles.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Interactive
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Emphasizes hands-on learning through interactive elements, 
                      3D models, quizzes, and explorable content.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Balanced
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Provides a mix of all learning styles, with equal emphasis on
                      visual, textual, and interactive elements.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
            
            {!profileEditing && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={() => setProfileEditing(true)}
                  startIcon={<EditOutlinedIcon />}
                >
                  Edit Preferences
                </Button>
              </Box>
            )}
          </TabPanel>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Profile;