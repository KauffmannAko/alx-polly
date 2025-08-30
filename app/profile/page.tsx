'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

function ProfilePage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    bio: '',
    avatarUrl: '',
  });

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.user_metadata.full_name || '',
        email: user.email || '',
        bio: user.user_metadata.bio || '',
        avatarUrl: user.user_metadata.avatar_url || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: userData.name,
        bio: userData.bio,
        avatar_url: userData.avatarUrl,
      },
    });

    if (error) {
      console.error('Error updating user:', error);
    } else {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Your Profile</CardTitle>
              <CardDescription>
                Manage your account information
              </CardDescription>
            </div>
            <Avatar className="h-16 w-16">
              <AvatarImage src={userData.avatarUrl} alt={userData.name} />
              <AvatarFallback>{userData.name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            {isEditing ? (
              <Input 
                value={userData.name} 
                onChange={(e) => setUserData({...userData, name: e.target.value})} 
              />
            ) : (
              <div className="p-2">{userData.name}</div>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="p-2 text-muted-foreground">{userData.email}</div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            {isEditing ? (
              <Input 
                value={userData.bio} 
                onChange={(e) => setUserData({...userData, bio: e.target.value})} 
              />
            ) : (
              <div className="p-2">{userData.bio}</div>
            )}
          </div>
          
          {isEditing && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Avatar URL</label>
              <Input 
                value={userData.avatarUrl} 
                onChange={(e) => setUserData({...userData, avatarUrl: e.target.value})} 
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default withAuth(ProfilePage);