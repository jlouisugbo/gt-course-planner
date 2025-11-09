/**
 * Profile Gate Component
 * Ensures users only see profile setup once, then never again
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { checkProfileStatus, loadUserProfile, ProfileStatus } from '@/lib/profileStatus';
import ProfileSetup from './ProfileSetup';
import { Loader2 } from 'lucide-react';

interface ProfileGateProps {
  children: React.ReactNode;
  showSetupButton?: boolean;
}

export const ProfileGate: React.FC<ProfileGateProps> = ({ 
  children, 
  showSetupButton = false 
}) => {
  const { user } = useAuth();
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forceShowSetup, setForceShowSetup] = useState(false);

  // Check profile status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) {
        // No user - skip profile checks and show children directly
        setIsLoading(false);
        setProfileStatus({
          isComplete: true, // Treat as complete so we don't show setup
          hasRequiredFields: false,
          completedAt: null,
          missingFields: ['not_authenticated']
        });
        return;
      }

      console.log('ProfileGate: Checking profile status for user:', user.id);

      try {
        const [status, profile] = await Promise.all([
          checkProfileStatus(),
          loadUserProfile()
        ]);

        console.log('ProfileGate: Profile status:', status);
        console.log('ProfileGate: Profile data:', profile);

        setProfileStatus(status);
        setUserProfile(profile);

        // If profile is complete, never show setup again
        if (status.isComplete) {
          console.log('ProfileGate: Profile is complete - user will not see setup');
        } else {
          console.log('ProfileGate: Profile incomplete - missing:', status.missingFields);
        }
      } catch (error: any) {
        // Silently handle authentication errors
        if (error?.status === 401) {
          setProfileStatus({
            isComplete: true, // Treat as complete so we don't show setup
            hasRequiredFields: false,
            completedAt: null,
            missingFields: ['not_authenticated']
          });
        } else {
          console.error('ProfileGate: Error checking profile status:', error);
          // On other errors, assume profile is incomplete to be safe
          setProfileStatus({
            isComplete: false,
            hasRequiredFields: false,
            completedAt: null,
            missingFields: ['error']
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [user]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gt-navy" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show setup if profile is incomplete or forced
  const shouldShowSetup = !profileStatus?.isComplete || forceShowSetup;

  if (shouldShowSetup) {
    console.log('ProfileGate: Showing profile setup');
    
    return (
      <ProfileSetup
        existingProfile={userProfile}
        pageMode={true}
        onClose={async () => {
          // After successful setup, refresh status
          setForceShowSetup(false);
          const newStatus = await checkProfileStatus();
          setProfileStatus(newStatus);
          
          // Also reload the user profile data
          const newProfile = await loadUserProfile();
          setUserProfile(newProfile);
          
          // Force a page refresh to ensure all components get the new data
          if (newStatus.isComplete) {
            window.location.reload();
          }
        }}
      />
    );
  }

  // Profile is complete - show the main content
  console.log('ProfileGate: Profile complete - showing main app content');

  return (
    <>
      {children}
      
      {/* Optional setup button for profile editing */}
      {showSetupButton && (
        <button
          onClick={() => setForceShowSetup(true)}
          className="fixed bottom-4 right-4 bg-gt-navy text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gt-navy/90 transition-colors"
        >
          Edit Profile
        </button>
      )}
    </>
  );
};