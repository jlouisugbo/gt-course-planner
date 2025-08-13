"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { userDataService } from '@/lib/database/userDataService';
import ProfileSetup from '@/components/profile/ProfileSetup';
import { UserProfile } from '@/types/user';
import { Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SetupPage() {
    const { user } = useAuth();
    const [existingProfile, setExistingProfile] = useState<Partial<UserProfile> | undefined>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadExistingProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                console.log('🔍 Loading existing profile for user:', user.id);
                
                // Use enhanced user data service for comprehensive profile loading
                const userData = await userDataService.getUserProfile();
                
                if (userData) {
                    console.log('✅ Found existing profile:', userData.full_name);
                    
                    // Convert database record to UserProfile format
                    const profileData: Partial<UserProfile> = {
                        name: userData.full_name || '',
                        email: userData.email || '',
                        gtId: parseInt(userData.id?.toString() || '0'),
                        major: userData.major || '',
                        threads: userData.threads || [],
                        minors: userData.minors || [],
                        expectedGraduation: userData.expected_graduation || 
                            (userData.graduation_year ? `Spring ${userData.graduation_year}` : ''),
                        startDate: userData.start_date || 
                            (userData.plan_settings?.starting_semester || ''),
                        currentGPA: userData.current_gpa || 0,
                        totalCreditsEarned: userData.total_credits_earned || 0,
                        isTransferStudent: userData.plan_settings?.is_transfer_student || false,
                        transferCredits: userData.plan_settings?.transfer_credits || 0,
                        year: userData.plan_settings?.year || '',
                        isDoubleMajor: userData.plan_settings?.is_double_major || false,
                        secondMajor: userData.plan_settings?.second_major || '',
                    };
                    
                    setExistingProfile(profileData);
                } else {
                    console.log('ℹ️ No existing profile found, starting fresh setup');
                    setExistingProfile(undefined);
                }
            } catch (error) {
                console.error('❌ Error loading existing profile:', error);
                setError('Failed to load existing profile data');
                setExistingProfile(undefined);
            } finally {
                setLoading(false);
            }
        };

        loadExistingProfile();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-8">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-[#003057]" />
                            <div className="text-center">
                                <h3 className="font-semibold text-[#003057]">Loading Profile Setup</h3>
                                <p className="text-sm text-muted-foreground">
                                    Checking for existing profile data...
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-8">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-semibold text-red-900">Setup Error</h3>
                                <p className="text-sm text-red-700 mt-1">
                                    {error}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Please try refreshing the page or contact support if the problem persists.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <ProfileSetup 
            pageMode={true} 
            existingProfile={existingProfile}
        />
    );
}