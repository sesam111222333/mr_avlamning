"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useApp } from "@/context/AppContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel() {
  const { refreshFiles } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      refreshFiles();
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [messages, refreshFiles]);

  return (
    <div className="flex-1 flex flex-col h-full bg-dracula-bg">
      <div className="p-3 border-b border-dracula-selection bg-dracula-bg-darker">
        <h2 className="text-sm font-medium">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-dracula-comment max-w-md px-4">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-dracula-purple opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="text-lg font-medium text-dracula-foreground mb-2">
                Välkommen!
              </h3>
              <p className="text-sm">
                Jag kan hjälpa dig med dina TV-programdokument. Fråga mig om
                innehållet i filerna eller be mig skapa nya dokument.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-dracula-selection">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="p-4 bg-dracula-bg-darker">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded bg-dracula-pink flex items-center justify-center flex-shrink-0 text-sm font-bold text-dracula-bg">
                    AI
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-dracula-purple rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-dracula-purple rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-dracula-purple rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-sm text-dracula-comment">Tänker...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-2 bg-dracula-red bg-opacity-20 border-t border-dracula-red text-sm text-dracula-red">
          Ett fel uppstod: {error.message}
        </div>
      )}

      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
