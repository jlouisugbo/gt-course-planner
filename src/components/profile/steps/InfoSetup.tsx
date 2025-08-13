/**
 * Enhanced Info Setup Step
 * Personal information collection with real-time validation
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Hash } from "lucide-react";
import { /* FormError, */ ValidatedInputWrapper } from "@/components/ui/form-validation";
import { ExtendedProfileData } from "@/hooks/useProfileSetup";

interface InfoSetupProps {
  profile: Partial<ExtendedProfileData>;
  updateProfile: <K extends keyof ExtendedProfileData>(field: K, value: ExtendedProfileData[K]) => void;
  errors: Record<string, string>;
}

export const InfoSetup: React.FC<InfoSetupProps> = ({
  profile,
  updateProfile,
  errors,
}) => {
  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {/* Full Name */}
        <Card className={`transition-all duration-200 ${errors.name ? 'border-red-300 bg-red-50/50' : 'hover:shadow-md'}`}>
          <CardContent className="py-2 px-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#B3A369]" />
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name *
                </Label>
              </div>
              <ValidatedInputWrapper error={errors.name} touched={!!profile.name}>
                <Input
                  id="name"
                  type="text"
                  value={profile.name || ''}
                  onChange={(e) => updateProfile('name', e.target.value)}
                  placeholder="Enter your full name"
                  className={errors.name ? 'border-red-300' : ''}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
              </ValidatedInputWrapper>
            </div>
          </CardContent>
        </Card>

        {/* Email */}
        <Card className={`transition-all duration-200 ${errors.email ? 'border-red-300 bg-red-50/50' : 'hover:shadow-md'}`}>
          <CardContent className="py-2 px-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#B3A369]" />
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
              </div>
              <ValidatedInputWrapper error={errors.email} touched={!!profile.email}>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => updateProfile('email', e.target.value)}
                  placeholder="your.email@gatech.edu"
                  className={errors.email ? 'border-red-300' : ''}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </ValidatedInputWrapper>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* GT ID */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={`transition-all duration-200 ${errors.gtId ? 'border-red-300 bg-red-50/50' : 'hover:shadow-md'}`}>
          <CardContent className="py-2 px-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-[#B3A369]" />
                <Label htmlFor="gtId" className="text-sm font-medium">
                  GT ID *
                </Label>
              </div>
              <div className="max-w-md">
                <ValidatedInputWrapper error={errors.gtId} touched={!!profile.gtId}>
                  <Input
                    id="gtId"
                    type="number"
                    value={profile.gtId || ''}
                    onChange={(e) => updateProfile('gtId', parseInt(e.target.value) || 0)}
                    placeholder="903123456"
                    className={errors.gtId ? 'border-red-300' : ''}
                    aria-invalid={!!errors.gtId}
                    aria-describedby={errors.gtId ? 'gtId-error' : 'gtId-help'}
                  />
                  <p id="gtId-help" className="text-xs text-muted-foreground mt-1">
                    Your 9-digit Georgia Tech student ID number
                  </p>
                </ValidatedInputWrapper>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-[#003057]/5 border-[#003057]/20">
          <CardContent className="py-2 px-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#003057] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-[#003057]">
                  Why do we need this information?
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• <strong>Full Name:</strong> Used throughout the application and for official records</p>
                  <p>• <strong>Email:</strong> For notifications, account recovery, and important updates</p>
                  <p>• <strong>GT ID:</strong> Links your profile to Georgia Tech systems and course records</p>
                </div>
                <p className="text-xs text-[#B3A369] font-medium">
                  🔒 All information is securely stored and never shared without your permission
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};