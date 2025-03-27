import React, { useState } from "react";
import { 
  DragDropInteractive as DragDropInteractiveType, 
  DragDropItem, 
  DropZone 
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropInteractive } from "@/components/interactive/drag-drop-interactive";
import { Trash2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";

interface DragDropEditorProps {
  dragDrop: DragDropInteractiveType;
  onSave: (dragDrop: DragDropInteractiveType) => void;
  onCancel: () => void;
}

export function DragDropEditor({ dragDrop, onSave, onCancel }: DragDropEditorProps) {
  const [instructions, setInstructions] = useState(dragDrop.instructions);
  const [items, setItems] = useState<DragDropItem[]>(dragDrop.items);
  const [zones, setZones] = useState<DropZone[]>(dragDrop.zones);

  const handleAddItem = () => {
    const newId = `item${items.length + 1}`;
    setItems([
      ...items,
      {
        id: newId,
        content: `Item ${items.length + 1}`,
        correctZone: zones.length > 0 ? zones[0].id : ""
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const handleItemChange = (index: number, field: keyof DragDropItem, value: string) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleAddZone = () => {
    const newId = `zone${zones.length + 1}`;
    setZones([
      ...zones,
      {
        id: newId,
        title: `Category ${zones.length + 1}`
      }
    ]);
  };

  const handleRemoveZone = (index: number) => {
    if (zones.length <= 1) return; // Keep at least one zone
    
    const removedZoneId = zones[index].id;
    const updatedZones = [...zones];
    updatedZones.splice(index, 1);
    
    // Update any items that were assigned to the removed zone
    const defaultZoneId = updatedZones.length > 0 ? updatedZones[0].id : "";
    const updatedItems = items.map(item => {
      if (item.correctZone === removedZoneId) {
        return { ...item, correctZone: defaultZoneId };
      }
      return item;
    });
    
    setZones(updatedZones);
    setItems(updatedItems);
  };

  const handleZoneChange = (index: number, title: string) => {
    const updatedZones = [...zones];
    updatedZones[index] = { ...updatedZones[index], title };
    setZones(updatedZones);
  };

  const handleSave = () => {
    onSave({
      type: "dragDrop",
      instructions,
      items,
      zones
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Edit Drag & Drop Activity</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="instructions">Instructions</Label>
          <Textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter instructions for the activity"
            className="min-h-[80px] mt-2"
          />
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">Drop Zones/Categories</h4>
            <Button onClick={handleAddZone} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Zone
            </Button>
          </div>
          
          <div className="space-y-3">
            {zones.map((zone, index) => (
              <div key={zone.id} className="flex items-center space-x-3">
                <Input
                  value={zone.title}
                  onChange={(e) => handleZoneChange(index, e.target.value)}
                  placeholder="Zone Title"
                  className="flex-1"
                />
                <Button
                  onClick={() => handleRemoveZone(index)}
                  variant="ghost"
                  size="sm"
                  disabled={zones.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">Draggable Items</h4>
            <Button onClick={handleAddItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center space-x-3">
                <Input
                  value={item.content}
                  onChange={(e) => handleItemChange(index, "content", e.target.value)}
                  placeholder="Item Content"
                  className="flex-1"
                />
                <Select
                  value={item.correctZone}
                  onValueChange={(value) => handleItemChange(index, "correctZone", value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select correct zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => handleRemoveItem(index)}
                  variant="ghost"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border rounded-md p-4 bg-gray-50">
        <h4 className="text-sm font-medium mb-2">Preview</h4>
        <DragDropInteractive
          instructions={instructions}
          items={items}
          zones={zones}
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