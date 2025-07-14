"use client";

import React from 'react';
import SemesterCard from './SemesterCard';
import { SemesterData } from '@/types/courses';

interface SemesterColumnsProps {
  semester: SemesterData;
}

const SemesterColumn: React.FC<SemesterColumnsProps> = ({ semester }) => {
  return <SemesterCard semester={semester} />;
};

export default SemesterColumn;
