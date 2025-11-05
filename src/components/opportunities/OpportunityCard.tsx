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
    <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-gt-gold/30 hover:border-l-gt-gold backdrop-blur-sm bg-white/95">
      <CardHeader className="p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg mb-1 truncate">{opportunity.title}</CardTitle>
            <CardDescription className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mt-0.5">
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

      <CardContent className="flex-1 p-2.5 sm:p-4 pt-0">
        <p className="text-sm text-gray-600 line-clamp-3 break-words">
          {opportunity.description || 'No description available.'}
        </p>

        <div className="mt-2.5 space-y-1">
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

      <CardFooter className="p-2.5 sm:p-4 pt-2">
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
