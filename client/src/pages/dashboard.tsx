import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseCard from "@/components/course/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { type Course, type CourseWithEnrollment } from "@shared/schema";
import { PlusIcon, BookOpen, CheckCircleIcon } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("all");

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });
  
  // Fetch courses with enrollment status
  const { data: enrolledCourses, isLoading: isLoadingEnrolled } = useQuery<CourseWithEnrollment[]>({
    queryKey: ['/api/courses/with-enrollment'],
  });

  // Filter courses based on active tab
  const filteredCourses = courses?.filter(course => {
    if (activeTab === "all") return true;
    if (activeTab === "published") return course.status === "published";
    if (activeTab === "drafts") return course.status === "draft";
    return true;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Dashboard Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your courses and create new content
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link href="/courses/create">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Course Tabs */}
      <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Courses</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="p-0">
                    <Skeleton className="h-40 w-full rounded-t-lg" />
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium">No courses found</h3>
                <p className="text-gray-500 mt-2">Create your first course to get started</p>
                <Link href="/courses/create">
                  <Button className="mt-4">Create Course</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="published" className="mt-6">
          {!isLoading && (!filteredCourses || filteredCourses.length === 0) && (
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium">No published courses</h3>
                <p className="text-gray-500 mt-2">Publish a course to see it here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="drafts" className="mt-6">
          {!isLoading && (!filteredCourses || filteredCourses.length === 0) && (
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium">No draft courses</h3>
                <p className="text-gray-500 mt-2">Start creating a course to save drafts</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Enrolled Courses Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Enrolled Courses</h2>
          <Link href="/catalog">
            <Button variant="outline" size="sm">
              Browse Catalog
            </Button>
          </Link>
        </div>
        
        {isLoadingEnrolled ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-0">
                  <Skeleton className="h-40 w-full rounded-t-lg" />
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : enrolledCourses?.filter(course => course.isEnrolled)?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses
              .filter(course => course.isEnrolled)
              .map((course) => (
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
                    {course.enrollment && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white px-4 py-2 text-sm">
                        Progress: {course.enrollment.progress}%
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle>{course.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pb-2 flex-grow">
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {course.description}
                    </p>
                  </CardContent>
                  
                  <CardFooter>
                    <Link href={`/courses/${course.id}`}>
                      <Button className="w-full">
                        Continue Learning
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
          </div>
        ) : (
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium">No enrolled courses</h3>
              <p className="text-gray-500 mt-2">Explore the catalog to find courses to enroll in</p>
              <Link href="/catalog">
                <Button className="mt-4">Browse Catalog</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>
      
      {/* Recent Activity Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
