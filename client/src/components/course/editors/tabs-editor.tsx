import React, { useState } from "react";
import { TabsInteractive as TabsInteractiveType, TabContent } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsInteractive } from "@/components/interactive/tabs-interactive";
import { Trash2, Plus } from "lucide-react";
import RichTextEditor from "@/components/editor/rich-text-editor";

interface TabsEditorProps {
  tabs: TabsInteractiveType;
  onSave: (tabs: TabsInteractiveType) => void;
  onCancel: () => void;
}

export function TabsEditor({ tabs, onSave, onCancel }: TabsEditorProps) {
  const [editTabs, setEditTabs] = useState<TabContent[]>(tabs.tabs);

  const handleTabTitleChange = (index: number, title: string) => {
    const updatedTabs = [...editTabs];
    updatedTabs[index] = { ...updatedTabs[index], title };
    setEditTabs(updatedTabs);
  };

  const handleTabContentChange = (index: number, content: string) => {
    const updatedTabs = [...editTabs];
    updatedTabs[index] = { ...updatedTabs[index], content };
    setEditTabs(updatedTabs);
  };

  const handleAddTab = () => {
    setEditTabs([...editTabs, { title: `Tab ${editTabs.length + 1}`, content: "" }]);
  };

  const handleRemoveTab = (index: number) => {
    if (editTabs.length <= 1) return; // Don't allow removing all tabs
    const updatedTabs = [...editTabs];
    updatedTabs.splice(index, 1);
    setEditTabs(updatedTabs);
  };

  const handleSave = () => {
    onSave({
      type: "tabs",
      tabs: editTabs
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Edit Tabs Interaction</h3>
        <Button onClick={handleAddTab} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Tab
        </Button>
      </div>

      <div className="space-y-4">
        {editTabs.map((tab, index) => (
          <Card key={index} className="border border-gray-200">
            <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
              <div className="flex-1 mr-4">
                <Input
                  value={tab.title}
                  onChange={(e) => handleTabTitleChange(index, e.target.value)}
                  placeholder="Tab Title"
                />
              </div>
              <Button
                onClick={() => handleRemoveTab(index)}
                variant="ghost"
                size="sm"
                disabled={editTabs.length <= 1}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <RichTextEditor
                value={tab.content}
                onChange={(content) => handleTabContentChange(index, content)}
                placeholder="Enter rich content for this tab"
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border rounded-md p-4 bg-gray-50">
        <h4 className="text-sm font-medium mb-2">Preview</h4>
        <TabsInteractive tabs={editTabs} />
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