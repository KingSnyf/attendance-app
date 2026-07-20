// app/auth/reset-password/page.tsx
// Page de réinitialisation de mot de passe

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Lock, Mail, ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/schemas";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    newPassword: "",
    confirmPassword: "",
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Card className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <Lock className="size-12 text-muted-foreground" />
            <h2 className="font-heading text-xl font-semibold text-foreground">Lien invalide</h2>
            <p className="text-sm text-muted-foreground">
              Ce lien de réinitialisation est manquant ou incomplet.
            </p>
            <Button onClick={() => router.push("/auth")} className="w-full max-w-xs mt-2">
              <ArrowLeft className="size-4 mr-2" />
              Retour à la connexion
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = resetPasswordSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword(token, parsed.data.newPassword);
      toast.success("Mot de passe réinitialisé avec succès !");
      router.push("/auth");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la réinitialisation. Le lien a peut-être expiré.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Panneau de marque -- masqué sur mobile */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden gradient-sidebar px-14 py-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, var(--signal) 0%, transparent 70%)" }}
        />

        <div className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
            <Lock className="size-5" />
          </span>
          <span className="font-heading text-xl font-semibold tracking-tight text-white">
            Attendance
          </span>
        </div>

        <div className="relative space-y-5">
          <span className="stamp-badge inline-block rounded-full border-white/25 px-3 py-1 text-[11px] text-white/70">
            Réinitialisation
          </span>
          <h2 className="font-heading text-3xl font-semibold leading-tight text-white text-balance">
            Nouveau mot de passe
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-white/60">
            Choisissez un mot de passe sécurisé pour votre compte.
          </p>
        </div>
      </div>

      {/* Panneau de formulaire */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Lock className="size-5" />
            </span>
            <span className="font-heading text-xl font-semibold tracking-tight text-foreground">
              Attendance
            </span>
          </div>

          <div className="mb-8 space-y-1.5">
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Définir un nouveau mot de passe
            </h1>
            <p className="text-sm text-muted-foreground">
              Votre nouveau mot de passe doit contenir au moins 6 caractères.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="mt-1 text-xs text-destructive">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                "Chargement..."
              ) : (
                <>
                  Valider
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/auth")}
              className="text-sm font-medium text-brand transition hover:text-brand-accent disabled:opacity-50"
              disabled={isLoading}
            >
              <ArrowLeft className="size-4 inline mr-1" />
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}