import { useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import Fuse from "fuse.js";
import { X } from "lucide-react";
import { Breadcrumb, SearchInput, FilterDropdown, IconButton } from "@/components/ui";
import type { FilterOption } from "@/components/ui";
import { SortDropdown } from "@/components/ui/SortDropdown";
import type { SortOption } from "@/components/ui/SortDropdown";
import { ItemCard } from "@/components/ItemCard";
import { ToolIcon } from "@/components/ToolIcon";
import { TypeIcon } from "@/components/TypeIcon";
import { getItemsByType } from "@/lib/registry";
import { pluralize } from "@/lib/text";
import type { ComponentType, AITool, SourceType, ScopeType, RegistryItem } from "@/lib/types";
import { toolLabels, sourceLabels, scopeLabels, typeLabelPlural, typeTextColors } from "@/lib/colors";

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

type SortValue = "name-asc" | "name-desc" | "updated-desc" | "updated-asc";

const sortOptions: SortOption<SortValue>[] = [
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "updated-desc", label: "Updated ↓" },
  { value: "updated-asc", label: "Updated ↑" },
];

function sortItems(items: RegistryItem[], sort: SortValue): RegistryItem[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "updated-desc":
        return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      case "updated-asc":
        return (a.updatedAt ?? "").localeCompare(b.updatedAt ?? "");
      default:
        return 0;
    }
  });
}

export function Browse() {
  const { type } = useParams<{ type: string }>();
  const componentType = type?.replace(/s$/, "") as ComponentType;
  const [searchParams, setSearchParams] = useSearchParams();
  useScrollRestoration();

  // Read state from URL search params
  const query = searchParams.get("q") ?? "";
  const toolFilter = (searchParams.get("tool") as AITool | null);
  const sourceFilter = (searchParams.get("source") as SourceType | null);
  const scopeFilter = (searchParams.get("scope") as ScopeType | null);
  const sort = (searchParams.get("sort") as SortValue) ?? "name-asc";

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

  const setQuery = (value: string) => updateParams({ q: value || null });
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
  const setSort = (value: SortValue) => updateParams({ sort: value === "name-asc" ? null : value });

  const items = getItemsByType(componentType);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["name", "slug", "description"],
        threshold: 0.3,
      }),
    [items]
  );

  const filteredItems = useMemo(() => {
    let result = items;

    if (query) {
      result = fuse.search(query).map((r) => r.item);
    }

    if (toolFilter) {
      result = result.filter((item) => item.compatibility.includes(toolFilter));
    }

    if (sourceFilter) {
      result = result.filter((item) => (item.sourceType ?? "toolr") === sourceFilter);
    }

    if (scopeFilter) {
      result = result.filter((item) => (item.recommendedScope ?? "project") === scopeFilter);
    }

    return sortItems(result, sort);
  }, [items, query, toolFilter, sourceFilter, scopeFilter, sort, fuse]);

  // Check if any filters are active
  const hasActiveFilters = query !== "" || toolFilter !== null || sourceFilter !== null || scopeFilter !== null;

  // Reset all filters
  const resetFilters = () => {
    setQuery("");
    setToolFilter(null);
    setSourceFilter(null);
    setScopeFilter(null);
  };

  if (!componentType || !typeLabelPlural[componentType]) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-subtext">Invalid type</p>
        <Link to="/" className="text-accent hover:underline mt-4 inline-block">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[{
          label: typeLabelPlural[componentType],
          icon: <TypeIcon type={componentType} size={14} className={typeTextColors[componentType]} />,
        }]}
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">
          {typeLabelPlural[componentType]}
        </h1>
        <p className="text-subtext">
          {filteredItems.length} {pluralize(componentType, filteredItems.length)} available
          {hasActiveFilters && items.length !== filteredItems.length && (
            <span className="text-text-dim"> (filtered from {items.length})</span>
          )}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {/* Search input */}
        <SearchInput
          placeholder={`Search ${typeLabelPlural[componentType].toLowerCase()}...`}
          className="w-80"
          size="sm"
          value={query}
          onSearch={setQuery}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Filter dropdowns */}
        <FilterDropdown
          value={sourceFilter}
          options={sourceOptions}
          onChange={setSourceFilter}
          placeholder="Source"
          allLabel="All Sources"
          minWidth={120}
        />

        {sourceFilter === "toolr" && (
          <FilterDropdown
            value={scopeFilter}
            options={scopeOptions}
            onChange={setScopeFilter}
            placeholder="Scope recommendation"
            allLabel="All Scopes"
            minWidth={170}
          />
        )}

        <FilterDropdown
          value={toolFilter}
          options={toolOptions}
          onChange={setToolFilter}
          placeholder="Tool"
          allLabel="All Tools"
          minWidth={140}
        />

        <SortDropdown
          value={sort}
          options={sortOptions}
          onChange={setSort}
          minWidth={110}
        />

        {/* Reset filters - only show when filters are active */}
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

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <ItemCard key={item.slug} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-subtext text-center py-12">
          No {typeLabelPlural[componentType].toLowerCase()} found
        </p>
      )}
    </div>
  );
}
