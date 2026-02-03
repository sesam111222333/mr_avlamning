"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 p-4", isUser ? "bg-dracula-bg" : "bg-dracula-bg-darker")}>
      <div
        className={cn(
          "w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-sm font-bold",
          isUser ? "bg-dracula-purple text-dracula-bg" : "bg-dracula-pink text-dracula-bg"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="text-xs text-dracula-comment mb-1">
          {isUser ? "Du" : "Claude"}
        </div>
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>;
              },
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !match;
                return isInline ? (
                  <code
                    className="bg-dracula-bg-light px-1.5 py-0.5 rounded text-dracula-pink text-sm"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <pre className="bg-dracula-bg p-3 rounded border border-dracula-selection overflow-x-auto my-2">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
