"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowDown, 
  ArrowRight, 
  CheckCircle, 
  Circle,
  AlertTriangle,
  BookOpen,
  Zap
} from 'lucide-react';
import { Course, PrerequisiteStructure } from '@/types/courses';

interface PrerequisiteNode {
  courseCode: string;
  courseTitle?: string;
  level: number;
  status: 'completed' | 'in-progress' | 'planned' | 'missing';
  children: PrerequisiteNode[];
  logic?: 'AND' | 'OR';
  isOptional?: boolean;
}

interface PrerequisiteChainVisualizerProps {
  course: Course;
  completedCourses: string[];
  plannedCourses: string[];
  allCourses?: Course[]; // For looking up course details
  onCourseClick?: (courseCode: string) => void;
  className?: string;
}

export default function PrerequisiteChainVisualizer({
  course,
  completedCourses = [],
  plannedCourses = [],
  allCourses = [],
  onCourseClick,
  className = ''
}: PrerequisiteChainVisualizerProps) {

  // Build prerequisite tree
  const prerequisiteTree = useMemo(() => {
    const courseMap = new Map(allCourses.map(c => [c.code, c]));
    const visited = new Set<string>();

    const buildTree = (
      courseCode: string, 
      prereqStructure?: PrerequisiteStructure, 
      level = 0
    ): PrerequisiteNode | null => {
      
      if (visited.has(courseCode) || level > 10) return null;
      visited.add(courseCode);

      const courseData = courseMap.get(courseCode);
      const status = completedCourses.includes(courseCode) 
        ? 'completed'
        : plannedCourses.includes(courseCode)
        ? 'planned'
        : 'missing';

      const node: PrerequisiteNode = {
        courseCode,
        courseTitle: courseData?.title,
        level,
        status,
        children: [],
        logic: prereqStructure?.type,
        isOptional: prereqStructure?.type === 'OR'
      };

      // Build children from prerequisites
      if (prereqStructure) {
        // Handle direct course prerequisites
        if (prereqStructure.courses) {
          prereqStructure.courses.forEach(prereqCode => {
            const prereqCourse = courseMap.get(prereqCode);
            const childNode = buildTree(
              prereqCode, 
              prereqCourse?.prerequisites,
              level + 1
            );
            if (childNode) {
              node.children.push(childNode);
            }
          });
        }

        // Handle nested prerequisite structures
        if (prereqStructure.nested) {
          prereqStructure.nested.forEach(nested => {
            if (nested.courses) {
              nested.courses.forEach(nestedCode => {
                const nestedCourse = courseMap.get(nestedCode);
                const childNode = buildTree(
                  nestedCode,
                  nestedCourse?.prerequisites,
                  level + 1
                );
                if (childNode) {
                  childNode.logic = nested.type;
                  childNode.isOptional = nested.type === 'OR';
                  node.children.push(childNode);
                }
              });
            }
          });
        }
      }

      return node;
    };

    return buildTree(course.code, course.prerequisites);
  }, [course, completedCourses, plannedCourses, allCourses]);

  // Get status icon
  const getStatusIcon = (status: string, isOptional = false) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'planned':
        return <Circle className="h-4 w-4 text-blue-500" />;
      case 'missing':
        return isOptional 
          ? <AlertTriangle className="h-4 w-4 text-yellow-500" />
          : <Circle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string, isOptional = false) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'planned':
        return 'border-blue-500 bg-blue-50';
      case 'missing':
        return isOptional 
          ? 'border-yellow-500 bg-yellow-50'
          : 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  // Render prerequisite node
  const renderNode = (node: PrerequisiteNode, isLast = false) => {
    const hasChildren = node.children.length > 0;
    const indent = node.level * 24;

    return (
      <div key={`${node.courseCode}-${node.level}`} className="relative">
        {/* Connection Lines */}
        {node.level > 0 && (
          <div 
            className="absolute top-6 border-l-2 border-gray-300"
            style={{ 
              left: indent - 12,
              height: hasChildren ? 'calc(100% + 12px)' : '0px'
            }}
          />
        )}
        
        {node.level > 0 && (
          <div 
            className="absolute top-6 w-3 border-t-2 border-gray-300"
            style={{ left: indent - 12 }}
          />
        )}

        {/* Course Node */}
        <div 
          className="relative mb-3"
          style={{ marginLeft: indent }}
        >
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(node.status, node.isOptional)}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(node.status, node.isOptional)}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-medium cursor-pointer hover:underline"
                      onClick={() => onCourseClick?.(node.courseCode)}
                    >
                      {node.courseCode}
                    </span>
                    
                    {node.logic && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          node.logic === 'OR' ? 'border-yellow-500 text-yellow-700' : 'border-blue-500 text-blue-700'
                        }`}
                      >
                        {node.logic}
                      </Badge>
                    )}
                  </div>
                  
                  {node.courseTitle && (
                    <p className="text-sm text-gray-600 mt-1">{node.courseTitle}</p>
                  )}
                </div>

                {/* Status Badge */}
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    node.status === 'completed' ? 'bg-green-100 text-green-800' :
                    node.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}
                >
                  {node.status === 'completed' ? 'Done' :
                   node.status === 'planned' ? 'Planned' : 
                   node.isOptional ? 'Optional' : 'Required'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Children */}
        {hasChildren && (
          <div className="space-y-2">
            {node.children.map((child, index) => 
              renderNode(child, index === node.children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (!prerequisiteTree || prerequisiteTree.children.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">No prerequisites required for this course.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats
  const flattenNodes = (node: PrerequisiteNode): PrerequisiteNode[] => {
    return [node, ...node.children.flatMap(child => flattenNodes(child))];
  };

  const allNodes = flattenNodes(prerequisiteTree);
  const completedCount = allNodes.filter(n => n.status === 'completed').length;
  const missingCount = allNodes.filter(n => n.status === 'missing').length;
  const totalCount = allNodes.length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-gt-gold" />
          Prerequisite Chain
        </CardTitle>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            {completedCount} completed
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-4 w-4 text-red-500" />
            {missingCount} missing
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-4 w-4 text-blue-500" />
            {totalCount - completedCount - missingCount} planned
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Completed
            </div>
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-blue-500" />
              Planned
            </div>
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-red-500" />
              Required
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              Optional
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">AND</Badge>
              All required
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">OR</Badge>
              Choose one
            </div>
          </div>

          {/* Prerequisite Tree */}
          <div className="max-h-96 overflow-y-auto">
            {renderNode(prerequisiteTree)}
          </div>

          {/* Actions */}
          {missingCount > 0 && (
            <div className="flex justify-end pt-3 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // This would trigger a bulk semester planner
                  console.log('Plan prerequisites');
                }}
              >
                Plan Prerequisites
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}