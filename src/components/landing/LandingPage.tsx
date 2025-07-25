// components/landing/LandingPage.tsx
import React, { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
    Calendar,
    Target,
    BookOpen,
    ArrowRight,
    GraduationCap,
    Loader2,
} from "lucide-react";

export function LandingPage() {
    const { signInWithGoogle, loading } = useAuth();
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    const handleGetStarted = async () => {
        setIsAuthLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Get Started error:", error);
            setIsAuthLoading(false);
        }
    };

    const isLoading = loading || isAuthLoading;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center">
            <div className="max-w-4xl mx-auto text-center px-6">
                {/* Logo */}
                <div className="flex items-center justify-center space-x-3 mb-8">
                    <GraduationCap className="h-16 w-16 text-yellow-600" />
                    <span className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-yellow-600 bg-clip-text text-transparent">
                        GT Course Planner
                    </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    Plan Your Perfect
                    <span className="bg-gradient-to-r from-blue-900 to-yellow-600 bg-clip-text text-transparent">
                        {" "}
                        GT Journey
                    </span>
                </h1>

                {/* Description */}
                <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
                    Smart course planning for Georgia Tech students. Track requirements, 
                    manage prerequisites, and stay on track to graduate on time.
                </p>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="flex flex-col items-center space-y-3 p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                        <Calendar className="h-8 w-8 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">4-Year Planning</h3>
                        <p className="text-sm text-gray-600 text-center">Map your entire academic journey</p>
                    </div>
                    <div className="flex flex-col items-center space-y-3 p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                        <Target className="h-8 w-8 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Requirement Tracking</h3>
                        <p className="text-sm text-gray-600 text-center">Monitor graduation progress</p>
                    </div>
                    <div className="flex flex-col items-center space-y-3 p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Course Recommendations</h3>
                        <p className="text-sm text-gray-600 text-center">Get personalized suggestions</p>
                    </div>
                </div>

                {/* Single CTA Button */}
                <button
                    onClick={handleGetStarted}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-900 to-yellow-600 text-white px-12 py-4 rounded-xl font-bold text-xl hover:from-blue-800 hover:to-yellow-500 transition-all transform hover:scale-105 flex items-center space-x-3 mx-auto shadow-lg disabled:opacity-50 disabled:transform-none"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Loading...</span>
                        </>
                    ) : (
                        <>
                            <span>Start Planning</span>
                            <ArrowRight className="h-6 w-6" />
                        </>
                    )}
                </button>

                {/* Footer text */}
                <p className="text-gray-500 mt-6 text-sm">
                    &copy; 2025 GT Course Planner • Not affiliated with Georgia Institute of Technology
                </p>
            </div>
        </div>
    );
}
