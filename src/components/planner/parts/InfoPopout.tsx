import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Info, Lock, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface InfoPopoutProps {
  className?: string;
  buttonSize?: "sm" | "md" | "lg";
  variant?: "ghost" | "outline" | "secondary";
}

const InfoPopout: React.FC<InfoPopoutProps> = ({ 
  className = "", 
  variant = "ghost" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoutRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoutRef.current && 
        !popoutRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const togglePopout = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const closePopout = () => {
    setIsOpen(false);
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <Button
        ref={buttonRef}
        variant={variant}
        size="sm"
        className={cn(
          "h-8 w-8 p-0 hover:bg-slate-100 transition-colors",
          isOpen && "bg-slate-100"
        )}
        onClick={togglePopout}
      >
        <Info className="h-4 w-4 text-slate-600" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/10 z-40 md:hidden"
              onClick={closePopout}
            />

            {/* Popout content */}
            <motion.div
              ref={popoutRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900 text-sm flex items-center">
                  <Info className="h-4 w-4 mr-2 text-blue-600" />
                  Course Status Guide
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-slate-100"
                  onClick={closePopout}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Content */}
              <div className="space-y-3">
                {/* Blocked courses */}
                <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-shrink-0 p-1.5 bg-red-100 rounded-md">
                    <Lock className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">
                      Blocked Courses
                    </p>
                    <p className="text-xs text-red-700">
                      Red cards indicate courses that cannot be taken due to missing prerequisites. 
                      Complete the required courses first.
                    </p>
                  </div>
                </div>

                {/* Warning courses */}
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex-shrink-0 p-1.5 bg-yellow-100 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Prerequisite Warnings
                    </p>
                    <p className="text-xs text-yellow-700">
                      Yellow cards show courses with potential scheduling conflicts or 
                      recommended prerequisites that should be considered.
                    </p>
                  </div>
                </div>

                {/* Available courses */}
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-shrink-0 p-1.5 bg-green-100 rounded-md">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800 mb-1">
                      Available Courses
                    </p>
                    <p className="text-xs text-green-700">
                      White cards are ready to be added to your plan. All prerequisites 
                      are met and there are no conflicts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer tip */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-600 text-center">
                  💡 <strong>Tip:</strong> Drag courses directly onto your semester plan or click &quot;Add to Plan&quot;
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InfoPopout;