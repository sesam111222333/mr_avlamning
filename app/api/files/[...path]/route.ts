import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FILES_DIR = path.join(process.cwd(), "files");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const filename = pathSegments.join("/");
    const filePath = path.join(FILES_DIR, filename);

    // Security: ensure the path doesn't escape FILES_DIR
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(FILES_DIR)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const content = await fs.readFile(resolvedPath, "utf-8");
    return NextResponse.json({ content, filename });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
