/**
 * GT Design System - Consolidated Layout and Navigation Components
 * Unified header, sidebar, breadcrumbs, and navigation with GT branding
 */

"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
// import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  X,
  // Home,
  // BookOpen,
  // Calendar,
  User,
  Settings,
  LogOut,
  Bell,
  // Search,
  ChevronRight,
  ChevronDown,
  // Bookmark,
  // BarChart3,
  GraduationCap,
  // FileText,
  HelpCircle
} from 'lucide-react';

// GT Brand Colors
const _GT_NAVY = '#003057';
const _GT_GOLD = '#B3A369';

// Navigation item interface
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'error';
  };
  children?: NavItem[];
  disabled?: boolean;
  external?: boolean;
}

// User interface
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

// GT Header Component
interface GTHeaderProps {
  user?: User;
  logo?: React.ReactNode;
  title?: string;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
  actions?: React.ReactNode;
  notifications?: number;
  onNotificationClick?: () => void;
  onUserMenuAction?: (action: string) => void;
  className?: string;
}

export const GTHeader: React.FC<GTHeaderProps> = ({
  user,
  logo,
  title = 'GT Course Planner',
  onMenuToggle,
  showMenuButton = true,
  actions,
  notifications = 0,
  onNotificationClick,
  onUserMenuAction,
  className
}) => {
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-white shadow-sm",
      "border-[#003057]/10",
      className
    )}>
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile menu button */}
        {showMenuButton && (
          <Button
            variant="ghost"
            size="sm"
            className="mr-2 md:hidden"
            onClick={onMenuToggle}
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          {logo || (
            <div className="flex items-center justify-center w-8 h-8 bg-[#003057] rounded">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          )}
          <h1 className="text-lg font-bold text-[#003057] hidden sm:block">
            {title}
          </h1>
        </div>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Actions and user menu */}
        <div className="flex items-center gap-2">
          {actions}
          
          {/* Notifications */}
          {onNotificationClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNotificationClick}
              className="relative"
              aria-label={`Notifications${notifications > 0 ? ` (${notifications})` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 text-xs"
                >
                  {notifications > 99 ? '99+' : notifications}
                </Badge>
              )}
            </Button>
          )}
          
          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-[#B3A369] text-white">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    {user.role && (
                      <Badge variant="outline" className="text-xs w-fit">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUserMenuAction?.('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUserMenuAction?.('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUserMenuAction?.('help')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUserMenuAction?.('logout')}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

// GT Sidebar Component
interface GTSidebarProps {
  navigation: NavItem[];
  currentPath?: string;
  isOpen?: boolean;
  onItemClick?: (item: NavItem) => void;
  onClose?: () => void;
  className?: string;
  compact?: boolean;
}

export const GTSidebar: React.FC<GTSidebarProps> = ({
  navigation,
  currentPath = '',
  isOpen = true,
  onItemClick,
  onClose,
  className,
  compact = false
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  
  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = currentPath === item.href;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const Icon = item.icon;
    
    return (
      <div key={item.id}>
        <motion.div
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
        >
          <button
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(item.id);
              } else {
                onItemClick?.(item);
              }
            }}
            disabled={item.disabled}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-[#B3A369]/20",
              depth > 0 && "ml-4",
              isActive 
                ? "bg-[#B3A369]/10 text-[#003057] border-r-2 border-[#B3A369]" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              item.disabled && "opacity-50 cursor-not-allowed",
              compact && !depth && "justify-center px-2"
            )}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-current={isActive ? 'page' : undefined}
          >
            {Icon && (
              <Icon className={cn(
                "h-4 w-4 flex-shrink-0",
                isActive && "text-[#B3A369]"
              )} />
            )}
            
            {(!compact || depth > 0) && (
              <>
                <span className="flex-1 text-left truncate">
                  {item.label}
                </span>
                
                {item.badge && (
                  <Badge 
                    variant={item.badge.variant || 'default'}
                    className="text-xs"
                  >
                    {item.badge.text}
                  </Badge>
                )}
                
                {hasChildren && (
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                )}
              </>
            )}
          </button>
        </motion.div>
        
        {/* Submenu */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {item.children?.map(child => renderNavItem(child, depth + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && onClose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.aside
        initial={{ x: compact ? -72 : -256 }}
        animate={{ x: isOpen ? 0 : (compact ? -72 : -256) }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white border-r border-border",
          "md:sticky md:top-16 md:z-10",
          compact ? "w-18" : "w-64",
          className
        )}
      >
        <div className="h-full flex flex-col">
          {/* Close button (mobile) */}
          {onClose && (
            <div className="flex justify-end p-4 md:hidden">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map(item => renderNavItem(item))}
          </nav>
          
          {/* Footer */}
          {!compact && (
            <div className="p-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Georgia Tech Course Planner
              </p>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};

// GT Breadcrumbs Component
interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface GTBreadcrumbsProps {
  items: BreadcrumbItem[];
  onItemClick?: (item: BreadcrumbItem) => void;
  className?: string;
  separator?: React.ReactNode;
}

export const GTBreadcrumbs: React.FC<GTBreadcrumbsProps> = ({
  items,
  onItemClick,
  className,
  separator = <ChevronRight className="h-4 w-4 text-muted-foreground" />
}) => {
  if (!items || items.length === 0) return null;
  
  return (
    <nav 
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-1 text-sm", className)}
    >
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2" aria-hidden="true">
                {separator}
              </span>
            )}
            
            {item.current || !item.href ? (
              <span 
                className="font-medium text-[#003057]"
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => onItemClick?.(item)}
                className="text-muted-foreground hover:text-[#B3A369] transition-colors"
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// GT Page Layout Component
interface GTPageLayoutProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  tabs?: Array<{ id: string; label: string; content: React.ReactNode }>;
  children: React.ReactNode;
  className?: string;
}

export const GTPageLayout: React.FC<GTPageLayoutProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  className
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Page header */}
      {(title || subtitle || breadcrumbs || actions) && (
        <div className="space-y-4">
          {breadcrumbs && (
            <GTBreadcrumbs items={breadcrumbs} />
          )}
          
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {title && (
                <h1 className="text-2xl font-bold text-[#003057]">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
            
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

// GT Quick Actions Component
interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
}

interface GTQuickActionsProps {
  title?: string;
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const GTQuickActions: React.FC<GTQuickActionsProps> = ({
  title = "Quick Actions",
  actions,
  columns = 4,
  className
}) => {
  return (
    <Card className={cn("border-l-4 border-l-[#B3A369]", className)}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-[#003057] mb-4">
          {title}
        </h3>
        
        <div className={cn(
          "grid gap-4",
          columns === 2 && "grid-cols-1 sm:grid-cols-2",
          columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        )}>
          {actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="outline"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "h-auto p-4 flex flex-col items-center gap-3 group relative",
                  "hover:border-[#B3A369] hover:shadow-md transition-all duration-200",
                  action.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <action.icon className="h-6 w-6 text-[#003057] group-hover:text-[#B3A369] transition-colors" />
                <div className="text-center">
                  <p className="font-medium text-sm">{action.label}</p>
                  {action.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  )}
                </div>
                
                {action.badge && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 text-xs"
                  >
                    {action.badge}
                  </Badge>
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const GTLayoutComponents = {
  GTHeader,
  GTSidebar,
  GTBreadcrumbs,
  GTPageLayout,
  GTQuickActions
};

export default GTLayoutComponents;