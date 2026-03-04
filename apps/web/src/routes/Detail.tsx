import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Editor, { type Monaco } from "@monaco-editor/react";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { Clock } from "lucide-react";
import { Breadcrumb, Label, FileStructureSection } from "@toolr/ui-design";
import { CodeBlock } from "@/components/ui";
import { typeLabelPlural, typeTextColors, extensionLabels, typeBreadcrumbIcon, typeBreadcrumbColor } from "@/lib/colors";
import { TypeIcon } from "@/components/TypeIcon";
import { SourceBadge } from "@/components/SourceBadge";
import { ScopeBadge } from "@/components/ScopeBadge";
import { AuthorLink } from "@/components/AuthorLink";
import { CompatibilityBadges } from "@/components/CompatibilityBadges";
import { PluginContents } from "@/components/PluginContents";
import { getItem, getLongDescription, getFileTree } from "@/lib/registry";
import type { ComponentType, FileTreeNode } from "@/lib/types";

const PREVIEW_THEME = "seedr-preview";

function handleEditorWillMount(monaco: Monaco) {
  monaco.editor.defineTheme(PREVIEW_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#000000",
      "editorGutter.background": "#000000",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#31324480",
      "scrollbarSlider.hoverBackground": "#6c708640",
    },
  });
}

function getRawUrl(externalUrl: string, filePath: string): string | null {
  if (externalUrl.startsWith("local://")) {
    const basePath = externalUrl.replace("local://", "");
    return `/${basePath}/${filePath}`;
  }

  const withTree = externalUrl.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)(?:\/(.+))?/);
  const withoutTree = !withTree ? externalUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/) : null;
  if (!withTree && !withoutTree) return null;

  const owner = (withTree ?? withoutTree)![1];
  const repo = (withTree ?? withoutTree)![2];
  const branch = withTree?.[3] ?? "main";
  const basePath = withTree?.[4];

  if (import.meta.env.DEV && owner === "twiced-technology-gmbh" && repo === "seedr") {
    return `/${basePath}/${filePath}`;
  }

  const fullPath = basePath ? `${basePath}/${filePath}` : filePath;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fullPath}`;
}

function MonacoPreview({ content, language }: { content: string; language: string }) {
  return (
    <Editor
      height="100%"
      language={language}
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
        fontSize: 12,
        wordWrap: "on",
        domReadOnly: true,
        contextmenu: false,
      }}
    />
  );
}

export function Detail() {
  const { type, slug } = useParams<{ type: string; slug: string }>();
  const componentType = type?.replace(/s$/, "") as ComponentType;
  const location = useLocation();
  const navigate = useNavigate();
  const fromType = (location.state as { from?: string } | null)?.from as ComponentType | undefined;
  const breadcrumbType = fromType && fromType !== componentType ? fromType : componentType;
  useScrollRestoration();

  const item = slug ? getItem(slug, componentType) : undefined;

  const [longDescription, setLongDescription] = useState<string>();
  const [fileTree, setFileTree] = useState<FileTreeNode[]>();
  useEffect(() => {
    if (!slug) return;
    getLongDescription(slug, componentType).then(setLongDescription);
    getFileTree(slug, componentType).then(setFileTree);
  }, [slug, componentType]);

  const fetchFileContent = useCallback(async (relativePath: string) => {
    if (!item?.externalUrl) throw new Error("No external URL");
    const rawUrl = getRawUrl(item.externalUrl, relativePath);
    if (!rawUrl) throw new Error("Could not determine file URL");
    const response = await fetch(rawUrl);
    if (!response.ok) throw new Error(`Failed to fetch file (${response.status})`);
    return response.text();
  }, [item?.externalUrl]);

  if (!item) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-subtext">Item not found</p>
        <Link to="/" className="text-accent hover:underline mt-4 inline-block">
          Go home
        </Link>
      </div>
    );
  }

  const installCommand = `npx @toolr/seedr add ${item.slug} --type ${item.type}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb — uses referring type if navigated from an extension page */}
      <Breadcrumb
        variant="plain"
        segments={[
          {
            id: "home",
            label: "Home",
            icon: "home",
            color: "emerald",
            onClick: () => navigate("/"),
          },
          {
            id: breadcrumbType,
            label: typeLabelPlural[breadcrumbType],
            icon: typeBreadcrumbIcon[breadcrumbType],
            color: typeBreadcrumbColor[breadcrumbType],
            onClick: () => navigate(`/${breadcrumbType}s`),
          },
          {
            id: item.slug,
            label: item.name,
          },
        ]}
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TypeIcon type={item.type} size={24} className={typeTextColors[item.type]} />
          <h1 className="text-2xl font-bold text-text">{item.name}</h1>
          {item.sourceType && <SourceBadge source={item.sourceType} size="md" />}
          {item.pluginType === "package" && (
            <Label text="Package" color="indigo" icon="package" size="md" tooltip={{ description: "Bundles multiple extensions (skills, hooks, agents, etc.) into a single plugin" }} />
          )}
          {item.pluginType === "wrapper" && (
            <Label text="Wrapper" color="teal" icon="puzzle" size="md" tooltip={{ description: `Wraps a single ${item.wrapper} extension as a plugin` }} />
          )}
          {item.pluginType === "integration" && (
            <Label text="Integration" color="purple" icon="plug" size="md" tooltip={{ description: "Integrates an external tool with your AI assistant. Installing adds it to enabledPlugins — the README explains how to set up the tool itself." }} />
          )}
          {item.sourceType === "toolr" && item.targetScope && <ScopeBadge scope={item.targetScope} size="md" />}
        </div>
        {(item.author || item.sourceType === "toolr") && (
          <div className="flex items-center gap-2 text-sm text-subtext mb-4">
            <AuthorLink
              author={item.sourceType === "toolr" ? { name: "TwiceD Technology" } : item.author!}
            />
            {item.updatedAt && (
              <>
                <span className="text-text-dim">·</span>
                <span className="flex items-center gap-1 text-text-dim">
                  <Clock className="w-3 h-3" />
                  {new Date(item.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              </>
            )}
          </div>
        )}
        <h2 className="text-xs font-medium text-text-dim uppercase tracking-wider mb-2">Description</h2>
        <div className="text-sm text-subtext [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-overlay/50 [&_code]:text-text-dim [&_code]:font-mono [&_code]:text-xs">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{ p: ({ children }) => <p>{children}</p> }}
          >
            {item.description}
          </Markdown>
        </div>
      </div>

      {/* Install command */}
      <div className="mb-8">
        <h2 className="text-xs font-medium text-text-dim uppercase tracking-wider mb-3">Install</h2>
        <CodeBlock code={installCommand} />
      </div>

      {/* Long description */}
      {longDescription && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-text-dim uppercase tracking-wider mb-2">TL;DR</h2>
          <div className="text-sm text-subtext [&_code]:text-text [&_code]:font-medium [&_strong]:text-text [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:pl-0.5 [&_p+ul]:mt-1.5 [&_ul+p]:mt-1.5 [&_p+p]:mt-1.5">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{ p: ({ children }) => <p>{children}</p> }}
            >
              {longDescription}
            </Markdown>
          </div>
        </div>
      )}

      {/* Plugin type explanation */}
      {item.pluginType === "wrapper" && item.wrapper && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-text-dim uppercase tracking-wider mb-3">Wrapped Extension</h2>
          <p className="text-sm text-subtext mb-3">
            This plugin wraps a single extension as an installable plugin.
            Functionally equivalent to installing the {extensionLabels[item.wrapper]?.toLowerCase() || item.wrapper} directly, but delivered and managed as a plugin package.
          </p>
          <PluginContents counts={{ [item.wrapper]: 1 }} />
        </div>
      )}

      {item.pluginType === "package" && item.package && Object.keys(item.package).length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-text-dim uppercase tracking-wider mb-3">Package Contents</h2>
          <p className="text-sm text-subtext mb-3">
            This plugin bundles multiple extensions into a single installable package.
          </p>
          <PluginContents counts={item.package} />
        </div>
      )}

      {item.pluginType === "integration" && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-text-dim uppercase tracking-wider mb-2">Integration</h2>
          <div className="text-sm text-subtext [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-overlay/50 [&_code]:text-text-dim [&_code]:font-mono [&_code]:text-xs [&_strong]:text-text">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{ p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p> }}
            >
              {[
                'This plugin contains **no source files** — only a README with setup instructions for an external tool you need to install on your machine (e.g. via `brew` or `npm`).',
                '',
                '**Why install it then?** Installing the plugin adds it to `enabledPlugins` in your settings. That entry is the signal the AI tool needs — without it, the AI tool has no idea the external tool exists, even if it\'s already on your machine. With it enabled, the AI tool will automatically find and use the external tool for code intelligence (go-to-definition, type checking, etc.).',
                '',
                'In short: the README tells *you* what to install locally, and the plugin setting tells the *AI tool* to use it.',
              ].join('\n')}
            </Markdown>
          </div>
        </div>
      )}

      {/* Compatibility */}
      <div className="mb-8">
        <h2 className="text-xs font-medium text-text-dim uppercase tracking-wider mb-2">
          Compatible with
        </h2>
        <CompatibilityBadges tools={item.compatibility} size="md" />
      </div>

      {/* File tree (lazy-loaded from item.json) */}
      {fileTree && (
        <div className="mb-8">
          <FileStructureSection
            variant="split"
            files={fileTree}
            rootName={item.slug}
            accentColor="teal"
            initialHeight={500}
            language
            renderPreview={(content, _filePath, lang) => <MonacoPreview content={content} language={lang} />}
            onFetchContent={fetchFileContent}
          />
        </div>
      )}

      {/* CLI Reference */}
      <div className="mb-8">
        <h2 className="text-xs font-medium text-text-dim uppercase tracking-wider mb-3">CLI Reference</h2>
        <div className="bg-surface border border-overlay rounded-lg overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[200px]" />
              <col />
              <col className="w-[148px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-overlay bg-active">
                <th className="text-left px-4 py-2 text-text font-medium">Option</th>
                <th className="text-left px-4 py-2 text-text font-medium">Description</th>
                <th className="text-left px-4 py-2 text-text font-medium">Default</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-overlay">
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-text whitespace-nowrap">-t, --type &lt;type&gt;</td>
                <td className="px-4 py-2 text-subtext">Content type: <code className="text-cyan-500">skill</code>, <code className="text-cyan-500">agent</code>, <code className="text-cyan-500">hook</code>, <code className="text-cyan-500">mcp</code>, <code className="text-cyan-500">plugin</code>, <code className="text-cyan-500">settings</code><br /><span className="text-text-dim text-xs">We recommend always setting this, but it's only needed when the same slug exists in multiple types</span></td>
                <td className="px-4 py-2 text-text-dim text-xs">First match</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-text whitespace-nowrap">-a, --agents &lt;tools&gt;</td>
                <td className="px-4 py-2 text-subtext">AI tools to install for: <code className="text-cyan-500">claude</code>, <code className="text-cyan-500">copilot</code>, <code className="text-cyan-500">gemini</code>, <code className="text-cyan-500">codex</code>, <code className="text-cyan-500">opencode</code>, or <code className="text-cyan-500">all</code></td>
                <td className="px-4 py-2 text-text-dim text-xs">Prompted</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-text whitespace-nowrap">-s, --scope &lt;scope&gt;</td>
                <td className="px-4 py-2 text-subtext">Installation scope: <code className="text-cyan-500">project</code>, <code className="text-cyan-500">user</code>, or <code className="text-cyan-500">local</code> (gitignored)</td>
                <td className="px-4 py-2 text-text-dim text-xs">Prompted</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-text whitespace-nowrap">-m, --method &lt;method&gt;</td>
                <td className="px-4 py-2 text-subtext">Installation method: <code className="text-cyan-500">symlink</code> or <code className="text-cyan-500">copy</code></td>
                <td className="px-4 py-2 text-text-dim text-xs"><code className="text-cyan-500">copy</code> (single tool)<br />prompted (multiple)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-text whitespace-nowrap">-y, --yes</td>
                <td className="px-4 py-2 text-subtext">Skip confirmation prompts (non-interactive)</td>
                <td className="px-4 py-2 text-text-dim text-xs">Off</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-text whitespace-nowrap">-f, --force</td>
                <td className="px-4 py-2 text-subtext">Overwrite existing files</td>
                <td className="px-4 py-2 text-text-dim text-xs">Off</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-text whitespace-nowrap">-n, --dry-run</td>
                <td className="px-4 py-2 text-subtext">Show what would be installed without making changes</td>
                <td className="px-4 py-2 text-text-dim text-xs">Off</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Example commands */}
      <div>
        <h2 className="text-xs font-medium text-text-dim uppercase tracking-wider mb-3">Examples</h2>

        <div className="space-y-4">
          <CodeBlock
            label="Install for all compatible tools"
            code={`npx @toolr/seedr add ${item.slug} --type ${item.type} --agents all --method symlink`}
          />
          <CodeBlock
            label="Install for specific tool"
            code={`npx @toolr/seedr add ${item.slug} --type ${item.type} --agents claude`}
          />
          <CodeBlock
            label="Non-interactive (CI/scripts)"
            code={`npx @toolr/seedr add ${item.slug} --type ${item.type} --agents all --scope project --method symlink --yes`}
          />
        </div>
      </div>
    </div>
  );
}
