import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { CourseCreationStep, CourseOutline, CourseWithModulesAndLessons, BloomsTaxonomyLevel, bloomsTaxonomyLevels } from "@shared/schema";
import ProgressSteps from "@/components/ui/progress-steps";
import CourseInfoForm from "@/components/course/course-info-form";
import CourseOutlineBuilder from "@/components/course/course-outline-builder";
import CourseContentEditor from "@/components/course/course-content-editor";
import CoursePublish from "@/components/course/course-publish";
import { useCourseCreator } from "@/hooks/use-course-creator";

const CourseCreator = () => {
  const [_, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const editCourseId = params.get('edit');
  
  const { toast } = useToast();
  const [publishedCourseId, setPublishedCourseId] = useState<number | null>(editCourseId ? parseInt(editCourseId) : null);
  const { 
    currentStep, 
    setCurrentStep, 
    courseOutline, 
    updateCourseInfo, 
    updateOutline,
    updateModuleContent,
    updateLessonTaxonomyLevel,
    reset,
    setCourseOutline
  } = useCourseCreator();
  
  // Fetch course data if we're editing an existing course
  const { data: existingCourse, isLoading: isLoadingCourse } = useQuery<CourseWithModulesAndLessons>({
    queryKey: ['/api/courses', editCourseId],
    enabled: !!editCourseId,
  });
  
  // Load existing course data
  useEffect(() => {
    if (existingCourse) {
      const mappedCourseOutline: CourseOutline = {
        course: {
          title: existingCourse.title,
          description: existingCourse.description || '',
          coverImage: existingCourse.coverImage || undefined,
        },
        modules: existingCourse.modules.map(module => ({
          id: module.id,
          title: module.title,
          description: module.description || undefined,
          order: module.order,
          lessons: module.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            content: lesson.content || undefined,
            order: lesson.order,
            duration: lesson.duration || undefined,
            taxonomyLevel: lesson.taxonomyLevel && 
              bloomsTaxonomyLevels.includes(lesson.taxonomyLevel as any) 
                ? lesson.taxonomyLevel as BloomsTaxonomyLevel 
                : undefined,
          }))
        }))
      };
      
      setCourseOutline(mappedCourseOutline);
    }
  }, [existingCourse, setCourseOutline]);

  const saveMutation = useMutation({
    mutationFn: async (data: CourseOutline) => {
      const response = await apiRequest("POST", "/api/courses", data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Course saved",
        description: "Your course has been saved successfully",
      });
      if (data.id) {
        setPublishedCourseId(data.id);
        
        // Only redirect if not in publish step
        if (currentStep !== "publish") {
          setLocation(`/courses/${data.id}`);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error saving course",
        description: error.message || "There was an error saving your course",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    saveMutation.mutate(courseOutline);
  };

  const handleNextStep = () => {
    const steps: CourseCreationStep[] = ["info", "outline", "content", "publish"];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePreviousStep = () => {
    const steps: CourseCreationStep[] = ["info", "outline", "content", "publish"];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Dashboard Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Course Creator
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create professional courses with AI assistance in minutes
          </p>
        </div>
      </div>

      {/* Creation Process Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          {/* Progress Indicator */}
          <div className="mb-8">
            <ProgressSteps 
              steps={[
                { id: "info", title: "Course Info" },
                { id: "outline", title: "Outline" },
                { id: "content", title: "Content" },
                { id: "publish", title: "Publish" }
              ]}
              currentStep={currentStep} 
            />
          </div>

          {/* Step Content */}
          <div className="mt-6">
            {currentStep === "info" && (
              <CourseInfoForm 
                initialValues={courseOutline.course}
                onSubmit={updateCourseInfo}
              />
            )}

            {currentStep === "outline" && (
              <CourseOutlineBuilder 
                courseInfo={courseOutline.course}
                modules={courseOutline.modules}
                onUpdateOutline={updateOutline}
              />
            )}

            {currentStep === "content" && (
              <CourseContentEditor
                courseOutline={courseOutline}
                onUpdateModuleContent={updateModuleContent}
                onUpdateLessonTaxonomyLevel={updateLessonTaxonomyLevel}
              />
            )}

            {currentStep === "publish" && (
              <CoursePublish
                courseOutline={courseOutline}
                courseId={publishedCourseId}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between">
            {currentStep !== "info" ? (
              <Button
                variant="outline"
                onClick={handlePreviousStep}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </Button>
            ) : (
              <div></div>
            )}
            <div>
              <Button
                variant="outline"
                className="mr-3"
                onClick={handleSaveDraft}
                disabled={saveMutation.isPending}
              >
                Save Draft
              </Button>
              {currentStep !== "publish" ? (
                <Button
                  onClick={handleNextStep}
                >
                  Continue
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Button>
              ) : (
                <Button
                  onClick={handleSaveDraft}
                  disabled={saveMutation.isPending}
                >
                  Publish Course
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CourseCreator;
