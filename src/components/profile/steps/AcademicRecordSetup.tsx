import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, BookOpen, Target } from "lucide-react";
import { UserProfile } from "@/types/user";
import { Checkbox } from "@/components/ui/checkbox";

interface AcademicRecordSetupProps {
  profile: Partial<UserProfile>;
  setProfile: React.Dispatch<React.SetStateAction<Partial<UserProfile>>>;
  errors: Record<string, string>;
}

export const AcademicRecordSetup: React.FC<AcademicRecordSetupProps> = ({
  profile,
  setProfile,
  errors
}) => {
  const SEMESTERS = ["Fall", "Spring", "Summer"];
  const CURRENT_YEAR = new Date().getFullYear();

  const generateSemesterOptions = useMemo(() => {
    const options = [];
    for (let year = CURRENT_YEAR - 2; year <= CURRENT_YEAR + 6; year++) {
      SEMESTERS.forEach((semester) => {
        options.push(`${semester} ${year}`);
      });
    }
    return options;
  }, [CURRENT_YEAR, SEMESTERS]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      {/* Timeline Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-[#B3A369]" />
          <h3 className="text-lg font-semibold">Academic Timeline</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date *</Label>
            <Select
              value={profile.startDate || ""}
              onValueChange={(value) =>
                setProfile(prev => ({
                  ...prev,
                  startDate: value,
                }))
              }
            >
              <SelectTrigger className={errors.startDate ? "border-red-500" : ""}>
                <SelectValue placeholder="When did you start?" />
              </SelectTrigger>
              <SelectContent>
                {generateSemesterOptions.slice(0, 20).map((semester) => (
                  <SelectItem key={semester} value={semester}>
                    {semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.startDate && (
              <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
            )}
          </div>

          <div>
            <Label htmlFor="expectedGraduation">Expected Graduation *</Label>
            <Select
              value={profile.expectedGraduation || ""}
              onValueChange={(value) =>
                setProfile(prev => ({
                  ...prev,
                  expectedGraduation: value,
                }))
              }
            >
              <SelectTrigger className={errors.expectedGraduation ? "border-red-500" : ""}>
                <SelectValue placeholder="When do you plan to graduate?" />
              </SelectTrigger>
              <SelectContent>
                {generateSemesterOptions.slice(10).map((semester) => (
                  <SelectItem key={semester} value={semester}>
                    {semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.expectedGraduation && (
              <p className="text-red-500 text-sm mt-1">{errors.expectedGraduation}</p>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Student Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isTransferStudent"
            checked={profile.isTransferStudent || false}
            onCheckedChange={(checked) =>
              setProfile(prev => ({
                ...prev,
                isTransferStudent: checked as boolean,
              }))
            }
          />
          <Label htmlFor="isTransferStudent">I am a transfer student</Label>
        </div>

        {profile.isTransferStudent && (
          <div>
            <Label htmlFor="transferCredits">Transfer Credits</Label>
            <Input
              id="transferCredits"
              type="number"
              min="0"
              value={profile.transferCredits || ""}
              onChange={(e) =>
                setProfile(prev => ({
                  ...prev,
                  transferCredits: e.target.value ? parseInt(e.target.value) : undefined,
                }))
              }
              placeholder="Number of transfer credits"
              className={errors.transferCredits ? "border-red-500" : ""}
            />
            {errors.transferCredits && (
              <p className="text-red-500 text-sm mt-1">{errors.transferCredits}</p>
            )}
          </div>
        )}
      </div>

      {/* Academic Record Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="h-5 w-5 text-[#B3A369]" />
          <h3 className="text-lg font-semibold">Academic Record</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currentGPA">Current GPA</Label>
            <Input
              id="currentGPA"
              type="number"
              step="0.01"
              min="0"
              max="4.0"
              value={profile.currentGPA || ""}
              onChange={(e) =>
                setProfile(prev => ({
                  ...prev,
                  currentGPA: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="e.g., 3.67"
            />
            <p className="text-xs text-slate-500 mt-1">
              Leave blank if you&apos;re a new student
            </p>
          </div>

          <div>
            <Label htmlFor="totalCreditsEarned">Credits Earned</Label>
            <Input
              id="totalCreditsEarned"
              type="number"
              value={profile.totalCreditsEarned || ""}
              onChange={(e) =>
                setProfile(prev => ({
                  ...prev,
                  totalCreditsEarned: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="e.g., 45"
            />
            <p className="text-xs text-slate-500 mt-1">
              Total credits completed so far
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Target className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Next Steps</h4>
              <p className="text-sm text-blue-700">
                Review your profile details and click &quot;Save&quot; to complete the setup.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};