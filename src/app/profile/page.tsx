"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User, 
  Settings, 
  BookOpen, 
  Save,
  Edit3,
  X,
  Mail,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useProfileSetup } from '@/hooks/useProfileSetup';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile: userProfile } = useUserProfile();
  const profileSetup = useProfileSetup();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    major: '',
    minor: [] as string[],
    selectedThreads: [] as string[],
    expectedGraduation: '',
    gpa: '',
    admissionYear: '',
    studentId: '',
    bio: '',
  });

  // Initialize form data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || '',
        email: user?.email || userProfile.email || '',
        phone: '',
        address: '',
        major: userProfile.major || '',
        minor: userProfile.minors || [],
        selectedThreads: userProfile.selectedThreads || [],
        expectedGraduation: (userProfile.planSettings?.expected_graduation as string) || '',
        gpa: userProfile.overallGPA?.toString() || '',
        admissionYear: userProfile.graduationYear?.toString() || '',
        studentId: '',
        bio: '',
      });
    }
  }, [userProfile, user]);

  const handleSave = async () => {
    try {
      // Update the profile data first
      profileSetup.setProfile({
        full_name: formData.fullName,
        major: formData.major,
        minors: formData.minor,
        threads: formData.selectedThreads,
        expectedGraduation: formData.expectedGraduation,
        currentGPA: formData.gpa ? parseFloat(formData.gpa) : undefined,
        student_id: formData.studentId,
        bio: formData.bio,
      });
      // Save to database
      await profileSetup.saveProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || '',
        email: user?.email || userProfile.email || '',
        phone: '',
        address: '',
        major: userProfile.major || '',
        minor: userProfile.minors || [],
        selectedThreads: userProfile.selectedThreads || [],
        expectedGraduation: (userProfile.planSettings?.expected_graduation as string) || '',
        gpa: userProfile.overallGPA?.toString() || '',
        admissionYear: userProfile.graduationYear?.toString() || '',
        studentId: '',
        bio: '',
      });
    }
    setIsEditing(false);
  };

  const addMinor = (minor: string) => {
    if (minor && !formData.minor.includes(minor)) {
      setFormData(prev => ({
        ...prev,
        minor: [...prev.minor, minor]
      }));
    }
  };

  const removeMinor = (minor: string) => {
    setFormData(prev => ({
      ...prev,
      minor: prev.minor.filter(m => m !== minor)
    }));
  };

  const addThread = (thread: string) => {
    if (thread && !formData.selectedThreads.includes(thread)) {
      setFormData(prev => ({
        ...prev,
        selectedThreads: [...prev.selectedThreads, thread]
      }));
    }
  };

  const removeThread = (thread: string) => {
    setFormData(prev => ({
      ...prev,
      selectedThreads: prev.selectedThreads.filter(t => t !== thread)
    }));
  };

  const majors = [
    'Computer Science',
    'Computer Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Industrial Engineering',
    'Civil Engineering',
    'Aerospace Engineering',
    'Biomedical Engineering',
    'Chemical Engineering',
    'Nuclear Engineering',
    'Materials Science Engineering',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Economics',
    'Business Administration',
    'Literature, Media, and Communication',
    'Public Policy',
    'International Affairs',
    'Psychology',
    'History, Technology, and Society',
  ];

  const threads = [
    'Intelligence',
    'Systems & Architecture',
    'Information Internetworks',
    'Media',
    'Modeling & Simulation',
    'People',
    'Theory',
    'Devices',
  ];

  const minors = [
    'Computer Science',
    'Mathematics',
    'Economics',
    'Psychology',
    'Business',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Philosophy',
    'Linguistics',
    'Music',
    'Literature',
    'Public Policy',
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gt-navy flex items-center gap-3">
            <User className="h-8 w-8 text-gt-gold" />
            Profile Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your personal information and academic preferences
          </p>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-gt-navy hover:bg-gt-navy-700">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="bg-gt-navy hover:bg-gt-navy-700">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-l-4 border-l-gt-gold">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gt-navy text-white rounded-full flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gt-navy">
                  {formData.fullName}
                </h2>
                <p className="text-gray-600">{formData.major}</p>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Mail className="h-4 w-4" />
                    {formData.email}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <GraduationCap className="h-4 w-4" />
                    Expected Graduation: {formData.expectedGraduation}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Settings Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="academic">Academic Info</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gt-navy">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled={true}
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Information Tab */}
        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gt-navy">Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="admissionYear">Admission Year</Label>
                  <Input
                    id="admissionYear"
                    type="number"
                    value={formData.admissionYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, admissionYear: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="major">Major</Label>
                  <Select 
                    value={formData.major} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, major: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your major" />
                    </SelectTrigger>
                    <SelectContent>
                      {majors.map((major) => (
                        <SelectItem key={major} value={major}>
                          {major}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expectedGraduation">Expected Graduation</Label>
                  <Input
                    id="expectedGraduation"
                    value={formData.expectedGraduation}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedGraduation: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g., Spring 2026"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="gpa">Current GPA</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  value={formData.gpa}
                  onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              {/* Threads */}
              <div>
                <Label>Specialization Threads</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-3">
                  {formData.selectedThreads.map((thread) => (
                    <Badge key={thread} variant="secondary" className="flex items-center gap-1">
                      {thread}
                      {isEditing && (
                        <button onClick={() => removeThread(thread)} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <Select onValueChange={addThread}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add a thread" />
                    </SelectTrigger>
                    <SelectContent>
                      {threads.filter(thread => !formData.selectedThreads.includes(thread)).map((thread) => (
                        <SelectItem key={thread} value={thread}>
                          {thread}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Minors */}
              <div>
                <Label>Minors</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-3">
                  {formData.minor.map((minor) => (
                    <Badge key={minor} variant="outline" className="flex items-center gap-1">
                      {minor}
                      {isEditing && (
                        <button onClick={() => removeMinor(minor)} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <Select onValueChange={addMinor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add a minor" />
                    </SelectTrigger>
                    <SelectContent>
                      {minors.filter(minor => !formData.minor.includes(minor)).map((minor) => (
                        <SelectItem key={minor} value={minor}>
                          {minor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gt-navy">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="notifications" />
                  <Label htmlFor="notifications">Email notifications for course updates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="reminders" />
                  <Label htmlFor="reminders">Deadline reminders</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="analytics" />
                  <Label htmlFor="analytics">Usage analytics</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gt-navy">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Export Academic Data
                </Button>
                <Button variant="destructive" className="w-full justify-start">
                  <X className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}