"use client";

import React from 'react';
import { Advisor, AdvisorConnection } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCreateConnection, useMyAdvisors } from '@/hooks/useAdvisors';
import {
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
} from 'lucide-react';

interface AdvisorProfileProps {
  advisor: Advisor | null;
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment?: (advisor: Advisor) => void;
}

export function AdvisorProfile({
  advisor,
  isOpen,
  onClose,
  onBookAppointment,
}: AdvisorProfileProps) {
  const createConnection = useCreateConnection();
  const { data: connections } = useMyAdvisors();

  if (!advisor) return null;

  // Check if user has a connection with this advisor
  const existingConnection = connections?.find(
    (conn) => conn.advisor_id === advisor.id
  );

  const isConnected = existingConnection?.status === 'active';
  const isPending = existingConnection?.status === 'pending';

  const handleRequestConnection = async () => {
    if (existingConnection) return;

    try {
      await createConnection.mutateAsync({
        advisor_id: advisor.id,
        connection_type: 'requested',
      });
    } catch (error) {
      console.error('Error requesting connection:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl truncate">{advisor.full_name}</DialogTitle>
          {advisor.title && (
            <DialogDescription className="text-sm sm:text-base font-medium truncate">
              {advisor.title}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div>
            {advisor.is_accepting_students ? (
              <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                <CheckCircle className="h-4 w-4 mr-1" />
                Accepting Students
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-600 border-gray-200" variant="outline">
                <XCircle className="h-4 w-4 mr-1" />
                Not Currently Accepting Students
              </Badge>
            )}
          </div>

          {/* Bio */}
          {advisor.bio && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{advisor.bio}</p>
            </div>
          )}

          {/* Specializations */}
          {advisor.specializations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {advisor.specializations.map((spec, index) => (
                  <Badge key={index} variant="secondary">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Departments */}
          {advisor.departments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Departments</h3>
              <div className="flex flex-wrap gap-2">
                {advisor.departments.map((dept, index) => (
                  <Badge key={index} variant="outline">
                    {dept}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold mb-3">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${advisor.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {advisor.email}
                </a>
              </div>

              {advisor.office_location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{advisor.office_location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Office Hours */}
          {advisor.office_hours && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                Office Hours
              </h3>
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                <p className="whitespace-pre-wrap break-words">
                  {typeof advisor.office_hours === 'string'
                    ? advisor.office_hours
                    : JSON.stringify(advisor.office_hours, null, 2)}
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {createConnection.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg">
              <p className="text-sm break-words">
                {createConnection.error instanceof Error
                  ? createConnection.error.message
                  : 'Failed to request connection. Please try again.'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>

          {!isConnected && !isPending && advisor.is_accepting_students && (
            <Button
              onClick={handleRequestConnection}
              disabled={createConnection.isPending}
              className="w-full sm:w-auto bg-[#003057] hover:bg-[#003057]/90 flex items-center justify-center gap-2"
            >
              {createConnection.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Requesting...</span>
                </>
              ) : (
                'Request Connection'
              )}
            </Button>
          )}

          {isPending && (
            <Badge variant="secondary" className="py-2 px-4 w-full sm:w-auto justify-center">
              Connection Pending
            </Badge>
          )}

          {isConnected && onBookAppointment && (
            <Button
              onClick={() => {
                onClose();
                onBookAppointment(advisor);
              }}
              className="w-full sm:w-auto bg-[#003057] hover:bg-[#003057]/90 flex items-center justify-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Book Appointment</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
