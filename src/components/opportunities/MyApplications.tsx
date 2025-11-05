"use client";

import React from 'react';
import { useMyApplications, useDeleteApplication } from '@/hooks/useOpportunities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Loader2, Trash2, FileText, Calendar } from 'lucide-react';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  submitted: 'bg-blue-100 text-blue-800 border-blue-200',
  under_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export function MyApplications() {
  const { data: applications, isLoading, error } = useMyApplications();
  const deleteApplication = useDeleteApplication();

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await deleteApplication.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting application:', error);
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
        <p className="font-medium">Error loading applications</p>
        <p className="text-sm">Failed to load your applications. Please try again later.</p>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
        <p className="text-gray-500">Browse opportunities and submit your first application!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="text-sm text-gray-600">
        You have {applications.length} application{applications.length !== 1 ? 's' : ''}
      </p>

      <div className="grid gap-2.5">
        {applications.map((application) => {
          const opportunity = application.opportunity;
          if (!opportunity) return null;

          return (
            <Card key={application.id} className="overflow-hidden">
              <CardHeader className="p-2.5 sm:p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base line-clamp-2">{opportunity.title}</CardTitle>
                    <CardDescription className="mt-0.5 text-xs truncate">
                      {opportunity.company} - {opportunity.location}
                    </CardDescription>
                  </div>
                  <Badge
                    className={`${statusColors[application.status]} text-xs px-2 py-0.5 flex-shrink-0`}
                    variant="outline"
                  >
                    {statusLabels[application.status]}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-2.5 sm:p-3 pt-0">
                <div className="space-y-2">
                  {application.submitted_at && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span>
                        Submitted:{' '}
                        {new Date(application.submitted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}

                  {application.cover_letter && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-0.5">Cover Letter:</p>
                      <p className="text-xs text-gray-600 line-clamp-2 break-words">
                        {application.cover_letter}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {application.status === 'draft' && (
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                        Edit Draft
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(application.id)}
                      disabled={deleteApplication.isPending}
                      className="flex items-center gap-1 h-7 text-xs px-2 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {deleteApplication.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3" />
                          Delete
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
  );
}
