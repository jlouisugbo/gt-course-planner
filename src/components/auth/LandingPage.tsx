// components/landing/LandingPage.tsx
import React, { useState } from 'react';
import { useAuth } from '@/lib/authProvider';
import { 
  Calendar, 
  Target, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Shield,
  Star,
  CheckCircle,
  ArrowRight,
  GraduationCap,
  Loader2
} from 'lucide-react';

export function LandingPage() {
  const { signInWithGoogle, loading } = useAuth();
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleGetStarted = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithGoogle();
      // User will be redirected automatically via the auth flow
    } catch (error) {
      console.error('Get Started error:', error);
      setIsAuthLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithGoogle();
      // Same flow as Get Started - existing users will go to dashboard
    } catch (error) {
      console.error('Connect error:', error);
      setIsAuthLoading(false);
    }
  };

  const isLoading = loading || isAuthLoading;

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header with CTAs */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-yellow-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-900 to-yellow-600 bg-clip-text text-transparent">
                GT 4-Year Planner
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleConnect}
                disabled={isLoading}
                className="text-blue-900 hover:text-blue-700 font-semibold transition-colors disabled:opacity-50 flex items-center space-x-1"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Connect</span>
              </button>
              <button 
                onClick={handleGetStarted}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-900 to-yellow-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-800 hover:to-yellow-500 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none flex items-center space-x-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Get Started</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Plan Your Perfect 
              <span className="bg-gradient-to-r from-blue-900 to-yellow-600 bg-clip-text text-transparent"> GT Journey</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              The smart way to map out your 4-year academic path at Georgia Tech. 
              Stay on track, meet requirements, and graduate with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button 
                onClick={handleGetStarted}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-900 to-yellow-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-800 hover:to-yellow-500 transition-all transform hover:scale-105 flex items-center space-x-2 shadow-lg disabled:opacity-50 disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>Start Planning Free</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
              <button 
                onClick={handleConnect}
                disabled={isLoading}
                className="bg-white text-blue-900 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-blue-900 hover:bg-blue-50 transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                <span>Connect Account</span>
              </button>
            </div>

            <div className="flex items-center justify-center space-x-8 text-gray-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-yellow-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools designed specifically for Georgia Tech students to navigate their academic journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: "Smart Course Planning",
                description: "Visualize your entire 4-year schedule with prerequisite tracking and conflict detection"
              },
              {
                icon: Target,
                title: "Degree Progress Tracking",
                description: "Monitor your progress toward graduation with real-time requirement fulfillment"
              },
              {
                icon: BookOpen,
                title: "Course Recommendations",
                description: "Get personalized suggestions based on your major, interests, and academic goals"
              },
              {
                icon: Users,
                title: "Peer Collaboration",
                description: "Connect with classmates, share schedules, and plan study groups together"
              },
              {
                icon: TrendingUp,
                title: "GPA Forecasting",
                description: "Predict your future GPA and see how different course choices impact your goals"
              },
              {
                icon: Shield,
                title: "Academic Safeguards",
                description: "Built-in alerts for prerequisite violations, credit limits, and graduation requirements"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-900 to-yellow-600 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Trusted by 1,000+ GT Students
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join thousands of Yellow Jackets who have successfully planned their academic journey with our platform.
              </p>
              
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-yellow-600 bg-clip-text text-transparent mb-2">98%</div>
                  <div className="text-gray-600">On-time graduation</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-yellow-600 bg-clip-text text-transparent mb-2">4.2★</div>
                  <div className="text-gray-600">Average rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-yellow-600 bg-clip-text text-transparent mb-2">15k+</div>
                  <div className="text-gray-600">Schedules created</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-yellow-600 bg-clip-text text-transparent mb-2">0</div>
                  <div className="text-gray-600">Hidden fees</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-xl">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-900 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  AS
                </div>
                <div>
                  <div className="text-gray-900 font-semibold">Alex Smith</div>
                  <div className="text-gray-500">CS &apos;23, Software Engineer @ Meta</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900 to-yellow-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your GT Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of successful Yellow Jackets who planned their path to graduation
          </p>
          <button 
            onClick={handleGetStarted}
            disabled={isLoading}
            className="bg-white text-blue-900 px-12 py-4 rounded-xl font-bold text-xl hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center space-x-2 mx-auto shadow-lg disabled:opacity-50 disabled:transform-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Start Your Free Plan</span>
                <ArrowRight className="h-6 w-6" />
              </>
            )}
          </button>
          <p className="text-white/80 mt-4">Free forever • No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-6 w-6 text-yellow-600" />
                <span className="font-bold bg-gradient-to-r from-blue-900 to-yellow-600 bg-clip-text text-transparent">
                  GT 4-Year Planner
                </span>
              </div>
              <p className="text-gray-600">
                Empowering Georgia Tech students to plan their perfect academic journey.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-blue-900 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-blue-900 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-900 transition-colors">Updates</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-blue-900 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-900 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-blue-900 transition-colors">Student Resources</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-blue-900 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-900 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-blue-900 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2025 GT 4-Year Planner. Not affiliated with Georgia Institute of Technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}