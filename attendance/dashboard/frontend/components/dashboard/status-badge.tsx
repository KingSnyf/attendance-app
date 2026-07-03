import { cn } from "@/lib/utils"

const variantStyles = {
  success: "bg-emerald-100 text-emerald-800",
  danger: "bg-red-100 text-red-800",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-sky-100 text-sky-800",
  brand: "bg-brand/10 text-brand",
}

type BadgeProps = {
  variant?: keyof typeof variantStyles
  children: React.ReactNode
  className?: string
}

function Badge({ variant = "info", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export { Badge }
