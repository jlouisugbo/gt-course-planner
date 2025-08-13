/**
 * GT Design System - Main Export Index
 * Consolidated exports for all GT Design System components
 */

// Core Components
export { GTCourseCard, default as GTCourseCardComponents } from './gt-course-card';

// Modal Components  
export { StandardizedModal, ModalActions, ModalLoadingState } from './standardized-modal';

// Dashboard Components
export { 
  GTStatCard, 
  GTInsightCard, 
  GTProgressCard, 
  GTStatsGrid,
  default as GTDashboardComponents 
} from './gt-dashboard-cards';

// Form Components
export {
  GTTextInput,
  GTSearchInput, 
  GTSelect,
  GTCheckboxGroup,
  GTFormSection,
  default as GTFormComponents
} from './gt-form-components';

// Layout Components
export {
  GTHeader,
  GTSidebar,
  GTBreadcrumbs,
  GTPageLayout,
  GTQuickActions,
  default as GTLayoutComponents
} from './gt-layout-components';

// Re-export common UI components with GT theming applied
export { Button } from './button';
export { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './card';
export { Badge } from './badge';
export { Input } from './input';
export { Label } from './label';
export { Textarea } from './textarea';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Checkbox } from './checkbox';
export { RadioGroup, RadioGroupItem } from './radio-group';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

// GT Brand Constants
export const GT_COLORS = {
  NAVY: '#003057',
  GOLD: '#B3A369',
  TECH_GOLD: '#EAAA00'
} as const;

export const GT_THEMES = {
  primary: {
    bg: 'bg-[#003057]',
    text: 'text-white',
    border: 'border-[#003057]',
    hover: 'hover:bg-[#003057]/90'
  },
  secondary: {
    bg: 'bg-[#B3A369]',
    text: 'text-white', 
    border: 'border-[#B3A369]',
    hover: 'hover:bg-[#B3A369]/90'
  },
  accent: {
    bg: 'bg-[#EAAA00]',
    text: 'text-[#003057]',
    border: 'border-[#EAAA00]',
    hover: 'hover:bg-[#EAAA00]/90'
  }
} as const;

// Common GT utility classes
export const GT_CLASSES = {
  // Borders
  gtBorderLeft: 'border-l-4 border-l-gt-gold/30',
  gtBorderTop: 'border-t-4 border-t-gt-navy/30',
  
  // Gradients
  gtGradient: 'bg-gradient-to-br from-gt-navy to-gt-gold',
  gtGradientHover: 'hover:bg-gradient-to-br hover:from-gt-navy hover:to-gt-gold',
  
  // Text
  gtTextNavy: 'text-gt-navy',
  gtTextGold: 'text-gt-gold',
  
  // Hover effects
  gtHoverGold: 'hover:text-gt-gold',
  gtHoverNavy: 'hover:text-gt-navy',
  
  // Focus rings
  gtFocusRing: 'focus:ring-2 focus:ring-gt-navy/20 focus:ring-offset-2',
  
  // Card styles
  gtCard: 'border-l-4 border-l-gt-gold/20 hover:border-l-gt-gold hover:shadow-lg transition-all duration-300',
  
  // Button variants
  gtButtonPrimary: 'bg-gt-navy text-white hover:bg-gt-navy/90 focus:ring-gt-navy/20',
  gtButtonSecondary: 'bg-gt-gold text-white hover:bg-gt-gold/90 focus:ring-gt-gold/20',
  gtButtonOutline: 'border-2 border-gt-navy text-gt-navy hover:bg-gt-navy hover:text-white'
} as const;

// Type exports
export type GTTheme = keyof typeof GT_THEMES;
export type GTColor = keyof typeof GT_COLORS;