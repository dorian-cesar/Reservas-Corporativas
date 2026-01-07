"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
