import React from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table, RefreshCcw } from "lucide-react";

type ViewMode = "cards" | "table";

export interface CompanyOption {
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

interface ToolBarProps {
  title: string;
  description?: string;

  // view toggle
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;

  // optional company select (if provided, se muestra)
  showCompanySelect?: boolean;
  companies?: CompanyOption[];            // opciones a mostrar
  selectedCompany?: string;               // id seleccionado
  onCompanyChange?: (id: string) => void; // callback al cambiar

  // optional search input
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  onSearch?: () => void;
  searchPlaceholder?: string;

  // actions
  refreshAction?: () => void;
  primaryAction?: ActionButton;   // ej: Agregar
  secondaryActions?: ActionButton[]; // ← CAMBIO: Ahora es un array (plural)
  secondaryAction?: ActionButton; // ← OPCIONAL: Mantén el singular para compatibilidad

  // layout tweaks
  className?: string;
}

export default function ToolBar({
  title,
  description,
  viewMode,
  setViewMode,

  showCompanySelect = false,
  companies = [],
  selectedCompany,
  onCompanyChange,

  showSearch = false,
  searchValue = "",
  onSearchChange,
  onSearch,
  searchPlaceholder = "Buscar...",

  refreshAction,
  primaryAction,
  secondaryActions = [],
  secondaryAction,

  className = "",
}: ToolBarProps) {
  const allSecondaryActions = secondaryAction
    ? [...secondaryActions, secondaryAction]
    : secondaryActions;

  return (
    <div className={`flex flex-col md:flex-row items-start md:items-center w-full justify-between gap-4 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
        {/* Optional company select */}
        {showCompanySelect && (
          <div className="flex items-center gap-2">
            <select
              value={selectedCompany ?? ""}
              onChange={(e) => onCompanyChange && onCompanyChange(e.target.value)}
              className="p-2 border rounded-md bg-white"
            >
              <option value="">Selecciona una empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.nombre}
                </option>
              ))}
            </select>
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

        {/* Secondary Actions (Múltiples) */}
        {allSecondaryActions.length > 0 && (
          <div className="flex gap-2">
            {allSecondaryActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                className={`${action.className ?? "bg-accent hover:bg-accent/90"} h-8`}
                disabled={action.disabled}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Primary Action */}
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