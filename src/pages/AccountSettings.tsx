import React, { useState, useEffect } from 'react';
import { ChevronLeft, User, Bell, Shield, Globe, Smartphone, MapPin, Save, Edit, LogOut, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import EditProfile from '@/components/EditProfile';
import { ThemeToggle } from '@/components/ThemeToggle';
interface UserSettings {
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  language: string;
  currency: string;
  distance_unit: string;
  temperature_unit: string;
  privacy_level: string;
  theme: string;
}
interface SocialConnection {
  id: string;
  provider: string;
  username: string;
  connected_at: string;
}
export default function AccountSettings() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user,
    signOut
  } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    email_notifications: true,
    push_notifications: true,
    language: 'en',
    currency: 'INR',
    distance_unit: 'km',
    temperature_unit: 'celsius',
    privacy_level: 'public',
    theme: 'light'
  });
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Fetch user settings and social connections
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        setLoading(true);

        // Fetch user settings
        const {
          data: settingsData,
          error: settingsError
        } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('Error fetching settings:', settingsError);
        } else if (settingsData) {
          setSettings({
            notifications_enabled: settingsData.notifications_enabled ?? true,
            email_notifications: settingsData.email_notifications ?? true,
            push_notifications: settingsData.push_notifications ?? true,
            language: settingsData.language ?? 'en',
            currency: settingsData.currency ?? 'INR',
            distance_unit: settingsData.distance_unit ?? 'km',
            temperature_unit: settingsData.temperature_unit ?? 'celsius',
            privacy_level: settingsData.privacy_level ?? 'public',
            theme: settingsData.theme ?? 'light'
          });
        }

        // Fetch social connections
        const {
          data: connectionsData,
          error: connectionsError
        } = await supabase.from('user_social_connections').select('*').eq('user_id', user.id);
        if (connectionsError) {
          console.error('Error fetching social connections:', connectionsError);
        } else {
          setSocialConnections(connectionsData?.map(conn => ({
            id: conn.id,
            provider: conn.provider,
            username: conn.username || '',
            connected_at: conn.created_at || ''
          })) || []);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your settings',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user, toast]);
  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const saveSettings = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const {
        error
      } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        ...settings
      });
      if (error) throw error;
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  const disconnectSocialAccount = async (connectionId: string, provider: string) => {
    try {
      await supabase.from('user_social_connections').delete().eq('id', connectionId);
      setSocialConnections(prev => prev.filter(conn => conn.id !== connectionId));
      toast({
        title: "Account disconnected",
        description: `Your ${provider} account has been disconnected`
      });
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast({
        title: 'Error',
        description: `Failed to disconnect ${provider} account`,
        variant: 'destructive'
      });
    }
  };
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive'
      });
    }
  };
  if (loading) {
    return <div className="container px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded"></div>)}
          </div>
        </div>
      </div>;
  }
  return <div className="container px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Account Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start" onClick={() => setShowEditProfile(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications from the app</p>
              </div>
              <Switch checked={settings.notifications_enabled} onCheckedChange={checked => handleSettingChange('notifications_enabled', checked)} />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive email updates and newsletters</p>
              </div>
              <Switch checked={settings.email_notifications} onCheckedChange={checked => handleSettingChange('email_notifications', checked)} disabled={!settings.notifications_enabled} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
              </div>
              <Switch checked={settings.push_notifications} onCheckedChange={checked => handleSettingChange('push_notifications', checked)} disabled={!settings.notifications_enabled} />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <Select value={settings.language} onValueChange={value => handleSettingChange('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <Select value={settings.currency} onValueChange={value => handleSettingChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              
              
              
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">Profile Visibility</label>
              <Select value={settings.privacy_level} onValueChange={value => handleSettingChange('privacy_level', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Control who can see your profile and travel posts
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {socialConnections.length > 0 ? <div className="space-y-3">
                {socialConnections.map(connection => <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {connection.provider.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium capitalize">{connection.provider}</p>
                        <p className="text-sm text-muted-foreground">@{connection.username}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => disconnectSocialAccount(connection.id, connection.provider)}>
                      Disconnect
                    </Button>
                  </div>)}
              </div> : <div className="text-center py-6">
                <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No connected accounts</p>
                <p className="text-sm text-muted-foreground">Connect your social media accounts to share your travels</p>
              </div>}
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pb-20">
          <Button onClick={saveSettings} disabled={saving} className="bg-wanderblue hover:bg-wanderblue/90">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <EditProfile isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} />
    </div>;
}