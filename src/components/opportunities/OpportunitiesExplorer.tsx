"use client";

import React, { useState, useMemo } from 'react';
import { useOpportunities } from '@/hooks/useOpportunities';
import { Opportunity } from '@/types';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityApplicationModal } from './OpportunityApplicationModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, Briefcase } from 'lucide-react';

export function OpportunitiesExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const { data: opportunities, isLoading, error } = useOpportunities(
    typeFilter !== 'all' ? { type: typeFilter as any } : undefined
  );

  // Client-side search filtering
  const filteredOpportunities = useMemo(() => {
    if (!opportunities) return [];

    if (!searchQuery.trim()) return opportunities;

    const query = searchQuery.toLowerCase();
    return opportunities.filter(
      (opp) =>
        opp.title.toLowerCase().includes(query) ||
        opp.company.toLowerCase().includes(query) ||
        opp.description?.toLowerCase().includes(query)
    );
  }, [opportunities, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">
            Search opportunities
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              type="text"
              placeholder="Search by title, company, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="md:w-48">
          <Label htmlFor="type-filter" className="sr-only">
            Filter by type
          </Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger id="type-filter">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="internship">Internships</SelectItem>
              <SelectItem value="co-op">Co-ops</SelectItem>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="job">Full-Time Jobs</SelectItem>
            </SelectContent>
          </Select>
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
          <p className="font-medium">Error loading opportunities</p>
          <p className="text-sm">Failed to load opportunities. Please try again later.</p>
        </div>
      )}

      {!isLoading && !error && filteredOpportunities.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
          <p className="text-gray-500">
            {searchQuery
              ? 'Try adjusting your search terms or filters.'
              : 'Check back later for new opportunities.'}
          </p>
        </div>
      )}

      {!isLoading && !error && filteredOpportunities.length > 0 && (
        <>
          <p className="text-sm text-gray-600">
            Showing {filteredOpportunities.length} opportunit
            {filteredOpportunities.length !== 1 ? 'ies' : 'y'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onApply={setSelectedOpportunity}
              />
            ))}
          </div>
        </>
      )}

      {/* Application Modal */}
      <OpportunityApplicationModal
        opportunity={selectedOpportunity}
        isOpen={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
      />
    </div>
  );
}
