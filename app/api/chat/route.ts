import Anthropic from "@anthropic-ai/sdk";
import { promises as fs } from "fs";
import path from "path";

const FILES_DIR = path.join(process.cwd(), "files");

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: "list_files",
    description: "Lista alla filer i files-mappen",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "read_file",
    description: "Läs innehållet i en fil från files-mappen",
    input_schema: {
      type: "object" as const,
      properties: {
        filename: {
          type: "string",
          description: "Namnet på filen att läsa",
        },
      },
      required: ["filename"],
    },
  },
  {
    name: "create_file",
    description: "Skapa en ny markdown-fil i files-mappen",
    input_schema: {
      type: "object" as const,
      properties: {
        filename: {
          type: "string",
          description: "Namnet på filen (utan .md om du vill)",
        },
        content: {
          type: "string",
          description: "Innehållet i filen",
        },
      },
      required: ["filename", "content"],
    },
  },
];

async function executeTool(name: string, input: Record<string, string>) {
  switch (name) {
    case "list_files": {
      await fs.mkdir(FILES_DIR, { recursive: true });
      const entries = await fs.readdir(FILES_DIR, { withFileTypes: true });
      const files = entries.map((e) => ({
        name: e.name,
        isDirectory: e.isDirectory(),
      }));
      return JSON.stringify({ files });
    }
    case "read_file": {
      const filePath = path.join(FILES_DIR, input.filename);
      const resolvedPath = path.resolve(filePath);
      if (!resolvedPath.startsWith(FILES_DIR)) {
        return JSON.stringify({ error: "Ogiltig sökväg" });
      }
      const content = await fs.readFile(resolvedPath, "utf-8");
      return JSON.stringify({ filename: input.filename, content });
    }
    case "create_file": {
      const safeName = input.filename.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
      const finalName = safeName.endsWith(".md") ? safeName : `${safeName}.md`;
      const filePath = path.join(FILES_DIR, finalName);
      await fs.mkdir(FILES_DIR, { recursive: true });
      await fs.writeFile(filePath, input.content, "utf-8");
      return JSON.stringify({ success: true, filename: finalName });
    }
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  (async () => {
    try {
      let currentMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      let continueLoop = true;

      while (continueLoop) {
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: `Du är en hjälpsam assistent som kan läsa och skapa dokument om TV-program.
Du har tillgång till en files-mapp där användaren har sina dokument.
Använd verktygen för att läsa befintliga filer eller skapa nya markdown-filer.
Svara på svenska om användaren skriver på svenska.`,
          messages: currentMessages,
          tools,
        });

        // Check if we need to handle tool use
        if (response.stop_reason === "tool_use") {
          const toolUseBlocks = response.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
          );

          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const toolUse of toolUseBlocks) {
            const result = await executeTool(toolUse.name, toolUse.input as Record<string, string>);
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: result,
            });
          }

          // Add assistant message and tool results to continue conversation
          currentMessages.push({
            role: "assistant" as const,
            content: response.content,
          });
          currentMessages.push({
            role: "user" as const,
            content: toolResults,
          });
        } else {
          // No more tool use, send the final text response
          const textBlocks = response.content.filter(
            (block): block is Anthropic.TextBlock => block.type === "text"
          );

          for (const block of textBlocks) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ content: block.text })}\n\n`));
          }

          continueLoop = false;
        }
      }

      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch (error) {
      console.error("Chat error:", error);
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: "Ett fel uppstod" })}\n\n`)
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
