"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClearAuthPage() {
  const [cleared, setCleared] = useState(false);
  const [cookies, setCookies] = useState<string[]>([]);

  useEffect(() => {
    // Show all cookies
    const allCookies = document.cookie.split(';').map(c => c.trim());
    setCookies(allCookies);
  }, []);

  const clearEverything = async () => {
    console.log('🧹 Clearing all authentication state...');

    // 1. Sign out from Supabase
    await supabase.auth.signOut();

    // 2. Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // 3. Clear localStorage
    localStorage.clear();

    // 4. Clear sessionStorage
    sessionStorage.clear();

    setCleared(true);

    console.log('✅ All auth state cleared!');

    // Redirect to landing after 2 seconds
    setTimeout(() => {
      window.location.href = '/landing';
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-gt-navy">Clear Authentication State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-gt-navy">Current Cookies:</h3>
            <div className="bg-gray-100 p-4 rounded-lg max-h-40 overflow-y-auto">
              {cookies.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {cookies.map((cookie, i) => (
                    <li key={i} className="text-gray-700 font-mono text-xs">
                      {cookie.split('=')[0]}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No cookies found</p>
              )}
            </div>
          </div>

          {!cleared ? (
            <Button
              onClick={clearEverything}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              🧹 Clear All Auth State (Cookies, LocalStorage, Sessions)
            </Button>
          ) : (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="font-semibold text-green-900">✅ All authentication state cleared!</p>
              <p className="text-sm text-green-700 mt-2">
                Redirecting to landing page in 2 seconds...
              </p>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-900">
              <strong>This will:</strong>
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
              <li>Sign out from Supabase</li>
              <li>Delete all cookies (including auth tokens)</li>
              <li>Clear localStorage</li>
              <li>Clear sessionStorage</li>
              <li>Redirect you to the landing page</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
