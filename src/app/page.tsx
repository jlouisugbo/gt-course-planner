// app/page.tsx
"use client";

import { LandingPage } from "@/components/landing/LandingPage";

/**
 * Root page - ALWAYS shows landing page for demo purposes
 * Users can click "Try Demo" to enter demo mode
 * Users can click "Get Started" to sign in with Google
 */
export default function HomePage() {
    return <LandingPage />;
}
