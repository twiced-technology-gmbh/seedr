import { useState, useRef, useEffect } from "react";
import { ArrowUp, ArrowDown, ChevronDown, Check } from "lucide-react";

export interface SortField {
  value: string;
  label: string;
}

interface SortDropdownProps {
  field: string;
  ascending: boolean;
  onFieldChange: (field: string) => void;
  onToggleDirection: () => void;
  fields: SortField[];
  minWidth?: number;
}

export function SortDropdown({
  field,
  ascending,
  onFieldChange,
  onToggleDirection,
  fields,
  minWidth = 120,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
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

  useEffect(() => {
    if (isOpen) setHighlightIdx(fields.findIndex((f) => f.value === field));
  }, [isOpen, fields, field]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, fields.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      onFieldChange(fields[highlightIdx].value);
      setIsOpen(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const current = fields.find((f) => f.value === field) ?? fields[0];
  const DirIcon = ascending ? ArrowUp : ArrowDown;

  return (
    <div className="relative flex items-center" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-7 px-2 rounded-md border bg-gray-800 text-xs transition-colors cursor-pointer border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500"
        style={{ minWidth }}
      >
        <span
          className="text-blue-400 hover:text-blue-300 transition-colors"
          onClick={(e) => { e.stopPropagation(); onToggleDirection(); }}
          role="button"
        >
          <DirIcon className="w-3 h-3" />
        </span>
        <span className="whitespace-nowrap">{current.label}</span>
        <ChevronDown className={`w-3 h-3 ml-auto transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 z-10 mt-1 min-w-[140px] bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
          style={{ minWidth }}
        >
          {fields.map((f, idx) => (
            <button
              key={f.value}
              type="button"
              onClick={() => { onFieldChange(f.value); setIsOpen(false); }}
              onPointerEnter={() => setHighlightIdx(idx)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                idx === highlightIdx ? "bg-blue-600/20 text-white" : field === f.value ? "bg-blue-600/10 text-white" : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <Check className={`w-3 h-3 shrink-0 ${field === f.value ? "text-blue-400" : "invisible"}`} />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
