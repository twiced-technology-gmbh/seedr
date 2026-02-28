import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { readFileSync, existsSync } from "fs";

// Plugin to serve registry files during development
function serveRegistryPlugin() {
  const registryPath = resolve(__dirname, "../../registry");
  return {
    name: "serve-registry",
    configureServer(server: { middlewares: { use: (middleware: unknown) => void } }) {
      server.middlewares.use((req: { url?: string }, res: { statusCode: number; setHeader: (key: string, value: string) => void; end: (content?: string) => void }, next: () => void) => {
        if (req.url?.startsWith("/registry/")) {
          const filePath = resolve(registryPath, req.url.replace("/registry/", ""));
          if (existsSync(filePath)) {
            const content = readFileSync(filePath, "utf-8");
            const ext = filePath.split(".").pop();
            const mimeTypes: Record<string, string> = {
              md: "text/markdown",
              json: "application/json",
              txt: "text/plain",
            };
            res.setHeader("Content-Type", mimeTypes[ext || ""] || "text/plain");
            res.end(content);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveRegistryPlugin()],
  server: {
    port: 5176,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@registry": resolve(__dirname, "../../registry"),
    },
  },
  build: {
    outDir: "dist",
  },
});
