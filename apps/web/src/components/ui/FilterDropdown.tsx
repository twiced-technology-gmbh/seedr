import { useState, useRef, useEffect, type ReactNode } from "react";
import { Filter, ChevronDown, X, Check, Search } from "lucide-react";
import { Tooltip } from "./Tooltip";

const SEARCH_THRESHOLD = 20;

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface FilterDropdownProps<T extends string> {
  value: T | null;
  options: FilterOption<T>[];
  onChange: (value: T | null) => void;
  placeholder: string;
  allLabel?: string;
  minWidth?: number;
}

export function FilterDropdown<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  allLabel,
  minWidth = 130,
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const showSearch = options.length > SEARCH_THRESHOLD;

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) { setSearch(""); setHighlightIdx(-1); }
    else if (showSearch) requestAnimationFrame(() => searchRef.current?.focus());
  }, [isOpen, showSearch]);

  useEffect(() => { setHighlightIdx(-1); }, [search]);

  useEffect(() => {
    if (highlightIdx >= 0 && menuRef.current) {
      menuRef.current.querySelector<HTMLElement>(`[data-idx="${highlightIdx}"]`)?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx]);

  const isFiltered = value !== null;
  const selectedOption = options.find((o) => o.value === value);
  const filtered = showSearch && search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const hasAllOption = !search;
  const itemCount = filtered.length + (hasAllOption ? 1 : 0);

  const handleSelect = (val: T | null) => { onChange(val); setIsOpen(false); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, itemCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      const offset = hasAllOption ? 1 : 0;
      handleSelect(hasAllOption && highlightIdx === 0 ? null : filtered[highlightIdx - offset]?.value ?? null);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative flex items-center" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 h-7 px-2 bg-gray-800 border text-xs transition-colors cursor-pointer ${
          isFiltered
            ? "rounded-l-md border-r-0 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500"
            : isOpen
              ? "rounded-md border-gray-500 bg-gray-700 text-white"
              : "rounded-md border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500 hover:text-white"
        }`}
        style={{ minWidth }}
      >
        <Filter className={`w-3 h-3 ${isFiltered ? "text-blue-400" : ""}`} />
        {isFiltered && selectedOption?.icon}
        <span className="whitespace-nowrap truncate">{isFiltered ? selectedOption?.label : (allLabel || placeholder)}</span>
        <ChevronDown className={`w-3 h-3 ml-auto transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Clear button */}
      {isFiltered && (
        <Tooltip
          content={{ title: "Clear Filter", description: `Reset ${placeholder.toLowerCase()} to All` }}
          position="top"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="flex items-center justify-center h-7 px-1.5 rounded-r-md border border-l-0 border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:border-gray-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </Tooltip>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 z-10 mt-1 min-w-[140px] whitespace-nowrap bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
          style={{ minWidth }}
        >
          {showSearch && (
            <div className="sticky top-0 p-1.5 bg-gray-800 border-b border-gray-700 z-10">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  className="w-full pl-6 pr-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-gray-300 placeholder-gray-500 outline-none focus:border-gray-600"
                />
              </div>
            </div>
          )}
          {/* All option */}
          {hasAllOption && (
            <button
              type="button"
              data-idx={0}
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                highlightIdx === 0
                  ? "bg-gray-700 text-white"
                  : !isFiltered ? "bg-blue-600/20 text-white" : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <Check className={`w-3 h-3 shrink-0 ${!isFiltered ? "text-blue-400" : "invisible"}`} />
              <span>All</span>
            </button>
          )}
          {/* Options */}
          {filtered.map((option, i) => {
            const idx = i + (hasAllOption ? 1 : 0);
            const isHighlighted = highlightIdx === idx;
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                data-idx={idx}
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                  isHighlighted
                    ? "bg-gray-700 text-white"
                    : isSelected ? "bg-blue-600/20 text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                <Check className={`w-3 h-3 shrink-0 ${isSelected ? "text-blue-400" : "invisible"}`} />
                {option.icon}
                <span>{option.label}</span>
              </button>
            );
          })}
          {showSearch && search && filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}
