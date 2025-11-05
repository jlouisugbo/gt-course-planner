"use client";

import React, { useState } from 'react';
import { Opportunity } from '@/types';
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
import { useCreateApplication } from '@/hooks/useOpportunities';
import { Loader2, Upload } from 'lucide-react';

interface OpportunityApplicationModalProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OpportunityApplicationModal({
  opportunity,
  isOpen,
  onClose,
}: OpportunityApplicationModalProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const createApplication = useCreateApplication();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!opportunity) return;

    try {
      await createApplication.mutateAsync({
        opportunity_id: opportunity.id,
        cover_letter: coverLetter
      });

      // Reset form and close
      setCoverLetter('');
      setSaveAsDraft(false);
      onClose();
    } catch (error) {
      console.error('Error creating application:', error);
      // Error is already displayed via mutation error state
    }
  };

  const handleClose = () => {
    setCoverLetter('');
    setSaveAsDraft(false);
    createApplication.reset();
    onClose();
  };

  if (!opportunity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Apply to {opportunity.title}</DialogTitle>
          <DialogDescription>
            {opportunity.company} - {opportunity.location}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="cover-letter">
              Cover Letter <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="cover-letter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you're a great fit for this opportunity..."
              rows={8}
              required
              className="resize-none"
            />
          </div>

          {/* Resume Upload Placeholder */}
          <div className="space-y-2">
            <Label htmlFor="resume">Resume</Label>
            <div className="flex items-center gap-2">
              <Input
                id="resume"
                type="file"
                disabled
                className="flex-1 cursor-not-allowed opacity-50"
              />
              <Button type="button" disabled variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Resume upload coming soon. For now, include a link to your resume in your cover letter.
            </p>
          </div>

          {/* Error Display */}
          {createApplication.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg">
              <p className="text-sm break-words">
                {createApplication.error instanceof Error
                  ? createApplication.error.message
                  : 'Failed to submit application. Please try again.'}
              </p>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createApplication.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => setSaveAsDraft(true)}
              variant="outline"
              disabled={createApplication.isPending || !coverLetter.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {createApplication.isPending && saveAsDraft ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save as Draft'
              )}
            </Button>
            <Button
              type="submit"
              onClick={() => setSaveAsDraft(false)}
              disabled={createApplication.isPending || !coverLetter.trim()}
              className="w-full sm:w-auto bg-[#003057] hover:bg-[#003057]/90 flex items-center justify-center gap-2"
            >
              {createApplication.isPending && !saveAsDraft ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
