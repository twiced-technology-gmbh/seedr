import { useState, useRef, useCallback } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, X, Loader2, GripVertical, Download } from "lucide-react";
import Editor, { type Monaco } from "@monaco-editor/react";
import type { FileTreeNode } from "@/lib/types";

const PREVIEW_THEME = "seedr-preview";

function handleEditorWillMount(monaco: Monaco) {
  monaco.editor.defineTheme(PREVIEW_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#030712",
      "editorGutter.background": "#030712",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#31324480",
      "scrollbarSlider.hoverBackground": "#6c708640",
    },
  });
}

function getLanguageFromPath(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    jsx: "javascript",
    tsx: "typescript",
    json: "json",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    cmd: "bat",
    rs: "rust",
    py: "python",
    rb: "ruby",
    go: "go",
    html: "html",
    css: "css",
    scss: "scss",
    toml: "ini",
    xml: "xml",
    sql: "sql",
    txt: "plaintext",
  };
  return map[ext] || "plaintext";
}

interface FileTreeProps {
  files: FileTreeNode[];
  externalUrl?: string;
  className?: string;
  rootName?: string;
}

interface TreeNodeProps {
  node: FileTreeNode;
  path: string;
  depth?: number;
  defaultOpen?: boolean;
  selectedPath?: string | null;
  onFileClick?: (path: string, name: string) => void;
}

function TreeNode({ node, path, depth = 0, defaultOpen = false, selectedPath, onFileClick }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isDir = node.type === "directory";
  const hasChildren = isDir && node.children && node.children.length > 0;
  const fullPath = path ? `${path}/${node.name}` : node.name;
  const isSelected = selectedPath === fullPath;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else if (!isDir && onFileClick) {
      onFileClick(fullPath, node.name);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 w-full text-left py-1 px-2 rounded transition-colors ${
          isSelected ? "bg-accent/20" : "hover:bg-overlay/50"
        } ${
          hasChildren || (!isDir && onFileClick) ? "cursor-pointer" : "cursor-default"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-subtext shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-subtext shrink-0" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        {isDir ? (
          isOpen ? (
            <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
          )
        ) : (
          <File className={`w-4 h-4 shrink-0 ${isSelected ? "text-accent" : "text-subtext"}`} />
        )}
        <span className={`text-sm truncate ${
          isSelected ? "text-accent font-medium" :
          (!isDir && onFileClick) ? "text-accent hover:underline" : "text-text"
        }`}>
          {node.name}
        </span>
      </button>
      {hasChildren && isOpen && (
        <div>
          {node.children!.map((child, i) => (
            <TreeNode
              key={`${child.name}-${i}`}
              node={child}
              path={fullPath}
              depth={depth + 1}
              selectedPath={selectedPath}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Check if file is an image that can be previewed
 */
function isImageFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const imageExtensions = new Set(["png", "jpg", "jpeg", "gif", "bmp", "ico", "svg", "webp"]);
  return imageExtensions.has(ext);
}

/**
 * Check if file is an audio file that can be previewed
 */
function isAudioFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const audioExtensions = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac"]);
  return audioExtensions.has(ext);
}

/**
 * Check if file is a video file that can be previewed
 */
function isVideoFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const videoExtensions = new Set(["mp4", "webm", "ogv", "mov"]);
  return videoExtensions.has(ext);
}

/**
 * Check if file is a PDF that can be previewed
 */
function isPdfFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return ext === "pdf";
}

/**
 * Check if file is a binary format that can't be previewed as text
 */
function isBinaryFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const binaryExtensions = new Set([
    // Fonts
    "ttf", "otf", "woff", "woff2", "eot",
    // Archives
    "zip", "tar", "gz", "rar", "7z",
    // Documents (excluding PDF which we can preview)
    "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    // Executables
    "exe", "dll", "so", "dylib",
    // Other binary
    "bin", "dat", "db", "sqlite", "avi", "tif", "tiff",
  ]);
  return binaryExtensions.has(ext);
}

interface FilePreviewProps {
  filePath: string;
  content: string | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  downloadUrl?: string | null;
}

function FilePreview({ filePath, content, loading, error, onClose, downloadUrl }: FilePreviewProps) {
  const [height, setHeight] = useState(600);
  const [width, setWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef<"height" | "width" | "corner" | null>(null);
  const startPosRef = useRef({ x: 0, y: 0, height: 0, width: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, direction: "height" | "width" | "corner") => {
    e.preventDefault();
    isResizingRef.current = direction;
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      height,
      width: width || containerRef.current?.offsetWidth || 600,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;

      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;

      if (isResizingRef.current === "height" || isResizingRef.current === "corner") {
        const newHeight = Math.max(150, Math.min(800, startPosRef.current.height + deltaY));
        setHeight(newHeight);
      }
      if (isResizingRef.current === "width" || isResizingRef.current === "corner") {
        const newWidth = Math.max(300, startPosRef.current.width + deltaX);
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [height, width]);

  const fileName = filePath.split("/").pop() || filePath;
  const isImage = isImageFile(fileName);
  const isAudio = isAudioFile(fileName);
  const isVideo = isVideoFile(fileName);
  const isPdf = isPdfFile(fileName);
  const isBinary = isBinaryFile(fileName);

  return (
    <div
      ref={containerRef}
      className="mt-4 bg-base border border-overlay rounded-lg overflow-hidden relative"
      style={{ width: width ? `${width}px` : "100%", maxWidth: "100%" }}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-overlay">
        <span className="text-sm font-medium text-text truncate">{filePath}</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-overlay/50 transition-colors shrink-0 ml-2"
        >
          <X className="w-4 h-4 text-subtext" />
        </button>
      </div>
      <div className="overflow-hidden" style={{ height: `${height}px` }}>
        {loading && (
          <div className="flex items-center justify-center h-full gap-2 text-subtext">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        )}
        {error && (
          <div className="p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {isImage && downloadUrl && (
          <div className="flex items-center justify-center h-full p-4">
            <img
              src={downloadUrl}
              alt={fileName}
              className="w-full h-full object-contain"
            />
          </div>
        )}
        {isAudio && downloadUrl && (
          <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
            <audio controls className="w-full" src={downloadUrl}>
              Your browser does not support the audio element.
            </audio>
            <a
              href={downloadUrl}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-subtext hover:text-accent"
              onClick={(e) => e.stopPropagation()}
            >
              Download if audio doesn't play
            </a>
          </div>
        )}
        {isVideo && downloadUrl && (
          <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
            <video controls className="w-full flex-1 object-contain" src={downloadUrl}>
              Your browser does not support the video element.
            </video>
            <a
              href={downloadUrl}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-subtext hover:text-accent"
              onClick={(e) => e.stopPropagation()}
            >
              Download if video doesn't play
            </a>
          </div>
        )}
        {isPdf && downloadUrl && (
          <iframe
            src={downloadUrl.startsWith("/") ? downloadUrl : `https://docs.google.com/viewer?url=${encodeURIComponent(downloadUrl)}&embedded=true`}
            className="w-full h-full border-0"
            title={fileName}
          />
        )}
        {isBinary && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-sm text-subtext">Preview not available for this file type</p>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg transition-colors text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
                Download file
              </a>
            )}
          </div>
        )}
        {content && !isBinary && !isImage && !isAudio && !isVideo && !isPdf && (
          <Editor
            height="100%"
            language={getLanguageFromPath(fileName)}
            value={content}
            theme={PREVIEW_THEME}
            beforeMount={handleEditorWillMount}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              lineNumbers: "off",
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 12,
              lineNumbersMinChars: 0,
              renderLineHighlight: "none",
              scrollBeyondLastLine: false,
              overviewRulerLanes: 0,
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              scrollbar: { vertical: "auto", horizontal: "auto", verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              padding: { top: 12, bottom: 12 },
              fontSize: 13,
              wordWrap: "on",
              domReadOnly: true,
              contextmenu: false,
            }}
          />
        )}
      </div>
      {/* Resize handle - bottom */}
      <div
        className="absolute bottom-0 left-0 right-4 h-2 cursor-ns-resize hover:bg-accent/20 transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "height")}
      />
      {/* Resize handle - right */}
      <div
        className="absolute top-0 right-0 bottom-4 w-2 cursor-ew-resize hover:bg-accent/20 transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "width")}
      />
      {/* Resize handle - corner */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-center justify-center hover:bg-accent/20 transition-colors rounded-tl"
        onMouseDown={(e) => handleMouseDown(e, "corner")}
      >
        <GripVertical className="w-3 h-3 text-subtext rotate-[-45deg]" />
      </div>
    </div>
  );
}

/**
 * Convert external URL to raw content URL
 * Supports:
 * - GitHub: https://github.com/owner/repo/tree/branch/path -> raw.githubusercontent.com
 * - Local dev: local://dev-samples -> /dev-samples (for testing)
 * - Toolr (dev): github.com/twiced-technology-gmbh/seedr -> local /registry/ path
 */
function getRawUrl(externalUrl: string, filePath: string): string | null {
  // Handle local dev files
  if (externalUrl.startsWith("local://")) {
    const basePath = externalUrl.replace("local://", "");
    return `/${basePath}/${filePath}`;
  }

  // Handle GitHub URLs — with or without /tree/branch
  const withTree = externalUrl.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)(?:\/(.+))?/);
  const withoutTree = !withTree ? externalUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/) : null;
  if (!withTree && !withoutTree) return null;

  const owner = (withTree ?? withoutTree)![1];
  const repo = (withTree ?? withoutTree)![2];
  const branch = withTree?.[3] ?? "main";
  const basePath = withTree?.[4];

  // In development, serve Toolr files from local registry
  if (import.meta.env.DEV && owner === "twiced-technology-gmbh" && repo === "seedr") {
    return `/${basePath}/${filePath}`;
  }

  const fullPath = basePath ? `${basePath}/${filePath}` : filePath;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fullPath}`;
}

export function FileTree({ files, externalUrl, className = "", rootName }: FileTreeProps) {
  const [selectedFile, setSelectedFile] = useState<{ path: string; name: string } | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!files || files.length === 0) return null;

  const handleFileClick = async (path: string, name: string) => {
    if (!externalUrl) return;

    // Toggle: clicking same file closes the preview
    if (selectedFile?.path === path) {
      handleClose();
      return;
    }

    // Strip virtual root folder prefix from path for URL resolution
    const fetchPath = rootName ? path.replace(`${rootName}/`, "") : path;
    const rawUrl = getRawUrl(externalUrl, fetchPath);
    setSelectedFile({ path, name });
    setFileContent(null);
    setDownloadUrl(rawUrl);
    setError(null);

    // Skip fetching binary/media files - they use the URL directly
    if (isBinaryFile(name) || isImageFile(name) || isAudioFile(name) || isVideoFile(name) || isPdfFile(name)) {
      setLoading(false);
      return;
    }

    setLoading(true);

    if (!rawUrl) {
      setError("Could not determine file URL");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(rawUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file (${response.status})`);
      }
      const text = await response.text();
      setFileContent(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFileContent(null);
    setDownloadUrl(null);
    setError(null);
  };

  return (
    <div className={className}>
      <h2 className="text-xs font-medium text-text-dim uppercase tracking-wider mb-3">File Structure</h2>
      <div className="bg-surface rounded-lg py-2 overflow-hidden">
        {rootName ? (
          <TreeNode
            node={{ name: rootName, type: "directory", children: files }}
            path=""
            defaultOpen
            selectedPath={selectedFile?.path}
            onFileClick={externalUrl ? handleFileClick : undefined}
          />
        ) : (
          files.map((node, i) => (
            <TreeNode
              key={`${node.name}-${i}`}
              node={node}
              path=""
              selectedPath={selectedFile?.path}
              onFileClick={externalUrl ? handleFileClick : undefined}
            />
          ))
        )}
      </div>
      {selectedFile && (
        <FilePreview
          filePath={selectedFile.path}
          content={fileContent}
          loading={loading}
          error={error}
          onClose={handleClose}
          downloadUrl={downloadUrl}
        />
      )}
    </div>
  );
}
