"use client";

import { useEffect, useState, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

function FileIcon({ isDirectory }: { isDirectory: boolean }) {
  if (isDirectory) {
    return (
      <svg className="w-4 h-4 text-dracula-orange" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-dracula-cyan" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

async function getAllFileEntries(dataTransferItemList: DataTransferItemList): Promise<{ file: File; path: string }[]> {
  const fileEntries: { file: File; path: string }[] = [];

  async function traverseFileTree(entry: FileSystemEntry, path: string): Promise<void> {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject);
      });
      fileEntries.push({ file, path: path + file.name });
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const reader = dirEntry.createReader();
      const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });
      for (const subEntry of entries) {
        await traverseFileTree(subEntry, path + entry.name + "/");
      }
    }
  }

  const items = Array.from(dataTransferItemList);
  for (const item of items) {
    if (item.kind === "file") {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        await traverseFileTree(entry, "");
      }
    }
  }

  return fileEntries;
}

export function FileExplorer() {
  const { files, selectedFile, refreshFiles, selectFile } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setIsUploading(true);

    try {
      const fileEntries = await getAllFileEntries(e.dataTransfer.items);

      if (fileEntries.length === 0) {
        return;
      }

      const formData = new FormData();
      for (const { file, path } of fileEntries) {
        formData.append("files", file);
        formData.append("paths", path);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await refreshFiles();
      } else {
        console.error("Upload failed");
      }
    } catch (error) {
      console.error("Drop error:", error);
    } finally {
      setIsUploading(false);
    }
  }, [refreshFiles]);

  return (
    <div
      className={cn(
        "w-64 bg-dracula-bg-darker border-r border-dracula-selection flex flex-col h-full transition-colors",
        isDragging && "bg-dracula-purple bg-opacity-20 border-dracula-purple"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-3 border-b border-dracula-selection">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-dracula-comment">
          Explorer
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isDragging ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-dracula-purple">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium">Släpp filer här</p>
            </div>
          </div>
        ) : isUploading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-dracula-comment">
              <svg className="w-8 h-8 mx-auto mb-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm">Laddar upp...</p>
            </div>
          </div>
        ) : (
          <div className="mb-2">
            <div className="flex items-center gap-1 px-2 py-1 text-xs text-dracula-comment uppercase">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Files
            </div>
            {files.length === 0 ? (
              <div className="px-4 py-8 text-center text-dracula-comment">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs">Dra och släpp filer här</p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {files.map((file) => (
                  <li key={file.name}>
                    <button
                      onClick={() => selectFile(file.name)}
                      className={cn(
                        "w-full flex items-center gap-2 px-4 py-1 text-sm text-left rounded transition-colors",
                        selectedFile === file.name
                          ? "bg-dracula-selection text-dracula-foreground"
                          : "text-dracula-foreground hover:bg-dracula-bg-light"
                      )}
                    >
                      <FileIcon isDirectory={file.isDirectory} />
                      <span className="truncate">{file.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
