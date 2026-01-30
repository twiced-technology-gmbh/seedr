import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { RegistryManifest, RegistryItem, ComponentType } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Local registry path (for development)
const REGISTRY_PATH = join(__dirname, "../../../../registry");

// Remote registry URL (GitHub raw content)
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/toolr-suite/seedr/main/registry";

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

export async function getItemContent(
  item: RegistryItem,
  variant?: string
): Promise<string> {
  // External items (official/community plugins) don't have local source
  if (!item.source) {
    throw new Error(`Item "${item.slug}" is external and has no local source. Visit: ${item.externalUrl}`);
  }

  const typeDir = item.type + "s";
  const basePath = join(REGISTRY_PATH, typeDir, item.slug);

  const getFilePath = (filename: string) => ({
    local: join(basePath, filename),
    remote: `${GITHUB_RAW_URL}/${typeDir}/${item.slug}/${filename}`,
  });

  const variantFilename = variant && item.variants?.[variant as keyof typeof item.variants];
  const paths = variantFilename
    ? getFilePath(`variants/${variantFilename}`)
    : getFilePath(item.source);

  // Try local first (for development)
  try {
    return await readFile(paths.local, "utf-8");
  } catch {
    // Fall back to remote (GitHub)
    return fetchRemote(paths.remote);
  }
}

export function clearCache(): void {
  manifestCache.clear();
}

export function getItemSourcePath(item: RegistryItem, variant?: string): string | null {
  // External items don't have local source paths
  if (!item.source) {
    return null;
  }

  const typeDir = item.type + "s";
  const basePath = join(REGISTRY_PATH, typeDir, item.slug);

  if (variant && item.variants?.[variant as keyof typeof item.variants]) {
    return join(basePath, "variants", item.variants[variant as keyof typeof item.variants]!);
  }

  return join(basePath, item.source);
}
