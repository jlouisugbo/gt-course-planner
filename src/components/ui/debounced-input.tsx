import React, { useState, useEffect, useCallback } from 'react';
import { Input } from './input';

interface DebouncedInputProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = React.memo(({
  value,
  onChange,
  debounceMs = 0,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce the onChange callback
  useEffect(() => {
    if (debounceMs === 0) {
      onChange(localValue);
      return;
    }

    const handler = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [localValue, onChange, debounceMs]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <Input
      {...props}
      value={localValue}
      onChange={handleChange}
    />
  );
});

DebouncedInput.displayName = 'DebouncedInput';