"use client";

import React, { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, BookOpen, Clock, Star } from "lucide-react";
import { Course, PlannedCourse } from "@/types/courses";
import { usePlannerStore } from "@/hooks/usePlannerStore";
import { sampleCourses } from "@/data/courses";
import { motion, AnimatePresence } from "framer-motion";

interface CourseManagerProps {
    semesterId: string;
    onClose: () => void;
}

const GRADES = ["A", "B", "C", "D", "F", "W", "I", "IP", "S", "U"];
const YEARS = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 5 + i,
);

const CourseManager: React.FC<CourseManagerProps> = ({
    semesterId,
    onClose,
}) => {
    const { addCourseToSemester, semesters } = usePlannerStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [customCourse, setCustomCourse] = useState({
        code: "",
        title: "",
        credits: 3,
        semester: "",
        year: new Date().getFullYear(),
        grade: "",
        status: "planned" as "completed" | "in-progress" | "planned",
    });

    const semester = semesters[semesterId];
    const filteredCourses = sampleCourses.filter(
        (course) =>
            course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleAddCourse = (course: Course) => {
        const plannedCourse: PlannedCourse = {
            ...course,
            semesterId,
            status: "planned",
            year: semester.year,
            season: semester.season,
        };

        addCourseToSemester(plannedCourse);
        onClose();
    };

    const handleAddCustomCourse = () => {
        if (!customCourse.code || !customCourse.title) return;

        const course: Course = {
            id: `custom-${Date.now()}`,
            code: customCourse.code,
            title: customCourse.title,
            credits: customCourse.credits,
            description: "Custom course entry",
            prerequisites: [],
            corequisites: [],
            attributes: ["Custom"],
            offerings: { fall: true, spring: true, summer: true },
            instructors: [],
            difficulty: 3,
            workload: customCourse.credits * 3,
            threads: [],
            college: "Custom",
        };

        const plannedCourse: PlannedCourse = {
            ...course,
            semesterId,
            status: customCourse.status,
            grade: customCourse.grade || undefined,
            year: customCourse.year,
            season: semester.season,
        };

        addCourseToSemester(plannedCourse);
        setCustomCourse({
            code: "",
            title: "",
            credits: 3,
            semester: "",
            year: new Date().getFullYear(),
            grade: "",
            status: "planned",
        });
        onClose();
    };

    const CourseCard = ({ course }: { course: Course }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedCourse(course)}
        >
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h4 className="font-semibold text-slate-900">
                        {course.code}
                    </h4>
                    <p className="text-sm text-slate-600 line-clamp-1">
                        {course.title}
                    </p>
                </div>
                <Badge variant="secondary">{course.credits}cr</Badge>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-2">
                <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {course.workload}h/week
                </span>
                <span className="flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    {course.difficulty}/5
                </span>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                    {course.offerings.fall && (
                        <Badge variant="outline" className="text-xs">
                            Fall
                        </Badge>
                    )}
                    {course.offerings.spring && (
                        <Badge variant="outline" className="text-xs">
                            Spring
                        </Badge>
                    )}
                    {course.offerings.summer && (
                        <Badge variant="outline" className="text-xs">
                            Summer
                        </Badge>
                    )}
                </div>

                <Button
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAddCourse(course);
                    }}
                    className="bg-[#003057] hover:bg-[#002041]"
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                </Button>
            </div>
        </motion.div>
    );

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Add Courses to {semester.season} {semester.year}
                    </DialogTitle>
                    <DialogDescription>
                        Search for courses to add to your semester plan or
                        create custom entries
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="search" className="flex-1 overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="search">Search Courses</TabsTrigger>
                        <TabsTrigger value="custom">
                            Add Custom Course
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value="search"
                        className="space-y-4 overflow-hidden"
                    >
                        {/* Search Interface */}
                        <div className="flex space-x-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by course code or title..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                            <Button variant="outline">
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                            </Button>
                        </div>

                        {/* Course Results */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                            <AnimatePresence>
                                {filteredCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>

                        {filteredCourses.length === 0 && searchQuery && (
                            <div className="text-center py-8 text-slate-500">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>
                                    No courses found matching &quot;
                                    {searchQuery}&quot;
                                </p>
                                <p className="text-sm">
                                    Try a different search term or add a custom
                                    course
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Add Custom Course
                                </CardTitle>
                                <CardDescription>
                                    Create a custom course entry for transfer
                                    credits, special studies, or courses not in
                                    the catalog
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="courseCode">
                                            Course Code *
                                        </Label>
                                        <Input
                                            id="courseCode"
                                            value={customCourse.code}
                                            onChange={(e) =>
                                                setCustomCourse({
                                                    ...customCourse,
                                                    code: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., CS 1301"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="credits">
                                            Credits *
                                        </Label>
                                        <Select
                                            value={customCourse.credits.toString()}
                                            onValueChange={(value) =>
                                                setCustomCourse({
                                                    ...customCourse,
                                                    credits: parseInt(value),
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5, 6].map(
                                                    (credit) => (
                                                        <SelectItem
                                                            key={credit}
                                                            value={credit.toString()}
                                                        >
                                                            {credit}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="courseTitle">
                                        Course Title *
                                    </Label>
                                    <Input
                                        id="courseTitle"
                                        value={customCourse.title}
                                        onChange={(e) =>
                                            setCustomCourse({
                                                ...customCourse,
                                                title: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., Introduction to Computing"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={customCourse.status}
                                            onValueChange={(
                                                value:
                                                    | "completed"
                                                    | "in-progress"
                                                    | "planned",
                                            ) =>
                                                setCustomCourse({
                                                    ...customCourse,
                                                    status: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="completed">
                                                    Completed
                                                </SelectItem>
                                                <SelectItem value="in-progress">
                                                    In Progress
                                                </SelectItem>
                                                <SelectItem value="planned">
                                                    Planned
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="year">Year</Label>
                                        <Select
                                            value={customCourse.year.toString()}
                                            onValueChange={(value) =>
                                                setCustomCourse({
                                                    ...customCourse,
                                                    year: parseInt(value),
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {YEARS.map((year) => (
                                                    <SelectItem
                                                        key={year}
                                                        value={year.toString()}
                                                    >
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {customCourse.status === "completed" && (
                                        <div>
                                            <Label htmlFor="grade">Grade</Label>
                                            <Select
                                                value={customCourse.grade}
                                                onValueChange={(value) =>
                                                    setCustomCourse({
                                                        ...customCourse,
                                                        grade: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select grade" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {GRADES.map((grade) => (
                                                        <SelectItem
                                                            key={grade}
                                                            value={grade}
                                                        >
                                                            {grade}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button variant="outline" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAddCustomCourse}
                                        disabled={
                                            !customCourse.code ||
                                            !customCourse.title
                                        }
                                        className="bg-[#B3A369] hover:bg-[#9A8F5A]"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Course
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Course Details Modal */}
                {selectedCourse && (
                    <Dialog
                        open={!!selectedCourse}
                        onOpenChange={() => setSelectedCourse(null)}
                    >
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>
                                    {selectedCourse.code} -{" "}
                                    {selectedCourse.title}
                                </DialogTitle>
                                <DialogDescription>
                                    {selectedCourse.credits} credits •{" "}
                                    {selectedCourse.college}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <p className="text-slate-700">
                                    {selectedCourse.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium mb-2">
                                            Course Details
                                        </h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span>Difficulty:</span>
                                                <span>
                                                    {selectedCourse.difficulty}
                                                    /5
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Workload:</span>
                                                <span>
                                                    {selectedCourse.workload}
                                                    h/week
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Prerequisites:</span>
                                                <span>
                                                    {selectedCourse
                                                        .prerequisites.length ||
                                                        "None"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-2">
                                            Availability
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedCourse.offerings.fall && (
                                                <Badge variant="outline">
                                                    Fall
                                                </Badge>
                                            )}
                                            {selectedCourse.offerings
                                                .spring && (
                                                <Badge variant="outline">
                                                    Spring
                                                </Badge>
                                            )}
                                            {selectedCourse.offerings
                                                .summer && (
                                                <Badge variant="outline">
                                                    Summer
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {selectedCourse.threads.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">
                                            CS Threads
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedCourse.threads.map(
                                                (thread) => (
                                                    <Badge
                                                        key={thread}
                                                        className="bg-[#B3A369] text-white"
                                                    >
                                                        {thread}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedCourse(null)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            handleAddCourse(selectedCourse);
                                            setSelectedCourse(null);
                                        }}
                                        className="bg-[#003057] hover:bg-[#002041]"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add to Semester
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CourseManager;
