import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ConversionOptions } from '../types';

interface MarkdownViewerProps {
  content: string;
  options: ConversionOptions;
  id: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, options, id }) => {
  const getFontSizeClass = () => {
    switch (options.fontSize) {
      case 'small': return 'prose-sm';
      case 'large': return 'prose-lg';
      default: return 'prose-base';
    }
  };

  const getColumnClass = () => {
    switch (options.columns) {
      case 2: return 'columns-2 gap-8';
      case 3: return 'columns-3 gap-8';
      default: return 'columns-1';
    }
  };

  return (
    <div 
      id={id} 
      className={`
        bg-white p-8 md:p-12 shadow-sm border border-gray-200 mx-auto
        transition-all duration-300 ease-in-out
        ${options.darkMode ? 'prose-invert bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}
      `}
      style={{
        width: '210mm', // A4 Width approximation for preview
        minHeight: '297mm', // A4 Height approximation
      }}
    >
      <div className={`prose max-w-none ${getFontSizeClass()} ${getColumnClass()}`}>
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownViewer;