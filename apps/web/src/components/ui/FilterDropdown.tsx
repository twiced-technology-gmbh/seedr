import { useState, useRef, useEffect, type ReactNode } from "react";
import { Filter, ChevronDown, X, Check } from "lucide-react";
import { Tooltip } from "./Tooltip";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const isFiltered = value !== null;
  const selectedOption = options.find((o) => o.value === value);

  const dropdownButton = (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={`h-[26px] px-3 py-1 bg-gray-900 border border-gray-700 text-xs
        focus:outline-none focus:border-blue-500 hover:border-gray-600
        transition-colors flex items-center gap-2 justify-between cursor-pointer
        ${isFiltered ? "rounded-l-lg border-r-0" : "rounded-lg"}`}
      style={{ minWidth }}
    >
      <span className={`flex items-center gap-2 ${isFiltered ? "text-white" : "text-gray-500"}`}>
        {isFiltered ? (
          <>
            <Filter className="w-3 h-3 text-blue-400 fill-blue-400" />
            {selectedOption?.icon}
            <span className="truncate">{selectedOption?.label}</span>
          </>
        ) : (
          <>
            <Filter className="w-3 h-3" />
            {placeholder}
          </>
        )}
      </span>
      <ChevronDown
        className={`w-3.5 h-3.5 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
  );

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      {dropdownButton}

      {/* Clear button - only when filtered */}
      {isFiltered && (
        <Tooltip
          content={{ title: "Clear Filter", description: `Reset ${placeholder.toLowerCase()} to All` }}
          position="top"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="flex items-center justify-center w-[22px] h-[26px]
              bg-gray-900 border border-gray-700 rounded-r-lg
              text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/50
              transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </Tooltip>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 z-10 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
          style={{ minWidth }}
        >
          {/* All option */}
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
            className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-700
              transition-colors flex items-center justify-between cursor-pointer
              ${value === null ? "bg-gray-700/50" : ""}`}
          >
            <span className="text-white">{allLabel || `All ${placeholder}s`}</span>
            {value === null && <Check className="w-3.5 h-3.5 text-blue-400" />}
          </button>

          {/* Options */}
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-700
                transition-colors flex items-center justify-between cursor-pointer
                ${value === option.value ? "bg-gray-700/50" : ""}`}
            >
              <span className="flex items-center gap-2 text-white">
                {option.icon}
                {option.label}
              </span>
              {value === option.value && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
