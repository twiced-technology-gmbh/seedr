import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { RegistryManifest, RegistryItem, ComponentType } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Local registry path (for development)
const REGISTRY_PATH = join(__dirname, "../../../../registry");

// Remote registry URL (GitHub raw content)
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/twiced-technology-gmbh/seedr/main/registry";

/** Encapsulated manifest cache */
const manifestCache = {
  data: null as RegistryManifest | null,
  get(): RegistryManifest | null {
    return this.data;
  },
  set(manifest: RegistryManifest): void {
    this.data = manifest;
  },
  clear(): void {
    this.data = null;
  },
};

async function fetchRemote(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.text();
}

export async function loadManifest(): Promise<RegistryManifest> {
  const cached = manifestCache.get();
  if (cached) {
    return cached;
  }

  // Try local registry first (for development)
  try {
    const manifestPath = join(REGISTRY_PATH, "manifest.json");
    const content = await readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(content) as RegistryManifest;
    manifestCache.set(manifest);
    return manifest;
  } catch {
    // Fall back to remote (GitHub)
    try {
      const content = await fetchRemote(`${GITHUB_RAW_URL}/manifest.json`);
      const manifest = JSON.parse(content) as RegistryManifest;
      manifestCache.set(manifest);
      return manifest;
    } catch (error) {
      throw new Error(
        `Could not load registry manifest: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

export async function getItem(slug: string): Promise<RegistryItem | undefined> {
  const manifest = await loadManifest();
  return manifest.items.find((item) => item.slug === slug);
}

export async function listItems(
  type?: ComponentType
): Promise<RegistryItem[]> {
  const manifest = await loadManifest();
  if (type) {
    return manifest.items.filter((item) => item.type === type);
  }
  return manifest.items;
}

export async function searchItems(query: string): Promise<RegistryItem[]> {
  const manifest = await loadManifest();
  const lowerQuery = query.toLowerCase();
  return manifest.items.filter(
    (item) =>
      item.slug.toLowerCase().includes(lowerQuery) ||
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get the base URL for fetching item content.
 * Items have an externalUrl pointing to their GitHub directory.
 */
function getItemBaseUrl(item: RegistryItem): { local: string | null; remote: string } {
  // For external items (Anthropic repos), extract raw URL from externalUrl
  if (item.externalUrl) {
    // Convert tree URL to raw URL
    // https://github.com/anthropics/skills/tree/main/skills/pdf
    // → https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf
    const rawUrl = item.externalUrl
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/tree/", "/");
    return { local: null, remote: rawUrl };
  }

  // For local/toolr items, use the local registry path
  const typeDir = item.type + "s";
  return {
    local: join(REGISTRY_PATH, typeDir, item.slug),
    remote: `${GITHUB_RAW_URL}/${typeDir}/${item.slug}`,
  };
}

/**
 * Fetch the main content file for an item (e.g., SKILL.md).
 */
export async function getItemContent(item: RegistryItem): Promise<string> {
  const { local, remote } = getItemBaseUrl(item);

  // Determine the main file based on type
  const mainFile = item.type === "skill" ? "SKILL.md" : `${item.type}.md`;

  // Try local first (for development with toolr items)
  if (local) {
    try {
      return await readFile(join(local, mainFile), "utf-8");
    } catch {
      // Fall through to remote
    }
  }

  // Fetch from remote
  return fetchRemote(`${remote}/${mainFile}`);
}

/**
 * Get the local source path for an item (for symlink mode).
 * Returns null if item is external.
 */
export function getItemSourcePath(item: RegistryItem): string | null {
  // External items (official/community) don't have local paths
  if (item.sourceType !== "toolr") {
    return null;
  }

  const typeDir = item.type + "s";
  return join(REGISTRY_PATH, typeDir, item.slug);
}

/**
 * List all files in an item's directory (for copying entire skill folders).
 */
export async function listItemFiles(item: RegistryItem): Promise<string[]> {
  const { local } = getItemBaseUrl(item);

  if (!local) {
    // For external items, we can't easily list files
    // Return common skill structure
    return ["SKILL.md"];
  }

  const files: string[] = [];

  async function walkDir(dir: string, prefix = ""): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walkDir(join(dir, entry.name), relativePath);
      } else {
        files.push(relativePath);
      }
    }
  }

  try {
    await walkDir(local);
  } catch {
    // Directory doesn't exist locally
  }

  return files;
}

export function clearCache(): void {
  manifestCache.clear();
}
