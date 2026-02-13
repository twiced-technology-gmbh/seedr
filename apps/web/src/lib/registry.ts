import type { RegistryManifest, RegistryItem, ComponentType } from "./types";

// Import split manifest files (bundled at build time)
import indexData from "@registry/manifest.json";
import skillsData from "@registry/skills/manifest.json";
import pluginsData from "@registry/plugins/manifest.json";
import hooksData from "@registry/hooks/manifest.json";
import agentsData from "@registry/agents/manifest.json";
import mcpData from "@registry/mcp/manifest.json";
import settingsData from "@registry/settings/manifest.json";
import commandsData from "@registry/commands/manifest.json";

// Dev-only test item for testing media previews (uses local files in /public/dev-samples/)
const devTestItem: RegistryItem = {
  slug: "media-preview-test",
  name: "Media Preview Test",
  type: "skill",
  description: "Test item for previewing various media formats (dev only)",
  compatibility: ["claude"],
  sourceType: "toolr",
  author: { name: "TwiceD Technology" },
  externalUrl: "local://dev-samples",
  contents: {
    files: [
      { name: "sample.png", type: "file" },
      { name: "sample.jpg", type: "file" },
      { name: "sample.gif", type: "file" },
      { name: "sample.svg", type: "file" },
      { name: "sample.webp", type: "file" },
      { name: "sample.mp3", type: "file" },
      { name: "sample.mp4", type: "file" },
      { name: "sample.pdf", type: "file" },
    ],
  },
};

// Assemble all type manifests into a single RegistryManifest
const allItems: RegistryItem[] = [
  ...skillsData.items,
  ...pluginsData.items,
  ...hooksData.items,
  ...agentsData.items,
  ...mcpData.items,
  ...settingsData.items,
  ...commandsData.items,
] as RegistryItem[];

const baseManifest: RegistryManifest = {
  version: indexData.version,
  items: allItems,
};

const manifest: RegistryManifest = import.meta.env.DEV
  ? { ...baseManifest, items: [devTestItem, ...baseManifest.items] }
  : baseManifest;

export function getManifest(): RegistryManifest {
  return manifest;
}

export function getAllItems(): RegistryItem[] {
  return manifest.items;
}

export function getItemsByType(type: ComponentType): RegistryItem[] {
  return manifest.items.filter((item) => item.type === type);
}

export function getItem(slug: string): RegistryItem | undefined {
  return manifest.items.find((item) => item.slug === slug);
}

// Lazy-import item.json files for longDescription lookup (stripped from manifests).
// Each entry is an async () => module, loaded only when requested.
const itemJsonLoaders = import.meta.glob<{ default: RegistryItem }>(
  "@registry/*/*/item.json",
);

// Build a slug → loader map for O(1) lookup
const loaderBySlug = new Map<string, () => Promise<{ default: RegistryItem }>>();
for (const [path, loader] of Object.entries(itemJsonLoaders)) {
  // path: /registry/<type>/<slug>/item.json → extract slug
  const parts = path.split("/");
  const slug = parts[parts.length - 2];
  if (slug) loaderBySlug.set(slug, loader);
}

const longDescriptionCache = new Map<string, string>();

export async function getLongDescription(slug: string): Promise<string | undefined> {
  if (longDescriptionCache.has(slug)) return longDescriptionCache.get(slug);

  const loader = loaderBySlug.get(slug);
  if (!loader) return undefined;

  const mod = await loader();
  const desc = mod.default?.longDescription;
  if (desc) longDescriptionCache.set(slug, desc);
  return desc;
}

export function getFeaturedItems(): RegistryItem[] {
  return manifest.items.filter((item) => item.featured);
}

export function getTypeCount(type: ComponentType): number {
  return manifest.items.filter((item) => item.type === type).length;
}

export function getTypeCounts(): Record<ComponentType, number> {
  const counts: Record<ComponentType, number> = {
    skill: 0,
    hook: 0,
    agent: 0,
    plugin: 0,
    command: 0,
    settings: 0,
    mcp: 0,
  };

  for (const item of manifest.items) {
    counts[item.type]++;
  }

  return counts;
}
