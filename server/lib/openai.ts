import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "your-api-key" 
});

// Generate a course outline based on a prompt
export async function generateCourseOutline(prompt: string, style = "comprehensive"): Promise<{
  modules: {
    title: string;
    description?: string;
    order: number;
    lessons: {
      title: string;
      order: number;
      content?: string;
    }[];
  }[];
  suggestions: string[];
}> {
  try {
    const systemPrompt = `You are an expert curriculum designer specialized in creating high-quality educational course outlines. 
    Generate a course outline based on the user's request. The outline should include:
    
    1. A list of organized modules (5-8 modules)
    2. Each module should have a clear title and 3-5 lessons
    3. Each lesson should have a descriptive title
    4. Structure the output as a valid JSON with the following format:
    {
      "modules": [
        {
          "title": "Module Title",
          "description": "Brief description of this module",
          "order": <module-index>,
          "lessons": [
            {
              "title": "Lesson Title",
              "order": <lesson-index>
            }
          ]
        }
      ],
      "suggestions": [
        "Suggestion 1 for improving the course",
        "Suggestion 2 for improving the course",
        "Suggestion 3 for improving the course"
      ]
    }

    Style guide: "${style}". If style is "comprehensive", include more detailed descriptions and more lessons.
    If style is "brief", create a more concise outline with fewer lessons.
    If style is "advanced", focus on more complex topics assuming prior knowledge.
    If style is "beginner", focus on fundamentals and assume no prior knowledge.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error generating course outline:", error);
    throw new Error("Failed to generate course outline");
  }
}

// Generate content for a specific lesson
export async function generateLessonContent(
  lessonTitle: string, 
  moduleTitle: string, 
  courseContext: string,
  moduleNumber: string = "1"
): Promise<{
  content: string;
  suggestions: string[];
}> {
  try {
    const systemPrompt = `You are an expert educational content creator specialized in developing 
    engaging and informative lesson content. Generate comprehensive HTML content for a lesson
    following this prompt:
    
    Provide a detailed lesson plan for module ${moduleNumber}: ${moduleTitle} of a ${courseContext} course.
    
    Lesson Title: "${lessonTitle}"
    Module Title: "${moduleTitle}"
    Course Context: "${courseContext}"

    Your content should include:
    - A clear introduction explaining the topic
    - Main content with well-structured explanations
    - Examples or case studies where appropriate
    - Summary or key takeaways at the end
    
    Format the content as HTML with appropriate headers, paragraphs, lists, etc. 
    Keep the HTML simple and clean.

    Also provide 3 suggestions for enhancing this lesson.
    
    Structure your response as a JSON object with the following format:
    {
      "content": "<html content here>",
      "suggestions": [
        "Suggestion 1 for enhancing this lesson",
        "Suggestion 2 for enhancing this lesson",
        "Suggestion 3 for enhancing this lesson"
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate content for lesson "${lessonTitle}" in module "${moduleTitle}"` }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error generating lesson content:", error);
    throw new Error("Failed to generate lesson content");
  }
}

// Improve existing content based on user instructions
export async function improveContent(
  content: string,
  instructions: string = "Improve this content by making it more engaging, adding examples, and ensuring it's comprehensive."
): Promise<{
  content: string;
}> {
  try {
    const systemPrompt = `You are an expert educational content editor. Improve the provided content 
    based on the given instructions. Maintain the existing HTML structure but enhance the content.
    
    Instructions: ${instructions}
    
    Return the improved content in the following JSON format:
    {
      "content": "<improved html content here>"
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: content }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
}

// Generate content suggestions based on course title and description
export async function generateContentSuggestions(
  courseTitle: string,
  courseDescription: string = ""
): Promise<{
  suggestions: string[];
}> {
  try {
    const systemPrompt = `You are an expert curriculum consultant specializing in educational content. 
    Based on the course title and description provided, generate helpful content suggestions that would enhance the course.
    
    Course Title: "${courseTitle}"
    Course Description: "${courseDescription}"
    
    Provide suggestions about:
    - Topics that should be covered
    - Interesting activities or examples to include
    - Assessment methods
    - Additional resources
    
    Return your suggestions in the following JSON format:
    {
      "suggestions": [
        "Suggestion 1 with specific advice",
        "Suggestion 2 with specific advice",
        "Suggestion 3 with specific advice",
        "Suggestion 4 with specific advice",
        "Suggestion 5 with specific advice"
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate content suggestions for course "${courseTitle}"` }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error generating content suggestions:", error);
    throw new Error("Failed to generate content suggestions");
  }
}

// Generate assessment questions for a subject
export async function generateAssessmentQuestions(
  subject: string,
  count: number = 5
): Promise<{
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  feedback?: string;
}[]> {
  try {
    const systemPrompt = `You are an expert assessment designer specialized in creating 
    high-quality quiz questions for educational courses. Generate ${count} quiz questions 
    for the subject "${subject}".

    Create a mix of question types:
    - Multiple choice (with 4 options)
    - True/False
    - Short answer

    For each question, provide:
    1. The question text
    2. The type of question
    3. Available options (for multiple choice)
    4. The correct answer(s)
    5. Feedback explaining the correct answer

    Structure your response as a JSON array of question objects with the following format:
    [
      {
        "type": "multipleChoice",
        "question": "Question text goes here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option B",
        "feedback": "Explanation of why Option B is correct"
      },
      {
        "type": "trueFalse",
        "question": "True/False question text goes here?",
        "options": ["True", "False"],
        "correctAnswer": "True",
        "feedback": "Explanation of why this is True"
      },
      {
        "type": "shortAnswer",
        "question": "Short answer question goes here?",
        "correctAnswer": "Expected answer",
        "feedback": "Explanation of the correct answer"
      }
    ]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate ${count} assessment questions for ${subject}` }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "[]");
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error generating assessment questions:", error);
    throw new Error("Failed to generate assessment questions");
  }
}
