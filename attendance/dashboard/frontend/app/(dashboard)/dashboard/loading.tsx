import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
      <Spinner />
      <span>Chargement...</span>
    </div>
  )
}
