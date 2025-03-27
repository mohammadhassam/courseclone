import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ChevronsUpDown, 
  Edit3Icon, 
  PlusCircle, 
  Layers, 
  FileQuestion, 
  GripHorizontal,
  Eye
} from "lucide-react";
import { 
  CourseOutline, 
  BloomsTaxonomyLevel, 
  TabContent, 
  Quiz, 
  QuizQuestion, 
  DragDropItem, 
  DropZone,
  InteractiveContent,
  InteractiveContentType,
  TabsInteractive as TabsInteractiveType,
  DragDropInteractive as DragDropInteractiveType
} from "@shared/schema";
import { generateLessonContent, improveContent } from "@/lib/openai";
import AiAssistant from "@/components/course/ai-assistant";
import TaxonomySelector from "@/components/course/taxonomy-selector";
import RichTextEditor from "@/components/editor/rich-text-editor";
import { TabsInteractive } from "@/components/interactive/tabs-interactive";
import { QuizComponent } from "@/components/interactive/quiz";
import { DragDropInteractive } from "@/components/interactive/drag-drop-interactive";
import { InteractiveEditor } from "@/components/course/editors/interactive-editor";

type CourseContentEditorProps = {
  courseOutline: CourseOutline;
  onUpdateModuleContent: (moduleIndex: number, lessonIndex: number, content: string) => void;
  onUpdateLessonTaxonomyLevel?: (moduleIndex: number, lessonIndex: number, taxonomyLevel: BloomsTaxonomyLevel) => void;
};

const CourseContentEditor = ({ courseOutline, onUpdateModuleContent, onUpdateLessonTaxonomyLevel }: CourseContentEditorProps) => {
  const [selectedModule, setSelectedModule] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentPrompt, setContentPrompt] = useState("");
  const [contentStyle, setContentStyle] = useState("comprehensive");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [interactiveElements, setInteractiveElements] = useState<Record<string, InteractiveContent[]>>({});
  const [currentEditingElement, setCurrentEditingElement] = useState<{
    type: InteractiveContentType;
    index: number;
  } | null>(null);

  const toggleExpandModule = (index: number) => {
    if (expandedModules.includes(index)) {
      setExpandedModules(expandedModules.filter(i => i !== index));
    } else {
      setExpandedModules([...expandedModules, index]);
    }
  };

  const handleSelectLesson = (moduleIndex: number, lessonIndex: number) => {
    setSelectedModule(moduleIndex);
    setSelectedLesson(lessonIndex);
    if (!expandedModules.includes(moduleIndex)) {
      setExpandedModules([...expandedModules, moduleIndex]);
    }
  };

  const getCurrentLessonContent = () => {
    if (
      courseOutline.modules[selectedModule] &&
      courseOutline.modules[selectedModule].lessons[selectedLesson]
    ) {
      return courseOutline.modules[selectedModule].lessons[selectedLesson].content || "";
    }
    return "";
  };
  
  const getCurrentLessonTaxonomyLevel = (): BloomsTaxonomyLevel => {
    if (
      courseOutline.modules[selectedModule] &&
      courseOutline.modules[selectedModule].lessons[selectedLesson]
    ) {
      return courseOutline.modules[selectedModule].lessons[selectedLesson].taxonomyLevel || "understand";
    }
    return "understand"; // Default level
  };
  
  const handleTaxonomyLevelChange = (taxonomyLevel: BloomsTaxonomyLevel) => {
    if (onUpdateLessonTaxonomyLevel) {
      onUpdateLessonTaxonomyLevel(selectedModule, selectedLesson, taxonomyLevel);
    }
  };

  // Helper function to serialize interactive elements to be included in content
  const serializeInteractiveElements = (): string => {
    const lessonId = getCurrentLessonId();
    const elements = interactiveElements[lessonId] || [];
    
    if (elements.length === 0) return '';
    
    // Create a serialized version of interactive elements that can be embedded in HTML
    // and later extracted by the exporters
    return `
      <div class="interactive-elements-container" style="display:none;" data-interactive-elements='${JSON.stringify(elements)}'>
      </div>
    `;
  };

  const handleContentChange = (content: string) => {
    // Combine the HTML content with serialized interactive elements
    // We need to first check if there's already serialized content and remove it
    const cleanContent = removeSerializedInteractiveElements(content);
    const interactiveContent = serializeInteractiveElements();
    const combinedContent = cleanContent + interactiveContent;
    
    // Store the current interactive elements in the state before updating content
    const lessonId = getCurrentLessonId();
    const currentElements = interactiveElements[lessonId] || [];
    
    // Extract any previously stored interactive elements that might be in the content
    try {
      // Look for interactive elements data in the content
      const match = content.match(/<div class="interactive-elements-container"[^>]*data-interactive-elements='([^']*)'[^>]*>/);
      if (match && match[1]) {
        const parsedElements = JSON.parse(match[1]);
        if (Array.isArray(parsedElements) && parsedElements.length > 0) {
          // Update the interactive elements state with the found elements
          setInteractiveElements({
            ...interactiveElements,
            [lessonId]: parsedElements
          });
        }
      }
    } catch (error) {
      console.error('Error parsing interactive elements from content:', error);
    }
    
    onUpdateModuleContent(selectedModule, selectedLesson, combinedContent);
  };
  
  // Helper to remove any previously serialized interactive elements
  const removeSerializedInteractiveElements = (content: string): string => {
    // Simple regex to remove the interactive elements container
    // Using a global match without the 's' flag to maintain compatibility
    const regex = /<div class="interactive-elements-container"[\s\S]*?<\/div>/g;
    return content.replace(regex, '');
  };

  const handleGenerateContent = async () => {
    try {
      if (!courseOutline.modules[selectedModule]?.lessons[selectedLesson]) return;
      
      setIsGenerating(true);
      
      const currentLesson = courseOutline.modules[selectedModule].lessons[selectedLesson];
      const moduleTitle = courseOutline.modules[selectedModule].title;
      const moduleNumber = (selectedModule + 1).toString(); // Convert to string for the prompt
      
      // Use the module number and module title in the prompt
      const response = await generateLessonContent(
        currentLesson.title,
        moduleTitle,
        courseOutline.course.title, // Use course title as the main subject
        moduleNumber
      );
      
      if (response.content) {
        onUpdateModuleContent(selectedModule, selectedLesson, response.content);
      }
      
      if (response.suggestions && response.suggestions.length) {
        setAiSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImproveContent = async () => {
    try {
      const currentContent = getCurrentLessonContent();
      if (!currentContent) {
        return;
      }
      
      setIsGenerating(true);
      
      const response = await improveContent(
        currentContent,
        "Improve this lesson content by making it more engaging, adding examples, and ensuring it covers the topic comprehensively."
      );
      
      if (response.content) {
        onUpdateModuleContent(selectedModule, selectedLesson, response.content);
      }
    } catch (error) {
      console.error("Error improving content:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Helper to get the current lesson ID
  const getCurrentLessonId = (): string => {
    if (
      courseOutline.modules[selectedModule] &&
      courseOutline.modules[selectedModule].lessons[selectedLesson]
    ) {
      return `module-${selectedModule}-lesson-${selectedLesson}`;
    }
    return "";
  };
  
  // Get interactive elements for the current lesson
  const getCurrentInteractiveElements = (): InteractiveContent[] => {
    const lessonId = getCurrentLessonId();
    return interactiveElements[lessonId] || [];
  };
  
  // Add a new interactive element
  const handleAddInteractiveElement = (type: InteractiveContentType) => {
    const lessonId = getCurrentLessonId();
    if (!lessonId) return;
    
    const currentElements = [...(interactiveElements[lessonId] || [])];
    
    let newElement: InteractiveContent;
    
    switch (type) {
      case "tabs":
        newElement = {
          type: "tabs",
          tabs: [
            { title: "Tab 1", content: "<p>Content for Tab 1</p>" },
            { title: "Tab 2", content: "<p>Content for Tab 2</p>" }
          ]
        };
        break;
        
      case "dragDrop":
        newElement = {
          type: "dragDrop",
          instructions: "Drag each item to its correct category",
          items: [
            { id: "item1", content: "Item 1", correctZone: "zone1" },
            { id: "item2", content: "Item 2", correctZone: "zone2" }
          ],
          zones: [
            { id: "zone1", title: "Category 1" },
            { id: "zone2", title: "Category 2" }
          ]
        };
        break;
        
      case "quiz":
        newElement = {
          type: "quiz",
          title: "Knowledge Check",
          description: "Test your understanding of the content",
          questions: [
            {
              id: "q1",
              type: "multipleChoice",
              question: "Sample question?",
              options: ["Option 1", "Option 2", "Option 3", "Option 4"],
              correctAnswer: "Option 2",
              feedback: "Explanation for the correct answer"
            }
          ],
          passingScore: 70,
          shuffleQuestions: false
        } as Quiz;
        break;
        
      default:
        return;
    }
    
    setInteractiveElements({
      ...interactiveElements,
      [lessonId]: [...currentElements, newElement]
    });
    
    // Set this new element as the one being edited
    setCurrentEditingElement({
      type: type,
      index: currentElements.length
    });
  };
  
  // Update an existing interactive element
  const handleUpdateInteractiveElement = (index: number, updatedElement: InteractiveContent) => {
    const lessonId = getCurrentLessonId();
    if (!lessonId) return;
    
    const currentElements = [...(interactiveElements[lessonId] || [])];
    currentElements[index] = updatedElement;
    
    // Update the interactive elements
    setInteractiveElements({
      ...interactiveElements,
      [lessonId]: currentElements
    });
    
    // Immediately update the lesson content to ensure serialized elements are saved
    const currentContent = getCurrentLessonContent();
    handleContentChange(currentContent);
  };
  
  // Remove an interactive element
  const handleRemoveInteractiveElement = (index: number) => {
    const lessonId = getCurrentLessonId();
    if (!lessonId) return;
    
    const currentElements = [...(interactiveElements[lessonId] || [])];
    currentElements.splice(index, 1);
    
    setInteractiveElements({
      ...interactiveElements,
      [lessonId]: currentElements
    });
    
    // If we were editing this element, clear the editing state
    if (currentEditingElement && currentEditingElement.index === index) {
      setCurrentEditingElement(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Course Structure</h3>
            <div className="space-y-4">
              {courseOutline.modules.map((module, moduleIndex) => (
                <div key={moduleIndex} className="border border-gray-200 rounded-md">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 rounded-t-md"
                    onClick={() => toggleExpandModule(moduleIndex)}
                  >
                    <div className="flex items-center space-x-3">
                      <ChevronsUpDown className="h-5 w-5 text-gray-400" />
                      <h4 className="font-medium text-gray-900">{module.title}</h4>
                    </div>
                  </div>
                  {expandedModules.includes(moduleIndex) && (
                    <div className="p-4 border-t border-gray-200">
                      <ul className="space-y-3">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <li 
                            key={lessonIndex} 
                            className={`flex items-center justify-between py-2 pl-3 pr-2 text-sm rounded-md cursor-pointer
                              ${moduleIndex === selectedModule && lessonIndex === selectedLesson 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'hover:bg-gray-50'}`}
                            onClick={() => handleSelectLesson(moduleIndex, lessonIndex)}
                          >
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                              </svg>
                              <span>{lesson.title}</span>
                            </div>
                            {lesson.content ? (
                              <div className="w-2 h-2 rounded-full bg-green-500" title="Content added"></div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-gray-300" title="No content yet"></div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        {courseOutline.modules.length > 0 && 
         courseOutline.modules[selectedModule] && 
         courseOutline.modules[selectedModule].lessons.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium">
                    {courseOutline.modules[selectedModule]?.lessons[selectedLesson]?.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Module: {courseOutline.modules[selectedModule]?.title}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleImproveContent}
                  disabled={isGenerating || !getCurrentLessonContent()}
                >
                  <Edit3Icon className="h-4 w-4 mr-2" />
                  Improve Content
                </Button>
              </div>

              <div className="mb-6">
                <TaxonomySelector 
                  value={getCurrentLessonTaxonomyLevel()}
                  onChange={handleTaxonomyLevelChange}
                  label="Learning Objective Level"
                  showHelp={true}
                />
              </div>

              <Tabs defaultValue="edit">
                <TabsList className="mb-4">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="interactive">Interactive</TabsTrigger>
                </TabsList>
                
                <TabsContent value="edit">
                  <RichTextEditor
                    placeholder="Enter or generate lesson content..."
                    className="min-h-[300px]"
                    value={getCurrentLessonContent()}
                    onChange={handleContentChange}
                  />
                </TabsContent>
                
                <TabsContent value="interactive">
                  <div className="space-y-6">
                    {currentEditingElement !== null ? (
                      // Show the editor for the element being edited
                      <InteractiveEditor
                        element={getCurrentInteractiveElements()[currentEditingElement.index]}
                        onSave={(updatedElement) => {
                          handleUpdateInteractiveElement(currentEditingElement.index, updatedElement);
                          setCurrentEditingElement(null);
                        }}
                        onCancel={() => setCurrentEditingElement(null)}
                      />
                    ) : (
                      // Show the list of interactive elements
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Interactive Elements</h3>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddInteractiveElement("tabs")}
                            >
                              <Layers className="h-4 w-4 mr-2" />
                              Add Tabs
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddInteractiveElement("dragDrop")}
                            >
                              <GripHorizontal className="h-4 w-4 mr-2" />
                              Add Drag & Drop
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddInteractiveElement("quiz")}
                            >
                              <FileQuestion className="h-4 w-4 mr-2" />
                              Add Quiz
                            </Button>
                          </div>
                        </div>
                        
                        <div className="border rounded-md p-4 bg-slate-50">
                          <p className="text-sm text-muted-foreground mb-2">
                            Interactive elements make your course more engaging. Add tabs, drag & drop activities, or quizzes to enhance your lesson.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            <div className="bg-white p-4 rounded-md border shadow-sm">
                              <div className="flex items-center">
                                <Layers className="h-5 w-5 text-primary mr-2" />
                                <h4 className="font-medium">Tabs</h4>
                              </div>
                              <p className="text-sm mt-2">
                                Present content in organized tabs for different topics or categories.
                              </p>
                            </div>
                            
                            <div className="bg-white p-4 rounded-md border shadow-sm">
                              <div className="flex items-center">
                                <GripHorizontal className="h-5 w-5 text-primary mr-2" />
                                <h4 className="font-medium">Drag & Drop</h4>
                              </div>
                              <p className="text-sm mt-2">
                                Create matching activities where learners drag items to correct categories.
                              </p>
                            </div>
                            
                            <div className="bg-white p-4 rounded-md border shadow-sm">
                              <div className="flex items-center">
                                <FileQuestion className="h-5 w-5 text-primary mr-2" />
                                <h4 className="font-medium">Quizzes</h4>
                              </div>
                              <p className="text-sm mt-2">
                                Test knowledge with multiple question types and automatic scoring.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Interactive Element Previews */}
                        <div className="space-y-4 mt-6">
                          {getCurrentInteractiveElements().length > 0 ? (
                            getCurrentInteractiveElements().map((element, index) => (
                              <div 
                                key={index} 
                                className="border rounded-md overflow-hidden bg-white"
                              >
                                <div className="flex items-center justify-between bg-slate-50 p-4 border-b">
                                  <div className="flex items-center">
                                    {element.type === "tabs" && <Layers className="h-5 w-5 text-primary mr-2" />}
                                    {element.type === "dragDrop" && <GripHorizontal className="h-5 w-5 text-primary mr-2" />}
                                    {element.type === "quiz" && <FileQuestion className="h-5 w-5 text-primary mr-2" />}
                                    <h4 className="font-medium">
                                      {element.type === "tabs" && "Tabs Interaction"}
                                      {element.type === "dragDrop" && "Drag & Drop Activity"}
                                      {element.type === "quiz" && ((element as Quiz).title || "Knowledge Check")}
                                    </h4>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setCurrentEditingElement({ type: element.type, index })}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRemoveInteractiveElement(index)}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="p-4">
                                  {element.type === "tabs" && (
                                    <TabsInteractive
                                      tabs={(element as TabsInteractiveType).tabs}
                                      className="w-full"
                                    />
                                  )}
                                  
                                  {element.type === "dragDrop" && (
                                    <DragDropInteractive
                                      instructions={(element as DragDropInteractiveType).instructions}
                                      items={(element as DragDropInteractiveType).items}
                                      zones={(element as DragDropInteractiveType).zones}
                                      className="w-full"
                                    />
                                  )}
                                  
                                  {element.type === "quiz" && (
                                    <QuizComponent
                                      quiz={element as Quiz}
                                      className="w-full"
                                    />
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 bg-white rounded-md border">
                              <h4 className="text-lg font-medium mb-2">No Interactive Elements Yet</h4>
                              <p className="text-gray-500 mb-4">
                                Add interactive elements to make your lesson more engaging.
                              </p>
                              <div className="flex justify-center space-x-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddInteractiveElement("tabs")}
                                >
                                  <Layers className="h-4 w-4 mr-2" />
                                  Add Tabs
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddInteractiveElement("dragDrop")}
                                >
                                  <GripHorizontal className="h-4 w-4 mr-2" />
                                  Add Drag & Drop
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddInteractiveElement("quiz")}
                                >
                                  <FileQuestion className="h-4 w-4 mr-2" />
                                  Add Quiz
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="preview">
                  <div className="prose max-w-none min-h-[300px] p-4 border rounded-md bg-white">
                    <div className="flex justify-end mb-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="ml-auto"
                        onClick={() => {
                          // Force refresh the preview content
                          const content = getCurrentLessonContent();
                          const interactiveEls = getCurrentInteractiveElements();
                          
                          // Parse serialized elements before refreshing
                          try {
                            const match = content.match(/<div class="interactive-elements-container"[^>]*data-interactive-elements='([^']*)'[^>]*>/);
                            if (match && match[1]) {
                              const parsedElements = JSON.parse(match[1]);
                              if (Array.isArray(parsedElements) && parsedElements.length > 0) {
                                const lessonId = getCurrentLessonId();
                                setInteractiveElements({
                                  ...interactiveElements,
                                  [lessonId]: parsedElements
                                });
                              }
                            }
                          } catch (error) {
                            console.error('Error parsing interactive elements during preview:', error);
                          }
                          
                          // Update serialized interactive elements if needed
                          if (interactiveEls.length > 0 && content) {
                            handleContentChange(content);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Refresh Preview
                      </Button>
                    </div>
                    {getCurrentLessonContent() ? (
                      <div className="lesson-content-preview">
                        {/* Content preview with proper styling using Quill */}
                        <div 
                          className="content-preview ql-editor" 
                          dangerouslySetInnerHTML={{ 
                            __html: removeSerializedInteractiveElements(getCurrentLessonContent())
                          }} 
                        />
                        
                        {/* Interactive elements preview */}
                        {getCurrentInteractiveElements().length > 0 && (
                          <div className="mt-8 border-t pt-4">
                            <h3 className="text-lg font-semibold mb-4">Interactive Elements</h3>
                            <div className="space-y-6">
                              {getCurrentInteractiveElements().map((element, index) => (
                                <div key={index} className="border rounded-md p-4 bg-white">
                                  {element.type === "tabs" && (
                                    <TabsInteractive 
                                      tabs={(element as TabsInteractiveType).tabs} 
                                    />
                                  )}
                                  {element.type === "dragDrop" && (
                                    <>
                                      <h4 className="font-medium mb-2">Drag & Drop Activity</h4>
                                      <p className="text-sm text-gray-500 mb-4">
                                        {(element as DragDropInteractiveType).instructions}
                                      </p>
                                      <DragDropInteractive
                                        instructions={(element as DragDropInteractiveType).instructions}
                                        items={(element as DragDropInteractiveType).items}
                                        zones={(element as DragDropInteractiveType).zones}
                                      />
                                    </>
                                  )}
                                  {element.type === "quiz" && (
                                    <QuizComponent 
                                      quiz={(element as Quiz)} 
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-8 text-muted-foreground">
                        <p>No content to preview yet. Generate or enter content in the Edit tab.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <AiAssistant
                title="AI Content Generator"
                description="Let AI help you generate professional content for this lesson."
                promptLabel="Instructions for content generation"
                promptPlaceholder="e.g., Create comprehensive content for this lesson with examples and explanations"
                promptValue={contentPrompt}
                onPromptChange={setContentPrompt}
                generateButtonText="Generate Content"
                isGenerating={isGenerating}
                onGenerate={handleGenerateContent}
                selectOptions={[
                  { value: "comprehensive", label: "Comprehensive" },
                  { value: "brief", label: "Brief" },
                  { value: "examples", label: "With Examples" },
                  { value: "beginner", label: "Beginner-friendly" }
                ]}
                selectValue={contentStyle}
                onSelectChange={setContentStyle}
                suggestions={aiSuggestions}
                className="mt-6"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium mb-2">No lessons available</h3>
              <p className="text-gray-500">
                Select a lesson from the course structure to edit its content.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CourseContentEditor;
