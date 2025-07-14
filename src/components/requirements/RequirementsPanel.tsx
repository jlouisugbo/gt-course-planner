"use client";
import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CheckCircle,
    Clock,
    AlertTriangle,
    Target,
    GraduationCap,
} from "lucide-react";
import { csDegreeRequirements } from "@/data/degree-requirements";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const RequirementPanel = () => {
    const { categories, threads, totalCredits, gpaRequirement } =
        csDegreeRequirements;

    const getProgressColor = (progress: number) => {
        if (progress >= 100) return "bg-green-500";
        if (progress >= 75) return "bg-yellow-500";
        if (progress >= 50) return "bg-orange-500";
        return "bg-slate-300";
    };

    const getStatusIcon = (isComplete: boolean, progress: number) => {
        if (isComplete) return <CheckCircle className="text-green-500" />;
        if (progress > 0) return <Clock className="text-yellow-500" />;
        return <AlertTriangle className="text-red-500" />;
    };

    const CategoryCard = ({
        category,
        index,
    }: {
        category: any;
        index: number;
    }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * .1 }}
        >
            <Card
                className={cn(
                    "transition-all duration-200 hover:shadow-mg",
                    category.isComplete && "border-green-200 bg-green-50"
                )}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            {getStatusIcon(
                                category.isComplete,
                                category.progress
                            )}
                            <CardTitle className="text-lg font-semibold">
                                {category.name}
                            </CardTitle>
                        </div>
                        <Badge
                            variant={
                                category.isComplete ? "default" : "secondary"
                            }
                            className={
                                category.isComplete ? "bg-green-600" : ""
                            }
                        >
                            {category.completedCredits +
                                category.inProgressCredits}{" "}
                            / {category.requiredCredits} credits
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    =
                    <div>
                        <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="text-slate-500">Progress</span>
                            <span className="text-slate-700 font-medium">
                                {Math.round(category.progress)}%
                            </span>
                        </div>
                        <Progress
                            value={category.progress}
                            className={cn(
                                "h-2 rounded-full",
                                getProgressColor(category.progress)
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                            <div className="font-semibold text-green-800">
                                {category.completedCredits}
                            </div>
                            <div className="text-slate-500">Completed</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <div className="font-semibold text-blue-800">
                                {category.inProgressCredits}
                            </div>
                            <div className="text-slate-500">In Progress</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                            <div className="font-semibold text-slate-800">
                                {category.plannedCredits}
                            </div>
                            <div className="text-slate-500">Planned</div>
                        </div>
                    </div>
                    {category.courses.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">
                                Courses
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                {category.courses
                                    .slice(0, 6)
                                    .map((course: string) => (
                                        <Badge
                                            key={course}
                                            variant="outline"
                                            className="text-xs border-slate-300"
                                        >
                                            {course}
                                        </Badge>
                                    ))}
                                {category.courses.length > 6 && (
                                    <Badge
                                        variant="outline"
                                        className="text-xs border-slate-300"
                                    >
                                        +{category.courses.length - 6} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );

    const ThreadCard = ({ thread, index }: { thread: any; index: number }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Card
                className={cn(
                    "transition-all duration-200 hover:shadow-md",
                    thread.isComplete && "border-green-200 bg-green-50"
                )}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                            {thread.name} Thread
                        </CardTitle>
                        <Badge
                            variant={
                                thread.isComplete ? "default" : "secondary"
                            }
                            className={thread.isComplete ? "bg-green-600" : ""}
                        >
                            {thread.completedCredits}/{thread.requiredCredits}{" "}
                            credits
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Progress
                        value={
                            (thread.completedCredits / thread.requiredCredits) *
                            100
                        }
                        className="h-2"
                    />

                    {thread.coreCourses.length > 0 && (
                        <div>
                            <h4 className="font-medium text-slate-900 mb-2">
                                Core Courses
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                {thread.coreCourses.map((course: string) => (
                                    <Badge
                                        key={course}
                                        variant="outline"
                                        className="text-xs bg-[#003057] text-white"
                                    >
                                        {course}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="font-medium text-slate-900 mb-2">
                            Elective Options
                        </h4>
                        <div className="flex flex-wrap gap-1">
                            {thread.electiveOptions
                                .slice(0, 4)
                                .map((course: string) => (
                                    <Badge
                                        key={course}
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {course}
                                    </Badge>
                                ))}
                            {thread.electiveOptions.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                    +{thread.electiveOptions.length - 4} more
                                </Badge>
                            )}
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={thread.isComplete}
                    >
                        {thread.isComplete
                            ? "Thread Complete"
                            : "View Thread Details"}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );

    // Calculate overall progress
    const totalCompletedCredits = categories.reduce(
        (sum, cat) => sum + cat.completedCredits,
        0
    );
    const totalInProgressCredits = categories.reduce(
        (sum, cat) => sum + cat.inProgressCredits,
        0
    );
    const overallProgress =
        ((totalCompletedCredits + totalInProgressCredits) / totalCredits) * 100;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    Graduation Requirements
                </h1>
                <p className="text-lg text-slate-600 mt-2">
                    Track your progress toward your Computer Science degree
                </p>
            </div>

            {/* Overall Progress Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="bg-gradient-to-r from-[#003057] to-[#B3A369] text-white">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center">
                            <GraduationCap className="h-6 w-6 mr-2" />
                            Overall Degree Progress
                        </CardTitle>
                        <CardDescription className="text-blue-100">
                            Computer Science, B.S. • Expected Graduation: Spring
                            2028
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold">
                                    {totalCompletedCredits +
                                        totalInProgressCredits}
                                </div>
                                <div className="text-sm opacity-90">
                                    Credits Earned
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold">
                                    {totalCredits}
                                </div>
                                <div className="text-sm opacity-90">
                                    Total Required
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold">
                                    {Math.round(overallProgress)}%
                                </div>
                                <div className="text-sm opacity-90">
                                    Complete
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold">
                                    {gpaRequirement}
                                </div>
                                <div className="text-sm opacity-90">
                                    Min GPA Required
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span>Progress to Graduation</span>
                                <span>{Math.round(overallProgress)}%</span>
                            </div>
                            <Progress
                                value={overallProgress}
                                className="h-3 bg-white/20"
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Requirements Tabs */}
            <Tabs defaultValue="categories" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="categories">
                        Degree Requirements
                    </TabsTrigger>
                    <TabsTrigger value="threads">CS Threads</TabsTrigger>
                    <TabsTrigger value="timeline">
                        Graduation Timeline
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {categories.map((category, index) => (
                            <CategoryCard
                                key={category.id}
                                category={category}
                                index={index}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="threads" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Choose Your Threads</CardTitle>
                            <CardDescription>
                                Select two threads to specialize your Computer
                                Science degree. Each thread requires 15 credits.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {threads.map((thread, index) => (
                            <ThreadCard
                                key={thread.name}
                                thread={thread}
                                index={index}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Target className="h-5 w-5 mr-2" />
                                Graduation Timeline
                            </CardTitle>
                            <CardDescription>
                                Key milestones and deadlines for your academic
                                journey
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-green-900">
                                            Foundation Requirements
                                        </h4>
                                        <p className="text-sm text-green-700">
                                            Completed CS 1301, CS 1331, CS 1332
                                        </p>
                                    </div>
                                    <Badge className="bg-green-600">
                                        Complete
                                    </Badge>
                                </div>

                                <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-blue-900">
                                            Thread Selection
                                        </h4>
                                        <p className="text-sm text-blue-700">
                                            Choose second thread by end of Fall
                                            2025
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="border-blue-300 text-blue-700"
                                    >
                                        In Progress
                                    </Badge>
                                </div>

                                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <Target className="h-5 w-5 text-slate-600" />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-slate-900">
                                            Core Completion
                                        </h4>
                                        <p className="text-sm text-slate-700">
                                            Finish all CS core courses by Fall
                                            2027
                                        </p>
                                    </div>
                                    <Badge variant="outline">Upcoming</Badge>
                                </div>

                                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <GraduationCap className="h-5 w-5 text-slate-600" />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-slate-900">
                                            Graduation Application
                                        </h4>
                                        <p className="text-sm text-slate-700">
                                            Submit application by October 2027
                                        </p>
                                    </div>
                                    <Badge variant="outline">Future</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default RequirementPanel;
