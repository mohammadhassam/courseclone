import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your content here...",
  className = ""
}) => {
  // Local state to handle the editor value
  const [editorValue, setEditorValue] = useState('');
  
  // Convert HTML to editor format on initial load
  useEffect(() => {
    if (value) {
      // Check if the value contains HTML tags as text (not parsed)
      // This happens when AI returns HTML tags in the content
      const hasUnparsedHtmlTags = /<\/?[a-z][\s\S]*>/i.test(value) && 
                                 value.includes('&lt;') === false && 
                                 !value.startsWith('<p>');
      
      if (hasUnparsedHtmlTags) {
        // Convert the string with HTML tags into proper HTML content
        try {
          // Create a temporary div to parse the HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = value;
          setEditorValue(tempDiv.innerHTML);
        } catch (error) {
          console.error("Error parsing HTML content:", error);
          setEditorValue(value);
        }
      } else {
        setEditorValue(value);
      }
    }
  }, [value]);

  // Handle changes from the editor
  const handleChange = (content: string) => {
    setEditorValue(content);
    onChange(content);
  };

  // Define the modules for the Quill editor
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'code-block'],
      ['clean']
    ],
  };

  // Define the formats the editor should support
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'image', 'code-block',
    'color', 'background'
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={editorValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;