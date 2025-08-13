'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from './AuthProvider';
import { CoursesProvider } from './CoursesProvider';
import { AsyncErrorBoundary } from '@/components/error/AsyncErrorBoundary';
import { GlobalErrorBoundary, CriticalErrorBoundary } from '@/components/error/GlobalErrorBoundary';
import { AuthErrorBoundary } from '@/components/error/AuthErrorBoundary';
import AuthMonitoringDashboard from '@/components/debug/AuthMonitoringDashboard';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const handleAuthError = (error: Error) => {
    console.error('AppProviders: Critical auth error:', error);
    // In production, report to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: reportSecurityEvent('auth_error', error);
    }
  };


  const handleForceSignOut = async () => {
    console.log('AppProviders: Force sign-out initiated');
    try {
      // Clear all local storage and redirect
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear any service worker caches
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        }
        
        // Hard redirect to clear all state
        window.location.replace('/');
      }
    } catch (error) {
      console.error('AppProviders: Force sign-out failed:', error);
      // Ultimate fallback
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  return (
    <GlobalErrorBoundary>
      <AsyncErrorBoundary 
        context="general"
        onError={(error) => {
          console.error('AppProviders error:', error);
          // In production, report to error monitoring service
        }}
      >
        <QueryClientProvider client={queryClient}>
          <CriticalErrorBoundary>
            <AuthErrorBoundary 
              onAuthError={handleAuthError}
              onForceSignOut={handleForceSignOut}
            >
              <AsyncErrorBoundary context="auth">
                <AuthProvider>
                  <AsyncErrorBoundary context="courses">
                    <CoursesProvider>
                      <DndProvider backend={HTML5Backend}>
                        {children}
                        
                        {/* Development tools */}
                        {process.env.NODE_ENV === 'development' && (
                          <>
                            <ReactQueryDevtools initialIsOpen={false} />
                            <AuthMonitoringDashboard />
                          </>
                        )}
                      </DndProvider>
                    </CoursesProvider>
                  </AsyncErrorBoundary>
                </AuthProvider>
              </AsyncErrorBoundary>
            </AuthErrorBoundary>
          </CriticalErrorBoundary>
        </QueryClientProvider>
      </AsyncErrorBoundary>
    </GlobalErrorBoundary>
  );
}