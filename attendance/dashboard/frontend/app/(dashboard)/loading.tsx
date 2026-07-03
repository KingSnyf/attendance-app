// app/(dashboard)/loading.tsx
// État de chargement global du périmètre dashboard.

import { Spinner } from "@/components/ui/spinner";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement du tableau de bord...</span>
      </div>
    </div>
  );
}
