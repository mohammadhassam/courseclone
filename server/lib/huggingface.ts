import { HfInference } from '@huggingface/inference';
import { CourseOutline } from '@shared/schema';

// You can set your Hugging Face token here if needed (for accessing gated models)
// Using process.env to ensure security
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

// Initialize Hugging Face client
const inference = new HfInference(HF_TOKEN);

// Default model to use - can be changed to any conversational model on Hugging Face
// Using an open-source model like 'mistralai/Mistral-7B-Instruct-v0.1' or 'meta-llama/Llama-2-7b-chat-hf'
// You can change this to other available open models
const DEFAULT_MODEL = 'meta-llama/Meta-Llama-3-8B-Instruct';

// Helper function to structure prompts for the model
function createPrompt(systemPrompt: string, userPrompt: string): string {
  return `<s>[INST] ${systemPrompt}

${userPrompt} [/INST]</s>`;
}

// Function to generate course outline
export async function generateCourseOutline(prompt: string, style = "comprehensive"): Promise<{
  outline: CourseOutline,
  suggestions?: string[]
}> {
  try {
    console.log(`Generating course outline for: "${prompt}" with style: ${style}`);
    
    const systemPrompt = `You are an expert curriculum designer. Create a structured, comprehensive course outline on the given subject.
    
    IMPORTANT INSTRUCTIONS:
    1. Start with a beginner-friendly introduction module
    2. Progress logically from fundamentals to advanced topics
    3. Include practical exercises and assessments for each module
    4. Follow the specified structure EXACTLY for your response
    
    The style should be ${style} and focused on educational best practices.
    
    YOUR RESPONSE MUST BE VALID JSON with this exact format:
    {
      "course": {
        "title": "Descriptive Course Title for ${prompt}",
        "description": "Clear, compelling course description explaining objectives and target audience"
      },
      "modules": [
        {
          "title": "Module 1: Introduction to ${prompt}",
          "description": "Clear module description with learning objectives",
          "order": 1,
          "lessons": [
            {
              "title": "Lesson 1: Getting Started with ${prompt}",
              "order": 1,
              "duration": 30,
              "taxonomyLevel": "understand"
            },
            {
              "title": "Lesson 2: Core Concepts of ${prompt}",
              "order": 2,
              "duration": 45,
              "taxonomyLevel": "understand"
            }
          ]
        },
        {
          "title": "Module 2: Intermediate ${prompt}",
          "description": "Building on fundamentals with practical applications",
          "order": 2,
          "lessons": [
            {
              "title": "Lesson 1: Applied Techniques",
              "order": 1,
              "duration": 40,
              "taxonomyLevel": "apply"
            }
          ]
        }
      ],
      "suggestions": [
        "Consider adding more interactive elements to Module 2",
        "Include case studies in the advanced modules"
      ]
    }
    
    YOU MUST include 4-5 modules, each with 3-5 lessons. Lessons must have descriptive, specific titles.
    The taxonomyLevel for each lesson MUST be one of: "remember", "understand", "apply", "analyze", "evaluate", "create".
    Ensure the JSON is properly formatted with no syntax errors.`;

    const userPrompt = `Create a detailed course outline for: ${prompt}. I need a complete structure with modules and lessons that progress from beginner to advanced concepts.`;

    const fullPrompt = createPrompt(systemPrompt, userPrompt);
    console.log("Sending request to Hugging Face API for course outline...");
    
    // Call Hugging Face API
    const response = await inference.textGeneration({
      model: DEFAULT_MODEL,
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7,
        top_p: 0.95,
        return_full_text: false,
      }
    });

    // Extract JSON from the response
    let jsonStr = response.generated_text;
    
    // If the model outputs extra text around the JSON, we need to extract just the JSON part
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}') + 1;
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd);
    }

    // Parse the JSON response
    const parsedResponse = JSON.parse(jsonStr) as CourseOutline & { suggestions?: string[] };
    
    // Return the parsed outline with optional suggestions
    return {
      outline: {
        course: parsedResponse.course,
        modules: parsedResponse.modules,
      },
      suggestions: parsedResponse.suggestions || []
    };
  } catch (error) {
    console.error('Error generating course outline:', error);
    
    // Return a fallback outline in case of errors
    return {
      outline: {
        course: {
          title: `Course on ${prompt}`,
          description: `Learn about ${prompt} in this comprehensive course.`
        },
        modules: [
          {
            title: 'Introduction',
            description: 'Getting started with the basics',
            order: 1,
            lessons: [
              {
                title: 'Overview',
                order: 1,
                duration: 30,
                taxonomyLevel: 'understand'
              }
            ]
          }
        ]
      },
      suggestions: ['Add more specific examples', 'Include practical exercises']
    };
  }
}

// Function to generate lesson content
export async function generateLessonContent(
  lessonTitle: string,
  moduleTitle: string,
  courseTitle: string = '',
  moduleNumber: string = ''
): Promise<{
  content: string,
  suggestions?: string[]
}> {
  try {
    console.log(`Generating lesson content for: "${lessonTitle}" in module "${moduleTitle}" ${courseTitle ? `for course "${courseTitle}"` : ''} ${moduleNumber ? `(module ${moduleNumber})` : ''}`);
    
    const systemPrompt = `You are an expert educational content writer. 
    Create specific, structured lesson content for a lesson titled "${lessonTitle}" 
    that is part of the module "${moduleTitle}" ${courseTitle ? `in the course "${courseTitle}"` : ''}.
    ${moduleNumber ? `This is module ${moduleNumber} in the course.` : ''}
    
    IMPORTANT: Your output will be directly inserted into a rich text editor. DO NOT include raw HTML tags 
    as they will be displayed literally. Instead, use proper formatting with the following guidelines:
    
    Response Structure:
    1. Start with a heading "Introduction" followed by a concise one-paragraph introduction
    2. Include a heading "Key Concepts" followed by bullet points for important concepts 
    3. Add a heading "Examples" with specific, practical examples
    4. Include a heading "Practice Activity" with 1-2 exercises for practice
    5. End with a heading "Summary" followed by a concise lesson summary
    
    FORMAT REQUIREMENTS:
    - Use bullet points liberally throughout the content
    - Keep paragraphs short (3-4 sentences maximum)
    - Use specific examples rather than general descriptions
    - For code examples, clearly indicate they are code examples
    - Use clear formatting for all content elements
    
    After your main content, include a list of suggestions for improving this content with the label "Content Improvement Suggestions:".`;

    const userPrompt = `Create specific, well-structured content with bullet points for the lesson: ${lessonTitle}`;

    const fullPrompt = createPrompt(systemPrompt, userPrompt);
    console.log("Sending request to Hugging Face API for lesson content...");
    
    // Call Hugging Face API
    const response = await inference.textGeneration({
      model: DEFAULT_MODEL,
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7,
        top_p: 0.95,
        return_full_text: false,
      }
    });

    // Extract content and suggestions
    const content = response.generated_text;
    
    // Check if there's a suggestions section in the response
    const suggestionsMatch = content.match(/suggestions: \[(.*?)\]/) || content.match(/"suggestions":\s*\[(.*?)\]/);
    const suggestions = suggestionsMatch 
      ? JSON.parse(`[${suggestionsMatch[1]}]`) 
      : ['Add real-world examples', 'Include more interactive exercises', 'Add visual aids'];

    // Remove suggestions section from content if present
    let cleanedContent = content;
    if (content.includes('suggestions:')) {
      cleanedContent = content.split('suggestions:')[0];
    }
    if (content.includes('"suggestions":')) {
      cleanedContent = content.split('"suggestions":')[0];
    }
    
    return { 
      content: cleanedContent,
      suggestions 
    };
  } catch (error) {
    console.error('Error generating lesson content:', error);
    return {
      content: `<h1>${lessonTitle}</h1><p>Content for this lesson will be available soon.</p>`,
      suggestions: ['Add real-world examples', 'Include interactive elements', 'Add visual aids']
    };
  }
}

// Function to improve existing content
export async function improveContent(
  originalContent: string,
  instructions: string = 'Improve this content'
): Promise<{
  content: string
}> {
  try {
    const systemPrompt = `You are an expert educational content writer. Improve the provided content according to these instructions: ${instructions}.
    
    IMPORTANT: Your output will be directly inserted into a rich text editor. DO NOT include raw HTML tags 
    as they will be displayed literally. Instead, use proper formatting.
    
    Maintain the current structure of the content but enhance:
    - Content quality and depth
    - Clarity and readability 
    - Engagement and interactivity
    - Specific examples and applications
    
    Fix any grammar or spelling errors, improve flow, and make the content more engaging.
    Use bullet points for lists and clear headings for sections.`;

    const userPrompt = `Original content: ${originalContent}`;

    const fullPrompt = createPrompt(systemPrompt, userPrompt);
    
    // Call Hugging Face API
    const response = await inference.textGeneration({
      model: DEFAULT_MODEL,
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7,
        top_p: 0.95,
        return_full_text: false,
      }
    });

    return { content: response.generated_text };
  } catch (error) {
    console.error('Error improving content:', error);
    return { content: originalContent };
  }
}

// Function to generate content suggestions
export async function generateContentSuggestions(
  courseTitle: string,
  courseDescription: string
): Promise<string[]> {
  try {
    const systemPrompt = `You are an expert educational consultant. 
    Generate a list of 5-7 specific, actionable content suggestions for a course titled "${courseTitle}" 
    with this description: "${courseDescription}".
    
    Each suggestion should be brief (1-2 sentences) and focus on a different aspect of the course.
    Format your response as an array of strings in a valid JSON format.`;

    const userPrompt = `Generate content suggestions for this course titled "${courseTitle}"`;

    const fullPrompt = createPrompt(systemPrompt, userPrompt);
    
    // Call Hugging Face API
    const response = await inference.textGeneration({
      model: DEFAULT_MODEL,
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.8,
        top_p: 0.95,
        return_full_text: false,
      }
    });

    // Extract JSON from the response
    let jsonStr = response.generated_text;
    
    // If the model outputs extra text around the JSON, we need to extract just the JSON part
    const jsonStart = jsonStr.indexOf('[');
    const jsonEnd = jsonStr.lastIndexOf(']') + 1;
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd);
    }

    // Parse the JSON response
    const suggestions = JSON.parse(jsonStr) as string[];
    
    return suggestions.slice(0, 7); // Limit to max 7 suggestions
  } catch (error) {
    console.error('Error generating content suggestions:', error);
    return [
      'Add more practical exercises and activities',
      'Include case studies from real-world scenarios',
      'Create downloadable resources for learners',
      'Add self-assessment quizzes at the end of each module',
      'Include visual aids like diagrams and charts'
    ];
  }
}

// Function to generate assessment questions
export async function generateAssessmentQuestions(
  subject: string,
  count: number = 5
): Promise<any[]> {
  try {
    console.log(`Generating ${count} assessment questions about: "${subject}"`);
    
    const systemPrompt = `You are an expert educational assessment designer. 
    Create ${count} assessment questions about "${subject}".
    
    Each question should include:
    - A clear question stem
    - 4 multiple-choice options (for multiple choice questions)
    - The correct answer
    - Explanatory feedback for the correct answer
    
    Format your response as a JSON array:
    [
      {
        "type": "multipleChoice",  // One of: "multipleChoice", "trueFalse", "shortAnswer", "matching", "fillInBlank"
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],  // For multiple choice only
        "correctAnswer": "Option B",
        "feedback": "Explanation for why Option B is correct"
      }
    ]`;

    const userPrompt = `Generate ${count} assessment questions about: ${subject}`;

    const fullPrompt = createPrompt(systemPrompt, userPrompt);
    console.log("Sending request to Hugging Face API for assessment questions...");
    
    // Call Hugging Face API
    const response = await inference.textGeneration({
      model: DEFAULT_MODEL,
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7,
        top_p: 0.95,
        return_full_text: false,
      }
    });

    // Extract JSON from the response
    let jsonStr = response.generated_text;
    
    // If the model outputs extra text around the JSON, we need to extract just the JSON part
    const jsonStart = jsonStr.indexOf('[');
    const jsonEnd = jsonStr.lastIndexOf(']') + 1;
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd);
    }

    // Parse the JSON response
    const questions = JSON.parse(jsonStr);
    
    return questions;
  } catch (error) {
    console.error('Error generating assessment questions:', error);
    return [
      {
        type: "multipleChoice",
        question: `What is a key aspect of ${subject}?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A",
        feedback: "Option A is correct because it represents the fundamental principle."
      }
    ];
  }
}