#!/usr/bin/env npx tsx
/**
 * Main sync orchestrator.
 * Syncs items from all configured sources and updates the manifest.
 *
 * Usage: npx tsx scripts/sync.ts
 *
 * Sources:
 * - anthropic: Skills and plugins from Anthropic repos
 * - community: Manually-added community items (re-synced from their GitHub repos)
 * - toolr: (future) Toolr Suite items from toolr-suite repos
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { syncAnthropic } from "./sync/anthropic.js";
import { syncCommunity } from "./sync/community.js";
import type { Manifest, ManifestItem } from "./sync/types.js";

const manifestPath = join(process.cwd(), "registry/manifest.json");

async function main() {
  console.log("Starting manifest sync...\n");

  // Read existing manifest
  const manifest: Manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  // Keep toolr items (always manually maintained)
  const toolrItems = manifest.items.filter((item) => item.sourceType === "toolr");

  // Track existing synced items in case sync fails
  const existingSyncedItems = manifest.items.filter((item) => item.sourceType !== "toolr");

  // Sync from all sources
  const syncedItems: ManifestItem[] = [];

  // Anthropic (skills + plugins)
  const anthropicItems = await syncAnthropic();
  syncedItems.push(...anthropicItems);

  // Future: Add more sync sources here
  // const toolrItems = await syncToolr();
  // syncedItems.push(...toolrItems);

  // Only update if we fetched items, otherwise keep existing
  if (syncedItems.length > 0) {
    // Find manually-added community items (not covered by Anthropic sync)
    const syncedSlugs = new Set(syncedItems.map((item) => item.slug));
    const manualCommunityItems = manifest.items.filter(
      (item) => item.sourceType === "community" && !syncedSlugs.has(item.slug)
    );

    // Re-sync manual community items from their GitHub repos
    const updatedCommunityItems = await syncCommunity(manualCommunityItems);

    manifest.items = [...toolrItems, ...updatedCommunityItems, ...syncedItems];
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

    console.log(`\n✓ Updated manifest.json`);
    console.log(`  - Toolr: ${toolrItems.length}`);
    console.log(`  - Community (manual): ${updatedCommunityItems.length}`);
    console.log(`  - Synced (Anthropic): ${syncedItems.length}`);
    console.log(`  - Total: ${manifest.items.length}`);
  } else {
    console.log(`\n⚠ No items fetched (rate limited?), keeping existing ${existingSyncedItems.length} synced items`);
    console.log(`  - Total: ${manifest.items.length}`);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
