"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Camera,
  CalendarDays,
  Clock,
  MapPinned,
  Save,
  Shield,
  User,
  Wifi,
} from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/dashboard/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { ParametresSysteme } from "@/lib/types";

const GeofenceMap = dynamic(
  () =>
    import("@/components/dashboard/geofence-map").then((m) => m.GeofenceMap),
  { ssr: false },
);

const joursSemaine = [
  "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche",
];

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon className="size-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </Card>
  );
}

export default function ParametresPage() {
  const { user, refreshUser } = useAuth();
  const [settings, setSettings] = useState<ParametresSysteme | null>(null);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    nom: "",
    prenom: "",
    email: "",
    photoUrl: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getSettings().then(setSettings);
    if (user)
      setProfile({
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        photoUrl: user.photo_url || "",
      });
  }, [user]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setProfile((p) => ({ ...p, photoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  if (user?.role !== "admin") {
    return (
      <Card>
        <p className="p-6 text-center text-muted-foreground">
          Accès réservé aux administrateurs.
        </p>
      </Card>
    );
  }

  if (!settings) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement des paramètres système…</span>
      </div>
    );
  }

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updated = await api.updateSettings(settings) as ParametresSysteme;
      setSettings(updated);
      toast.success("Paramètres système sauvegardés.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    try {
      await api.updateProfile({
        firstName: profile.prenom,
        lastName: profile.nom,
        email: profile.email,
        photoUrl: profile.photoUrl,
      });
      await refreshUser();
      toast.success("Profil mis à jour.");
    } catch {
      toast.error("Erreur lors de la sauvegarde du profil.");
    }
  };

  const update = <K extends keyof ParametresSysteme>(
    key: K,
    value: ParametresSysteme[K],
  ) => setSettings((prev) => prev && { ...prev, [key]: value });

  return (
    <div className="space-y-6">
      {/* === PROFIL === */}
      <SectionCard icon={User} title="Mon profil">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative shrink-0"
          >
            <Avatar
              nom={`${profile.prenom} ${profile.nom}`}
              src={profile.photoUrl}
              size="xl"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
              <Camera className="size-5 text-white" />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhoto}
            />
          </button>
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <Input
              value={profile.prenom}
              onChange={(e) =>
                setProfile((p) => ({ ...p, prenom: e.target.value }))
              }
              placeholder="Prénom"
            />
            <Input
              value={profile.nom}
              onChange={(e) =>
                setProfile((p) => ({ ...p, nom: e.target.value }))
              }
              placeholder="Nom"
            />
            <Input
              value={profile.email}
              onChange={(e) =>
                setProfile((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="Email"
              className="sm:col-span-2"
            />
          </div>
          <Button onClick={saveProfile}>
            <Save className="size-4" />
            Enregistrer
          </Button>
        </div>
      </SectionCard>

      {/* === RÉSEAU & SÉCURITÉ === */}
      <SectionCard icon={Shield} title="Réseau & sécurité">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              BSSID WiFi
            </label>
            <Input
              value={settings.reseau_bssid}
              onChange={(e) => update("reseau_bssid", e.target.value)}
              placeholder="00:11:22:33:44:55"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Plage IP locale
            </label>
            <Input
              value={settings.plage_ip_locale}
              onChange={(e) => update("plage_ip_locale", e.target.value)}
              placeholder="192.168.1.0/24"
            />
          </div>
        </div>
      </SectionCard>

      {/* === GÉOFENCING === */}
      <SectionCard icon={MapPinned} title="Géofencing">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={settings.geofencing_actif}
                onChange={(e) =>
                  update("geofencing_actif", e.target.checked)
                }
                className="size-4 accent-brand"
              />
              <span className="font-medium">Activer le géofencing</span>
            </label>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Rayon de sécurité (mètres)
              </label>
              <Input
                type="number"
                value={settings.rayon_geofencing_metres}
                onChange={(e) =>
                  update("rayon_geofencing_metres", Number(e.target.value))
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  value={settings.coordonnees_bureau.lat}
                  onChange={(e) =>
                    setSettings(
                      (prev) =>
                        prev && {
                          ...prev,
                          coordonnees_bureau: {
                            ...prev.coordonnees_bureau,
                            lat: Number(e.target.value),
                          },
                        },
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  value={settings.coordonnees_bureau.lng}
                  onChange={(e) =>
                    setSettings(
                      (prev) =>
                        prev && {
                          ...prev,
                          coordonnees_bureau: {
                            ...prev.coordonnees_bureau,
                            lng: Number(e.target.value),
                          },
                        },
                    )
                  }
                />
              </div>
            </div>
          </div>
          <GeofenceMap
            center={settings.coordonnees_bureau}
            radius={settings.rayon_geofencing_metres}
          />
        </div>
      </SectionCard>

      {/* === RÈGLES DE PRÉSENCE === */}
      <SectionCard icon={Clock} title="Règles de présence">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tolérance de retard (minutes)
            </label>
            <Input
              type="number"
              value={settings.tolerance_retard_minutes}
              onChange={(e) =>
                update("tolerance_retard_minutes", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Durée max de pause (minutes)
            </label>
            <Input
              type="number"
              value={settings.duree_pause_max_minutes}
              onChange={(e) =>
                update("duree_pause_max_minutes", Number(e.target.value))
              }
            />
          </div>
        </div>
      </SectionCard>

      {/* === CALENDRIER === */}
      <SectionCard icon={CalendarDays} title="Calendrier">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Jours fériés (un par ligne)
            </label>
            <textarea
              value={settings.jours_feries.join("\n")}
              onChange={(e) =>
                update(
                  "jours_feries",
                  e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              className="min-h-36 w-full resize-none rounded-xl border border-border bg-card p-3 text-sm outline-none transition focus:border-brand focus:ring-1 focus:ring-brand/20"
              placeholder="2026-01-01"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Jours ouvrés
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {joursSemaine.map((jour) => (
                <label
                  key={jour}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm text-foreground transition hover:bg-muted has-[:checked]:border-brand has-[:checked]:bg-brand/5"
                >
                  <input
                    type="checkbox"
                    checked={settings.jours_ouvres.includes(jour)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSettings(
                        (prev) =>
                          prev && {
                            ...prev,
                            jours_ouvres: checked
                              ? [...prev.jours_ouvres, jour]
                              : prev.jours_ouvres.filter((j) => j !== jour),
                          },
                      );
                    }}
                    className="size-4 accent-brand"
                  />
                  <span className="capitalize">{jour}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* === SAUVEGARDE GLOBALE === */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            Paramètres système
          </p>
          <p className="text-xs text-muted-foreground">
            La sauvegarde concerne le réseau, le géofencing, les règles et le
            calendrier.
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <Spinner />
          ) : (
            <Save className="size-4" />
          )}
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </Button>
      </div>
    </div>
  );
}
