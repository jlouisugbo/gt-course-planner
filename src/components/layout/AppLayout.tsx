"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { cn } from "@/lib/utils";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
    children: React.ReactNode;
}

/**
 * Simplified AppLayout
 * - No ProfileGate wrapper
 * - No profile syncing
 * - Just navigation and content
 */
export default function AppLayout({ children }: AppLayoutProps) {
    const pathname = usePathname();
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Don't render navigation on landing page or when not authenticated
    const shouldShowNavigation = user && pathname !== '/' && pathname !== '/landing';

    if (!shouldShowNavigation) {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="flex-1">{children}</main>
                <CookieConsent />
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Left Sidebar */}
            <Sidebar
                isMobileOpen={isMobileMenuOpen}
                setIsMobileOpen={setIsMobileMenuOpen}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
            />

            {/* Main Content Area */}
            <div
                className={cn(
                    "flex-1 flex flex-col overflow-hidden transition-all duration-300",
                    isSidebarCollapsed ? "lg:ml-20" : "lg:ml-[180px]"
                )}
            >
                {/* Top Header */}
                <Header />

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-gray-50">
                    <div className="container mx-auto px-4 py-6 max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>

            {/* Cookie Consent */}
            <CookieConsent />
        </div>
    );
}
