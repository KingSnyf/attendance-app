// app/auth/page.tsx
// Page de connexion pour le dashboard

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const ROLES_DASHBOARD = ["admin", "gestionnaire"];

export default function AuthPage() {
  const router = useRouter();
  const { login, register, logout, isLoading, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "test@example.com",
    password: "password123",
    firstName: "",
    lastName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      const result = await login({ email: formData.email, password: formData.password });
      if (result.success) {
        if (ROLES_DASHBOARD.includes(result.user?.role || "")) {
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
      const result = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <Card className="w-full max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Attendance Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Connectez-vous à votre compte" : "Créer un nouveau compte"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              name="email"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <Input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Prénom</label>
                <Input
                  type="text"
                  name="firstName"
                  placeholder="Jean"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <Input
                  type="text"
                  name="lastName"
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Chargement..." : isLogin ? "Se connecter" : "S'inscrire"}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-600 hover:underline"
            disabled={isLoading}
          >
            {isLogin
              ? "Pas de compte? S'inscrire"
              : "Vous avez un compte? Se connecter"}
          </button>
        </div>

        <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700">
          <p className="font-medium mb-1">Identifiants de démo:</p>
          <p>Email: test@example.com</p>
          <p>Mot de passe: password123</p>
        </div>
      </Card>
    </div>
  );
}
