import { useState, useRef, useEffect } from "react";
import { ArrowUpDown, ChevronDown, Check } from "lucide-react";

export interface SortOption<T extends string> {
  value: T;
  label: string;
}

interface SortDropdownProps<T extends string> {
  value: T;
  options: SortOption<T>[];
  onChange: (value: T) => void;
  minWidth?: number;
}

export function SortDropdown<T extends string>({
  value,
  options,
  onChange,
  minWidth = 120,
}: SortDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-[26px] px-3 py-1 bg-gray-900 border border-gray-700 text-xs rounded-lg
          focus:outline-none focus:border-blue-500 hover:border-gray-600
          transition-colors flex items-center gap-2 justify-between cursor-pointer"
        style={{ minWidth }}
      >
        <span className="flex items-center gap-2">
          <ArrowUpDown className="w-3 h-3 text-blue-400" />
          <span className="text-white">{selectedOption?.label}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 z-10 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
          style={{ minWidth }}
        >
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
              <span className="text-white">{option.label}</span>
              {value === option.value && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
