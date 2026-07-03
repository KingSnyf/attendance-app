// app/(dashboard)/layout.tsx
// Layout partagé par toutes les routes du tableau de bord administrateur.

import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
