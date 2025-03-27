import React, { useState } from "react";
import { 
  InteractiveContent, 
  InteractiveContentType,
  TabsInteractive as TabsInteractiveType,
  DragDropInteractive as DragDropInteractiveType,
  Quiz 
} from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsEditor } from "./tabs-editor";
import { DragDropEditor } from "./drag-drop-editor";
import { QuizEditor } from "./quiz-editor";

interface InteractiveEditorProps {
  element: InteractiveContent;
  onSave: (element: InteractiveContent) => void;
  onCancel: () => void;
}

export function InteractiveEditor({ element, onSave, onCancel }: InteractiveEditorProps) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {element.type === "tabs" && "Edit Tabs Interaction"}
            {element.type === "dragDrop" && "Edit Drag & Drop Activity"}
            {element.type === "quiz" && "Edit Quiz"}
          </h3>
          <Button 
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {element.type === "tabs" && (
          <TabsEditor 
            tabs={element as TabsInteractiveType} 
            onSave={onSave} 
            onCancel={onCancel} 
          />
        )}
        
        {element.type === "dragDrop" && (
          <DragDropEditor 
            dragDrop={element as DragDropInteractiveType} 
            onSave={onSave} 
            onCancel={onCancel} 
          />
        )}
        
        {element.type === "quiz" && (
          <QuizEditor 
            quiz={element as Quiz} 
            onSave={onSave} 
            onCancel={onCancel} 
          />
        )}
      </CardContent>
    </Card>
  );
}