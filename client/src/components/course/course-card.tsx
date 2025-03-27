import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Course } from "@shared/schema";

type CourseCardProps = {
  course: Course;
};

const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200">
        <CardHeader className="p-0">
          <div className="aspect-video bg-gray-100 relative">
            {course.coverImage ? (
              <img 
                src={course.coverImage} 
                alt={course.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                {course.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-medium text-lg truncate">{course.title}</h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{course.description}</p>
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0 flex justify-between">
          <div className="text-sm text-gray-500">
            {new Date(course.createdAt).toLocaleDateString()}
          </div>
          <div className="text-sm font-medium text-primary">View Details</div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default CourseCard;
