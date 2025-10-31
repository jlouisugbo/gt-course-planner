'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from './AuthProvider';
import { CoursesProvider } from './CoursesProvider';
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Simplified provider hierarchy for MVP.
 * Removed nested error boundaries that were causing re-render issues.
 * Single GlobalErrorBoundary provides sufficient error handling for MVP.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CoursesProvider>
            <DndProvider backend={HTML5Backend}>
              {children}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#003057',
                    color: '#fff',
                    border: '1px solid #B3A369',
                  },
                }}
              />
            </DndProvider>
          </CoursesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}