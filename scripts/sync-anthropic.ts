#!/usr/bin/env npx tsx
/**
 * Syncs plugins and skills from Anthropic repositories to our manifest.
 * Run via: npx tsx scripts/sync-anthropic-plugins.ts
 *
 * Sources:
 * - anthropics/claude-plugins-official/plugins → plugins, sourceType: "official"
 * - anthropics/claude-plugins-official/external_plugins → plugins, sourceType: "community"
 * - anthropics/skills/skills → skills, sourceType: "official"
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PLUGINS_REPO = "anthropics/claude-plugins-official";
const SKILLS_REPO = "anthropics/skills";
const GITHUB_API = "https://api.github.com";
const GITHUB_RAW = "https://raw.githubusercontent.com";

// Items to exclude
const EXCLUDED = ["example-plugin", "template"];

interface PluginJson {
  name: string;
  description: string;
  version?: string;
  author?: {
    name: string;
    email?: string;
    url?: string;
  };
  homepage?: string;
  keywords?: string[];
}

interface ManifestItem {
  slug: string;
  name: string;
  type: string;
  description: string;
  longDescription?: string;
  compatibility: string[];
  featured?: boolean;
  sourceType: "official" | "community" | "toolr";
  author: { name: string; url?: string };
  externalUrl: string;
  updatedAt?: string;
}

interface Manifest {
  version: string;
  items: ManifestItem[];
}

interface GitHubCommit {
  commit: {
    committer: {
      date: string;
    };
  };
}

// Use GITHUB_TOKEN if available (for higher rate limits in CI)
const headers: Record<string, string> = {
  "User-Agent": "seedr-sync",
};
if (process.env.GITHUB_TOKEN) {
  headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      if (response.status === 403) {
        console.error("GitHub API rate limit exceeded. Set GITHUB_TOKEN for higher limits.");
      }
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}

async function listDirectory(repo: string, path: string): Promise<string[]> {
  const url = `${GITHUB_API}/repos/${repo}/contents/${path}`;
  const items = await fetchJson<Array<{ name: string; type: string }>>(url);
  if (!items) return [];
  return items.filter((item) => item.type === "dir").map((item) => item.name);
}

async function fetchPluginJson(repo: string, basePath: string, slug: string): Promise<PluginJson | null> {
  const url = `${GITHUB_RAW}/${repo}/main/${basePath}/${slug}/.claude-plugin/plugin.json`;
  return fetchJson<PluginJson>(url);
}

async function fetchSkillMd(repo: string, basePath: string, slug: string): Promise<{ name: string; description: string } | null> {
  const url = `${GITHUB_RAW}/${repo}/main/${basePath}/${slug}/SKILL.md`;
  const content = await fetchText(url);
  if (!content) return null;

  // Parse YAML frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = match[1];
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

  if (!nameMatch) return null;

  return {
    name: nameMatch[1].trim(),
    description: descMatch ? descMatch[1].trim() : "",
  };
}

async function fetchLastCommitDate(repo: string, basePath: string, slug: string): Promise<string | null> {
  const url = `${GITHUB_API}/repos/${repo}/commits?path=${basePath}/${slug}&per_page=1`;
  const commits = await fetchJson<GitHubCommit[]>(url);
  if (!commits || commits.length === 0) return null;
  return commits[0].commit.committer.date;
}

function formatName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function fetchPlugins(
  repo: string,
  basePath: string,
  sourceType: "official" | "community"
): Promise<ManifestItem[]> {
  const slugs = await listDirectory(repo, basePath);

  console.log(`Fetching ${slugs.length} plugins from ${repo}/${basePath}...`);

  const results = await Promise.all(
    slugs
      .filter((slug) => !EXCLUDED.includes(slug))
      .map(async (slug) => {
        const plugin = await fetchPluginJson(repo, basePath, slug);
        if (!plugin) {
          console.warn(`  Skipping ${slug} (no plugin.json)`);
          return null;
        }

        const updatedAt = await fetchLastCommitDate(repo, basePath, slug);

        console.log(`  ✓ ${slug}${updatedAt ? ` (${updatedAt.split("T")[0]})` : ""}`);
        return {
          slug,
          name: formatName(plugin.name || slug),
          type: "plugin",
          description: plugin.description || "",
          compatibility: ["claude"],
          sourceType,
          author: {
            name: plugin.author?.name || (sourceType === "official" ? "Anthropic" : "Community"),
            url: plugin.author?.url,
          },
          externalUrl: `https://github.com/${repo}/tree/main/${basePath}/${slug}`,
          ...(updatedAt && { updatedAt }),
        } satisfies ManifestItem;
      })
  );

  return results.filter((item): item is ManifestItem => item !== null);
}

async function fetchSkills(
  repo: string,
  basePath: string
): Promise<ManifestItem[]> {
  const slugs = await listDirectory(repo, basePath);

  console.log(`Fetching ${slugs.length} skills from ${repo}/${basePath}...`);

  const results = await Promise.all(
    slugs
      .filter((slug) => !EXCLUDED.includes(slug))
      .map(async (slug) => {
        const skill = await fetchSkillMd(repo, basePath, slug);
        if (!skill) {
          console.warn(`  Skipping ${slug} (no SKILL.md or invalid frontmatter)`);
          return null;
        }

        const updatedAt = await fetchLastCommitDate(repo, basePath, slug);

        console.log(`  ✓ ${slug}${updatedAt ? ` (${updatedAt.split("T")[0]})` : ""}`);
        return {
          slug,
          name: formatName(skill.name || slug),
          type: "skill",
          description: skill.description || "",
          compatibility: ["claude", "copilot", "gemini", "codex", "opencode"],
          sourceType: "official" as const,
          author: {
            name: "Anthropic",
          },
          externalUrl: `https://github.com/${repo}/tree/main/${basePath}/${slug}`,
          ...(updatedAt && { updatedAt }),
        } satisfies ManifestItem;
      })
  );

  return results.filter((item): item is ManifestItem => item !== null);
}

async function main() {
  const manifestPath = join(process.cwd(), "registry/manifest.json");

  // Read existing manifest
  const manifest: Manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  // Remove existing Anthropic items (we'll re-add fresh ones)
  const localItems = manifest.items.filter(
    (item) => item.sourceType === "toolr" || !["official", "community"].includes(item.sourceType)
  );

  console.log(`\nStarting sync from Anthropic repositories...\n`);

  // Fetch official plugins
  const officialPlugins = await fetchPlugins(PLUGINS_REPO, "plugins", "official");

  // Fetch external/community plugins
  const communityPlugins = await fetchPlugins(PLUGINS_REPO, "external_plugins", "community");

  // Fetch official skills
  const officialSkills = await fetchSkills(SKILLS_REPO, "skills");

  // Merge: local items first, then official skills, then official plugins, then community
  manifest.items = [...localItems, ...officialSkills, ...officialPlugins, ...communityPlugins];

  // Write updated manifest
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\n✓ Updated manifest.json`);
  console.log(`  - Local items: ${localItems.length}`);
  console.log(`  - Official skills: ${officialSkills.length}`);
  console.log(`  - Official plugins: ${officialPlugins.length}`);
  console.log(`  - Community plugins: ${communityPlugins.length}`);
  console.log(`  - Total: ${manifest.items.length}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
