"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useUserAwarePlannerStore } from "@/hooks/useUserAwarePlannerStore";
import { CookieConsent } from "@/components/legal/CookieConsent";
import ProfileSetupQuick from "@/components/profile/ProfileSetupQuick";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const [showProfileSetup, setShowProfileSetup] = useState(false);
    const { userProfile } = useUserAwarePlannerStore();
    const pathname = usePathname();
    const { user } = useAuth();
    const [isClient, setIsClient] = useState(false);
    

    const safeUserProfile = useMemo(() => {
        return userProfile && typeof userProfile === 'object' ? userProfile : null;
    }, [userProfile]);


    const handleProfileSetupClose = useCallback(() => {
        setShowProfileSetup(false);
    }, []);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Don't render navigation on landing page or when not authenticated
    const shouldShowNavigation = user && pathname !== '/' && pathname !== '/landing';

    // Check if profile setup should be shown
    useEffect(() => {
        if (isClient && user && safeUserProfile === null && pathname !== '/') {
            setShowProfileSetup(true);
        }
    }, [isClient, user, safeUserProfile, pathname]);

    if (!shouldShowNavigation) {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="flex-1">{children}</main>
                <CookieConsent />
                {showProfileSetup && (
                    <ProfileSetupQuick onClose={handleProfileSetupClose} />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <Header />
            
            {/* Main content area with sidebar */}
            <div className="flex flex-1">
                {/* Sidebar */}
                <Sidebar />
                
                {/* Main content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>

            {/* Profile Setup Modal */}
            {showProfileSetup && (
                <ProfileSetupQuick onClose={handleProfileSetupClose} />
            )}

            {/* Cookie Consent */}
            <CookieConsent />
        </div>
    );
}