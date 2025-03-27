import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DragDropItem, DropZone } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle } from "lucide-react";

interface DragDropInteractiveProps {
  instructions: string;
  items: DragDropItem[];
  zones: DropZone[];
  className?: string;
}

export function DragDropInteractive({ instructions, items, zones, className }: DragDropInteractiveProps) {
  const [itemPositions, setItemPositions] = useState<Record<string, { zoneId: string | null; isCorrect: boolean | null }>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Initialize positions
  useEffect(() => {
    const initialPositions: Record<string, { zoneId: string | null; isCorrect: boolean | null }> = {};
    items.forEach(item => {
      initialPositions[item.id] = { zoneId: null, isCorrect: null };
    });
    setItemPositions(initialPositions);
  }, [items]);

  const handleDragEnd = (itemId: string, zoneId: string) => {
    setItemPositions(prev => ({
      ...prev,
      [itemId]: { zoneId, isCorrect: null }
    }));
  };

  const checkAnswers = () => {
    const newPositions = { ...itemPositions };
    
    // Check each item
    items.forEach(item => {
      const currentPosition = newPositions[item.id];
      if (currentPosition && currentPosition.zoneId) {
        currentPosition.isCorrect = currentPosition.zoneId === item.correctZone;
      }
    });
    
    setItemPositions(newPositions);
    setIsChecked(true);
    
    // Check if all items are in correct zones
    const allCorrect = items.every(item => {
      const pos = newPositions[item.id];
      return pos && pos.isCorrect === true;
    });
    
    setIsComplete(allCorrect);
  };

  const resetActivity = () => {
    const resetPositions: Record<string, { zoneId: string | null; isCorrect: boolean | null }> = {};
    items.forEach(item => {
      resetPositions[item.id] = { zoneId: null, isCorrect: null };
    });
    setItemPositions(resetPositions);
    setIsChecked(false);
    setIsComplete(false);
  };

  return (
    <div className={cn("bg-card rounded-lg border p-6", className)}>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Drag and Drop Activity</h3>
        <p className="text-muted-foreground">{instructions}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Items to drag */}
        <div className="space-y-3 border rounded-md p-4 bg-muted/30">
          <h4 className="font-medium text-sm mb-2">Items</h4>
          <div className="space-y-2">
            {items.map(item => {
              const position = itemPositions[item.id];
              const isPlaced = position && position.zoneId !== null;
              
              if (isPlaced) return null; // Don't show items that are placed in a zone
              
              return (
                <motion.div
                  key={item.id}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  className="bg-white p-3 rounded-md shadow cursor-move border select-none"
                  whileDrag={{ scale: 1.05, zIndex: 50 }}
                  onDragEnd={(_, info) => {
                    const droppedElement = document.elementsFromPoint(info.point.x, info.point.y)
                      .find(el => el.getAttribute('data-dropzone-id'));
                    
                    if (droppedElement) {
                      const zoneId = droppedElement.getAttribute('data-dropzone-id');
                      if (zoneId) handleDragEnd(item.id, zoneId);
                    }
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: item.content }} />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Drop zones */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm mb-2">Drop Zones</h4>
          {zones.map(zone => {
            // Find items placed in this zone
            const placedItems = items.filter(item => {
              const position = itemPositions[item.id];
              return position && position.zoneId === zone.id;
            });

            return (
              <div 
                key={zone.id}
                data-dropzone-id={zone.id}
                className="border rounded-md p-4 min-h-24 flex flex-col"
              >
                <h5 className="text-sm font-medium mb-2">{zone.title}</h5>
                <div className="flex-1 space-y-2">
                  {placedItems.map(item => {
                    const position = itemPositions[item.id];
                    const isCorrect = position?.isCorrect;
                    
                    return (
                      <div 
                        key={item.id}
                        className={cn(
                          "bg-white p-3 rounded-md shadow border select-none flex items-start justify-between",
                          isChecked && isCorrect === true && "border-green-400 bg-green-50",
                          isChecked && isCorrect === false && "border-red-400 bg-red-50"
                        )}
                      >
                        <div className="flex-1" dangerouslySetInnerHTML={{ __html: item.content }} />
                        {isChecked && (
                          <div className="ml-2 flex-shrink-0">
                            {isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="outline" onClick={resetActivity}>Reset</Button>
        <Button 
          onClick={checkAnswers}
          disabled={
            // Disable if any items are not assigned to a zone
            Object.values(itemPositions).some(pos => pos.zoneId === null) ||
            // Or if already complete
            isComplete
          }
        >
          {isComplete ? "Completed!" : "Check Answers"}
        </Button>
      </div>
    </div>
  );
}