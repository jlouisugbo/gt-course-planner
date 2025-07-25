import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, BookOpen, Target, Plus, Trash2 } from "lucide-react";
import { UserProfile, SemesterGPA } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

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
  const CURRENT_YEAR = new Date().getFullYear();
  const CURRENT_DATE = new Date();
  const CURRENT_SEMESTER = CURRENT_DATE.getMonth() >= 8 ? `Fall ${CURRENT_YEAR}` : 
                           CURRENT_DATE.getMonth() >= 1 ? `Spring ${CURRENT_YEAR}` : 
                           `Summer ${CURRENT_YEAR - 1}`;

  const generateSemesterOptions = useMemo(() => {
    const SEMESTERS = ["Fall", "Spring", "Summer"];
    const options = [];
    for (let year = CURRENT_YEAR - 2; year <= CURRENT_YEAR + 6; year++) {
      SEMESTERS.forEach((semester) => {
        options.push(`${semester} ${year}`);
      });
    }
    return options;
  }, [CURRENT_YEAR]);

  // Check if user started before current semester
  const startedBeforeCurrent = useMemo(() => {
    if (!profile.startDate) return false;
    
    const [startSemester, startYear] = profile.startDate.split(' ');
    const [currentSemester, currentYear] = CURRENT_SEMESTER.split(' ');
    
    if (parseInt(startYear) < parseInt(currentYear)) return true;
    if (parseInt(startYear) > parseInt(currentYear)) return false;
    
    // Same year, check semester order
    const semesterOrder = { 'Spring': 0, 'Summer': 1, 'Fall': 2 };
    return semesterOrder[startSemester as keyof typeof semesterOrder] < semesterOrder[currentSemester as keyof typeof semesterOrder];
  }, [profile.startDate, CURRENT_SEMESTER]);

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
              <SelectTrigger className={`bg-white ${errors.startDate ? "border-red-500" : ""}`}>
                <SelectValue placeholder="When did you start?" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-black z-50">
                {generateSemesterOptions.slice(0, 20).map((semester) => (
                  <SelectItem key={semester} value={semester} className="bg-white">
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
              <SelectTrigger className={`bg-white ${errors.expectedGraduation ? "border-red-500" : ""}`}>
                <SelectValue placeholder="When do you plan to graduate?" />
              </SelectTrigger>
              <SelectContent className= "bg-white border border-black z-50 max-h-60 overflow-y-auto">
                {generateSemesterOptions.slice(10).map((semester) => (
                  <SelectItem key={semester} value={semester} className="bg-white">
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

        {/* GPA Section - Show different options based on start date */}
        {startedBeforeCurrent ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <BookOpen className="h-4 w-4 text-amber-600" />
                <h4 className="text-sm font-medium text-amber-800">
                  Academic History Required
                </h4>
              </div>
              <p className="text-sm text-amber-700 mb-4">
                Since you started before {CURRENT_SEMESTER}, please provide your academic history.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasDetailedGPA"
                    checked={profile.hasDetailedGPA || false}
                    onCheckedChange={(checked) =>
                      setProfile(prev => ({
                        ...prev,
                        hasDetailedGPA: checked as boolean,
                        semesterGPAs: checked ? prev.semesterGPAs : undefined
                      }))
                    }
                  />
                  <Label htmlFor="hasDetailedGPA" className="text-sm">
                    I can provide my GPA for each semester
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useOverallGPA"
                    checked={!profile.hasDetailedGPA && profile.currentGPA !== undefined}
                    onCheckedChange={(checked) =>
                      setProfile(prev => ({
                        ...prev,
                        hasDetailedGPA: false,
                        currentGPA: checked ? (prev.currentGPA || 0) : undefined
                      }))
                    }
                  />
                  <Label htmlFor="useOverallGPA" className="text-sm">
                    I only know my overall GPA
                  </Label>
                </div>
              </div>
            </div>

            {profile.hasDetailedGPA ? (
              <SemesterGPATracking 
                profile={profile} 
                setProfile={setProfile} 
                errors={errors}
                startDate={profile.startDate}
                currentSemester={CURRENT_SEMESTER}
              />
            ) : (
              <div>
                <Label htmlFor="currentGPA">Overall GPA</Label>
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
                  className={errors.currentGPA ? "border-red-500" : ""}
                />
                {errors.currentGPA && (
                  <p className="text-red-500 text-sm mt-1">{errors.currentGPA}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Your cumulative GPA up to this point
                </p>
              </div>
            )}
          </div>
        ) : (
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
        )}

        {/* Credits Earned - Always show */}
        {startedBeforeCurrent && (
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
              className={errors.totalCreditsEarned ? "border-red-500" : ""}
            />
            {errors.totalCreditsEarned && (
              <p className="text-red-500 text-sm mt-1">{errors.totalCreditsEarned}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Total credits completed so far
            </p>
          </div>
        )}
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

// Semester GPA Tracking Component
interface SemesterGPATrackingProps {
  profile: Partial<UserProfile>;
  setProfile: React.Dispatch<React.SetStateAction<Partial<UserProfile>>>;
  errors: Record<string, string>;
  startDate?: string;
  currentSemester: string;
}

const SemesterGPATracking: React.FC<SemesterGPATrackingProps> = ({
  profile,
  setProfile,
  errors,
  startDate,
  currentSemester
}) => {
  // Generate completed semesters based on start date
  const completedSemesters = useMemo(() => {
    if (!startDate) return [];
    
    const [startSem, startYear] = startDate.split(' ');
    const [currentSem, currentYear] = currentSemester.split(' ');
    
    const semesterOrder = ['Spring', 'Summer', 'Fall'];
    const semesters = [];
    
    let year = parseInt(startYear);
    let semIndex = semesterOrder.indexOf(startSem);
    
    while (year < parseInt(currentYear) || (year === parseInt(currentYear) && semesterOrder[semIndex] !== currentSem)) {
      semesters.push(`${semesterOrder[semIndex]} ${year}`);
      
      semIndex++;
      if (semIndex >= semesterOrder.length) {
        semIndex = 0;
        year++;
      }
    }
    
    return semesters;
  }, [startDate, currentSemester]);

  // Initialize semester GPAs if not present
  const semesterGPAs = profile.semesterGPAs || [];

  const updateSemesterGPA = (semester: string, gpa: number | '', credits: number = 3) => {
    const newGPAs = [...semesterGPAs];
    const existingIndex = newGPAs.findIndex(s => s.semester === semester);
    
    if (gpa === '' || gpa === 0) {
      // Remove if exists
      if (existingIndex !== -1) {
        newGPAs.splice(existingIndex, 1);
      }
    } else {
      // Add or update
      const semesterData: SemesterGPA = {
        semester,
        gpa: gpa as number,
        creditsEarned: credits
      };
      
      if (existingIndex !== -1) {
        newGPAs[existingIndex] = semesterData;
      } else {
        newGPAs.push(semesterData);
      }
    }
    
    setProfile(prev => ({
      ...prev,
      semesterGPAs: newGPAs
    }));
  };

  const getSemesterGPA = (semester: string): number | '' => {
    const found = semesterGPAs.find(s => s.semester === semester);
    return found ? found.gpa : '';
  };

  const calculateOverallGPA = () => {
    if (semesterGPAs.length === 0) return 0;
    
    const sum = semesterGPAs.reduce((acc, sem) => acc + sem.gpa, 0);
    return (sum / semesterGPAs.length).toFixed(2);
  };

  return (
    <div>
      <Label>Semester GPAs</Label>
      <div className="text-sm text-slate-600 mb-3">
        Add your GPA for each completed semester. We calculated {completedSemesters.length} completed semesters based on your start date.
      </div>
      
      {completedSemesters.length === 0 ? (
        <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center text-slate-500">
          Please select your start date first to see completed semesters
        </div>
      ) : (
        <div className="space-y-3">
          {/* Overall GPA display */}
          {semesterGPAs.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-medium text-green-800">
                Calculated Overall GPA: {calculateOverallGPA()}
              </div>
              <div className="text-xs text-green-600">
                Based on {semesterGPAs.length} semester(s) entered
              </div>
            </div>
          )}
          
          {/* Semester GPA inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedSemesters.map((semester) => (
              <div key={semester} className="flex items-center space-x-2">
                <Label className="w-24 text-sm">{semester}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  value={getSemesterGPA(semester)}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                    updateSemesterGPA(semester, value);
                  }}
                  placeholder="3.67"
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          
          {completedSemesters.length > 6 && (
            <div className="text-xs text-slate-500 mt-2">
              💡 Tip: You can leave semesters blank if you don't remember the exact GPA
            </div>
          )}
        </div>
      )}
    </div>
  );
};