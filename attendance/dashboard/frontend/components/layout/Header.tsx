"use client"
import { usePathname } from "next/navigation"
import { navigation } from "@/components/layout/navigation"

function Header() {
  const pathname = usePathname()
  const current = navigation.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  )

  return (
    <header className="flex h-16 items-center border-b border-border bg-card px-6">
      <h1 className="text-lg font-semibold text-foreground">
        {current?.label ?? "Tableau de bord"}
      </h1>
    </header>
  )
}

export { Header }
