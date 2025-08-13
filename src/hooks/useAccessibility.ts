"use client";

import { useEffect, useRef, useCallback, useState } from 'react';

// Focus management hook
export function useFocusManagement() {
  const focusableElementsSelector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(focusableElementsSelector) as NodeListOf<HTMLElement>;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [focusableElementsSelector]);

  const restoreFocus = useCallback((element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);

  const getFocusableElements = useCallback((container: HTMLElement) => {
    return container.querySelectorAll(focusableElementsSelector) as NodeListOf<HTMLElement>;
  }, [focusableElementsSelector]);

  return {
    trapFocus,
    restoreFocus,
    getFocusableElements,
  };
}

// Screen reader announcements
export function useScreenReader() {
  const announcementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create a live region for screen reader announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(liveRegion);
    announcementRef.current = liveRegion;

    return () => {
      if (announcementRef.current) {
        document.body.removeChild(announcementRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcementRef.current) {
      announcementRef.current.setAttribute('aria-live', priority);
      announcementRef.current.textContent = message;
      
      // Clear the message after a short delay to ensure it can be announced again
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  return { announce };
}

// Keyboard navigation for lists and grids
export function useKeyboardNavigation({
  containerRef,
  itemSelector = '[role="gridcell"], [role="listitem"], .navigation-item',
  orientation = 'both',
  wrap = true,
  onSelect,
}: {
  containerRef: React.RefObject<HTMLElement>;
  itemSelector?: string;
  orientation?: 'horizontal' | 'vertical' | 'both';
  wrap?: boolean;
  onSelect?: (element: HTMLElement, index: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isActive, setIsActive] = useState(false);

  const getItems = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll(itemSelector)) as HTMLElement[];
  }, [containerRef, itemSelector]);

  const focusItem = useCallback((index: number) => {
    const items = getItems();
    if (index >= 0 && index < items.length) {
      items[index]?.focus();
      setCurrentIndex(index);
    }
  }, [getItems]);

  const moveToNext = useCallback(() => {
    const items = getItems();
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < items.length) {
      focusItem(nextIndex);
    } else if (wrap) {
      focusItem(0);
    }
  }, [currentIndex, getItems, focusItem, wrap]);

  const moveToPrevious = useCallback(() => {
    const items = getItems();
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      focusItem(prevIndex);
    } else if (wrap) {
      focusItem(items.length - 1);
    }
  }, [currentIndex, getItems, focusItem, wrap]);

  const moveToNextRow = useCallback(() => {
    const items = getItems();
    const container = containerRef.current;
    if (!container) return;

    // Calculate items per row based on layout
    const firstItem = items[0];
    if (!firstItem) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = firstItem.getBoundingClientRect();
    const itemsPerRow = Math.floor(containerRect.width / itemRect.width);
    
    const nextRowIndex = currentIndex + itemsPerRow;
    if (nextRowIndex < items.length) {
      focusItem(nextRowIndex);
    } else if (wrap) {
      focusItem(currentIndex % itemsPerRow);
    }
  }, [currentIndex, getItems, focusItem, wrap, containerRef]);

  const moveToPreviousRow = useCallback(() => {
    const items = getItems();
    const container = containerRef.current;
    if (!container) return;

    const firstItem = items[0];
    if (!firstItem) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = firstItem.getBoundingClientRect();
    const itemsPerRow = Math.floor(containerRect.width / itemRect.width);
    
    const prevRowIndex = currentIndex - itemsPerRow;
    if (prevRowIndex >= 0) {
      focusItem(prevRowIndex);
    } else if (wrap) {
      const lastRowStart = Math.floor((items.length - 1) / itemsPerRow) * itemsPerRow;
      const targetIndex = Math.min(lastRowStart + (currentIndex % itemsPerRow), items.length - 1);
      focusItem(targetIndex);
    }
  }, [currentIndex, getItems, focusItem, wrap, containerRef]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive) return;

    const { key, shiftKey: _shiftKey, ctrlKey, metaKey } = event;
    
    // Don't handle if modifier keys are pressed (except shift for Tab)
    if ((ctrlKey || metaKey) && key !== 'Tab') return;

    switch (key) {
      case 'ArrowRight':
      case 'l': // Vim-style
        if (orientation === 'vertical') return;
        event.preventDefault();
        moveToNext();
        break;
        
      case 'ArrowLeft':
      case 'h': // Vim-style
        if (orientation === 'vertical') return;
        event.preventDefault();
        moveToPrevious();
        break;
        
      case 'ArrowDown':
      case 'j': // Vim-style
        event.preventDefault();
        if (orientation === 'horizontal') {
          moveToNext();
        } else {
          moveToNextRow();
        }
        break;
        
      case 'ArrowUp':
      case 'k': // Vim-style
        event.preventDefault();
        if (orientation === 'horizontal') {
          moveToPrevious();
        } else {
          moveToPreviousRow();
        }
        break;
        
      case 'Home':
        event.preventDefault();
        focusItem(0);
        break;
        
      case 'End':
        event.preventDefault();
        focusItem(getItems().length - 1);
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        const items = getItems();
        if (currentIndex >= 0 && currentIndex < items.length) {
          onSelect?.(items[currentIndex], currentIndex);
        }
        break;
        
      case 'Escape':
        setIsActive(false);
        containerRef.current?.blur();
        break;
    }
  }, [isActive, orientation, moveToNext, moveToPrevious, moveToNextRow, moveToPreviousRow, 
      focusItem, getItems, onSelect, currentIndex, containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocus = (event: FocusEvent) => {
      const items = getItems();
      const focusedIndex = items.findIndex(item => item === event.target);
      if (focusedIndex >= 0) {
        setCurrentIndex(focusedIndex);
        setIsActive(true);
      }
    };

    const handleBlur = (event: FocusEvent) => {
      // Check if focus is moving outside the container
      if (!container.contains(event.relatedTarget as Node)) {
        setIsActive(false);
      }
    };

    container.addEventListener('focusin', handleFocus);
    container.addEventListener('focusout', handleBlur);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('focusin', handleFocus);
      container.removeEventListener('focusout', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, getItems, handleKeyDown]);

  return {
    currentIndex,
    isActive,
    focusItem,
    moveToNext,
    moveToPrevious,
  };
}

// Reduced motion preference detection
export function useReducedMotion() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduceMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setShouldReduceMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return shouldReduceMotion;
}

// ARIA live region management
export function useAriaLiveRegion() {
  const regionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'false');
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    
    document.body.appendChild(region);
    regionRef.current = region;

    return () => {
      if (regionRef.current) {
        document.body.removeChild(regionRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (regionRef.current) {
      regionRef.current.setAttribute('aria-live', priority);
      regionRef.current.textContent = message;
    }
  }, []);

  return { announce };
}