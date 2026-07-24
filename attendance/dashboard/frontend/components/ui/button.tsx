"use client"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

const variants = {
  default: "bg-brand text-white hover:bg-brand/90 shadow-sm",
  destructive: "bg-[#93000a] text-white hover:bg-[#93000a]/90 shadow-sm",
  outline: "border border-[#dfe3e9] bg-white text-[#4c5468] hover:bg-[#f4f6f8]",
  ghost: "text-[#17203a] hover:bg-[#f4f6f8]",
} as const

const sizes = {
  sm: "h-8 px-3 text-xs",
  default: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
} as const

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = "Button"

export { Button }