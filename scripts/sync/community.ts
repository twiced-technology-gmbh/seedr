/**
 * Sync manually-added community items from their GitHub repos.
 * Re-fetches metadata, file trees, and last commit dates.
 */

import {
  GITHUB_RAW,
  fetchJson,
  fetchText,
  fetchLastCommitDate,
  fetchRepoTree,
  extractSubtree,
  computeContentHash,
  formatName,
  parsePluginContents,
} from "./utils.js";
import type { PluginJson } from "./utils.js";
import type { ManifestItem, PluginContents } from "./types.js";

/**
 * Parse owner/repo and optional subpath from an externalUrl.
 * Handles: https://github.com/owner/repo/tree/main/subpath
 */
function parseExternalUrl(url: string): { repo: string; basePath: string } | null {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)(?:\/tree\/[^/]+\/?(.*)?)?/);
  if (!match) return null;
  return { repo: match[1], basePath: match[2] || "" };
}

async function refreshPlugin(item: ManifestItem, repo: string, basePath: string): Promise<ManifestItem> {
  const pluginJsonUrl = `${GITHUB_RAW}/${repo}/main/${basePath ? basePath + "/" : ""}.claude-plugin/plugin.json`;
  const pluginJson = await fetchJson<PluginJson>(pluginJsonUrl);

  const repoTree = await fetchRepoTree(repo);
  const updatedAt = await fetchLastCommitDate(repo, basePath || ".");
  const contentHash = repoTree.length > 0 ? computeContentHash(repoTree, basePath) : null;
  const files = repoTree.length > 0 ? extractSubtree(repoTree, basePath, 3) : [];
  const contents: PluginContents = files.length > 0 ? parsePluginContents(files) : item.contents ?? {};

  return {
    ...item,
    ...(pluginJson && { description: pluginJson.description }),
    ...(pluginJson && { name: formatName(pluginJson.name || item.slug) }),
    ...(pluginJson?.author && { author: { name: pluginJson.author.name, url: pluginJson.author.url } }),
    ...(contentHash && { contentHash }),
    ...(updatedAt && { updatedAt }),
    contents,
  };
}

async function refreshSkill(item: ManifestItem, repo: string, basePath: string): Promise<ManifestItem> {
  const skillMdUrl = `${GITHUB_RAW}/${repo}/main/${basePath ? basePath + "/" : ""}SKILL.md`;
  const content = await fetchText(skillMdUrl);

  let name = item.name;
  let description = item.description;

  if (content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      const frontmatter = match[1];
      const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
      const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
      if (nameMatch) name = formatName(nameMatch[1].trim());
      if (descMatch) description = descMatch[1].trim();
    }
  }

  const repoTree = await fetchRepoTree(repo);
  const updatedAt = await fetchLastCommitDate(repo, basePath || ".");
  const contentHash = repoTree.length > 0 ? computeContentHash(repoTree, basePath) : null;
  const files = repoTree.length > 0 ? extractSubtree(repoTree, basePath, 3) : [];

  return {
    ...item,
    name,
    description,
    ...(contentHash && { contentHash }),
    ...(updatedAt && { updatedAt }),
    ...(files.length > 0 && { contents: { files } }),
  };
}

/**
 * Re-sync manually-added community items from their GitHub repos.
 * Takes existing community items, fetches fresh data, returns updated items.
 */
export async function syncCommunity(items: ManifestItem[]): Promise<ManifestItem[]> {
  if (items.length === 0) return [];

  console.log(`\n=== Syncing ${items.length} community items ===\n`);

  const results: ManifestItem[] = [];

  for (const item of items) {
    if (!item.externalUrl) {
      console.warn(`  Skipping ${item.slug} (no externalUrl)`);
      results.push(item);
      continue;
    }

    const parsed = parseExternalUrl(item.externalUrl);
    if (!parsed) {
      console.warn(`  Skipping ${item.slug} (unparsable externalUrl)`);
      results.push(item);
      continue;
    }

    try {
      const updated = item.type === "plugin"
        ? await refreshPlugin(item, parsed.repo, parsed.basePath)
        : await refreshSkill(item, parsed.repo, parsed.basePath);

      console.log(`  ✓ ${item.slug}${updated.updatedAt ? ` (${updated.updatedAt.split("T")[0]})` : ""}`);
      results.push(updated);
    } catch (err) {
      throw new Error(`Failed to sync community item ${item.slug}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\nCommunity sync complete: ${results.length} items`);
  return results;
}
