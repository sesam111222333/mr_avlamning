"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface FileInfo {
  name: string;
  isDirectory: boolean;
  size?: number;
  modified?: string;
}

interface AppContextType {
  files: FileInfo[];
  selectedFile: string | null;
  fileContent: string | null;
  refreshFiles: () => Promise<void>;
  selectFile: (filename: string) => Promise<void>;
  clearSelection: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  const refreshFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  }, []);

  const selectFile = useCallback(async (filename: string) => {
    setSelectedFile(filename);
    try {
      const res = await fetch(`/api/files/${encodeURIComponent(filename)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
      }
    } catch (error) {
      console.error("Failed to read file:", error);
      setFileContent(null);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setFileContent(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        files,
        selectedFile,
        fileContent,
        refreshFiles,
        selectFile,
        clearSelection,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
