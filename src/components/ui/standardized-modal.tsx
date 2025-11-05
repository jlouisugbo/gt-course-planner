/**
 * GT Design System - Standardized Modal Component
 * Consolidated modal with GT branding, accessibility compliance, and flexible layouts
 * Replaces all modal variants throughout the application
 */

"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// GT Brand Colors
const _GT_NAVY = '#003057';
const _GT_GOLD = '#B3A369';

// Modal layout variants
type ModalLayout = 'default' | 'course-detail' | 'form' | 'confirmation' | 'fullscreen';

// Extended props for GT Design System
interface StandardizedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
  
  // Layout and styling
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  layout?: ModalLayout;
  theme?: 'default' | 'gt-navy' | 'gt-gold' | 'success' | 'warning' | 'error';
  
  // Behavior
  preventEscape?: boolean;
  preventBackdropClick?: boolean;
  showCloseButton?: boolean;
  closeOnClickOutside?: boolean;
  
  // Content organization
  tabs?: Array<{ id: string; label: string; content: React.ReactNode; disabled?: boolean }>;
  actions?: React.ReactNode;
  headerActions?: React.ReactNode;
  
  // Loading states
  isLoading?: boolean;
  loadingText?: string;
  
  // Styling
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  
  // Accessibility
  initialFocus?: React.RefObject<HTMLElement | null>;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-2xl',
  lg: 'max-w-4xl', 
  xl: 'max-w-6xl',
  full: 'max-w-none w-full h-full'
};

// Theme configurations
const themes = {
  default: {
    header: 'bg-white border-gray-200',
    body: 'bg-white',
    footer: 'bg-gray-50/50 border-gray-200',
    accent: 'text-gray-900',
    border: 'border-gray-200'
  },
  'gt-navy': {
    header: 'bg-[#003057] border-[#003057]',
    body: 'bg-white',
    footer: 'bg-gray-50/50 border-gray-200',
    accent: 'text-white',
    border: 'border-[#003057]'
  },
  'gt-gold': {
    header: 'bg-[#B3A369] border-[#B3A369]',
    body: 'bg-white',
    footer: 'bg-gray-50/50 border-gray-200', 
    accent: 'text-white',
    border: 'border-[#B3A369]'
  },
  success: {
    header: 'bg-green-600 border-green-600',
    body: 'bg-white',
    footer: 'bg-green-50/50 border-green-200',
    accent: 'text-white',
    border: 'border-green-600'
  },
  warning: {
    header: 'bg-yellow-600 border-yellow-600',
    body: 'bg-white',
    footer: 'bg-yellow-50/50 border-yellow-200',
    accent: 'text-white',
    border: 'border-yellow-600'
  },
  error: {
    header: 'bg-red-600 border-red-600',
    body: 'bg-white',
    footer: 'bg-red-50/50 border-red-200',
    accent: 'text-white',
    border: 'border-red-600'
  }
};

export const StandardizedModal: React.FC<StandardizedModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  description,
  children,
  size = 'md',
  layout: _layout = 'default',
  theme = 'default',
  preventEscape = false,
  preventBackdropClick = false,
  showCloseButton = true,
  closeOnClickOutside = true,
  tabs,
  actions,
  headerActions,
  isLoading = false,
  loadingText = 'Loading...',
  className,
  overlayClassName,
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  initialFocus,
  ariaLabel,
  ariaDescribedBy,
  role = 'dialog'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  // Get theme configuration
  const currentTheme = themes[theme];

  // Handle focus management
  useEffect(() => {
    let focusTimeout: ReturnType<typeof setTimeout> | null = null;
    if (isOpen) {
      // Store current focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus management after modal opens
      focusTimeout = setTimeout(() => {
        if (initialFocus?.current) {
          initialFocus.current.focus();
        } else if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        } else {
          modalRef.current?.focus();
        }
      }, 100);
    } else if (previousFocusRef.current) {
      // Return focus to previously focused element
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }

    return () => {
      if (focusTimeout) clearTimeout(focusTimeout);
    };
  }, [isOpen, initialFocus]);

  // Handle escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && !preventEscape) {
      onClose();
    }
    
    // Trap focus within modal
    if (event.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }, [onClose, preventEscape]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnClickOutside && !preventBackdropClick) {
      onClose();
    }
  }, [onClose, closeOnClickOutside, preventBackdropClick]);

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed inset-0 bg-black/50 backdrop-blur-sm",
              overlayClassName
            )}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative rounded-lg shadow-xl max-h-[90vh] overflow-hidden",
              "flex flex-col",
              currentTheme.border,
              size !== 'full' && "m-4",
              sizeClasses[size],
              className
            )}
            role={role}
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-describedby={description || ariaDescribedBy ? "modal-description" : undefined}
            aria-label={ariaLabel}
            tabIndex={-1}
          >
            {/* Header */}
            {(title || subtitle || showCloseButton || headerActions) && (
              <div className={cn(
                "flex items-start justify-between p-4 border-b flex-shrink-0",
                currentTheme.header,
                headerClassName
              )}>
                <div className="flex-1 min-w-0">
                  {title && (
                    <h2 
                      id="modal-title" 
                      className={cn(
                        "text-lg font-semibold leading-6",
                        currentTheme.accent
                      )}
                    >
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className={cn(
                      "mt-1 text-sm opacity-90",
                      currentTheme.accent
                    )}>
                      {subtitle}
                    </p>
                  )}
                  {description && (
                    <p 
                      id="modal-description"
                      className={cn(
                        "mt-2 text-sm opacity-75",
                        currentTheme.accent
                      )}
                    >
                      {description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {headerActions}
                  {showCloseButton && (
                    <Button
                      ref={closeButtonRef}
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className={cn(
                        "p-1 rounded-md flex-shrink-0",
                        theme === 'default' ? "hover:bg-gray-100" : "hover:bg-white/10",
                        currentTheme.accent
                      )}
                      aria-label="Close modal"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className={cn("flex-1 flex items-center justify-center py-12", currentTheme.body)}>
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin h-6 w-6 text-[#B3A369]" />
                  <span className="text-muted-foreground">{loadingText}</span>
                </div>
              </div>
            ) : (
              <>
                {/* Tabbed Content */}
                {tabs && tabs.length > 0 ? (
                  <div className={cn("flex-1 flex flex-col", currentTheme.body)}>
                    <Tabs defaultValue={tabs[0]?.id} className="flex-1 flex flex-col">
                      <TabsList className="grid w-full mx-4 mt-4" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
                        {tabs.map((tab) => (
                          <TabsTrigger 
                            key={tab.id} 
                            value={tab.id}
                            disabled={tab.disabled}
                            className="text-sm"
                          >
                            {tab.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      <div className="flex-1 overflow-hidden">
                        {tabs.map((tab) => (
                          <TabsContent 
                            key={tab.id} 
                            value={tab.id}
                            className={cn(
                              "flex-1 overflow-y-auto focus:outline-none data-[state=active]:flex data-[state=active]:flex-col",
                              size === 'full' ? "h-full" : "max-h-[calc(90vh-200px)]",
                              contentClassName
                            )}
                          >
                            {tab.content}
                          </TabsContent>
                        ))}
                      </div>
                    </Tabs>
                  </div>
                ) : (
                  /* Standard Content */
                  <div className={cn(
                    "flex-1 overflow-y-auto",
                    currentTheme.body,
                    size === 'full' ? "h-full" : "max-h-[calc(90vh-200px)]",
                    contentClassName,
                    bodyClassName
                  )}>
                    {children}
                  </div>
                )}
              </>
            )}

            {/* Footer with Actions */}
            {actions && (
              <div className={cn(
                "flex items-center justify-end gap-2 px-4 py-3 border-t flex-shrink-0",
                currentTheme.footer,
                footerClassName
              )}>
                {actions}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Loading state modal wrapper
interface ModalLoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export const ModalLoadingState: React.FC<ModalLoadingStateProps> = ({
  isLoading,
  children,
  loadingText = "Loading..."
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#B3A369]" />
          <span className="text-muted-foreground">{loadingText}</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Modal action buttons wrapper
interface ModalActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalActions: React.FC<ModalActionsProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      "flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200",
      "bg-gray-50/50",
      className
    )}>
      {children}
    </div>
  );
};