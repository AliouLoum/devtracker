import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
  content: string;
  filename: string;
}

const getLanguage = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'html':
      return 'html';
    case 'css':
    case 'scss':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    default:
      return 'text';
  }
};

export const CodeViewer: React.FC<CodeViewerProps> = ({ content, filename }) => {
  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <div className="bg-muted px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border flex items-center">
        {filename}
      </div>
      <SyntaxHighlighter
        language={getLanguage(filename)}
        style={vscDarkPlus}
        customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.875rem' }}
        showLineNumbers={true}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};
