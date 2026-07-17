// app/auth/page.tsx
// Page de connexion pour le dashboard

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Fingerprint, Mail, Lock, User, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { api, ROLES_AUTHORISES } from "@/lib/api";
import { loginSchema, registerSchema } from "@/lib/schemas";

export default function AuthPage() {
  const router = useRouter();
  const { login, register, logout, isLoading, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (isLogin) {
      const parsed = loginSchema.safeParse({ email: formData.email, password: formData.password });
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        parsed.error.issues.forEach((err) => { fieldErrors[err.path[0] as string] = err.message; });
        setErrors(fieldErrors);
        return;
      }
      const result = await login(parsed.data);
      if (result.success) {
        if (ROLES_AUTHORISES.includes(result.user?.role || "")) {
          toast.success("Connexion réussie!");
          router.push("/dashboard");
        } else {
          toast.error("Accès réservé aux gestionnaires et administrateurs.");
          logout();
        }
      } else {
        toast.error(result.error || "Erreur de connexion");
      }
    } else {
      const parsed = registerSchema.safeParse(formData);
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        parsed.error.issues.forEach((err) => { fieldErrors[err.path[0] as string] = err.message; });
        setErrors(fieldErrors);
        return;
      }
      const result = await register({
        email: parsed.data.email,
        password: parsed.data.password,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        role: "employe",
      });
      if (result.success) {
        toast.success("Compte créé! Vous pouvez vous connecter.");
        setIsLogin(true);
      } else {
        toast.error(result.error || "Erreur d'inscription");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Panneau de marque -- masqué sur mobile */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden gradient-sidebar px-14 py-12 text-white lg:flex">
        {/* Grille décorative en fond, façon fiche de pointage perforée */}
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
            <Fingerprint className="size-5" />
          </span>
          <span className="font-heading text-xl font-semibold tracking-tight text-white">
            Attendance
          </span>
        </div>

        <div className="relative space-y-5">
          <span className="stamp-badge inline-block rounded-full border-white/25 px-3 py-1 text-[11px] text-white/70">
            Espace gestionnaire
          </span>
          <h2 className="font-heading text-3xl font-semibold leading-tight text-white text-balance">
            La présence de vos équipes,
            <br />
            au pointage près.
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-white/60">
            Suivi des arrivées, géofencing et anomalies centralisés dans un
            seul tableau de bord.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-white/50">
          <ShieldCheck className="size-4 shrink-0" />
          <span>Accès réservé aux administrateurs et gestionnaires</span>
        </div>
      </div>

      {/* Panneau de formulaire */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo -- visible uniquement sur mobile, le panneau de marque le remplace en desktop */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Fingerprint className="size-5" />
            </span>
            <span className="font-heading text-xl font-semibold tracking-tight text-foreground">
              Attendance
            </span>
          </div>

          <div className="mb-8 space-y-1.5">
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              {isLogin ? "Bon retour" : "Créer un compte"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin
                ? "Connectez-vous pour accéder au tableau de bord."
                : "Renseignez vos informations pour vous inscrire."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Prénom</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      name="firstName"
                      placeholder="Jean"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Nom</label>
                  <Input
                    type="text"
                    name="lastName"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  name="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="pl-9"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Mot de passe</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="pl-9"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
            </div>

            {isLogin && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-brand transition"
              >
                Mot de passe oublié ?
              </button>
            )}

            {error && (
              <div className="rounded-xl border border-danger bg-danger px-4 py-3 text-sm text-danger-foreground">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                "Chargement..."
              ) : (
                <>
                  {isLogin ? "Se connecter" : "S'inscrire"}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-brand transition hover:text-brand-accent disabled:opacity-50"
              disabled={isLoading}
            >
              {isLogin
                ? "Pas de compte ? S'inscrire"
                : "Vous avez un compte ? Se connecter"}
            </button>
          </div>
        </div>
      </div>

      {/* Modale mot de passe oublié */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40" onClick={() => setShowForgotPassword(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-foreground">Mot de passe oublié</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Saisissez votre email pour recevoir un nouveau mot de passe.
            </p>
            <div className="mt-4 space-y-4">
              <Input
                type="email"
                placeholder="votre@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={async () => {
                  if (!forgotEmail.trim()) { toast.error("Email requis"); return; }
                  try {
                    await api.forgotPassword(forgotEmail.trim());
                    toast.success("Un nouveau mot de passe a été envoyé par email.");
                    setShowForgotPassword(false);
                  } catch {
                    toast.error("Erreur lors de la réinitialisation.");
                  }
                }}
              >
                Réinitialiser
              </Button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}