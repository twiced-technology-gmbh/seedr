import type { RegistryManifest, RegistryItem, ComponentType } from "./types";

// Import manifest directly (bundled at build time)
import manifestData from "@registry/manifest.json";

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

const baseManifest = manifestData as RegistryManifest;

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
