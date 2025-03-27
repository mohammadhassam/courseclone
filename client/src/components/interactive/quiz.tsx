import React, { useState } from "react";
import { Quiz, QuizQuestion } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

interface QuizComponentProps {
  quiz: Quiz;
  className?: string;
  onComplete?: (score: number, isPassing: boolean) => void;
}

export function QuizComponent({ quiz, className, onComplete }: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Render the appropriate question type
  const renderQuestion = (question: QuizQuestion) => {
    switch (question.type) {
      case "multipleChoice":
        return renderMultipleChoice(question);
      case "trueFalse":
        return renderTrueFalse(question);
      case "shortAnswer":
        return renderShortAnswer(question);
      case "matching":
        return renderMatching(question);
      case "fillInBlank":
        return renderFillInBlank(question);
      default:
        return <p>Unsupported question type</p>;
    }
  };

  const renderMultipleChoice = (question: QuizQuestion) => {
    const questionId = question.id || `q-${currentQuestionIndex}`;
    const currentAnswer = answers[questionId] as string;

    return (
      <RadioGroup
        value={currentAnswer || ""}
        onValueChange={(value) => handleAnswerChange(questionId, value)}
        className="space-y-3"
      >
        {question.options?.map((option, index) => (
          <div key={index} className="flex items-start space-x-2">
            <RadioGroupItem value={option} id={`${questionId}-${index}`} />
            <Label htmlFor={`${questionId}-${index}`} className="cursor-pointer">
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  };

  const renderTrueFalse = (question: QuizQuestion) => {
    const questionId = question.id || `q-${currentQuestionIndex}`;
    const currentAnswer = answers[questionId] as string;

    return (
      <RadioGroup
        value={currentAnswer || ""}
        onValueChange={(value) => handleAnswerChange(questionId, value)}
        className="space-y-3"
      >
        <div className="flex items-start space-x-2">
          <RadioGroupItem value="True" id={`${questionId}-true`} />
          <Label htmlFor={`${questionId}-true`} className="cursor-pointer">True</Label>
        </div>
        <div className="flex items-start space-x-2">
          <RadioGroupItem value="False" id={`${questionId}-false`} />
          <Label htmlFor={`${questionId}-false`} className="cursor-pointer">False</Label>
        </div>
      </RadioGroup>
    );
  };

  const renderShortAnswer = (question: QuizQuestion) => {
    const questionId = question.id || `q-${currentQuestionIndex}`;
    const currentAnswer = answers[questionId] as string || "";

    return (
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Type your answer here..."
          value={currentAnswer}
          onChange={(e) => handleAnswerChange(questionId, e.target.value)}
        />
      </div>
    );
  };

  const renderMatching = (question: QuizQuestion) => {
    // For matching questions, we assume options are formatted as "left-side:right-side"
    // and we shuffle the right side options for the user to match
    const questionId = question.id || `q-${currentQuestionIndex}`;
    const currentAnswers = (answers[questionId] as string[]) || [];
    
    // Parse options to get left and right sides
    const matchOptions = question.options?.map(opt => {
      const [left, right] = opt.split(":");
      return { left, right };
    }) || [];
    
    const leftSide = matchOptions.map(opt => opt.left);
    const rightSide = matchOptions.map(opt => opt.right);
    
    return (
      <div className="space-y-4">
        {leftSide.map((left, index) => (
          <div key={index} className="flex flex-col space-y-2">
            <Label>{left}</Label>
            <select
              className="border rounded p-2"
              value={currentAnswers[index] || ""}
              onChange={(e) => {
                const newAnswers = [...currentAnswers];
                newAnswers[index] = e.target.value;
                handleAnswerChange(questionId, newAnswers);
              }}
            >
              <option value="">Select a match</option>
              {rightSide.map((right, idx) => (
                <option key={idx} value={right}>
                  {right}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  };

  const renderFillInBlank = (question: QuizQuestion) => {
    const questionId = question.id || `q-${currentQuestionIndex}`;
    const currentAnswer = answers[questionId] as string || "";
    
    // For fill in the blank, we display the question text with an input field
    // We assume blanks are marked with [blank] in the question text
    const parts = question.question.split("[blank]");
    
    if (parts.length <= 1) {
      return (
        <div className="space-y-2">
          <p>{question.question}</p>
          <Input
            type="text"
            placeholder="Type your answer here..."
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
          />
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center flex-wrap">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              <span>{part}</span>
              {index < parts.length - 1 && (
                <Input
                  type="text"
                  className="mx-1 my-1 inline-block w-32"
                  value={Array.isArray(currentAnswer) ? (currentAnswer[index] || "") : ""}
                  onChange={(e) => {
                    const newAnswers = Array.isArray(currentAnswer) 
                      ? [...currentAnswer] 
                      : new Array(parts.length - 1).fill("");
                    newAnswers[index] = e.target.value;
                    handleAnswerChange(questionId, newAnswers);
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      calculateScore();
      setShowResults(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;

    quiz.questions.forEach((question, index) => {
      const questionId = question.id || `q-${index}`;
      const userAnswer = answers[questionId];
      const correctAnswer = question.correctAnswer;

      // Check if answer is correct based on question type
      let isCorrect = false;

      if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
        // For matching or multiple selection questions
        isCorrect = correctAnswer.length === userAnswer.length &&
          correctAnswer.every((ans, i) => 
            userAnswer[i]?.toLowerCase() === ans.toLowerCase());
      } else if (!Array.isArray(correctAnswer) && !Array.isArray(userAnswer)) {
        // For simple string comparison (multiple choice, true/false, etc.)
        isCorrect = userAnswer?.toLowerCase() === correctAnswer.toLowerCase();
      }

      if (isCorrect) {
        correctCount += question.points || 1;
      }
    });

    const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const finalScore = Math.round((correctCount / totalPoints) * 100);

    setScore(finalScore);
    
    if (onComplete) {
      const isPassing = quiz.passingScore ? finalScore >= quiz.passingScore : finalScore >= 70;
      onComplete(finalScore, isPassing);
    }

    return finalScore;
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
  };

  // Quiz results screen
  if (showResults) {
    const passingScore = quiz.passingScore || 70;
    const isPassing = score >= passingScore;

    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Quiz Results
            {isPassing ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-3xl font-bold mb-2">{score}%</div>
            <p className={isPassing ? "text-green-600" : "text-red-600"}>
              {isPassing ? "Congratulations! You passed the quiz." : "You didn't meet the passing score."}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Passing score: {passingScore}%
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Question Summary</h3>
            {quiz.questions.map((question, index) => {
              const questionId = question.id || `q-${index}`;
              const userAnswer = answers[questionId];
              const correctAnswer = question.correctAnswer;
              
              // Determine if the answer was correct
              let isCorrect = false;
              if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
                isCorrect = correctAnswer.length === userAnswer.length &&
                  correctAnswer.every((ans, i) => userAnswer[i]?.toLowerCase() === ans.toLowerCase());
              } else if (!Array.isArray(correctAnswer) && !Array.isArray(userAnswer)) {
                isCorrect = userAnswer?.toLowerCase() === correctAnswer.toLowerCase();
              }
              
              return (
                <div key={index} className={cn(
                  "p-3 rounded-md border",
                  isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                )}>
                  <div className="flex justify-between">
                    <div className="font-medium">Question {index + 1}</div>
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <p className="mt-1">{question.question}</p>
                  <div className="mt-2">
                    <div className="text-sm font-medium">Your answer:</div>
                    <div className="text-sm">
                      {Array.isArray(userAnswer) 
                        ? userAnswer.join(", ") 
                        : userAnswer || "No answer provided"}
                    </div>
                  </div>
                  {!isCorrect && (
                    <div className="mt-2">
                      <div className="text-sm font-medium">Correct answer:</div>
                      <div className="text-sm">
                        {Array.isArray(correctAnswer) 
                          ? correctAnswer.join(", ") 
                          : correctAnswer}
                      </div>
                    </div>
                  )}
                  {question.feedback && (
                    <div className="mt-2 text-sm italic">
                      {question.feedback}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={resetQuiz} className="w-full">
            Retake Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Question display screen
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        <div className="text-sm text-muted-foreground mt-1">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
          {renderQuestion(currentQuestion)}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        <Button 
          onClick={handleNextQuestion}
          disabled={!answers[currentQuestion.id || `q-${currentQuestionIndex}`]}
        >
          {isLastQuestion ? "Finish Quiz" : "Next"}
        </Button>
      </CardFooter>
    </Card>
  );
}