import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useTheme } from '@context/ThemeContext';
import { userAPI, authAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { Switch } from '@components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import {
  ArrowLeft,
  Camera,
  Loader2,
  Save,
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  Check,
  X,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef(null);

  // Profile state
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    statusMessage: user?.statusMessage || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Avatar state
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Settings state
  const [settings, setSettings] = useState(user?.settings || {
    notifications: { sound: true, desktop: true },
    privacy: { showLastSeen: true, showStatus: true }
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  };

  // Handle avatar upload
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setProfileError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result);
    reader.readAsDataURL(file);

    // Upload
    try {
      setAvatarLoading(true);
      setProfileError('');

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await userAPI.updateAvatar(formData);

      if (response.data.success) {
        updateUser({ ...user, avatar: response.data.data.avatar });
        setAvatarPreview(null);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      setProfileError(err.response?.data?.message || 'Failed to upload avatar');
      setAvatarPreview(null);
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handle profile update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!profileData.username.trim()) {
      setProfileError('Username is required');
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError('');

      const response = await userAPI.updateProfile({
        username: profileData.username.trim(),
        statusMessage: profileData.statusMessage.trim()
      });

      if (response.data.success) {
        updateUser(response.data.data);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError('');

      const response = await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordSuccess(true);
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle settings update
  const handleSettingsChange = async (category, key, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };

    setSettings(newSettings);

    try {
      setSettingsLoading(true);
      const response = await userAPI.updateProfile({ settings: newSettings });
      if (response.data.success) {
        updateUser(response.data.data);
      }
    } catch (err) {
      console.error('Settings update error:', err);
      // Revert on error
      setSettings(settings);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Handle theme change
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details and avatar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarPreview || user?.avatar} />
                      <AvatarFallback className="text-2xl">
                        {getInitials(user?.username)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <button
                      onClick={handleAvatarClick}
                      disabled={avatarLoading}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {avatarLoading ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click to upload a new photo
                  </p>
                </div>

                {/* Success/Error Messages */}
                {profileSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-600">
                    <Check className="h-4 w-4" />
                    Profile updated successfully
                  </div>
                )}

                {profileError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
                    <X className="h-4 w-4" />
                    {profileError}
                  </div>
                )}

                {/* Profile Form */}
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="statusMessage">Status Message</Label>
                    <Textarea
                      id="statusMessage"
                      value={profileData.statusMessage}
                      onChange={(e) => setProfileData(prev => ({ ...prev, statusMessage: e.target.value }))}
                      placeholder="What's on your mind?"
                      maxLength={100}
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {profileData.statusMessage.length}/100
                    </p>
                  </div>

                  <Button type="submit" disabled={profileLoading}>
                    {profileLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 mb-4 bg-green-500/10 border border-green-500/20 rounded-md text-green-600">
                    <Check className="h-4 w-4" />
                    Password changed successfully
                  </div>
                )}

                {passwordError && (
                  <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
                    <X className="h-4 w-4" />
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy
                </CardTitle>
                <CardDescription>
                  Control who can see your information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Last Seen</p>
                    <p className="text-sm text-muted-foreground">
                      Let others see when you were last online
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy?.showLastSeen}
                    onCheckedChange={(checked) => handleSettingsChange('privacy', 'showLastSeen', checked)}
                    disabled={settingsLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Online Status</p>
                    <p className="text-sm text-muted-foreground">
                      Let others see when you're online
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy?.showStatus}
                    onCheckedChange={(checked) => handleSettingsChange('privacy', 'showStatus', checked)}
                    disabled={settingsLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sound Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Play a sound for new messages
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications?.sound}
                    onCheckedChange={(checked) => handleSettingsChange('notifications', 'sound', checked)}
                    disabled={settingsLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Desktop Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Show desktop notifications for new messages
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications?.desktop}
                    onCheckedChange={(checked) => handleSettingsChange('notifications', 'desktop', checked)}
                    disabled={settingsLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Choose your preferred theme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      theme === 'light' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="p-3 bg-white border rounded-full shadow-sm">
                      <Sun className="h-6 w-6 text-yellow-500" />
                    </div>
                    <span className="font-medium">Light</span>
                  </button>

                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      theme === 'dark' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="p-3 bg-gray-900 border border-gray-700 rounded-full">
                      <Moon className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="font-medium">Dark</span>
                  </button>

                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      theme === 'system' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="p-3 bg-gradient-to-br from-white to-gray-900 border rounded-full">
                      <Monitor className="h-6 w-6 text-gray-500" />
                    </div>
                    <span className="font-medium">System</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Member since</p>
                    <p className="font-medium">
                      {user?.createdAt 
                        ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="destructive" onClick={logout}>
                    Log Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;