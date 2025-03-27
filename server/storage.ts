import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  modules, type Module, type InsertModule,
  lessons, type Lesson, type InsertLesson,
  enrollments, type Enrollment, type InsertEnrollment,
  type CourseWithModulesAndLessons,
  type CourseWithEnrollment
} from "@shared/schema";

// Storage interface to handle all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  getPublishedCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;
  getCourseWithModulesAndLessons(courseId: number): Promise<CourseWithModulesAndLessons | undefined>;
  getCoursesWithEnrollment(userId: number): Promise<CourseWithEnrollment[]>;
  getCourseWithEnrollment(courseId: number, userId: number): Promise<CourseWithEnrollment | undefined>;
  
  // Module operations
  getModule(id: number): Promise<Module | undefined>;
  getModulesByCourseId(courseId: number): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, module: Partial<Module>): Promise<Module>;
  deleteModule(id: number): Promise<void>;
  
  // Lesson operations
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonsByModuleId(moduleId: number): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<Lesson>): Promise<Lesson>;
  deleteLesson(id: number): Promise<void>;
  
  // Enrollment operations
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentByUserAndCourse(userId: number, courseId: number): Promise<Enrollment | undefined>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  getEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment>;
  deleteEnrollment(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private modules: Map<number, Module>;
  private lessons: Map<number, Lesson>;
  private enrollments: Map<number, Enrollment>;
  
  private userIdCounter: number;
  private courseIdCounter: number;
  private moduleIdCounter: number;
  private lessonIdCounter: number;
  private enrollmentIdCounter: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.modules = new Map();
    this.lessons = new Map();
    this.enrollments = new Map();
    
    this.userIdCounter = 1;
    this.courseIdCounter = 1;
    this.moduleIdCounter = 1;
    this.lessonIdCounter = 1;
    this.enrollmentIdCounter = 1;
    
    // Add sample user
    this.createUser({
      username: "demo",
      password: "password"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      displayName: insertUser.displayName || null,
      email: insertUser.email || null,
      role: insertUser.role || "student"
    };
    this.users.set(id, user);
    return user;
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseIdCounter++;
    const now = new Date();
    const course: Course = {
      id,
      title: insertCourse.title,
      description: insertCourse.description,
      userId: insertCourse.userId,
      status: insertCourse.status || "draft",
      coverImage: insertCourse.coverImage || null,
      createdAt: now,
      updatedAt: now
    };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: number, courseUpdate: Partial<Course>): Promise<Course> {
    const existingCourse = this.courses.get(id);
    if (!existingCourse) {
      throw new Error(`Course with ID ${id} not found`);
    }

    const updatedCourse: Course = {
      ...existingCourse,
      ...courseUpdate,
      id, // Ensure ID isn't changed
      updatedAt: new Date()
    };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<void> {
    // First, get all modules for this course
    const courseModules = await this.getModulesByCourseId(id);
    
    // Delete all lessons belonging to each module
    for (const module of courseModules) {
      const moduleLessons = await this.getLessonsByModuleId(module.id);
      for (const lesson of moduleLessons) {
        await this.deleteLesson(lesson.id);
      }
      
      // Delete the module
      await this.deleteModule(module.id);
    }
    
    // Finally, delete the course
    this.courses.delete(id);
  }

  async getCourseWithModulesAndLessons(courseId: number): Promise<CourseWithModulesAndLessons | undefined> {
    const course = await this.getCourse(courseId);
    if (!course) return undefined;

    const courseModules = await this.getModulesByCourseId(courseId);
    
    const modulesWithLessons = await Promise.all(
      courseModules.map(async (module) => {
        const moduleLessons = await this.getLessonsByModuleId(module.id);
        return {
          ...module,
          lessons: moduleLessons.sort((a, b) => a.order - b.order)
        };
      })
    );

    return {
      ...course,
      modules: modulesWithLessons.sort((a, b) => a.order - b.order)
    };
  }

  // Module operations
  async getModule(id: number): Promise<Module | undefined> {
    return this.modules.get(id);
  }

  async getModulesByCourseId(courseId: number): Promise<Module[]> {
    return Array.from(this.modules.values()).filter(
      (module) => module.courseId === courseId
    );
  }

  async createModule(insertModule: InsertModule): Promise<Module> {
    const id = this.moduleIdCounter++;
    const module: Module = {
      id,
      title: insertModule.title,
      description: insertModule.description || null,
      order: insertModule.order,
      courseId: insertModule.courseId
    };
    this.modules.set(id, module);
    return module;
  }

  async updateModule(id: number, moduleUpdate: Partial<Module>): Promise<Module> {
    const existingModule = this.modules.get(id);
    if (!existingModule) {
      throw new Error(`Module with ID ${id} not found`);
    }

    const updatedModule: Module = {
      ...existingModule,
      ...moduleUpdate,
      id // Ensure ID isn't changed
    };
    this.modules.set(id, updatedModule);
    return updatedModule;
  }

  async deleteModule(id: number): Promise<void> {
    this.modules.delete(id);
  }

  // Lesson operations
  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async getLessonsByModuleId(moduleId: number): Promise<Lesson[]> {
    return Array.from(this.lessons.values()).filter(
      (lesson) => lesson.moduleId === moduleId
    );
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const id = this.lessonIdCounter++;
    const lesson: Lesson = {
      id,
      title: insertLesson.title,
      content: insertLesson.content || null,
      order: insertLesson.order,
      moduleId: insertLesson.moduleId,
      duration: insertLesson.duration || null,
      taxonomyLevel: insertLesson.taxonomyLevel || "understand"
    };
    this.lessons.set(id, lesson);
    return lesson;
  }

  async updateLesson(id: number, lessonUpdate: Partial<Lesson>): Promise<Lesson> {
    const existingLesson = this.lessons.get(id);
    if (!existingLesson) {
      throw new Error(`Lesson with ID ${id} not found`);
    }

    // Explicitly handle all fields to ensure proper typing
    const updatedLesson: Lesson = {
      id, // Ensure ID isn't changed
      title: lessonUpdate.title || existingLesson.title,
      content: lessonUpdate.content !== undefined ? lessonUpdate.content : existingLesson.content,
      order: lessonUpdate.order || existingLesson.order,
      moduleId: lessonUpdate.moduleId || existingLesson.moduleId,
      duration: lessonUpdate.duration !== undefined ? lessonUpdate.duration : existingLesson.duration,
      taxonomyLevel: lessonUpdate.taxonomyLevel || existingLesson.taxonomyLevel
    };
    this.lessons.set(id, updatedLesson);
    return updatedLesson;
  }

  async deleteLesson(id: number): Promise<void> {
    this.lessons.delete(id);
  }

  // Implementation of getPublishedCourses method
  async getPublishedCourses(): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      (course) => course.status === "published"
    );
  }

  // Implementation of getCoursesWithEnrollment method
  async getCoursesWithEnrollment(userId: number): Promise<CourseWithEnrollment[]> {
    const courses = await this.getAllCourses();
    const userEnrollments = await this.getEnrollmentsByUser(userId);
    
    return courses.map(course => {
      const enrollment = userEnrollments.find(e => e.courseId === course.id);
      return {
        ...course,
        isEnrolled: !!enrollment,
        enrollment: enrollment
      };
    });
  }

  // Implementation of getCourseWithEnrollment method
  async getCourseWithEnrollment(courseId: number, userId: number): Promise<CourseWithEnrollment | undefined> {
    const course = await this.getCourse(courseId);
    if (!course) return undefined;
    
    const enrollment = await this.getEnrollmentByUserAndCourse(userId, courseId);
    
    return {
      ...course,
      isEnrolled: !!enrollment,
      enrollment: enrollment
    };
  }

  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }

  async getEnrollmentByUserAndCourse(userId: number, courseId: number): Promise<Enrollment | undefined> {
    return Array.from(this.enrollments.values()).find(
      enrollment => enrollment.userId === userId && enrollment.courseId === courseId
    );
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      enrollment => enrollment.courseId === courseId
    );
  }

  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      enrollment => enrollment.userId === userId
    );
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentIdCounter++;
    const now = new Date();
    
    const enrollment: Enrollment = {
      id,
      userId: insertEnrollment.userId,
      courseId: insertEnrollment.courseId,
      status: insertEnrollment.status || "enrolled",
      progress: insertEnrollment.progress || 0,
      enrolledAt: now,
      lastAccessedAt: now,
      completedAt: null
    };
    
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  async updateEnrollment(id: number, enrollmentUpdate: Partial<Enrollment>): Promise<Enrollment> {
    const existingEnrollment = this.enrollments.get(id);
    if (!existingEnrollment) {
      throw new Error(`Enrollment with ID ${id} not found`);
    }

    // Update last accessed timestamp
    const now = new Date();
    
    const updatedEnrollment: Enrollment = {
      ...existingEnrollment,
      ...enrollmentUpdate,
      id, // Ensure ID isn't changed
      lastAccessedAt: now
    };
    
    // If status is being updated to "completed", set completedAt
    if (enrollmentUpdate.status === "completed" && existingEnrollment.status !== "completed") {
      updatedEnrollment.completedAt = now;
    }
    
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  async deleteEnrollment(id: number): Promise<void> {
    this.enrollments.delete(id);
  }
}

export const storage = new MemStorage();
