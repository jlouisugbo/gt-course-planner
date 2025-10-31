"use client";

import React from 'react';
import { Advisor } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Mail, CheckCircle, XCircle } from 'lucide-react';

interface AdvisorCardProps {
  advisor: Advisor;
  onViewProfile: (advisor: Advisor) => void;
}

export function AdvisorCard({ advisor, onViewProfile }: AdvisorCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg mb-1 truncate">{advisor.full_name}</CardTitle>
            {advisor.title && (
              <CardDescription className="text-sm font-medium text-gray-700 truncate">
                {advisor.title}
              </CardDescription>
            )}
          </div>
          {advisor.is_accepting_students ? (
            <Badge className="bg-green-100 text-green-800 border-green-200 flex-shrink-0" variant="outline">
              <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              Accepting
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-600 border-gray-200 flex-shrink-0" variant="outline">
              <XCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              Not Accepting
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 sm:p-6">
        {/* Specializations */}
        {advisor.specializations.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Specializations:</p>
            <div className="flex flex-wrap gap-1.5">
              {advisor.specializations.slice(0, 3).map((spec, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {spec}
                </Badge>
              ))}
              {advisor.specializations.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{advisor.specializations.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Departments */}
        {advisor.departments.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-600 mb-1">Departments:</p>
            <p className="text-sm text-gray-700 truncate">{advisor.departments.join(', ')}</p>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-2 mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{advisor.email}</span>
          </div>

          {advisor.office_location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{advisor.office_location}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 sm:p-6">
        <Button
          onClick={() => onViewProfile(advisor)}
          variant="outline"
          className="w-full"
        >
          View Profile
        </Button>
      </CardFooter>
    </Card>
  );
}
