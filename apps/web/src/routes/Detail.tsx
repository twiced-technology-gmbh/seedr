import { useParams, Link } from "react-router-dom";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { Breadcrumb, CodeBlock } from "@/components/ui";
import { typeLabelPlural, typeTextColors } from "@/lib/colors";
import { TypeIcon } from "@/components/TypeIcon";
import { SourceBadge } from "@/components/SourceBadge";
import { ScopeBadge } from "@/components/ScopeBadge";
import { AuthorLink } from "@/components/AuthorLink";
import { CompatibilityBadges } from "@/components/CompatibilityBadges";
import { PluginContents } from "@/components/PluginContents";
import { FileTree } from "@/components/FileTree";
import { getItem } from "@/lib/registry";
import type { ComponentType } from "@/lib/types";

export function Detail() {
  const { type, slug } = useParams<{ type: string; slug: string }>();
  const componentType = type?.replace(/s$/, "") as ComponentType;
  useScrollRestoration();

  const item = slug ? getItem(slug) : undefined;

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

  const installCommand = `npx @toolr/seedr add ${item.slug}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            label: typeLabelPlural[componentType],
            href: `/${componentType}s`,
            icon: <TypeIcon type={componentType} size={14} className={typeTextColors[componentType]} />,
          },
          { label: item.name },
        ]}
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-8">
        {(item.sourceType || (item.sourceType === "toolr" && item.recommendedScope)) && (
          <div className="flex items-center gap-2 mb-3">
            {item.sourceType && <SourceBadge source={item.sourceType} size="md" />}
            {item.sourceType === "toolr" && item.recommendedScope && <ScopeBadge scope={item.recommendedScope} size="md" />}
          </div>
        )}
        <h1 className="text-3xl font-bold text-text mb-2">{item.name}</h1>
        {(item.author || item.sourceType === "toolr") && (
          <AuthorLink
            author={item.sourceType === "toolr" ? { name: "TwiceD Technology" } : item.author!}
            className="text-sm mb-8 block"
          />
        )}
        <p className="text-lg text-subtext">{item.description}</p>
        {item.longDescription && (
          <p className="text-sm text-text-dim mt-3">{item.longDescription}</p>
        )}
      </div>

      {/* Install command */}
      <div className="mb-8">
        <CodeBlock code={installCommand} />
      </div>

      {/* Compatibility */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-subtext mb-2">
          Compatible with
        </h2>
        <CompatibilityBadges tools={item.compatibility} size="md" />
      </div>

      {/* Plugin contents (skills, agents, hooks counts) */}
      {item.type === "plugin" && item.contents && (
        <PluginContents contents={item.contents} className="mb-8" />
      )}

      {/* File tree (for any item with source files) */}
      {item.contents?.files && (
        <FileTree
          files={item.contents.files}
          externalUrl={item.externalUrl}
          className="mb-8"
        />
      )}

      {/* Automation commands */}
      <div>
        <h2 className="text-sm font-medium text-subtext mb-3">Automation</h2>

        <div className="space-y-4">
          <CodeBlock
            label="Install for all compatible tools"
            code={`npx @toolr/seedr add ${item.slug} --agents all`}
          />
          <CodeBlock
            label="Install for specific tool"
            code={`npx @toolr/seedr add ${item.slug} --agents claude`}
          />
          <CodeBlock
            label="Non-interactive (CI/scripts)"
            code={`npx @toolr/seedr add ${item.slug} --agents all --scope project --method symlink --yes`}
          />
        </div>
      </div>
    </div>
  );
}
