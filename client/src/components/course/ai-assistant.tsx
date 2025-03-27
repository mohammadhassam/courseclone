import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AiAssistantProps = {
  title: string;
  description: string;
  promptLabel: string;
  promptPlaceholder: string;
  promptValue: string;
  onPromptChange: (value: string) => void;
  generateButtonText: string;
  isGenerating: boolean;
  onGenerate: () => void;
  selectOptions: { value: string; label: string }[];
  selectValue: string;
  onSelectChange: (value: string) => void;
  suggestions?: string[];
  className?: string;
};

const AiAssistant = ({
  title,
  description,
  promptLabel,
  promptPlaceholder,
  promptValue,
  onPromptChange,
  generateButtonText,
  isGenerating,
  onGenerate,
  selectOptions,
  selectValue,
  onSelectChange,
  suggestions = [],
  className = "",
}: AiAssistantProps) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {title}
          </h3>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {description}
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700">
              {promptLabel}
            </label>
            <div className="mt-1">
              <Textarea 
                id="ai-prompt" 
                rows={3} 
                className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border border-gray-300 rounded-md" 
                placeholder={promptPlaceholder}
                value={promptValue}
                onChange={(e) => onPromptChange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center">
            <Button
              variant="secondary"
              onClick={onGenerate}
              disabled={isGenerating}
              className="relative"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                generateButtonText
              )}
            </Button>
            <div className="ml-3">
              <Select value={selectValue} onValueChange={onSelectChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              AI Suggestions
            </h4>
            <ul className="space-y-3 text-sm">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAssistant;
