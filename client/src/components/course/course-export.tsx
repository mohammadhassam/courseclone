import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileDownIcon, 
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  CheckCircle2Icon,
  Loader2Icon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type CourseExportProps = {
  courseId: number | null;
};

type ExportFormat = "pdf" | "scorm" | "xapi";

const CourseExport = ({ courseId }: CourseExportProps) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!courseId) {
      toast({
        title: "Export failed",
        description: "Course ID is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);
      
      // Create a hidden anchor element to handle the file download
      const downloadLink = document.createElement('a');
      downloadLink.href = `/api/courses/${courseId}/export?format=${exportFormat}`;
      downloadLink.download = `course-${courseId}-${exportFormat}.zip`; // Suggested filename
      document.body.appendChild(downloadLink);
      
      // Trigger the download
      downloadLink.click();
      
      // Clean up
      document.body.removeChild(downloadLink);
      
      // Show success message
      toast({
        title: "Export initiated",
        description: `Your course is being exported as ${exportFormat.toUpperCase()}. The download should begin shortly.`,
        variant: "default",
      });
      
      // Set a timeout to reset the exporting state
      setTimeout(() => {
        setIsExporting(false);
      }, 3000);
    } catch (error) {
      console.error("Export failed:", error);
      setIsExporting(false);
      
      toast({
        title: "Export failed",
        description: "There was an error exporting your course. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">Export Course</h3>
        
        <div className="mb-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileDownIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Download Your Course</h4>
              <p className="text-xs text-gray-500 mt-1">
                Export your course in different formats for use in LMS platforms or as standalone material
              </p>
            </div>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="export-format" className="block text-sm font-medium mb-2">
                Select Format
              </label>
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                <SelectTrigger id="export-format" className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center">
                      <FileTextIcon className="h-4 w-4 mr-2 text-red-500" />
                      <span>PDF Document</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="scorm">
                    <div className="flex items-center">
                      <FileSpreadsheetIcon className="h-4 w-4 mr-2 text-blue-500" />
                      <span>SCORM 2004 Package</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="xapi">
                    <div className="flex items-center">
                      <FileIcon className="h-4 w-4 mr-2 text-green-500" />
                      <span>xAPI Package</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h5 className="font-medium text-sm mb-2">About this format</h5>
            {exportFormat === "pdf" && (
              <p className="text-sm text-gray-600">
                PDF is a portable document format that can be viewed on any device.
                Perfect for printing or sharing your course as a static document.
              </p>
            )}
            {exportFormat === "scorm" && (
              <p className="text-sm text-gray-600">
                SCORM 2004 is a standard for e-learning content used by most Learning Management Systems (LMS).
                Export to this format for uploading to platforms like Moodle, Canvas, or Blackboard.
              </p>
            )}
            {exportFormat === "xapi" && (
              <p className="text-sm text-gray-600">
                xAPI (Experience API) is a modern e-learning specification that allows for more detailed
                tracking of learning activities and is supported by many LMS platforms.
              </p>
            )}
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDownIcon className="h-4 w-4 mr-2" />
                Export as {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-3">Also available</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileTextIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">HTML Version</span>
              </div>
              <span className="text-xs text-gray-500">Coming soon</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">SCORM 1.2</span>
              </div>
              <span className="text-xs text-gray-500">Coming soon</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseExport;