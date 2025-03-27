import React from "react";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  BookOpen, 
  FileText, 
  Wrench, 
  Search, 
  Award, 
  PenTool 
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BloomsTaxonomyLevel, bloomsTaxonomyLevels } from "@shared/schema";

// Define descriptions for each taxonomy level
const taxonomyDescriptions: Record<BloomsTaxonomyLevel, string> = {
  remember: "Recalls facts, terms, basic concepts, or answers.",
  understand: "Demonstrates understanding of facts and ideas by organizing, comparing, translating, interpreting, or stating main ideas.",
  apply: "Uses knowledge or principles in new situations, applies theories to practical situations, solves problems.",
  analyze: "Breaks down information into component parts, determines how parts relate to one another, identifies motives or causes.",
  evaluate: "Makes judgments about information, validity of ideas, or quality of work based on a set of criteria.",
  create: "Builds a structure or pattern from diverse elements, puts parts together to form a whole, creates a new meaning or structure.",
};

// Define icons for each taxonomy level
const taxonomyIcons: Record<BloomsTaxonomyLevel, React.ReactNode> = {
  remember: <BookOpen className="h-4 w-4 mr-2" />,
  understand: <FileText className="h-4 w-4 mr-2" />,
  apply: <Wrench className="h-4 w-4 mr-2" />,
  analyze: <Search className="h-4 w-4 mr-2" />,
  evaluate: <Award className="h-4 w-4 mr-2" />,
  create: <PenTool className="h-4 w-4 mr-2" />,
};

// Define colors for each taxonomy level
const taxonomyColors: Record<BloomsTaxonomyLevel, string> = {
  remember: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  understand: "bg-green-100 text-green-800 hover:bg-green-200",
  apply: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  analyze: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  evaluate: "bg-red-100 text-red-800 hover:bg-red-200",
  create: "bg-purple-100 text-purple-800 hover:bg-purple-200",
};

interface TaxonomySelectorProps {
  value: BloomsTaxonomyLevel;
  onChange: (value: BloomsTaxonomyLevel) => void;
  label?: string;
  showHelp?: boolean;
}

const TaxonomySelector: React.FC<TaxonomySelectorProps> = ({ 
  value, 
  onChange, 
  label = "Bloom's Taxonomy Level",
  showHelp = true
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center">
        {label && <Label className="mr-2">{label}</Label>}
        {showHelp && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Bloom's Taxonomy classifies learning objectives into six cognitive levels of complexity.</p>
                <p>Higher levels build on lower levels, creating a hierarchy of learning objectives.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <Select value={value} onValueChange={(val) => onChange(val as BloomsTaxonomyLevel)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {bloomsTaxonomyLevels.map((level) => (
            <SelectItem key={level} value={level}>
              <div className="flex items-center">
                {taxonomyIcons[level]}
                <span className="capitalize">{level}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="pt-2">
        <Badge 
          variant="outline" 
          className={`${taxonomyColors[value]} flex items-center capitalize mt-1`}
        >
          {taxonomyIcons[value]}
          <span>{value}</span>
        </Badge>
        <p className="text-sm text-muted-foreground mt-1">
          {taxonomyDescriptions[value]}
        </p>
      </div>
    </div>
  );
};

export default TaxonomySelector;