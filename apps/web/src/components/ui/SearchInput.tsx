import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  onSearch?: (value: string) => void;
  size?: "sm" | "md";
}

export function SearchInput({
  className = "",
  onSearch,
  onChange,
  size = "md",
  ...props
}: SearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onSearch?.(e.target.value);
  };

  const sizeClasses = {
    sm: "h-[26px] pl-8 pr-3 text-xs",
    md: "h-[32px] pl-10 pr-4 text-sm",
  };

  const iconSizeClasses = {
    sm: "w-3.5 h-3.5 left-2.5",
    md: "w-4 h-4 left-3",
  };

  return (
    <div className={`relative ${className}`}>
      <Search
        className={`absolute top-1/2 -translate-y-1/2 text-text-dim ${iconSizeClasses[size]}`}
      />
      <input
        type="search"
        className={`w-full rounded-lg bg-gray-900 border border-gray-700 text-text placeholder:text-text-dim focus:outline-hidden focus:border-blue-500 transition-colors ${sizeClasses[size]}`}
        onChange={handleChange}
        {...props}
      />
    </div>
  );
}
