import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className = "" }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read the file as a data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {preview ? (
        <div className="relative w-full">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto rounded-md object-cover aspect-video"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          onClick={triggerFileInput}
          className="border-2 border-dashed border-gray-300 rounded-md p-6 w-full flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors aspect-video bg-gray-50"
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 text-center">
            Click to upload a cover image
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG, or GIF (recommended: 1280x720)
          </p>
        </div>
      )}
    </div>
  );
}