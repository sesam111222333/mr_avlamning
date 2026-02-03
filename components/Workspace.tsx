"use client";

import { AppProvider } from "@/context/AppContext";
import { FileExplorer } from "./FileExplorer";
import { ChatPanel } from "./ChatPanel";
import { FileViewer } from "./FileViewer";

export function Workspace() {
  return (
    <AppProvider>
      <div className="h-screen flex bg-dracula-bg">
        <FileExplorer />
        <ChatPanel />
        <FileViewer />
      </div>
    </AppProvider>
  );
}
