import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { UserProfile } from "@/types/user";

interface TimelineStepProps {
  profile: Partial<UserProfile>;
  setProfile: React.Dispatch<React.SetStateAction<Partial<UserProfile>>>;
  errors: Record<string, string>;
}

export const TimelineStep: React.FC<TimelineStepProps> = ({
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
      className="space-y-6"
    >
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
    </motion.div>
  );
};