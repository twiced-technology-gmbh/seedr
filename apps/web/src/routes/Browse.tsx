import { useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import Fuse from "fuse.js";
import { X } from "lucide-react";
import { Breadcrumb, SearchInput, FilterDropdown, IconButton } from "@/components/ui";
import type { FilterOption } from "@/components/ui";
import { SortDropdown } from "@/components/ui/SortDropdown";
import type { SortField } from "@/components/ui/SortDropdown";
import { ItemCard } from "@/components/ItemCard";
import { ToolIcon } from "@/components/ToolIcon";
import { TypeIcon } from "@/components/TypeIcon";
import { getItemsByType } from "@/lib/registry";
import { pluralize } from "@/lib/text";
import type { ComponentType, AITool, SourceType, ScopeType, PluginType, RegistryItem } from "@/lib/types";
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

const pluginTypeOptions: FilterOption<PluginType>[] = [
  { value: "package", label: "Package" },
  { value: "wrapper", label: "Wrapper" },
  { value: "integration", label: "Integration" },
];

type ExtensionType = "skill" | "hook" | "agent" | "command" | "mcp" | "lsp";
const extensionOptions: FilterOption<ExtensionType>[] = [
  { value: "skill", label: "Skill" },
  { value: "hook", label: "Hook" },
  { value: "agent", label: "Agent" },
  { value: "command", label: "Command" },
  { value: "mcp", label: "MCP Server" },
  { value: "lsp", label: "LSP" },
];

const sortFields: SortField[] = [
  { value: "name", label: "Name" },
  { value: "updated", label: "Updated" },
];

function sortItems(items: RegistryItem[], field: string, ascending: boolean): RegistryItem[] {
  return [...items].sort((a, b) => {
    let cmp: number;
    switch (field) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "updated":
        cmp = (a.updatedAt ?? "").localeCompare(b.updatedAt ?? "");
        break;
      default:
        cmp = 0;
    }
    return ascending ? cmp : -cmp;
  });
}

export function Browse() {
  const { type } = useParams<{ type: string }>();
  const componentType = type?.replace(/s$/, "") as ComponentType;
  const [searchParams, setSearchParams] = useSearchParams();
  useScrollRestoration();

  const isPlugins = componentType === "plugin";

  // Read state from URL search params
  const query = searchParams.get("q") ?? "";
  const toolFilter = (searchParams.get("tool") as AITool | null);
  const sourceFilter = (searchParams.get("source") as SourceType | null);
  const scopeFilter = (searchParams.get("scope") as ScopeType | null);
  const pluginTypeFilter = (searchParams.get("pluginType") as PluginType | null);
  const extFilter = (searchParams.get("ext") as ExtensionType | null);
  const sortField = searchParams.get("sortField") ?? "name";
  const sortAsc = searchParams.get("sortAsc") !== "false";

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
  const setPluginTypeFilter = (value: PluginType | null) => updateParams({ pluginType: value });
  const setExtFilter = (value: ExtensionType | null) => updateParams({ ext: value });
  const setSortField = (value: string) => updateParams({ sortField: value === "name" ? null : value });
  const toggleSortDir = () => updateParams({ sortAsc: sortAsc ? "false" : null });

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
      result = result.filter((item) => (item.targetScope ?? "project") === scopeFilter);
    }

    if (pluginTypeFilter) {
      result = result.filter((item) => (item.pluginType ?? "package") === pluginTypeFilter);
    }

    if (extFilter) {
      result = result.filter((item) => {
        if (item.pluginType === "wrapper") return item.wrapper === extFilter;
        if (item.pluginType === "integration") return item.integration === extFilter;
        if (item.package) return (item.package[extFilter] ?? 0) > 0;
        return false;
      });
    }

    return sortItems(result, sortField, sortAsc);
  }, [items, query, toolFilter, sourceFilter, scopeFilter, pluginTypeFilter, extFilter, sortField, sortAsc, fuse]);

  // Check if any filters are active
  const hasActiveFilters = query !== "" || toolFilter !== null || sourceFilter !== null || scopeFilter !== null || pluginTypeFilter !== null || extFilter !== null;

  // Reset all filters
  const resetFilters = () => {
    setQuery("");
    setToolFilter(null);
    setSourceFilter(null);
    setScopeFilter(null);
    setPluginTypeFilter(null);
    setExtFilter(null);
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

        {/* Plugin-specific filter dropdowns */}
        {isPlugins && (
          <FilterDropdown
            value={pluginTypeFilter}
            options={pluginTypeOptions}
            onChange={setPluginTypeFilter}
            placeholder="Type"
            minWidth={140}
          />
        )}

        {isPlugins && (
          <FilterDropdown
            value={extFilter}
            options={extensionOptions}
            onChange={setExtFilter}
            placeholder="Extension"
            minWidth={140}
          />
        )}

        {/* Filter dropdowns */}
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

        <SortDropdown
          field={sortField}
          ascending={sortAsc}
          onFieldChange={setSortField}
          onToggleDirection={toggleSortDir}
          fields={sortFields}
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
            <ItemCard
              key={item.slug}
              item={item}
              onSourceClick={setSourceFilter}
              onScopeClick={setScopeFilter}
              onToolClick={setToolFilter}
              onDateClick={() => {
                if (sortField === "updated") {
                  toggleSortDir();
                } else {
                  setSortField("updated");
                }
              }}
            />
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
