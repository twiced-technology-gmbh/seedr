import type { RegistryManifest, RegistryItem, ComponentType } from "./types";

// Import manifest directly (bundled at build time)
import manifestData from "@registry/manifest.json";

const manifest = manifestData as RegistryManifest;

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
