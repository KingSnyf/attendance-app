import { cn } from "@/lib/utils"

const variantStyles = {
  success: "bg-success-foreground/10 text-success-foreground",
  danger: "bg-danger-foreground/10 text-danger-foreground",
  warning: "bg-warning-foreground/10 text-warning-foreground",
  info: "bg-signal/10 text-signal",
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
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export { Badge }