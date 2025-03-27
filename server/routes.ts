import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertCourseSchema,
  insertModuleSchema,
  insertLessonSchema,
  insertEnrollmentSchema,
  type CourseOutline,
  type CourseWithEnrollment,
  type Enrollment
} from "@shared/schema";
// Using OpenAI implementation for reliable AI model access (fallback to Hugging Face if needed)
import { generateCourseOutline, generateLessonContent, improveContent, generateContentSuggestions, generateAssessmentQuestions } from "./lib/openai";
// Alternative implementation
// import { generateCourseOutline as hfGenerateCourseOutline, generateLessonContent as hfGenerateLessonContent, improveContent as hfImproveContent, generateContentSuggestions as hfGenerateContentSuggestions, generateAssessmentQuestions as hfGenerateAssessmentQuestions } from "./lib/huggingface";
import { exportCourse, ExportFormat } from "./lib/course-exporter";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for course management
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }

      const course = await storage.getCourseWithModulesAndLessons(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const courseOutline = req.body as CourseOutline;
      
      // Create the course first
      const courseData = {
        userId: 1, // Mock user ID for now
        title: courseOutline.course.title,
        description: courseOutline.course.description,
        coverImage: courseOutline.course.coverImage,
        status: "draft"
      };

      // Validate course data
      const validatedCourseData = insertCourseSchema.parse(courseData);
      const course = await storage.createCourse(validatedCourseData);

      // Create modules and lessons
      for (const moduleData of courseOutline.modules) {
        const validatedModuleData = insertModuleSchema.parse({
          courseId: course.id,
          title: moduleData.title,
          description: moduleData.description || "",
          order: moduleData.order
        });

        const createdModule = await storage.createModule(validatedModuleData);

        // Create lessons for this module
        for (const lessonData of moduleData.lessons) {
          const validatedLessonData = insertLessonSchema.parse({
            moduleId: createdModule.id,
            title: lessonData.title,
            content: lessonData.content || "",
            order: lessonData.order,
            duration: lessonData.duration || 0,
            taxonomyLevel: lessonData.taxonomyLevel || "remember" // Add Bloom's Taxonomy level
          });

          await storage.createLesson(validatedLessonData);
        }
      }

      const completeCourse = await storage.getCourseWithModulesAndLessons(course.id);
      res.status(201).json(completeCourse);
    } catch (error) {
      console.error("Error creating course:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.patch("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }

      const existingCourse = await storage.getCourse(courseId);
      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      const updatedCourse = await storage.updateCourse(courseId, {
        ...req.body,
        id: courseId
      });

      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }

      await storage.deleteCourse(courseId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });
  
  // Course preview route
app.get("/course/:id/preview", async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    if (isNaN(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }
    
    const course = await storage.getCourseWithModulesAndLessons(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Return the preview template
    res.sendFile('preview.html', { root: './server/templates' });
  } catch (error) {
    console.error("Error serving preview:", error);
    res.status(500).json({ message: "Failed to serve preview" });
  }
});

// API preview endpoint
app.get("/api/courses/:id/preview", async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    if (isNaN(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }
    
    const course = await storage.getCourseWithModulesAndLessons(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Return preview data
    res.json({
      course,
      previewMode: true
    });
  } catch (error) {
    console.error("Error generating preview:", error);
    res.status(500).json({ message: "Failed to generate preview" });
  }
});

app.get("/api/courses/:id/export", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      // Get the format from query parameter, default to PDF
      const format = (req.query.format as ExportFormat) || "pdf";
      
      // Validate the format
      if (!["pdf", "scorm", "xapi"].includes(format)) {
        return res.status(400).json({ 
          message: "Invalid export format. Supported formats are: pdf, scorm, xapi" 
        });
      }
      
      // Get the course with all modules and lessons
      const course = await storage.getCourseWithModulesAndLessons(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Generate the export
      const result = await exportCourse(course, format);
      
      // Set headers for file download
      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      
      // Send the file
      res.send(result.buffer);
    } catch (error) {
      console.error(`Error exporting course:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ 
        message: `Failed to export course. ${errorMessage}` 
      });
    }
  });

  // API routes for AI integration (using Hugging Face API)
  app.post("/api/ai/generate-outline", async (req, res) => {
    try {
      const { subject, style } = req.body;
      if (!subject) {
        return res.status(400).json({ message: "Subject is required" });
      }

      console.log(`Received request to generate course outline for subject: "${subject}" with style: ${style || 'comprehensive'}`);

      // Use specific prompt template for outline generation with clear ordering instructions
      const prompt = `Create a beginner-to-advanced course outline for ${subject}. Start with an introduction module, then fundamentals module, followed by intermediate concepts, then advanced techniques, and finally practical applications and mastery. Each module should progressively introduce more complex topics. Include practical exercises and assessments for every module.`;
      
      console.log(`Using prompt for course outline: "${prompt}"`);
      
      const result = await generateCourseOutline(prompt, style);
      
      console.log(`Successfully generated course outline with ${result.modules.length} modules and suggestions: ${result.suggestions?.length || 0}`);
      
      // Transform the result to match the expected format for client-side processing
      const transformedResult = {
        outline: {
          modules: result.modules,
        },
        suggestions: result.suggestions || []
      };
      
      res.json(transformedResult);
    } catch (error) {
      console.error("Error generating outline:", error);
      res.status(500).json({ message: "Failed to generate outline" });
    }
  });

  // Keep old endpoints for backward compatibility
  app.post("/api/openai/generate-outline", async (req, res) => {
    const { subject, style } = req.body;
    if (!subject) {
      return res.status(400).json({ message: "Subject is required" });
    }
    try {
      // Use specific prompt template for outline generation with clear ordering instructions
      const prompt = `Create a beginner-to-advanced course outline for ${subject}. Start with an introduction module, then fundamentals module, followed by intermediate concepts, then advanced techniques, and finally practical applications and mastery. Each module should progressively introduce more complex topics. Include practical exercises and assessments for every module.`;
      
      const result = await generateCourseOutline(prompt, style);
      
      // Transform the result to match the expected format for client-side processing
      const transformedResult = {
        outline: {
          modules: result.modules,
        },
        suggestions: result.suggestions || []
      };
      
      res.json(transformedResult);
    } catch (error) {
      console.error("Error generating outline:", error);
      res.status(500).json({ message: "Failed to generate outline" });
    }
  });

  // Add new endpoint for course description generation
  app.post("/api/ai/generate-description", async (req, res) => {
    try {
      const { subject } = req.body;
      if (!subject) {
        return res.status(400).json({ message: "Subject is required" });
      }

      // Use specific prompt template for description generation, emphasizing conciseness
      const prompt = `Write a SINGLE PARAGRAPH, concise and specific course description for a ${subject} course. 
      Keep it under 150 words. 
      Clearly state the target audience, specific learning goals, and concrete skills students will gain.
      Be direct and avoid vague language or excessive adjectives.`;
      
      // Use the improveContent function to get a standalone description
      const result = await improveContent("", prompt);
      
      if (result && result.content) {
        res.json({ description: result.content });
      } else {
        res.status(500).json({ message: "Failed to generate description" });
      }
    } catch (error) {
      console.error("Error generating description:", error);
      res.status(500).json({ message: "Failed to generate description" });
    }
  });
  
  // Add new endpoint for assessment questions
  app.post("/api/ai/generate-assessment", async (req, res) => {
    try {
      const { subject, count = 5 } = req.body;
      if (!subject) {
        return res.status(400).json({ message: "Subject is required" });
      }

      console.log(`Received request to generate assessment questions for: ${subject}, count: ${count}`);
      
      // Use the dedicated assessment function
      const questions = await generateAssessmentQuestions(subject, count);
      
      console.log(`Generated ${questions.length} assessment questions successfully`);
      
      res.json({
        content: `<h2>Assessment Questions for ${subject}</h2>`,
        questions: questions
      });
    } catch (error) {
      console.error("Error generating assessment questions:", error);
      res.status(500).json({ message: "Failed to generate assessment questions" });
    }
  });
  
  app.post("/api/ai/generate-lesson", async (req, res) => {
    try {
      const { lessonTitle, moduleTitle, courseContext, subject, moduleNumber } = req.body;
      if (!lessonTitle || !moduleTitle) {
        return res.status(400).json({ message: "Lesson title and module title are required" });
      }
      
      console.log(`Received request to generate lesson content for: "${lessonTitle}" in module "${moduleTitle}"`);
      
      // Using course context as the course title for better AI prompting
      const courseTitle = subject || courseContext || '';
      
      // Call the generateLessonContent with all parameters
      const result = await generateLessonContent(
        lessonTitle, 
        moduleTitle, 
        courseTitle,
        moduleNumber || '1'
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error generating lesson content:", error);
      res.status(500).json({ message: "Failed to generate lesson content" });
    }
  });

  // Keep old endpoints for backward compatibility
  app.post("/api/openai/generate-lesson", async (req, res) => {
    try {
      const { lessonTitle, moduleTitle, courseContext } = req.body;
      if (!lessonTitle || !moduleTitle) {
        return res.status(400).json({ message: "Lesson title and module title are required" });
      }

      const result = await generateLessonContent(lessonTitle, moduleTitle, courseContext);
      res.json(result);
    } catch (error) {
      console.error("Error generating lesson content:", error);
      res.status(500).json({ message: "Failed to generate lesson content" });
    }
  });

  app.post("/api/ai/improve-content", async (req, res) => {
    try {
      const { content, instructions } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const result = await improveContent(content, instructions);
      res.json(result);
    } catch (error) {
      console.error("Error improving content:", error);
      res.status(500).json({ message: "Failed to improve content" });
    }
  });

  // Keep old endpoints for backward compatibility
  app.post("/api/openai/improve-content", async (req, res) => {
    try {
      const { content, instructions } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const result = await improveContent(content, instructions);
      res.json(result);
    } catch (error) {
      console.error("Error improving content:", error);
      res.status(500).json({ message: "Failed to improve content" });
    }
  });

  app.post("/api/ai/content-suggestions", async (req, res) => {
    try {
      const { courseTitle, courseDescription } = req.body;
      if (!courseTitle) {
        return res.status(400).json({ message: "Course title is required" });
      }

      const result = await generateContentSuggestions(courseTitle, courseDescription);
      res.json(result);
    } catch (error) {
      console.error("Error generating content suggestions:", error);
      res.status(500).json({ message: "Failed to generate content suggestions" });
    }
  });

  // Keep old endpoints for backward compatibility
  app.post("/api/openai/content-suggestions", async (req, res) => {
    try {
      const { courseTitle, courseDescription } = req.body;
      if (!courseTitle) {
        return res.status(400).json({ message: "Course title is required" });
      }

      const result = await generateContentSuggestions(courseTitle, courseDescription);
      res.json(result);
    } catch (error) {
      console.error("Error generating content suggestions:", error);
      res.status(500).json({ message: "Failed to generate content suggestions" });
    }
  });

  // Enrollment endpoints
  // GET all published courses for catalog view
  app.get("/api/catalog", async (req, res) => {
    try {
      const courses = await storage.getPublishedCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching published courses:", error);
      res.status(500).json({ message: "Failed to fetch published courses" });
    }
  });
  
  // GET course with enrollment status for a user
  app.get("/api/courses/:id/enrollment", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      // For now, using a fixed user ID of 1
      const userId = 1;
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      const courseWithEnrollment = await storage.getCourseWithEnrollment(courseId, userId);
      if (!courseWithEnrollment) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(courseWithEnrollment);
    } catch (error) {
      console.error("Error fetching course enrollment:", error);
      res.status(500).json({ message: "Failed to fetch course enrollment" });
    }
  });
  
  // GET all enrollments for a user
  app.get("/api/enrollments", async (req, res) => {
    try {
      // For now, using a fixed user ID of 1
      const userId = 1;
      
      const enrollments = await storage.getEnrollmentsByUser(userId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  
  // GET all courses with enrollment status for a user
  app.get("/api/courses/with-enrollment", async (req, res) => {
    try {
      // For now, using a fixed user ID of 1
      const userId = 1;
      
      // First, ensure the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        // Create a mock user if needed
        await storage.createUser({
          username: "demo",
          email: "demo@example.com",
          password: "demo123",
          role: "student"
        });
      }
      
      const coursesWithEnrollment = await storage.getCoursesWithEnrollment(userId);
      res.json(coursesWithEnrollment);
    } catch (error) {
      console.error("Error fetching courses with enrollment:", error);
      res.status(500).json({ message: "Failed to fetch courses with enrollment" });
    }
  });
  
  // POST to enroll in a course
  app.post("/api/courses/:id/enroll", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      // For now, using a fixed user ID of 1
      const userId = 1;
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      // First, ensure the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        // Create a mock user if needed
        await storage.createUser({
          username: "demo",
          email: "demo@example.com",
          password: "demo123",
          role: "student"
        });
      }
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user is already enrolled
      const existingEnrollment = await storage.getEnrollmentByUserAndCourse(userId, courseId);
      if (existingEnrollment) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }
      
      // Create new enrollment
      const enrollmentData = {
        userId,
        courseId,
        status: "enrolled",
        progress: 0
      };
      
      const validatedEnrollmentData = insertEnrollmentSchema.parse(enrollmentData);
      const enrollment = await storage.createEnrollment(validatedEnrollmentData);
      
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });
  
  // PATCH to update enrollment status
  app.patch("/api/enrollments/:id", async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      
      if (isNaN(enrollmentId)) {
        return res.status(400).json({ message: "Invalid enrollment ID" });
      }
      
      // Check if enrollment exists
      const existingEnrollment = await storage.getEnrollment(enrollmentId);
      if (!existingEnrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      // Update enrollment
      const updatedEnrollment = await storage.updateEnrollment(enrollmentId, req.body);
      
      res.json(updatedEnrollment);
    } catch (error) {
      console.error("Error updating enrollment:", error);
      res.status(500).json({ message: "Failed to update enrollment" });
    }
  });
  
  // DELETE to unenroll from a course
  app.delete("/api/enrollments/:id", async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      
      if (isNaN(enrollmentId)) {
        return res.status(400).json({ message: "Invalid enrollment ID" });
      }
      
      // Check if enrollment exists
      const existingEnrollment = await storage.getEnrollment(enrollmentId);
      if (!existingEnrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      // Delete enrollment
      await storage.deleteEnrollment(enrollmentId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      res.status(500).json({ message: "Failed to delete enrollment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
