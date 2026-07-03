// app/(dashboard)/error.tsx
// Boundary d'erreur du périmètre dashboard.

"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Card className="mx-auto mt-16 max-w-2xl">
      <h2 className="text-lg font-semibold text-foreground">
        Une erreur est survenue sur cette page
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Button className="mt-5" onClick={() => reset()}>
        Réessayer
      </Button>
    </Card>
  );
}
