"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import ProfileSetup from "@/components/profile/ProfileSetup";
import {
    Home,
    Calendar,
    BookOpen,
    CheckCircle,
    Menu,
    User,
    Settings,
    HelpCircle,
    Bell,
    LogOut,
    X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { usePlannerStore } from "@/hooks/usePlannerStore";

interface AppLayoutProps {
    children: React.ReactNode;
}

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Planner", href: "/planner", icon: Calendar },
    { name: "Courses", href: "/courses", icon: BookOpen },
    { name: "Requirements", href: "/requirements", icon: CheckCircle },
];

export default function AppLayout({ children }: AppLayoutProps) {

    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showProfileSetup, setShowProfileSetup] = useState(false);
    const { semesters, studentInfo, userProfile } = usePlannerStore();

    const safeUserProfile = useMemo(() => {
        return userProfile && typeof userProfile === 'object' ? userProfile : null;
    }, [userProfile]);

    const handleProfileSetupOpen = useCallback(() => {
        setShowProfileSetup(true);
    }, []);

    const handleProfileSetupClose = useCallback(() => {
        setShowProfileSetup(false);
    }, []);

    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);

    // Only render user-dependent content after hydration
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Safe user info extraction - only after client hydration
    const getUserInfo = () => {
        if (!isClient || !user) {
            return {
                displayName: "User",
                displayMajor: "Undeclared",
            };
        }

        return {
            displayName:
                user.user_metadata?.full_name ||
                user.email?.split("@")[0] ||
                "User",
            displayMajor: user.user_metadata?.major || "Undeclared",
        };
    };

    const { displayName, displayMajor } = getUserInfo();

    const handleSignOut = async () => {
        console.log("HandleSignOut called");
        try {
            console.log("About to call signOut");
            signOut();
            console.log("SignOut completed");
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            console.log("About to redirect...");
            window.location.replace("/");
        }
    };

    // Render user profile section
    const renderUserProfile = () => {
        return (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-300">
                <div className="w-7 h-7 bg-[#B3A369] rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                </div>
                <div className="hidden lg:block">
                    <p className="text-sm font-medium text-slate-900">
                        {displayName}
                    </p>
                    <p className="text-xs text-slate-500">{displayMajor}</p>
                </div>

                {/* Sign Out Button */}
                {isClient && user && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="hidden md:flex h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                        onClick={handleSignOut}
                        title="Sign Out"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                )}
            </div>
        );
    };

    // Render mobile user section
    const renderMobileUserSection = () => {
        return (
            <div className="border-t border-slate-200 pt-2 mt-2">
                <div className="flex items-center space-x-2 px-3 py-2">
                    <div className="w-6 h-6 bg-[#B3A369] rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-900">
                            {displayName}
                        </p>
                        <p className="text-xs text-slate-500">{displayMajor}</p>
                    </div>
                </div>

                {isClient && user && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleSignOut}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Compact Header Navigation */}
            <header className="bg-white border-b border-slate-300 sticky top-0 z-50 shadow-sm">
                <div className="max-w-full mx-auto px-6 py-2">
                    <div className="flex items-center justify-between">
                        {/* Compact Logo and Brand */}
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-[#003057] to-[#B3A369] rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    GT
                                </span>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">
                                    GT Course Planner
                                </h1>
                                <p className="text-xs text-slate-500">
                                    Georgia Institute of Technology
                                </p>
                            </div>
                        </div>

                        {/* Compact Navigation Links */}
                        <nav className="hidden md:flex items-center space-x-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-[#003057] text-white"
                                                : "text-slate-700 hover:bg-slate-100",
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Compact Right Side Actions */}
                        <div className="flex items-center space-x-2">
                            {isClient && user && (
                                <>
                                    {/* Notifications button is commented out for now */}
                                {/*<Button
                                        variant="ghost"
                                        size="sm"
                                        className="hidden md:flex h-8 w-8 p-0"
                                    >
                                        <Bell className="h-4 w-4" />
                                    </Button>*/}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hidden md:flex h-8 w-8 p-0"
                                        onClick={() => setShowHelpModal(true)}
                                    >
                                        <HelpCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleProfileSetupOpen}
                                        className="hidden md:flex h-8 w-8 p-0"
                                    >
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </>
                            )}

                            {/* User Profile Section */}
                            {renderUserProfile()}

                            {/* Mobile Menu Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="md:hidden h-8 w-8 p-0"
                                onClick={() =>
                                    setMobileMenuOpen(!mobileMenuOpen)
                                }
                            >
                                {mobileMenuOpen ? (
                                    <X className="h-4 w-4" />
                                ) : (
                                    <Menu className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Info/Help button modal */}
                    {showHelpModal && (
                        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 relative h-96">
                                <button
                                    onClick={() => setShowHelpModal(false)}
                                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>

                                <h2 className="text-xl font-semibold mb-3">About This Site</h2>

                                <p className="text-lg text-gray-700 mb-4">
                                    This platform is designed to help Georgia Tech students manage their degree planning information efficiently.
                                    Use it to track your academic progress, build your course roadmap, and explore available offerings.
                                </p>

                                <ul className="list-disc pl-5 text-lg text-gray-700 space-y-2 mb-4">
                                    <li><strong>Dashboard:</strong> View key academic information such as GPA and course activity at a glance.</li>
                                    <li><strong>Planner:</strong> View and edit your academic plan, organizing courses by term.</li>
                                    <li><strong>Courses:</strong> Browse and search through available course offerings to build your plan.</li>
                                </ul>

                                {/* Footer with credits */}
                                <div className="text-sm text-gray-500 border-t pt-3">
                                    Created by{' '}
                                    <a href="https://www.linkedin.com/in/jlouisugbo/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
                                        Joel Louis-Ugbo
                                    </a>{' '}
                                    ,{' '}
                                    <a href="https://www.linkedin.com/in/sekun-oshikanlu/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
                                        Sekun Oshikanlu
                                    </a>
                                    {' '}and{' '}
                                    <a href="https://www.linkedin.com/in/tumelongono" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
                                        Tumelo Ngono
                                    </a>
                                    .
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Profile Setup Modal */}
                    {showProfileSetup && (
                        <ProfileSetup
                            isOpen={showProfileSetup}
                            onClose={handleProfileSetupClose}
                            existingProfile={safeUserProfile || undefined}
                        />
                    )}

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <nav className="md:hidden mt-2 pb-2 border-t border-slate-200 pt-2">
                            <div className="space-y-1">
                                {navigation.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full",
                                                isActive
                                                    ? "bg-[#003057] text-white"
                                                    : "text-slate-700 hover:bg-slate-100",
                                            )}
                                            onClick={() =>
                                                setMobileMenuOpen(false)
                                            }
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}

                                {/* Mobile User Actions */}
                                {renderMobileUserSection()}
                            </div>
                        </nav>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">{children}</main>
        </div>
    );
}
