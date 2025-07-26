'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { QueryClient } from '@tanstack/react-query';
import { AuthProvider } from './AuthProvider';
import { CoursesProvider } from './CoursesProvider'; 

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error && 'status' in error && (error.status as number) >= 400 && (error.status as number) < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CoursesProvider>
          <DndProvider backend={HTML5Backend}>
            {children}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </DndProvider>
        </CoursesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}