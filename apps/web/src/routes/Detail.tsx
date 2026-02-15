import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { BookOpen, Box, Clock, Package } from "lucide-react";
import { Badge, Breadcrumb, CodeBlock } from "@/components/ui";
import { Tooltip } from "@/components/ui/Tooltip";
import { typeLabelPlural, typeTextColors, extensionLabels } from "@/lib/colors";
import { TypeIcon } from "@/components/TypeIcon";
import { SourceBadge } from "@/components/SourceBadge";
import { ScopeBadge } from "@/components/ScopeBadge";
import { AuthorLink } from "@/components/AuthorLink";
import { CompatibilityBadges } from "@/components/CompatibilityBadges";
import { PluginContents } from "@/components/PluginContents";
import { FileTree } from "@/components/FileTree";
import { getItem, getLongDescription, getFileTree } from "@/lib/registry";
import type { ComponentType, FileTreeNode } from "@/lib/types";

export function Detail() {
  const { type, slug } = useParams<{ type: string; slug: string }>();
  const componentType = type?.replace(/s$/, "") as ComponentType;
  const location = useLocation();
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
        items={[
          {
            label: typeLabelPlural[breadcrumbType],
            href: `/${breadcrumbType}s`,
            icon: <TypeIcon type={breadcrumbType} size={14} className={typeTextColors[breadcrumbType]} />,
          },
          { label: item.name },
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
            <Tooltip content={{ title: "Package", description: "Bundles multiple extensions (skills, hooks, agents, etc.) into a single plugin" }} position="top">
              <Badge color="indigo" size="md" icon={Package}>Package</Badge>
            </Tooltip>
          )}
          {item.pluginType === "wrapper" && (
            <Tooltip content={{ title: "Wrapper", description: `Wraps a single ${item.wrapper} extension as a plugin` }} position="top">
              <Badge color="teal" size="md" icon={Box}>Wrapper</Badge>
            </Tooltip>
          )}
          {item.pluginType === "integration" && (
            <Tooltip content={{ title: "Integration", description: "Integrates an external tool with your AI assistant. Installing adds it to enabledPlugins — the README explains how to set up the tool itself." }} position="top">
              <Badge color="purple" size="md" icon={BookOpen}>Integration</Badge>
            </Tooltip>
          )}
          {item.sourceType === "toolr" && item.targetScope && <ScopeBadge scope={item.targetScope} size="md" />}
        </div>
        {(item.author || item.sourceType === "toolr") && (
          <div className="flex items-center gap-2 text-sm text-subtext mb-8">
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
        <FileTree
          files={fileTree}
          externalUrl={item.externalUrl}
          rootName={item.slug}
          className="mb-8"
        />
      )}

      {/* CLI Reference */}
      <div className="mb-8">
        <h2 className="text-xs font-medium text-text-dim uppercase tracking-wider mb-3">CLI Reference</h2>
        <div className="bg-surface border border-overlay rounded-lg overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[200px]" />
              <col />
              <col className="w-[150px]" />
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
                <td className="px-4 py-2 font-mono text-xs text-accent whitespace-nowrap">-t, --type &lt;type&gt;</td>
                <td className="px-4 py-2 text-subtext">Content type: <code className="text-text-dim">skill</code>, <code className="text-text-dim">agent</code>, <code className="text-text-dim">hook</code>, <code className="text-text-dim">mcp</code>, <code className="text-text-dim">plugin</code>, <code className="text-text-dim">settings</code><br /><span className="text-text-dim text-xs">Only needed when the same slug exists in multiple types</span></td>
                <td className="px-4 py-2 text-text-dim text-xs"><code className="text-text-dim">skill</code></td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-accent whitespace-nowrap">-a, --agents &lt;tools&gt;</td>
                <td className="px-4 py-2 text-subtext">AI tools to install for: <code className="text-text-dim">claude</code>, <code className="text-text-dim">copilot</code>, <code className="text-text-dim">gemini</code>, <code className="text-text-dim">codex</code>, <code className="text-text-dim">opencode</code>, or <code className="text-text-dim">all</code></td>
                <td className="px-4 py-2 text-text-dim text-xs">Prompted</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-accent whitespace-nowrap">-s, --scope &lt;scope&gt;</td>
                <td className="px-4 py-2 text-subtext">Installation scope: <code className="text-text-dim">project</code>, <code className="text-text-dim">user</code>, or <code className="text-text-dim">local</code> (gitignored)</td>
                <td className="px-4 py-2 text-text-dim text-xs">Prompted</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-accent whitespace-nowrap">-m, --method &lt;method&gt;</td>
                <td className="px-4 py-2 text-subtext">Installation method: <code className="text-text-dim">symlink</code> or <code className="text-text-dim">copy</code></td>
                <td className="px-4 py-2 text-text-dim text-xs"><code className="text-text-dim">copy</code> (single tool)<br />prompted (multiple)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-accent whitespace-nowrap">-y, --yes</td>
                <td className="px-4 py-2 text-subtext">Skip confirmation prompts (non-interactive)</td>
                <td className="px-4 py-2 text-text-dim text-xs">Off</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-accent whitespace-nowrap">-f, --force</td>
                <td className="px-4 py-2 text-subtext">Overwrite existing files</td>
                <td className="px-4 py-2 text-text-dim text-xs">Off</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs text-accent whitespace-nowrap">-n, --dry-run</td>
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
