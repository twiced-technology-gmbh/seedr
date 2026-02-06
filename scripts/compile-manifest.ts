#!/usr/bin/env npx tsx
/**
 * Compile individual item.json files into registry/manifest.json.
 *
 * Usage: npx tsx scripts/compile-manifest.ts
 *
 * Reads registry/<type>s/<slug>/item.json files, sorts by sourceType then slug,
 * and writes the assembled manifest.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { basename, dirname, join } from "path";
import { fileURLToPath } from "url";
import type { Manifest, ManifestItem, SourceType } from "./sync/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryDir = join(__dirname, "..", "registry");
const manifestPath = join(registryDir, "manifest.json");

const SOURCE_ORDER: Record<SourceType, number> = {
  toolr: 0,
  community: 1,
  official: 2,
};

export function readAllItems(): ManifestItem[] {
  const items: ManifestItem[] = [];

  // Each top-level dir in registry/ is a type category (skills/, plugins/, hooks/, etc.)
  for (const typeDir of readdirSync(registryDir, { withFileTypes: true })) {
    if (!typeDir.isDirectory()) continue;
    const typePath = join(registryDir, typeDir.name);

    // Each subdir is a slug
    for (const slugDir of readdirSync(typePath, { withFileTypes: true })) {
      if (!slugDir.isDirectory()) continue;
      const itemJsonPath = join(typePath, slugDir.name, "item.json");
      if (!existsSync(itemJsonPath)) continue;

      const content = readFileSync(itemJsonPath, "utf-8");
      items.push(JSON.parse(content) as ManifestItem);
    }
  }

  return items;
}

export function compileManifest(): Manifest {
  const items = readAllItems();

  // Sort: by sourceType order, then alphabetically by slug
  items.sort((a, b) => {
    const orderDiff = SOURCE_ORDER[a.sourceType] - SOURCE_ORDER[b.sourceType];
    if (orderDiff !== 0) return orderDiff;
    return a.slug.localeCompare(b.slug);
  });

  const manifest: Manifest = {
    version: "1.0.0",
    items,
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`Compiled ${items.length} items into manifest.json`);
  console.log(
    `  - toolr: ${items.filter((i) => i.sourceType === "toolr").length}`
  );
  console.log(
    `  - community: ${items.filter((i) => i.sourceType === "community").length}`
  );
  console.log(
    `  - official: ${items.filter((i) => i.sourceType === "official").length}`
  );

  return manifest;
}

// Run directly when invoked as a script
if (
  process.argv[1] &&
  basename(process.argv[1]).includes("compile-manifest")
) {
  compileManifest();
}
