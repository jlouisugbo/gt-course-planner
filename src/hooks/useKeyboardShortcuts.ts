"use client";

import { useEffect, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, metaKey, ctrlKey, shiftKey, altKey } = event;
      
      // Ignore shortcuts when typing in inputs, textareas, or contenteditable elements
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.getAttribute('role') === 'textbox'
      ) {
        return;
      }

      // Find matching shortcut
      const matchingShortcut = shortcutsRef.current.find(shortcut => {
        if (shortcut.disabled) return false;
        
        return (
          shortcut.key.toLowerCase() === key.toLowerCase() &&
          (shortcut.metaKey || false) === metaKey &&
          (shortcut.ctrlKey || false) === ctrlKey &&
          (shortcut.shiftKey || false) === shiftKey &&
          (shortcut.altKey || false) === altKey
        );
      });

      if (matchingShortcut) {
        event.preventDefault();
        event.stopPropagation();
        matchingShortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return shortcutsRef.current;
}

// Global shortcuts that can be used across the app
export function useGlobalShortcuts({
  onOpenSearch,
  onOpenHelp,
  onGoToDashboard,
  onGoToPlanner,
  onGoToRequirements,
  onEscape,
}: {
  onOpenSearch?: () => void;
  onOpenHelp?: () => void;
  onGoToDashboard?: () => void;
  onGoToPlanner?: () => void;
  onGoToRequirements?: () => void;
  onEscape?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      action: () => onOpenSearch?.(),
      description: 'Open search',
    },
    {
      key: 'k',
      metaKey: true,
      action: () => onOpenSearch?.(),
      description: 'Open search (Mac)',
    },
    {
      key: '/',
      action: () => onOpenSearch?.(),
      description: 'Open search',
    },
    {
      key: '?',
      action: () => onOpenHelp?.(),
      description: 'Show keyboard shortcuts',
    },
    {
      key: 'h',
      altKey: true,
      action: () => onOpenHelp?.(),
      description: 'Show help',
    },
    {
      key: 'd',
      altKey: true,
      action: () => onGoToDashboard?.(),
      description: 'Go to dashboard',
    },
    {
      key: 'p',
      altKey: true,
      action: () => onGoToPlanner?.(),
      description: 'Go to planner',
    },
    {
      key: 'r',
      altKey: true,
      action: () => onGoToRequirements?.(),
      description: 'Go to requirements',
    },
    {
      key: 'Escape',
      action: () => onEscape?.(),
      description: 'Close modal/dialog',
    },
  ];

  return useKeyboardShortcuts(shortcuts);
}

// Navigation shortcuts for lists and grids
export function useNavigationShortcuts({
  onMoveUp,
  onMoveDown,
  onMoveLeft,
  onMoveRight,
  onSelect,
  disabled = false,
}: {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onSelect?: () => void;
  disabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowUp',
      action: () => onMoveUp?.(),
      description: 'Move up',
      disabled,
    },
    {
      key: 'k',
      action: () => onMoveUp?.(),
      description: 'Move up (vim)',
      disabled,
    },
    {
      key: 'ArrowDown',
      action: () => onMoveDown?.(),
      description: 'Move down',
      disabled,
    },
    {
      key: 'j',
      action: () => onMoveDown?.(),
      description: 'Move down (vim)',
      disabled,
    },
    {
      key: 'ArrowLeft',
      action: () => onMoveLeft?.(),
      description: 'Move left',
      disabled,
    },
    {
      key: 'h',
      action: () => onMoveLeft?.(),
      description: 'Move left (vim)',
      disabled,
    },
    {
      key: 'ArrowRight',
      action: () => onMoveRight?.(),
      description: 'Move right',
      disabled,
    },
    {
      key: 'l',
      action: () => onMoveRight?.(),
      description: 'Move right (vim)',
      disabled,
    },
    {
      key: 'Enter',
      action: () => onSelect?.(),
      description: 'Select/activate',
      disabled,
    },
    {
      key: ' ',
      action: () => onSelect?.(),
      description: 'Select/activate (spacebar)',
      disabled,
    },
  ];

  return useKeyboardShortcuts(shortcuts);
}