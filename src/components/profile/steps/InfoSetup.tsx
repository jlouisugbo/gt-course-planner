import React from "react";
//import { useMemo } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";
import { UserProfile } from "@/types";

interface InfoSetupProps {
  profile: Partial<UserProfile>;
  setProfile: React.Dispatch<React.SetStateAction<Partial<UserProfile>>>;
  errors: Record<string, string>;
}

export const InfoSetup: React.FC<InfoSetupProps> = ({
  profile,
  setProfile,
  errors
}) => {
  /*
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
  }, [CURRENT_YEAR]);

  const generateGraduationOptions = useMemo(() => {
    const options = [];
    for (let year = CURRENT_YEAR; year <= CURRENT_YEAR + 8; year++) {
      SEMESTERS.forEach((semester) => {
        options.push(`${semester} ${year}`);
      });
    }
    return options;
  }, [CURRENT_YEAR]);
  */
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-2 mb-4">
        <User className="h-5 w-5 text-[#B3A369]" />
        <h3 className="text-lg font-semibold">Personal Information</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={profile.name || ""}
            onChange={(e) =>
              setProfile(prev => ({
                ...prev,
                name: e.target.value,
              }))
            }
            placeholder="Enter your full name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="year">Academic Year *</Label>
          <Select
            value={profile.year || ""}
            onValueChange={(value) =>
              setProfile(prev => ({
                ...prev,
                year: value,
              }))
            }
          >
              <SelectTrigger
                  className={`bg-white ${errors.year ? "border-red-500" : ""}`}
              >
                  <SelectValue placeholder="Select your year" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-black z-50">
                  <SelectItem value="1st Year" className="bg-white">1st Year</SelectItem>
                  <SelectItem value="2nd Year" className="bg-white">2nd Year</SelectItem>
                  <SelectItem value="3rd Year" className="bg-white">3rd Year</SelectItem>
                  <SelectItem value="4th Year" className="bg-white">4th Year</SelectItem>
                  <SelectItem value="5th Year+" className="bg-white">5th Year+</SelectItem>
                  <SelectItem value="Graduate" className="bg-white">Graduate</SelectItem>
              </SelectContent>
          </Select>
          {errors.year && (
            <p className="text-red-500 text-sm mt-1">{errors.year}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={profile.email || ""}
            onChange={(e) =>
              setProfile(prev => ({
                ...prev,
                email: e.target.value,
              }))
            }
            placeholder="your.email@gatech.edu"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="gtId">GT ID *</Label>
          <Input
            id="gtId"
            value={profile.gtId || ""}
            onChange={(e) =>
              setProfile(prev => ({
                ...prev,
                gtId: parseInt(e.target.value) || 0,
              }))
            }
            placeholder="e.g., 903123456"
            className={errors.gtId ? "border-red-500" : ""}
          />
          {errors.gtId && (
            <p className="text-red-500 text-sm mt-1">{errors.gtId}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};