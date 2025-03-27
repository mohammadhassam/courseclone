import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, Check, Search, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Course, type CourseWithEnrollment } from "@shared/schema";

const CourseCatalog = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch published courses for the catalog
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['/api/catalog'],
  });

  // Fetch user's enrollments
  const { data: enrolledCourses, isLoading: isLoadingEnrolled } = useQuery<CourseWithEnrollment[]>({
    queryKey: ['/api/courses/with-enrollment'],
  });

  // Mutation for enrolling in a course
  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      return await apiRequest("POST", `/api/courses/${courseId}/enroll`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/with-enrollment'] });
      toast({
        title: "Enrolled successfully",
        description: "You have been enrolled in the course",
      });
    },
    onError: (error) => {
      toast({
        title: "Error enrolling in course",
        description: error.message || "There was an error enrolling in the course",
        variant: "destructive",
      });
    },
  });

  // Filter courses based on search query and category filter
  const filteredCourses = courses?.filter(course => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Only include published courses in the catalog
    const isPublished = course.status === "published";

    // For now we don't have categories, so return all courses
    return matchesSearch && isPublished;
  });

  // Check if a course is already enrolled
  const isEnrolled = (courseId: number) => {
    return enrolledCourses?.some(course => 
      course.id === courseId && course.isEnrolled
    );
  };

  // Handle enrollment
  const handleEnroll = (courseId: number) => {
    enrollMutation.mutate(courseId);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Catalog Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
          Course Catalog
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Discover and enroll in courses to expand your knowledge
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="search"
            placeholder="Search courses..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs defaultValue="all" className="min-w-[200px]" onValueChange={setCategoryFilter}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="enrolled">Enrolled</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="h-40 w-full rounded-t-lg" />
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Skeleton className="h-10 w-full rounded-md" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredCourses?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden flex flex-col">
              <div className="h-40 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                {course.coverImage ? (
                  <img 
                    src={course.coverImage} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-white/70" />
                  </div>
                )}
                {isEnrolled(course.id) && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="flex items-center gap-1 bg-white">
                      <Check className="h-3 w-3" />
                      Enrolled
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>Instructor</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2 flex-grow">
                <p className="text-sm text-gray-500 line-clamp-3">
                  {course.description}
                </p>
              </CardContent>
              
              <CardFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setLocation(`/courses/${course.id}`)}
                >
                  View Details
                </Button>
                
                {isEnrolled(course.id) ? (
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={() => setLocation(`/courses/${course.id}`)}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrollMutation.isPending}
                  >
                    Enroll Now
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-md">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No courses found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery 
              ? `No courses match "${searchQuery}"`
              : "There are no courses available in the catalog at the moment."}
          </p>
        </div>
      )}
    </main>
  );
};

export default CourseCatalog;