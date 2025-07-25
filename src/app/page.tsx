// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { LandingPage } from "@/components/landing/LandingPage";
import { Loader2 } from "lucide-react";

export default function HomePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    // Add to each component to debug
    console.log("Component render:", { user: !!user, loading, mounted });
    // Simple mounting check
    useEffect(() => {
        setMounted(true);
    }, []);

    // Single effect with simple logic
    useEffect(() => {
        if (!mounted || loading) return;
        
        // If no user, let middleware handle the redirect
        if (!user) return;

        // User is authenticated, check their setup status
        const checkUserSetup = async () => {
            try {
                const { data } = await supabase
                    .from("users")
                    .select("degree_program_id, graduation_year")
                    .eq("auth_id", user.id)
                    .single();

                if (!data?.degree_program_id || !data?.graduation_year) {
                    // Needs setup
                    router.replace("/setup");
                } else {
                    // Setup complete
                    router.replace("/dashboard");
                }
            } catch (error) {
                // Error - send to setup to be safe
                console.error("User check error:", error);
                router.replace("/setup");
            }
        };

        checkUserSetup();
    }, [user, loading, mounted, router]);

    // Show loading while checking
    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
                    <span className="text-lg text-gray-600">Loading...</span>
                </div>
            </div>
        );
    }

    // Show nothing if user exists (will redirect)
    if (user) {
        return null;
    }

    // Show landing page for non-authenticated users
    return <LandingPage />;
}
