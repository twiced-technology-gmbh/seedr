import {
  access,
  mkdir,
  symlink,
  copyFile,
  readFile,
  writeFile,
  unlink,
  readlink,
  lstat,
} from "node:fs/promises";
import { dirname, join, relative, isAbsolute } from "node:path";
import type { InstallMethod } from "../types.js";

export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function isSymlink(path: string): Promise<boolean> {
  try {
    const stats = await lstat(path);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

export async function getSymlinkTarget(path: string): Promise<string | null> {
  try {
    return await readlink(path);
  } catch {
    return null;
  }
}

export async function installFile(
  source: string,
  destination: string,
  method: InstallMethod
): Promise<void> {
  await ensureDir(dirname(destination));

  // Remove existing file if present
  if (await exists(destination)) {
    await unlink(destination);
  }

  if (method === "symlink") {
    // Create relative symlink for portability
    const relPath = relative(dirname(destination), source);
    await symlink(relPath, destination);
  } else {
    await copyFile(source, destination);
  }
}

export async function removeFile(path: string): Promise<boolean> {
  try {
    await unlink(path);
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(path: string): Promise<string> {
  return readFile(path, "utf-8");
}

export async function writeTextFile(
  path: string,
  content: string
): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, content, "utf-8");
}

export function resolvePath(path: string, base?: string): string {
  if (isAbsolute(path)) {
    return path;
  }
  return join(base ?? process.cwd(), path);
}
