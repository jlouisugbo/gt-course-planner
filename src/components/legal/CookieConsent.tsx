'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, Settings, X, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface CookieSettings {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = 'gt-course-planner-cookie-consent';
const COOKIE_SETTINGS_KEY = 'gt-course-planner-cookie-settings';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true, // Always required
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made consent decision
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedSettings = localStorage.getItem(COOKIE_SETTINGS_KEY);
    
    if (!hasConsent) {
      setShowBanner(true);
    } else if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookieSettings = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    
    saveConsentSettings(allAccepted);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookieSettings = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    
    saveConsentSettings(onlyNecessary);
    setShowBanner(false);
  };

  const handleSaveSettings = () => {
    saveConsentSettings(settings);
    setShowBanner(false);
    setShowSettings(false);
  };

  const saveConsentSettings = (cookieSettings: CookieSettings) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_SETTINGS_KEY, JSON.stringify(cookieSettings));
    
    // Apply cookie settings to actual services
    applyCookieSettings(cookieSettings);
  };

  const applyCookieSettings = (cookieSettings: CookieSettings) => {
    // Disable/enable analytics based on consent
    if (!cookieSettings.analytics) {
      // Clear any analytics cookies/storage
      document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
      document.cookie = '_ga_*=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
    }

    // Disable/enable marketing cookies
    if (!cookieSettings.marketing) {
      // Clear marketing cookies
      document.cookie = '_fbp=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
    }

    // Note: Necessary and functional cookies (Supabase auth, Zustand persist) 
    // are always allowed as they're essential for app functionality
  };

  const cookieCategories = [
    {
      id: 'necessary' as keyof CookieSettings,
      title: 'Necessary Cookies',
      description: 'Essential for GT Course Planner to function. Includes authentication and your saved academic progress.',
      required: true,
      examples: 'Authentication tokens, session data, course planner state',
    },
    {
      id: 'functional' as keyof CookieSettings,
      title: 'Functional Cookies',
      description: 'Enhance your experience with personalized features and preferences.',
      required: false,
      examples: 'Theme preferences, language settings, user interface customization',
    },
    {
      id: 'analytics' as keyof CookieSettings,
      title: 'Analytics Cookies',
      description: 'Help us understand how students use the course planner to improve the service.',
      required: false,
      examples: 'Google Analytics, usage statistics, performance monitoring',
    },
    {
      id: 'marketing' as keyof CookieSettings,
      title: 'Marketing Cookies',
      description: 'Used to provide relevant information about GT programs and services.',
      required: false,
      examples: 'Social media integration, promotional content personalization',
    },
  ];

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />

          {/* Cookie Banner */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4"
          >
            <Card className="max-w-4xl mx-auto bg-white border-2 border-yellow-200 shadow-2xl">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Cookie className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      🏫 GT Course Planner Cookie Notice
                    </h3>
                    <p className="text-gray-700 text-sm mb-4">
                      We use cookies to provide essential functionality for your academic planning experience, 
                      remember your preferences, and improve our service. As a Georgia Tech student portal, 
                      we comply with FERPA privacy requirements for educational records.
                    </p>

                    {/* Quick action buttons */}
                    <div className="flex flex-wrap gap-3 items-center">
                      <Button
                        onClick={handleAcceptAll}
                        className="bg-[#003057] hover:bg-[#002041] text-white"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept All
                      </Button>
                      
                      <Button
                        onClick={handleRejectAll}
                        variant="outline"
                        className="border-gray-300"
                      >
                        Reject Non-Essential
                      </Button>
                      
                      <Button
                        onClick={() => setShowSettings(true)}
                        variant="outline"
                        className="border-gray-300"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Cookie Settings
                      </Button>

                      <a
                        href="/privacy"
                        className="text-sm text-blue-600 hover:text-blue-800 underline ml-auto"
                      >
                        Privacy Policy
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Detailed Settings Modal */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-60 flex items-center justify-center p-4"
              >
                <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Cookie Preferences
                      </h3>
                      <Button
                        onClick={() => setShowSettings(false)}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {cookieCategories.map((category) => (
                        <div key={category.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">
                                {category.title}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {category.description}
                              </p>
                              <p className="text-xs text-gray-500">
                                <strong>Examples:</strong> {category.examples}
                              </p>
                            </div>
                            <div className="ml-4">
                              {category.required ? (
                                <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                                  Required
                                </div>
                              ) : (
                                <Checkbox
                                  checked={settings[category.id]}
                                  onCheckedChange={(checked) =>
                                    setSettings(prev => ({
                                      ...prev,
                                      [category.id]: checked
                                    }))
                                  }
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-8 pt-6 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info className="h-4 w-4" />
                        Your choices apply to GT Course Planner only
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setShowSettings(false)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveSettings}
                          className="bg-[#003057] hover:bg-[#002041] text-white"
                        >
                          Save Preferences
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to check if cookies are consented to
export function useCookieConsent() {
  const [hasConsent, setHasConsent] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedSettings = localStorage.getItem(COOKIE_SETTINGS_KEY);
    
    setHasConsent(!!consent);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  return { hasConsent, settings };
}