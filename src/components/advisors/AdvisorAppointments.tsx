"use client";

import React from 'react';
import { useAppointments, useDeleteAppointment } from '@/hooks/useAdvisors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Loader2, Calendar as CalendarIcon, Clock, Video, Phone, MapPin, Trash2 } from 'lucide-react';

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  'no-show': 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusLabels = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  'no-show': 'No-Show',
};

const meetingTypeIcons = {
  'in-person': MapPin,
  virtual: Video,
  phone: Phone,
};

const meetingTypeLabels = {
  'in-person': 'In-Person',
  virtual: 'Virtual',
  phone: 'Phone',
};

export function AdvisorAppointments() {
  const { data: appointments, isLoading, error } = useAppointments();
  const deleteAppointment = useDeleteAppointment();

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await deleteAppointment.mutateAsync(id);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

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
        <p className="font-medium">Error loading appointments</p>
        <p className="text-sm">Failed to load your appointments. Please try again later.</p>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments scheduled</h3>
        <p className="text-gray-500">Book an appointment with one of your advisors to get started.</p>
      </div>
    );
  }

  // Separate upcoming and past appointments
  const now = new Date();
  const upcoming = appointments.filter(
    (apt) =>
      new Date(apt.appointment_date) >= now && apt.status === 'scheduled'
  );
  const past = appointments.filter(
    (apt) =>
      new Date(apt.appointment_date) < now || apt.status !== 'scheduled'
  );

  return (
    <div className="space-y-5">
      {/* Upcoming Appointments */}
      {upcoming.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-lg font-semibold text-gray-900">
            Upcoming Appointments ({upcoming.length})
          </h3>

          <div className="grid gap-2.5">
            {upcoming.map((appointment) => {
              const advisor = appointment.advisor;
              if (!advisor) return null;

              const appointmentDate = new Date(appointment.appointment_date);
              const MeetingIcon = meetingTypeIcons[appointment.meeting_type];

              return (
                <Card key={appointment.id}>
                  <CardHeader className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2 sm:gap-2.5">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate">{advisor.full_name}</CardTitle>
                        <CardDescription className="mt-1 truncate">
                          {advisor.title}
                        </CardDescription>
                      </div>
                      <Badge
                        className={statusColors[appointment.status]}
                        variant="outline"
                      >
                        {statusLabels[appointment.status]}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="space-y-2.5">
                      {/* Date and Time */}
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium">
                          {appointmentDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>
                          {appointmentDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}{' '}
                          ({appointment.duration_minutes} minutes)
                        </span>
                      </div>

                      {/* Meeting Type */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MeetingIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                          {meetingTypeLabels[appointment.meeting_type]}
                          {appointment.meeting_type === 'in-person' && advisor.office_location && (
                            <> - {advisor.office_location}</>
                          )}
                        </span>
                      </div>

                      {/* Meeting Link */}
                      {appointment.meeting_link && (
                        <div className="mt-2">
                          <a
                            href={appointment.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline break-all"
                          >
                            Join Meeting
                          </a>
                        </div>
                      )}

                      {/* Topic */}
                      {appointment.topic && (
                        <div className="mt-2.5 p-2.5 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-600 mb-0.5">Topic:</p>
                          <p className="text-sm text-gray-700 break-words">{appointment.topic}</p>
                        </div>
                      )}

                      {/* Notes */}
                      {appointment.notes && (
                        <div className="p-2.5 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-600 mb-0.5">Notes:</p>
                          <p className="text-sm text-gray-700 break-words">{appointment.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(appointment.id)}
                          disabled={deleteAppointment.isPending}
                          className="flex items-center gap-1.5"
                        >
                          {deleteAppointment.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              <span>Cancel</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Appointments */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Past Appointments ({past.length})
          </h3>

          <div className="grid gap-3">
            {past.map((appointment) => {
              const advisor = appointment.advisor;
              if (!advisor) return null;

              const appointmentDate = new Date(appointment.appointment_date);
              const MeetingIcon = meetingTypeIcons[appointment.meeting_type];

              return (
                <Card key={appointment.id} className="opacity-75">
                  <CardHeader className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2 sm:gap-2.5">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate">{advisor.full_name}</CardTitle>
                        <CardDescription className="mt-1 truncate">
                          {advisor.title}
                        </CardDescription>
                      </div>
                      <Badge
                        className={statusColors[appointment.status]}
                        variant="outline"
                      >
                        {statusLabels[appointment.status]}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>
                          {appointmentDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MeetingIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{meetingTypeLabels[appointment.meeting_type]}</span>
                      </div>

                      {appointment.topic && (
                        <p className="text-sm text-gray-600 mt-2 break-words">Topic: {appointment.topic}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
