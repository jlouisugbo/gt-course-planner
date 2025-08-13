/**
 * GT Design System - Standardized Form Components
 * Consolidated form elements with GT branding, validation, and accessibility
 */

"use client";

import React, { useState, useCallback, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
// import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Search,
  X,
  // Info,
  Loader2,
  // Upload,
  // Download
} from 'lucide-react';

// GT Brand Colors
const _GT_NAVY = '#003057';
const _GT_GOLD = '#B3A369';

// Validation states
type ValidationState = 'default' | 'valid' | 'error' | 'warning';

// Base interfaces
interface GTFormFieldProps {
  id?: string;
  name?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  validation?: ValidationState;
  errorMessage?: string;
  successMessage?: string;
  warningMessage?: string;
  className?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
}

// Validation styling
const getValidationStyles = (validation: ValidationState) => {
  switch (validation) {
    case 'valid':
      return {
        border: 'border-green-500 focus:ring-green-500',
        bg: 'focus:bg-green-50/50',
        icon: CheckCircle2,
        iconColor: 'text-green-500',
        message: 'text-green-600'
      };
    case 'error':
      return {
        border: 'border-red-500 focus:ring-red-500',
        bg: 'focus:bg-red-50/50',
        icon: AlertCircle,
        iconColor: 'text-red-500',
        message: 'text-red-600'
      };
    case 'warning':
      return {
        border: 'border-yellow-500 focus:ring-yellow-500',
        bg: 'focus:bg-yellow-50/50',
        icon: AlertCircle,
        iconColor: 'text-yellow-500',
        message: 'text-yellow-600'
      };
    default:
      return {
        border: 'border-gray-300 focus:ring-[#B3A369] focus:border-[#B3A369]',
        bg: 'focus:bg-blue-50/20',
        icon: null,
        iconColor: '',
        message: 'text-muted-foreground'
      };
  }
};

// GT Text Input Component
interface GTTextInputProps extends GTFormFieldProps {
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ComponentType<any>;
  rightIcon?: React.ComponentType<any>;
  onLeftIconClick?: () => void;
  onRightIconClick?: () => void;
  showPasswordToggle?: boolean;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const GTTextInput = forwardRef<HTMLInputElement, GTTextInputProps>(({
  id,
  name,
  label,
  description,
  placeholder,
  value,
  defaultValue,
  disabled = false,
  required = false,
  readOnly = false,
  validation = 'default',
  errorMessage,
  successMessage,
  warningMessage,
  type = 'text',
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onLeftIconClick,
  onRightIconClick,
  showPasswordToggle = false,
  onChange,
  onBlur,
  onFocus,
  className,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const styles = getValidationStyles(validation);
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base'
  };
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  }, [onChange]);
  
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  }, [onFocus]);
  
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);
  
  const getMessage = () => {
    if (validation === 'error' && errorMessage) return errorMessage;
    if (validation === 'valid' && successMessage) return successMessage;
    if (validation === 'warning' && warningMessage) return warningMessage;
    return description;
  };
  
  const messageId = `${id}-message`;
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label 
          htmlFor={id}
          className={cn(
            "text-sm font-medium text-[#003057]",
            required && "after:content-['*'] after:ml-0.5 after:text-red-500",
            disabled && "opacity-50"
          )}
        >
          {label}
        </Label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <LeftIcon 
              className={cn(
                "h-4 w-4 transition-colors",
                isFocused ? "text-[#B3A369]" : "text-muted-foreground",
                onLeftIconClick && "cursor-pointer hover:text-[#B3A369]"
              )}
              onClick={onLeftIconClick}
            />
          </div>
        )}
        
        <Input
          ref={ref}
          id={id}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "transition-all duration-200",
            sizeClasses[size],
            styles.border,
            styles.bg,
            LeftIcon && "pl-10",
            (RightIcon || (type === 'password' && showPasswordToggle)) && "pr-10",
            disabled && "opacity-50 cursor-not-allowed",
            readOnly && "bg-muted",
            isFocused && "shadow-md"
          )}
          aria-describedby={getMessage() ? messageId : props['aria-describedby']}
          aria-invalid={validation === 'error'}
          {...props}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {styles.icon && (
            <styles.icon className={cn("h-4 w-4", styles.iconColor)} />
          )}
          
          {type === 'password' && showPasswordToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}
          
          {RightIcon && (
            <RightIcon 
              className={cn(
                "h-4 w-4 transition-colors",
                isFocused ? "text-[#B3A369]" : "text-muted-foreground",
                onRightIconClick && "cursor-pointer hover:text-[#B3A369]"
              )}
              onClick={onRightIconClick}
            />
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {getMessage() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <p 
              id={messageId}
              className={cn("text-xs flex items-center gap-1", styles.message)}
            >
              {validation !== 'default' && styles.icon && (
                <styles.icon className="h-3 w-3" />
              )}
              {getMessage()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

GTTextInput.displayName = 'GTTextInput';

// GT Search Input Component
interface GTSearchInputProps extends Omit<GTTextInputProps, 'type' | 'leftIcon'> {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
  isLoading?: boolean;
  debounceMs?: number;
}

export const GTSearchInput = forwardRef<HTMLInputElement, GTSearchInputProps>(({
  onSearch,
  onClear,
  showClearButton = true,
  isLoading = false,
  debounceMs = 300,
  onChange,
  ...props
}, ref) => {
  const [searchValue, setSearchValue] = useState(props.value || '');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout>();
  
  const handleChange = useCallback((value: string) => {
    setSearchValue(value);
    onChange?.(value);
    
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    const timeout = setTimeout(() => {
      onSearch?.(value);
    }, debounceMs);
    
    setDebounceTimeout(timeout);
  }, [onChange, onSearch, debounceMs, debounceTimeout]);
  
  const handleClear = useCallback(() => {
    setSearchValue('');
    onClear?.();
    onChange?.('');
  }, [onClear, onChange]);
  
  return (
    <GTTextInput
      ref={ref}
      {...props}
      type="search"
      value={searchValue}
      onChange={handleChange}
      leftIcon={isLoading ? Loader2 : Search}
      rightIcon={searchValue && showClearButton ? X : undefined}
      onRightIconClick={searchValue && showClearButton ? handleClear : undefined}
      className={cn(
        isLoading && "[&>div>div:first-child>svg]:animate-spin",
        props.className
      )}
    />
  );
});

GTSearchInput.displayName = 'GTSearchInput';

// GT Select Component
interface GTSelectProps extends GTFormFieldProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  onValueChange?: (value: string) => void;
  multiple?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const GTSelect = forwardRef<HTMLButtonElement, GTSelectProps>(({
  id,
  label,
  description,
  placeholder = 'Select an option...',
  value,
  disabled = false,
  required = false,
  validation = 'default',
  errorMessage,
  successMessage,
  warningMessage,
  options,
  onValueChange,
  size = 'md',
  className,
  ...props
}, ref) => {
  const styles = getValidationStyles(validation);
  
  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  };
  
  const getMessage = () => {
    if (validation === 'error' && errorMessage) return errorMessage;
    if (validation === 'valid' && successMessage) return successMessage;
    if (validation === 'warning' && warningMessage) return warningMessage;
    return description;
  };
  
  const messageId = `${id}-message`;
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label 
          htmlFor={id}
          className={cn(
            "text-sm font-medium text-[#003057]",
            required && "after:content-['*'] after:ml-0.5 after:text-red-500",
            disabled && "opacity-50"
          )}
        >
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger
            ref={ref}
            id={id}
            className={cn(
              "transition-all duration-200",
              sizeClasses[size],
              styles.border,
              styles.bg,
              disabled && "opacity-50",
              validation !== 'default' && "pr-10"
            )}
            aria-describedby={getMessage() ? messageId : props['aria-describedby']}
            aria-invalid={validation === 'error'}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          
          <SelectContent className="z-50">
            {options.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
                className="cursor-pointer"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {styles.icon && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <styles.icon className={cn("h-4 w-4", styles.iconColor)} />
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {getMessage() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <p 
              id={messageId}
              className={cn("text-xs flex items-center gap-1", styles.message)}
            >
              {validation !== 'default' && styles.icon && (
                <styles.icon className="h-3 w-3" />
              )}
              {getMessage()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

GTSelect.displayName = 'GTSelect';

// GT Checkbox Group Component
interface GTCheckboxGroupProps extends GTFormFieldProps {
  options: Array<{ value: string; label: string; disabled?: boolean; description?: string }>;
  value?: string[];
  onValueChange?: (values: string[]) => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export const GTCheckboxGroup: React.FC<GTCheckboxGroupProps> = ({
  id,
  label,
  description,
  value = [],
  disabled = false,
  required = false,
  validation = 'default',
  errorMessage,
  successMessage,
  warningMessage,
  options,
  onValueChange,
  orientation = 'vertical',
  size: _size = 'md',
  className
}) => {
  const styles = getValidationStyles(validation);
  
  const handleChange = useCallback((optionValue: string, checked: boolean) => {
    if (!onValueChange) return;
    
    const newValue = checked 
      ? [...value, optionValue]
      : value.filter(v => v !== optionValue);
    
    onValueChange(newValue);
  }, [value, onValueChange]);
  
  const getMessage = () => {
    if (validation === 'error' && errorMessage) return errorMessage;
    if (validation === 'valid' && successMessage) return successMessage;
    if (validation === 'warning' && warningMessage) return warningMessage;
    return description;
  };
  
  const messageId = `${id}-message`;
  
  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <Label 
          className={cn(
            "text-sm font-medium text-[#003057]",
            required && "after:content-['*'] after:ml-0.5 after:text-red-500",
            disabled && "opacity-50"
          )}
        >
          {label}
        </Label>
      )}
      
      <div className={cn(
        "space-y-3",
        orientation === 'horizontal' && "flex flex-wrap gap-4 space-y-0"
      )}>
        {options.map((option, _index) => (
          <div key={option.value} className="flex items-start space-x-2">
            <Checkbox
              id={`${id}-${option.value}`}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) => handleChange(option.value, checked === true)}
              disabled={disabled || option.disabled}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor={`${id}-${option.value}`}
                className={cn(
                  "text-sm font-medium cursor-pointer",
                  disabled || option.disabled ? "opacity-50" : "text-foreground"
                )}
              >
                {option.label}
              </Label>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <AnimatePresence>
        {getMessage() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <p 
              id={messageId}
              className={cn("text-xs flex items-center gap-1", styles.message)}
            >
              {validation !== 'default' && styles.icon && (
                <styles.icon className="h-3 w-3" />
              )}
              {getMessage()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// GT Form Section Component
interface GTFormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  required?: boolean;
  className?: string;
}

export const GTFormSection: React.FC<GTFormSectionProps> = ({
  title,
  description,
  children,
  collapsible = false,
  defaultCollapsed = false,
  required = false,
  className
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  return (
    <Card className={cn("border-l-4 border-l-[#B3A369]/30", className)}>
      {title && (
        <CardHeader 
          className={cn(
            "pb-4",
            collapsible && "cursor-pointer hover:bg-muted/50 transition-colors"
          )}
          onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        >
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              "text-lg font-semibold text-[#003057]",
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}>
              {title}
            </CardTitle>
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                className="p-1"
                aria-label={isCollapsed ? "Expand section" : "Collapse section"}
              >
                <motion.div
                  animate={{ rotate: isCollapsed ? 0 : 180 }}
                  transition={{ duration: 0.2 }}
                >
                  ↓
                </motion.div>
              </Button>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </CardHeader>
      )}
      
      <AnimatePresence>
        {(!collapsible || !isCollapsed) && (
          <motion.div
            initial={collapsible ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-6">
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const GTFormComponents = {
  GTTextInput,
  GTSearchInput,
  GTSelect,
  GTCheckboxGroup,
  GTFormSection
};

export default GTFormComponents;