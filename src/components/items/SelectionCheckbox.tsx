"use client";

/**
 * Selection Checkbox with Order Badge
 * Shows checkbox + order number badge when selected
 */

import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "~/lib/utils";

interface SelectionCheckboxProps {
  selected: boolean;
  order?: number; // 1-indexed order number when selected
  onSelect: (selected: boolean) => void;
  indeterminate?: boolean; // For header checkbox with partial selection
  className?: string;
}

export function SelectionCheckbox({
  selected,
  order,
  onSelect,
  indeterminate,
  className,
}: SelectionCheckboxProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} onClick={(e) => e.stopPropagation()}>
      <Checkbox
        checked={indeterminate ? "indeterminate" : selected}
        onCheckedChange={(checked) => onSelect(checked === true)}
      />
      {selected && order !== undefined && (
        <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {order}
        </span>
      )}
    </div>
  );
}
