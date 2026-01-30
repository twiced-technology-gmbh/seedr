interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function FilterButton({ label, isActive, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`h-[26px] px-2.5 rounded-md text-xs font-medium transition-colors ${
        isActive
          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
          : "bg-surface-alt border border-overlay text-subtext hover:bg-active hover:text-text hover:border-overlay-hover"
      }`}
    >
      {label}
    </button>
  );
}
