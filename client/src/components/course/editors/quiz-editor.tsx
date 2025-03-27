import React, { useState } from "react";
import { Quiz, QuizQuestion, QuestionType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { QuizComponent } from "@/components/interactive/quiz";
import { Trash2, Plus, AlignLeft, CheckSquare, List, LayoutList, TextQuote } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface QuizEditorProps {
  quiz: Quiz;
  onSave: (quiz: Quiz) => void;
  onCancel: () => void;
}

export function QuizEditor({ quiz, onSave, onCancel }: QuizEditorProps) {
  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description || "");
  const [questions, setQuestions] = useState<QuizQuestion[]>(quiz.questions);
  const [passingScore, setPassingScore] = useState(quiz.passingScore || 70);
  const [shuffleQuestions, setShuffleQuestions] = useState(quiz.shuffleQuestions || false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  
  const handleQuestionTypeChange = (index: number, type: QuestionType) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      type,
      // Reset options and correct answer based on the new type
      options: type === "multipleChoice" ? ["Option 1", "Option 2", "Option 3", "Option 4"] : undefined,
      correctAnswer: type === "multipleChoice" ? "Option 1" : 
                    type === "trueFalse" ? "True" :
                    type === "matching" ? {} as any :
                    type === "fillInBlank" ? [] :
                    ""
    };
    setQuestions(updatedQuestions);
  };
  
  const handleQuestionTextChange = (index: number, question: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], question };
    setQuestions(updatedQuestions);
  };
  
  const handleQuestionOptionsChange = (index: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[index].options) {
      updatedQuestions[index].options = [];
    }
    const updatedOptions = [...(updatedQuestions[index].options || [])];
    updatedOptions[optionIndex] = value;
    updatedQuestions[index].options = updatedOptions;
    setQuestions(updatedQuestions);
  };
  
  const handleCorrectAnswerChange = (index: number, value: string | string[]) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].correctAnswer = value;
    setQuestions(updatedQuestions);
  };
  
  const handleFeedbackChange = (index: number, feedback: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].feedback = feedback;
    setQuestions(updatedQuestions);
  };
  
  const handleAddOption = (index: number) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[index].options) {
      updatedQuestions[index].options = [];
    }
    updatedQuestions[index].options = [...(updatedQuestions[index].options || []), `Option ${(updatedQuestions[index].options?.length || 0) + 1}`];
    setQuestions(updatedQuestions);
  };
  
  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options && updatedQuestions[questionIndex].options!.length > 2) {
      // Keep at least 2 options
      const updatedOptions = [...updatedQuestions[questionIndex].options!];
      updatedOptions.splice(optionIndex, 1);
      updatedQuestions[questionIndex].options = updatedOptions;
      
      // Update correct answer if it was pointing to the removed option
      if (updatedQuestions[questionIndex].correctAnswer === updatedQuestions[questionIndex].options![optionIndex]) {
        updatedQuestions[questionIndex].correctAnswer = updatedOptions[0];
      }
      
      setQuestions(updatedQuestions);
    }
  };
  
  const handleAddQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q${questions.length + 1}`,
      type: "multipleChoice",
      question: `Question ${questions.length + 1}`,
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: "Option 1",
      feedback: "Explanation for the correct answer"
    };
    setQuestions([...questions, newQuestion]);
    setSelectedQuestionIndex(questions.length);
  };
  
  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return; // Keep at least one question
    
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
    
    // Update selected question index if needed
    if (selectedQuestionIndex >= updatedQuestions.length) {
      setSelectedQuestionIndex(updatedQuestions.length - 1);
    }
  };
  
  const handleSave = () => {
    onSave({
      ...quiz,
      type: "quiz",
      title,
      description,
      questions,
      passingScore,
      shuffleQuestions
    });
  };
  
  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case "multipleChoice": return <CheckSquare className="h-4 w-4" />;
      case "trueFalse": return <AlignLeft className="h-4 w-4" />;
      case "shortAnswer": return <TextQuote className="h-4 w-4" />;
      case "matching": return <LayoutList className="h-4 w-4" />;
      case "fillInBlank": return <List className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Edit Quiz</h3>
        <Button onClick={handleAddQuestion} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quiz-title">Quiz Title</Label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="quiz-description">Description (Optional)</Label>
            <Input
              id="quiz-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a brief description"
              className="mt-2"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Passing Score: {passingScore}%</Label>
            <Slider
              value={[passingScore]}
              min={50}
              max={100}
              step={5}
              onValueChange={(values) => setPassingScore(values[0])}
              className="mt-2"
            />
          </div>
          <div className="flex items-center space-x-2 mt-8">
            <Switch
              checked={shuffleQuestions}
              onCheckedChange={setShuffleQuestions}
            />
            <Label>Shuffle questions</Label>
          </div>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h4 className="font-medium mb-4">Questions</h4>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1 border rounded-md overflow-hidden">
            <div className="bg-gray-50 p-3 border-b">
              <h5 className="text-sm font-medium">Question List</h5>
            </div>
            <div className="p-2">
              <ul className="space-y-1">
                {questions.map((q, index) => (
                  <li key={q.id || index}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                        selectedQuestionIndex === index ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedQuestionIndex(index)}
                    >
                      <div className="flex items-center">
                        {getQuestionTypeIcon(q.type)}
                        <span className="ml-2 truncate">{q.question}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveQuestion(index);
                        }}
                        disabled={questions.length <= 1}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="col-span-3 border rounded-md overflow-hidden">
            {questions.length > 0 && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <Select
                      value={questions[selectedQuestionIndex].type}
                      onValueChange={(value) => handleQuestionTypeChange(selectedQuestionIndex, value as QuestionType)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Question type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multipleChoice">Multiple Choice</SelectItem>
                        <SelectItem value="trueFalse">True/False</SelectItem>
                        <SelectItem value="shortAnswer">Short Answer</SelectItem>
                        <SelectItem value="matching">Matching</SelectItem>
                        <SelectItem value="fillInBlank">Fill in the Blank</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(selectedQuestionIndex)}
                      disabled={questions.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500 mr-2" />
                      Remove Question
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="question-text">Question</Label>
                    <Textarea
                      id="question-text"
                      value={questions[selectedQuestionIndex].question}
                      onChange={(e) => handleQuestionTextChange(selectedQuestionIndex, e.target.value)}
                      className="mt-2"
                      placeholder="Enter your question"
                    />
                  </div>
                  
                  {questions[selectedQuestionIndex].type === "multipleChoice" && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Answer Options</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOption(selectedQuestionIndex)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                      {questions[selectedQuestionIndex].options?.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <Input
                                value={option}
                                onChange={(e) => handleQuestionOptionsChange(selectedQuestionIndex, optionIndex, e.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              <div className="flex items-center space-x-2">
                                <Label className="cursor-pointer">
                                  <input
                                    type="radio"
                                    className="mr-2"
                                    checked={questions[selectedQuestionIndex].correctAnswer === option}
                                    onChange={() => handleCorrectAnswerChange(selectedQuestionIndex, option)}
                                  />
                                  Correct
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveOption(selectedQuestionIndex, optionIndex)}
                                  disabled={(questions[selectedQuestionIndex].options?.length || 0) <= 2}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {questions[selectedQuestionIndex].type === "trueFalse" && (
                    <div>
                      <Label>Correct Answer</Label>
                      <div className="flex items-center space-x-4 mt-2">
                        <Label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={questions[selectedQuestionIndex].correctAnswer === "True"}
                            onChange={() => handleCorrectAnswerChange(selectedQuestionIndex, "True")}
                          />
                          <span>True</span>
                        </Label>
                        <Label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={questions[selectedQuestionIndex].correctAnswer === "False"}
                            onChange={() => handleCorrectAnswerChange(selectedQuestionIndex, "False")}
                          />
                          <span>False</span>
                        </Label>
                      </div>
                    </div>
                  )}
                  
                  {questions[selectedQuestionIndex].type === "shortAnswer" && (
                    <div>
                      <Label htmlFor="short-answer">Correct Answer</Label>
                      <Input
                        id="short-answer"
                        value={questions[selectedQuestionIndex].correctAnswer as string}
                        onChange={(e) => handleCorrectAnswerChange(selectedQuestionIndex, e.target.value)}
                        placeholder="Enter the correct answer"
                        className="mt-2"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="feedback">Feedback/Explanation (Optional)</Label>
                    <Textarea
                      id="feedback"
                      value={questions[selectedQuestionIndex].feedback || ""}
                      onChange={(e) => handleFeedbackChange(selectedQuestionIndex, e.target.value)}
                      placeholder="Provide feedback or explanation for this question"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="border rounded-md p-4 bg-gray-50">
        <h4 className="text-sm font-medium mb-2">Preview</h4>
        <QuizComponent
          quiz={{
            type: "quiz",
            id: quiz.id,
            title,
            description,
            questions,
            passingScore,
            shuffleQuestions
          }}
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}