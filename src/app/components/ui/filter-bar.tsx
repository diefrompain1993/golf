interface FilterBarProps {
  children: React.ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="relative z-40 rounded-lg border border-border bg-white p-4 mb-4 shadow-sm transition-all duration-200">
      {children}
    </div>
  );
}

interface FilterGroupProps {
  columns?: number;
  children: React.ReactNode;
}

export function FilterGroup({ columns = 4, children }: FilterGroupProps) {
  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {children}
    </div>
  );
}
