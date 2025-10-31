"use client";

import React, { useState, useMemo } from 'react';
import { useAdvisors } from '@/hooks/useAdvisors';
import { Advisor } from '@/types';
import { AdvisorCard } from './AdvisorCard';
import { AdvisorProfile } from './AdvisorProfile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2, Users } from 'lucide-react';

interface AdvisorDirectoryProps {
  onBookAppointment?: (advisor: Advisor) => void;
}

export function AdvisorDirectory({ onBookAppointment }: AdvisorDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [acceptingOnly, setAcceptingOnly] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);

  const { data: advisors, isLoading, error } = useAdvisors(
    acceptingOnly ? { acceptingStudents: true } : undefined
  );

  // Client-side search filtering
  const filteredAdvisors = useMemo(() => {
    if (!advisors) return [];

    if (!searchQuery.trim()) return advisors;

    const query = searchQuery.toLowerCase();
    return advisors.filter(
      (advisor) =>
        advisor.full_name.toLowerCase().includes(query) ||
        advisor.email.toLowerCase().includes(query) ||
        advisor.specializations.some((spec) => spec.toLowerCase().includes(query)) ||
        advisor.departments.some((dept) => dept.toLowerCase().includes(query))
    );
  }, [advisors, searchQuery]);

  // Extract unique specializations and departments for potential future filter dropdowns
  const allSpecializations = useMemo(() => {
    if (!advisors) return [];
    const specs = new Set<string>();
    advisors.forEach((advisor) => {
      advisor.specializations.forEach((spec) => specs.add(spec));
    });
    return Array.from(specs).sort();
  }, [advisors]);

  const allDepartments = useMemo(() => {
    if (!advisors) return [];
    const depts = new Set<string>();
    advisors.forEach((advisor) => {
      advisor.departments.forEach((dept) => depts.add(dept));
    });
    return Array.from(depts).sort();
  }, [advisors]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">
            Search advisors
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              type="text"
              placeholder="Search by name, specialization, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="accepting-only"
            checked={acceptingOnly}
            onCheckedChange={(checked) => setAcceptingOnly(checked === true)}
          />
          <Label
            htmlFor="accepting-only"
            className="text-sm font-medium cursor-pointer"
          >
            Accepting students only
          </Label>
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#003057]" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading advisors</p>
          <p className="text-sm">Failed to load advisors. Please try again later.</p>
        </div>
      )}

      {!isLoading && !error && filteredAdvisors.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No advisors found</h3>
          <p className="text-gray-500">
            {searchQuery
              ? 'Try adjusting your search terms or filters.'
              : acceptingOnly
              ? 'No advisors are currently accepting students.'
              : 'Check back later for advisor information.'}
          </p>
        </div>
      )}

      {!isLoading && !error && filteredAdvisors.length > 0 && (
        <>
          <p className="text-sm text-gray-600">
            Showing {filteredAdvisors.length} advisor{filteredAdvisors.length !== 1 ? 's' : ''}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAdvisors.map((advisor) => (
              <AdvisorCard
                key={advisor.id}
                advisor={advisor}
                onViewProfile={setSelectedAdvisor}
              />
            ))}
          </div>
        </>
      )}

      {/* Advisor Profile Modal */}
      <AdvisorProfile
        advisor={selectedAdvisor}
        isOpen={!!selectedAdvisor}
        onClose={() => setSelectedAdvisor(null)}
        onBookAppointment={onBookAppointment}
      />
    </div>
  );
}
