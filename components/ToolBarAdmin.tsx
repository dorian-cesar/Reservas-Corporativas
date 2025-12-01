// components/ToolBarAdmin.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table, RefreshCcw, Building2 } from "lucide-react";

type ViewMode = "cards" | "table";

export interface CompanyInfo {
  id: string;
  nombre: string;
}

interface ActionButton {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

interface ToolBarAdminProps {
  title: string;
  description?: string;

  // view toggle
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;

  // Company info for admin (read-only)
  companyInfo?: CompanyInfo | null;

  // optional search input
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  onSearch?: () => void;
  searchPlaceholder?: string;

  // actions
  refreshAction?: () => void;
  primaryAction?: ActionButton;   // ej: Agregar
  secondaryAction?: ActionButton; // ej: Exportar

  // layout tweaks
  className?: string;
}

export default function ToolBarAdmin({
  title,
  description,
  viewMode,
  setViewMode,
  companyInfo,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  onSearch,
  searchPlaceholder = "Buscar...",
  refreshAction,
  primaryAction,
  secondaryAction,
  className = "",
}: ToolBarAdminProps) {
  return (
    <div className={`flex flex-col md:flex-row items-start md:items-center w-full justify-between gap-4 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex flex-col">
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
        {/* Company info badge (read-only) */}
        {companyInfo && (
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-primary/5 border-primary/20">
            <Building2 className="h-4 w-4 text-primary" />
            <div className="text-sm">
              <span className="font-medium">{companyInfo.nombre}</span>
            </div>
          </div>
        )}

        {/* Optional search */}
        {showSearch && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch && onSearch()}
              className="px-3 py-2 border rounded-md w-48 sm:w-64"
            />
            <Button onClick={() => onSearch && onSearch()} className="h-8 px-3">
              Buscar
            </Button>
          </div>
        )}

        {/* View toggle */}
        <div className="flex items-center border rounded-lg p-1 bg-muted/50">
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
            className="h-8 px-3"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8 px-3"
          >
            <Table className="h-4 w-4" />
          </Button>
        </div>

        {/* Refresh */}
        {refreshAction && (
          <Button onClick={refreshAction} className="bg-secondary hover:bg-secondary/90 justify-center h-8">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        )}

        {/* Secondary / Primary */}
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            className={`${secondaryAction.className ?? "bg-accent hover:bg-accent/90"} h-8`}
            disabled={secondaryAction.disabled}
          >
            {secondaryAction.icon && <span className="mr-2">{secondaryAction.icon}</span>}
            {secondaryAction.label}
          </Button>
        )}

        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            className={`${primaryAction.className ?? "bg-accent hover:bg-accent/90"} h-8`}
            disabled={primaryAction.disabled}
          >
            {primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>}
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}