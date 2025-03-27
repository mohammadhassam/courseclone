import { useState } from 'react';
import { CourseCreationStep, CourseOutline, BloomsTaxonomyLevel } from '@shared/schema';

// Initial state for course creation
const initialCourseOutline: CourseOutline = {
  course: {
    title: '',
    description: '',
    coverImage: '',
  },
  modules: []
};

export function useCourseCreator() {
  const [currentStep, setCurrentStep] = useState<CourseCreationStep>('info');
  const [courseOutline, setCourseOutline] = useState<CourseOutline>(initialCourseOutline);

  // Update course info (title, description, coverImage)
  const updateCourseInfo = (info: { title: string; description: string; coverImage?: string }) => {
    setCourseOutline({
      ...courseOutline,
      course: {
        ...courseOutline.course,
        ...info
      }
    });
    setCurrentStep('outline');
  };

  // Update course outline (modules and lessons)
  const updateOutline = (modules: CourseOutline['modules']) => {
    setCourseOutline({
      ...courseOutline,
      modules
    });
  };

  // Update content for a specific lesson
  const updateModuleContent = (
    moduleIndex: number, 
    lessonIndex: number, 
    content: string
  ) => {
    const updatedModules = [...courseOutline.modules];
    
    if (
      updatedModules[moduleIndex] && 
      updatedModules[moduleIndex].lessons[lessonIndex]
    ) {
      updatedModules[moduleIndex].lessons[lessonIndex].content = content;
      setCourseOutline({
        ...courseOutline,
        modules: updatedModules
      });
    }
  };
  
  // Update taxonomy level for a specific lesson
  const updateLessonTaxonomyLevel = (
    moduleIndex: number,
    lessonIndex: number,
    taxonomyLevel: BloomsTaxonomyLevel
  ) => {
    const updatedModules = [...courseOutline.modules];
    
    if (
      updatedModules[moduleIndex] && 
      updatedModules[moduleIndex].lessons[lessonIndex]
    ) {
      updatedModules[moduleIndex].lessons[lessonIndex].taxonomyLevel = taxonomyLevel;
      setCourseOutline({
        ...courseOutline,
        modules: updatedModules
      });
    }
  };

  // Reset the course creator to initial state
  const reset = () => {
    setCourseOutline(initialCourseOutline);
    setCurrentStep('info');
  };

  return {
    currentStep,
    setCurrentStep,
    courseOutline,
    setCourseOutline,
    updateCourseInfo,
    updateOutline,
    updateModuleContent,
    updateLessonTaxonomyLevel,
    reset
  };
}
