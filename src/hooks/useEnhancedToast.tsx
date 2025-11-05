"use client";

import React from "react";
import { toast as baseToast } from "sonner";
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export interface EnhancedToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useEnhancedToast() {
  const showToast = React.useCallback((
    type: "success" | "error" | "info" | "warning",
    message: string,
    options?: EnhancedToastOptions
  ) => {
    const iconMap = {
      success: CheckCircle,
      error: AlertCircle,
      info: Info,
      warning: AlertTriangle,
    };

    const colorMap = {
      success: "text-green-600",
      error: "text-red-600", 
      info: "text-gt-navy",
      warning: "text-amber-600",
    };

    const bgMap = {
      success: "bg-green-50 border-green-200",
      error: "bg-red-50 border-red-200",
      info: "bg-gt-navy-50 border-gt-navy-200",
      warning: "bg-amber-50 border-amber-200",
    };

    const Icon = iconMap[type];

    const toastContent = (
      <div className={`flex items-start space-x-3 p-4 rounded-lg border ${bgMap[type]}`}>
        <Icon className={`h-5 w-5 mt-0.5 ${colorMap[type]} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          {options?.title && (
            <div className="font-semibold text-gt-navy mb-1">{options.title}</div>
          )}
          <div className="text-sm text-gray-700">{message}</div>
          {options?.description && (
            <div className="text-xs text-gray-500 mt-1">{options.description}</div>
          )}
        </div>
        {options?.action && (
          <button
            onClick={options.action.onClick}
            className="text-xs font-medium text-gt-gold hover:text-gt-gold/80 transition-colors px-2 py-1 rounded hover:bg-gt-gold/10"
          >
            {options.action.label}
          </button>
        )}
      </div>
    );

    baseToast.custom(() => toastContent, {
      duration: options?.duration || 4000,
      unstyled: true,
    });
  }, []);

  return {
    toast: showToast,
    success: (message: string, options?: EnhancedToastOptions) => 
      showToast("success", message, options),
    error: (message: string, options?: EnhancedToastOptions) => 
      showToast("error", message, options),
    info: (message: string, options?: EnhancedToastOptions) => 
      showToast("info", message, options),
    warning: (message: string, options?: EnhancedToastOptions) => 
      showToast("warning", message, options),
    dismiss: () => baseToast.dismiss(),
  };
}

// Pre-built toast messages for common actions
export const toastMessages = {
  courseAdded: (courseName: string) => ({
    title: "Course Added",
    message: `${courseName} has been added to your planner`,
    type: "success" as const,
  }),
  courseRemoved: (courseName: string) => ({
    title: "Course Removed", 
    message: `${courseName} has been removed from your planner`,
    type: "info" as const,
  }),
  courseCompleted: (courseName: string, grade?: string) => ({
    title: "Course Completed",
    message: `${courseName} marked as completed${grade ? ` with grade ${grade}` : ""}`,
    type: "success" as const,
  }),
  prereqViolation: (courseName: string) => ({
    title: "Prerequisites Required",
    message: `${courseName} has unmet prerequisites`,
    type: "warning" as const,
  }),
  saveError: {
    title: "Save Failed",
    message: "Unable to save changes. Please try again.",
    type: "error" as const,
  },
  connectionError: {
    title: "Connection Error",
    message: "Unable to connect to server. Please check your connection.",
    type: "error" as const,
  },
  profileSaved: {
    title: "Profile Updated",
    message: "Your profile has been saved successfully",
    type: "success" as const,
  },
  plannerSaved: {
    title: "Planner Saved",
    message: "Your course plan has been saved",
    type: "success" as const,
  },
};