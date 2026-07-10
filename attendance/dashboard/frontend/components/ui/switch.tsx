"use client"
import { cn } from "@/lib/utils"

type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

function Switch({ checked, onChange, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-brand" : "bg-muted",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block size-4 translate-x-1 transform rounded-full bg-white shadow transition-transform",
          checked && "translate-x-6",
        )}
      />
    </button>
  )
}

export { Switch }