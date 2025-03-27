import { apiRequest } from "./queryClient";

// Standard prompt templates for different generation types
export const PROMPT_TEMPLATES = {
  outline: "Create a beginner-to-advanced course outline for {subject}. Each module should progressively introduce more complex topics. Include practical exercises and assessments for every module.",
  description: "Write a compelling course description for a {subject} course. It should include the target audience, learning goals, and what students will gain after completing the course.",
  moduleBreakdown: "Provide a detailed lesson plan for module {moduleNumber}: {moduleTitle} of a {subject} course.",
  assessment: "Generate 5 multiple-choice questions to assess knowledge in {subject}. Provide correct answers and explanations."
};

// Function to format a prompt template with provided variables
export function formatPrompt(template: string, variables: Record<string, string>): string {
  let formattedPrompt = template;
  for (const [key, value] of Object.entries(variables)) {
    formattedPrompt = formattedPrompt.replace(`{${key}}`, value);
  }
  return formattedPrompt;
}

// Function to call the server's AI proxy endpoint (DeepSeek API)
export async function generateCourseOutline(subject: string, style: string = "comprehensive") {
  try {
    // Send subject directly instead of formatted prompt
    const response = await apiRequest(
      "POST", 
      "/api/ai/generate-outline",
      { subject, style }
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error calling AI service:", error);
    throw error;
  }
}

// Function to generate a course description
export async function generateCourseDescription(subject: string) {
  try {
    // No need to format prompt here as the server handles it
    const response = await apiRequest(
      "POST", 
      "/api/ai/generate-description",
      { subject }
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error generating course description:", error);
    throw error;
  }
}

// Function to generate content for a lesson
export async function generateLessonContent(
  title: string, 
  moduleTitle: string, 
  courseContext: string,
  moduleNumber: string
) {
  try {
    // Pass parameters directly without using formatted prompt
    const response = await apiRequest(
      "POST", 
      "/api/ai/generate-lesson",
      { 
        lessonTitle: title, 
        moduleTitle,
        courseContext,
        moduleNumber,
        subject: courseContext // For backward compatibility
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error generating lesson content:", error);
    throw error;
  }
}

// Function to generate assessment questions
export async function generateAssessmentQuestions(subject: string, count: number = 5) {
  try {
    // Send subject directly instead of formatted prompt
    const response = await apiRequest(
      "POST", 
      "/api/ai/generate-assessment",
      { 
        subject,
        count
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error generating assessment questions:", error);
    throw error;
  }
}

// Function to improve or edit existing content
export async function improveContent(
  content: string,
  instructions: string
) {
  try {
    const response = await apiRequest(
      "POST", 
      "/api/ai/improve-content",
      { 
        content,
        instructions
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error improving content:", error);
    throw error;
  }
}

// Function to get content suggestions
export async function getContentSuggestions(courseTitle: string, courseDescription: string) {
  try {
    const response = await apiRequest(
      "POST", 
      "/api/ai/content-suggestions",
      { 
        courseTitle,
        courseDescription
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error getting content suggestions:", error);
    throw error;
  }
}
