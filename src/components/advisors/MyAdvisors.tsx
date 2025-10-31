"use client";

import React, { useState } from 'react';
import { useMyAdvisors } from '@/hooks/useAdvisors';
import { Advisor } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Loader2, Users, Mail, MapPin, Calendar } from 'lucide-react';
import { AdvisorProfile } from './AdvisorProfile';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusLabels = {
  pending: 'Pending',
  active: 'Active',
  declined: 'Declined',
  inactive: 'Inactive',
};

interface MyAdvisorsProps {
  onBookAppointment?: (advisor: Advisor) => void;
}

export function MyAdvisors({ onBookAppointment }: MyAdvisorsProps) {
  const { data: connections, isLoading, error } = useMyAdvisors();
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#003057]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Error loading connections</p>
        <p className="text-sm">Failed to load your advisor connections. Please try again later.</p>
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No advisor connections</h3>
        <p className="text-gray-500">
          Browse the advisor directory to request connections with advisors.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          You have {connections.length} advisor connection{connections.length !== 1 ? 's' : ''}
        </p>

        <div className="grid gap-4">
          {connections.map((connection) => {
            const advisor = connection.advisor;
            if (!advisor) return null;

            return (
              <Card key={connection.id}>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate">{advisor.full_name}</CardTitle>
                      {advisor.title && (
                        <CardDescription className="mt-1 truncate">{advisor.title}</CardDescription>
                      )}
                    </div>
                    <Badge
                      className={statusColors[connection.status]}
                      variant="outline"
                    >
                      {statusLabels[connection.status]}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    {/* Specializations */}
                    {advisor.specializations.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          Specializations:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {advisor.specializations.map((spec, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <a
                          href={`mailto:${advisor.email}`}
                          className="text-blue-600 hover:underline truncate"
                        >
                          {advisor.email}
                        </a>
                      </div>

                      {advisor.office_location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{advisor.office_location}</span>
                        </div>
                      )}
                    </div>

                    {/* Connection Notes */}
                    {connection.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600 mb-1">Notes:</p>
                        <p className="text-sm text-gray-700 break-words">{connection.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAdvisor(advisor)}
                      >
                        View Profile
                      </Button>

                      {connection.status === 'active' && onBookAppointment && (
                        <Button
                          size="sm"
                          onClick={() => onBookAppointment(advisor)}
                          className="bg-[#003057] hover:bg-[#003057]/90 flex items-center gap-1.5"
                        >
                          <Calendar className="h-4 w-4" />
                          <span>Book Appointment</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Advisor Profile Modal */}
      <AdvisorProfile
        advisor={selectedAdvisor}
        isOpen={!!selectedAdvisor}
        onClose={() => setSelectedAdvisor(null)}
        onBookAppointment={onBookAppointment}
      />
    </>
  );
}
