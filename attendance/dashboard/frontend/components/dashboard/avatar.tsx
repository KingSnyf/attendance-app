import { cn } from "@/lib/utils"

type AvatarProps = {
  nom: string
  src?: string | null
  size?: "sm" | "xl"
}

function Avatar({ nom, src, size = "sm" }: AvatarProps) {
  const initials = nom
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-medium text-brand",
        size === "sm" && "size-9",
        size === "xl" && "size-16 text-lg",
      )}
    >
      {src ? (
        <img src={src} alt={nom} className="size-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}

export { Avatar }
