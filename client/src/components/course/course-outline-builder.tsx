import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, EditIcon, TrashIcon, ChevronsUpDown } from "lucide-react";
import { generateCourseOutline } from "@/lib/openai";
import AiAssistant from "@/components/course/ai-assistant";

type Module = {
  id?: number;
  title: string;
  description?: string;
  order: number;
  lessons: {
    id?: number;
    title: string;
    content?: string;
    order: number;
    duration?: number;
  }[];
};

type CourseInfo = {
  title: string;
  description: string;
  coverImage?: string;
};

type CourseOutlineBuilderProps = {
  courseInfo: CourseInfo;
  modules: Module[];
  onUpdateOutline: (modules: Module[]) => void;
};

const CourseOutlineBuilder = ({ 
  courseInfo, 
  modules,
  onUpdateOutline 
}: CourseOutlineBuilderProps) => {
  const [expandedModules, setExpandedModules] = useState<number[]>(modules.map((_, i) => i));
  const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null);
  const [editingLessonIndexes, setEditingLessonIndexes] = useState<{moduleIndex: number, lessonIndex: number}[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isOutlineGenerating, setIsOutlineGenerating] = useState(false);
  const [outlinePrompt, setOutlinePrompt] = useState("");
  const [outlineStyle, setOutlineStyle] = useState("comprehensive");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const toggleExpandModule = (index: number) => {
    if (expandedModules.includes(index)) {
      setExpandedModules(expandedModules.filter(i => i !== index));
    } else {
      setExpandedModules([...expandedModules, index]);
    }
  };

  const addModule = () => {
    if (!newModuleTitle.trim()) return;

    const newModule: Module = {
      title: newModuleTitle,
      order: modules.length,
      lessons: []
    };

    onUpdateOutline([...modules, newModule]);
    setNewModuleTitle("");
    setExpandedModules([...expandedModules, modules.length]);
  };

  const updateModule = (index: number, updatedModule: Partial<Module>) => {
    const newModules = [...modules];
    newModules[index] = { ...newModules[index], ...updatedModule };
    onUpdateOutline(newModules);
  };

  const deleteModule = (index: number) => {
    const newModules = modules.filter((_, i) => i !== index).map((module, i) => ({
      ...module,
      order: i
    }));
    onUpdateOutline(newModules);
    setExpandedModules(expandedModules.filter(i => i !== index && (i < index ? i : i - 1)));
  };

  const addLesson = (moduleIndex: number) => {
    const newModules = [...modules];
    const moduleToUpdate = newModules[moduleIndex];
    
    moduleToUpdate.lessons.push({
      title: "New Lesson",
      order: moduleToUpdate.lessons.length,
      content: "",
    });
    
    onUpdateOutline(newModules);
    setEditingLessonIndexes([...editingLessonIndexes, {
      moduleIndex,
      lessonIndex: moduleToUpdate.lessons.length - 1
    }]);
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, title: string) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons[lessonIndex].title = title;
    onUpdateOutline(newModules);
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons = newModules[moduleIndex].lessons
      .filter((_, i) => i !== lessonIndex)
      .map((lesson, i) => ({
        ...lesson,
        order: i
      }));
    
    onUpdateOutline(newModules);
    setEditingLessonIndexes(editingLessonIndexes.filter(
      item => !(item.moduleIndex === moduleIndex && item.lessonIndex === lessonIndex)
    ));
  };

  const isEditingLesson = (moduleIndex: number, lessonIndex: number) => {
    return editingLessonIndexes.some(
      item => item.moduleIndex === moduleIndex && item.lessonIndex === lessonIndex
    );
  };

  const setEditingLesson = (moduleIndex: number, lessonIndex: number, isEditing: boolean) => {
    if (isEditing) {
      setEditingLessonIndexes([...editingLessonIndexes, { moduleIndex, lessonIndex }]);
    } else {
      setEditingLessonIndexes(editingLessonIndexes.filter(
        item => !(item.moduleIndex === moduleIndex && item.lessonIndex === lessonIndex)
      ));
    }
  };

  const handleGenerateOutline = async () => {
    try {
      setIsOutlineGenerating(true);
      const response = await generateCourseOutline(
        outlinePrompt || `Generate an outline for a ${courseInfo.title} course. ${courseInfo.description}`,
        outlineStyle
      );
      
      if (response.modules && response.modules.length) {
        onUpdateOutline(response.modules);
        setExpandedModules(response.modules.map((_: any, i: number) => i));
      }
      
      if (response.suggestions && response.suggestions.length) {
        setAiSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error("Error generating outline:", error);
    } finally {
      setIsOutlineGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        {/* Course Information Review */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{courseInfo.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{courseInfo.description}</p>
            </div>
            <button className="text-primary hover:text-blue-700 text-sm font-medium">
              Edit
            </button>
          </div>
        </div>

        {/* Outline Builder */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Course Outline
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Build your course structure by organizing modules and lessons.
            </p>
            
            <div className="mt-6 space-y-4">
              {modules.map((module, moduleIndex) => (
                <div key={moduleIndex} className="border border-gray-200 rounded-md">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 rounded-t-md"
                    onClick={() => toggleExpandModule(moduleIndex)}
                  >
                    <div className="flex items-center space-x-3">
                      <ChevronsUpDown className="h-5 w-5 text-gray-400" />
                      {editingModuleIndex === moduleIndex ? (
                        <Input 
                          className="font-medium text-gray-900"
                          value={module.title}
                          onChange={(e) => updateModule(moduleIndex, { title: e.target.value })}
                          onBlur={() => setEditingModuleIndex(null)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h4 className="font-medium text-gray-900">{module.title}</h4>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        className="p-1 text-gray-400 hover:text-gray-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingModuleIndex(moduleIndex);
                        }}
                      >
                        <EditIcon className="h-5 w-5" />
                      </button>
                      <button 
                        className="p-1 text-gray-400 hover:text-gray-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteModule(moduleIndex);
                        }}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  {expandedModules.includes(moduleIndex) && (
                    <div className="p-4 border-t border-gray-200">
                      <ul className="space-y-3">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <li key={lessonIndex} className="flex items-center justify-between py-2 pl-3 pr-2 text-sm rounded-md hover:bg-gray-50">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                              </svg>
                              {isEditingLesson(moduleIndex, lessonIndex) ? (
                                <Input 
                                  value={lesson.title}
                                  onChange={(e) => updateLesson(moduleIndex, lessonIndex, e.target.value)}
                                  onBlur={() => setEditingLesson(moduleIndex, lessonIndex, false)}
                                  autoFocus
                                  className="text-sm"
                                />
                              ) : (
                                <span>{lesson.title}</span>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                className="text-gray-400 hover:text-gray-500"
                                onClick={() => setEditingLesson(moduleIndex, lessonIndex, true)}
                              >
                                <EditIcon className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-gray-400 hover:text-gray-500"
                                onClick={() => deleteLesson(moduleIndex, lessonIndex)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <button 
                        className="mt-3 flex items-center text-sm text-primary hover:text-blue-700"
                        onClick={() => addLesson(moduleIndex)}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Lesson
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center space-x-3">
              <Input
                placeholder="Enter module title"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                className="max-w-md"
              />
              <Button 
                variant="outline" 
                onClick={addModule} 
                disabled={!newModuleTitle.trim()}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <AiAssistant
          title="AI Outline Generator"
          description="Let AI help you build a comprehensive course outline based on your topic."
          promptLabel="What would you like to create?"
          promptPlaceholder="e.g., Generate an outline for a beginner-friendly digital marketing course"
          promptValue={outlinePrompt}
          onPromptChange={setOutlinePrompt}
          generateButtonText="Generate Outline"
          isGenerating={isOutlineGenerating}
          onGenerate={handleGenerateOutline}
          selectOptions={[
            { value: "comprehensive", label: "Comprehensive" },
            { value: "brief", label: "Brief" },
            { value: "advanced", label: "Advanced" },
            { value: "beginner", label: "Beginner-friendly" }
          ]}
          selectValue={outlineStyle}
          onSelectChange={setOutlineStyle}
          suggestions={aiSuggestions}
        />

        {/* Course Preview */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Course Preview
            </h3>
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden mb-4">
              {courseInfo.coverImage ? (
                <img 
                  src={courseInfo.coverImage} 
                  alt={courseInfo.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No cover image uploaded</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">{courseInfo.title}</h4>
              <div className="flex items-center text-sm text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>
                  {modules.length} modules • {modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
                </span>
              </div>
              <div className="text-sm text-gray-500">
                <p>{courseInfo.description}</p>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                Preview Course
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseOutlineBuilder;
