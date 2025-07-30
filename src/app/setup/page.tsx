"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import ProfileSetup from '@/components/profile/ProfileSetup';
import { UserProfile } from '@/types/user';
import { Loader2 } from 'lucide-react';

export default function SetupPage() {
    const { user } = useAuth();
    const [existingProfile, setExistingProfile] = useState<Partial<UserProfile> | undefined>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadExistingProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                console.log('Loading existing profile for user:', user.id);
                
                const { data: userRecord, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('auth_id', user.id)
                    .single();

                if (error) {
                    console.warn('No existing profile found:', error);
                    setExistingProfile(undefined);
                } else if (userRecord) {
                    console.log('Found existing profile:', userRecord);
                    
                    // Convert database record to UserProfile format
                    const profileData: Partial<UserProfile> = {
                        name: userRecord.full_name || '',
                        email: userRecord.email || '',
                        gtId: userRecord.gt_username || 0,
                        major: userRecord.major || '',
                        threads: userRecord.selected_threads || [],
                        minors: userRecord.minors || [],
                        expectedGraduation: userRecord.graduation_year ? 
                            `Spring ${userRecord.graduation_year}` : '',
                        // Extract from plan_settings if available
                        startDate: userRecord.plan_settings?.starting_semester || '',
                        currentGPA: userRecord.plan_settings?.currentGPA || 0,
                        totalCreditsEarned: userRecord.plan_settings?.totalCreditsEarned || 0,
                        isTransferStudent: userRecord.plan_settings?.isTransferStudent || false,
                        transferCredits: userRecord.plan_settings?.transferCredits || 0,
                        year: userRecord.plan_settings?.year || '',
                        isDoubleMajor: userRecord.plan_settings?.isDoubleMajor || false,
                        secondMajor: userRecord.plan_settings?.secondMajor || '',
                    };
                    
                    setExistingProfile(profileData);
                }
            } catch (error) {
                console.error('Error loading existing profile:', error);
                setExistingProfile(undefined);
            } finally {
                setLoading(false);
            }
        };

        loadExistingProfile();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[#003057]" />
                    <p className="text-slate-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <ProfileSetup 
                pageMode={true} 
                existingProfile={existingProfile}
            />
        </div>
    );
}