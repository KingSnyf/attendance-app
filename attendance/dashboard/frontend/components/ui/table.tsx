import { cn } from "@/lib/utils"
import type { HTMLAttributes, ThHTMLAttributes } from "react"

function TableWrapper({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("overflow-x-auto rounded-xl border border-border", className)} {...props} />
}

function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full text-sm", className)} {...props} />
}

function TableHeadCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground", className)}
      {...props}
    />
  )
}

export { TableWrapper, Table, TableHeadCell }
