"use client";

import React from 'react';
import { Opportunity } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Briefcase } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onApply: (opportunity: Opportunity) => void;
}

const opportunityTypeColors = {
  internship: 'bg-blue-100 text-blue-800 border-blue-200',
  'co-op': 'bg-green-100 text-green-800 border-green-200',
  research: 'bg-purple-100 text-purple-800 border-purple-200',
  job: 'bg-orange-100 text-orange-800 border-orange-200',
};

const opportunityTypeLabels = {
  internship: 'Internship',
  'co-op': 'Co-op',
  research: 'Research',
  job: 'Full-Time Job',
};

export function OpportunityCard({ opportunity, onApply }: OpportunityCardProps) {
  const deadline = opportunity.application_deadline
    ? new Date(opportunity.application_deadline)
    : null;

  const isDeadlineSoon =
    deadline && (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 7;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg mb-2 truncate">{opportunity.title}</CardTitle>
            <CardDescription className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Briefcase className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{opportunity.company}</span>
            </CardDescription>
          </div>
          <Badge
            className={opportunityTypeColors[opportunity.opportunity_type]}
            variant="outline"
          >
            {opportunityTypeLabels[opportunity.opportunity_type]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 sm:p-6">
        <p className="text-sm text-gray-600 line-clamp-3 break-words">
          {opportunity.description || 'No description available.'}
        </p>

        <div className="mt-4 space-y-2">
          {opportunity.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{opportunity.location}</span>
            </div>
          )}

          {deadline && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className={isDeadlineSoon ? 'text-red-600 font-medium' : 'text-gray-600'}>
                Apply by: {deadline.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 sm:p-6">
        <Button
          onClick={() => onApply(opportunity)}
          className="w-full bg-[#003057] hover:bg-[#003057]/90 text-white"
        >
          Apply Now
        </Button>
      </CardFooter>
    </Card>
  );
}
