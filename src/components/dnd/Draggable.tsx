import React from 'react';
import {useDraggable} from '@dnd-kit/core';

interface DraggableProps {
  id: string;
  children: React.ReactNode;
}

export function Draggable({ id, children }: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    cursor: 'pointer',
    opacity: isDragging ? 0.5 : 1,
    padding: '8px 10px',
    margin: '5px',
    backgroundColor: '#FFD700',
    backgroundImage: 'linear-gradient(45deg, #FFD700, #FF8C00)',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    display: 'inline-block',
    userSelect: 'none' as const,
    zIndex: 9999,
  };
    return (
        <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
        {children}
        </button>
    );
    }