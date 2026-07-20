import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex flex-col items-center gap-2">
        <span className="text-6xl font-bold text-muted-foreground/30">404</span>
        <h1 className="text-xl font-semibold text-foreground">Page introuvable</h1>
        <p className="text-sm text-muted-foreground">La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}
