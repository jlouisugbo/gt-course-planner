
import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Plus } from "lucide-react";
import { UserProfile } from "@/types";
import { CS_THREADS, COE_THREADS, CM_THREADS, getAllMajors, getAllMinors } from "@/lib/constants";

interface AcademicProgramSetupProps {
  profile: Partial<UserProfile>;
  setProfile: React.Dispatch<React.SetStateAction<Partial<UserProfile>>>;
  errors: Record<string, string>;
}

export const AcademicProgramSetup: React.FC<AcademicProgramSetupProps> = ({
  profile,
  setProfile,
  errors
}) => {
  const MAJORS = getAllMajors();
  const MINORS = getAllMinors();

  const getAvailableThreads = useCallback((major: string): string[] => {
    switch (major) {
      case "Computer Science":
        return Array.isArray(CS_THREADS) ? CS_THREADS : [];
      case "Computer Engineering":
      case "Computer Engineering (Dual BS)":
        return Array.isArray(COE_THREADS) ? COE_THREADS : [];
      case "Computational Media":
        return Array.isArray(CM_THREADS) ? CM_THREADS : [];
      default:
        return [];
    }
  }, []);

  const handleThreadToggle = useCallback((thread: string) => {
    setProfile(prev => {
      const currentThreads = prev.threads || [];
      if (currentThreads.includes(thread)) {
        return {
          ...prev,
          threads: currentThreads.filter((t) => t !== thread),
        };
      } else if (currentThreads.length < 2) {
        return {
          ...prev,
          threads: [...currentThreads, thread],
        };
      }
      return prev;
    });
  }, [setProfile]);

  const handleMinorToggle = useCallback((minor: string) => {
    setProfile(prev => {
      const currentMinors = prev.minors || [];
      if (currentMinors.includes(minor)) {
        return {
          ...prev,
          minors: currentMinors.filter((m) => m !== minor),
        };
      } else if (currentMinors.length < 2) {
        return {
          ...prev,
          minors: [...currentMinors, minor],
        };
      }
      return prev;
    });
  }, [setProfile]);

  const handleDoubleMajorToggle = useCallback((checked: boolean) => {
    setProfile(prev => ({
      ...prev,
      isDoubleMajor: checked,
      secondMajor: checked ? prev.secondMajor || "" : "",
      threads: [],
      minors: [],
    }));
  }, [setProfile]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-2 mb-4">
        <GraduationCap className="h-5 w-5 text-[#B3A369]" />
        <h3 className="text-lg font-semibold">Academic Program</h3>
      </div>

      {/* Double Major Toggle */}
      <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-lg">
        <Checkbox
          checked={profile.isDoubleMajor || false}
          onCheckedChange={handleDoubleMajorToggle}
        />
        <Label className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>I am pursuing a double major</span>
        </Label>
      </div>

      {/* Major Selection */}
      <div>
        <Label htmlFor="major">
          {profile.isDoubleMajor ? "Primary Major *" : "Major *"}
        </Label>
        <Select
          value={profile.major || ""}
          onValueChange={(value) =>
            setProfile(prev => ({
              ...prev,
              major: value,
              threads: [],
            }))
          }
        >
          <SelectTrigger className={`bg-white ${errors.major ? "border-red-500" : ""}`}>
            <SelectValue placeholder="Select your major" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-black z-50 max-h-60 overflow-y-auto">
            {MAJORS.map((major) => (
              <SelectItem key={major.value} value={major.value} className="bg-white">
                {major.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.major && (
          <p className="text-red-500 text-sm mt-1">{errors.major}</p>
        )}
      </div>

      {/* Second Major */}
      {profile.isDoubleMajor && (
        <div>
          <Label htmlFor="secondMajor">Second Major *</Label>
          <Select
            value={profile.secondMajor || ""}
            onValueChange={(value) =>
              setProfile(prev => ({
                ...prev,
                secondMajor: value,
                threads: [],
              }))
            }
          >
            <SelectTrigger className={errors.secondMajor ? "border-red-500" : ""}>
              <SelectValue placeholder="Select your second major" />
            </SelectTrigger>
            <SelectContent>
              {MAJORS
                .filter((major) => major.value !== profile.major)
                .map((major) => (
                  <SelectItem key={major.value} value={major.value}>
                    {major.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.secondMajor && (
            <p className="text-red-500 text-sm mt-1">{errors.secondMajor}</p>
          )}
        </div>
      )}

      {/* Thread Selection */}
      {(profile.major === "Computer Science" ||
        profile.major === "Computer Engineering" ||
        profile.major === "Computer Engineering (Dual BS)" ||
        profile.major === "Computational Media" ||
        (profile.isDoubleMajor &&
          (profile.secondMajor === "Computer Science" ||
            profile.secondMajor === "Computer Engineering" ||
            profile.secondMajor === "Computer Engineering (Dual BS)" ||
            profile.secondMajor === "Computational Media"))) && (
        <div>
          <Label>Specialization Threads *</Label>
          <p className="text-sm text-slate-600 mb-3">
            Choose specialization threads for your degree program(s)
          </p>

          {/* Primary Major Threads */}
          {getAvailableThreads(profile.major || "").length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-sm text-slate-700 mb-2">
                {profile.major} Threads (Select 2)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {getAvailableThreads(profile.major || "").map((thread) => (
                  <div
                    key={`primary-${thread}`}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      profile.threads?.includes(thread)
                        ? "border-[#B3A369] bg-[#B3A369]/10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => handleThreadToggle(thread)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={profile.threads?.includes(thread) || false}
                        onChange={() => handleThreadToggle(thread)}
                      />
                      <span className="text-sm font-medium">{thread}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.threads && (
            <p className="text-red-500 text-sm mt-1">{errors.threads}</p>
          )}

          <div className="mt-3">
            <p className="text-sm text-slate-600">
              Selected: {profile.threads?.length || 0}/
              {profile.isDoubleMajor ? "4" : "2"}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {profile.threads?.map((thread) => (
                <Badge
                  key={thread}
                  variant="secondary"
                  className="bg-[#B3A369] text-white"
                >
                  {thread}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Minor Selection */}
      <div>
        <Label>Minors (Optional - Select up to 2)</Label>
        <p className="text-sm text-slate-600 mb-3">
          Add minor programs to complement your major(s)
        </p>
        <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
          {MINORS.map((minor) => (
            <div
              key={minor.value}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                profile.minors?.includes(minor.value)
                  ? "border-[#B3A369] bg-[#B3A369]/10"
                  : "border-slate-200 hover:border-slate-300"
              } ${
                (profile.minors?.length || 0) >= 2 &&
                !profile.minors?.includes(minor.value)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={() => {
                if (
                  (profile.minors?.length || 0) < 2 ||
                  profile.minors?.includes(minor.value)
                ) {
                  handleMinorToggle(minor.value);
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={profile.minors?.includes(minor.value) || false}
                  onChange={() => handleMinorToggle(minor.value)}
                  disabled={
                    (profile.minors?.length || 0) >= 2 &&
                    !profile.minors?.includes(minor.value)
                  }
                />
                <span className="text-sm font-medium">{minor.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};