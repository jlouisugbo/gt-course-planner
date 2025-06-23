import React from 'react';
import {useDroppable} from '@dnd-kit/core';

interface DroppableProps {
  id: string;
  children: React.ReactNode;
  backgroundColor?: string;
  style?: React.CSSProperties;
}

export function Droppable({ id, children, backgroundColor = '#f0f0f0', title }: DroppableProps & { title?: string }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const style = {
    backgroundColor: isOver ? '#e8f5e8' : backgroundColor,
    border: '2px dashed #ccc',
    borderColor: isOver ? '#4CAF50' : '#ccc',
    borderRadius: '8px',
    padding: '20px',
    minHeight: '120px',
    minWidth: '200px',
    margin: '10px',
    transition: 'all 0.2s ease',
    zIndex: 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{title}</h4>
      {children}
    </div>
  );
}