/**
 * Demo Setup Page - Quick access to demo profiles
 */

"use client";

import React from 'react';
import { ProfileSetupDemo } from '@/components/profile/ProfileSetupDemo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Rocket, Settings } from 'lucide-react';

export default function DemoSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#003057] mb-4 flex items-center justify-center gap-3">
            <Rocket className="h-10 w-10 text-[#B3A369]" />
            Demo Setup
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Quickly set up a demo profile with pre-filled data to test the GT Course Planner. 
            Perfect for presentations and demonstrations.
          </p>
        </div>

        {/* Demo Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-[#B3A369]" />
                Quick Demo Setup
              </CardTitle>
              <CardDescription>
                Use pre-configured profiles with realistic student data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSetupDemo />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#003057]" />
                Manual Setup
              </CardTitle>
              <CardDescription>
                Go through the full profile setup process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Experience the complete profile setup flow with all steps and validation.
              </p>
              <Link href="/setup">
                <Button className="w-full bg-[#003057] hover:bg-[#003057]/90">
                  Start Manual Setup
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Demo Instructions */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">Demo Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-yellow-700">
              <h4 className="font-semibold mb-2">How to use the demo:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Choose a demo profile from the options above</li>
                <li>Click "Use This Demo Profile" to automatically set up the account</li>
                <li>You'll be redirected to the dashboard with demo data populated</li>
                <li>Explore courses, requirements, and planning features</li>
              </ol>
            </div>
            <div className="border-t border-yellow-200 pt-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Available Demo Profiles:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• <strong>CS Student:</strong> Computer Science major with Intelligence and Devices threads</li>
                <li>• <strong>Aerospace Engineering:</strong> AE major with Biomedical Engineering minor</li>
                <li>• <strong>Transfer Student:</strong> Mechanical Engineering transfer with 30 credits</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Demo data is temporary and can be reset at any time.</p>
          <p className="mt-1">
            <Link href="/dashboard" className="text-[#B3A369] hover:underline">
              Go to Dashboard
            </Link>
            {" | "}
            <Link href="/courses" className="text-[#B3A369] hover:underline">
              Browse Courses
            </Link>
            {" | "}
            <Link href="/planner" className="text-[#B3A369] hover:underline">
              Course Planner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}