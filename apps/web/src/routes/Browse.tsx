import { useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { useUpdateParams } from "@/hooks/useUpdateParams";
import Fuse from "fuse.js";
import { Breadcrumb, Input, FilterDropdown, SortDropdown } from "@toolr/ui-design";
import type { SortField } from "@toolr/ui-design";
import { ItemCard } from "@/components/ItemCard";
import { getItemsByType, fuseOptions } from "@/lib/registry";
import { pluralize } from "@/lib/text";
import type { ComponentType, AITool, SourceType, ScopeType, PluginType, RegistryItem } from "@/lib/types";
import { typeLabelPlural, typeBreadcrumbIcon, typeBreadcrumbColor } from "@/lib/colors";

import { toolOptions, sourceOptions, scopeOptions } from "@/lib/filterOptions";

const pluginTypeOptions = [
  { value: "package", label: "Package" },
  { value: "wrapper", label: "Wrapper" },
  { value: "integration", label: "Integration" },
];

type ItemKind = "native" | "wrapper";
const kindOptions = [
  { value: "native", label: "Native" },
  { value: "wrapper", label: "Wrapper" },
];

type ExtensionType = "skill" | "hook" | "agent" | "command" | "mcp";
const extensionOptions = [
  { value: "skill", label: "Skill" },
  { value: "hook", label: "Hook" },
  { value: "agent", label: "Agent" },
  { value: "command", label: "Command" },
  { value: "mcp", label: "MCP Server" },
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
  const { searchParams, updateParams } = useUpdateParams();
  const navigate = useNavigate();
  useScrollRestoration();

  const isPlugins = componentType === "plugin";

  // Read state from URL search params
  const query = searchParams.get("q") ?? "";
  const toolFilter = (searchParams.get("tool") as AITool | null);
  const sourceFilter = (searchParams.get("source") as SourceType | null);
  const scopeFilter = (searchParams.get("scope") as ScopeType | null);
  const pluginTypeFilter = (searchParams.get("pluginType") as PluginType | null);
  const extFilter = (searchParams.get("ext") as ExtensionType | null);
  const kindFilter = (searchParams.get("kind") as ItemKind | null);
  const sortField = searchParams.get("sortField") ?? "name";
  const sortAsc = searchParams.get("sortAsc") !== "false";

  const toParam = (value: string) => (value && value !== "all") ? value : null;
  const setQuery = (value: string) => updateParams({ q: value || null });
  const setToolFilter = (value: string) => updateParams({ tool: toParam(value) });
  const setSourceFilter = (value: string) => {
    // Clear scope filter when switching away from toolr
    if (value !== "toolr") {
      updateParams({ source: toParam(value), scope: null });
    } else {
      updateParams({ source: value });
    }
  };
  const setScopeFilter = (value: string) => updateParams({ scope: toParam(value) });
  const setPluginTypeFilter = (value: string) => {
    // Extension filter only applies to wrappers — clear it when switching away
    if (value !== "wrapper") {
      updateParams({ pluginType: toParam(value), ext: null });
    } else {
      updateParams({ pluginType: value });
    }
  };
  const setExtFilter = (value: string) => updateParams({ ext: toParam(value) });
  const setKindFilter = (value: string) => updateParams({ kind: toParam(value) });
  const setSortField = (value: string) => updateParams({ sortField: value === "name" ? null : value });
  const toggleSortDir = () => updateParams({ sortAsc: sortAsc ? "false" : null });

  const items = useMemo(() => getItemsByType(componentType), [componentType]);
  const hasWrappers = !isPlugins && items.some(
    (item) => item.type === "plugin" && item.pluginType === "wrapper"
  );

  const fuse = useMemo(() => new Fuse(items, fuseOptions), [items]);

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

    if (kindFilter && !isPlugins) {
      if (kindFilter === "native") {
        result = result.filter((item) => item.type === componentType);
      } else if (kindFilter === "wrapper") {
        result = result.filter((item) => item.type === "plugin" && item.pluginType === "wrapper");
      }
    }

    return sortItems(result, sortField, sortAsc);
  }, [items, query, toolFilter, sourceFilter, scopeFilter, pluginTypeFilter, extFilter, kindFilter, sortField, sortAsc, fuse, isPlugins, componentType]);

  // Check if any filters are active
  const hasActiveFilters = query !== "" || toolFilter !== null || sourceFilter !== null || scopeFilter !== null || pluginTypeFilter !== null || extFilter !== null || kindFilter !== null;

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
            id: componentType,
            label: typeLabelPlural[componentType],
            icon: typeBreadcrumbIcon[componentType],
            color: typeBreadcrumbColor[componentType],
          },
        ]}
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-lg font-bold text-text mb-2">
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
      <div className="flex items-center gap-2 mb-8">
        {/* Search input */}
        <div className="w-80">
          <Input
            type="search"
            placeholder={`Search ${typeLabelPlural[componentType].toLowerCase()}...`}
            size="sm"
            value={query}
            onChange={setQuery}
            color="cyan"
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Kind filter for extension pages with wrappers */}
        {hasWrappers && (
          <FilterDropdown
            value={kindFilter ?? "all"}
            options={kindOptions}
            onChange={setKindFilter}
            allLabel="Kind"
            color="cyan"
          />
        )}

        {/* Plugin-specific filter dropdowns */}
        {isPlugins && (
          <FilterDropdown
            value={pluginTypeFilter ?? "all"}
            options={pluginTypeOptions}
            onChange={setPluginTypeFilter}
            allLabel="Type"
            color="cyan"
          />
        )}

        {isPlugins && pluginTypeFilter === "wrapper" && (
          <FilterDropdown
            value={extFilter ?? "all"}
            options={extensionOptions}
            onChange={setExtFilter}
            allLabel="Extension"
            color="cyan"
          />
        )}

        {/* Filter dropdowns */}
        <FilterDropdown
          value={sourceFilter ?? "all"}
          options={sourceOptions}
          onChange={setSourceFilter}
          allLabel="Source"
          color="cyan"
        />

        {sourceFilter === "toolr" && (
          <FilterDropdown
            value={scopeFilter ?? "all"}
            options={scopeOptions}
            onChange={setScopeFilter}
            allLabel="Scope"
            color="cyan"
          />
        )}

        <FilterDropdown
          value={toolFilter ?? "all"}
          options={toolOptions}
          onChange={setToolFilter}
          allLabel="Tool"
          color="cyan"
        />

        <SortDropdown
          field={sortField}
          ascending={sortAsc}
          onFieldChange={setSortField}
          onToggleDirection={toggleSortDir}
          fields={sortFields}
          color="cyan"
        />
      </div>

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <ItemCard
              key={`${item.slug}-${item.type}-${item.pluginType ?? ""}`}
              item={item}
              browseType={componentType}
              onSourceClick={(source) => setSourceFilter(source)}
              onScopeClick={(scope) => setScopeFilter(scope)}
              onToolClick={(tool) => setToolFilter(tool)}
              onPluginTypeClick={isPlugins ? (pt) => setPluginTypeFilter(pt) : undefined}
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
