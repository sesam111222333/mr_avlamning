import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FILES_DIR = path.join(process.cwd(), "files");

export async function GET() {
  try {
    await fs.mkdir(FILES_DIR, { recursive: true });
    const entries = await fs.readdir(FILES_DIR, { withFileTypes: true });

    const files = await Promise.all(
      entries.map(async (entry) => {
        const filePath = path.join(FILES_DIR, entry.name);
        const stats = await fs.stat(filePath);
        return {
          name: entry.name,
          isDirectory: entry.isDirectory(),
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      })
    );

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { filename, content } = await request.json();

    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const safeName = filename.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    const finalName = safeName.endsWith(".md") ? safeName : `${safeName}.md`;
    const filePath = path.join(FILES_DIR, finalName);

    await fs.mkdir(FILES_DIR, { recursive: true });
    await fs.writeFile(filePath, content || "", "utf-8");

    return NextResponse.json({ success: true, filename: finalName });
  } catch (error) {
    console.error("Error creating file:", error);
    return NextResponse.json({ error: "Failed to create file" }, { status: 500 });
  }
}
