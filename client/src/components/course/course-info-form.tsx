import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { getContentSuggestions, generateCourseDescription, formatPrompt, PROMPT_TEMPLATES } from "@/lib/openai";
import { Sparkles, CopyIcon, Wand2Icon, ImageIcon } from "lucide-react";

// Define form schema
const courseInfoSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters",
  }),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters",
  }),
  coverImage: z.string().optional(),
});

type CourseInfoFormValues = z.infer<typeof courseInfoSchema>;

type CourseInfoFormProps = {
  initialValues: {
    title: string;
    description: string;
    coverImage?: string;
  };
  onSubmit: (values: CourseInfoFormValues) => void;
};

const CourseInfoForm = ({ initialValues, onSubmit }: CourseInfoFormProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null);

  const [coverImage, setCoverImage] = useState<string>(initialValues.coverImage || "");
  
  const form = useForm<CourseInfoFormValues>({
    resolver: zodResolver(courseInfoSchema),
    defaultValues: {
      title: initialValues.title || "",
      description: initialValues.description || "",
      coverImage: initialValues.coverImage || "",
    },
  });

  const handleGetSuggestions = async () => {
    try {
      setIsGenerating(true);
      const title = form.getValues("title");
      
      if (!title || title.length < 5) {
        form.setError("title", { 
          type: "manual", 
          message: "Please enter a title with at least 5 characters to get suggestions" 
        });
        setIsGenerating(false);
        return;
      }
      
      const response = await getContentSuggestions(
        title,
        form.getValues("description") || "Educational course"
      );
      
      setAiSuggestions(response.suggestions || []);
    } catch (error) {
      console.error("Error getting suggestions:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleGenerateDescription = async () => {
    try {
      setIsGeneratingDescription(true);
      const title = form.getValues("title");
      
      if (!title || title.length < 5) {
        form.setError("title", { 
          type: "manual", 
          message: "Please enter a title with at least 5 characters to generate a description" 
        });
        setIsGeneratingDescription(false);
        return;
      }
      
      // Generate description using the formatted prompt
      const response = await generateCourseDescription(title);
      
      if (response && response.description) {
        setGeneratedDescription(response.description);
      } else {
        console.error("Failed to generate description: No response data");
      }
    } catch (error) {
      console.error("Error generating description:", error);
    } finally {
      setIsGeneratingDescription(false);
    }
  };
  
  const applyGeneratedDescription = () => {
    if (generatedDescription) {
      form.setValue("description", generatedDescription);
      // Clear validation errors if they exist
      form.clearErrors("description");
    }
  };

  const handleSubmit = (values: CourseInfoFormValues) => {
    // Ensure the coverImage is included in the submission
    onSubmit({
      ...values,
      coverImage: coverImage || values.coverImage
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Introduction to Digital Marketing" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Give your course a clear, descriptive title.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what students will learn in this course..."
                          className="min-h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a comprehensive description of your course content and learning outcomes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value || ""}
                          onChange={(value) => {
                            field.onChange(value);
                            setCoverImage(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload an eye-catching image for your course (recommended: 1280x720).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-2">
                  <Button type="submit">
                    Continue to Outline
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                AI Assistant
              </h3>
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Let AI help you craft the perfect course description and suggest content ideas.
            </p>
            
            {/* Generate description button */}
            <Button 
              variant="outline" 
              className="w-full mb-3 flex items-center justify-center gap-2"
              onClick={handleGenerateDescription}
              disabled={isGeneratingDescription}
            >
              <Wand2Icon className="h-4 w-4" />
              {isGeneratingDescription ? "Generating Description..." : "Generate Course Description"}
            </Button>
            
            {/* Generated description */}
            {generatedDescription && (
              <div className="mt-3 mb-3 bg-gray-50 rounded-md p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    AI Generated Description
                  </h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={applyGeneratedDescription}
                  >
                    <CopyIcon className="h-3.5 w-3.5 mr-1" />
                    Use This
                  </Button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {generatedDescription}
                </p>
              </div>
            )}
            
            {/* Content suggestions button */}
            <Button 
              variant="secondary" 
              className="w-full mb-4"
              onClick={handleGetSuggestions}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating Suggestions..." : "Get Content Suggestions"}
            </Button>

            {/* Content suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="mt-4 bg-gray-50 rounded-md p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  AI Suggestions for Course Content
                </h4>
                <ul className="space-y-3 text-sm">
                  {aiSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Tips</h4>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>Be specific about what students will learn</li>
                <li>Mention the key skills they'll develop</li>
                <li>Indicate the target audience level (beginner, intermediate, etc.)</li>
                <li>Keep your title concise but descriptive</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CourseInfoForm;
