import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-[#e1e5eb] bg-white shadow-[0_2px_10px_rgba(31,42,68,.04)]", className)}
      {...props}
    />
  )
}

export { Card }