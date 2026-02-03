import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FILES_DIR = path.join(process.cwd(), "files");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const paths = formData.getAll("paths") as string[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    await fs.mkdir(FILES_DIR, { recursive: true });

    const uploaded: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = paths[i] || file.name;

      // Security: sanitize path and prevent directory traversal
      const safePath = relativePath
        .split(/[/\\]/)
        .filter(part => part && part !== ".." && part !== ".")
        .join("/");

      const filePath = path.join(FILES_DIR, safePath);
      const resolvedPath = path.resolve(filePath);

      // Ensure we're still within FILES_DIR
      if (!resolvedPath.startsWith(FILES_DIR)) {
        continue;
      }

      // Create subdirectories if needed
      const dir = path.dirname(resolvedPath);
      await fs.mkdir(dir, { recursive: true });

      // Write file
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(resolvedPath, buffer);
      uploaded.push(safePath);
    }

    return NextResponse.json({ success: true, uploaded });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 });
  }
}
