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
  fetchRepoTree,
  listDirectoryFromTree,
  extractSubtree,
  computeContentHash,
  formatName,
  parsePluginContents,
} from "./utils.js";
import type { PluginJson } from "./utils.js";
import type { ManifestItem, ComponentType, SourceType, GitTreeItem, PluginContents } from "./types.js";

const PLUGINS_REPO = "anthropics/claude-plugins-official";
const SKILLS_REPO = "anthropics/skills";

// Items to exclude
const EXCLUDED = ["example-plugin", "template"];

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
  repoTree: GitTreeItem[];
  fetchMetadata: (repo: string, basePath: string, slug: string) => Promise<{ name: string; description: string; author?: { name: string; url?: string } } | null>;
  includeFileTree?: boolean;
}

async function fetchItems(options: FetchItemsOptions): Promise<ManifestItem[]> {
  const { repo, basePath, type, sourceType, compatibility, defaultAuthor, repoTree, fetchMetadata, includeFileTree } = options;
  const slugs = listDirectoryFromTree(repoTree, basePath);

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
        const contentHash = computeContentHash(repoTree, `${basePath}/${slug}`);

        let contents: PluginContents | undefined;
        if (includeFileTree) {
          const files = extractSubtree(repoTree, `${basePath}/${slug}`, 4);
          if (files.length > 0) {
            contents = parsePluginContents(files);
          }
        }

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
          ...(contentHash && { contentHash }),
          ...(updatedAt && { updatedAt }),
          ...(contents && { contents }),
        } satisfies ManifestItem;
      })
  );

  return results.filter((item): item is ManifestItem => item !== null);
}

export async function syncAnthropic(): Promise<ManifestItem[]> {
  console.log("\n=== Syncing from Anthropic ===\n");

  // Pre-fetch entire repo trees (1 API call each, cached for reuse)
  const [skillsTree, pluginsTree] = await Promise.all([
    fetchRepoTree(SKILLS_REPO),
    fetchRepoTree(PLUGINS_REPO),
  ]);

  if (skillsTree.length === 0) {
    console.warn("⚠ Failed to fetch skills repo tree — skipping skills");
  }
  if (pluginsTree.length === 0) {
    console.warn("⚠ Failed to fetch plugins repo tree — skipping plugins");
  }

  // Fetch official skills (compatible with all tools)
  const officialSkills = skillsTree.length > 0 ? await fetchItems({
    repo: SKILLS_REPO,
    basePath: "skills",
    type: "skill",
    sourceType: "official",
    compatibility: ["claude", "copilot", "gemini", "codex", "opencode"],
    defaultAuthor: "Anthropic",
    repoTree: skillsTree,
    includeFileTree: true,
    fetchMetadata: async (repo, basePath, slug) => {
      const skill = await fetchSkillMd(repo, basePath, slug);
      if (!skill) return null;
      return { name: skill.name, description: skill.description, author: { name: "Anthropic" } };
    },
  }) : [];

  // Fetch official plugins (Claude-only)
  const officialPlugins = pluginsTree.length > 0 ? await fetchItems({
    repo: PLUGINS_REPO,
    basePath: "plugins",
    type: "plugin",
    sourceType: "official",
    compatibility: ["claude"],
    defaultAuthor: "Anthropic",
    repoTree: pluginsTree,
    includeFileTree: true,
    fetchMetadata: async (repo, basePath, slug) => {
      const plugin = await fetchPluginJson(repo, basePath, slug);
      if (!plugin) return null;
      return {
        name: plugin.name,
        description: plugin.description,
        author: plugin.author ? { name: plugin.author.name, url: plugin.author.url } : undefined,
      };
    },
  }) : [];

  // Fetch community plugins (Claude-only)
  const communityPlugins = pluginsTree.length > 0 ? await fetchItems({
    repo: PLUGINS_REPO,
    basePath: "external_plugins",
    type: "plugin",
    sourceType: "community",
    compatibility: ["claude"],
    defaultAuthor: "Community",
    repoTree: pluginsTree,
    includeFileTree: true,
    fetchMetadata: async (repo, basePath, slug) => {
      const plugin = await fetchPluginJson(repo, basePath, slug);
      if (!plugin) return null;
      return {
        name: plugin.name,
        description: plugin.description,
        author: plugin.author ? { name: plugin.author.name, url: plugin.author.url } : undefined,
      };
    },
  }) : [];

  const items = [...officialSkills, ...officialPlugins, ...communityPlugins];
  console.log(`\nAnthropic sync complete: ${items.length} items`);

  return items;
}
