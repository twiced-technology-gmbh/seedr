import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import Fuse from "fuse.js";
import { X } from "lucide-react";
import { SearchInput, FilterDropdown, IconButton } from "@/components/ui";
import type { FilterOption } from "@/components/ui";
import { ItemCard } from "@/components/ItemCard";
import { ToolIcon } from "@/components/ToolIcon";
import { typeIcons } from "@/components/TypeIcon";
import { getAllItems, getTypeCounts } from "@/lib/registry";
import { pluralize } from "@/lib/text";
import type { ComponentType, AITool, SourceType, ScopeType } from "@/lib/types";
import { typeTextColors, toolLabels, sourceLabels, scopeLabels } from "@/lib/colors";

// Type labels for display (plural form)
const typePluralLabels: Record<ComponentType, string> = {
  skill: "Skills",
  hook: "Hooks",
  agent: "Agents",
  plugin: "Plugins",
  command: "Commands",
  settings: "Settings",
  mcp: "MCP Servers",
};

// Only descriptions for types shown on home page
const typeDescriptions: Record<ComponentType, string> = {
  skill: "Reusable prompts and workflows",
  hook: "Event-driven automation",
  agent: "Autonomous task runners",
  plugin: "Extended functionality",
  command: "CLI shortcuts and aliases",
  settings: "Configuration presets",
  mcp: "Model Context Protocol servers",
};

const displayTypes: ComponentType[] = [
  "skill",
  "hook",
  "agent",
  "plugin",
  "command",
  "settings",
  "mcp",
];

const toolOptions: FilterOption<AITool>[] = [
  { value: "claude", label: toolLabels.claude, icon: <ToolIcon tool="claude" size={14} /> },
  { value: "copilot", label: toolLabels.copilot, icon: <ToolIcon tool="copilot" size={14} /> },
  { value: "gemini", label: toolLabels.gemini, icon: <ToolIcon tool="gemini" size={14} /> },
  { value: "codex", label: toolLabels.codex, icon: <ToolIcon tool="codex" size={14} /> },
  { value: "opencode", label: toolLabels.opencode, icon: <ToolIcon tool="opencode" size={14} /> },
];

const sourceOptions: FilterOption<SourceType>[] = [
  { value: "official", label: sourceLabels.official },
  { value: "toolr", label: sourceLabels.toolr },
  { value: "community", label: sourceLabels.community },
];

const scopeOptions: FilterOption<ScopeType>[] = [
  { value: "user", label: scopeLabels.user },
  { value: "project", label: scopeLabels.project },
  { value: "local", label: scopeLabels.local },
];

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  useScrollRestoration();

  // Read state from URL search params
  const query = searchParams.get("q") ?? "";
  const toolFilter = (searchParams.get("tool") as AITool | null);
  const sourceFilter = (searchParams.get("source") as SourceType | null);
  const scopeFilter = (searchParams.get("scope") as ScopeType | null);

  // Update URL params helper
  const updateParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    }
    setSearchParams(newParams, { replace: true });
  };

  const setQuery = (value: string) => {
    // When clearing query, also clear filters
    if (!value) {
      setSearchParams({}, { replace: true });
    } else {
      updateParams({ q: value });
    }
  };
  const setToolFilter = (value: AITool | null) => updateParams({ tool: value });
  const setSourceFilter = (value: SourceType | null) => {
    // Clear scope filter when switching away from toolr
    if (value !== "toolr") {
      updateParams({ source: value, scope: null });
    } else {
      updateParams({ source: value });
    }
  };
  const setScopeFilter = (value: ScopeType | null) => updateParams({ scope: value });

  const allItems = getAllItems();
  const counts = getTypeCounts();

  const fuse = useMemo(
    () =>
      new Fuse(allItems, {
        keys: ["name", "slug", "description"],
        threshold: 0.3,
      }),
    [allItems]
  );

  const searchResults = useMemo(() => {
    if (!query) return null;

    let results = fuse.search(query).map((r) => r.item);

    if (toolFilter) {
      results = results.filter((item) => item.compatibility.includes(toolFilter));
    }

    if (sourceFilter) {
      results = results.filter((item) => (item.sourceType ?? "toolr") === sourceFilter);
    }

    if (scopeFilter) {
      results = results.filter((item) => (item.targetScope ?? "project") === scopeFilter);
    }

    return results;
  }, [query, toolFilter, sourceFilter, scopeFilter, fuse]);

  const hasActiveFilters = toolFilter !== null || sourceFilter !== null || scopeFilter !== null;

  const resetFilters = () => {
    setToolFilter(null);
    setSourceFilter(null);
    setScopeFilter(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <p className="text-lg text-subtext mb-8">
          Seed your projects with AI configurations
        </p>

        <SearchInput
          placeholder="Search skills, hooks, agents, MCP servers..."
          className="max-w-md mx-auto"
          value={query}
          onSearch={setQuery}
        />
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text">
              {searchResults.length} {pluralize("result", searchResults.length)}{" "}
              for "{query}"
            </h2>

            <div className="flex items-center gap-2">
              <FilterDropdown
                value={sourceFilter}
                options={sourceOptions}
                onChange={setSourceFilter}
                placeholder="Source"
                minWidth={120}
              />

              {sourceFilter === "toolr" && (
                <FilterDropdown
                  value={scopeFilter}
                  options={scopeOptions}
                  onChange={setScopeFilter}
                  placeholder="Scope"
                  minWidth={170}
                />
              )}

              <FilterDropdown
                value={toolFilter}
                options={toolOptions}
                onChange={setToolFilter}
                placeholder="Tool"
                minWidth={140}
              />

              {hasActiveFilters && (
                <IconButton
                  icon={<X className="w-full h-full" />}
                  variant="danger"
                  size="sm"
                  tooltip={{ title: "Clear Filters", description: "Reset all filters" }}
                  onClick={resetFilters}
                />
              )}
            </div>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((item) => (
                <ItemCard key={`${item.slug}-${item.type}-${item.pluginType ?? ""}`} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-subtext">No items found</p>
          )}
        </div>
      )}

      {/* Type Cards */}
      {!searchResults && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayTypes.map((type) => {
              const Icon = typeIcons[type];
              return (
                <Link
                  key={type}
                  to={`/${type}s`}
                  className="bg-surface border border-overlay rounded-xl p-6 text-center hover:border-overlay-hover hover:bg-active transition-all group"
                >
                  <Icon className={`w-8 h-8 mx-auto mb-3 ${typeTextColors[type]} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  <div className="text-2xl font-bold text-text mb-1">
                    {counts[type]}
                  </div>
                  <div className="text-sm text-text mb-2">{typePluralLabels[type]}</div>
                  <div className="text-xs text-subtext">{typeDescriptions[type]}</div>
                </Link>
              );
            })}
          </div>

          {/* Curation notice */}
          <div className="mt-12 text-center text-sm text-text-dim max-w-2xl mx-auto">
            <p>
              Quality over quantity. One well-crafted configuration beats a thousand mediocre ones.
              We only include official configurations, Toolr Suite creations, and carefully
              vetted community contributions.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
