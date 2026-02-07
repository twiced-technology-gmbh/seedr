/**
 * Shared utilities for sync scripts.
 *
 * Authentication (checked in order):
 *   1. GITHUB_TOKEN          — PAT or fine-grained token (5,000 req/hr)
 *   2. GitHub App env vars   — generates an installation token (5,000+ req/hr)
 *        GITHUB_APP_ID
 *        GITHUB_APP_PRIVATE_KEY      (PEM string) or
 *        GITHUB_APP_PRIVATE_KEY_PATH (path to .pem file)
 *        GITHUB_APP_INSTALLATION_ID
 *   3. Unauthenticated       — 60 req/hr
 */

import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

export const GITHUB_API = "https://api.github.com";
export const GITHUB_RAW = "https://raw.githubusercontent.com";

function createGitHubAppJwt(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: appId,
    iat: now - 60,
    exp: now + 600,
  })).toString("base64url");
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(privateKey, "base64url");
  return `${header}.${payload}.${signature}`;
}

async function fetchInstallationToken(appId: string, privateKey: string, installationId: string): Promise<string> {
  const jwt = createGitHubAppJwt(appId, privateKey);
  const response = await fetch(`${GITHUB_API}/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: {
      "User-Agent": "seedr-sync",
      Authorization: `Bearer ${jwt}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to get installation token: ${response.status} ${response.statusText}`);
  }
  const data = await response.json() as { token: string };
  return data.token;
}

let headersPromise: Promise<Record<string, string>> | null = null;

async function getHeaders(): Promise<Record<string, string>> {
  if (!headersPromise) {
    headersPromise = initHeaders();
  }
  return headersPromise;
}

async function initHeaders(): Promise<Record<string, string>> {
  const h: Record<string, string> = { "User-Agent": "seedr-sync" };

  if (process.env.GITHUB_TOKEN) {
    h["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    console.log("Using GITHUB_TOKEN for authentication (5,000 req/hr)");
    return h;
  }

  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY
    || (process.env.GITHUB_APP_PRIVATE_KEY_PATH
      ? readFileSync(process.env.GITHUB_APP_PRIVATE_KEY_PATH, "utf-8")
      : undefined);

  if (appId && privateKey && installationId) {
    try {
      const token = await fetchInstallationToken(appId, privateKey, installationId);
      h["Authorization"] = `Bearer ${token}`;
      console.log("Using GitHub App installation token (5,000+ req/hr)");
    } catch (err) {
      console.error("GitHub App auth failed, falling back to unauthenticated:", (err as Error).message);
    }
    return h;
  }

  console.log("No GitHub auth configured (60 req/hr). Set GITHUB_TOKEN or GITHUB_APP_* env vars for higher limits.");
  return h;
}

export async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const headers = await getHeaders();
    const response = await fetch(url, { headers });
    const remaining = response.headers.get("X-RateLimit-Remaining");
    if (remaining !== null && parseInt(remaining, 10) < 10) {
      console.warn(`⚠ GitHub API rate limit low: ${remaining} requests remaining`);
    }
    if (!response.ok) {
      if (response.status === 403) {
        const resetHeader = response.headers.get("X-RateLimit-Reset");
        if (resetHeader) {
          const resetTime = new Date(parseInt(resetHeader, 10) * 1000);
          const minutesUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / 60000);
          console.error(`GitHub API rate limit exceeded. Resets in ${minutesUntilReset} minutes (at ${resetTime.toLocaleTimeString()}). Set GITHUB_TOKEN for higher limits.`);
        } else {
          console.error("GitHub API rate limit exceeded. Set GITHUB_TOKEN for higher limits.");
        }
      }
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

export async function fetchText(url: string): Promise<string | null> {
  try {
    const headers = await getHeaders();
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}

import type { FileTreeNode, GitTreeItem, GitTreeResponse, PluginContents } from "./types.js";

const repoTreeCache = new Map<string, GitTreeItem[]>();

export async function fetchRepoTree(repo: string, branch: string = "main"): Promise<GitTreeItem[]> {
  const cacheKey = `${repo}@${branch}`;
  const cached = repoTreeCache.get(cacheKey);
  if (cached) return cached;

  const url = `${GITHUB_API}/repos/${repo}/git/trees/${branch}?recursive=1`;
  const response = await fetchJson<GitTreeResponse>(url);
  if (!response) return [];

  if (response.truncated) {
    console.warn(`⚠ Git tree for ${repo} was truncated — some files may be missing`);
  }

  repoTreeCache.set(cacheKey, response.tree);
  return response.tree;
}

export function listDirectoryFromTree(tree: GitTreeItem[], path: string): string[] {
  const prefix = path.endsWith("/") ? path : path + "/";
  const dirs = new Set<string>();

  for (const item of tree) {
    if (item.type !== "tree") continue;
    if (!item.path.startsWith(prefix)) continue;
    const relative = item.path.slice(prefix.length);
    // Immediate children only: no "/" in relative path
    if (relative && !relative.includes("/")) {
      dirs.add(relative);
    }
  }

  return [...dirs].sort();
}

export function extractSubtree(tree: GitTreeItem[], prefix: string, maxDepth: number = 3): FileTreeNode[] {
  const isRoot = !prefix || prefix === ".";

  // Collect items under prefix within maxDepth
  const items: { relativePath: string; type: "blob" | "tree" }[] = [];
  for (const item of tree) {
    let relative: string;
    if (isRoot) {
      relative = item.path;
    } else {
      const normalizedPrefix = prefix.endsWith("/") ? prefix : prefix + "/";
      if (!item.path.startsWith(normalizedPrefix)) continue;
      relative = item.path.slice(normalizedPrefix.length);
      if (!relative) continue;
    }
    const depth = relative.split("/").length;
    if (depth > maxDepth) continue;
    items.push({ relativePath: relative, type: item.type });
  }

  // Build nested tree structure
  function buildLevel(parentPath: string, currentDepth: number): FileTreeNode[] {
    const nodes: FileTreeNode[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      const parts = item.relativePath.split("/");
      if (parts.length < currentDepth + 1) continue;

      // Check parent matches
      const itemParent = parts.slice(0, currentDepth).join("/");
      if (itemParent !== parentPath) continue;

      const name = parts[currentDepth];
      if (seen.has(name)) continue;
      seen.add(name);

      // This is a direct child at this level
      const isExactMatch = parts.length === currentDepth + 1;
      if (!isExactMatch) continue;

      const node: FileTreeNode = {
        name,
        type: item.type === "tree" ? "directory" : "file",
      };

      if (item.type === "tree" && currentDepth + 1 < maxDepth) {
        const childPath = parentPath ? `${parentPath}/${name}` : name;
        const children = buildLevel(childPath, currentDepth + 1);
        if (children.length > 0) {
          node.children = children;
        }
      }

      nodes.push(node);
    }

    // Sort: directories first, then alphabetically
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  return buildLevel("", 0);
}

interface GitHubCommit {
  commit: {
    committer: {
      date: string;
    };
  };
}

export async function fetchLastCommitDate(repo: string, path: string): Promise<string | null> {
  const url = `${GITHUB_API}/repos/${repo}/commits?path=${path}&per_page=1`;
  const commits = await fetchJson<GitHubCommit[]>(url);
  if (!commits || commits.length === 0) return null;
  return commits[0].commit.committer.date;
}

export function formatName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Parse plugin contents from file tree.
 * Plugins can have their content in:
 * - Root-level directories (skills/, agents/, hooks/, commands/)
 * - Or under .claude/ directory
 */
export function parsePluginContents(files: FileTreeNode[]): PluginContents {
  const contents: PluginContents = { files };

  const extractItems = (dir: FileTreeNode | undefined): string[] => {
    if (!dir?.children) return [];
    return dir.children
      .filter(f => f.type === "file" && f.name.endsWith(".md"))
      .map(f => f.name.replace(/\.md$/, ""));
  };

  const rootDirs = files.filter(f => f.type === "directory");
  for (const dir of rootDirs) {
    const items = extractItems(dir);
    if (items.length === 0) continue;

    switch (dir.name) {
      case "skills":
        contents.skills = items;
        break;
      case "agents":
        contents.agents = items;
        break;
      case "hooks":
        contents.hooks = items;
        break;
      case "commands":
        contents.commands = items;
        break;
      case "mcp-servers":
        contents.mcpServers = items;
        break;
    }
  }

  const claudeDir = files.find(f => f.name === ".claude" && f.type === "directory");
  if (claudeDir?.children) {
    for (const subdir of claudeDir.children) {
      if (subdir.type !== "directory") continue;
      const items = extractItems(subdir);
      if (items.length === 0) continue;

      switch (subdir.name) {
        case "skills":
          contents.skills = contents.skills || items;
          break;
        case "agents":
          contents.agents = contents.agents || items;
          break;
        case "hooks":
          contents.hooks = contents.hooks || items;
          break;
        case "commands":
          contents.commands = contents.commands || items;
          break;
        case "mcp-servers":
          contents.mcpServers = contents.mcpServers || items;
          break;
      }
    }
  }

  return contents;
}

export interface PluginJson {
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
