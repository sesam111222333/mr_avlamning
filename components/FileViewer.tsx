"use client";

import { useApp } from "@/context/AppContext";
import ReactMarkdown from "react-markdown";

export function FileViewer() {
  const { selectedFile, fileContent, clearSelection } = useApp();

  if (!selectedFile) {
    return (
      <div className="w-96 bg-dracula-bg-darker border-l border-dracula-selection flex items-center justify-center">
        <div className="text-center text-dracula-comment">
          <svg
            className="w-12 h-12 mx-auto mb-3 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">Välj en fil för att visa innehållet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-dracula-bg-darker border-l border-dracula-selection flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-dracula-selection">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-dracula-cyan" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium truncate">{selectedFile}</span>
        </div>
        <button
          onClick={clearSelection}
          className="p-1 rounded hover:bg-dracula-bg-light transition-colors text-dracula-comment hover:text-dracula-foreground"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <article className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !match;
                return isInline ? (
                  <code className={className} {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="bg-dracula-bg p-3 rounded border border-dracula-selection overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
            }}
          >
            {fileContent || ""}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
