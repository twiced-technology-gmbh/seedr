/**
 * Shared utilities for sync scripts.
 */

export const GITHUB_API = "https://api.github.com";
export const GITHUB_RAW = "https://raw.githubusercontent.com";

// Use GITHUB_TOKEN if available (for higher rate limits in CI)
const headers: Record<string, string> = {
  "User-Agent": "seedr-sync",
};
if (process.env.GITHUB_TOKEN) {
  headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
}

export async function fetchJson<T>(url: string): Promise<T | null> {
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

export async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}

interface GitHubContentItem {
  name: string;
  type: "file" | "dir";
  path: string;
}

export async function listDirectory(repo: string, path: string): Promise<string[]> {
  const url = `${GITHUB_API}/repos/${repo}/contents/${path}`;
  const items = await fetchJson<GitHubContentItem[]>(url);
  if (!items) return [];
  return items.filter((item) => item.type === "dir").map((item) => item.name);
}

export async function listDirectoryContents(repo: string, path: string): Promise<GitHubContentItem[]> {
  const url = `${GITHUB_API}/repos/${repo}/contents/${path}`;
  const items = await fetchJson<GitHubContentItem[]>(url);
  return items || [];
}

import type { FileTreeNode } from "./types.js";

export async function fetchFileTree(
  repo: string,
  path: string,
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<FileTreeNode[]> {
  if (currentDepth >= maxDepth) return [];

  const items = await listDirectoryContents(repo, path);
  if (!items.length) return [];

  const nodes: FileTreeNode[] = [];

  for (const item of items) {
    const node: FileTreeNode = {
      name: item.name,
      type: item.type === "dir" ? "directory" : "file",
    };

    if (item.type === "dir" && currentDepth < maxDepth - 1) {
      const children = await fetchFileTree(repo, item.path, maxDepth, currentDepth + 1);
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
