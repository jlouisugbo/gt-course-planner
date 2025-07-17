// Create this as app/debug-auth/page.tsx temporarily
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/providers/AuthProvider";

export default function DebugAuthPage() {
    const [authState, setAuthState] = useState<any>(null);
    const [dbUser, setDbUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const auth = useAuth();

    useEffect(() => {
        const checkAuthState = async () => {
            try {
                // Check Supabase session
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();
                console.log("Session:", session);
                console.log("Session error:", error);

                setAuthState({
                    session: session,
                    user: session?.user,
                    error: error,
                    authProviderUser: auth.user,
                    authProviderSession: auth.session,
                    authProviderLoading: auth.loading,
                });

                // Check database user
                if (session?.user) {
                    const { data: user, error: userError } = await supabase
                        .from("users")
                        .select("*")
                        .eq("auth_id", session.user.id)
                        .single();

                    console.log("DB User:", user);
                    console.log("DB User error:", userError);
                    setDbUser({ user, error: userError });
                }
            } catch (err) {
                console.error("Auth check error:", err);
            } finally {
                setLoading(false);
            }
        };

        checkAuthState();
    }, [auth]);

    const handleCreateUser = async () => {
        if (!authState?.user) return;

        try {
            const { data, error } = await supabase
                .from("users")
                .insert({
                    auth_id: authState.user.id,
                    email: authState.user.email,
                    full_name:
                        authState.user.user_metadata?.full_name ||
                        authState.user.email?.split("@")[0],
                    plan_settings: {
                        plan_name: "My 4-Year Plan",
                        starting_semester: "Fall 2024",
                    },
                })
                .select()
                .single();

            console.log("User creation result:", { data, error });
            setDbUser({ user: data, error });
        } catch (err) {
            console.error("User creation error:", err);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Auth Debug Information</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Auth State */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">
                        Authentication State
                    </h2>
                    <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-96">
                        {JSON.stringify(authState, null, 2)}
                    </pre>
                </div>

                {/* Database User */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">
                        Database User
                    </h2>
                    <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-96">
                        {JSON.stringify(dbUser, null, 2)}
                    </pre>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-x-4">
                {authState?.user && !dbUser?.user && (
                    <button
                        onClick={handleCreateUser}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Create User in Database
                    </button>
                )}

                <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Sign Out
                </button>

                <button
                    onClick={() => (window.location.href = "/setup")}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Go to Setup
                </button>

                <button
                    onClick={() => (window.location.href = "/dashboard")}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                    Go to Dashboard
                </button>
            </div>

            {/* Current URL */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold">Current URL:</h3>
                <p className="text-sm font-mono">
                    {typeof window !== "undefined"
                        ? window.location.href
                        : "N/A"}
                </p>
            </div>
        </div>
    );
}
