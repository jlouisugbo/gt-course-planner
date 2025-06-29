'use client';
import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableProps {
  id: string;
  children: React.ReactNode;
}

export function Draggable({ id, children }: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 9999 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}