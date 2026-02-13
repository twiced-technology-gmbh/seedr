#!/usr/bin/env npx tsx
/**
 * Compile individual item.json files into registry/manifest.json.
 *
 * Usage: npx tsx scripts/compile-manifest.ts
 *
 * Reads registry/<type>s/<slug>/item.json files, sorts by sourceType then slug,
 * and writes the assembled manifest.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { basename, dirname, join, relative } from "path";
import { fileURLToPath } from "url";
import type { ComponentType, Manifest, ManifestIndex, ManifestItem, SourceType, TypeManifest } from "./sync/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryDir = join(__dirname, "..", "registry");
const manifestPath = join(registryDir, "manifest.json");

const SOURCE_ORDER: Record<SourceType, number> = {
  toolr: 0,
  community: 1,
  official: 2,
};

function collectFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else if (entry.name !== "item.json") {
      files.push(full);
    }
  }
  return files;
}

function computeLocalContentHash(itemDir: string): string | null {
  const files = collectFiles(itemDir).sort();
  if (files.length === 0) return null;

  const hash = createHash("sha256");
  for (const file of files) {
    const rel = relative(itemDir, file);
    const content = readFileSync(file);
    hash.update(`${rel}:${createHash("sha1").update(content).digest("hex")}\n`);
  }
  return hash.digest("hex").slice(0, 16);
}

export function readAllItems(): ManifestItem[] {
  const items: ManifestItem[] = [];

  // Each top-level dir in registry/ is a type category (skills/, plugins/, hooks/, etc.)
  for (const typeDir of readdirSync(registryDir, { withFileTypes: true })) {
    if (!typeDir.isDirectory()) continue;
    const typePath = join(registryDir, typeDir.name);

    // Each subdir is a slug
    for (const slugDir of readdirSync(typePath, { withFileTypes: true })) {
      if (!slugDir.isDirectory()) continue;
      const itemDir = join(typePath, slugDir.name);
      const itemJsonPath = join(itemDir, "item.json");
      if (!existsSync(itemJsonPath)) continue;

      const content = readFileSync(itemJsonPath, "utf-8");
      const item = JSON.parse(content) as ManifestItem;

      // Compute content hash for toolr items from local files
      if (item.sourceType === "toolr") {
        const contentHash = computeLocalContentHash(itemDir);
        if (contentHash) {
          item.contentHash = contentHash;
        }
      }

      items.push(item);
    }
  }

  return items;
}

const ALL_TYPES: ComponentType[] = ["skill", "plugin", "hook", "agent", "mcp", "settings", "command"];

function typeDirName(type: ComponentType): string {
  return type === "settings" || type === "mcp" ? type : type + "s";
}

function typeManifestPath(type: ComponentType): string {
  return `${typeDirName(type)}/manifest.json`;
}

export function compileManifest(): Manifest {
  const items = readAllItems();

  // Sort: by sourceType order, then alphabetically by slug
  items.sort((a, b) => {
    const orderDiff = SOURCE_ORDER[a.sourceType] - SOURCE_ORDER[b.sourceType];
    if (orderDiff !== 0) return orderDiff;
    return a.slug.localeCompare(b.slug);
  });

  // Group items by type
  const byType = new Map<ComponentType, ManifestItem[]>();
  for (const item of items) {
    const group = byType.get(item.type) ?? [];
    group.push(item);
    byType.set(item.type, group);
  }

  // Write per-type manifest files into their type folders
  for (const type of ALL_TYPES) {
    const typeItems = byType.get(type) ?? [];
    const typeManifest: TypeManifest = { type, items: typeItems };
    const dirPath = join(registryDir, typeDirName(type));
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    writeFileSync(join(registryDir, typeManifestPath(type)), JSON.stringify(typeManifest, null, 2) + "\n");
  }

  // Build index with all types
  const types = {} as ManifestIndex["types"];
  for (const type of ALL_TYPES) {
    types[type] = { file: typeManifestPath(type), count: byType.get(type)?.length ?? 0 };
  }

  const index: ManifestIndex = { version: "2.0.0", types };
  writeFileSync(manifestPath, JSON.stringify(index, null, 2) + "\n");

  console.log(`Compiled ${items.length} items into split manifests`);
  for (const type of ALL_TYPES) {
    const count = byType.get(type)?.length ?? 0;
    if (count > 0) {
      console.log(`  - ${typeManifestPath(type)}: ${count} items`);
    }
  }

  // Return assembled Manifest for callers (e.g. sync.ts)
  return { version: "2.0.0", items };
}

// Run directly when invoked as a script
if (
  process.argv[1] &&
  basename(process.argv[1]).includes("compile-manifest")
) {
  compileManifest();
}
