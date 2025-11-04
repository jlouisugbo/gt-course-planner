"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvisorDirectory } from '@/components/advisors/AdvisorDirectory';
import { MyAdvisors } from '@/components/advisors/MyAdvisors';
import { AdvisorAppointments } from '@/components/advisors/AdvisorAppointments';
import { AppointmentBooking } from '@/components/advisors/AppointmentBooking';
import { Advisor } from '@/types';
import { Users, Calendar, UserCheck } from 'lucide-react';

export default function AdvisorsPage() {
  const [selectedAdvisorForBooking, setSelectedAdvisorForBooking] = useState<Advisor | null>(
    null
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-[#003057] rounded-lg flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#003057]">Academic Advisors</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Connect with advisors and schedule appointments
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="directory" className="space-y-5">
        <TabsList className="grid w-full max-w-2xl grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="directory" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Directory
          </TabsTrigger>
          <TabsTrigger value="my-advisors" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            My Advisors
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <AdvisorDirectory onBookAppointment={setSelectedAdvisorForBooking} />
        </TabsContent>

        <TabsContent value="my-advisors">
          <MyAdvisors onBookAppointment={setSelectedAdvisorForBooking} />
        </TabsContent>

        <TabsContent value="appointments">
          <AdvisorAppointments />
        </TabsContent>
      </Tabs>

      {/* Appointment Booking Modal */}
      <AppointmentBooking
        advisor={selectedAdvisorForBooking}
        isOpen={!!selectedAdvisorForBooking}
        onClose={() => setSelectedAdvisorForBooking(null)}
      />
    </div>
  );
}
