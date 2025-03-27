import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeftIcon, EditIcon, Trash2Icon, Download } from "lucide-react";
import { type CourseWithModulesAndLessons } from "@shared/schema";
import CourseExport from "@/components/course/course-export";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CourseDetail = () => {
  const [match, params] = useRoute("/courses/:id");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: course, isLoading } = useQuery<CourseWithModulesAndLessons>({
    queryKey: ['/api/courses', params?.id],
    enabled: !!params?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/courses/${params?.id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Course deleted",
        description: "Your course has been deleted successfully",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error deleting course",
        description: error.message || "There was an error deleting your course",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const getTotalLessons = () => {
    if (!course?.modules) return 0;
    return course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  };

  const getTotalDuration = () => {
    if (!course?.modules) return 0;
    return course.modules.reduce((acc, module) => {
      return acc + module.lessons.reduce((lacc, lesson) => lacc + (lesson.duration || 0), 0);
    }, 0);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}hrs ${mins}min`;
  };

  if (!match) {
    return null;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course?.title}</h1>
              <p className="mt-1 text-sm text-gray-500">{course?.description}</p>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className="inline-flex items-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  {course?.modules?.length || 0} modules
                </span>
                <span className="inline-flex items-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {getTotalLessons()} lessons
                </span>
                <span className="inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {formatDuration(getTotalDuration())}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const tabsElement = document.querySelector('[role="tablist"]');
                  const exportTab = tabsElement?.querySelector('[value="export"]') as HTMLElement;
                  if (exportTab) {
                    exportTab.click(); // Programmatically click the export tab
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation(`/courses/create?edit=${params?.id}`)}
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this course and all its content. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-6">
              {isLoading ? (
                <div className="space-y-6">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-md">
                      <div className="p-4 bg-gray-50 rounded-t-md">
                        <Skeleton className="h-6 w-48" />
                      </div>
                      <div className="p-4 border-t border-gray-200">
                        <div className="space-y-3">
                          {Array(3).fill(0).map((_, j) => (
                            <div key={j} className="flex justify-between items-center">
                              <Skeleton className="h-5 w-36" />
                              <div className="flex space-x-2">
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : course?.modules?.length ? (
                <div className="space-y-4">
                  {course.modules.map((module) => (
                    <div key={module.id} className="border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 rounded-t-md">
                        <div className="flex items-center space-x-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <h4 className="font-medium text-gray-900">{module.title}</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-gray-400 hover:text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="p-4 border-t border-gray-200">
                        <ul className="space-y-3">
                          {module.lessons.map((lesson) => (
                            <li key={lesson.id} className="flex items-center justify-between py-2 pl-3 pr-2 text-sm rounded-md hover:bg-gray-50">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                </svg>
                                <span>{lesson.title}</span>
                              </div>
                              <div className="flex space-x-2">
                                <button className="text-gray-400 hover:text-gray-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                                <button className="text-gray-400 hover:text-gray-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="text-center p-6">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium">No content found</h3>
                    <p className="text-gray-500 mt-2">This course doesn't have any modules or lessons yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="preview">
              <div className="bg-white p-6 rounded-lg">
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden mb-4">
                  {course?.coverImage ? (
                    <img 
                      src={course.coverImage} 
                      alt={course.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">No cover image available</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">{course?.title}</h4>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>
                      {course?.modules?.length || 0} modules • {getTotalLessons()} lessons • {formatDuration(getTotalDuration())}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>{course?.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    Preview Course
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="export">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Export Course</h3>
                  <p className="text-sm text-gray-500">
                    Export your course in various formats for use in Learning Management Systems (LMS) or as standalone content.
                  </p>
                </div>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : course?.id ? (
                  <CourseExport courseId={course.id} />
                ) : (
                  <Card className="text-center p-6">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-medium">Course Not Found</h3>
                      <p className="text-gray-500 mt-2">The course ID is required for exporting</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="settings">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Course Settings</h3>
                  <p className="text-sm text-gray-500">Configure course visibility, access, and other settings.</p>
                </div>
                <Card className="text-center p-6">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium">Settings Coming Soon</h3>
                    <p className="text-gray-500 mt-2">Advanced course settings will be available in a future update</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
};

export default CourseDetail;
