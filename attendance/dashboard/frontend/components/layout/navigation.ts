import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  FileEdit,
  ClipboardList,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  roles?: ("admin" | "gestionnaire" | "employe")[]
}

export const navigation: NavItem[] = [
  { label: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "gestionnaire"] },
  { label: "Employés", href: "/dashboard/employes", icon: Users, roles: ["admin", "gestionnaire"] },
  { label: "Anomalies", href: "/dashboard/anomalies", icon: AlertTriangle, roles: ["admin", "gestionnaire"] },
  { label: "Modifications", href: "/dashboard/modifications", icon: FileEdit, roles: ["admin", "gestionnaire"] },
  { label: "Logs", href: "/dashboard/logs", icon: ClipboardList, roles: ["admin"] },
  { label: "Paramètres", href: "/dashboard/parametres", icon: Settings, roles: ["admin", "gestionnaire"] },
]
