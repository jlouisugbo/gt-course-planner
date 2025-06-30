'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableProps {
  id: string;
  children: React.ReactNode;
}

export function Droppable({ id, children }: DroppableProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const style: React.CSSProperties = {
    transition: 'all 0.2s ease',
    backgroundColor: isOver ? '#e8f5e8' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}