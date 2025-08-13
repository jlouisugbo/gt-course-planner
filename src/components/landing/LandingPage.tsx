// components/landing/LandingPage.tsx
import React, { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
    Calendar,
    Target,
    ArrowRight,
    GraduationCap,
    Loader2,
    Sparkles,
    TrendingUp,
    Clock,
} from "lucide-react";
import { motion } from "framer-motion";

export function LandingPage() {
    const { signInWithGoogle, loading } = useAuth();
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    const handleGetStarted = async () => {
        setIsAuthLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Get Started error:", error);
            setIsAuthLoading(false);
        }
    };

    const isLoading = loading || isAuthLoading;

    return (
        <div className="h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-gt-navy/10 to-gt-gold/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-gradient-to-tr from-gt-gold/10 to-gt-navy/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-gt-navy/5 to-gt-gold/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between px-6 py-8">
                <div className="flex-1 flex items-center justify-center">
                    <div className="max-w-6xl mx-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-8"
                    >
                        {/* Logo Badge */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 mb-6 shadow-lg"
                        >
                            <div className="w-6 h-6 bg-gt-gradient rounded-full flex items-center justify-center">
                                <GraduationCap className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-base font-bold bg-gt-gradient bg-clip-text text-transparent">
                                GT Course Planner
                            </span>
                        </motion.div>

                        {/* Main Heading */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight"
                        >
                            Master Your
                            <br />
                            <span className="relative">
                                <span className="bg-gt-gradient bg-clip-text text-transparent">
                                    Academic Path
                                </span>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ delay: 1.2, duration: 0.8 }}
                                    className="absolute -bottom-1 left-0 h-1 bg-gt-gradient rounded-full"
                                />
                            </span>
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto"
                        >
                            The intelligent planning companion for Georgia Tech students. Navigate requirements, 
                            optimize your schedule, and graduate with confidence.
                        </motion.p>

                        {/* CTA Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            onClick={handleGetStarted}
                            disabled={isLoading}
                            className="group relative bg-gt-gradient text-white px-6 py-3 rounded-2xl font-bold text-base hover:shadow-2xl hover:shadow-gt-navy/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none mb-8"
                        >
                            <div className="flex items-center space-x-3">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Getting Started...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        <span>Begin Your Journey</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-gt-navy-700 to-gt-gold-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl -z-10" />
                        </motion.button>
                    </motion.div>

                        {/* Feature Grid - Compact */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0, duration: 0.8 }}
                            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
                        >
                        {[
                            {
                                icon: Calendar,
                                title: "Smart Planning",
                                color: "from-blue-500 to-blue-600"
                            },
                            {
                                icon: Target,
                                title: "Progress Tracking",
                                color: "from-emerald-500 to-emerald-600"
                            },
                            {
                                icon: TrendingUp,
                                title: "GPA Optimization",
                                color: "from-purple-500 to-purple-600"
                            },
                            {
                                icon: Clock,
                                title: "Time Management",
                                color: "from-amber-500 to-amber-600"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
                                className="group"
                            >
                                <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-4 text-center hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:scale-105">
                                    <div className={`w-8 h-8 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-2 mx-auto group-hover:scale-110 transition-transform`}>
                                        <feature.icon className="h-4 w-4 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                                </div>
                            </motion.div>
                        ))}
                        </motion.div>

                        {/* Stats Section - Inline */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4, duration: 0.8 }}
                            className="bg-gradient-to-r from-gt-navy/5 to-gt-gold/5 backdrop-blur-sm border border-gray-200 rounded-2xl p-4"
                        >
                            <div className="grid grid-cols-4 gap-4 text-center">
                            {[
                                { number: "1000+", label: "Courses" },
                                { number: "15+", label: "Programs" },
                                { number: "99%", label: "Accuracy" },
                                { number: "24/7", label: "Available" }
                            ].map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 1.6 + index * 0.1, duration: 0.6 }}
                                >
                                        <div className="text-xl font-bold bg-gt-gradient bg-clip-text text-transparent mb-1">
                                            {stat.number}
                                        </div>
                                        <div className="text-gray-600 text-xs font-medium">{stat.label}</div>
                                </motion.div>
                            ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8, duration: 0.8 }}
                    className="text-center pt-4 border-t border-gray-200/50"
                >
                    <p className="text-gray-500 text-xs">
                        Created and designed by{" "}
                        <a 
                            href="https://www.joelcodes.dev" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gt-navy hover:text-gt-gold font-medium transition-colors duration-200"
                        >
                            Joel Louis-Ugbo
                        </a>
                        {" "}and{" "}
                        <a 
                            href="https://github.com/jlouisugbo/gt-course-planner" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gt-navy hover:text-gt-gold font-medium transition-colors duration-200"
                        >
                            other important contributors
                        </a>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
