import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CourseOutline } from "@shared/schema";
import { 
  CheckCircle2Icon, 
  AlertCircleIcon,
  ClipboardCheckIcon,
  BookOpenIcon,
  CheckIcon,
  XIcon
} from "lucide-react";
import CourseExport from "./course-export";

type CoursePublishProps = {
  courseOutline: CourseOutline;
  courseId?: number | null;
};

const CoursePublish = ({ courseOutline, courseId }: CoursePublishProps) => {
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("draft");
  
  // Calculate course completeness
  const totalLessons = courseOutline.modules.reduce(
    (total, module) => total + module.lessons.length, 
    0
  );
  
  const lessonsWithContent = courseOutline.modules.reduce(
    (total, module) => total + module.lessons.filter(lesson => lesson.content).length, 
    0
  );
  
  const completionPercentage = totalLessons > 0 
    ? Math.round((lessonsWithContent / totalLessons) * 100) 
    : 0;
  
  const isReadyToPublish = completionPercentage === 100 && 
    courseOutline.course.title.length > 0 && 
    courseOutline.course.description.length > 0 &&
    courseOutline.modules.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Course Summary</h3>
            
            <div className="mb-6">
              <h4 className="font-medium mb-2">{courseOutline.course.title}</h4>
              <p className="text-sm text-gray-500">{courseOutline.course.description}</p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Course Completion</span>
                <span className="text-sm font-medium">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium mb-2">Course Structure</h4>
              {courseOutline.modules.map((module, moduleIndex) => (
                <div key={moduleIndex} className="border border-gray-200 rounded-md">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-t-md">
                    <h5 className="font-medium text-sm">{module.title}</h5>
                    <span className="text-xs text-gray-500">
                      {module.lessons.filter(l => l.content).length}/{module.lessons.length} lessons completed
                    </span>
                  </div>
                  <div className="p-3">
                    <ul className="space-y-2">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <li key={lessonIndex} className="flex items-center justify-between text-sm">
                          <span className="truncate">{lesson.title}</span>
                          {lesson.content ? (
                            <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircleIcon className="h-4 w-4 text-amber-500" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Publish Settings</h3>
            
            <div className="mb-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <ClipboardCheckIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Course Readiness</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Check if your course meets all requirements for publishing
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 pl-12">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Course has a title and description</span>
                  {courseOutline.course.title.length > 0 && courseOutline.course.description.length > 0 ? (
                    <CheckIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <XIcon className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Course has at least one module</span>
                  {courseOutline.modules.length > 0 ? (
                    <CheckIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <XIcon className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">All lessons have content</span>
                  {completionPercentage === 100 ? (
                    <CheckIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <XIcon className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <BookOpenIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Course Details</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Key information about your course
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 pl-12">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total modules</span>
                  <span className="text-sm font-medium">{courseOutline.modules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total lessons</span>
                  <span className="text-sm font-medium">{totalLessons}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="text-sm font-medium capitalize">{publishStatus}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                className="w-full" 
                disabled={!isReadyToPublish}
                onClick={() => setPublishStatus("published")}
              >
                Publish Course
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                {isReadyToPublish 
                  ? "Your course is ready to be published!"
                  : "Please complete all sections before publishing."}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Preview</h3>
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden mb-4">
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Course cover image preview</p>
                </div>
              </div>
            </div>
            <Button 
  variant="outline" 
  className="w-full"
  onClick={() => {
    // Open preview in new tab before export
    if (courseId) {
      window.open(`/api/courses/${courseId}/preview`, '_blank');
    }
  }}
>
  Preview Course
</Button>
          </CardContent>
        </Card>
        
        {/* Only show export options if the course is published and has an ID */}
        {publishStatus === "published" && courseId && (
          <div className="mt-6">
            <CourseExport courseId={courseId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePublish;
