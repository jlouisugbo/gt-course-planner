/**
 * Demo Landing Page
 * Showcases demo mode with attractive UI and clear call-to-action
 */

"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Rocket,
  CheckCircle2,
  Calendar,
  GraduationCap,
  TrendingUp,
  BarChart3,
  BookOpen,
  Target,
  Sparkles,
  ArrowRight,
  User
} from 'lucide-react';
import { enableDemoMode, DEMO_USER } from '@/lib/demo-mode';
import { getDemoStats } from '@/lib/demo-data';

export default function DemoPage() {
  const router = useRouter();
  const demoStats = getDemoStats();

  const handleStartDemo = () => {
    // Enable demo mode
    enableDemoMode();

    // Redirect to dashboard
    router.push('/dashboard');
  };

  const handleSignIn = () => {
    router.push('/');
  };

  const features = [
    {
      icon: GraduationCap,
      title: 'Complete Student Profile',
      description: `${DEMO_USER.full_name}, CS Major with Intelligence & Devices threads`,
      color: 'text-blue-600'
    },
    {
      icon: BookOpen,
      title: `${demoStats.completedCourses} Completed Courses`,
      description: `${demoStats.totalCredits} credits earned across ${demoStats.completedCourses + demoStats.inProgressCourses + demoStats.plannedCourses} total courses`,
      color: 'text-green-600'
    },
    {
      icon: TrendingUp,
      title: `${demoStats.cumulativeGPA.toFixed(2)} GPA`,
      description: 'Strong academic performance with detailed semester-by-semester history',
      color: 'text-purple-600'
    },
    {
      icon: Calendar,
      title: '4-Year Course Plan',
      description: 'From Fall 2022 to Spring 2026 with realistic course progression',
      color: 'text-orange-600'
    },
    {
      icon: Target,
      title: 'Requirement Tracking',
      description: 'Track progress toward major, threads, and minor requirements',
      color: 'text-pink-600'
    },
    {
      icon: BarChart3,
      title: 'Academic Analytics',
      description: 'GPA trends, credit analysis, and graduation timeline',
      color: 'text-indigo-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gold-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#B3A369]/10 text-[#B3A369] px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Interactive Demo Mode</span>
          </div>

          <h1 className="text-5xl font-bold text-[#003057] mb-4 flex items-center justify-center gap-3">
            <Rocket className="h-12 w-12 text-[#B3A369]" />
            Try GT Course Planner
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Explore all features with a realistic Computer Science student profile.
            No sign-in required, fully interactive, and ready to use in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleStartDemo}
              size="lg"
              className="bg-[#B3A369] hover:bg-[#B3A369]/90 text-white font-semibold px-8 py-6 text-lg"
            >
              <Rocket className="h-5 w-5 mr-2" />
              Start Demo
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            <Button
              onClick={handleSignIn}
              size="lg"
              variant="outline"
              className="border-[#003057] text-[#003057] hover:bg-[#003057] hover:text-white px-8 py-6 text-lg"
            >
              <User className="h-5 w-5 mr-2" />
              Sign In Instead
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-[#003057] mb-6 text-center">
            What's Included in the Demo
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <feature.icon className={`h-6 w-6 ${feature.color} flex-shrink-0 mt-1`} />
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Demo User Profile Card */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="bg-gradient-to-br from-[#003057] to-[#003057]/80 text-white">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <User className="h-6 w-6" />
                Demo Student Profile
              </CardTitle>
              <CardDescription className="text-gray-200">
                You'll be using this pre-configured student account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-300">Name</div>
                  <div className="font-semibold">{DEMO_USER.full_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-300">GT Username</div>
                  <div className="font-semibold">{DEMO_USER.gt_username}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-300">Major</div>
                  <div className="font-semibold">{DEMO_USER.major}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-300">Graduation</div>
                  <div className="font-semibold">{DEMO_USER.graduation_year}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-300">Threads</div>
                  <div className="font-semibold">{(DEMO_USER.selected_threads || []).join(', ')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-300">Minor</div>
                  <div className="font-semibold">{(DEMO_USER.minors || []).join(', ')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-300">GPA</div>
                  <div className="font-semibold">{(DEMO_USER.current_gpa ?? 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-300">Credits Earned</div>
                  <div className="font-semibold">{DEMO_USER.total_credits_earned}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/20">
                <div className="text-sm text-gray-300 mb-2">Academic Progress</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Course Completion</span>
                    <span className="font-semibold">{demoStats.completionRate.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-[#B3A369] h-2 rounded-full transition-all"
                      style={{ width: `${demoStats.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-[#003057]">How Demo Mode Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#B3A369] text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <div className="font-semibold text-[#003057]">Instant Access</div>
                    <div className="text-gray-600">
                      Click "Start Demo" to immediately access the application with pre-loaded data
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#B3A369] text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <div className="font-semibold text-[#003057]">Explore Features</div>
                    <div className="text-gray-600">
                      Try course planning, view requirements, check analytics, and test all features
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#B3A369] text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <div className="font-semibold text-[#003057]">Make Changes</div>
                    <div className="text-gray-600">
                      Add courses, update grades, move classes around - all changes are temporary
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#B3A369] text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <div className="font-semibold text-[#003057]">No Commitment</div>
                    <div className="text-gray-600">
                      Demo data resets when you close the browser - no account needed
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Footer */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-[#003057] to-[#B3A369] text-white p-8 rounded-xl">
            <h2 className="text-3xl font-bold mb-4">Ready to Plan Your GT Journey?</h2>
            <p className="text-lg mb-6 text-gray-100">
              Experience the complete course planning system with realistic data
            </p>
            <Button
              onClick={handleStartDemo}
              size="lg"
              className="bg-white text-[#003057] hover:bg-gray-100 font-semibold px-8 py-6 text-lg"
            >
              <Rocket className="h-5 w-5 mr-2" />
              Launch Demo Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Demo data is temporary and will be cleared when you close your browser.</p>
          <p className="mt-2">
            Want to save your actual course plan?{' '}
            <button
              onClick={handleSignIn}
              className="text-[#B3A369] hover:underline font-medium"
            >
              Create a real account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
