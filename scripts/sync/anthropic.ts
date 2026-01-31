/**
 * Sync skills and plugins from Anthropic repositories.
 *
 * Sources:
 * - anthropics/skills/skills → skills, sourceType: "official"
 * - anthropics/claude-plugins-official/plugins → plugins, sourceType: "official"
 * - anthropics/claude-plugins-official/external_plugins → plugins, sourceType: "community"
 */

import {
  GITHUB_RAW,
  fetchJson,
  fetchText,
  fetchLastCommitDate,
  listDirectory,
  formatName,
} from "./utils.js";
import type { ManifestItem, ComponentType, SourceType } from "./types.js";

const PLUGINS_REPO = "anthropics/claude-plugins-official";
const SKILLS_REPO = "anthropics/skills";

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

interface FetchItemsOptions {
  repo: string;
  basePath: string;
  type: ComponentType;
  sourceType: SourceType;
  compatibility: string[];
  defaultAuthor: string;
  fetchMetadata: (repo: string, basePath: string, slug: string) => Promise<{ name: string; description: string; author?: { name: string; url?: string } } | null>;
}

async function fetchItems(options: FetchItemsOptions): Promise<ManifestItem[]> {
  const { repo, basePath, type, sourceType, compatibility, defaultAuthor, fetchMetadata } = options;
  const slugs = await listDirectory(repo, basePath);

  console.log(`Fetching ${slugs.length} ${type}s from ${repo}/${basePath}...`);

  const results = await Promise.all(
    slugs
      .filter((slug) => !EXCLUDED.includes(slug))
      .map(async (slug) => {
        const metadata = await fetchMetadata(repo, basePath, slug);
        if (!metadata) {
          console.warn(`  Skipping ${slug} (no metadata)`);
          return null;
        }

        const updatedAt = await fetchLastCommitDate(repo, `${basePath}/${slug}`);

        console.log(`  ✓ ${slug}${updatedAt ? ` (${updatedAt.split("T")[0]})` : ""}`);
        return {
          slug,
          name: formatName(metadata.name || slug),
          type,
          description: metadata.description || "",
          compatibility,
          sourceType,
          author: metadata.author ?? { name: defaultAuthor },
          externalUrl: `https://github.com/${repo}/tree/main/${basePath}/${slug}`,
          ...(updatedAt && { updatedAt }),
        } satisfies ManifestItem;
      })
  );

  return results.filter((item): item is ManifestItem => item !== null);
}

export async function syncAnthropic(): Promise<ManifestItem[]> {
  console.log("\n=== Syncing from Anthropic ===\n");

  // Fetch official skills (compatible with all tools)
  const officialSkills = await fetchItems({
    repo: SKILLS_REPO,
    basePath: "skills",
    type: "skill",
    sourceType: "official",
    compatibility: ["claude", "copilot", "gemini", "codex", "opencode"],
    defaultAuthor: "Anthropic",
    fetchMetadata: async (repo, basePath, slug) => {
      const skill = await fetchSkillMd(repo, basePath, slug);
      if (!skill) return null;
      return { name: skill.name, description: skill.description, author: { name: "Anthropic" } };
    },
  });

  // Fetch official plugins (Claude-only)
  const officialPlugins = await fetchItems({
    repo: PLUGINS_REPO,
    basePath: "plugins",
    type: "plugin",
    sourceType: "official",
    compatibility: ["claude"],
    defaultAuthor: "Anthropic",
    fetchMetadata: async (repo, basePath, slug) => {
      const plugin = await fetchPluginJson(repo, basePath, slug);
      if (!plugin) return null;
      return {
        name: plugin.name,
        description: plugin.description,
        author: plugin.author ? { name: plugin.author.name, url: plugin.author.url } : undefined,
      };
    },
  });

  // Fetch community plugins (Claude-only)
  const communityPlugins = await fetchItems({
    repo: PLUGINS_REPO,
    basePath: "external_plugins",
    type: "plugin",
    sourceType: "community",
    compatibility: ["claude"],
    defaultAuthor: "Community",
    fetchMetadata: async (repo, basePath, slug) => {
      const plugin = await fetchPluginJson(repo, basePath, slug);
      if (!plugin) return null;
      return {
        name: plugin.name,
        description: plugin.description,
        author: plugin.author ? { name: plugin.author.name, url: plugin.author.url } : undefined,
      };
    },
  });

  const items = [...officialSkills, ...officialPlugins, ...communityPlugins];
  console.log(`\nAnthropic sync complete: ${items.length} items`);

  return items;
}
