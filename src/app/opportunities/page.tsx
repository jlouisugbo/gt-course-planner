"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OpportunitiesExplorer } from '@/components/opportunities/OpportunitiesExplorer';
import { MyApplications } from '@/components/opportunities/MyApplications';
import { Briefcase, FileText } from 'lucide-react';

export default function OpportunitiesPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-[#003057] rounded-lg flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#003057]">Opportunities</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Explore internships, co-ops, research positions, and jobs
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="browse" className="space-y-5">
        <TabsList className="grid w-full max-w-md grid-cols-1 sm:grid-cols-2">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            My Applications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <OpportunitiesExplorer />
        </TabsContent>

        <TabsContent value="applications">
          <MyApplications />
        </TabsContent>
      </Tabs>
    </div>
  );
}
