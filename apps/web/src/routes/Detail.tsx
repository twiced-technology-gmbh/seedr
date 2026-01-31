import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Breadcrumb, CodeBlock } from "@/components/ui";
import { typeLabelPlural } from "@/lib/colors";
import { TypeBadge } from "@/components/TypeBadge";
import { SourceBadge } from "@/components/SourceBadge";
import { AuthorLink } from "@/components/AuthorLink";
import { CompatibilityBadges } from "@/components/CompatibilityBadges";
import { getItem } from "@/lib/registry";
import type { ComponentType } from "@/lib/types";

export function Detail() {
  const { type, slug } = useParams<{ type: string; slug: string }>();
  const componentType = type?.replace(/s$/, "") as ComponentType;

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
          { label: typeLabelPlural[componentType], href: `/${componentType}s` },
          { label: item.name },
        ]}
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <TypeBadge type={item.type} size="md" />
          {item.sourceType && <SourceBadge source={item.sourceType} size="md" />}
        </div>
        <h1 className="text-3xl font-bold text-text mb-2">{item.name}</h1>
        {item.author && <AuthorLink author={item.author} className="text-sm mb-2 block" />}
        <p className="text-lg text-subtext">{item.description}</p>
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

      {/* Long description */}
      {item.longDescription && (
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {item.longDescription}
          </ReactMarkdown>
        </div>
      )}

      {/* Divider */}
      <hr className="border-overlay my-8" />

      {/* Usage */}
      <div>
        <h2 className="text-xl font-semibold text-text mb-4">Usage</h2>

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
