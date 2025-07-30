import React from 'react';
import { Card } from '@/components/ui/card';
import { Shield, BookOpen, Database, Cookie } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-md mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">Georgia Tech Course Planner</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your privacy and educational data protection is our priority
          </p>
        </div>

        <Card className="bg-white shadow-lg mb-8">
          <div className="p-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">FERPA Compliance Notice</p>
                  <p className="text-sm text-yellow-700">
                    This application complies with the Family Educational Rights and Privacy Act (FERPA) 
                    for protecting student educational records.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Database className="h-6 w-6 text-blue-600" />
                  Information We Collect
                </h2>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h3 className="font-semibold mb-2">Educational Information</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Course planning data and academic progress</li>
                      <li>Degree program and requirements tracking</li>
                      <li>Course completion status and grades (if provided)</li>
                      <li>Academic semester planning information</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Account Information</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Georgia Tech authentication credentials (via Google SSO)</li>
                      <li>Name, email address, and student ID</li>
                      <li>Profile preferences and settings</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Technical Information</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Browser type, device information, and IP address</li>
                      <li>Usage patterns and feature interactions</li>
                      <li>Error logs and performance data</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Cookie className="h-6 w-6 text-blue-600" />
                  How We Use Cookies
                </h2>
                <div className="space-y-4 text-gray-700">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">Essential Cookies</h3>
                      <p className="text-sm text-green-700">
                        Required for authentication, saving your course plans, and basic app functionality.
                        These cannot be disabled.
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">Functional Cookies</h3>
                      <p className="text-sm text-blue-700">
                        Remember your preferences, theme settings, and personalization choices.
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-purple-800 mb-2">Analytics Cookies</h3>
                      <p className="text-sm text-purple-700">
                        Help us understand usage patterns to improve the course planner experience.
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-orange-800 mb-2">Marketing Cookies</h3>
                      <p className="text-sm text-orange-700">
                        Used to show relevant GT program information and academic resources.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Protection & FERPA Compliance</h2>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Access Logging:</strong> All access to your educational data is logged for FERPA compliance</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Data Isolation:</strong> Your academic information is private and not shared with other students</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Secure Storage:</strong> All data is encrypted and stored securely on Georgia Tech approved infrastructure</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>Limited Access:</strong> Only you and authorized GT academic advisors can access your planning data</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
                <div className="space-y-4 text-gray-700">
                  <p>Under FERPA and privacy regulations, you have the right to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Access and review your educational records stored in the planner</li>
                    <li>Request corrections to inaccurate course planning data</li>
                    <li>Control who can access your academic planning information</li>
                    <li>Request deletion of your account and associated data</li>
                    <li>Opt out of non-essential cookies and tracking</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 mb-4">
                    For questions about this privacy policy, your data, or FERPA compliance:
                  </p>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Georgia Tech Registrar:</strong> registrar@gatech.edu</p>
                    <p><strong>GT Privacy Office:</strong> privacy@gatech.edu</p>
                    <p><strong>Course Planner Support:</strong> courseplan-support@gatech.edu</p>
                  </div>
                </div>
              </section>

              <section className="border-t pt-6">
                <p className="text-sm text-gray-600">
                  <strong>Last Updated:</strong> {new Date().toLocaleDateString()} <br/>
                  This privacy policy applies specifically to the Georgia Tech Course Planner application 
                  and is subject to Georgia Tech&apos;s overall privacy policies and FERPA regulations.
                </p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}