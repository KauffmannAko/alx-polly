'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mock user data
  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    bio: 'Software developer and polling enthusiast',
    avatarUrl: '',
  });

  const handleSave = () => {
    setIsSaving(true);
    // Save profile logic will go here
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
    }, 1000);
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
              <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
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
            {isEditing ? (
              <Input 
                value={userData.email} 
                onChange={(e) => setUserData({...userData, email: e.target.value})} 
              />
            ) : (
              <div className="p-2">{userData.email}</div>
            )}
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