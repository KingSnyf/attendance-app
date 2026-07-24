import { cn } from "@/lib/utils"
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react"

function TableWrapper({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("overflow-x-auto rounded-lg border border-border", className)} {...props} />
}

function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn(
        "w-full border-collapse text-sm",
        // S'applique aux lignes existantes sans avoir à retoucher chaque page
        "[&_tbody_tr]:border-t [&_tbody_tr]:border-border [&_tbody_tr]:transition-colors",
        "[&_tbody_tr:hover]:bg-muted/40",
        className,
      )}
      {...props}
    />
  )
}

function TableHeadCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "font-data whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

// Optionnelle : les pages existantes utilisent encore <td> brut, ce composant
// est disponible pour les nouvelles tables sans rien casser.
function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-4 align-middle", className)} {...props} />
}

export { TableWrapper, Table, TableHeadCell, TableCell }