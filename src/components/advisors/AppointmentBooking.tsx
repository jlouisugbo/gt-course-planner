"use client";

import React, { useState } from 'react';
import { Advisor } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateAppointment } from '@/hooks/useAdvisors';
import { Loader2, Calendar } from 'lucide-react';

interface AppointmentBookingProps {
  advisor: Advisor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AppointmentBooking({
  advisor,
  isOpen,
  onClose,
}: AppointmentBookingProps) {
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [meetingType, setMeetingType] = useState<'in-person' | 'virtual' | 'phone'>(
    'in-person'
  );
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  const createAppointment = useCreateAppointment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!advisor || !appointmentDate || !appointmentTime) return;

    // Combine date and time
    const dateTimeString = `${appointmentDate}T${appointmentTime}:00`;

    try {
      await createAppointment.mutateAsync({
        advisor_id: advisor.id,
        appointment_date: dateTimeString,
        duration_minutes: parseInt(duration),
        meeting_type: meetingType,
        meeting_link: meetingType === 'virtual' ? meetingLink : undefined,
        topic: topic || undefined,
        notes: notes || undefined,
      });

      // Reset form and close
      handleClose();
    } catch (error) {
      console.error('Error creating appointment:', error);
      // Error is already displayed via mutation error state
    }
  };

  const handleClose = () => {
    setAppointmentDate('');
    setAppointmentTime('');
    setDuration('30');
    setMeetingType('in-person');
    setTopic('');
    setNotes('');
    setMeetingLink('');
    createAppointment.reset();
    onClose();
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  if (!advisor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calendar className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Book Appointment with {advisor.full_name}</span>
          </DialogTitle>
          <DialogDescription className="truncate">
            {advisor.title} - {advisor.office_location}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={today}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">
                Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Type */}
          <div className="space-y-2">
            <Label htmlFor="meeting-type">
              Meeting Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={meetingType}
              onValueChange={(value: any) => setMeetingType(value)}
            >
              <SelectTrigger id="meeting-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-person">In-Person</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Link (for virtual meetings) */}
          {meetingType === 'virtual' && (
            <div className="space-y-2">
              <Label htmlFor="meeting-link">Meeting Link</Label>
              <Input
                id="meeting-link"
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
              <p className="text-xs text-gray-500">
                The advisor will provide a meeting link if you leave this blank.
              </p>
            </div>
          )}

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Course selection, career advice"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information or questions..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Error Display */}
          {createAppointment.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg">
              <p className="text-sm break-words">
                {createAppointment.error instanceof Error
                  ? createAppointment.error.message
                  : 'Failed to book appointment. Please try again.'}
              </p>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createAppointment.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createAppointment.isPending ||
                !appointmentDate ||
                !appointmentTime ||
                !meetingType
              }
              className="w-full sm:w-auto bg-[#003057] hover:bg-[#003057]/90 flex items-center justify-center gap-2"
            >
              {createAppointment.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Booking...</span>
                </>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
