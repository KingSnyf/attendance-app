"use client"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-md border border-[#dfe3e9] bg-white px-3 text-[11px] text-[#17203a] outline-none placeholder:text-[#8a91a3] focus:border-[#5363dc] disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = "Input"

export { Input }