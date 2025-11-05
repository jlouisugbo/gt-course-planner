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
    <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-gt-navy/30 hover:border-l-gt-navy backdrop-blur-sm bg-white/95">
      <CardHeader className="p-2.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg mb-0.5 truncate">{advisor.full_name}</CardTitle>
            {advisor.title && (
              <CardDescription className="text-sm font-medium text-gray-700 truncate mt-0">
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

      <CardContent className="flex-1 p-2.5 sm:p-4 pt-0">
        {/* Specializations */}
        {advisor.specializations.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-medium text-gray-600 mb-1">Specializations:</p>
            <div className="flex flex-wrap gap-1">
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
          <div className="mb-2">
            <p className="text-xs font-medium text-gray-600 mb-0.5">Departments:</p>
            <p className="text-sm text-gray-700 truncate">{advisor.departments.join(', ')}</p>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-1 mt-2.5">
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

      <CardFooter className="p-2.5 sm:p-4 pt-2">
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
